import type { ProjectAnalysisTimelineEntry, ProjectReadinessScore } from "@/types/project-analysis";

export type ReportLanguage = "ar" | "fr" | "en";
export type ReportDirection = "rtl" | "ltr";
export type ReportExportFormat = "pdf" | "docx" | "html";
export type FutureReportExportFormat = ReportExportFormat | "xlsx";

export type ReportExportOptions = Readonly<{
  includeLogo: boolean;
  includeProjectMetadata: boolean;
  includeTimeline: boolean;
  includeReadiness: boolean;
  includeRecommendations: boolean;
  includeEvidenceReferences: boolean;
  language: ReportLanguage;
}>;

export type ReportEvidenceReference = Readonly<{
  label: string;
  reference?: string;
}>;

export type ReportExportContext = Readonly<{
  analysisId?: string;
  sessionId?: string;
  version?: number;
  generatedBy?: string;
  workflowStage?: string;
  timeline?: readonly ProjectAnalysisTimelineEntry[];
  readiness?: ProjectReadinessScore;
  evidenceReferences?: readonly ReportEvidenceReference[];
  missingInformation?: readonly string[];
}>;

export const defaultReportExportOptions: ReportExportOptions = Object.freeze({
  includeLogo: true,
  includeProjectMetadata: true,
  includeTimeline: true,
  includeReadiness: true,
  includeRecommendations: true,
  includeEvidenceReferences: true,
  language: "en"
});

export function normalizeReportLanguage(value: unknown): ReportLanguage {
  return value === "ar" || value === "fr" ? value : "en";
}

export function getReportDirection(language: ReportLanguage): ReportDirection {
  return language === "ar" ? "rtl" : "ltr";
}

export function normalizeReportExportOptions(input?: Partial<ReportExportOptions>): ReportExportOptions {
  return Object.freeze({
    ...defaultReportExportOptions,
    ...input,
    language: normalizeReportLanguage(input?.language)
  });
}
