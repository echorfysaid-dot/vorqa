import { runRuntimeHealthChecks } from "@/lib/health-check";
import { getPerformanceMetrics } from "@/lib/performance-metrics";
import { listRuntimeLogs } from "@/lib/runtime-logger";

export async function getRuntimeMonitorSnapshot(now = new Date()) {
  const health = await runRuntimeHealthChecks(now);
  return Object.freeze({
    generatedAt: now.toISOString(),
    health,
    performance: getPerformanceMetrics(),
    logs: listRuntimeLogs(25)
  });
}
