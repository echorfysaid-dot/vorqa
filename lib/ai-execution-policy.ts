import type { AiCapabilityId } from "@/lib/ai-capability-registry";
import { aiTaskIntentCapabilityHints } from "@/lib/ai-capability-registry";
import { aiModelRegistry, getModelsForProvider, type AiModelDescriptor } from "@/lib/ai-model-registry";
import { aiProviderRegistry, getRegisteredProviderIds, type AiProviderDescriptor } from "@/lib/ai-provider-registry";
import type { AiProviderId } from "@/lib/ai-provider-adapter";
import type { AiProviderAvailability } from "@/lib/ai-orchestrator";
import type { AiTaskIntent } from "@/lib/ai-prompt-builder";

export type AiExecutionPolicyId =
  | "quality_first"
  | "balanced"
  | "speed_first"
  | "cost_conscious"
  | "provider_preferred"
  | "mock_only";

export type AiModelAvailability = Readonly<Record<string, boolean> | Partial<Record<string, boolean>>>;

export type AiExecutionPolicy = Readonly<{
  id: AiExecutionPolicyId;
  label: string;
  preferredProviderOrder: readonly AiProviderId[];
  preferredModelOrder: readonly string[];
  requiredCapabilities: readonly AiCapabilityId[];
  optionalCapabilities: readonly AiCapabilityId[];
  costCeiling?: "low" | "medium" | "high";
  speedPreference: "fast" | "balanced" | "quality";
  allowFallback: boolean;
  allowMockFallback: boolean;
  preferStructuredOutput: boolean;
  taskIntentOverrides?: Readonly<Partial<Record<AiTaskIntent, Partial<AiExecutionPolicy>>>>;
}>;

export type AiExecutionPolicyInput = Readonly<{
  policyId?: AiExecutionPolicyId;
  preferredProvider?: AiProviderId;
  preferredModel?: string;
  requiredCapabilities?: readonly AiCapabilityId[];
  optionalCapabilities?: readonly AiCapabilityId[];
  taskIntent?: AiTaskIntent;
}>;

export type AiExecutionCandidateInput = Readonly<{
  taskIntent?: AiTaskIntent;
  policy: AiExecutionPolicy;
  availableProviders: AiProviderAvailability;
  availableModels?: AiModelAvailability;
  requestedProvider?: AiProviderId;
  requestedModel?: string;
  requiredCapabilities?: readonly AiCapabilityId[];
}>;

export type AiProviderCandidate = Readonly<{
  provider: AiProviderDescriptor;
  score: number;
  rank: number;
  reasons: readonly string[];
}>;

export type AiModelCandidate = Readonly<{
  model: AiModelDescriptor;
  score: number;
  rank: number;
  reasons: readonly string[];
}>;

export type AiExecutionCandidate = Readonly<{
  provider: AiProviderDescriptor;
  model: AiModelDescriptor;
  score: number;
  reasons: readonly string[];
}>;

export type AiExecutionCandidateValidation = Readonly<{
  valid: boolean;
  reasons: readonly string[];
}>;

const basePolicies: Readonly<Record<AiExecutionPolicyId, AiExecutionPolicy>> = {
  quality_first: {
    id: "quality_first",
    label: "Quality first",
    preferredProviderOrder: ["openai", "anthropic", "gemini", "openrouter", "mock"],
    preferredModelOrder: ["gpt-4o", "gpt-4.1-mini", "gpt-4o-mini", "claude-3-5-sonnet-latest", "gemini-1.5-pro", "openai/gpt-4o-mini", "mock-vora-local"],
    requiredCapabilities: ["text_generation"],
    optionalCapabilities: ["structured_output", "reasoning", "multilingual"],
    costCeiling: "high",
    speedPreference: "quality",
    allowFallback: true,
    allowMockFallback: true,
    preferStructuredOutput: true
  },
  balanced: {
    id: "balanced",
    label: "Balanced",
    preferredProviderOrder: ["openai", "anthropic", "gemini", "openrouter", "mock"],
    preferredModelOrder: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o", "claude-3-5-sonnet-latest", "gemini-1.5-pro", "openai/gpt-4o-mini", "mock-vora-local"],
    requiredCapabilities: ["text_generation"],
    optionalCapabilities: ["structured_output", "multilingual"],
    costCeiling: "medium",
    speedPreference: "balanced",
    allowFallback: true,
    allowMockFallback: true,
    preferStructuredOutput: true
  },
  speed_first: {
    id: "speed_first",
    label: "Speed first",
    preferredProviderOrder: ["openai", "openrouter", "mock", "anthropic", "gemini"],
    preferredModelOrder: ["gpt-4o-mini", "gpt-4.1-mini", "openai/gpt-4o-mini", "mock-vora-local", "gpt-4o"],
    requiredCapabilities: ["text_generation"],
    optionalCapabilities: ["structured_output", "multilingual"],
    costCeiling: "medium",
    speedPreference: "fast",
    allowFallback: true,
    allowMockFallback: true,
    preferStructuredOutput: false
  },
  cost_conscious: {
    id: "cost_conscious",
    label: "Cost conscious",
    preferredProviderOrder: ["openai", "mock", "openrouter", "anthropic", "gemini"],
    preferredModelOrder: ["gpt-4o-mini", "mock-vora-local", "openai/gpt-4o-mini", "gpt-4.1-mini"],
    requiredCapabilities: ["text_generation"],
    optionalCapabilities: ["structured_output", "multilingual"],
    costCeiling: "low",
    speedPreference: "balanced",
    allowFallback: true,
    allowMockFallback: true,
    preferStructuredOutput: false
  },
  provider_preferred: {
    id: "provider_preferred",
    label: "Provider preferred",
    preferredProviderOrder: ["openai", "anthropic", "gemini", "openrouter", "mock"],
    preferredModelOrder: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "claude-3-5-sonnet-latest", "gemini-1.5-pro", "openai/gpt-4o-mini", "mock-vora-local"],
    requiredCapabilities: ["text_generation"],
    optionalCapabilities: ["structured_output", "multilingual"],
    costCeiling: "medium",
    speedPreference: "balanced",
    allowFallback: false,
    allowMockFallback: false,
    preferStructuredOutput: true
  },
  mock_only: {
    id: "mock_only",
    label: "Mock only",
    preferredProviderOrder: ["mock"],
    preferredModelOrder: ["mock-vora-local"],
    requiredCapabilities: ["text_generation"],
    optionalCapabilities: ["structured_output", "multilingual"],
    costCeiling: "low",
    speedPreference: "fast",
    allowFallback: false,
    allowMockFallback: true,
    preferStructuredOutput: false
  }
};

function uniqueValues<T extends string>(values: readonly T[]): readonly T[] {
  return Array.from(new Set(values));
}

function rankIndex<T extends string>(order: readonly T[], value: T) {
  const index = order.indexOf(value);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function capabilityScore(capabilities: readonly AiCapabilityId[], optionalCapabilities: readonly AiCapabilityId[]) {
  return optionalCapabilities.filter((capability) => capabilities.includes(capability)).length * 10;
}

function speedScore(model: AiModelDescriptor, policy: AiExecutionPolicy) {
  if (policy.speedPreference === "fast") return model.speedTier === "fast" ? 12 : model.speedTier === "standard" ? 6 : 0;
  if (policy.speedPreference === "quality") return model.qualityTier === "premium" ? 12 : model.qualityTier === "advanced" ? 8 : 2;
  return model.speedTier === "fast" || model.qualityTier === "advanced" ? 6 : 3;
}

function costScore(model: AiModelDescriptor, policy: AiExecutionPolicy) {
  if (!policy.costCeiling) return 0;
  if (policy.costCeiling === "low") return model.costTier === "low" ? 12 : model.costTier === "unknown" ? 2 : -8;
  if (policy.costCeiling === "medium") return model.costTier === "high" ? -5 : 5;
  return 0;
}

function matchesRequiredCapabilities(capabilities: readonly AiCapabilityId[], requiredCapabilities: readonly AiCapabilityId[]) {
  return requiredCapabilities.every((capability) => capabilities.includes(capability));
}

function isModelAvailable(modelId: string, availability?: AiModelAvailability) {
  if (!availability) return true;
  return availability[modelId] === true;
}

export function createAiExecutionPolicy(input: AiExecutionPolicyInput = {}): AiExecutionPolicy {
  const base = basePolicies[input.policyId || "balanced"];
  const taskCapabilities = input.taskIntent ? aiTaskIntentCapabilityHints[input.taskIntent] : [];
  const preferredProviderOrder = input.preferredProvider
    ? uniqueValues([input.preferredProvider, ...base.preferredProviderOrder])
    : base.preferredProviderOrder;
  const preferredModelOrder = input.preferredModel
    ? uniqueValues([input.preferredModel, ...base.preferredModelOrder])
    : base.preferredModelOrder;

  return Object.freeze({
    ...base,
    preferredProviderOrder,
    preferredModelOrder,
    requiredCapabilities: uniqueValues([...(input.requiredCapabilities || base.requiredCapabilities)]),
    optionalCapabilities: uniqueValues([...(input.optionalCapabilities || base.optionalCapabilities), ...taskCapabilities])
  });
}

export function rankAiProviderCandidates(input: AiExecutionCandidateInput): readonly AiProviderCandidate[] {
  const requiredCapabilities = input.requiredCapabilities || input.policy.requiredCapabilities;
  const providers = getRegisteredProviderIds()
    .map((providerId) => aiProviderRegistry[providerId])
    .filter((provider) => input.availableProviders[provider.id] === true)
    .filter((provider) => !provider.deprecated)
    .filter((provider) => !input.requestedProvider || provider.id === input.requestedProvider)
    .filter((provider) => matchesRequiredCapabilities(provider.supportedCapabilities, requiredCapabilities))
    .map((provider) => {
      const preferenceRank = rankIndex(input.policy.preferredProviderOrder, provider.id);
      const reasons = [
        `provider-rank:${preferenceRank}`,
        `priority:${provider.priority}`,
        `implementation:${provider.implementationStatus}`
      ];
      const score =
        1000 -
        preferenceRank * 50 -
        provider.priority +
        capabilityScore(provider.supportedCapabilities, input.policy.optionalCapabilities) +
        (provider.implementationStatus === "implemented" ? 25 : 0) +
        (provider.implementationStatus === "mock" && input.policy.allowMockFallback ? 5 : 0);

      return { provider, score, rank: preferenceRank, reasons };
    });

  return providers.sort((left, right) => right.score - left.score || left.rank - right.rank || left.provider.id.localeCompare(right.provider.id));
}

export function rankAiModelCandidates(input: AiExecutionCandidateInput): readonly AiModelCandidate[] {
  const providerCandidates = rankAiProviderCandidates(input).map((candidate) => candidate.provider.id);
  const requiredCapabilities = input.requiredCapabilities || input.policy.requiredCapabilities;
  const models = Object.values(aiModelRegistry)
    .filter((model) => !model.deprecated)
    .filter((model) => providerCandidates.includes(model.provider))
    .filter((model) => !input.requestedModel || model.id === input.requestedModel)
    .filter((model) => isModelAvailable(model.id, input.availableModels))
    .filter((model) => matchesRequiredCapabilities(model.capabilities, requiredCapabilities))
    .filter((model) => !input.taskIntent || model.supportedTaskIntents.includes(input.taskIntent))
    .map((model) => {
      const modelRank = rankIndex(input.policy.preferredModelOrder, model.id);
      const providerRank = rankIndex(input.policy.preferredProviderOrder, model.provider);
      const reasons = [
        `model-rank:${modelRank}`,
        `provider-rank:${providerRank}`,
        `speed:${model.speedTier}`,
        `cost:${model.costTier}`,
        `quality:${model.qualityTier}`
      ];
      const score =
        1000 -
        modelRank * 40 -
        providerRank * 25 +
        capabilityScore(model.capabilities, input.policy.optionalCapabilities) +
        speedScore(model, input.policy) +
        costScore(model, input.policy);

      return { model, score, rank: modelRank, reasons };
    });

  return models.sort((left, right) => right.score - left.score || left.rank - right.rank || left.model.id.localeCompare(right.model.id));
}

export function validateAiExecutionCandidate(
  candidate: Pick<AiExecutionCandidate, "provider" | "model"> | undefined,
  requiredCapabilities: readonly AiCapabilityId[] = []
): AiExecutionCandidateValidation {
  if (!candidate) return { valid: false, reasons: ["No execution candidate was resolved."] };
  if (candidate.model.provider !== candidate.provider.id) {
    return { valid: false, reasons: ["Model does not belong to selected provider."] };
  }
  if (!matchesRequiredCapabilities(candidate.model.capabilities, requiredCapabilities)) {
    return { valid: false, reasons: ["Model is missing one or more required capabilities."] };
  }
  return { valid: true, reasons: ["Candidate is registered and satisfies required capabilities."] };
}

export function resolveAiExecutionCandidate(input: AiExecutionCandidateInput): AiExecutionCandidate | undefined {
  const providerCandidates = rankAiProviderCandidates(input);
  const modelCandidates = rankAiModelCandidates(input);
  for (const providerCandidate of providerCandidates) {
    const modelCandidate = modelCandidates.find((candidate) => candidate.model.provider === providerCandidate.provider.id);
    if (!modelCandidate) continue;
    return {
      provider: providerCandidate.provider,
      model: modelCandidate.model,
      score: providerCandidate.score + modelCandidate.score,
      reasons: [...providerCandidate.reasons, ...modelCandidate.reasons]
    };
  }
  return undefined;
}

export function getPolicyProviderOrder(policy: AiExecutionPolicy): readonly AiProviderId[] {
  return policy.preferredProviderOrder.filter((provider) => provider in aiProviderRegistry);
}

export function getPolicyModelsForProvider(policy: AiExecutionPolicy, provider: AiProviderId): readonly AiModelDescriptor[] {
  const providerModels = getModelsForProvider(provider);
  return [...providerModels].sort(
    (left, right) => rankIndex(policy.preferredModelOrder, left.id) - rankIndex(policy.preferredModelOrder, right.id)
  );
}
