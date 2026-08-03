import type { AiExecutionPolicyId } from "@/lib/ai-execution-policy";
import type { AiPromptPayload } from "@/lib/ai-prompt-builder";
import type { AiModelId, AiNormalizedResponse, AiProviderCapability, AiProviderId } from "@/lib/ai-provider-adapter";
import type { AiExecutionOptions, AiProviderAvailability } from "@/lib/ai-orchestrator";

export type AiProviderHealthStatus = "available" | "unavailable" | "degraded";

export type AiProviderHealthSnapshot = Readonly<{
  provider: AiProviderId;
  status: AiProviderHealthStatus;
  availability: boolean;
  averageLatencyMs: number;
  successRate: number;
  successCount: number;
  failureCount: number;
  lastSuccessfulExecution?: string;
  lastFailure?: string;
}>;

export type AiOrchestratorEngineRequest = Readonly<{
  prompt: AiPromptPayload;
  policyId?: AiExecutionPolicyId;
  providerPreference?: AiProviderId | "auto";
  modelPreference?: AiModelId;
  availableProviders: AiProviderAvailability;
  availableModels?: Readonly<Record<string, boolean> | Partial<Record<string, boolean>>>;
  requiredCapabilities?: readonly AiProviderCapability[];
  optionalCapabilities?: readonly AiProviderCapability[];
  options?: AiExecutionOptions;
  now?: Date;
}>;

export type AiProviderExecutionAttempt = Readonly<{
  provider: AiProviderId;
  model: AiModelId;
  status: "success" | "failed" | "skipped";
  latencyMs: number;
  warnings: readonly string[];
  error?: string;
}>;

export type AiOrchestratorNormalizedResponse = Readonly<{
  status: "success" | "failed";
  provider?: AiProviderId;
  model?: AiModelId;
  latencyMs: number;
  tokens: Readonly<{
    input?: number;
    output?: number;
    total?: number;
  }>;
  costEstimate?: number;
  confidence: number;
  warnings: readonly string[];
  response?: AiNormalizedResponse;
  attempts: readonly AiProviderExecutionAttempt[];
  providerStatus: readonly AiProviderHealthSnapshot[];
}>;
