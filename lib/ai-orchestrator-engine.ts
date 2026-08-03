import { createAiExecutionPolicy, rankAiModelCandidates, rankAiProviderCandidates } from "@/lib/ai-execution-policy";
import { createAiExecutionPlan, createAiOrchestrationError, type AiProviderAvailability } from "@/lib/ai-orchestrator";
import { getProviderHealth, getAllProviderHealth, recordProviderFailure, recordProviderSuccess } from "@/lib/ai-provider-health";
import { calculateProviderConfidence, estimateProviderCost, normalizeTokenUsage } from "@/lib/ai-provider-metrics";
import type { AiProviderId } from "@/lib/ai-provider-adapter";
import type { AiOrchestratorEngineRequest, AiOrchestratorNormalizedResponse, AiProviderExecutionAttempt } from "@/types/ai-orchestrator";

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[key];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function plainPromptText(request: AiOrchestratorEngineRequest) {
  return request.prompt.messages.map((message) => message.content).join("\n\n");
}

function availabilityWithHealth(availableProviders: AiProviderAvailability): AiProviderAvailability {
  const entries = Object.entries(availableProviders).map(([provider, available]) => {
    const health = getProviderHealth(provider as AiProviderId);
    return [provider, available === true && health.status !== "unavailable"] as const;
  });
  return Object.freeze(Object.fromEntries(entries) as AiProviderAvailability);
}

function createRankedProviderOrder(request: AiOrchestratorEngineRequest): readonly AiProviderId[] {
  const policy = createAiExecutionPolicy({
    policyId: request.policyId || request.options?.policyId,
    preferredProvider: request.providerPreference && request.providerPreference !== "auto" ? request.providerPreference : undefined,
    preferredModel: request.modelPreference,
    requiredCapabilities: request.requiredCapabilities,
    optionalCapabilities: request.optionalCapabilities,
    taskIntent: request.prompt.taskIntent
  });
  return rankAiProviderCandidates({
    taskIntent: request.prompt.taskIntent,
    policy,
    availableProviders: availabilityWithHealth(request.availableProviders),
    availableModels: request.availableModels,
    requestedProvider: request.providerPreference && request.providerPreference !== "auto" ? request.providerPreference : undefined,
    requestedModel: request.modelPreference,
    requiredCapabilities: request.requiredCapabilities
  }).map((candidate) => candidate.provider.id);
}

function createModelForProvider(request: AiOrchestratorEngineRequest, provider: AiProviderId) {
  const policy = createAiExecutionPolicy({
    policyId: request.policyId || request.options?.policyId,
    preferredProvider: provider,
    preferredModel: request.modelPreference,
    requiredCapabilities: request.requiredCapabilities,
    optionalCapabilities: request.optionalCapabilities,
    taskIntent: request.prompt.taskIntent
  });
  return rankAiModelCandidates({
    taskIntent: request.prompt.taskIntent,
    policy,
    availableProviders: { [provider]: true },
    availableModels: request.availableModels,
    requestedProvider: provider,
    requestedModel: request.modelPreference,
    requiredCapabilities: request.requiredCapabilities
  }).find((candidate) => candidate.model.provider === provider)?.model.id;
}

function shouldTryProvider(provider: AiProviderId, availableProviders: AiProviderAvailability) {
  if (availableProviders[provider] !== true) return false;
  return getProviderHealth(provider).status !== "unavailable";
}

function failedResponse(attempts: readonly AiProviderExecutionAttempt[], warnings: readonly string[]): AiOrchestratorNormalizedResponse {
  return deepFreeze({
    status: "failed",
    latencyMs: attempts.reduce((sum, attempt) => sum + attempt.latencyMs, 0),
    tokens: {},
    confidence: 0,
    warnings,
    attempts,
    providerStatus: getAllProviderHealth()
  });
}

export function rankProvidersForOrchestration(request: AiOrchestratorEngineRequest): readonly AiProviderId[] {
  return deepFreeze(createRankedProviderOrder(request));
}

export function rankModelsForOrchestration(request: AiOrchestratorEngineRequest): readonly string[] {
  const providers = createRankedProviderOrder(request);
  return deepFreeze(providers.flatMap((provider) => {
    const model = createModelForProvider(request, provider);
    return model ? [model] : [];
  }));
}

export async function executeAiOrchestrator(request: AiOrchestratorEngineRequest): Promise<AiOrchestratorNormalizedResponse> {
  const attempts: AiProviderExecutionAttempt[] = [];
  const warnings: string[] = [];
  const rankedProviders = createRankedProviderOrder(request);
  const availableProviders = availabilityWithHealth(request.availableProviders);
  const promptText = plainPromptText(request);
  const startedAt = Date.now();

  if (!rankedProviders.length) {
    return failedResponse([], ["No eligible AI provider is available for this request."]);
  }

  for (const provider of rankedProviders) {
    if (!shouldTryProvider(provider, availableProviders)) {
      attempts.push(deepFreeze({ provider, model: createModelForProvider(request, provider) || "unknown", status: "skipped", latencyMs: 0, warnings: ["Provider is unavailable."] }));
      continue;
    }

    const model = createModelForProvider(request, provider);
    if (!model) {
      attempts.push(deepFreeze({ provider, model: "unknown", status: "skipped", latencyMs: 0, warnings: ["No eligible model is available for provider."] }));
      continue;
    }

    const attemptStart = Date.now();
    try {
      const plan = createAiExecutionPlan({
        prompt: request.prompt,
        options: {
          ...request.options,
          providerPreference: provider,
          modelPreference: model,
          policyId: request.policyId || request.options?.policyId,
          requiredCapabilities: request.requiredCapabilities || request.options?.requiredCapabilities,
          optionalCapabilities: request.optionalCapabilities || request.options?.optionalCapabilities
        },
        availableProviders: { ...availableProviders, [provider]: true },
        availableModels: { ...(request.availableModels || {}), [model]: true }
      });

      if (!plan.adapter.execute) {
        throw createAiOrchestrationError("provider_unavailable", "Selected provider does not have an executable adapter.", { provider, model });
      }

      const providerResponse = await plan.adapter.execute(plan.providerRequest);
      const normalized = plan.adapter.normalizeResponse(providerResponse);
      const latencyMs = Math.max(0, Date.now() - attemptStart);
      recordProviderSuccess(provider, latencyMs, request.now || new Date());
      const tokens = normalizeTokenUsage(normalized, promptText);
      const allWarnings = [...warnings, ...plan.warnings, ...normalized.warnings];
      const attempt = deepFreeze({ provider, model, status: "success" as const, latencyMs, warnings: [...plan.warnings, ...normalized.warnings] });
      const finalAttempts = [...attempts, attempt];

      return deepFreeze({
        status: "success",
        provider,
        model,
        latencyMs: Math.max(latencyMs, Date.now() - startedAt),
        tokens,
        costEstimate: estimateProviderCost(provider, tokens.total || 0),
        confidence: calculateProviderConfidence({
          status: "success",
          warnings: allWarnings,
          usedFallback: provider === "mock",
          failoverCount: attempts.filter((item) => item.status === "failed").length
        }),
        warnings: allWarnings,
        response: normalized,
        attempts: finalAttempts,
        providerStatus: getAllProviderHealth()
      });
    } catch (error) {
      const latencyMs = Math.max(0, Date.now() - attemptStart);
      recordProviderFailure(provider, request.now || new Date());
      const message = error instanceof Error ? error.message : "Provider execution failed.";
      warnings.push(`${provider}: ${message}`);
      attempts.push(deepFreeze({ provider, model, status: "failed", latencyMs, warnings: [], error: message }));
      if (request.options?.allowFallback === false) break;
    }
  }

  return failedResponse(attempts, warnings.length ? warnings : ["AI orchestration failed before a provider returned a response."]);
}
