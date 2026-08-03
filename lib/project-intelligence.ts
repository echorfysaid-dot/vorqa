import { canonicalConstructionWorkflow } from "@/lib/analysis-hardening";
import { knowledgeEngine } from "@/lib/knowledge-engine";
import { listProjectAnalyses, listProjectAnalysesAsync } from "@/lib/project-analysis-storage";
import { analysisRecordToProjectIntelligenceAnalysis } from "@/lib/project-session";
import type { ParsedConstructionDocument } from "@/lib/document-types";
import type { KnowledgeSearchResponse } from "@/types/knowledge";

export type ProjectIntelligenceAnalysisType =
  | "contract_review"
  | "boq_review"
  | "risk_assessment"
  | "planning_review"
  | "site_report_review"
  | "executive_summary";

export type ProjectIntelligenceAnalysisStatus = "completed" | "pending" | "not_started";
export type ProjectHealthStatus = "Healthy" | "Needs Review" | "Attention Required" | "High Risk";

export type ProjectIntelligenceAnalysis = Readonly<{
  type: ProjectIntelligenceAnalysisType;
  title: string;
  status: ProjectIntelligenceAnalysisStatus;
  summary?: string;
  confidence?: number;
  riskCount?: number;
  highPriorityRiskCount?: number;
  completedAt?: string;
  href?: string;
}>;

export type ProjectIntelligenceTimelineEvent = Readonly<{
  id: string;
  title: string;
  type: ProjectIntelligenceAnalysisType;
  status: ProjectIntelligenceAnalysisStatus;
  occurredAt?: string;
  description: string;
}>;

export type ProjectIntelligenceSession = Readonly<{
  id: string;
  project: Readonly<{
    id: string;
    title: string;
    status?: string;
    organizationName?: string;
    updatedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  analysisCount: number;
  availableFeatures: readonly ProjectIntelligenceAnalysisType[];
  currentStatus: "ready" | "in_progress" | "needs_input";
  overallConfidence: number;
  overallHealth: ProjectHealthStatus;
  analyses: readonly ProjectIntelligenceAnalysis[];
  completedAnalyses: readonly ProjectIntelligenceAnalysis[];
  pendingAnalyses: readonly ProjectIntelligenceAnalysis[];
  detectedRisks: number;
  highPriorityRisks: number;
  parsedDocuments: readonly ParsedConstructionDocument[];
  recentActivity: readonly ProjectIntelligenceTimelineEvent[];
}>;

export type ProjectIntelligenceInput = Readonly<{
  projectId: string;
  projectTitle?: string;
  projectStatus?: string;
  organizationName?: string;
  updatedAt?: string;
  analyses?: readonly ProjectIntelligenceAnalysis[];
  parsedDocuments?: readonly ParsedConstructionDocument[];
  token?: string;
  now?: Date;
}>;

const defaultFeatureOrder: readonly ProjectIntelligenceAnalysisType[] = canonicalConstructionWorkflow.map((stage) => stage.id);

const analysisLabels: Record<ProjectIntelligenceAnalysisType, string> = {
  contract_review: "Contract Review",
  boq_review: "BOQ Review",
  risk_assessment: "Risk Assessment",
  planning_review: "Planning Review",
  site_report_review: "Site Report Review",
  executive_summary: "Executive Summary"
};

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const property of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[property];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
}

export function createDefaultProjectIntelligenceAnalyses(projectId: string, now: Date): readonly ProjectIntelligenceAnalysis[] {
  const baseDate = now.toISOString();
  const existingFeatureHref = (path: string) => `/tools/${path}`;
  const isDemoProject = projectId.toUpperCase() === "PRJ-1048" || projectId.toLowerCase().includes("villa");

  return deepFreeze([
    {
      type: "contract_review",
      title: "Contract Review",
      status: isDemoProject ? "completed" : "pending",
      summary: isDemoProject ? "Contract review is available for project-level context." : undefined,
      confidence: isDemoProject ? 72 : undefined,
      riskCount: isDemoProject ? 2 : 0,
      highPriorityRiskCount: isDemoProject ? 1 : 0,
      completedAt: isDemoProject ? baseDate : undefined,
      href: existingFeatureHref("contract-review")
    },
    {
      type: "boq_review",
      title: "BOQ Review",
      status: isDemoProject ? "completed" : "pending",
      summary: isDemoProject ? "BOQ review is available for cost and quantity risk context." : undefined,
      confidence: isDemoProject ? 78 : undefined,
      riskCount: isDemoProject ? 3 : 0,
      highPriorityRiskCount: isDemoProject ? 1 : 0,
      completedAt: isDemoProject ? baseDate : undefined,
      href: existingFeatureHref("boq-review")
    },
    {
      type: "risk_assessment",
      title: "Risk Assessment",
      status: isDemoProject ? "completed" : "pending",
      summary: isDemoProject ? "Risk assessment combines available Contract and BOQ findings." : undefined,
      confidence: isDemoProject ? 74 : undefined,
      riskCount: isDemoProject ? 5 : 0,
      highPriorityRiskCount: isDemoProject ? 2 : 0,
      completedAt: isDemoProject ? baseDate : undefined,
      href: existingFeatureHref("risk-assessment")
    },
    {
      type: "planning_review",
      title: "Planning Review",
      status: isDemoProject ? "completed" : "pending",
      summary: isDemoProject ? "Planning review is available for delivery-readiness context." : "Planning Review is ready to attach schedule and activity-list findings to this session.",
      confidence: isDemoProject ? 76 : undefined,
      riskCount: isDemoProject ? 1 : 0,
      highPriorityRiskCount: isDemoProject ? 0 : 0,
      completedAt: isDemoProject ? baseDate : undefined,
      href: existingFeatureHref("planning-review")
    },
    {
      type: "site_report_review",
      title: "Site Report Review",
      status: isDemoProject ? "completed" : "pending",
      summary: isDemoProject ? "Site report review is available for field execution and follow-up context." : "Site Report Review is ready to attach field-report observations and follow-up gaps to this session.",
      confidence: isDemoProject ? 73 : undefined,
      riskCount: isDemoProject ? 2 : 0,
      highPriorityRiskCount: isDemoProject ? 0 : 0,
      completedAt: isDemoProject ? baseDate : undefined,
      href: existingFeatureHref("site-report-review")
    },
    {
      type: "executive_summary",
      title: "Executive Summary",
      status: isDemoProject ? "completed" : "pending",
      summary: isDemoProject ? "Latest executive summary is available from completed Construction Intelligence analyses." : "Executive Summary is ready once project analyses are available.",
      confidence: isDemoProject ? 75 : undefined,
      riskCount: isDemoProject ? 0 : 0,
      highPriorityRiskCount: isDemoProject ? 0 : 0,
      completedAt: isDemoProject ? baseDate : undefined,
      href: existingFeatureHref("executive-summary")
    }
  ]);
}

export function calculateProjectHealth(analyses: readonly ProjectIntelligenceAnalysis[]): ProjectHealthStatus {
  const completed = analyses.filter((analysis) => analysis.status === "completed");
  if (!completed.length) return "Needs Review";

  const highPriorityRisks = completed.reduce((sum, analysis) => sum + (analysis.highPriorityRiskCount || 0), 0);
  const riskCount = completed.reduce((sum, analysis) => sum + (analysis.riskCount || 0), 0);
  const lowestConfidence = Math.min(...completed.map((analysis) => analysis.confidence ?? 100));

  if (highPriorityRisks >= 3 || lowestConfidence < 45) return "High Risk";
  if (highPriorityRisks > 0 || riskCount >= 5) return "Attention Required";
  if (riskCount > 0 || lowestConfidence < 70 || analyses.some((analysis) => analysis.status === "pending")) return "Needs Review";
  return "Healthy";
}

export function calculateOverallConfidence(analyses: readonly ProjectIntelligenceAnalysis[]) {
  const completed = analyses.filter((analysis) => analysis.status === "completed" && typeof analysis.confidence === "number");
  if (!completed.length) return 0;
  return Math.round(completed.reduce((sum, analysis) => sum + (analysis.confidence || 0), 0) / completed.length);
}

export function createProjectIntelligenceTimeline(analyses: readonly ProjectIntelligenceAnalysis[]): readonly ProjectIntelligenceTimelineEvent[] {
  return deepFreeze(
    [...analyses]
      .sort((left, right) => {
        const leftIndex = defaultFeatureOrder.indexOf(left.type);
        const rightIndex = defaultFeatureOrder.indexOf(right.type);
        if (left.status === "completed" && right.status !== "completed") return -1;
        if (left.status !== "completed" && right.status === "completed") return 1;
        return leftIndex - rightIndex;
      })
      .map((analysis, index) => ({
        id: `event-${index + 1}-${analysis.type}`,
        title: `${analysisLabels[analysis.type]} ${analysis.status === "completed" ? "completed" : analysis.status === "pending" ? "pending" : "planned"}`,
        type: analysis.type,
        status: analysis.status,
        occurredAt: analysis.completedAt,
        description: analysis.summary || `${analysisLabels[analysis.type]} will attach to this Project Intelligence Session when available.`
      }))
  );
}


function createPersistedProjectIntelligenceAnalyses(projectId: string): readonly ProjectIntelligenceAnalysis[] {
  try {
    const latestByType = new Map<ProjectIntelligenceAnalysisType, ReturnType<typeof listProjectAnalyses>[number]>();
    for (const record of listProjectAnalyses(projectId)) {
      const previous = latestByType.get(record.toolType);
      if (!previous || record.version > previous.version) latestByType.set(record.toolType, record);
    }
    return deepFreeze(defaultFeatureOrder.flatMap((type) => {
      const record = latestByType.get(type);
      return record ? [analysisRecordToProjectIntelligenceAnalysis(record)] : [];
    }));
  } catch {
    return deepFreeze([]);
  }
}

function mergeProjectIntelligenceAnalyses(defaults: readonly ProjectIntelligenceAnalysis[], persisted: readonly ProjectIntelligenceAnalysis[]) {
  const byType = new Map<ProjectIntelligenceAnalysisType, ProjectIntelligenceAnalysis>();
  for (const analysis of defaults) byType.set(analysis.type, analysis);
  for (const analysis of persisted) byType.set(analysis.type, analysis);
  return deepFreeze(defaultFeatureOrder.flatMap((type) => {
    const analysis = byType.get(type);
    return analysis ? [analysis] : [];
  }));
}

async function createPersistedProjectIntelligenceAnalysesAsync(projectId: string, token?: string): Promise<readonly ProjectIntelligenceAnalysis[]> {
  try {
    const latestByType = new Map<ProjectIntelligenceAnalysisType, Awaited<ReturnType<typeof listProjectAnalysesAsync>>[number]>();
    for (const record of await listProjectAnalysesAsync(projectId, undefined, token)) {
      const previous = latestByType.get(record.toolType);
      if (!previous || record.version > previous.version) latestByType.set(record.toolType, record);
    }
    return deepFreeze(defaultFeatureOrder.flatMap((type) => {
      const record = latestByType.get(type);
      return record ? [analysisRecordToProjectIntelligenceAnalysis(record)] : [];
    }));
  } catch {
    return deepFreeze([]);
  }
}

export async function createProjectIntelligenceSessionAsync(input: ProjectIntelligenceInput): Promise<ProjectIntelligenceSession> {
  if (input.analyses?.length) return createProjectIntelligenceSession(input);
  const now = input.now || new Date();
  const defaults = createDefaultProjectIntelligenceAnalyses(input.projectId, now);
  const persisted = await createPersistedProjectIntelligenceAnalysesAsync(input.projectId, input.token);
  return createProjectIntelligenceSession({
    ...input,
    analyses: persisted.length ? mergeProjectIntelligenceAnalyses(defaults, persisted) : defaults
  });
}

export function createProjectIntelligenceSession(input: ProjectIntelligenceInput): ProjectIntelligenceSession {
  const now = input.now || new Date();
  const defaultAnalyses = createDefaultProjectIntelligenceAnalyses(input.projectId, now);
  const persistedAnalyses = input.analyses?.length ? [] : createPersistedProjectIntelligenceAnalyses(input.projectId);
  const analyses = input.analyses?.length ? input.analyses : persistedAnalyses.length ? mergeProjectIntelligenceAnalyses(defaultAnalyses, persistedAnalyses) : defaultAnalyses;
  const completedAnalyses = analyses.filter((analysis) => analysis.status === "completed");
  const pendingAnalyses = analyses.filter((analysis) => analysis.status !== "completed");
  const detectedRisks = completedAnalyses.reduce((sum, analysis) => sum + (analysis.riskCount || 0), 0);
  const highPriorityRisks = completedAnalyses.reduce((sum, analysis) => sum + (analysis.highPriorityRiskCount || 0), 0);
  const overallConfidence = calculateOverallConfidence(analyses);
  const overallHealth = calculateProjectHealth(analyses);
  const updatedAt = input.updatedAt || completedAnalyses.map((analysis) => analysis.completedAt).filter(Boolean).sort().at(-1) || now.toISOString();

  return deepFreeze({
    id: `pis-${slug(input.projectId)}`,
    project: {
      id: input.projectId,
      title: input.projectTitle || input.projectId,
      status: input.projectStatus,
      organizationName: input.organizationName,
      updatedAt
    },
    createdAt: completedAnalyses.map((analysis) => analysis.completedAt).filter(Boolean).sort()[0] || now.toISOString(),
    updatedAt,
    analysisCount: completedAnalyses.length,
    availableFeatures: defaultFeatureOrder,
    currentStatus: completedAnalyses.length ? "ready" : "needs_input",
    overallConfidence,
    overallHealth,
    analyses,
    completedAnalyses,
    pendingAnalyses,
    detectedRisks,
    highPriorityRisks,
    parsedDocuments: input.parsedDocuments || [],
    recentActivity: createProjectIntelligenceTimeline(analyses)
  });
}

export async function retrieveProjectKnowledge(projectId: string, query: string, limit = 5): Promise<KnowledgeSearchResponse> {
  try {
    return await knowledgeEngine.search({ projectId, query, limit });
  } catch (error) {
    return Object.freeze({
      ok: false,
      projectId,
      query,
      results: [],
      status: "failed" as const,
      warnings: [error instanceof Error ? error.message : "Project knowledge retrieval failed."]
    });
  }
}





