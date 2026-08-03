import type { ProjectHealthStatus } from "@/lib/project-intelligence";

export type ProjectAnalysisToolType =
  | "contract_review"
  | "boq_review"
  | "risk_assessment"
  | "planning_review"
  | "site_report_review"
  | "executive_summary";

export type ProjectAnalysisStatus = "completed" | "failed" | "pending";

export type ProjectReadinessCategory = "documentation" | "planning" | "risk" | "quality" | "safety";

export type ProjectReadinessMetric = Readonly<{
  category: ProjectReadinessCategory;
  available: boolean;
  score?: number;
  evidence: readonly ProjectAnalysisToolType[];
}>;

export type ProjectReadinessScore = Readonly<{
  projectId: string;
  available: boolean;
  overall?: number;
  metrics: readonly ProjectReadinessMetric[];
  evidenceCount: number;
}>;

export type ProjectAnalysisResume = Readonly<{
  session: ProjectAnalysisSession;
  analysis?: ProjectAnalysisRecord;
  resumed: boolean;
}>;

export type ProjectAnalysisTimelineEntry = Readonly<{
  id: string;
  sessionId: string;
  toolType: ProjectAnalysisToolType;
  status: ProjectAnalysisStatus;
  version: number;
  occurredAt: string;
}>;

export type ProjectAnalysisProjectState = Readonly<{
  projectId: string;
  latestAnalyses: readonly ProjectAnalysisRecord[];
  history: readonly ProjectAnalysisRecord[];
  timeline: readonly ProjectAnalysisTimelineEntry[];
  currentStage?: ProjectAnalysisToolType;
  completion: number;
  health: ProjectHealthStatus;
  confidence?: number;
  readiness: ProjectReadinessScore;
}>;

export type ProjectAnalysisMetadata = Readonly<{
  provider?: string;
  model?: string;
  source?: "api_generate" | "runtime" | "manual" | "test";
  runtimeId?: string;
  reportType?: string;
  persistedAt?: string;
  warnings?: readonly string[];
  [key: string]: unknown;
}>;

export type ProjectAnalysisRecord = Readonly<{
  id: string;
  sessionId: string;
  projectId: string;
  ownerId: string;
  toolType: ProjectAnalysisToolType;
  status: ProjectAnalysisStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
  analysisResult: unknown;
  health: ProjectHealthStatus;
  confidence?: number;
  metadata: ProjectAnalysisMetadata;
}>;

export type ProjectAnalysisSession = Readonly<{
  id: string;
  projectId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "archived";
  metadata: ProjectAnalysisMetadata;
}>;

export type ProjectAnalysisPersistenceStatus = Readonly<{
  attempted: boolean;
  ok: boolean;
  sessionId?: string;
  analysisId?: string;
  version?: number;
  error?: string;
}>;

export type CreateProjectAnalysisSessionInput = Readonly<{
  projectId: string;
  ownerId: string;
  token?: string;
  now?: Date;
  metadata?: ProjectAnalysisMetadata;
}>;

export type SaveProjectAnalysisInput = Readonly<{
  sessionId?: string;
  projectId: string;
  ownerId: string;
  token?: string;
  toolType: ProjectAnalysisToolType;
  status?: ProjectAnalysisStatus;
  analysisResult: unknown;
  health?: ProjectHealthStatus;
  confidence?: number;
  metadata?: ProjectAnalysisMetadata;
  now?: Date;
}>;

export type UpdateProjectAnalysisInput = Readonly<{
  status?: ProjectAnalysisStatus;
  analysisResult?: unknown;
  health?: ProjectHealthStatus;
  confidence?: number;
  metadata?: ProjectAnalysisMetadata;
  now?: Date;
}>;
