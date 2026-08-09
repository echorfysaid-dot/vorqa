import { canonicalConstructionWorkflow } from "@/lib/analysis-hardening";
import { saveAnalysis, saveAnalysisAsync } from "@/lib/project-analysis-storage";
import type { ProjectHealthStatus, ProjectIntelligenceAnalysis } from "@/lib/project-intelligence";
import type { VoraNormalizedIntelligenceResponse } from "@/lib/vora-intelligence-service";
import type { ProjectAnalysisMetadata, ProjectAnalysisPersistenceStatus, ProjectAnalysisRecord, ProjectAnalysisToolType } from "@/types/project-analysis";

function confidenceFromResult(result: VoraNormalizedIntelligenceResponse) {
  return result.confidence.decisionScore || result.confidence.reportStructuralCompleteness || result.confidence.runtimePipelineCompleteness;
}

function healthFromResult(result: VoraNormalizedIntelligenceResponse): ProjectHealthStatus {
  const structured = result.structuredOutput as Record<string, unknown> | undefined;
  const direct = structured?.projectHealth;
  if (direct === "Healthy" || direct === "Needs Review" || direct === "Attention Required" || direct === "High Risk") return direct;
  if (result.taskIntent === "risk_assessment") return result.risks?.length ? "Attention Required" : "Needs Review";
  if (result.taskIntent === "executive_summary") {
    const maybe = (result as VoraNormalizedIntelligenceResponse & { executiveSummary?: { projectHealth?: ProjectHealthStatus } }).executiveSummary?.projectHealth;
    if (maybe) return maybe;
  }
  return result.errors.length ? "Attention Required" : "Needs Review";
}

function summaryFromResult(result: VoraNormalizedIntelligenceResponse) {
  return result.summary || result.content?.split("\n").find(Boolean) || `${result.taskIntent} completed.`;
}

export function analysisRecordToProjectIntelligenceAnalysis(record: ProjectAnalysisRecord): ProjectIntelligenceAnalysis {
  const entry = canonicalConstructionWorkflow.find((stage) => stage.id === record.toolType);
  return {
    type: record.toolType,
    title: entry?.title || record.toolType,
    status: record.status === "completed" ? "completed" : record.status === "pending" ? "pending" : "not_started",
    summary: summaryFromResult(record.analysisResult as VoraNormalizedIntelligenceResponse),
    confidence: record.confidence,
    riskCount: Array.isArray((record.analysisResult as VoraNormalizedIntelligenceResponse).risks) ? (record.analysisResult as VoraNormalizedIntelligenceResponse).risks?.length : 0,
    highPriorityRiskCount: 0,
    completedAt: record.status === "completed" ? record.updatedAt : undefined,
    href: entry?.route
  };
}

export function persistAnalysisResultSafe(input: {
  projectId?: string;
  ownerId?: string;
  toolType: ProjectAnalysisToolType;
  result: VoraNormalizedIntelligenceResponse;
  source?: ProjectAnalysisMetadata["source"];
}): ProjectAnalysisPersistenceStatus {
  if (!input.projectId || !input.ownerId || input.result.status !== "success") return { attempted: false, ok: false, error: "Persistence skipped for missing project, owner, or unsuccessful analysis." };
  try {
    const saved = saveAnalysis({
      projectId: input.projectId,
      ownerId: input.ownerId,
      toolType: input.toolType,
      status: "completed",
      analysisResult: input.result,
      health: healthFromResult(input.result),
      confidence: confidenceFromResult(input.result),
      metadata: {
        provider: input.result.provider,
        model: input.result.model,
        source: input.source || "api_generate",
        runtimeId: input.result.executionMetadata.runtimeId,
        reportType: input.result.executionMetadata.reportType,
        warnings: input.result.warnings.map((warning) => warning.message)
      },
      now: new Date(input.result.createdAt)
    });
    return { attempted: true, ok: true, sessionId: saved.sessionId, analysisId: saved.id, version: saved.version };
  } catch (error) {
    return { attempted: true, ok: false, error: error instanceof Error ? error.message : "Project analysis persistence failed." };
  }
}

export async function persistAnalysisResultDurableSafe(input: {
  projectId?: string;
  ownerId?: string;
  token?: string;
  sessionId?: string;
  toolType: ProjectAnalysisToolType;
  result: VoraNormalizedIntelligenceResponse;
  source?: ProjectAnalysisMetadata["source"];
}): Promise<ProjectAnalysisPersistenceStatus> {
  if (!input.token) return persistAnalysisResultSafe(input);
  if (!input.projectId || !input.ownerId || input.result.status !== "success") {
    return { attempted: false, ok: false, error: "Persistence skipped for missing project, owner, or unsuccessful analysis." };
  }
  try {
    const saved = await saveAnalysisAsync({
      sessionId: input.sessionId,
      projectId: input.projectId,
      ownerId: input.ownerId,
      token: input.token,
      toolType: input.toolType,
      status: "completed",
      analysisResult: input.result,
      health: healthFromResult(input.result),
      confidence: confidenceFromResult(input.result),
      metadata: {
        provider: input.result.provider,
        model: input.result.model,
        source: input.source || "api_generate",
        runtimeId: input.result.executionMetadata.runtimeId,
        reportType: input.result.executionMetadata.reportType,
        warnings: input.result.warnings.map((warning) => warning.message)
      },
      now: new Date(input.result.createdAt)
    });
    return { attempted: true, ok: true, sessionId: saved.sessionId, analysisId: saved.id, version: saved.version };
  } catch (error) {
    return { attempted: true, ok: false, error: error instanceof Error ? error.message : "Project analysis persistence failed." };
  }
}

