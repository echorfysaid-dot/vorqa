import type { ProjectLifecycleRole, ProjectLifecycleStageId } from "@/types/project-lifecycle";

export const projectWorkflowStatuses = ["draft", "submitted", "under_review", "correction_required", "approved", "rejected", "cancelled"] as const;
export type ProjectWorkflowStatus = (typeof projectWorkflowStatuses)[number];

export type ProjectWorkflow = Readonly<{
  id: string;
  projectId: string;
  workflowGroupId: string;
  revision: number;
  previousRevisionId?: string;
  workflowType: string;
  subjectKind: "document" | "task_evidence" | "lifecycle_checkpoint" | "owner_decision" | "technical_submission";
  subjectKey?: string;
  subjectVersion?: string;
  lifecycleStage: ProjectLifecycleStageId;
  status: ProjectWorkflowStatus;
  isCurrent: boolean;
  assignedRole?: ProjectLifecycleRole;
  assignedUserId?: string;
  reviewerRole?: ProjectLifecycleRole;
  reviewerUserId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  lockVersion: number;
}>;

export type ProjectWorkflowEvent = Readonly<{
  id: string;
  workflowId: string;
  actorId?: string;
  actorRole?: ProjectLifecycleRole;
  eventType: string;
  fromStatus?: ProjectWorkflowStatus;
  toStatus?: ProjectWorkflowStatus;
  fromRole?: ProjectLifecycleRole;
  toRole?: ProjectLifecycleRole;
  reason?: string;
  revision?: number;
  createdAt: string;
}>;

export type WorkflowParticipant = Readonly<{ userId: string; name: string; role?: ProjectLifecycleRole }>;

export type WorkflowAuthority = Readonly<{
  viewerRole: ProjectLifecycleRole;
  isProjectOwner: boolean;
  canReview: boolean;
  canApprove: boolean;
  confirmed: boolean;
}>;

export type ProjectWorkflowState = Readonly<{
  workflows: readonly ProjectWorkflow[];
  events: readonly ProjectWorkflowEvent[];
  participants: readonly WorkflowParticipant[];
  authority: WorkflowAuthority;
  currentLifecycleStage?: ProjectLifecycleStageId;
  source: "supabase" | "legacy";
}>;

export type WorkflowCommand = "submit" | "startReview" | "requestCorrection" | "resubmit" | "approve" | "reject" | "handoff" | "advance" | "create";
