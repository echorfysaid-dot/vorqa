import type { AiCapabilityId } from "@/lib/ai-capability-registry";
import { getModelsForProvider } from "@/lib/ai-model-registry";
import type { AiProviderId } from "@/lib/ai-provider-adapter";

export type AiProviderFamily = "openai" | "anthropic" | "google" | "router" | "local";

export type AiProviderImplementationStatus = "implemented" | "prepared" | "mock";

export type AiProviderDescriptor = Readonly<{
  id: AiProviderId;
  displayName: string;
  providerFamily: AiProviderFamily;
  enabledByDefault: boolean;
  implementationStatus: AiProviderImplementationStatus;
  supportedCapabilities: readonly AiCapabilityId[];
  defaultModelId: string;
  availableModelIds: readonly string[];
  priority: number;
  executionNotes: readonly string[];
  deprecated: boolean;
  warnings?: readonly string[];
}>;

export const aiProviderRegistry: Readonly<Record<AiProviderId, AiProviderDescriptor>> = {
  openai: {
    id: "openai",
    displayName: "OpenAI",
    providerFamily: "openai",
    enabledByDefault: false,
    implementationStatus: "implemented",
    supportedCapabilities: ["text_generation", "structured_output", "json_output", "streaming", "long_context", "multilingual", "reasoning"],
    defaultModelId: "gpt-4o-mini",
    availableModelIds: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
    priority: 10,
    executionNotes: ["Existing /api/generate route can execute OpenAI through the Responses API when configured."],
    deprecated: false
  },
  anthropic: {
    id: "anthropic",
    displayName: "Anthropic",
    providerFamily: "anthropic",
    enabledByDefault: false,
    implementationStatus: "prepared",
    supportedCapabilities: ["text_generation", "structured_output", "long_context", "multilingual", "reasoning"],
    defaultModelId: "claude-3-5-sonnet-latest",
    availableModelIds: ["claude-3-5-sonnet-latest"],
    priority: 30,
    executionNotes: ["Provider metadata only. No runtime execution path is connected in this pass."],
    deprecated: false,
    warnings: ["Prepared provider; runtime availability must be supplied explicitly by a future integration layer."]
  },
  gemini: {
    id: "gemini",
    displayName: "Google Gemini",
    providerFamily: "google",
    enabledByDefault: false,
    implementationStatus: "prepared",
    supportedCapabilities: ["text_generation", "structured_output", "vision", "long_context", "multilingual", "reasoning"],
    defaultModelId: "gemini-1.5-pro",
    availableModelIds: ["gemini-1.5-pro"],
    priority: 40,
    executionNotes: ["Provider metadata only. No runtime execution path is connected in this pass."],
    deprecated: false,
    warnings: ["Prepared provider; runtime availability must be supplied explicitly by a future integration layer."]
  },
  openrouter: {
    id: "openrouter",
    displayName: "OpenRouter",
    providerFamily: "router",
    enabledByDefault: false,
    implementationStatus: "prepared",
    supportedCapabilities: ["text_generation", "structured_output", "json_output", "multilingual"],
    defaultModelId: "openai/gpt-4o-mini",
    availableModelIds: ["openai/gpt-4o-mini"],
    priority: 50,
    executionNotes: ["Provider metadata only. No runtime execution path is connected in this pass."],
    deprecated: false,
    warnings: ["Prepared provider; runtime availability must be supplied explicitly by a future integration layer."]
  },
  mock: {
    id: "mock",
    displayName: "Mock",
    providerFamily: "local",
    enabledByDefault: true,
    implementationStatus: "mock",
    supportedCapabilities: ["text_generation", "structured_output", "json_output", "multilingual"],
    defaultModelId: "mock-vora-local",
    availableModelIds: ["mock-vora-local"],
    priority: 100,
    executionNotes: ["Local deterministic fallback metadata. This registry does not make it runtime-selected automatically."],
    deprecated: false
  }
};

export function getAiProviderDescriptor(provider: AiProviderId): AiProviderDescriptor {
  return aiProviderRegistry[provider];
}

export function hasProviderCapability(provider: AiProviderId, capability: AiCapabilityId): boolean {
  return aiProviderRegistry[provider].supportedCapabilities.includes(capability);
}

export function getRegisteredProviderIds(): readonly AiProviderId[] {
  return Object.keys(aiProviderRegistry) as AiProviderId[];
}

export function getProviderModelIds(provider: AiProviderId): readonly string[] {
  const modelIds = getModelsForProvider(provider).map((model) => model.id);
  return modelIds.length ? modelIds : aiProviderRegistry[provider].availableModelIds;
}
