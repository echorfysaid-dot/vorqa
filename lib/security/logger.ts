type LogLevel = "info" | "warn" | "error";

const sensitiveKeys = ["token", "access_token", "refresh_token", "authorization", "apikey", "apiKey", "password", "secret", "service_role", "OPENAI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, item]) => {
    acc[key] = sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase())) ? "[REDACTED]" : redact(item);
    return acc;
  }, {});
}

function write(level: LogLevel, event: string, metadata: Record<string, unknown> = {}) {
  const safeMetadata = redact(metadata) as Record<string, unknown>;
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    ...safeMetadata
  };
  const line = `[VORQA ${level.toUpperCase()}] ${JSON.stringify(payload)}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const securityLogger = {
  info(event: string, metadata?: Record<string, unknown>) {
    write("info", event, metadata);
  },
  warn(event: string, metadata?: Record<string, unknown>) {
    write("warn", event, metadata);
  },
  error(event: string, metadata?: Record<string, unknown>) {
    write("error", event, metadata);
  }
};

export function auditEvent(action: string, metadata: Record<string, unknown> = {}) {
  securityLogger.info(`audit.${action}`, metadata);
}
