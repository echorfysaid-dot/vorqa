import { canonicalConstructionWorkflow } from "@/lib/analysis-hardening";
import type { ProjectAnalysisToolType } from "@/types/project-analysis";
import type { VoraIntelligenceTaskIntent } from "@/lib/vora-intelligence-service";

export type ProjectAnalysisRegistryEntry = Readonly<{
  toolType: ProjectAnalysisToolType;
  title: string;
  route: string;
  taskIntent: VoraIntelligenceTaskIntent | "cost_review";
  order: number;
}>;

const taskIntentByTool: Record<ProjectAnalysisToolType, ProjectAnalysisRegistryEntry["taskIntent"]> = {
  contract_review: "contract_review",
  boq_review: "cost_review",
  risk_assessment: "risk_assessment",
  planning_review: "planning_review",
  site_report_review: "site_report_review",
  executive_summary: "executive_summary"
};

export const projectAnalysisRegistry: readonly ProjectAnalysisRegistryEntry[] = canonicalConstructionWorkflow.map((stage, index) => ({
  toolType: stage.id,
  title: stage.title,
  route: stage.route,
  taskIntent: taskIntentByTool[stage.id],
  order: index + 1
}));

export function isProjectAnalysisToolType(value: unknown): value is ProjectAnalysisToolType {
  return typeof value === "string" && projectAnalysisRegistry.some((entry) => entry.toolType === value);
}

export function getProjectAnalysisRegistryEntry(toolType: ProjectAnalysisToolType) {
  return projectAnalysisRegistry.find((entry) => entry.toolType === toolType);
}

export function toolTypeFromTaskIntent(taskIntent: VoraIntelligenceTaskIntent | "cost_review" | undefined): ProjectAnalysisToolType | undefined {
  return projectAnalysisRegistry.find((entry) => entry.taskIntent === taskIntent)?.toolType;
}
