import type { Document } from "@/lib/models/document";
import type { Project } from "@/lib/models/project";
import { getProjectAnalysisRegistryEntry } from "@/lib/project-analysis-registry";
import type { ProjectAnalysisProjectState, ProjectAnalysisRecord, ProjectAnalysisToolType } from "@/types/project-analysis";

export type ProjectEvidenceKind = "contract" | "boq" | "planning" | "site_report" | "document" | "analysis";
export type ProjectEvidenceAvailability = "available" | "metadata_only";

export type ProjectContextSummary = Readonly<{
  id: string;
  name: string;
  type?: string;
  location?: string;
  client?: string;
  contractor?: string;
  status?: string;
  phase?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  progress?: number;
  organizationName?: string;
}>;

export type ProjectEvidenceItem = Readonly<{
  id: string;
  kind: ProjectEvidenceKind;
  name: string;
  source: "document" | "analysis";
  createdAt?: string;
  status?: string;
  version?: string | number;
  availability: ProjectEvidenceAvailability;
  analysisStatus?: ProjectAnalysisRecord["status"];
  linkedAnalysisId?: string;
}>;

export type ProjectNextBestAction = Readonly<{
  type: "add_evidence" | "run_analysis" | "resume_analysis" | "generate_summary" | "complete";
  label: string;
  reason: string;
  route?: string;
  toolType?: ProjectAnalysisToolType;
}>;

export type ExecutiveSummaryGate = Readonly<{
  evidenceBacked: boolean;
  canGeneratePartial: boolean;
  completeness: number;
  missingAnalyses: readonly ProjectAnalysisToolType[];
}>;

export type ProjectIntelligenceWorkflowSnapshot = Readonly<{
  context: ProjectContextSummary;
  evidence: readonly ProjectEvidenceItem[];
  missingEvidence: readonly Exclude<ProjectEvidenceKind, "document" | "analysis">[];
  nextAction: ProjectNextBestAction;
  executiveSummary: ExecutiveSummaryGate;
}>;

const coreAnalysisTypes = Object.freeze([
  "contract_review",
  "boq_review",
  "risk_assessment",
  "planning_review",
  "site_report_review"
] as const satisfies readonly ProjectAnalysisToolType[]);

function metadataString(metadata: Record<string, unknown> | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function metadataNumber(metadata: Record<string, unknown> | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.min(100, value));
  }
  return undefined;
}

function documentSearchText(document: Document) {
  return [document.title, document.filename, document.type, document.category, ...(document.tags || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function classifyProjectDocument(document: Document): Exclude<ProjectEvidenceKind, "analysis"> {
  const text = documentSearchText(document);
  if (document.category === "Contracts" || document.type === "Contract" || /\b(contract|contrat)\b|عقد/.test(text)) return "contract";
  if (document.category === "BOQ" || /\b(boq|bill of quantities|quantity survey|bordereau)\b|جدول الكميات/.test(text)) return "boq";
  if (/\b(schedule|planning|programme|program|timeline)\b|جدول زمني|برنامج/.test(text)) return "planning";
  if (document.category === "Inspection Reports" || document.category === "QA Reports" || /\b(site report|daily report|inspection report|rapport de chantier)\b|تقرير الموقع/.test(text)) return "site_report";
  return "document";
}

export function createProjectContextSummary(project: Project): ProjectContextSummary {
  const metadata = project.metadata;
  return Object.freeze({
    id: project.id,
    name: project.title,
    ...(project.type ? { type: project.type } : {}),
    ...(project.location ? { location: project.location } : {}),
    ...(metadataString(metadata, "client", "clientName", "ownerName") ? { client: metadataString(metadata, "client", "clientName", "ownerName") } : {}),
    ...(metadataString(metadata, "contractor", "contractorName") ? { contractor: metadataString(metadata, "contractor", "contractorName") } : {}),
    ...(project.status ? { status: project.status } : {}),
    ...(project.phase ? { phase: project.phase } : {}),
    ...(metadataString(metadata, "startDate", "start_date") ? { startDate: metadataString(metadata, "startDate", "start_date") } : {}),
    ...(metadataString(metadata, "endDate", "end_date", "targetDate") ? { endDate: metadataString(metadata, "endDate", "end_date", "targetDate") } : {}),
    ...(project.description ? { description: project.description } : {}),
    ...(metadataNumber(metadata, "progress", "completion") !== undefined ? { progress: metadataNumber(metadata, "progress", "completion") } : {}),
    ...(project.organizationName ? { organizationName: project.organizationName } : {})
  });
}

export function createProjectEvidence(documents: readonly Document[], state: ProjectAnalysisProjectState): readonly ProjectEvidenceItem[] {
  const evidenceAnalysisType: Partial<Record<ProjectEvidenceKind, ProjectAnalysisToolType>> = {
    contract: "contract_review",
    boq: "boq_review",
    planning: "planning_review",
    site_report: "site_report_review"
  };
  const documentEvidence = documents.filter((document) => !document.archived).map((document) => {
    const kind = classifyProjectDocument(document);
    const linkedAnalysis = evidenceAnalysisType[kind]
      ? state.latestAnalyses.find((analysis) => analysis.toolType === evidenceAnalysisType[kind])
      : undefined;
    return Object.freeze({
      id: document.id,
      kind,
      name: document.title || document.filename || document.id,
      source: "document" as const,
      createdAt: document.createdAt,
      status: document.status,
      ...(document.version ? { version: document.version } : {}),
      availability: document.content?.trim() ? "available" as const : "metadata_only" as const,
      ...(linkedAnalysis ? { analysisStatus: linkedAnalysis.status, linkedAnalysisId: linkedAnalysis.id } : {})
    });
  });
  const analysisEvidence = state.latestAnalyses.map((analysis) => Object.freeze({
    id: analysis.id,
    kind: "analysis" as const,
    name: getProjectAnalysisRegistryEntry(analysis.toolType)?.title || analysis.toolType,
    source: "analysis" as const,
    createdAt: analysis.createdAt,
    status: analysis.status,
    version: analysis.version,
    availability: "available" as const,
    analysisStatus: analysis.status,
    linkedAnalysisId: analysis.id
  }));
  return Object.freeze([...documentEvidence, ...analysisEvidence].sort((left, right) => (right.createdAt || "").localeCompare(left.createdAt || "")));
}

function toolRoute(projectId: string, toolType: ProjectAnalysisToolType, record?: ProjectAnalysisRecord) {
  const definition = getProjectAnalysisRegistryEntry(toolType);
  if (!definition) return undefined;
  const query = new URLSearchParams({ projectId });
  if (record) {
    query.set("sessionId", record.sessionId);
    query.set("analysisId", record.id);
    query.set("version", String(record.version));
    query.set("resume", "1");
  }
  return `${definition.route}?${query.toString()}`;
}

export function createExecutiveSummaryGate(state: ProjectAnalysisProjectState): ExecutiveSummaryGate {
  const completed = new Set(state.latestAnalyses.filter((record) => record.status === "completed").map((record) => record.toolType));
  const missingAnalyses = Object.freeze(coreAnalysisTypes.filter((type) => !completed.has(type)));
  return Object.freeze({
    evidenceBacked: missingAnalyses.length === 0,
    canGeneratePartial: completed.size > 0,
    completeness: Math.round(((coreAnalysisTypes.length - missingAnalyses.length) / coreAnalysisTypes.length) * 100),
    missingAnalyses
  });
}

export function resolveProjectNextBestAction(projectId: string, evidence: readonly ProjectEvidenceItem[], state: ProjectAnalysisProjectState): ProjectNextBestAction {
  const unfinished = state.history.find((record) => record.status === "pending");
  if (unfinished) return Object.freeze({
    type: "resume_analysis",
    label: "Continue Analysis",
    reason: "An unfinished persisted analysis is ready to resume.",
    route: toolRoute(projectId, unfinished.toolType, unfinished),
    toolType: unfinished.toolType
  });

  const completed = new Set(state.latestAnalyses.filter((record) => record.status === "completed").map((record) => record.toolType));
  const hasEvidence = (kind: ProjectEvidenceKind) => evidence.some((item) => item.source === "document" && item.kind === kind);
  const stages: readonly Readonly<{ toolType: ProjectAnalysisToolType; evidence?: ProjectEvidenceKind; addLabel: string; runLabel: string; reason: string }>[] = [
    { toolType: "contract_review", evidence: "contract", addLabel: "Add contract evidence", runLabel: "Run Contract Review", reason: "Contract evidence establishes obligations, scope, and review risks." },
    { toolType: "boq_review", evidence: "boq", addLabel: "Add BOQ evidence", runLabel: "Run BOQ Review", reason: "BOQ evidence is required to review quantities, rates, and cost structure." },
    { toolType: "risk_assessment", runLabel: "Run Risk Assessment", addLabel: "Run Risk Assessment", reason: "Completed contract and BOQ findings can now be consolidated into project risk." },
    { toolType: "planning_review", evidence: "planning", addLabel: "Add planning evidence", runLabel: "Run Planning Review", reason: "Planning evidence is required to assess activities, milestones, and dependencies." },
    { toolType: "site_report_review", evidence: "site_report", addLabel: "Add site report evidence", runLabel: "Run Site Report Review", reason: "Site evidence supports quality, safety, progress, and follow-up review." }
  ];
  for (const stage of stages) {
    if (completed.has(stage.toolType)) continue;
    const missingEvidence = stage.evidence && !hasEvidence(stage.evidence);
    return Object.freeze({
      type: missingEvidence ? "add_evidence" : "run_analysis",
      label: missingEvidence ? stage.addLabel : stage.runLabel,
      reason: stage.reason,
      route: toolRoute(projectId, stage.toolType),
      toolType: stage.toolType
    });
  }
  if (!completed.has("executive_summary")) return Object.freeze({
    type: "generate_summary",
    label: "Generate Executive Summary",
    reason: "The required project analyses are complete and ready for an evidence-backed summary.",
    route: toolRoute(projectId, "executive_summary"),
    toolType: "executive_summary"
  });
  return Object.freeze({ type: "complete", label: "Review latest intelligence", reason: "The current Project Intelligence workflow is complete." });
}

export function createProjectIntelligenceWorkflowSnapshot(project: Project, documents: readonly Document[], state: ProjectAnalysisProjectState): ProjectIntelligenceWorkflowSnapshot {
  const evidence = createProjectEvidence(documents, state);
  const requiredEvidence = Object.freeze(["contract", "boq", "planning", "site_report"] as const);
  return Object.freeze({
    context: createProjectContextSummary(project),
    evidence,
    missingEvidence: Object.freeze(requiredEvidence.filter((kind) => !evidence.some((item) => item.source === "document" && item.kind === kind))),
    nextAction: resolveProjectNextBestAction(project.id, evidence, state),
    executiveSummary: createExecutiveSummaryGate(state)
  });
}
