import { securityLogger } from "@/lib/security";

type MonitoringContext = Record<string, string | number | boolean | null | undefined>;

function monitoringEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
}

function safeContext(context: MonitoringContext = {}) {
  return Object.fromEntries(
    Object.entries(context).filter(([key]) => !/(token|secret|password|apikey|authorization|openai|service_role)/i.test(key))
  );
}

export const monitoring = {
  enabled: monitoringEnabled,
  captureError(error: unknown, context: MonitoringContext = {}) {
    const message = error instanceof Error ? error.message : String(error);
    securityLogger.error("monitoring.error", {
      enabled: monitoringEnabled(),
      message,
      ...safeContext(context)
    });
  },
  captureEvent(event: string, context: MonitoringContext = {}) {
    securityLogger.info("monitoring.event", {
      enabled: monitoringEnabled(),
      event,
      ...safeContext(context)
    });
  }
};
