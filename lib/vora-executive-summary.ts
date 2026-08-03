import { canonicalConstructionWorkflow } from "@/lib/analysis-hardening";
import {
  calculateOverallConfidence,
  calculateProjectHealth,
  createProjectIntelligenceSession,
  type ProjectHealthStatus,
  type ProjectIntelligenceAnalysis,
  type ProjectIntelligenceAnalysisType,
  type ProjectIntelligenceSession
} from "@/lib/project-intelligence";
import {
  executeVoraIntelligence,
  executeVoraIntelligenceSafe,
  type VoraIntelligenceExecutionRequest,
  type VoraIntelligenceExecutionWarning,
  type VoraNormalizedIntelligenceResponse
} from "@/lib/vora-intelligence-service";

export type ExecutiveSummarySourceType = Exclude<ProjectIntelligenceAnalysisType, "executive_summary">;

export type ExecutiveSummaryRequest = Readonly<{
  projectId: string;
  projectTitle?: string;
  projectStatus?: string;
  organizationName?: string;
  analyses?: readonly ProjectIntelligenceAnalysis[];
}>;

export type ExecutiveSummaryInput = Readonly<
  Omit<VoraIntelligenceExecutionRequest, "taskIntent" | "userRequest"> & {
    executiveSummaryRequest?: ExecutiveSummaryRequest;
    session?: ProjectIntelligenceSession;
    reviewerNotes?: string;
  }
>;

export type ExecutiveSummaryCoverage = Readonly<{
  completedAnalyses: number;
  expectedAnalyses: number;
  missingAnalyses: readonly ProjectIntelligenceAnalysisType[];
  availableAnalyses: readonly ProjectIntelligenceAnalysisType[];
  coveragePercentage: number;
  label: string;
}>;

export type ExecutiveSummaryPreparation = Readonly<{
  valid: boolean;
  errors: readonly Readonly<{ code: "missing_project" | "missing_analyses"; message: string }>[];
  warnings: readonly VoraIntelligenceExecutionWarning[];
  session?: ProjectIntelligenceSession;
  availableAnalyses: readonly ProjectIntelligenceAnalysis[];
  outstandingAnalyses: readonly ProjectIntelligenceAnalysis[];
  coverage: ExecutiveSummaryCoverage;
  projectHealth: ProjectHealthStatus;
  overallConfidence: number;
  userRequest?: string;
}>;

export type ExecutiveSummaryStructuredResult = Readonly<{
  executiveOverview: string;
  projectHealth: ProjectHealthStatus;
  completedAnalyses: readonly ProjectIntelligenceAnalysis[];
  outstandingAnalyses: readonly ProjectIntelligenceAnalysis[];
  topFindings: readonly string[];
  topRisks: readonly string[];
  planningStatus: string;
  siteStatus: string;
  documentationStatus: string;
  priorityActions: readonly string[];
  recommendedNextSteps: readonly string[];
  overallConfidence: number;
  warnings: readonly VoraIntelligenceExecutionWarning[];
  analysisCoverage: ExecutiveSummaryCoverage;
}>;

export type ExecutiveSummaryResponse = VoraNormalizedIntelligenceResponse &
  Readonly<{
    executiveSummary?: ExecutiveSummaryStructuredResult;
  }>;

const expectedAnalysisOrder: readonly ProjectIntelligenceAnalysisType[] = canonicalConstructionWorkflow.map((stage) => stage.id);

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const property of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[property];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function warning(code: string, message: string, severity: VoraIntelligenceExecutionWarning["severity"] = "warning"): VoraIntelligenceExecutionWarning {
  return { code, message, severity };
}

function analysisLabel(type: ProjectIntelligenceAnalysisType) {
  return type.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function calculateExecutiveSummaryCoverage(analyses: readonly ProjectIntelligenceAnalysis[]): ExecutiveSummaryCoverage {
  const completedTypes = new Set(analyses.filter((analysis) => analysis.status === "completed").map((analysis) => analysis.type));
  const availableAnalyses = expectedAnalysisOrder.filter((type) => completedTypes.has(type));
  const missingAnalyses = expectedAnalysisOrder.filter((type) => !completedTypes.has(type));
  const completedAnalyses = availableAnalyses.length;
  const expectedAnalyses = expectedAnalysisOrder.length;
  const coveragePercentage = Math.round((completedAnalyses / expectedAnalyses) * 100);
  return deepFreeze({
    completedAnalyses,
    expectedAnalyses,
    missingAnalyses,
    availableAnalyses,
    coveragePercentage,
    label: `${completedAnalyses} of ${expectedAnalyses} analyses completed`
  });
}

function createSession(input: ExecutiveSummaryInput) {
  if (input.session) return input.session;
  const request = input.executiveSummaryRequest;
  if (!request?.projectId) return undefined;
  return createProjectIntelligenceSession({
    projectId: request.projectId,
    projectTitle: request.projectTitle,
    projectStatus: request.projectStatus,
    organizationName: request.organizationName,
    analyses: request.analyses,
    now: input.now
  });
}

function summarizeAnalysis(analysis: ProjectIntelligenceAnalysis) {
  return [
    `${analysis.title}: ${analysis.status}`,
    analysis.summary ? `Summary: ${analysis.summary}` : "",
    typeof analysis.confidence === "number" ? `Confidence: ${analysis.confidence}%` : "",
    typeof analysis.riskCount === "number" ? `Risks: ${analysis.riskCount}` : "",
    typeof analysis.highPriorityRiskCount === "number" ? `High priority risks: ${analysis.highPriorityRiskCount}` : ""
  ].filter(Boolean).join(" | ");
}

function buildRuntimeRequest(input: {
  session: ProjectIntelligenceSession;
  availableAnalyses: readonly ProjectIntelligenceAnalysis[];
  outstandingAnalyses: readonly ProjectIntelligenceAnalysis[];
  coverage: ExecutiveSummaryCoverage;
  projectHealth: ProjectHealthStatus;
  confidence: number;
  reviewerNotes?: string;
}) {
  return [
    "Create an executive construction intelligence summary using only available project analyses.",
    "",
    "Important rules:",
    "- Do not invent findings.",
    "- Do not invent project status.",
    "- Do not invent risks.",
    "- Summarize only analyses marked completed or explicitly supplied.",
    "- Clearly list missing analyses as outstanding evidence.",
    "- Recommendations must come only from existing summaries, risk counts, and missing analysis status.",
    "",
    "Required output sections:",
    "- Executive Overview",
    "- Project Health",
    "- Completed Analyses",
    "- Outstanding Analyses",
    "- Top Findings",
    "- Top Risks",
    "- Planning Status",
    "- Site Status",
    "- Documentation Status",
    "- Priority Actions",
    "- Recommended Next Steps",
    "- Overall Confidence",
    "- Warnings",
    "- Analysis Coverage",
    "",
    `Project: ${input.session.project.title}`,
    `Project ID: ${input.session.project.id}`,
    `Organization: ${input.session.project.organizationName || "Unavailable"}`,
    `Project health: ${input.projectHealth}`,
    `Overall confidence: ${input.confidence}%`,
    `Coverage: ${input.coverage.label}`,
    `Available analyses: ${input.availableAnalyses.map(summarizeAnalysis).join("\n")}`,
    `Outstanding analyses: ${input.outstandingAnalyses.map((analysis) => `${analysis.title}: ${analysis.status}`).join("\n")}`,
    input.reviewerNotes ? `Reviewer notes: ${input.reviewerNotes}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export function deriveExecutiveSummaryRecommendations(preparation: ExecutiveSummaryPreparation): readonly string[] {
  const actions: string[] = [];
  if (preparation.coverage.missingAnalyses.length) {
    actions.push(`Complete outstanding analyses: ${preparation.coverage.missingAnalyses.map(analysisLabel).join(", ")}.`);
  }
  if (preparation.projectHealth === "High Risk" || preparation.projectHealth === "Attention Required") {
    actions.push("Review high-priority risk evidence with the project leadership team before decisions.");
  }
  if (preparation.availableAnalyses.some((analysis) => analysis.type === "planning_review")) {
    actions.push("Use completed planning findings to confirm next execution actions.");
  }
  if (preparation.availableAnalyses.some((analysis) => analysis.type === "site_report_review")) {
    actions.push("Use completed site report findings to close field follow-up items.");
  }
  if (!actions.length) actions.push("Maintain the current review cadence and update the executive summary when new analyses are completed.");
  return deepFreeze(actions);
}

export async function prepareExecutiveSummary(input: ExecutiveSummaryInput): Promise<ExecutiveSummaryPreparation> {
  const session = createSession(input);
  if (!session) {
    return {
      valid: false,
      errors: [{ code: "missing_project", message: "A Project Intelligence Session or project ID is required." }],
      warnings: [],
      availableAnalyses: [],
      outstandingAnalyses: [],
      coverage: calculateExecutiveSummaryCoverage([]),
      projectHealth: "Needs Review",
      overallConfidence: 0
    };
  }

  const availableAnalyses = session.analyses.filter((analysis) => analysis.status === "completed");
  const outstandingAnalyses = session.analyses.filter((analysis) => analysis.status !== "completed");
  const coverage = calculateExecutiveSummaryCoverage(session.analyses);
  const projectHealth = calculateProjectHealth(session.analyses);
  const overallConfidence = calculateOverallConfidence(session.analyses);
  const warnings: VoraIntelligenceExecutionWarning[] = [];

  if (!availableAnalyses.length) {
    return {
      valid: false,
      errors: [{ code: "missing_analyses", message: "At least one completed analysis is required before creating an Executive Summary." }],
      warnings: [warning("missing_analyses", "No completed Construction Intelligence analyses are available to summarize.", "critical")],
      session,
      availableAnalyses,
      outstandingAnalyses,
      coverage,
      projectHealth,
      overallConfidence
    };
  }

  if (coverage.missingAnalyses.length) warnings.push(warning("incomplete_analysis_coverage", `${coverage.label}. Missing: ${coverage.missingAnalyses.map(analysisLabel).join(", ")}.`, "warning"));

  return deepFreeze({
    valid: true,
    errors: [],
    warnings,
    session,
    availableAnalyses,
    outstandingAnalyses,
    coverage,
    projectHealth,
    overallConfidence,
    userRequest: buildRuntimeRequest({
      session,
      availableAnalyses,
      outstandingAnalyses,
      coverage,
      projectHealth,
      confidence: overallConfidence,
      reviewerNotes: input.reviewerNotes
    })
  });
}

function textFromUnknownItems(value: readonly unknown[] | undefined, fallback: string): readonly string[] {
  if (!value?.length) return [fallback];
  const mapped = value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return String(record.title || record.label || record.description || record.summary || "").trim();
    }
    return "";
  }).filter(Boolean);
  return mapped.length ? mapped : [fallback];
}

export function createExecutiveSummaryStructuredResult(
  response: VoraNormalizedIntelligenceResponse,
  preparation: ExecutiveSummaryPreparation
): ExecutiveSummaryStructuredResult {
  const planning = preparation.availableAnalyses.find((analysis) => analysis.type === "planning_review");
  const site = preparation.availableAnalyses.find((analysis) => analysis.type === "site_report_review");
  const documentationSources = preparation.availableAnalyses.filter((analysis) => ["contract_review", "boq_review", "site_report_review"].includes(analysis.type));
  return deepFreeze({
    executiveOverview: response.summary || `Executive summary prepared from ${preparation.coverage.label}.`,
    projectHealth: preparation.projectHealth,
    completedAnalyses: preparation.availableAnalyses,
    outstandingAnalyses: preparation.outstandingAnalyses,
    topFindings: preparation.availableAnalyses.map((analysis) => analysis.summary || `${analysis.title} is completed.`),
    topRisks: preparation.availableAnalyses
      .filter((analysis) => (analysis.riskCount || 0) > 0 || (analysis.highPriorityRiskCount || 0) > 0)
      .map((analysis) => `${analysis.title}: ${analysis.highPriorityRiskCount || 0} high-priority risk(s), ${analysis.riskCount || 0} total risk(s).`),
    planningStatus: planning?.summary || "Planning Review is not completed in the supplied evidence.",
    siteStatus: site?.summary || "Site Report Review is not completed in the supplied evidence.",
    documentationStatus: documentationSources.length ? `${documentationSources.length} documentation-related analysis source(s) are available.` : "Documentation status is limited because no documentation-related analysis is completed.",
    priorityActions: deriveExecutiveSummaryRecommendations(preparation),
    recommendedNextSteps: textFromUnknownItems(response.recommendations, "Complete missing analyses and refresh the executive summary before final decisions."),
    overallConfidence: preparation.overallConfidence,
    warnings: [...preparation.warnings, ...response.warnings],
    analysisCoverage: preparation.coverage
  });
}

export async function executeExecutiveSummary(input: ExecutiveSummaryInput): Promise<ExecutiveSummaryResponse> {
  const preparation = await prepareExecutiveSummary(input);
  const now = input.now || new Date();
  if (!preparation.valid || !preparation.userRequest) {
    return {
      id: `executive_summary_error_${now.toISOString().replace(/[^0-9]/g, "")}`,
      status: "failed",
      taskIntent: "executive_summary",
      reasoningType: "general_assistance",
      warnings: preparation.warnings,
      errors: preparation.errors,
      confidence: { providerResponse: "placeholder" },
      usedMock: false,
      executionMetadata: {
        usedMock: false,
        taskIntent: "executive_summary",
        reasoningType: "general_assistance",
        reportType: "executive_summary",
        createdAt: now.toISOString()
      },
      createdAt: now.toISOString()
    };
  }

  const response = await executeVoraIntelligence({
    ...input,
    userRequest: preparation.userRequest,
    taskIntent: "executive_summary",
    projectId: preparation.session?.project.id || input.projectId,
    outputPreferences: {
      language: input.outputPreferences?.language || input.language || "ar",
      tone: input.outputPreferences?.tone || "executive",
      responseFormat: input.outputPreferences?.responseFormat || "markdown",
      includeRecommendations: true,
      includeSources: true,
      ...input.outputPreferences
    }
  });

  return {
    ...response,
    warnings: [...preparation.warnings, ...response.warnings],
    executiveSummary: createExecutiveSummaryStructuredResult(response, preparation)
  };
}

export async function executeExecutiveSummarySafe(input: ExecutiveSummaryInput): Promise<ExecutiveSummaryResponse> {
  try {
    return await executeExecutiveSummary(input);
  } catch (error) {
    const fallback = await executeVoraIntelligenceSafe({
      userRequest: "Executive Summary failed before runtime execution.",
      taskIntent: "executive_summary",
      provider: input.provider,
      projectId: input.projectId || input.executiveSummaryRequest?.projectId,
      organizationId: input.organizationId,
      now: input.now
    });
    return {
      ...fallback,
      status: "failed",
      errors: [
        ...fallback.errors,
        {
          code: "executive_summary_failed",
          message: error instanceof Error ? error.message : "Executive Summary failed safely."
        }
      ]
    };
  }
}
