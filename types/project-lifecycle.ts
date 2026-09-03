import type { Document, Project, ProjectMember, Task, TimelineMilestone } from "@/lib/models";

export const projectLifecycleOperationalStageIds = [
  "project_preparation",
  "site_property_preparation",
  "design_studies",
  "technical_studies",
  "authorization_preparation",
  "construction_authorization",
  "execution_preparation",
  "site_opening",
  "excavation_earthworks",
  "foundations",
  "structural_works",
  "secondary_works",
  "technical_installations",
  "finishing",
  "end_of_works",
  "occupancy_administrative"
] as const;

export const projectLifecycleTerminalStageId = "project_completed" as const;

// `project_completed` remains a resolver-supported stage for legacy compatibility,
// while the sixteen operational stages remain the canonical progression units.
export const projectLifecycleStageIds = [
  ...projectLifecycleOperationalStageIds,
  "project_completed"
] as const;

export const projectLifecyclePhaseIds = [
  "project_preparation",
  "studies_design",
  "construction_authorization",
  "pre_construction_site_opening",
  "earthworks_foundations",
  "structural_works",
  "secondary_technical_works",
  "finishing",
  "end_of_works",
  "final_administrative_completion"
] as const;

export const projectLifecycleCheckpointIds = [
  "project_facts_recorded",
  "site_property_information_recorded",
  "initial_studies_scope",
  "design_package",
  "technical_study_evidence",
  "authorization_package_prepared",
  "authorization_recorded",
  "execution_coordination_recorded",
  "site_opening_recorded",
  "excavation_bottom_review",
  "foundation_control",
  "foundation_reception",
  "structural_reception",
  "technical_review",
  "finishing_reception",
  "final_observations_closed",
  "final_administrative_authorization_recorded"
] as const;

export const projectLifecycleRoleIds = [
  "project_owner",
  "contractor",
  "architect",
  "engineer",
  "control_office",
  "laboratory",
  "surveyor",
  "other_project_member"
] as const;

export const lifecycleActionStatuses = [
  "not_started",
  "ready",
  "in_progress",
  "submitted",
  "waiting_validation",
  "completed",
  "blocked",
  "rejected",
  "unavailable"
] as const;

export type ProjectLifecycleStageId = (typeof projectLifecycleStageIds)[number];
export type ProjectLifecycleOperationalStageId = (typeof projectLifecycleOperationalStageIds)[number];
export type ProjectLifecyclePhaseId = (typeof projectLifecyclePhaseIds)[number];
export type ProjectLifecycleCheckpointId = (typeof projectLifecycleCheckpointIds)[number];
export type ProjectLifecycleRole = (typeof projectLifecycleRoleIds)[number];
export type LifecycleActionStatus = (typeof lifecycleActionStatuses)[number];
export type LifecycleEvidenceState = "uploaded" | "submitted" | "waiting_validation" | "approved" | "rejected" | "correction_required" | "missing" | "unavailable";
export type LifecycleValidationRequirement = "required" | "not_required" | "unavailable";
export type LifecycleResponsibilityKind = "owner" | "execution" | "review" | "validation" | "observer";
export type LifecyclePriority = "low" | "medium" | "high" | "critical";

export type ProjectLifecycleStartingPoint = Readonly<{
  stageId?: ProjectLifecycleStageId;
  source: "explicit_stage" | "project_status" | "owner_stage" | "project_phase" | "reported_project_information" | "insufficient_data";
  knownFactKeys: readonly string[];
  missingFactKeys: readonly string[];
}>;
export type ProjectLifecycleViewerInput = Readonly<{
  userId?: string;
  primaryRole?: string | null;
  organizationType?: string | null;
}>;

export type LifecycleResponsibility = Readonly<{
  role: ProjectLifecycleRole;
  kind: LifecycleResponsibilityKind;
  actionIds: readonly string[];
}>;

export type LifecycleStageDefinition = Readonly<{
  id: ProjectLifecycleStageId;
  order: number;
  phaseId: ProjectLifecyclePhaseId;
  labelKey: string;
  responsibilities: Readonly<Partial<Record<ProjectLifecycleRole, LifecycleResponsibility>>>;
}>;

export type LifecyclePhaseDefinition = Readonly<{
  id: ProjectLifecyclePhaseId;
  order: number;
  labelKey: string;
}>;

export type LifecycleCheckpointDefinition = Readonly<{
  id: ProjectLifecycleCheckpointId;
  stageId: ProjectLifecycleStageId;
  applicability: "required" | "conditional" | "optional" | "not_applicable" | "unknown";
  validationRole?: ProjectLifecycleRole;
  labelKey: string;
}>;

export type ProjectLifecycleAction = Readonly<{
  id: string;
  projectId: string;
  stageId?: ProjectLifecycleStageId;
  title?: string;
  titleKey?: string;
  assignedRole?: ProjectLifecycleRole;
  assignedMemberId?: string;
  validationRole?: ProjectLifecycleRole;
  blockedRoles: readonly ProjectLifecycleRole[];
  status: LifecycleActionStatus;
  priority: LifecyclePriority;
  dueDate?: string;
  requiredEvidence: readonly string[];
  evidenceState: LifecycleEvidenceState;
  validationRequirement: LifecycleValidationRequirement;
  blocker?: string;
  destination: string;
  source: "task";
}>;

export type ProjectLifecycleState = Readonly<{
  resolution: "resolved" | "insufficient_data";
  currentStageId?: ProjectLifecycleStageId;
  currentPhaseId?: ProjectLifecyclePhaseId;
  currentStageKey: string;
  nextStageId?: ProjectLifecycleStageId;
  nextPhaseId?: ProjectLifecyclePhaseId;
  applicableStageIds: readonly ProjectLifecycleStageId[];
  completedStageIds: readonly ProjectLifecycleStageId[];
  applicabilitySource: "configured" | "default_high_level";
  progression: "ready" | "blocked" | "waiting_validation" | "insufficient_data";
  blockerIds: readonly string[];
  startingPoint: ProjectLifecycleStartingPoint;
}>;
export type ProjectRoleRecommendation = Readonly<{
  id: string;
  titleKey: string;
  descriptionKey: string;
  whyKey: string;
  actionKey: string;
  destination: string;
  evidence: "known" | "inferred" | "unavailable";
}>;

export type RoleRelevantEvidence = Readonly<{
  total: number;
  uploaded: number;
  waitingValidation: number;
  approved: number;
  rejected: number;
  unavailable: number;
}>;

export type RoleAwareLifecycleContext = Readonly<{
  viewerRole: ProjectLifecycleRole;
  roleSource: "project_membership" | "onboarding" | "organization" | "unavailable";
  lifecycle: ProjectLifecycleState;
  responsibilities: readonly LifecycleResponsibility[];
  projectActions: readonly ProjectLifecycleAction[];
  myActions: readonly ProjectLifecycleAction[];
  waitingOn: readonly ProjectLifecycleAction[];
  relevantEvidence: RoleRelevantEvidence;
  currentPriorityKey: string;
  healthExplanationKey: string;
  recommendation: ProjectRoleRecommendation;
  suggestedQuestionKeys: readonly string[];
}>;

export type ProjectLifecycleInput = Readonly<{
  project: Project;
  tasks?: readonly Task[];
  milestones?: readonly TimelineMilestone[];
  documents?: readonly Document[];
  members?: readonly ProjectMember[];
  viewer?: ProjectLifecycleViewerInput;
}>;
