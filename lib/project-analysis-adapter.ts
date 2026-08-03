import type {
  CreateProjectAnalysisSessionInput,
  ProjectAnalysisRecord,
  ProjectAnalysisSession,
  ProjectAnalysisToolType,
  SaveProjectAnalysisInput,
  UpdateProjectAnalysisInput
} from "@/types/project-analysis";

export type ProjectAnalysisAdapter = Readonly<{
  createSession(input: CreateProjectAnalysisSessionInput): Promise<ProjectAnalysisSession>;
  saveAnalysis(input: SaveProjectAnalysisInput): Promise<ProjectAnalysisRecord>;
  updateAnalysis(id: string, patch: UpdateProjectAnalysisInput): Promise<ProjectAnalysisRecord | undefined>;
  loadAnalysis(id: string): Promise<ProjectAnalysisRecord | undefined>;
  latestAnalysis(projectId: string, toolType: ProjectAnalysisToolType, ownerId?: string): Promise<ProjectAnalysisRecord | undefined>;
  listProjectAnalyses(projectId: string, ownerId?: string): Promise<readonly ProjectAnalysisRecord[]>;
}>;

export type ProjectAnalysisAdapterMode = "memory" | "supabase";

