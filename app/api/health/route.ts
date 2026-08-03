import { NextResponse } from "next/server";
import { getDataSourceMode } from "@/lib/data-source";
import { validateEnvironment } from "@/lib/production-env";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const environment = validateEnvironment();
  return NextResponse.json({
    status: environment.ok ? "ok" : "degraded",
    service: "vorqa-ai",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    dataSource: getDataSourceMode(),
    supabaseConfigured: isSupabaseConfigured(),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    monitoring: {
      sentryPrepared: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
      analyticsPrepared: Boolean(process.env.NEXT_PUBLIC_ANALYTICS_ID),
      otelPrepared: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT)
    },
    validation: {
      ok: environment.ok,
      appEnv: environment.appEnv,
      issueCount: environment.issues.length,
      issues: environment.issues.map((issue) => ({
        key: issue.key,
        severity: issue.severity,
        message: issue.message
      }))
    }
  });
}
