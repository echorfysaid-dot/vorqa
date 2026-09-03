import type { ProjectLifecycleCheckpointId, ProjectLifecycleRole, ProjectLifecycleStageId } from "@/types/project-lifecycle";

export const stageGateStatuses = [
  "not_ready",
  "requirements_missing",
  "work_in_progress",
  "waiting_submission",
  "waiting_validation",
  "correction_required",
  "blocked",
  "ready_to_advance",
  "completed",
  "insufficient_data"
] as const;

export const stageGateRequirementTypes = ["action", "document", "evidence", "validation", "decision", "dependency", "information", "checkpoint"] as const;
export const stageGateApplicability = ["required", "optional", "conditional", "not_applicable", "unknown"] as const;
export const documentWorkflowStates = ["missing", "draft", "uploaded", "submitted", "under_review", "approved", "rejected", "correction_required", "superseded", "unavailable"] as const;
export const validationWorkflowStates = ["not_requested", "requested", "under_review", "approved", "rejected", "correction_required", "cancelled", "unavailable"] as const;
export const stageHandoffStatuses = ["not_ready", "ready", "sent", "received", "accepted", "rejected", "correction_required", "completed", "unavailable"] as const;

export type StageGateStatus = (typeof stageGateStatuses)[number];
export type StageGateRequirementType = (typeof stageGateRequirementTypes)[number];
export type StageGateRequirementApplicability = (typeof stageGateApplicability)[number];
export type DocumentWorkflowState = (typeof documentWorkflowStates)[number];
export type ValidationWorkflowState = (typeof validationWorkflowStates)[number];
export type StageHandoffStatus = (typeof stageHandoffStatuses)[number];
export type StageGateRequirementStatus = "satisfied" | "missing" | "pending" | "in_progress" | "blocked" | "correction_required" | "unavailable" | "unknown";

export type ProjectDocumentWorkflowContext = Readonly<{
  documentId: string;
  lifecycleStage?: ProjectLifecycleStageId;
  category?: string;
  type?: string;
  workflowState: DocumentWorkflowState;
  validationState: ValidationWorkflowState;
  version?: string;
  previousState?: "superseded";
  uploaderRole?: ProjectLifecycleRole;
  reviewRole?: ProjectLifecycleRole;
  relatedActionId?: string;
  observations?: string;
}>;

export type StageGateRequirement = Readonly<{
  id: string;
  type: StageGateRequirementType;
  lifecycleStage: ProjectLifecycleStageId;
  title?: string;
  titleKey: string;
  status: StageGateRequirementStatus;
  blocking: boolean;
  applicability: StageGateRequirementApplicability;
  responsibleRole?: ProjectLifecycleRole;
  validationRole?: ProjectLifecycleRole;
  checkpointId?: ProjectLifecycleCheckpointId;
  sourceId?: string;
  reasonKey: string;
}>;

export type StageGateCheckpoint = Readonly<{
  id: ProjectLifecycleCheckpointId;
  lifecycleStage: ProjectLifecycleStageId;
  applicability: StageGateRequirementApplicability;
  status: StageGateRequirementStatus;
  blocking: boolean;
  labelKey: string;
  validationRole?: ProjectLifecycleRole;
}>;

export type StageGateValidation = Readonly<{
  id: string;
  lifecycleStage: ProjectLifecycleStageId;
  subjectId: string;
  requestedByRole?: ProjectLifecycleRole;
  validationRole?: ProjectLifecycleRole;
  status: ValidationWorkflowState;
  evidenceIds: readonly string[];
  observations?: string;
  blocker: boolean;
}>;

export type ProjectStageHandoff = Readonly<{
  id: string;
  lifecycleStage: ProjectLifecycleStageId;
  subjectId: string;
  fromRole?: ProjectLifecycleRole;
  toRole?: ProjectLifecycleRole;
  status: StageHandoffStatus;
  prerequisite?: string;
  requiredPackage: readonly string[];
  blocker: boolean;
  sourceActionId?: string;
  nextActionKey: string;
}>;

export type ProjectStageGate = Readonly<{
  stageId?: ProjectLifecycleStageId;
  status: StageGateStatus;
  requirements: readonly StageGateRequirement[];
  checkpoints: readonly StageGateCheckpoint[];
  pendingCheckpoints: readonly StageGateCheckpoint[];
  blockingRequirements: readonly StageGateRequirement[];
  satisfiedRequirements: readonly StageGateRequirement[];
  missingRequirements: readonly StageGateRequirement[];
  pendingValidations: readonly StageGateValidation[];
  corrections: readonly StageGateRequirement[];
  dependencies: readonly StageGateRequirement[];
  responsibleRoles: readonly ProjectLifecycleRole[];
  handoffs: readonly ProjectStageHandoff[];
  transitionReadiness: "yes" | "no" | "insufficient_data";
  nextStageId?: ProjectLifecycleStageId;
  explanationKey: string;
}>;

export type RoleStageGateContext = Readonly<{
  viewerRole: ProjectLifecycleRole;
  status: StageGateStatus;
  transitionReadiness: ProjectStageGate["transitionReadiness"];
  requirements: readonly StageGateRequirement[];
  waitingOn: readonly ProjectStageHandoff[];
  nextActionKey: string;
  explanationKey: string;
}>;
