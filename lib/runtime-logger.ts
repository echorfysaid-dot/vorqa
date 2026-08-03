import type { RuntimeError, RuntimeErrorCategory, RuntimeLogEntry } from "@/types/runtime-health";

const logs: RuntimeLogEntry[] = [];
const sensitivePattern = /(token|secret|password|apikey|api_key|authorization|openai|service_role)/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [
    key,
    sensitivePattern.test(key) ? "[REDACTED]" : redact(item)
  ]));
}

export function createRequestId(prefix = "req", now = new Date()) {
  return `${prefix}-${now.toISOString().replace(/[^0-9]/g, "")}`;
}

export function logRuntimeEvent(input: Omit<RuntimeLogEntry, "timestamp" | "metadata"> & { metadata?: Readonly<Record<string, unknown>>; timestamp?: string }): RuntimeLogEntry {
  const entry: RuntimeLogEntry = Object.freeze({
    timestamp: input.timestamp || new Date().toISOString(),
    requestId: input.requestId,
    projectId: input.projectId,
    ownerId: input.ownerId,
    operation: input.operation,
    duration: Math.max(0, Math.round(input.duration)),
    provider: input.provider,
    status: input.status,
    warnings: Object.freeze([...(input.warnings || [])]),
    metadata: Object.freeze((redact(input.metadata || {}) || {}) as Record<string, unknown>)
  });
  logs.push(entry);
  return entry;
}

export function listRuntimeLogs(limit = 50): readonly RuntimeLogEntry[] {
  return Object.freeze(logs.slice(-Math.max(1, limit)));
}

export function normalizeRuntimeError(error: unknown, fallbackCategory: RuntimeErrorCategory = "Unknown"): RuntimeError {
  const message = error instanceof Error ? error.message : String(error || "Unknown runtime error.");
  const lower = message.toLowerCase();
  const category: RuntimeErrorCategory =
    /auth|login|credential/.test(lower) ? "Authentication" :
    /permission|forbidden|denied/.test(lower) ? "Authorization" :
    /rate|limit|too many/.test(lower) ? "RateLimit" :
    /provider|openai|gemini|anthropic|model/.test(lower) ? "Provider" :
    /storage|database|supabase/.test(lower) ? "Storage" :
    /invalid|required|validation/.test(lower) ? "Validation" :
    fallbackCategory;

  return Object.freeze({
    category,
    code: category.toUpperCase(),
    message,
    retryable: category === "Provider" || category === "Runtime" || category === "Storage" || category === "RateLimit"
  });
}

export function clearRuntimeLogs() {
  logs.length = 0;
}
