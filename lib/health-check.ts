import { getAllProviderHealth } from "@/lib/ai-provider-health";
import { isSupabaseServerConfigured } from "@/lib/supabase-server";
import { knowledgeEngine } from "@/lib/knowledge-engine";
import { listSessions } from "@/lib/copilot-session";
import { stats as cacheStats } from "@/lib/request-cache";
import type { RuntimeHealthCheck, RuntimeHealthReport, RuntimeHealthStatus } from "@/types/runtime-health";

function check(name: RuntimeHealthCheck["name"], status: RuntimeHealthStatus, message: string, metadata: Readonly<Record<string, unknown>>, now: Date): RuntimeHealthCheck {
  return Object.freeze({ name, status, message, checkedAt: now.toISOString(), metadata });
}

function overallStatus(checks: readonly RuntimeHealthCheck[]): RuntimeHealthStatus {
  if (checks.some((item) => item.status === "unhealthy")) return "unhealthy";
  if (checks.some((item) => item.status === "degraded")) return "degraded";
  return "healthy";
}

export async function runRuntimeHealthChecks(now = new Date()): Promise<RuntimeHealthReport> {
  const providerHealth = getAllProviderHealth();
  const providerStatus: RuntimeHealthStatus = providerHealth.some((provider) => provider.status === "available") ? "healthy" : "degraded";
  const knowledgeProbe = await knowledgeEngine.search({ projectId: "health-check", query: "health", limit: 1 }).catch((error) => ({
    ok: false,
    status: "failed" as const,
    warnings: [error instanceof Error ? error.message : "Knowledge probe failed."]
  }));
  const checks: RuntimeHealthCheck[] = [
    check("database", isSupabaseServerConfigured() ? "healthy" : "degraded", isSupabaseServerConfigured() ? "Supabase server configuration detected." : "Supabase server configuration is incomplete.", {}, now),
    check("providers", providerStatus, "Provider registry health snapshot collected.", { providers: providerHealth }, now),
    check("knowledge", knowledgeProbe.status === "failed" ? "degraded" : "healthy", "Knowledge layer responded to health probe.", { status: knowledgeProbe.status, warnings: knowledgeProbe.warnings || [] }, now),
    check("copilot", "healthy", "Copilot session layer is available.", { sessionCount: listSessions({ projectId: "health-check", ownerId: "health-check" }).length }, now),
    check("storage", "healthy", "In-memory runtime storage helpers are available.", { cache: cacheStats() }, now)
  ];
  const status = overallStatus(checks);
  return Object.freeze({
    status,
    checkedAt: now.toISOString(),
    checks: Object.freeze(checks),
    warnings: Object.freeze(checks.filter((item) => item.status !== "healthy").map((item) => item.message))
  });
}
