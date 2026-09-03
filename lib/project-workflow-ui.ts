import type { ProjectStageGate } from "@/types/project-stage-gate";
import type { ProjectWorkflow, ProjectWorkflowState, WorkflowCommand } from "@/types/project-workflow";

export function workflowRequiredActionKey(workflow: ProjectWorkflow) {
  if (workflow.status === "draft") return "workflow.action.submit";
  if (workflow.status === "submitted") return "workflow.action.review";
  if (workflow.status === "under_review") return "workflow.action.decision";
  if (workflow.status === "correction_required") return "workflow.action.correction";
  return "workflow.action.complete";
}

export function allowedWorkflowActions(workflow: ProjectWorkflow, state: ProjectWorkflowState, userId?: string): readonly WorkflowCommand[] {
  if (!userId || !state.authority.confirmed || !workflow.isCurrent) return [];
  const isSubmitter = workflow.createdBy === userId || workflow.assignedUserId === userId;
  const isReviewer = workflow.reviewerUserId === userId && state.authority.canReview;
  const latestSubmissionActor = state.events.find((event) => event.workflowId === workflow.id && (event.eventType === "submitted" || event.eventType === "resubmitted"))?.actorId;
  const actions: WorkflowCommand[] = [];
  if (workflow.status === "draft" && isSubmitter) actions.push("submit");
  if (workflow.status === "submitted" && isReviewer) actions.push("startReview");
  if (workflow.status === "under_review" && isReviewer) {
    actions.push("requestCorrection");
    if (state.authority.canApprove && workflow.createdBy !== userId && latestSubmissionActor !== userId) actions.push("approve", "reject");
  }
  if (workflow.status === "correction_required" && isSubmitter) actions.push("resubmit");
  if (!["approved", "rejected"].includes(workflow.status) && (state.authority.isProjectOwner || workflow.assignedUserId === userId || workflow.reviewerUserId === userId)) actions.push("handoff");
  return actions;
}

export function isPersistedStageGateReady(state: ProjectWorkflowState, stage?: string) {
  if (state.source !== "supabase" || !stage) return false;
  const current = state.workflows.filter((item) => item.isCurrent && item.lifecycleStage === stage);
  return current.some((item) => item.subjectKind === "lifecycle_checkpoint" && item.status === "approved") && current.every((item) => item.status === "approved");
}

export function workflowVoraGuidanceKey(state: ProjectWorkflowState, gate: ProjectStageGate) {
  const current = state.workflows.filter((item) => item.isCurrent);
  if (current.some((item) => item.status === "correction_required")) return "workflow.vora.correction";
  if (current.some((item) => item.status === "submitted" || item.status === "under_review")) return "workflow.vora.waitingReview";
  if (gate.transitionReadiness === "yes") return "workflow.vora.gateReady";
  if (gate.blockingRequirements.length) return "workflow.vora.gateBlocked";
  return undefined;
}
