import { createExportReadyReport, type ExportReadyReport, type ExportReadyReportSection } from "@/lib/analysis-hardening";
import { getProjectAnalysisRegistryEntry } from "@/lib/project-analysis-registry";
import type { ProfessionalReportMetadata } from "@/lib/report-template";
import type { ProjectAnalysisProjectState, ProjectAnalysisRecord, ProjectAnalysisToolType } from "@/types/project-analysis";
import type { ReportEvidenceReference, ReportExportContext } from "@/types/report-export";

function humanize(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function scalarLines(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(scalarLines);
  return [];
}

function resultSections(result: unknown): readonly ExportReadyReportSection[] {
  if (typeof result === "string") return result.trim() ? [Object.freeze({ id: "analysis-result", title: "Analysis result", content: Object.freeze([result.trim()]) })] : [];
  if (!result || typeof result !== "object" || Array.isArray(result)) return [];
  return Object.entries(result as Record<string, unknown>).flatMap(([key, value]) => {
    const content = scalarLines(value);
    if (content.length) return [Object.freeze({ id: key, title: humanize(key), content: Object.freeze(content) })];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = Object.entries(value as Record<string, unknown>).flatMap(([nestedKey, nestedValue]) => scalarLines(nestedValue).map((line) => `${humanize(nestedKey)}: ${line}`));
      if (nested.length) return [Object.freeze({ id: key, title: humanize(key), content: Object.freeze(nested) })];
    }
    return [];
  });
}

function evidenceFromMetadata(record: ProjectAnalysisRecord): readonly ReportEvidenceReference[] {
  const candidates = ["documentName", "filename", "sourceDocument", "documentId", "source"] as const;
  return Object.freeze(candidates.flatMap((key) => {
    const value = record.metadata[key];
    return typeof value === "string" && value.trim() ? [Object.freeze({ label: humanize(key), reference: value.trim() })] : [];
  }));
}

export function getSpecificAnalysisVersion(state: ProjectAnalysisProjectState, analysisId: string) {
  return state.history.find((record) => record.id === analysisId);
}

export function getLatestAnalysisVersion(state: ProjectAnalysisProjectState, toolType?: ProjectAnalysisToolType) {
  return [...state.history]
    .filter((record) => record.status === "completed" && (!toolType || record.toolType === toolType))
    .sort((left, right) => right.version - left.version || right.updatedAt.localeCompare(left.updatedAt))[0];
}

export function createAnalysisExportModel(record: ProjectAnalysisRecord, input?: { projectTitle?: string; generatedBy?: string }) {
  const definition = getProjectAnalysisRegistryEntry(record.toolType);
  const report = createExportReadyReport({
    title: definition?.title || humanize(record.toolType),
    source: record.toolType,
    projectId: record.projectId,
    projectTitle: input?.projectTitle,
    generatedAt: new Date(record.updatedAt),
    sections: resultSections(record.analysisResult),
    warnings: Array.isArray(record.metadata.warnings) ? record.metadata.warnings : []
  });
  const metadata: ProfessionalReportMetadata = Object.freeze({
    projectId: record.projectId,
    projectName: input?.projectTitle,
    analysisType: definition?.title || humanize(record.toolType),
    analysisVersion: record.version,
    healthScore: record.health,
    confidenceScore: record.confidence,
    generatedAt: record.updatedAt,
    generatedBy: input?.generatedBy
  });
  const context: ReportExportContext = Object.freeze({
    analysisId: record.id,
    sessionId: record.sessionId,
    version: record.version,
    generatedBy: input?.generatedBy,
    workflowStage: definition?.title,
    evidenceReferences: evidenceFromMetadata(record)
  });
  return Object.freeze({ report, metadata, context });
}

export function createProjectIntelligenceExportModel(state: ProjectAnalysisProjectState, input?: { projectTitle?: string; generatedBy?: string }) {
  const records = [...state.latestAnalyses].filter((record) => record.status === "completed").sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
  const sections = records.flatMap((record) => {
    const title = getProjectAnalysisRegistryEntry(record.toolType)?.title || humanize(record.toolType);
    return resultSections(record.analysisResult).map((section) => Object.freeze({ ...section, id: `${record.toolType}-${section.id}`, title: `${title} — ${section.title}` }));
  });
  const report: ExportReadyReport = createExportReadyReport({
    title: input?.projectTitle ? `${input.projectTitle} — Project Intelligence` : "Project Intelligence",
    source: "project_intelligence",
    projectId: state.projectId,
    projectTitle: input?.projectTitle,
    sections,
    warnings: records.flatMap((record) => Array.isArray(record.metadata.warnings) ? record.metadata.warnings : [])
  });
  const context: ReportExportContext = Object.freeze({
    generatedBy: input?.generatedBy,
    workflowStage: state.currentStage ? getProjectAnalysisRegistryEntry(state.currentStage)?.title : "Complete",
    timeline: state.timeline,
    readiness: state.readiness,
    evidenceReferences: Object.freeze(records.flatMap(evidenceFromMetadata))
  });
  const metadata: ProfessionalReportMetadata = Object.freeze({
    projectId: state.projectId,
    projectName: input?.projectTitle,
    analysisType: "Project Intelligence",
    healthScore: state.health,
    confidenceScore: state.confidence,
    generatedBy: input?.generatedBy,
    workflowStage: context.workflowStage
  });
  return Object.freeze({ report, metadata, context });
}
