import type { AiPromptPayload, AiResponseFormat } from "@/lib/ai-prompt-builder";
import {
  createAiExecutionPolicy,
  resolveAiExecutionCandidate,
  validateAiExecutionCandidate,
  type AiExecutionPolicyId,
  type AiModelAvailability
} from "@/lib/ai-execution-policy";
import {
  aiProviderDescriptors,
  getAiProviderAdapter,
  normalizeAiProviderResponse,
  type AiModelId,
  type AiNormalizedResponse,
  type AiProviderAdapter,
  type AiProviderCapability,
  type AiProviderCapabilities,
  type AiProviderId,
  type AiProviderRequest,
  type AiProviderResponse
} from "@/lib/ai-provider-adapter";

export type AiProviderPreference = AiProviderId | "auto";

export type AiProviderAvailability = Readonly<Partial<Record<AiProviderId, boolean>>>;

export type AiExecutionOptions = Readonly<{
  providerPreference?: AiProviderPreference;
  modelPreference?: AiModelId;
  policyId?: AiExecutionPolicyId;
  requiredCapabilities?: readonly AiProviderCapability[];
  optionalCapabilities?: readonly AiProviderCapability[];
  temperature?: number;
  maxOutputTokens?: number;
  responseFormat?: AiResponseFormat;
  stream?: boolean;
  timeoutMs?: number;
  allowFallback?: boolean;
  metadata?: Readonly<Record<string, string | number | boolean>>;
}>;

export type AiNormalizedExecutionOptions = Readonly<{
  temperature: number;
  maxOutputTokens: number;
  responseFormat: AiResponseFormat;
  stream: boolean;
  timeoutMs: number;
}>;

export type AiExecutionRequest = Readonly<{
  prompt: AiPromptPayload;
  options?: AiExecutionOptions;
  availableProviders: AiProviderAvailability;
  availableModels?: AiModelAvailability;
  providerCapabilities?: Readonly<Partial<Record<AiProviderId, AiProviderCapabilities>>>;
}>;

export type AiExecutionPlan = Readonly<{
  provider: AiProviderId;
  model: AiModelId;
  adapter: AiProviderAdapter;
  capabilities: AiProviderCapabilities;
  options: AiNormalizedExecutionOptions;
  providerRequest: AiProviderRequest;
  warnings: readonly string[];
}>;

export type AiCapabilityValidation = Readonly<{
  valid: boolean;
  missingCapabilities: readonly AiProviderCapability[];
}>;

export type AiOrchestrationErrorCategory =
  | "configuration_error"
  | "authentication_error"
  | "rate_limit"
  | "timeout"
  | "provider_unavailable"
  | "invalid_request"
  | "content_rejected"
  | "upstream_error"
  | "unknown_error";

export class AiOrchestrationError extends Error {
  readonly category: AiOrchestrationErrorCategory;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(
    category: AiOrchestrationErrorCategory,
    message: string,
    details?: Readonly<Record<string, unknown>>
  ) {
    super(message);
    this.name = "AiOrchestrationError";
    this.category = category;
    this.details = details;
  }
}

type SelectAiProviderInput = Readonly<{
  providerPreference?: AiProviderPreference;
  availableProviders: AiProviderAvailability;
  providerCapabilities?: Readonly<Partial<Record<AiProviderId, AiProviderCapabilities>>>;
  requiredCapabilities?: readonly AiProviderCapability[];
  fallbackOrder?: readonly AiProviderId[];
}>;

type SelectAiModelInput = Readonly<{
  provider: AiProviderId;
  providerCapabilities?: AiProviderCapabilities;
  modelPreference?: AiModelId;
}>;

const defaultProviderOrder: readonly AiProviderId[] = ["openai", "anthropic", "gemini", "openrouter", "mock"];

const defaultExecutionOptions: AiNormalizedExecutionOptions = {
  temperature: 0.35,
  maxOutputTokens: 1600,
  responseFormat: "markdown",
  stream: false,
  timeoutMs: 30_000
};

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const property of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[property];
    if (child && typeof child === "object" && !Object.isFrozen(child)) {
      deepFreeze(child);
    }
  }
  return value;
}

function clampNumber(value: number | undefined, minimum: number, maximum: number, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function getCapabilities(
  provider: AiProviderId,
  overrides?: Readonly<Partial<Record<AiProviderId, AiProviderCapabilities>>>
) {
  return overrides?.[provider] || aiProviderDescriptors[provider];
}

function createMetadata(metadata?: AiExecutionOptions["metadata"]): Readonly<Record<string, string>> | undefined {
  if (!metadata) return undefined;

  const normalized = Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  );

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function createAiOrchestrationError(
  category: AiOrchestrationErrorCategory,
  message: string,
  details?: Readonly<Record<string, unknown>>
) {
  return new AiOrchestrationError(category, message, details);
}

export function validateProviderCapabilities(
  capabilities: AiProviderCapabilities,
  requiredCapabilities: readonly AiProviderCapability[] = []
): AiCapabilityValidation {
  const missingCapabilities = requiredCapabilities.filter(
    (capability) => !capabilities.supportedCapabilities.includes(capability)
  );

  return {
    valid: missingCapabilities.length === 0,
    missingCapabilities
  };
}

export function selectAiProvider(input: SelectAiProviderInput): AiProviderId {
  const requiredCapabilities = input.requiredCapabilities || [];
  const providerPreference = input.providerPreference || "auto";

  if (providerPreference !== "auto") {
    if (input.availableProviders[providerPreference] !== true) {
      throw createAiOrchestrationError("provider_unavailable", "Requested AI provider is not available.", {
        provider: providerPreference
      });
    }

    const capabilities = getCapabilities(providerPreference, input.providerCapabilities);
    const validation = validateProviderCapabilities(capabilities, requiredCapabilities);
    if (!validation.valid) {
      throw createAiOrchestrationError("invalid_request", "Requested AI provider is missing required capabilities.", {
        provider: providerPreference,
        missingCapabilities: validation.missingCapabilities
      });
    }

    return providerPreference;
  }

  for (const provider of input.fallbackOrder || defaultProviderOrder) {
    if (input.availableProviders[provider] !== true) continue;

    const capabilities = getCapabilities(provider, input.providerCapabilities);
    const validation = validateProviderCapabilities(capabilities, requiredCapabilities);
    if (validation.valid) return provider;
  }

  throw createAiOrchestrationError("provider_unavailable", "No available AI provider satisfies the request.", {
    requiredCapabilities
  });
}

export function selectAiModel(input: SelectAiModelInput): AiModelId {
  const capabilities = input.providerCapabilities || aiProviderDescriptors[input.provider];

  if (!input.modelPreference) return capabilities.defaultModel;

  if (!capabilities.supportedModels.includes(input.modelPreference)) {
    throw createAiOrchestrationError("invalid_request", "Requested AI model is not supported by the selected provider.", {
      provider: input.provider,
      model: input.modelPreference
    });
  }

  return input.modelPreference;
}

export function normalizeExecutionOptions(
  options: AiExecutionOptions = {},
  capabilities?: AiProviderCapabilities
): Readonly<{ options: AiNormalizedExecutionOptions; warnings: readonly string[] }> {
  const warnings: string[] = [];
  const supportedFormats = capabilities?.supportsResponseFormats || ["markdown", "plain_text", "json"];
  const maxOutputTokens = capabilities?.maxOutputTokens || 4000;
  const requestedFormat = options.responseFormat || defaultExecutionOptions.responseFormat;
  const responseFormat = supportedFormats.includes(requestedFormat) ? requestedFormat : supportedFormats[0] || "markdown";

  if (responseFormat !== requestedFormat) {
    warnings.push(`Response format '${requestedFormat}' is not supported by this provider; using '${responseFormat}'.`);
  }

  const stream = Boolean(options.stream && capabilities?.supportedCapabilities.includes("streaming"));
  if (options.stream && !stream) {
    warnings.push("Streaming was requested but is not supported by the selected provider.");
  }

  return deepFreeze({
    options: {
      temperature: clampNumber(options.temperature, 0, 1, defaultExecutionOptions.temperature),
      maxOutputTokens: Math.round(
        clampNumber(options.maxOutputTokens, 1, maxOutputTokens, defaultExecutionOptions.maxOutputTokens)
      ),
      responseFormat,
      stream,
      timeoutMs: Math.round(clampNumber(options.timeoutMs, 1_000, 120_000, defaultExecutionOptions.timeoutMs))
    },
    warnings
  });
}

export function createAiExecutionPlan(request: AiExecutionRequest): AiExecutionPlan {
  const requestedOptions = request.options || {};
  const requiredCapabilities = requestedOptions.requiredCapabilities || ["text_generation"];
  const policy = createAiExecutionPolicy({
    policyId: requestedOptions.policyId,
    preferredProvider: requestedOptions.providerPreference === "auto" ? undefined : requestedOptions.providerPreference,
    preferredModel: requestedOptions.modelPreference,
    requiredCapabilities,
    optionalCapabilities: requestedOptions.optionalCapabilities,
    taskIntent: request.prompt.taskIntent
  });

  const candidate = resolveAiExecutionCandidate({
    taskIntent: request.prompt.taskIntent,
    policy,
    availableProviders: request.availableProviders,
    availableModels: request.availableModels,
    requestedProvider: requestedOptions.providerPreference === "auto" ? undefined : requestedOptions.providerPreference,
    requestedModel: requestedOptions.modelPreference,
    requiredCapabilities
  });
  const validation = validateAiExecutionCandidate(candidate, requiredCapabilities);
  if (!validation.valid || !candidate) {
    throw createAiOrchestrationError("provider_unavailable", "No registered AI execution candidate satisfies the request.", {
      reasons: validation.reasons,
      requiredCapabilities,
      providerPreference: requestedOptions.providerPreference,
      modelPreference: requestedOptions.modelPreference
    });
  }

  const provider = candidate.provider.id;
  const model = candidate.model.id;
  const capabilities = getCapabilities(provider, request.providerCapabilities);
  const normalized = normalizeExecutionOptions(
    {
      responseFormat: request.prompt.outputPreferences.responseFormat,
      ...requestedOptions
    },
    capabilities
  );
  const adapter = getAiProviderAdapter(provider);
  const providerRequest: AiProviderRequest = {
    provider,
    model,
    prompt: request.prompt,
    options: normalized.options,
    metadata: createMetadata(requestedOptions.metadata)
  };

  return deepFreeze({
    provider,
    model,
    adapter,
    capabilities,
    options: normalized.options,
    providerRequest,
    warnings: normalized.warnings
  });
}

export { normalizeAiProviderResponse };
export type { AiNormalizedResponse, AiProviderRequest, AiProviderResponse };
