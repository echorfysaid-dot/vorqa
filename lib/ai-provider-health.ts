import type { AiProviderId } from "@/lib/ai-provider-adapter";
import type { AiProviderHealthSnapshot } from "@/types/ai-orchestrator";

const providerOrder: readonly AiProviderId[] = ["openai", "anthropic", "gemini", "openrouter", "mock"];

const health = new Map<AiProviderId, AiProviderHealthSnapshot>();

function createInitialHealth(provider: AiProviderId): AiProviderHealthSnapshot {
  return Object.freeze({
    provider,
    status: "available",
    availability: true,
    averageLatencyMs: 0,
    successRate: 1,
    successCount: 0,
    failureCount: 0
  });
}

export function getProviderHealth(provider: AiProviderId): AiProviderHealthSnapshot {
  const existing = health.get(provider);
  if (existing) return existing;
  const initial = createInitialHealth(provider);
  health.set(provider, initial);
  return initial;
}

export function getAllProviderHealth(): readonly AiProviderHealthSnapshot[] {
  return Object.freeze(providerOrder.map(getProviderHealth));
}

export function recordProviderSuccess(provider: AiProviderId, latencyMs: number, at = new Date()): AiProviderHealthSnapshot {
  const current = getProviderHealth(provider);
  const successCount = current.successCount + 1;
  const failureCount = current.failureCount;
  const total = successCount + failureCount;
  const averageLatencyMs = Math.round(((current.averageLatencyMs * current.successCount) + latencyMs) / successCount);
  const snapshot: AiProviderHealthSnapshot = Object.freeze({
    provider,
    status: averageLatencyMs > 12_000 ? "degraded" : "available",
    availability: true,
    averageLatencyMs,
    successRate: Number((successCount / total).toFixed(4)),
    successCount,
    failureCount,
    lastSuccessfulExecution: at.toISOString(),
    lastFailure: current.lastFailure
  });
  health.set(provider, snapshot);
  return snapshot;
}

export function recordProviderFailure(provider: AiProviderId, at = new Date()): AiProviderHealthSnapshot {
  const current = getProviderHealth(provider);
  const successCount = current.successCount;
  const failureCount = current.failureCount + 1;
  const total = successCount + failureCount;
  const snapshot: AiProviderHealthSnapshot = Object.freeze({
    provider,
    status: successCount > 0 ? "degraded" : "unavailable",
    availability: false,
    averageLatencyMs: current.averageLatencyMs,
    successRate: Number((successCount / total).toFixed(4)),
    successCount,
    failureCount,
    lastSuccessfulExecution: current.lastSuccessfulExecution,
    lastFailure: at.toISOString()
  });
  health.set(provider, snapshot);
  return snapshot;
}

export function resetProviderHealth() {
  health.clear();
}
