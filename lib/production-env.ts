import { getDataSourceMode } from "@/lib/data-source";
import { isSupabaseConfigured } from "@/lib/supabase";

export type EnvironmentValidationIssue = {
  key: string;
  severity: "critical" | "warning";
  message: string;
};

export type EnvironmentValidationResult = {
  ok: boolean;
  mode: "development" | "production" | "test";
  appEnv: string;
  dataSource: string;
  issues: EnvironmentValidationIssue[];
};

function isPresent(key: string) {
  return Boolean(process.env[key]?.trim());
}

export function validateEnvironment(options: { strict?: boolean } = {}): EnvironmentValidationResult {
  const mode = (process.env.NODE_ENV || "development") as EnvironmentValidationResult["mode"];
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV || mode;
  const dataSource = getDataSourceMode();
  const productionLike = mode === "production" || appEnv === "production" || options.strict;
  const issues: EnvironmentValidationIssue[] = [];

  if (!isPresent("NEXT_PUBLIC_SUPABASE_URL")) {
    issues.push({ key: "NEXT_PUBLIC_SUPABASE_URL", severity: "critical", message: "Supabase URL is required for production authentication and data access." });
  }
  if (!isPresent("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
    issues.push({ key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", severity: "critical", message: "Supabase anon key is required for production authentication and RLS-backed access." });
  }
  if (productionLike && dataSource !== "demo" && !isPresent("SUPABASE_SERVICE_ROLE_KEY")) {
    issues.push({ key: "SUPABASE_SERVICE_ROLE_KEY", severity: "warning", message: "Server-side Supabase admin operations may be unavailable without a service-role key." });
  }
  if (productionLike && !isPresent("OPENAI_API_KEY")) {
    issues.push({ key: "OPENAI_API_KEY", severity: "warning", message: "VORA will use mock fallback until an OpenAI key is configured." });
  }
  if (productionLike && !isPresent("OPENAI_MODEL")) {
    issues.push({ key: "OPENAI_MODEL", severity: "warning", message: "VORA will use the default OpenAI model fallback." });
  }
  if (productionLike && dataSource === "demo") {
    issues.push({ key: "NEXT_PUBLIC_DATA_SOURCE", severity: "critical", message: "Production beta should use auto or supabase, not demo." });
  }
  if (process.env.RATE_LIMIT_PROVIDER === "upstash" && (!isPresent("UPSTASH_REDIS_REST_URL") || !isPresent("UPSTASH_REDIS_REST_TOKEN"))) {
    issues.push({ key: "RATE_LIMIT_PROVIDER", severity: "critical", message: "Upstash rate limiting requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN." });
  }
  if (productionLike && process.env.RATE_LIMIT_PROVIDER !== "upstash") {
    issues.push({ key: "RATE_LIMIT_PROVIDER", severity: "warning", message: "In-memory rate limiting is acceptable for local/staging smoke tests, but not multi-instance production." });
  }
  if (productionLike && !isPresent("NEXT_PUBLIC_SENTRY_DSN") && !isPresent("SENTRY_DSN")) {
    issues.push({ key: "SENTRY_DSN", severity: "warning", message: "Runtime error monitoring is not connected." });
  }

  const critical = issues.some((issue) => issue.severity === "critical");
  return {
    ok: !critical && (!productionLike || isSupabaseConfigured()),
    mode,
    appEnv,
    dataSource,
    issues
  };
}

export function assertProductionEnvironment() {
  const result = validateEnvironment({ strict: true });
  if (!result.ok) {
    const keys = result.issues.filter((issue) => issue.severity === "critical").map((issue) => issue.key).join(", ");
    throw new Error(`Production environment validation failed for: ${keys}`);
  }
  return result;
}
