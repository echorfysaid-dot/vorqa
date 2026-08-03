import type { ProjectHealthStatus, ProjectIntelligenceAnalysis, ProjectIntelligenceAnalysisType } from "@/lib/project-intelligence";

export type AnalysisValidationCode =
  | "missing_input"
  | "empty_input"
  | "unsupported_format"
  | "placeholder_only_format"
  | "file_too_large"
  | "invalid_request_payload"
  | "missing_project"
  | "missing_analysis_evidence"
  | "provider_failure"
  | "runtime_failure"
  | "malformed_normalized_result";

export type NormalizedSafeError = Readonly<{
  code: string;
  message: string;
  retryable: boolean;
  details?: string;
}>;

export type AnalysisErrorResponse = Readonly<{
  ok: false;
  error: NormalizedSafeError;
  code: string;
  errors: readonly Readonly<{ code: string; message: string }>[];
}>;

export type ConfidenceDisplay = Readonly<{
  label: string;
  value?: number;
  tone: "success" | "warning" | "danger" | "neutral";
  isLimited: boolean;
}>;

export type HealthDisplay = Readonly<{
  label: ProjectHealthStatus;
  tone: "success" | "warning" | "danger" | "gold";
  description: string;
}>;

export type ExportReadyReportSection = Readonly<{
  id: string;
  title: string;
  content: readonly string[];
}>;

export type ExportReadyReport = Readonly<{
  title: string;
  projectId?: string;
  projectTitle?: string;
  generatedAt: string;
  source: "contract_review" | "boq_review" | "risk_assessment" | "planning_review" | "site_report_review" | "executive_summary" | "project_intelligence";
  sections: readonly ExportReadyReportSection[];
  warnings: readonly string[];
}>;

export const canonicalConstructionWorkflow = [
  { id: "contract_review", title: "Contract Review", route: "/tools/contract-review" },
  { id: "boq_review", title: "BOQ Review", route: "/tools/boq-review" },
  { id: "risk_assessment", title: "Risk Assessment", route: "/tools/risk-assessment" },
  { id: "planning_review", title: "Planning Review", route: "/tools/planning-review" },
  { id: "site_report_review", title: "Site Report Review", route: "/tools/site-report-review" },
  { id: "executive_summary", title: "Executive Summary", route: "/tools/executive-summary" }
] as const satisfies readonly Readonly<{ id: ProjectIntelligenceAnalysisType; title: string; route: string }>[];

export function createSafeError(code: string, message: string, retryable = false, details?: string): NormalizedSafeError {
  return Object.freeze({
    code,
    message,
    retryable,
    ...(details ? { details } : {})
  });
}

export function createErrorResponse(error: NormalizedSafeError): AnalysisErrorResponse {
  return Object.freeze({
    ok: false,
    error,
    code: error.code,
    errors: [{ code: error.code, message: error.message }]
  });
}

export function mapHttpErrorRetryable(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

export function formatConfidence(value: number | undefined, evidenceCount = 0): ConfidenceDisplay {
  if (typeof value !== "number" || !Number.isFinite(value) || evidenceCount <= 0) {
    return Object.freeze({ label: "Limited evidence", tone: "neutral", isLimited: true });
  }
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return Object.freeze({
    label: `${clamped}%`,
    value: clamped,
    tone: clamped >= 75 ? "success" : clamped >= 50 ? "warning" : "danger",
    isLimited: evidenceCount < 2
  });
}

export function formatHealth(health: ProjectHealthStatus): HealthDisplay {
  const map: Record<ProjectHealthStatus, HealthDisplay> = {
    Healthy: { label: "Healthy", tone: "success", description: "Current available evidence does not indicate major review pressure." },
    "Needs Review": { label: "Needs Review", tone: "gold", description: "Some evidence is missing or requires manual review." },
    "Attention Required": { label: "Attention Required", tone: "warning", description: "Available evidence contains risks or low-confidence signals." },
    "High Risk": { label: "High Risk", tone: "danger", description: "Available evidence contains high-priority risk or low-confidence signals." }
  };
  return Object.freeze(map[health]);
}

export function validateWorkflowCoverage(analysisTypes: readonly ProjectIntelligenceAnalysisType[]) {
  const supplied = new Set(analysisTypes);
  const missing = canonicalConstructionWorkflow.filter((stage) => !supplied.has(stage.id)).map((stage) => stage.id);
  return Object.freeze({
    valid: missing.length === 0,
    missing,
    stageCount: canonicalConstructionWorkflow.length
  });
}

export function createExportReadyReport(input: {
  title: string;
  source: ExportReadyReport["source"];
  sections: readonly Readonly<{ id: string; title: string; content?: string | readonly string[] }>[];
  projectId?: string;
  projectTitle?: string;
  warnings?: readonly string[];
  generatedAt?: Date;
}): ExportReadyReport {
  return Object.freeze({
    title: input.title,
    projectId: input.projectId,
    projectTitle: input.projectTitle,
    generatedAt: (input.generatedAt || new Date()).toISOString(),
    source: input.source,
    sections: input.sections.map((section) => Object.freeze({
      id: section.id,
      title: section.title,
      content: Array.isArray(section.content) ? section.content.filter(Boolean) : [section.content || "No content available."]
    })),
    warnings: input.warnings || []
  });
}

export function createAnalysisCoverageLabel(completed: number, expected = canonicalConstructionWorkflow.length) {
  const safeExpected = Math.max(1, expected);
  const safeCompleted = Math.max(0, Math.min(safeExpected, completed));
  return Object.freeze({
    completed: safeCompleted,
    expected: safeExpected,
    percentage: Math.round((safeCompleted / safeExpected) * 100),
    label: `${safeCompleted} of ${safeExpected} analyses completed`
  });
}

export function summarizeCompletedEvidence(analyses: readonly ProjectIntelligenceAnalysis[]) {
  return analyses
    .filter((analysis) => analysis.status === "completed")
    .map((analysis) => analysis.summary || `${analysis.title} completed.`)
    .filter(Boolean);
}
