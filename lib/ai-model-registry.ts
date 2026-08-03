import type { AiProviderId } from "@/lib/ai-provider-adapter";
import type { AiCapabilityId } from "@/lib/ai-capability-registry";
import type { AiResponseFormat, AiTaskIntent } from "@/lib/ai-prompt-builder";

export type AiModelSpeedTier = "fast" | "standard" | "slow" | "unknown";
export type AiModelCostTier = "low" | "medium" | "high" | "unknown";
export type AiModelQualityTier = "standard" | "advanced" | "premium" | "unknown";
export type AiModelStabilityStatus = "stable" | "prepared" | "experimental" | "deprecated";

export type AiModelLimits = Readonly<{
  contextWindowTokens?: number;
  maxOutputTokens?: number;
  notes?: string;
}>;

export type AiModelDefaultOptions = Readonly<{
  temperature: number;
  maxOutputTokens: number;
  responseFormat: AiResponseFormat;
}>;

export type AiModelDescriptor = Readonly<{
  id: string;
  provider: AiProviderId;
  displayName: string;
  capabilities: readonly AiCapabilityId[];
  supportedTaskIntents: readonly AiTaskIntent[];
  limits: AiModelLimits;
  supportsStructuredOutput: boolean;
  supportsVision: boolean;
  supportsToolCalling: boolean;
  supportsStreaming: boolean;
  speedTier: AiModelSpeedTier;
  costTier: AiModelCostTier;
  qualityTier: AiModelQualityTier;
  stabilityStatus: AiModelStabilityStatus;
  deprecated: boolean;
  defaultOptions: AiModelDefaultOptions;
  warnings?: readonly string[];
}>;

const commonTaskIntents: readonly AiTaskIntent[] = [
  "general_assistance",
  "summarize",
  "analyze",
  "generate_report",
  "extract_actions",
  "explain",
  "compare",
  "plan"
];

export const aiModelRegistry: Readonly<Record<string, AiModelDescriptor>> = {
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    provider: "openai",
    displayName: "GPT-4o mini",
    capabilities: ["text_generation", "structured_output", "json_output", "streaming", "long_context", "multilingual", "reasoning"],
    supportedTaskIntents: commonTaskIntents,
    limits: { maxOutputTokens: 4000, notes: "Existing project default; exact context metadata is intentionally not asserted here." },
    supportsStructuredOutput: true,
    supportsVision: false,
    supportsToolCalling: false,
    supportsStreaming: true,
    speedTier: "fast",
    costTier: "low",
    qualityTier: "advanced",
    stabilityStatus: "stable",
    deprecated: false,
    defaultOptions: { temperature: 0.35, maxOutputTokens: 1600, responseFormat: "markdown" }
  },
  "gpt-4o": {
    id: "gpt-4o",
    provider: "openai",
    displayName: "GPT-4o",
    capabilities: ["text_generation", "structured_output", "json_output", "streaming", "long_context", "multilingual", "reasoning"],
    supportedTaskIntents: commonTaskIntents,
    limits: { maxOutputTokens: 4000, notes: "Prepared registry entry from existing adapter metadata." },
    supportsStructuredOutput: true,
    supportsVision: false,
    supportsToolCalling: false,
    supportsStreaming: true,
    speedTier: "standard",
    costTier: "medium",
    qualityTier: "premium",
    stabilityStatus: "prepared",
    deprecated: false,
    defaultOptions: { temperature: 0.35, maxOutputTokens: 1800, responseFormat: "markdown" }
  },
  "gpt-4.1-mini": {
    id: "gpt-4.1-mini",
    provider: "openai",
    displayName: "GPT-4.1 mini",
    capabilities: ["text_generation", "structured_output", "json_output", "streaming", "long_context", "multilingual", "reasoning"],
    supportedTaskIntents: commonTaskIntents,
    limits: { maxOutputTokens: 4000, notes: "Prepared registry entry from existing adapter metadata." },
    supportsStructuredOutput: true,
    supportsVision: false,
    supportsToolCalling: false,
    supportsStreaming: true,
    speedTier: "fast",
    costTier: "low",
    qualityTier: "advanced",
    stabilityStatus: "prepared",
    deprecated: false,
    defaultOptions: { temperature: 0.35, maxOutputTokens: 1600, responseFormat: "markdown" }
  },
  "claude-3-5-sonnet-latest": {
    id: "claude-3-5-sonnet-latest",
    provider: "anthropic",
    displayName: "Claude 3.5 Sonnet",
    capabilities: ["text_generation", "structured_output", "long_context", "multilingual", "reasoning"],
    supportedTaskIntents: commonTaskIntents,
    limits: { maxOutputTokens: 4000, notes: "Prepared only; no runtime adapter is connected in the current generation route." },
    supportsStructuredOutput: true,
    supportsVision: false,
    supportsToolCalling: false,
    supportsStreaming: false,
    speedTier: "standard",
    costTier: "medium",
    qualityTier: "premium",
    stabilityStatus: "prepared",
    deprecated: false,
    defaultOptions: { temperature: 0.35, maxOutputTokens: 1800, responseFormat: "markdown" },
    warnings: ["Provider metadata exists, but current production route does not execute Anthropic."]
  },
  "gemini-1.5-pro": {
    id: "gemini-1.5-pro",
    provider: "gemini",
    displayName: "Gemini 1.5 Pro",
    capabilities: ["text_generation", "structured_output", "vision", "long_context", "multilingual", "reasoning"],
    supportedTaskIntents: commonTaskIntents,
    limits: { maxOutputTokens: 4000, notes: "Prepared only; no runtime adapter is connected in the current generation route." },
    supportsStructuredOutput: true,
    supportsVision: true,
    supportsToolCalling: false,
    supportsStreaming: false,
    speedTier: "standard",
    costTier: "medium",
    qualityTier: "advanced",
    stabilityStatus: "prepared",
    deprecated: false,
    defaultOptions: { temperature: 0.35, maxOutputTokens: 1800, responseFormat: "markdown" },
    warnings: ["Provider metadata exists, but current production route does not execute Gemini."]
  },
  "openai/gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    provider: "openrouter",
    displayName: "OpenRouter GPT-4o mini route",
    capabilities: ["text_generation", "structured_output", "json_output", "multilingual"],
    supportedTaskIntents: commonTaskIntents,
    limits: { maxOutputTokens: 4000, notes: "Prepared only; no runtime adapter is connected in the current generation route." },
    supportsStructuredOutput: true,
    supportsVision: false,
    supportsToolCalling: false,
    supportsStreaming: false,
    speedTier: "unknown",
    costTier: "unknown",
    qualityTier: "advanced",
    stabilityStatus: "prepared",
    deprecated: false,
    defaultOptions: { temperature: 0.35, maxOutputTokens: 1600, responseFormat: "markdown" },
    warnings: ["Provider metadata exists, but current production route does not execute OpenRouter."]
  },
  "mock-vora-local": {
    id: "mock-vora-local",
    provider: "mock",
    displayName: "Mock VORA local",
    capabilities: ["text_generation", "structured_output", "json_output", "multilingual"],
    supportedTaskIntents: commonTaskIntents,
    limits: { maxOutputTokens: 2400, notes: "Deterministic local fallback metadata." },
    supportsStructuredOutput: true,
    supportsVision: false,
    supportsToolCalling: false,
    supportsStreaming: false,
    speedTier: "fast",
    costTier: "low",
    qualityTier: "standard",
    stabilityStatus: "stable",
    deprecated: false,
    defaultOptions: { temperature: 0.2, maxOutputTokens: 1200, responseFormat: "markdown" }
  }
};

export function getAiModelDescriptor(modelId: string): AiModelDescriptor | undefined {
  return aiModelRegistry[modelId];
}

export function getModelsForProvider(provider: AiProviderId): readonly AiModelDescriptor[] {
  return Object.values(aiModelRegistry).filter((model) => model.provider === provider && !model.deprecated);
}

export function getModelsForCapability(capability: AiCapabilityId): readonly AiModelDescriptor[] {
  return Object.values(aiModelRegistry).filter((model) => !model.deprecated && model.capabilities.includes(capability));
}

export function getModelsForTaskIntent(intent: AiTaskIntent): readonly AiModelDescriptor[] {
  return Object.values(aiModelRegistry).filter((model) => !model.deprecated && model.supportedTaskIntents.includes(intent));
}

export function hasModelCapability(modelId: string, capability: AiCapabilityId): boolean {
  return Boolean(aiModelRegistry[modelId]?.capabilities.includes(capability));
}

export function validateModelProviderPair(provider: AiProviderId, modelId: string): boolean {
  return aiModelRegistry[modelId]?.provider === provider;
}
