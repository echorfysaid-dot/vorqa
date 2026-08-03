export type RuntimeHealthStatus = "healthy" | "degraded" | "unhealthy";
export type RuntimeErrorCategory =
  | "Validation"
  | "Authentication"
  | "Authorization"
  | "Provider"
  | "Runtime"
  | "Storage"
  | "RateLimit"
  | "Unknown";

export type RuntimeHealthCheck = Readonly<{
  name: "database" | "providers" | "knowledge" | "copilot" | "storage";
  status: RuntimeHealthStatus;
  message: string;
  checkedAt: string;
  metadata: Readonly<Record<string, unknown>>;
}>;

export type RuntimeHealthReport = Readonly<{
  status: RuntimeHealthStatus;
  checkedAt: string;
  checks: readonly RuntimeHealthCheck[];
  warnings: readonly string[];
}>;

export type RuntimeLogEntry = Readonly<{
  timestamp: string;
  requestId: string;
  projectId?: string;
  ownerId?: string;
  operation: string;
  duration: number;
  provider?: string;
  status: "success" | "failed" | "skipped";
  warnings: readonly string[];
  metadata: Readonly<Record<string, unknown>>;
}>;

export type PerformanceMetricSnapshot = Readonly<{
  operation: string;
  count: number;
  averageLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  lastLatencyMs: number;
}>;

export type RuntimeError = Readonly<{
  category: RuntimeErrorCategory;
  code: string;
  message: string;
  retryable: boolean;
}>;
