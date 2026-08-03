import { stats as cacheStats } from "@/lib/request-cache";
import type { PerformanceMetricSnapshot } from "@/types/runtime-health";

type MetricRecord = {
  count: number;
  totalLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  lastLatencyMs: number;
};

const metrics = new Map<string, MetricRecord>();

export function recordPerformanceMetric(operation: string, latencyMs: number) {
  const latency = Math.max(0, Math.round(latencyMs));
  const current = metrics.get(operation);
  if (!current) {
    metrics.set(operation, { count: 1, totalLatencyMs: latency, minLatencyMs: latency, maxLatencyMs: latency, lastLatencyMs: latency });
    return;
  }
  current.count += 1;
  current.totalLatencyMs += latency;
  current.minLatencyMs = Math.min(current.minLatencyMs, latency);
  current.maxLatencyMs = Math.max(current.maxLatencyMs, latency);
  current.lastLatencyMs = latency;
}

export function getPerformanceMetric(operation: string): PerformanceMetricSnapshot | undefined {
  const current = metrics.get(operation);
  if (!current) return undefined;
  return Object.freeze({
    operation,
    count: current.count,
    averageLatencyMs: Math.round(current.totalLatencyMs / current.count),
    minLatencyMs: current.minLatencyMs,
    maxLatencyMs: current.maxLatencyMs,
    lastLatencyMs: current.lastLatencyMs
  });
}

export function getPerformanceMetrics() {
  return Object.freeze({
    cache: cacheStats(),
    operations: Object.freeze([...metrics.keys()].sort().map((operation) => getPerformanceMetric(operation)).filter(Boolean) as PerformanceMetricSnapshot[])
  });
}

export function clearPerformanceMetrics() {
  metrics.clear();
}

export async function measurePerformance<T>(operation: string, callback: () => Promise<T>, now = Date.now): Promise<T> {
  const start = now();
  try {
    return await callback();
  } finally {
    recordPerformanceMetric(operation, now() - start);
  }
}
