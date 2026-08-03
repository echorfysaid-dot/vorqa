import { getProjectAnalysisRegistryEntry, projectAnalysisRegistry } from "@/lib/project-analysis-registry";
import type { ProjectAnalysisProjectState, ProjectAnalysisRecord, ProjectAnalysisToolType } from "@/types/project-analysis";

export type AnalysisHistorySort = "newest" | "oldest";

export type AnalysisHistoryFilter = Readonly<{
  query?: string;
  toolType?: ProjectAnalysisToolType | "all";
  sort?: AnalysisHistorySort;
}>;

export function filterAnalysisHistory(records: readonly ProjectAnalysisRecord[], filter: AnalysisHistoryFilter = {}) {
  const query = filter.query?.trim().toLowerCase() || "";
  const filtered = records.filter((record) => {
    if (filter.toolType && filter.toolType !== "all" && record.toolType !== filter.toolType) return false;
    if (!query) return true;
    const searchable = [
      record.toolType,
      getProjectAnalysisRegistryEntry(record.toolType)?.title,
      record.status,
      String(record.version),
      JSON.stringify(record.metadata)
    ].join(" ").toLowerCase();
    return searchable.includes(query);
  });
  return Object.freeze([...filtered].sort((left, right) => {
    const direction = filter.sort === "oldest" ? 1 : -1;
    return direction * (left.updatedAt.localeCompare(right.updatedAt) || left.version - right.version);
  }));
}

export function createProjectAnalysisUiModel(state: ProjectAnalysisProjectState) {
  const latestAnalysis = [...state.latestAnalyses].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  const currentStage = state.currentStage ? getProjectAnalysisRegistryEntry(state.currentStage) : undefined;
  const unfinished = state.history.find((record) => record.status === "pending");
  const resumable = unfinished ? getProjectAnalysisRegistryEntry(unfinished.toolType) : undefined;
  const nextAction = resumable || currentStage;

  return Object.freeze({
    latestAnalysis,
    currentStage,
    unfinished,
    nextAction,
    toolOptions: Object.freeze(projectAnalysisRegistry.map((entry) => Object.freeze({ value: entry.toolType, label: entry.title }))),
    versionCount: state.history.length,
    completedCount: state.latestAnalyses.filter((record) => record.status === "completed").length
  });
}
