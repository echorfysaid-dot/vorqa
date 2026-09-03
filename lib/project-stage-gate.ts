import type { Document, ProjectMember, Task } from "@/lib/models";
import { createProjectLifecycleActions, normalizeLifecycleRole, normalizeLifecycleStage, projectLifecycleCheckpoints, resolveProjectLifecycleState } from "@/lib/project-lifecycle";
import {
  normalizeWorkflowDocumentStatus,
  normalizeWorkflowValidationStatus,
  workflowMetadataBoolean,
  workflowMetadataString,
} from "@/lib/project-workflow-normalization";
import type { ProjectLifecycleAction, ProjectLifecycleCheckpointId, ProjectLifecycleInput, ProjectLifecycleRole, ProjectLifecycleStageId } from "@/types/project-lifecycle";
import type {
  DocumentWorkflowState,
  ProjectDocumentWorkflowContext,
  ProjectStageGate,
  StageGateCheckpoint,
  ProjectStageHandoff,
  RoleStageGateContext,
  StageGateRequirement,
  StageGateRequirementApplicability,
  StageGateRequirementStatus,
  StageGateStatus,
  StageGateValidation,
  StageHandoffStatus,
  ValidationWorkflowState
} from "@/types/project-stage-gate";

const metadataString = workflowMetadataString;
const metadataBoolean = workflowMetadataBoolean;

function checkpointStatus(value: unknown): StageGateRequirementStatus {
  const normalized = typeof value === "string" ? value.trim().toLowerCase().replace(/[\s-]+/g, "_") : "";
  if (["approved", "accepted", "validated", "completed", "recorded", "closed", "satisfied"].includes(normalized)) return "satisfied";
  if (["submitted", "under_review", "waiting_validation", "requested", "pending"].includes(normalized)) return "pending";
  if (["in_progress", "started"].includes(normalized)) return "in_progress";
  if (["rejected", "correction_required"].includes(normalized)) return "correction_required";
  if (normalized === "blocked") return "blocked";
  if (normalized === "missing") return "missing";
  if (normalized === "unavailable") return "unavailable";
  return "unknown";
}

function checkpointConfiguration(metadata: Record<string, unknown> | undefined, id: ProjectLifecycleCheckpointId) {
  const roots = [metadata?.lifecycleCheckpoints, metadata?.stageGateCheckpoints, metadata?.checkpoints];
  for (const root of roots) {
    if (!root || typeof root !== "object" || Array.isArray(root)) continue;
    const entry = (root as Record<string, unknown>)[id];
    if (entry !== undefined) return entry;
  }
  return undefined;
}

function stageCheckpoints(input: ProjectLifecycleInput, stageId: ProjectLifecycleStageId) {
  return Object.freeze(projectLifecycleCheckpoints.filter((definition) => definition.stageId === stageId).map((definition): StageGateCheckpoint & { configured: boolean } => {
    const entry = checkpointConfiguration(input.project.metadata, definition.id);
    const record = entry && typeof entry === "object" && !Array.isArray(entry) ? entry as Record<string, unknown> : undefined;
    const status = checkpointStatus(record?.status ?? entry);
    const applicability = record?.applicability === "required" || record?.applicability === "optional" || record?.applicability === "conditional" || record?.applicability === "not_applicable" ? record.applicability : definition.applicability;
    const configured = entry !== undefined;
    return Object.freeze({ id: definition.id, lifecycleStage: stageId, applicability, status: configured && status === "unknown" ? "missing" : status, blocking: configured && applicability === "required", labelKey: definition.labelKey, ...(definition.validationRole ? { validationRole: definition.validationRole } : {}), configured });
  }));
}

function checkpointRequirements(checkpoints: readonly (StageGateCheckpoint & { configured: boolean })[]) {
  return checkpoints.filter((checkpoint) => checkpoint.configured || checkpoint.applicability === "required").map((checkpoint) => requirement({
    id: `checkpoint:${checkpoint.id}`, type: "checkpoint", lifecycleStage: checkpoint.lifecycleStage, checkpointId: checkpoint.id,
    titleKey: checkpoint.labelKey, status: checkpoint.status, blocking: checkpoint.blocking, applicability: checkpoint.applicability,
    ...(checkpoint.validationRole ? { validationRole: checkpoint.validationRole } : {})
  }));
}
function requirementStatusForAction(action: ProjectLifecycleAction): StageGateRequirementStatus {
  if (action.status === "completed") return "satisfied";
  if (action.status === "blocked") return "blocked";
  if (action.status === "rejected") return "correction_required";
  if (action.status === "in_progress") return "in_progress";
  if (["submitted", "waiting_validation"].includes(action.status)) return "pending";
  if (["ready", "not_started"].includes(action.status)) return "missing";
  return "unavailable";
}

function validationStateFrom(value: unknown): ValidationWorkflowState {
  const status = normalizeWorkflowValidationStatus(value);
  return status === "submitted" ? "requested" : status;
}

function documentWorkflowState(document: Document): DocumentWorkflowState {
  return normalizeWorkflowDocumentStatus(document);
}

function documentValidationState(document: Document): ValidationWorkflowState {
  const explicit = metadataString(document.metadata, "validationStatus", "approvalStatus", "reviewStatus");
  const resolved = validationStateFrom(explicit);
  if (resolved !== "unavailable") return resolved;
  const workflow = documentWorkflowState(document);
  if (workflow === "submitted") return "requested";
  if (workflow === "under_review") return "under_review";
  if (workflow === "approved") return "approved";
  if (workflow === "rejected") return "rejected";
  if (workflow === "correction_required") return "correction_required";
  return "not_requested";
}

function roleFromDocument(document: Document, members: readonly ProjectMember[], keys: readonly string[]) {
  const explicit = normalizeLifecycleRole(metadataString(document.metadata, ...keys));
  if (explicit) return explicit;
  const member = members.find((item) => item.employeeId === document.uploaderId || item.id === document.uploaderId);
  return normalizeLifecycleRole(member?.role);
}

export function normalizeProjectDocumentWorkflow(document: Document, members: readonly ProjectMember[] = []): ProjectDocumentWorkflowContext {
  const lifecycleStage = normalizeLifecycleStage(metadataString(document.metadata, "lifecycleStage", "stage"));
  const validationState = documentValidationState(document);
  const workflowState = documentWorkflowState(document);
  const version = document.version || metadataString(document.metadata, "version", "currentVersion");
  const previousState = workflowState === "superseded" || metadataBoolean(document.metadata, "superseded") === true ? "superseded" as const : undefined;
  return Object.freeze({
    documentId: document.id,
    ...(lifecycleStage ? { lifecycleStage } : {}),
    ...(document.category ? { category: String(document.category) } : {}),
    ...(document.type ? { type: String(document.type) } : {}),
    workflowState,
    validationState,
    ...(version ? { version } : {}),
    ...(previousState ? { previousState } : {}),
    ...(roleFromDocument(document, members, ["uploaderRole", "assignedRole"]) ? { uploaderRole: roleFromDocument(document, members, ["uploaderRole", "assignedRole"]) } : {}),
    ...(normalizeLifecycleRole(metadataString(document.metadata, "validationRole", "reviewerRole")) ? { reviewRole: normalizeLifecycleRole(metadataString(document.metadata, "validationRole", "reviewerRole")) } : {}),
    ...(metadataString(document.metadata, "relatedActionId", "taskId") ? { relatedActionId: metadataString(document.metadata, "relatedActionId", "taskId") } : {}),
    ...(metadataString(document.metadata, "observations", "observation") ? { observations: metadataString(document.metadata, "observations", "observation") } : {})
  });
}

function requirement(input: Omit<StageGateRequirement, "titleKey" | "reasonKey"> & { titleKey?: string; reasonKey?: string }): StageGateRequirement {
  return Object.freeze({
    ...input,
    titleKey: input.titleKey || `projectStageGate.requirement.${input.type}`,
    reasonKey: input.reasonKey || `projectStageGate.reason.${input.status}`
  });
}

function requirementApplicability(action: ProjectLifecycleAction): StageGateRequirementApplicability {
  return action.validationRequirement === "not_required" ? "optional" : action.validationRequirement === "required" ? "required" : "unknown";
}

function actionRequirement(action: ProjectLifecycleAction, stageId: ProjectLifecycleStageId) {
  return requirement({
    id: `action:${action.id}`,
    type: "action",
    lifecycleStage: stageId,
    title: action.title,
    titleKey: "projectStageGate.requirement.action",
    status: requirementStatusForAction(action),
    blocking: action.priority === "critical" || action.priority === "high" || action.blockedRoles.length > 0,
    applicability: "required",
    ...(action.assignedRole ? { responsibleRole: action.assignedRole } : {}),
    ...(action.validationRole ? { validationRole: action.validationRole } : {}),
    sourceId: action.id
  });
}

function evidenceRequirement(action: ProjectLifecycleAction, stageId: ProjectLifecycleStageId) {
  if (!action.requiredEvidence.length) return undefined;
  const status: StageGateRequirementStatus = action.evidenceState === "approved" ? "satisfied"
    : ["rejected", "correction_required"].includes(action.evidenceState) ? "correction_required"
      : ["submitted", "waiting_validation", "uploaded"].includes(action.evidenceState) ? "pending"
        : action.evidenceState === "missing" ? "missing" : "unavailable";
  return requirement({
    id: `evidence:${action.id}`,
    type: "evidence",
    lifecycleStage: stageId,
    titleKey: "projectStageGate.requirement.evidence",
    status,
    blocking: true,
    applicability: "required",
    ...(action.assignedRole ? { responsibleRole: action.assignedRole } : {}),
    ...(action.validationRole ? { validationRole: action.validationRole } : {}),
    sourceId: action.id
  });
}

function validationRequirement(action: ProjectLifecycleAction, stageId: ProjectLifecycleStageId) {
  if (action.validationRequirement !== "required" || !action.validationRole) return undefined;
  const status: StageGateRequirementStatus = action.status === "completed" && action.evidenceState === "approved" ? "satisfied"
    : action.status === "rejected" ? "correction_required"
      : ["submitted", "waiting_validation"].includes(action.status) ? "pending"
        : action.status === "blocked" ? "blocked" : "missing";
  return requirement({
    id: `validation:${action.id}`,
    type: "validation",
    lifecycleStage: stageId,
    title: action.title,
    titleKey: "projectStageGate.requirement.validation",
    status,
    blocking: true,
    applicability: requirementApplicability(action),
    ...(action.assignedRole ? { responsibleRole: action.assignedRole } : {}),
    validationRole: action.validationRole,
    sourceId: action.id
  });
}

function dependencyRequirements(action: ProjectLifecycleAction, stageId: ProjectLifecycleStageId) {
  return action.blockedRoles.map((role) => requirement({
    id: `dependency:${action.id}:${role}`,
    type: "dependency",
    lifecycleStage: stageId,
    title: action.title,
    titleKey: "projectStageGate.requirement.dependency",
    status: action.status === "completed" ? "satisfied" : action.status === "blocked" ? "blocked" : "pending",
    blocking: true,
    applicability: "required",
    responsibleRole: role,
    sourceId: action.id
  }));
}

function documentRequirements(documents: readonly ProjectDocumentWorkflowContext[], stageId: ProjectLifecycleStageId) {
  return documents.filter((document) => document.lifecycleStage === stageId || document.relatedActionId).flatMap((document) => {
    const status: StageGateRequirementStatus = document.workflowState === "approved" || document.validationState === "approved" ? "satisfied"
      : ["rejected", "correction_required"].includes(document.workflowState) || ["rejected", "correction_required"].includes(document.validationState) ? "correction_required"
        : ["submitted", "under_review"].includes(document.workflowState) || ["requested", "under_review"].includes(document.validationState) ? "pending"
          : document.workflowState === "draft" ? "missing" : "unavailable";
    return [requirement({
      id: `document:${document.documentId}`,
      type: "document",
      lifecycleStage: stageId,
      titleKey: "projectStageGate.requirement.document",
      status,
      blocking: false,
      applicability: "conditional",
      ...(document.uploaderRole ? { responsibleRole: document.uploaderRole } : {}),
      ...(document.reviewRole ? { validationRole: document.reviewRole } : {}),
      sourceId: document.documentId
    })];
  });
}

function validationForAction(action: ProjectLifecycleAction, stageId: ProjectLifecycleStageId): StageGateValidation | undefined {
  if (action.validationRequirement !== "required" || !action.validationRole) return undefined;
  const status: ValidationWorkflowState = action.status === "completed" && action.evidenceState === "approved" ? "approved"
    : action.status === "rejected" ? action.evidenceState === "correction_required" ? "correction_required" : "rejected"
      : action.status === "waiting_validation" ? "under_review"
        : action.status === "submitted" ? "requested" : "not_requested";
  return Object.freeze({
    id: `validation:${action.id}`,
    lifecycleStage: stageId,
    subjectId: action.id,
    ...(action.assignedRole ? { requestedByRole: action.assignedRole } : {}),
    validationRole: action.validationRole,
    status,
    evidenceIds: Object.freeze(action.requiredEvidence.map((item) => `${action.id}:${item}`)),
    blocker: status !== "approved" && status !== "not_requested"
  });
}

function handoffForAction(action: ProjectLifecycleAction, stageId: ProjectLifecycleStageId): ProjectStageHandoff | undefined {
  if (!action.assignedRole || !action.validationRole || action.validationRole === action.assignedRole) return undefined;
  const status: StageHandoffStatus = action.status === "completed" ? "completed"
    : action.status === "rejected" ? "correction_required"
      : ["submitted", "waiting_validation"].includes(action.status) ? "sent"
        : action.status === "blocked" ? "not_ready" : "ready";
  return Object.freeze({
    id: `handoff:${action.id}`,
    lifecycleStage: stageId,
    subjectId: action.id,
    fromRole: action.status === "rejected" ? action.validationRole : action.assignedRole,
    toRole: action.status === "rejected" ? action.assignedRole : action.validationRole,
    status,
    ...(action.blocker ? { prerequisite: action.blocker } : {}),
    requiredPackage: Object.freeze([...action.requiredEvidence]),
    blocker: status === "not_ready" || status === "correction_required",
    sourceActionId: action.id,
    nextActionKey: status === "correction_required" ? "projectStageGate.handoff.correct" : status === "sent" ? "projectStageGate.handoff.review" : "projectStageGate.handoff.prepare"
  });
}

function gateStatus(requirements: readonly StageGateRequirement[], lifecycleCompleted: boolean): StageGateStatus {
  if (lifecycleCompleted) return "completed";
  if (!requirements.length) return "insufficient_data";
  const blocking = requirements.filter((item) => item.blocking && item.applicability !== "not_applicable");
  if (!blocking.length) return "insufficient_data";
  if (blocking.some((item) => item.status === "correction_required")) return "correction_required";
  if (blocking.some((item) => item.status === "blocked")) return "blocked";
  if (blocking.some((item) => item.status === "missing")) return "requirements_missing";
  if (blocking.some((item) => (item.type === "validation" || item.type === "checkpoint") && item.status === "pending" && item.validationRole)) return "waiting_validation";
  if (blocking.some((item) => item.type === "evidence" && item.status === "pending")) return "waiting_submission";
  if (blocking.some((item) => item.status === "in_progress")) return "work_in_progress";
  if (blocking.every((item) => item.status === "satisfied")) return "ready_to_advance";
  if (blocking.some((item) => item.status === "unknown" || item.status === "unavailable")) return "insufficient_data";
  return "not_ready";
}

export function createProjectStageGate(input: ProjectLifecycleInput): ProjectStageGate {
  const lifecycle = resolveProjectLifecycleState(input);
  const stageId = lifecycle.currentStageId;
  if (!stageId) return Object.freeze({
    status: "insufficient_data",
    requirements: Object.freeze([]), checkpoints: Object.freeze([]), pendingCheckpoints: Object.freeze([]), blockingRequirements: Object.freeze([]), satisfiedRequirements: Object.freeze([]), missingRequirements: Object.freeze([]), pendingValidations: Object.freeze([]), corrections: Object.freeze([]), dependencies: Object.freeze([]), responsibleRoles: Object.freeze([]), handoffs: Object.freeze([]), transitionReadiness: "insufficient_data", explanationKey: "projectStageGate.explanation.insufficient_data"
  });

  const actions = createProjectLifecycleActions(input, lifecycle).filter((action) => action.stageId === stageId);
  const documents = (input.documents || []).map((document) => normalizeProjectDocumentWorkflow(document, input.members || []));
  const checkpoints = stageCheckpoints(input, stageId);
  const requirements = Object.freeze([
    ...checkpointRequirements(checkpoints),
    ...actions.flatMap((action) => [actionRequirement(action, stageId), evidenceRequirement(action, stageId), validationRequirement(action, stageId), ...dependencyRequirements(action, stageId)].filter((item): item is StageGateRequirement => Boolean(item))),
    ...documentRequirements(documents, stageId)
  ]);
  const completed = lifecycle.completedStageIds.includes(stageId);
  const status = gateStatus(requirements, completed);
  const blockingRequirements = Object.freeze(requirements.filter((item) => item.blocking && item.applicability !== "not_applicable"));
  const satisfiedRequirements = Object.freeze(requirements.filter((item) => item.status === "satisfied"));
  const missingRequirements = Object.freeze(requirements.filter((item) => ["missing", "unknown", "unavailable"].includes(item.status) && item.blocking));
  const pendingValidations = Object.freeze(actions.map((action) => validationForAction(action, stageId)).filter((item): item is StageGateValidation => item !== undefined && ["requested", "under_review"].includes(item.status)));
  const corrections = Object.freeze(requirements.filter((item) => item.status === "correction_required"));
  const dependencies = Object.freeze(requirements.filter((item) => item.type === "dependency"));
  const handoffs = Object.freeze(actions.map((action) => handoffForAction(action, stageId)).filter((item): item is ProjectStageHandoff => Boolean(item)));
  const responsibleRoles = Object.freeze([...new Set(requirements.flatMap((item) => [item.responsibleRole, item.validationRole]).filter((role): role is ProjectLifecycleRole => Boolean(role)))]);
  return Object.freeze({
    stageId,
    status,
    requirements,
    checkpoints,
    pendingCheckpoints: Object.freeze(checkpoints.filter((checkpoint) => ["missing", "pending", "in_progress", "blocked", "correction_required"].includes(checkpoint.status))),
    blockingRequirements,
    satisfiedRequirements,
    missingRequirements,
    pendingValidations,
    corrections,
    dependencies,
    responsibleRoles,
    handoffs,
    transitionReadiness: status === "ready_to_advance" || status === "completed" ? "yes" : status === "insufficient_data" ? "insufficient_data" : "no",
    ...(lifecycle.nextStageId ? { nextStageId: lifecycle.nextStageId } : {}),
    explanationKey: `projectStageGate.explanation.${status}`
  });
}

export function getRoleStageGateContext(gate: ProjectStageGate, role: ProjectLifecycleRole): RoleStageGateContext {
  const owner = role === "project_owner";
  const requirements = Object.freeze(gate.requirements.filter((item) => owner ? item.blocking || item.status === "correction_required" : item.responsibleRole === role || item.validationRole === role));
  const waitingOn = Object.freeze(gate.handoffs.filter((handoff) => handoff.toRole === role || (owner && handoff.blocker)));
  const nextActionKey = gate.status === "correction_required" && requirements.some((item) => item.responsibleRole === role) ? "projectStageGate.role.correct"
    : gate.status === "waiting_validation" && requirements.some((item) => item.validationRole === role) ? "projectStageGate.role.validate"
      : gate.status === "ready_to_advance" ? "projectStageGate.role.ready" : "projectStageGate.role.monitor";
  return Object.freeze({
    viewerRole: role,
    status: gate.status,
    transitionReadiness: gate.transitionReadiness,
    requirements,
    waitingOn,
    nextActionKey,
    explanationKey: `projectStageGate.role.${role}.${gate.status}`
  });
}

export function getProjectStageGateSummary(gate: ProjectStageGate) {
  return Object.freeze({
    stageId: gate.stageId,
    status: gate.status,
    transitionReadiness: gate.transitionReadiness,
    nextStageId: gate.nextStageId,
    counts: Object.freeze({ blocking: gate.blockingRequirements.length, satisfied: gate.satisfiedRequirements.length, missing: gate.missingRequirements.length, validations: gate.pendingValidations.length, corrections: gate.corrections.length, handoffs: gate.handoffs.length })
  });
}
