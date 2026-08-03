import { canonicalConstructionWorkflow } from "@/lib/analysis-hardening";
import type { ProjectHealthStatus, ProjectIntelligenceAnalysisType, ProjectIntelligenceSession } from "@/lib/project-intelligence";

export type AnalysisWorkflowStageStatus = "completed" | "current" | "available" | "locked" | "coming_soon";

export type AnalysisWorkflowStage = Readonly<{
  id: ProjectIntelligenceAnalysisType;
  title: string;
  description: string;
  status: AnalysisWorkflowStageStatus;
  progress: number;
  route?: string;
  isAvailable: boolean;
  isImplemented: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  estimatedOutput: string;
}>;

export type AnalysisWorkflowNextAction = Readonly<{
  label: string;
  description: string;
  route?: string;
  stageId?: AnalysisWorkflowStage["id"];
  isAvailable: boolean;
}>;

export type AnalysisWorkflow = Readonly<{
  projectId: string;
  stages: readonly AnalysisWorkflowStage[];
  implementedStageCount: number;
  completedImplementedStageCount: number;
  completionPercentage: number;
  currentStage?: AnalysisWorkflowStage;
  completedStages: readonly AnalysisWorkflowStage[];
  remainingStages: readonly AnalysisWorkflowStage[];
  nextAction: AnalysisWorkflowNextAction;
  overallHealth: ProjectHealthStatus;
}>;

const stageDefinitions: readonly Omit<AnalysisWorkflowStage, "status" | "progress" | "isCompleted" | "isCurrent" | "isLocked">[] = [
  {
    id: "contract_review",
    title: "Contract Review",
    description: "Review construction contract evidence before cost and risk analysis.",
    route: "/tools/contract-review",
    isAvailable: true,
    isImplemented: true,
    estimatedOutput: "Contract summary, risks, missing information, and review actions."
  },
  {
    id: "boq_review",
    title: "BOQ Review",
    description: "Review BOQ structure, quantities, units, rates, totals, and cost issues.",
    route: "/tools/boq-review",
    isAvailable: true,
    isImplemented: true,
    estimatedOutput: "BOQ structure summary, cost issues, duplicates, and action list."
  },
  {
    id: "risk_assessment",
    title: "Risk Assessment",
    description: "Combine contract, BOQ, and project-note findings into a risk assessment.",
    route: "/tools/risk-assessment",
    isAvailable: true,
    isImplemented: true,
    estimatedOutput: "Risk matrix, detected risks, mitigations, and follow-up owners."
  },
  {
    id: "planning_review",
    title: "Planning Review",
    description: "Review planning assumptions, stages, milestones, dependencies, and activity completeness.",
    route: "/tools/planning-review",
    isAvailable: true,
    isImplemented: true,
    estimatedOutput: "Schedule readiness, planning risks, and next delivery actions."
  },
  {
    id: "site_report_review",
    title: "Site Report Review",
    description: "Review site reports, daily progress notes, safety observations, quality findings, and follow-up items.",
    route: "/tools/site-report-review",
    isAvailable: true,
    isImplemented: true,
    estimatedOutput: "Site progress summary, issues, evidence, and follow-up actions."
  },
  {
    id: "executive_summary",
    title: "Executive Summary",
    description: "Aggregate completed construction intelligence analyses into a professional executive report.",
    route: "/tools/executive-summary",
    isAvailable: true,
    isImplemented: true,
    estimatedOutput: "Executive project intelligence summary and decision brief."
  }
] as const;

const canonicalRoutes = new Map(canonicalConstructionWorkflow.map((stage) => [stage.id, stage.route]));

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const property of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[property];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function completedAnalysisTypes(session: ProjectIntelligenceSession) {
  return new Set(session.completedAnalyses.map((analysis) => analysis.type));
}

export function createAnalysisWorkflow(session: ProjectIntelligenceSession): AnalysisWorkflow {
  const completedTypes = completedAnalysisTypes(session);
  let firstIncompleteImplementedSeen = false;

  const stages = stageDefinitions.map((definition, index) => {
    const previousImplementedStages = stageDefinitions.slice(0, index).filter((stage) => stage.isImplemented);
    const previousImplementedComplete = previousImplementedStages.every((stage) => completedTypes.has(stage.id as ProjectIntelligenceAnalysisType));
    const isCompleted = definition.isImplemented && completedTypes.has(definition.id as ProjectIntelligenceAnalysisType);
    const isUnlocked = definition.isImplemented && previousImplementedComplete;
    const isCurrent = definition.isImplemented && !isCompleted && isUnlocked && !firstIncompleteImplementedSeen;
    if (isCurrent) firstIncompleteImplementedSeen = true;
    const isLocked = !definition.isImplemented || (!isCompleted && !isUnlocked);
    const status: AnalysisWorkflowStageStatus = isCompleted
      ? "completed"
      : !definition.isImplemented
        ? "coming_soon"
        : isCurrent
          ? "current"
          : isLocked
            ? "locked"
            : "available";

    return {
      ...definition,
      route: definition.route || canonicalRoutes.get(definition.id),
      status,
      progress: isCompleted ? 100 : isCurrent ? 50 : 0,
      isCompleted,
      isCurrent,
      isLocked
    };
  });

  const implementedStages = stages.filter((stage) => stage.isImplemented);
  const completedStages = stages.filter((stage) => stage.isCompleted);
  const completedImplementedStageCount = implementedStages.filter((stage) => stage.isCompleted).length;
  const currentStage = stages.find((stage) => stage.isCurrent) || implementedStages.find((stage) => !stage.isCompleted && !stage.isLocked);
  const completionPercentage = implementedStages.length ? Math.round((completedImplementedStageCount / implementedStages.length) * 100) : 0;
  const nextAction = resolveNextAction(currentStage, completionPercentage);

  return deepFreeze({
    projectId: session.project.id,
    stages,
    implementedStageCount: implementedStages.length,
    completedImplementedStageCount,
    completionPercentage,
    currentStage,
    completedStages,
    remainingStages: stages.filter((stage) => !stage.isCompleted),
    nextAction,
    overallHealth: session.overallHealth
  });
}

export function resolveNextAction(currentStage: AnalysisWorkflowStage | undefined, completionPercentage: number): AnalysisWorkflowNextAction {
  if (currentStage?.isAvailable && currentStage.route) {
    return {
      label: `Run ${currentStage.title}`,
      description: currentStage.description,
      route: currentStage.route,
      stageId: currentStage.id,
      isAvailable: true
    };
  }

  if (completionPercentage >= 100) {
    return {
      label: "Complete Project Analysis",
      description: "Implemented Construction Intelligence stages are complete for this project session.",
      isAvailable: false
    };
  }

  return {
    label: "Continue when the next analysis becomes available",
    description: "Future stages are visible but disabled until implemented.",
    isAvailable: false
  };
}

export function getWorkflowStageOrder() {
  return stageDefinitions.map((stage) => stage.id);
}
