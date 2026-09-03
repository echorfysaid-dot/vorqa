import type { Document, ProjectMember, Task } from "@/lib/models";
import type {
  LifecycleActionStatus,
  LifecycleEvidenceState,
  LifecyclePriority,
  LifecycleResponsibility,
  LifecycleResponsibilityKind,
  LifecycleCheckpointDefinition,
  LifecyclePhaseDefinition,
  LifecycleStageDefinition,
  ProjectLifecycleAction,
  ProjectLifecycleInput,
  ProjectLifecyclePhaseId,
  ProjectLifecycleRole,
  ProjectLifecycleStartingPoint,
  ProjectLifecycleStageId,
  ProjectLifecycleState,
  ProjectLifecycleViewerInput,
  ProjectRoleRecommendation,
  RoleAwareLifecycleContext,
  RoleRelevantEvidence
} from "@/types/project-lifecycle";
import { projectLifecycleRoleIds, projectLifecycleStageIds } from "@/types/project-lifecycle";
import {
  normalizeWorkflowEvidenceStatus,
  normalizeWorkflowToken,
  normalizeWorkflowValidationStatus,
  workflowMetadataBoolean,
  workflowMetadataString,
  workflowMetadataStrings
} from "@/lib/project-workflow-normalization";

function responsibility(role: ProjectLifecycleRole, kind: LifecycleResponsibilityKind, ...actionIds: string[]): LifecycleResponsibility {
  return Object.freeze({ role, kind, actionIds: Object.freeze(actionIds) });
}

function stage(
  id: ProjectLifecycleStageId,
  order: number,
  phaseId: ProjectLifecyclePhaseId,
  responsibilities: Partial<Record<ProjectLifecycleRole, LifecycleResponsibility>>
): LifecycleStageDefinition {
  return Object.freeze({ id, order, phaseId, labelKey: `projectLifecycle.stage.${id}`, responsibilities: Object.freeze(responsibilities) });
}

function phase(id: ProjectLifecyclePhaseId, order: number): LifecyclePhaseDefinition {
  return Object.freeze({ id, order, labelKey: `projectLifecycle.phase.${id}` });
}

const owner = responsibility("project_owner", "owner", "monitor_progress", "resolve_owner_decision");
const contractor = responsibility("contractor", "execution", "execute_stage_work", "upload_evidence", "close_observations", "request_validation");
const architect = responsibility("architect", "review", "coordinate_design", "review_design_changes", "resolve_design_observation");
const engineer = responsibility("engineer", "review", "review_technical_submission", "respond_technical_observation");
const controlOffice = responsibility("control_office", "validation", "review_inspection", "record_validation");
const laboratory = responsibility("laboratory", "execution", "perform_requested_test", "submit_test_report");
const surveyor = responsibility("surveyor", "execution", "perform_requested_survey", "submit_survey_record");
const otherMember = responsibility("other_project_member", "observer", "monitor_assigned_work");

export const projectLifecyclePhases: readonly LifecyclePhaseDefinition[] = Object.freeze([
  phase("project_preparation", 1),
  phase("studies_design", 2),
  phase("construction_authorization", 3),
  phase("pre_construction_site_opening", 4),
  phase("earthworks_foundations", 5),
  phase("structural_works", 6),
  phase("secondary_technical_works", 7),
  phase("finishing", 8),
  phase("end_of_works", 9),
  phase("final_administrative_completion", 10)
]);

export const projectLifecycleStages: readonly LifecycleStageDefinition[] = Object.freeze([
  stage("project_preparation", 1, "project_preparation", { project_owner: owner, architect, engineer, surveyor, other_project_member: otherMember }),
  stage("site_property_preparation", 2, "project_preparation", { project_owner: owner, architect, engineer, surveyor, other_project_member: otherMember }),
  stage("design_studies", 3, "studies_design", { project_owner: owner, architect, engineer, control_office: controlOffice, surveyor, other_project_member: otherMember }),
  stage("technical_studies", 4, "studies_design", { project_owner: owner, architect, engineer, control_office: controlOffice, laboratory, surveyor, other_project_member: otherMember }),
  stage("authorization_preparation", 5, "construction_authorization", { project_owner: owner, architect, engineer, control_office: controlOffice, surveyor, other_project_member: otherMember }),
  stage("construction_authorization", 6, "construction_authorization", { project_owner: owner, architect, engineer, control_office: controlOffice, surveyor, other_project_member: otherMember }),
  stage("execution_preparation", 7, "pre_construction_site_opening", { project_owner: owner, contractor, architect, engineer, control_office: controlOffice, laboratory, surveyor, other_project_member: otherMember }),
  stage("site_opening", 8, "pre_construction_site_opening", { project_owner: owner, contractor, architect, engineer, control_office: controlOffice, laboratory, surveyor, other_project_member: otherMember }),
  stage("excavation_earthworks", 9, "earthworks_foundations", { project_owner: owner, contractor, architect, engineer, control_office: controlOffice, laboratory, surveyor, other_project_member: otherMember }),
  stage("foundations", 10, "earthworks_foundations", { project_owner: owner, contractor, architect, engineer, control_office: controlOffice, laboratory, surveyor, other_project_member: otherMember }),
  stage("structural_works", 11, "structural_works", { project_owner: owner, contractor, architect, engineer, control_office: controlOffice, laboratory, surveyor, other_project_member: otherMember }),
  stage("secondary_works", 12, "secondary_technical_works", { project_owner: owner, contractor, architect, engineer, control_office: controlOffice, laboratory, other_project_member: otherMember }),
  stage("technical_installations", 13, "secondary_technical_works", { project_owner: owner, contractor, architect, engineer, control_office: controlOffice, laboratory, other_project_member: otherMember }),
  stage("finishing", 14, "finishing", { project_owner: owner, contractor, architect, engineer, control_office: controlOffice, other_project_member: otherMember }),
  stage("end_of_works", 15, "end_of_works", { project_owner: owner, contractor, architect, engineer, control_office: controlOffice, laboratory, surveyor, other_project_member: otherMember }),
  stage("occupancy_administrative", 16, "final_administrative_completion", { project_owner: owner, architect, engineer, control_office: controlOffice, other_project_member: otherMember }),
  stage("project_completed", 17, "final_administrative_completion", { project_owner: owner, contractor: responsibility("contractor", "observer", "monitor_assigned_work"), architect: responsibility("architect", "observer", "monitor_assigned_work"), engineer: responsibility("engineer", "observer", "monitor_assigned_work"), control_office: responsibility("control_office", "observer", "monitor_assigned_work"), laboratory: responsibility("laboratory", "observer", "monitor_assigned_work"), surveyor: responsibility("surveyor", "observer", "monitor_assigned_work"), other_project_member: otherMember })
]);

export const projectLifecycleCheckpoints: readonly LifecycleCheckpointDefinition[] = Object.freeze([
  { id: "project_facts_recorded", stageId: "project_preparation", applicability: "conditional", labelKey: "projectLifecycle.checkpoint.project_facts_recorded" },
  { id: "site_property_information_recorded", stageId: "site_property_preparation", applicability: "conditional", labelKey: "projectLifecycle.checkpoint.site_property_information_recorded" },
  { id: "initial_studies_scope", stageId: "design_studies", applicability: "conditional", labelKey: "projectLifecycle.checkpoint.initial_studies_scope" },
  { id: "design_package", stageId: "design_studies", applicability: "conditional", labelKey: "projectLifecycle.checkpoint.design_package" },
  { id: "technical_study_evidence", stageId: "technical_studies", applicability: "conditional", labelKey: "projectLifecycle.checkpoint.technical_study_evidence" },
  { id: "authorization_package_prepared", stageId: "authorization_preparation", applicability: "conditional", labelKey: "projectLifecycle.checkpoint.authorization_package_prepared" },
  { id: "authorization_recorded", stageId: "construction_authorization", applicability: "conditional", labelKey: "projectLifecycle.checkpoint.authorization_recorded" },
  { id: "execution_coordination_recorded", stageId: "execution_preparation", applicability: "conditional", labelKey: "projectLifecycle.checkpoint.execution_coordination_recorded" },
  { id: "site_opening_recorded", stageId: "site_opening", applicability: "conditional", labelKey: "projectLifecycle.checkpoint.site_opening_recorded" },
  { id: "excavation_bottom_review", stageId: "excavation_earthworks", applicability: "conditional", validationRole: "control_office", labelKey: "projectLifecycle.checkpoint.excavation_bottom_review" },
  { id: "foundation_control", stageId: "foundations", applicability: "conditional", validationRole: "control_office", labelKey: "projectLifecycle.checkpoint.foundation_control" },
  { id: "foundation_reception", stageId: "foundations", applicability: "conditional", validationRole: "control_office", labelKey: "projectLifecycle.checkpoint.foundation_reception" },
  { id: "structural_reception", stageId: "structural_works", applicability: "conditional", validationRole: "control_office", labelKey: "projectLifecycle.checkpoint.structural_reception" },
  { id: "technical_review", stageId: "technical_installations", applicability: "conditional", validationRole: "engineer", labelKey: "projectLifecycle.checkpoint.technical_review" },
  { id: "finishing_reception", stageId: "finishing", applicability: "conditional", validationRole: "architect", labelKey: "projectLifecycle.checkpoint.finishing_reception" },
  { id: "final_observations_closed", stageId: "end_of_works", applicability: "conditional", labelKey: "projectLifecycle.checkpoint.final_observations_closed" },
  { id: "final_administrative_authorization_recorded", stageId: "occupancy_administrative", applicability: "conditional", labelKey: "projectLifecycle.checkpoint.final_administrative_authorization_recorded" }
]);
const roleAliases: Readonly<Record<string, ProjectLifecycleRole>> = Object.freeze({
  project_owner: "project_owner",
  owner: "project_owner",
  manager: "project_owner",
  project_manager: "project_owner",
  real_estate_developer: "project_owner",
  contractor: "contractor",
  entrepreneur: "contractor",
  worker: "contractor",
  technician: "contractor",
  construction_company: "contractor",
  architect: "architect",
  architecture_studio: "architect",
  engineer: "engineer",
  engineering_office: "engineer",
  study_office: "engineer",
  inspector: "control_office",
  reviewer: "control_office",
  control_office: "control_office",
  bureau_de_controle: "control_office",
  laboratory: "laboratory",
  lab: "laboratory",
  surveyor: "surveyor",
  topographer: "surveyor",
  topographic_surveyor: "surveyor",
  supplier: "other_project_member",
  viewer: "other_project_member",
  other: "other_project_member",
  other_project_member: "other_project_member"
});

const stageAliases: Readonly<Record<string, ProjectLifecycleStageId>> = Object.freeze({
  preparation: "project_preparation", planning: "project_preparation", idea: "project_preparation",
  land_only: "site_property_preparation", design: "design_studies", architectural_plans: "design_studies",
  technical_study: "technical_studies", permits: "authorization_preparation", procurement: "authorization_preparation",
  looking_professionals: "execution_preparation", construction_started: "site_opening", site_preparation: "execution_preparation",
  excavation: "excavation_earthworks", foundation: "foundations", structure: "structural_works", structural: "structural_works", gros_oeuvre: "structural_works",
  technical_works: "technical_installations", handover: "end_of_works", occupancy: "occupancy_administrative", completed: "project_completed"
});

const legacyStageIds = new Set(["studies_design", "construction_authorization", "site_preparation_opening", "excavation_foundations", "technical_secondary_works"]);
const priorityWeight: Record<LifecyclePriority, number> = { low: 1, medium: 2, high: 3, critical: 4 };
const statusWeight: Record<LifecycleActionStatus, number> = { blocked: 9, rejected: 8, waiting_validation: 7, submitted: 6, in_progress: 5, ready: 4, not_started: 3, unavailable: 2, completed: 1 };

function normalizeToken(value: unknown) {
  return normalizeWorkflowToken(value);
}

export function normalizeLifecycleRole(value: unknown): ProjectLifecycleRole | undefined {
  const normalized = normalizeToken(value);
  return roleAliases[normalized] || (projectLifecycleRoleIds.includes(normalized as ProjectLifecycleRole) ? normalized as ProjectLifecycleRole : undefined);
}

export function normalizeLifecycleStage(value: unknown): ProjectLifecycleStageId | undefined {
  const normalized = normalizeToken(value);
  return projectLifecycleStageIds.includes(normalized as ProjectLifecycleStageId) ? normalized as ProjectLifecycleStageId : stageAliases[normalized];
}

const metadataString = workflowMetadataString;
const metadataBoolean = workflowMetadataBoolean;
const metadataStrings = workflowMetadataStrings;

function metadataAffirms(metadata: Record<string, unknown> | undefined, ...keys: string[]) {
  return metadataBoolean(metadata, ...keys) === true || keys.some((key) => Boolean(metadataString(metadata, key)) && !["false", "no", "none", "not_started", "unknown"].includes(normalizeToken(metadataString(metadata, key))));
}
function recordedStatus(metadata: Record<string, unknown> | undefined, ...keys: string[]) {
  return ["approved", "obtained", "recorded", "validated", "completed", "accepted", "open", "opened", "started"].includes(normalizeToken(metadataString(metadata, ...keys)));
}
function hasExplicitTechnicalStudy(metadata?: Record<string, unknown>) { return metadataAffirms(metadata, "technicalStudyCompleted", "technicalStudyEvidence", "geotechnicalStudyCompleted", "structuralStudyCompleted") || recordedStatus(metadata, "technicalStudyStatus", "technicalStudyEvidenceStatus", "geotechnicalStudyStatus", "structuralStudyStatus"); }
function hasAuthorizationRecorded(metadata?: Record<string, unknown>) { return recordedStatus(metadata, "permitStatus", "authorizationStatus", "constructionAuthorizationStatus") || metadataAffirms(metadata, "authorizationRecorded", "permitObtained", "authorizationObtained"); }
function hasExecutionPreparation(metadata?: Record<string, unknown>) { return metadataAffirms(metadata, "executionPreparationRecorded", "contractorSelected", "hasSelectedContractor") || Boolean(metadataString(metadata, "selectedContractorId", "contractorId", "assignedContractorId")); }
function hasSiteOpening(metadata?: Record<string, unknown>) { return metadataAffirms(metadata, "siteOpeningRecorded", "siteOpened", "constructionStarted", "executionStarted") || recordedStatus(metadata, "siteOpeningStatus") || Boolean(metadataString(metadata, "siteOpeningDate", "constructionStartedAt", "actualStartDate")); }
function hasExcavationEvidence(metadata?: Record<string, unknown>) { return metadataAffirms(metadata, "excavationStarted", "earthworksStarted", "excavationBottomReviewed") || recordedStatus(metadata, "excavationStatus", "earthworksStatus"); }
function hasFoundationProgress(metadata?: Record<string, unknown>) { return metadataAffirms(metadata, "foundationStarted", "foundationControlRecorded", "foundationReceptionRecorded") || recordedStatus(metadata, "foundationStatus", "foundationControlStatus", "foundationReceptionStatus"); }
function hasTechnicalInstallations(metadata?: Record<string, unknown>) { return metadataAffirms(metadata, "technicalInstallationsStarted", "technicalReviewRecorded") || recordedStatus(metadata, "technicalInstallationsStatus", "technicalReviewStatus"); }
function resolveLegacyLifecycleStage(value: string, metadata?: Record<string, unknown>): ProjectLifecycleStageId | undefined {
  const normalized = normalizeToken(value);
  if (normalized === "studies_design") return hasExplicitTechnicalStudy(metadata) ? "technical_studies" : "design_studies";
  if (normalized === "construction_authorization") return hasAuthorizationRecorded(metadata) ? "construction_authorization" : "authorization_preparation";
  if (normalized === "site_preparation_opening") return hasSiteOpening(metadata) ? "site_opening" : "execution_preparation";
  if (normalized === "excavation_foundations") return hasFoundationProgress(metadata) ? "foundations" : "excavation_earthworks";
  if (normalized === "technical_secondary_works") return hasTechnicalInstallations(metadata) ? "technical_installations" : "secondary_works";
  return stageAliases[normalized];
}
function lifecycleVersion(metadata?: Record<string, unknown>) {
  const value = metadata?.lifecycleVersion;
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 1;
}

function resolveLifecycleStageForProject(value: unknown, metadata?: Record<string, unknown>): ProjectLifecycleStageId | undefined {
  const normalized = normalizeToken(value);
  if (normalized === "construction_authorization" && lifecycleVersion(metadata) < 2) return resolveLegacyLifecycleStage(normalized, metadata);
  return projectLifecycleStageIds.includes(normalized as ProjectLifecycleStageId) ? normalized as ProjectLifecycleStageId : resolveLegacyLifecycleStage(normalized, metadata);
}

function findViewerMember(members: readonly ProjectMember[], userId?: string) {
  if (!userId) return undefined;
  return members.find((member) => member.employeeId === userId || member.id === userId);
}

export function resolveProjectParticipantRole(input: {
  members?: readonly ProjectMember[];
  viewer?: ProjectLifecycleViewerInput;
}): Readonly<{ role: ProjectLifecycleRole; source: RoleAwareLifecycleContext["roleSource"] }> {
  const member = findViewerMember(input.members || [], input.viewer?.userId);
  const memberRole = normalizeLifecycleRole(member?.role);
  if (memberRole) return Object.freeze({ role: memberRole, source: "project_membership" });
  const onboardingRole = normalizeLifecycleRole(input.viewer?.primaryRole);
  if (onboardingRole) return Object.freeze({ role: onboardingRole, source: "onboarding" });
  const organizationRole = normalizeLifecycleRole(input.viewer?.organizationType);
  if (organizationRole) return Object.freeze({ role: organizationRole, source: "organization" });
  return Object.freeze({ role: "other_project_member", source: "unavailable" });
}

function configuredStages(metadata: Record<string, unknown> | undefined) {
  const configured = metadataStrings(metadata, "lifecycleApplicableStages", "applicableLifecycleStages").map((value) => resolveLifecycleStageForProject(value, metadata)).filter((value): value is ProjectLifecycleStageId => Boolean(value));
  const skipped = new Set(metadataStrings(metadata, "lifecycleSkippedStages", "skippedLifecycleStages").map((value) => resolveLifecycleStageForProject(value, metadata)).filter(Boolean));
  const source = configured.length ? "configured" as const : "default_high_level" as const;
  const stages = (configured.length ? configured : [...projectLifecycleStageIds]).filter((id) => !skipped.has(id));
  return { source, stages: Object.freeze([...new Set(stages)]) };
}

export function resolveProjectLifecycleStartingPoint(input: Readonly<{ metadata?: Record<string, unknown>; status?: string; phase?: string; }>): ProjectLifecycleStartingPoint {
  const metadata = input.metadata;
  const projectType = metadataString(metadata, "projectTypeId", "projectType");
  const hasProjectDefinition = Boolean(projectType && !["not_decided", "project"].includes(normalizeToken(projectType)));
  const hasSitePropertyInformation = Boolean(metadataString(metadata, "landStatus", "siteAddress", "propertyReference", "landReference"));
  const hasDesignInformation = metadataString(metadata, "drawingsStatus") === "yes" || metadataAffirms(metadata, "designPackageRecorded", "designStudiesStarted");
  const knownFactKeys = [hasProjectDefinition && "projectLifecycle.startingPoint.fact.projectDefinition", hasSitePropertyInformation && "projectLifecycle.startingPoint.fact.sitePropertyInformation", hasDesignInformation && "projectLifecycle.startingPoint.fact.designInformation", hasExplicitTechnicalStudy(metadata) && "projectLifecycle.startingPoint.fact.technicalStudies", metadataAffirms(metadata, "authorizationPackagePrepared") && "projectLifecycle.startingPoint.fact.authorizationActivity", hasAuthorizationRecorded(metadata) && "projectLifecycle.startingPoint.fact.authorizationRecorded", hasExecutionPreparation(metadata) && "projectLifecycle.startingPoint.fact.executionPreparation", hasSiteOpening(metadata) && "projectLifecycle.startingPoint.fact.siteOpening", hasExcavationEvidence(metadata) && "projectLifecycle.startingPoint.fact.excavation", hasFoundationProgress(metadata) && "projectLifecycle.startingPoint.fact.foundations"].filter((value): value is string => Boolean(value));
  const missingFactKeys = [!hasProjectDefinition && "projectLifecycle.startingPoint.missing.projectDefinition", !hasSitePropertyInformation && "projectLifecycle.startingPoint.missing.sitePropertyInformation", !hasDesignInformation && "projectLifecycle.startingPoint.missing.designInformation"].filter((value): value is string => Boolean(value));
  const result = (stageId: ProjectLifecycleStageId | undefined, source: ProjectLifecycleStartingPoint["source"]) => Object.freeze({ ...(stageId ? { stageId } : {}), source, knownFactKeys: Object.freeze(knownFactKeys), missingFactKeys: Object.freeze(missingFactKeys) });
  const explicitValue = metadataString(metadata, "lifecycleStage", "currentLifecycleStage", "constructionStage");
  if (explicitValue) { const explicit = resolveLifecycleStageForProject(explicitValue, metadata); if (explicit) return result(explicit, "explicit_stage"); }
  if (normalizeToken(input.status) === "completed") return result("project_completed", "project_status");
  const ownerStage = metadataString(metadata, "ownerStage");
  if (ownerStage && normalizeToken(ownerStage) !== "not_decided") { const resolved = resolveLifecycleStageForProject(ownerStage, metadata); if (resolved) return result(resolved, "owner_stage"); }
  const phase = normalizeToken(input.phase);
  if (phase === "execution") { if (hasFoundationProgress(metadata)) return result("foundations", "project_phase"); if (hasExcavationEvidence(metadata)) return result("excavation_earthworks", "project_phase"); if (hasSiteOpening(metadata)) return result("site_opening", "project_phase"); return result("execution_preparation", "project_phase"); }
  if (["design", "procurement", "finishing", "handover"].includes(phase)) {
    const phaseStage = resolveLifecycleStageForProject(phase, metadata);
    if (phaseStage) return result(phaseStage, "project_phase");
  }
  if (hasFoundationProgress(metadata)) return result("foundations", "reported_project_information");
  if (hasExcavationEvidence(metadata)) return result("excavation_earthworks", "reported_project_information");
  if (hasSiteOpening(metadata)) return result("site_opening", "reported_project_information");
  if (hasExecutionPreparation(metadata)) return result("execution_preparation", "reported_project_information");
  if (hasAuthorizationRecorded(metadata)) return result("construction_authorization", "reported_project_information");
  if (metadataAffirms(metadata, "authorizationPackagePrepared")) return result("authorization_preparation", "reported_project_information");
  if (hasExplicitTechnicalStudy(metadata)) return result("technical_studies", "reported_project_information");
  if (hasDesignInformation) return result("design_studies", "reported_project_information");
  if (hasSitePropertyInformation) return result("site_property_preparation", "reported_project_information");
  if (hasProjectDefinition) return result("project_preparation", "reported_project_information");
  return result(undefined, "insufficient_data");
}
function explicitValidationStatus(metadata?: Record<string, unknown>) {
  return normalizeWorkflowValidationStatus(metadataString(metadata, "validationStatus", "approvalStatus", "reviewStatus"));
}

function requiresValidation(metadata?: Record<string, unknown>) {
  return metadataBoolean(metadata, "requiresValidation", "validationRequired") === true || Boolean(metadataString(metadata, "validationStatus", "approvalStatus", "reviewStatus"));
}

function isWaitingValidation(metadata?: Record<string, unknown>) {
  return ["under_review", "submitted"].includes(explicitValidationStatus(metadata));
}

function isRejectedValidation(metadata?: Record<string, unknown>) {
  return ["rejected", "correction_required"].includes(explicitValidationStatus(metadata));
}

function completedStages(input: ProjectLifecycleInput) {
  if (normalizeToken(input.project.status) === "completed") return Object.freeze([...projectLifecycleStageIds]);
  const explicit = metadataStrings(input.project.metadata, "lifecycleCompletedStages", "completedLifecycleStages").map((value) => resolveLifecycleStageForProject(value, input.project.metadata)).filter((value): value is ProjectLifecycleStageId => Boolean(value));
  const milestones = (input.milestones || []).flatMap((milestone) => milestone.status === "Completed" ? [resolveLifecycleStageForProject(metadataString(milestone.metadata, "lifecycleStage"), input.project.metadata)] : []).filter((value): value is ProjectLifecycleStageId => Boolean(value));
  return Object.freeze([...new Set([...explicit, ...milestones])]);
}

export function resolveProjectLifecycleState(input: ProjectLifecycleInput): ProjectLifecycleState {
  const applicability = configuredStages(input.project.metadata);
  const startingPoint = resolveProjectLifecycleStartingPoint(input.project);
  const currentStageId = startingPoint.stageId;
  const completedStageIds = completedStages(input);
  const blockerIds = [
    ...(input.tasks || []).filter((task) => task.status === "Blocked" || isRejectedValidation(task.metadata)).map((task) => task.id),
    ...(input.documents || []).filter((document) => isRejectedValidation(document.metadata)).map((document) => document.id)
  ];
  const waitingValidation = [
    ...(input.tasks || []).filter((task) => isWaitingValidation(task.metadata) || (task.status === "Review" && requiresValidation(task.metadata))),
    ...(input.documents || []).filter((document) => isWaitingValidation(document.metadata))
  ].length > 0;
  const currentIndex = currentStageId ? applicability.stages.indexOf(currentStageId) : -1;
  const nextStageId = currentIndex >= 0 ? applicability.stages[currentIndex + 1] : undefined;
  const currentPhaseId = currentStageId ? projectLifecycleStages.find((stage) => stage.id === currentStageId)?.phaseId : undefined;
  const nextPhaseId = nextStageId ? projectLifecycleStages.find((stage) => stage.id === nextStageId)?.phaseId : undefined;
  const resolution = currentStageId ? "resolved" as const : "insufficient_data" as const;
  const progression = resolution === "insufficient_data"
    ? "insufficient_data" as const
    : blockerIds.length
      ? "blocked" as const
      : waitingValidation
        ? "waiting_validation" as const
        : "ready" as const;
  return Object.freeze({
    resolution,
    ...(currentStageId ? { currentStageId } : {}),
    ...(currentPhaseId ? { currentPhaseId } : {}),
    currentStageKey: currentStageId ? `projectLifecycle.stage.${currentStageId}` : "projectLifecycle.stage.insufficient_data",
    ...(nextStageId ? { nextStageId } : {}),
    ...(nextPhaseId ? { nextPhaseId } : {}),
    applicableStageIds: applicability.stages,
    completedStageIds,
    applicabilitySource: applicability.source,
    progression,
    blockerIds: Object.freeze([...new Set(blockerIds)]),
    startingPoint
  });
}

export function getRoleStageResponsibilities(stageId: ProjectLifecycleStageId | undefined, role: ProjectLifecycleRole): readonly LifecycleResponsibility[] {
  if (!stageId) return Object.freeze([]);
  const responsibility = projectLifecycleStages.find((item) => item.id === stageId)?.responsibilities[role];
  return Object.freeze(responsibility ? [responsibility] : []);
}

function taskPriority(value: Task["priority"]): LifecyclePriority {
  return value.toLowerCase() as LifecyclePriority;
}

function taskStatus(task: Task): LifecycleActionStatus {
  const validationStatus = explicitValidationStatus(task.metadata);
  if (["rejected", "correction_required"].includes(validationStatus)) return "rejected";
  if (validationStatus === "under_review") return "waiting_validation";
  if (validationStatus === "submitted") return "submitted";
  if (validationStatus === "approved") return "completed";
  if (task.status === "Done") return "completed";
  if (task.status === "Blocked") return "blocked";
  if (task.status === "Review") return requiresValidation(task.metadata) ? "waiting_validation" : "submitted";
  if (task.status === "In Progress") return "in_progress";
  return task.status === "Todo" ? "ready" : "unavailable";
}

function evidenceState(task: Task, status: LifecycleActionStatus, requiredEvidence: readonly string[]): LifecycleEvidenceState {
  const explicit = normalizeWorkflowEvidenceStatus(metadataString(task.metadata, "evidenceStatus"));
  if (explicit) return explicit;
  if (status === "waiting_validation") return "waiting_validation";
  if (status === "rejected") return explicit === "correction_required" ? "correction_required" : "rejected";
  if (status === "completed" && explicitValidationStatus(task.metadata) === "approved") return "approved";
  if (requiredEvidence.length && metadataBoolean(task.metadata, "evidenceUploaded") === true) return "uploaded";
  return requiredEvidence.length ? "missing" : "unavailable";
}

function taskRole(task: Task, members: readonly ProjectMember[]) {
  const explicit = normalizeLifecycleRole(metadataString(task.metadata, "assignedRole", "role"));
  if (explicit) return explicit;
  const member = members.find((item) => item.employeeId === task.assigneeEmployeeId || item.employeeId === task.assigneeId || item.id === task.assigneeId);
  return normalizeLifecycleRole(member?.role);
}

export function createProjectLifecycleActions(input: ProjectLifecycleInput, lifecycle = resolveProjectLifecycleState(input)): readonly ProjectLifecycleAction[] {
  const members = input.members || [];
  return Object.freeze((input.tasks || []).map((task): ProjectLifecycleAction => {
    const stageId = normalizeLifecycleStage(metadataString(task.metadata, "lifecycleStage")) || lifecycle.currentStageId;
    const status = taskStatus(task);
    const validationRole = normalizeLifecycleRole(metadataString(task.metadata, "validationRole", "reviewerRole"));
    const requiredEvidence = Object.freeze(metadataStrings(task.metadata, "requiredEvidence", "evidenceRequirements"));
    const blockedRoles = Object.freeze(metadataStrings(task.metadata, "blockedRoles", "dependentRoles").map(normalizeLifecycleRole).filter((value): value is ProjectLifecycleRole => Boolean(value)));
    const validationFlag = metadataBoolean(task.metadata, "requiresValidation", "validationRequired");
    return Object.freeze({
      id: task.id,
      projectId: task.projectId,
      ...(stageId ? { stageId } : {}),
      title: task.title,
      assignedRole: taskRole(task, members),
      ...(task.assigneeEmployeeId || task.assigneeId ? { assignedMemberId: task.assigneeEmployeeId || task.assigneeId } : {}),
      ...(validationRole ? { validationRole } : {}),
      blockedRoles,
      status,
      priority: taskPriority(task.priority),
      ...(task.dueDate ? { dueDate: task.dueDate } : {}),
      requiredEvidence,
      evidenceState: evidenceState(task, status, requiredEvidence),
      validationRequirement: validationFlag === false ? "not_required" : validationFlag === true || Boolean(explicitValidationStatus(task.metadata)) ? "required" : "unavailable",
      ...(metadataString(task.metadata, "blocker") || (status === "blocked" ? task.description : undefined) ? { blocker: metadataString(task.metadata, "blocker") || task.description } : {}),
      destination: `/projects/${encodeURIComponent(task.projectId)}?tab=${status === "waiting_validation" ? "approvals" : "execution"}`,
      source: "task"
    });
  }));
}

function orderedActions(actions: readonly ProjectLifecycleAction[]) {
  return [...actions].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority] || statusWeight[b.status] - statusWeight[a.status] || a.id.localeCompare(b.id));
}

export function getRoleCurrentActions(actions: readonly ProjectLifecycleAction[], role: ProjectLifecycleRole, userId?: string): readonly ProjectLifecycleAction[] {
  return Object.freeze(orderedActions(actions.filter((action) => {
    if (action.status === "completed") return false;
    const assignedToViewer = Boolean(userId && action.assignedMemberId === userId);
    const assignedToRole = action.assignedRole === role;
    const validationAssignedToRole = action.validationRole === role && ["submitted", "waiting_validation"].includes(action.status);
    return assignedToViewer || assignedToRole || validationAssignedToRole;
  })));
}

export function getRolePendingDependencies(actions: readonly ProjectLifecycleAction[], role: ProjectLifecycleRole): readonly ProjectLifecycleAction[] {
  return Object.freeze(orderedActions(actions.filter((action) => {
    const waitingForAnotherValidator = action.assignedRole === role && action.validationRole && action.validationRole !== role && ["submitted", "waiting_validation"].includes(action.status);
    const explicitlyBlocksRole = action.blockedRoles.includes(role) && action.assignedRole !== role && action.status !== "completed";
    const ownerMonitoringValidation = role === "project_owner" && action.assignedRole !== role && Boolean(action.validationRole) && ["submitted", "waiting_validation"].includes(action.status);
    return Boolean(waitingForAnotherValidator || explicitlyBlocksRole || ownerMonitoringValidation);
  })));
}

function documentValidationState(document: Document): LifecycleEvidenceState {
  const explicit = normalizeWorkflowEvidenceStatus(metadataString(document.metadata, "validationStatus", "approvalStatus", "evidenceStatus"));
  if (explicit && ["approved", "rejected", "correction_required", "waiting_validation", "submitted"].includes(explicit)) return explicit;
  return document.storagePath || document.filename || document.status === "Saved" ? "uploaded" : "unavailable";
}

const documentCategoryRoles: Readonly<Record<string, readonly ProjectLifecycleRole[]>> = Object.freeze({
  architectural_drawings: ["project_owner", "architect", "engineer"],
  structural_drawings: ["project_owner", "engineer", "control_office", "contractor"],
  boq: ["project_owner", "engineer", "contractor"],
  specifications: ["project_owner", "architect", "engineer", "contractor", "control_office"],
  contracts: ["project_owner", "contractor"],
  permits: ["project_owner", "architect", "engineer", "control_office"],
  inspection_reports: ["project_owner", "contractor", "engineer", "control_office", "laboratory"],
  invoices: ["project_owner", "contractor"],
  safety_documents: ["project_owner", "contractor", "control_office"],
  qa_reports: ["project_owner", "contractor", "engineer", "control_office", "laboratory"]
});

function documentIsRelevant(document: Document, role: ProjectLifecycleRole) {
  if (role === "project_owner") return true;
  const explicitRoles = metadataStrings(document.metadata, "relevantRoles", "visibleRoles", "assignedRoles").map(normalizeLifecycleRole).filter(Boolean);
  if (explicitRoles.length) return explicitRoles.includes(role);
  const directRole = normalizeLifecycleRole(metadataString(document.metadata, "assignedRole", "validationRole"));
  if (directRole) return directRole === role;
  return (documentCategoryRoles[normalizeToken(document.category)] || []).includes(role);
}

export function getRoleRelevantEvidence(documents: readonly Document[], role: ProjectLifecycleRole): RoleRelevantEvidence {
  const states = documents.filter((document) => documentIsRelevant(document, role)).map(documentValidationState);
  return Object.freeze({
    total: states.length,
    uploaded: states.filter((state) => state === "uploaded" || state === "submitted").length,
    waitingValidation: states.filter((state) => state === "waiting_validation").length,
    approved: states.filter((state) => state === "approved").length,
    rejected: states.filter((state) => state === "rejected" || state === "correction_required").length,
    unavailable: states.filter((state) => state === "unavailable").length
  });
}

function roleDestination(projectId: string, role: ProjectLifecycleRole) {
  const tab = role === "project_owner" ? "overview" : role === "contractor" ? "execution" : role === "control_office" ? "approvals" : role === "other_project_member" ? "overview" : "documents";
  return `/projects/${encodeURIComponent(projectId)}?tab=${tab}`;
}

export function getRoleNextRecommendation(input: {
  projectId: string;
  role: ProjectLifecycleRole;
  lifecycle: ProjectLifecycleState;
  myActions: readonly ProjectLifecycleAction[];
  waitingOn: readonly ProjectLifecycleAction[];
  fallback: ProjectRoleRecommendation;
}): ProjectRoleRecommendation {
  const blocked = input.myActions.find((action) => action.status === "blocked" || action.status === "rejected");
  if (blocked) return Object.freeze({ id: "role_blocked_action", titleKey: "projectLifecycle.recommendation.blocked.title", descriptionKey: "projectLifecycle.recommendation.blocked.description", whyKey: "projectLifecycle.recommendation.blocked.why", actionKey: "projectLifecycle.recommendation.blocked.cta", destination: blocked.destination, evidence: "known" });
  const validation = input.myActions.find((action) => action.validationRole === input.role && ["submitted", "waiting_validation"].includes(action.status));
  if (validation) return Object.freeze({ id: "role_validation", titleKey: "projectLifecycle.recommendation.validation.title", descriptionKey: "projectLifecycle.recommendation.validation.description", whyKey: "projectLifecycle.recommendation.validation.why", actionKey: "projectLifecycle.recommendation.validation.cta", destination: `/projects/${encodeURIComponent(input.projectId)}?tab=approvals`, evidence: "known" });
  const active = input.myActions.find((action) => ["ready", "not_started", "in_progress"].includes(action.status));
  if (active) return Object.freeze({ id: "role_assigned_action", titleKey: "projectLifecycle.recommendation.assigned.title", descriptionKey: "projectLifecycle.recommendation.assigned.description", whyKey: "projectLifecycle.recommendation.assigned.why", actionKey: "projectLifecycle.recommendation.assigned.cta", destination: active.destination, evidence: "known" });
  if (input.waitingOn[0]) return Object.freeze({ id: "role_waiting", titleKey: "projectLifecycle.recommendation.waiting.title", descriptionKey: "projectLifecycle.recommendation.waiting.description", whyKey: "projectLifecycle.recommendation.waiting.why", actionKey: "projectLifecycle.recommendation.waiting.cta", destination: input.waitingOn[0].destination, evidence: "known" });
  if (input.role === "project_owner") return input.fallback;
  if (input.lifecycle.resolution === "insufficient_data") return Object.freeze({ id: "role_insufficient", titleKey: "projectLifecycle.recommendation.insufficient.title", descriptionKey: "projectLifecycle.recommendation.insufficient.description", whyKey: "projectLifecycle.recommendation.insufficient.why", actionKey: "projectLifecycle.recommendation.insufficient.cta", destination: `/projects/${encodeURIComponent(input.projectId)}?tab=overview`, evidence: "unavailable" });
  return Object.freeze({ id: `role_${input.role}`, titleKey: `projectLifecycle.recommendation.${input.role}.title`, descriptionKey: `projectLifecycle.recommendation.${input.role}.description`, whyKey: `projectLifecycle.recommendation.${input.role}.why`, actionKey: `projectLifecycle.recommendation.${input.role}.cta`, destination: roleDestination(input.projectId, input.role), evidence: "inferred" });
}

function roleQuestions(role: ProjectLifecycleRole) {
  const counts: Record<ProjectLifecycleRole, number> = { project_owner: 5, contractor: 4, architect: 3, engineer: 3, control_office: 3, laboratory: 2, surveyor: 2, other_project_member: 3 };
  return Object.freeze(Array.from({ length: counts[role] }, (_, index) => `projectLifecycle.question.${role}.${index + 1}`));
}

function roleHealthExplanation(role: ProjectLifecycleRole, sharedHealth: string, myActions: readonly ProjectLifecycleAction[], waitingOn: readonly ProjectLifecycleAction[]) {
  if (sharedHealth === "insufficient_data") return "projectLifecycle.health.insufficient";
  if (myActions.some((action) => action.status === "blocked" || action.status === "rejected")) return "projectLifecycle.health.roleBlocked";
  if (waitingOn.length) return "projectLifecycle.health.waiting";
  if (sharedHealth === "at_risk") return "projectLifecycle.health.sharedRisk";
  return `projectLifecycle.health.${role}`;
}

export function getRoleVisibleLifecycleContext(input: ProjectLifecycleInput & { sharedHealth: string; fallback: ProjectRoleRecommendation }): RoleAwareLifecycleContext {
  const roleResolution = resolveProjectParticipantRole(input);
  const lifecycle = resolveProjectLifecycleState(input);
  const projectActions = createProjectLifecycleActions(input, lifecycle);
  const myActions = getRoleCurrentActions(projectActions, roleResolution.role, input.viewer?.userId);
  const waitingOn = getRolePendingDependencies(projectActions, roleResolution.role);
  const recommendation = roleResolution.source === "unavailable"
    ? input.fallback
    : getRoleNextRecommendation({ projectId: input.project.id, role: roleResolution.role, lifecycle, myActions, waitingOn, fallback: input.fallback });
  return Object.freeze({
    viewerRole: roleResolution.role,
    roleSource: roleResolution.source,
    lifecycle,
    responsibilities: getRoleStageResponsibilities(lifecycle.currentStageId, roleResolution.role),
    projectActions,
    myActions,
    waitingOn,
    relevantEvidence: getRoleRelevantEvidence(input.documents || [], roleResolution.role),
    currentPriorityKey: recommendation.titleKey,
    healthExplanationKey: roleHealthExplanation(roleResolution.role, input.sharedHealth, myActions, waitingOn),
    recommendation,
    suggestedQuestionKeys: roleQuestions(roleResolution.role)
  });
}
