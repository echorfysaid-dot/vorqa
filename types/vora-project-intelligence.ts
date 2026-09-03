import type {
  Document,
  Project,
  ProjectBudget,
  ProjectMember,
  Task,
  TimelineMilestone
} from "@/lib/models";
import type { ProjectOwnerContext } from "@/types/project-journey";
import type { ProjectLifecycleState, ProjectLifecycleViewerInput, RoleAwareLifecycleContext } from "@/types/project-lifecycle";
import type { ProjectStageGate, RoleStageGateContext } from "@/types/project-stage-gate";
import type { ProjectWorkflowState } from "@/types/project-workflow";

export const voraProjectHealthIds = ["on_track", "attention_needed", "at_risk", "insufficient_data"] as const;

export type VoraProjectHealthId = (typeof voraProjectHealthIds)[number];
export type VoraIntelligenceEvidence = "known" | "inferred" | "unavailable";

export type VoraProjectDataAvailability = Readonly<{
  tasks: boolean;
  timeline: boolean;
  documents: boolean;
  team: boolean;
  budget: boolean;
}>;

export type VoraProjectContextInput = Readonly<{
  project: Project;
  ownerContext?: ProjectOwnerContext;
  tasks?: readonly Task[];
  milestones?: readonly TimelineMilestone[];
  documents?: readonly Document[];
  members?: readonly ProjectMember[];
  budget?: ProjectBudget | null;
  availability?: Partial<VoraProjectDataAvailability>;
  viewer?: ProjectLifecycleViewerInput;
  workflowState?: ProjectWorkflowState;
}>;

export type VoraProjectContext = Readonly<{
  project: Readonly<{
    id: string;
    name: string;
    type?: string;
    description?: string;
    location?: string;
    status?: string;
    stage?: string;
    progress?: number;
    desiredStartDate?: string;
    selectedServices: readonly string[];
  }>;
  ownerContext: ProjectOwnerContext;
  tasks: Readonly<{ total: number; open: number; blocked: number; critical: number }>;
  timeline: Readonly<{ total: number; delayed: number }>;
  documents: Readonly<{ total: number }>;
  team: Readonly<{ total: number }>;
  budget: Readonly<{ items: number; overBudgetItems: number; hasOwnerEstimate: boolean }>;
  availability: VoraProjectDataAvailability;
  missingFields: readonly string[];
}>;

export type VoraProjectAttention = Readonly<{
  id: string;
  severity: "critical" | "warning" | "info";
  evidence: VoraIntelligenceEvidence;
  titleKey: string;
  descriptionKey: string;
  destination?: string;
  actionKey?: string;
}>;

export type VoraProjectAction = Readonly<{
  id: string;
  titleKey: string;
  descriptionKey: string;
  whyKey: string;
  actionKey: string;
  destination: string;
  evidence: VoraIntelligenceEvidence;
}>;

export type VoraProjectHealth = Readonly<{
  state: VoraProjectHealthId;
  reasonKeys: readonly string[];
}>;

export type VoraProjectIntelligence = Readonly<{
  context: VoraProjectContext;
  lifecycle: ProjectLifecycleState;
  roleContext: RoleAwareLifecycleContext;
  stageGate: ProjectStageGate;
  roleStageGate: RoleStageGateContext;
  workflowState?: ProjectWorkflowState;
  health: VoraProjectHealth;
  statusKey: string;
  priorityKey: string;
  nextAction: VoraProjectAction;
  attention: readonly VoraProjectAttention[];
  suggestedQuestionKeys: readonly string[];
}>;
