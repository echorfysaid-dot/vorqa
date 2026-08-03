import { projectAnalysisRegistry } from "@/lib/project-analysis-registry";
import { createSession, latestAnalysis, listProjectAnalyses } from "@/lib/project-analysis-storage";
import type {
  ProjectAnalysisProjectState,
  ProjectAnalysisRecord,
  ProjectAnalysisResume,
  ProjectAnalysisTimelineEntry,
  ProjectAnalysisToolType,
  ProjectReadinessCategory,
  ProjectReadinessMetric,
  ProjectReadinessScore
} from "@/types/project-analysis";

const readinessEvidence: Readonly<Record<ProjectReadinessCategory, readonly ProjectAnalysisToolType[]>> = Object.freeze({
  documentation: Object.freeze(["contract_review", "boq_review"] as ProjectAnalysisToolType[]),
  planning: Object.freeze(["planning_review"] as ProjectAnalysisToolType[]),
  risk: Object.freeze(["risk_assessment"] as ProjectAnalysisToolType[]),
  quality: Object.freeze(["site_report_review"] as ProjectAnalysisToolType[]),
  safety: Object.freeze(["site_report_review"] as ProjectAnalysisToolType[])
});

function completedConfidence(records: readonly ProjectAnalysisRecord[], types: readonly ProjectAnalysisToolType[]) {
  return records
    .filter((record) => record.status === "completed" && types.includes(record.toolType) && typeof record.confidence === "number")
    .map((record) => record.confidence as number);
}

export function getAnalysisHistory(projectId: string, ownerId?: string, toolType?: ProjectAnalysisToolType): readonly ProjectAnalysisRecord[] {
  return Object.freeze(listProjectAnalyses(projectId, ownerId)
    .filter((record) => !toolType || record.toolType === toolType)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || right.version - left.version));
}

export function resumeAnalysis(projectId: string, ownerId: string, toolType?: ProjectAnalysisToolType, now?: Date): ProjectAnalysisResume {
  const unfinished = getAnalysisHistory(projectId, ownerId, toolType)
    .find((record) => record.status === "pending");
  const session = createSession({ projectId, ownerId, now });
  return Object.freeze({ session, analysis: unfinished, resumed: Boolean(unfinished) });
}

export function calculateProjectReadiness(projectId: string, ownerId?: string): ProjectReadinessScore {
  const latest = new Map<ProjectAnalysisToolType, ProjectAnalysisRecord>();
  for (const record of listProjectAnalyses(projectId, ownerId)) {
    const current = latest.get(record.toolType);
    if (!current || record.version > current.version) latest.set(record.toolType, record);
  }
  const records = Object.freeze([...latest.values()]);
  const metrics: readonly ProjectReadinessMetric[] = Object.freeze(
    (Object.keys(readinessEvidence) as ProjectReadinessCategory[]).map((category) => {
      const evidence = readinessEvidence[category];
      const values = completedConfidence(records, evidence);
      return Object.freeze({
        category,
        available: values.length > 0,
        ...(values.length ? { score: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) } : {}),
        evidence: Object.freeze(evidence.filter((type) => records.some((record) => record.toolType === type && record.status === "completed")))
      });
    })
  );
  const availableScores = metrics.flatMap((metric) => typeof metric.score === "number" ? [metric.score] : []);
  return Object.freeze({
    projectId,
    available: availableScores.length > 0,
    ...(availableScores.length ? { overall: Math.round(availableScores.reduce((sum, value) => sum + value, 0) / availableScores.length) } : {}),
    metrics,
    evidenceCount: records.filter((record) => record.status === "completed").length
  });
}

export function latestProjectAnalysis(projectId: string, ownerId: string, toolType: ProjectAnalysisToolType) {
  return latestAnalysis(projectId, toolType, ownerId);
}

export function createAnalysisTimeline(projectId: string, ownerId?: string): readonly ProjectAnalysisTimelineEntry[] {
  return Object.freeze(getAnalysisHistory(projectId, ownerId).map((record) => Object.freeze({
    id: `timeline-${record.id}`,
    sessionId: record.sessionId,
    toolType: record.toolType,
    status: record.status,
    version: record.version,
    occurredAt: record.updatedAt
  })));
}

const healthWeight = { "Healthy": 0, "Needs Review": 1, "Attention Required": 2, "High Risk": 3 } as const;

export function getProjectAnalysisState(projectId: string, ownerId?: string): ProjectAnalysisProjectState {
  const history = getAnalysisHistory(projectId, ownerId);
  const latestByType = new Map<ProjectAnalysisToolType, ProjectAnalysisRecord>();
  for (const record of history) {
    const current = latestByType.get(record.toolType);
    if (!current || record.version > current.version) latestByType.set(record.toolType, record);
  }
  const latestAnalyses = Object.freeze(projectAnalysisRegistry.flatMap((entry) => {
    const record = latestByType.get(entry.toolType);
    return record ? [record] : [];
  }));
  const completed = latestAnalyses.filter((record) => record.status === "completed");
  const confidenceValues = completed.flatMap((record) => typeof record.confidence === "number" ? [record.confidence] : []);
  const currentStage = projectAnalysisRegistry.find((entry) => latestByType.get(entry.toolType)?.status !== "completed")?.toolType;
  const health = completed.reduce((worst, record) => healthWeight[record.health] > healthWeight[worst] ? record.health : worst, "Needs Review" as ProjectAnalysisRecord["health"]);

  return Object.freeze({
    projectId,
    latestAnalyses,
    history,
    timeline: createAnalysisTimeline(projectId, ownerId),
    currentStage,
    completion: Math.round((completed.length / projectAnalysisRegistry.length) * 100),
    health,
    ...(confidenceValues.length ? { confidence: Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length) } : {}),
    readiness: calculateProjectReadiness(projectId, ownerId)
  });
}
