import { allowedWorkflowActions, workflowRequiredActionKey } from "@/lib/project-workflow-ui";
import type { ProjectBudget, Task, TimelineMilestone } from "@/lib/models";
import { createProjectOwnerContext, resolveProjectOwnerNextStep } from "@/lib/project-owner-journey";
import { getRoleVisibleLifecycleContext } from "@/lib/project-lifecycle";
import { createProjectStageGate, getRoleStageGateContext } from "@/lib/project-stage-gate";
import type {
  VoraProjectAction,
  VoraProjectAttention,
  VoraProjectContext,
  VoraProjectContextInput,
  VoraProjectDataAvailability,
  VoraProjectHealth,
  VoraProjectIntelligence
} from "@/types/vora-project-intelligence";

const defaultAvailability: VoraProjectDataAvailability = Object.freeze({
  tasks: false,
  timeline: false,
  documents: false,
  team: false,
  budget: false
});

function finitePercentage(value: unknown) {
  const numeric = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(numeric) && numeric >= 0 ? Math.min(100, numeric) : undefined;
}

function selectedServices(value: unknown): readonly string[] {
  return Object.freeze(Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : []);
}

function isOpenTask(task: Task) {
  return task.status !== "Done";
}

function isBlockedTask(task: Task) {
  return task.status === "Blocked";
}

function isCriticalTask(task: Task) {
  return isOpenTask(task) && task.priority === "Critical";
}

function isDelayedMilestone(milestone: TimelineMilestone) {
  return milestone.status === "Delayed";
}

function countOverBudgetItems(budget?: ProjectBudget | null) {
  return budget?.items.filter((item) => item.status === "Over Budget" || item.actualCost > item.plannedCost).length || 0;
}

export function createVoraProjectContext(input: VoraProjectContextInput): VoraProjectContext {
  const { project } = input;
  const ownerContext = input.ownerContext || createProjectOwnerContext(project);
  const tasks = input.tasks || [];
  const milestones = input.milestones || [];
  const documents = input.documents || [];
  const members = input.members || [];
  const availability = Object.freeze({ ...defaultAvailability, ...input.availability });
  const metadata = project.metadata || {};
  const progress = finitePercentage(metadata.progress ?? metadata.completion);

  return Object.freeze({
    project: Object.freeze({
      id: project.id,
      name: project.title,
      ...(ownerContext.projectType ? { type: ownerContext.projectType } : {}),
      ...(ownerContext.description ? { description: ownerContext.description } : {}),
      ...(ownerContext.location ? { location: ownerContext.location } : {}),
      ...(project.status ? { status: project.status } : {}),
      ...(ownerContext.stage ? { stage: ownerContext.stage } : {}),
      ...(progress !== undefined ? { progress } : {}),
      ...(ownerContext.desiredStartDate ? { desiredStartDate: ownerContext.desiredStartDate } : {}),
      selectedServices: selectedServices(metadata.selectedServices)
    }),
    ownerContext,
    tasks: Object.freeze({
      total: tasks.length,
      open: tasks.filter(isOpenTask).length,
      blocked: tasks.filter(isBlockedTask).length,
      critical: tasks.filter(isCriticalTask).length
    }),
    timeline: Object.freeze({ total: milestones.length, delayed: milestones.filter(isDelayedMilestone).length }),
    documents: Object.freeze({ total: documents.length }),
    team: Object.freeze({ total: members.length }),
    budget: Object.freeze({
      items: input.budget?.items.length || 0,
      overBudgetItems: countOverBudgetItems(input.budget),
      hasOwnerEstimate: ownerContext.budgetAmount !== undefined
    }),
    availability,
    missingFields: Object.freeze([...ownerContext.missingFields])
  });
}

function workspaceDestination(projectId: string, tab: string) {
  return `/projects/${encodeURIComponent(projectId)}?tab=${encodeURIComponent(tab)}`;
}

function action(
  id: string,
  projectId: string,
  destination: string,
  evidence: VoraProjectAction["evidence"] = "inferred"
): VoraProjectAction {
  return Object.freeze({
    id,
    titleKey: `projectIntelligence.action.${id}.title`,
    descriptionKey: `projectIntelligence.action.${id}.description`,
    whyKey: `projectIntelligence.action.${id}.why`,
    actionKey: `projectIntelligence.action.${id}.cta`,
    destination: destination.startsWith("/") ? destination : workspaceDestination(projectId, destination),
    evidence
  });
}

export function resolveVoraProjectAction(context: VoraProjectContext): VoraProjectAction {
  const projectId = context.project.id;
  if (context.tasks.blocked > 0) return action("review_blocked_tasks", projectId, "execution", "known");
  if (context.timeline.delayed > 0) return action("review_delayed_milestones", projectId, "timeline", "known");
  if (context.budget.overBudgetItems > 0) return action("review_budget", projectId, "budget", "known");
  if (!context.project.stage || context.project.stage === "not_decided") return action("complete_project_information", projectId, "settings", "unavailable");
  if (context.project.stage !== "land_only" && context.project.stage !== "idea" && context.availability.documents && context.documents.total === 0) {
    return action("add_documents", projectId, "documents", "known");
  }
  if (!context.budget.hasOwnerEstimate && context.availability.budget && context.budget.items === 0) return action("add_budget", projectId, "budget", "unavailable");
  if ((context.project.stage === "construction_started" || context.project.stage === "under_execution") && context.availability.timeline && context.timeline.total === 0) {
    return action("prepare_planning", projectId, "timeline", "known");
  }
  if ((context.project.stage === "looking_professionals" || context.project.stage === "construction_started" || context.project.stage === "under_execution") && context.availability.team && context.team.total === 0) {
    return action("review_team", projectId, "team", "known");
  }

  const fallback = resolveProjectOwnerNextStep(context.ownerContext);
  return Object.freeze({
    id: fallback.id,
    titleKey: fallback.titleKey,
    descriptionKey: fallback.descriptionKey,
    whyKey: "projectIntelligence.action.stage_based.why",
    actionKey: fallback.actionKey,
    destination: fallback.route,
    evidence: "inferred"
  });
}

function attention(
  id: string,
  severity: VoraProjectAttention["severity"],
  evidence: VoraProjectAttention["evidence"],
  destination?: string,
  projectId?: string
): VoraProjectAttention {
  return Object.freeze({
    id,
    severity,
    evidence,
    titleKey: `projectIntelligence.attention.${id}.title`,
    descriptionKey: `projectIntelligence.attention.${id}.description`,
    ...(destination && projectId ? { destination: workspaceDestination(projectId, destination), actionKey: `projectIntelligence.attention.${id}.cta` } : {})
  });
}

export function collectVoraProjectAttention(context: VoraProjectContext): readonly VoraProjectAttention[] {
  const projectId = context.project.id;
  const items: VoraProjectAttention[] = [];
  if (context.tasks.blocked > 0) items.push(attention("blocked_tasks", "critical", "known", "execution", projectId));
  if (context.timeline.delayed > 0) items.push(attention("delayed_milestones", "critical", "known", "timeline", projectId));
  if (context.budget.overBudgetItems > 0) items.push(attention("over_budget", "critical", "known", "budget", projectId));
  if (!context.project.stage || context.project.stage === "not_decided") items.push(attention("missing_stage", "warning", "unavailable", "settings", projectId));
  if (context.missingFields.includes("projectType")) items.push(attention("missing_type", "warning", "unavailable", "settings", projectId));
  if (!context.budget.hasOwnerEstimate && context.availability.budget && context.budget.items === 0) items.push(attention("missing_budget", "warning", "unavailable", "budget", projectId));
  if ((context.project.stage === "construction_started" || context.project.stage === "under_execution") && context.availability.timeline && context.timeline.total === 0) {
    items.push(attention("missing_schedule", "warning", "known", "timeline", projectId));
  }
  if ((context.project.stage === "looking_professionals" || context.project.stage === "construction_started" || context.project.stage === "under_execution") && context.availability.team && context.team.total === 0) {
    items.push(attention("missing_team", "warning", "known", "team", projectId));
  }
  if (!context.availability.tasks || !context.availability.timeline || !context.availability.documents) {
    items.push(attention("repository_unavailable", "info", "unavailable"));
  }
  return Object.freeze(items);
}

export function evaluateVoraProjectHealth(context: VoraProjectContext, attentionItems = collectVoraProjectAttention(context), stageGate?: ReturnType<typeof createProjectStageGate>): VoraProjectHealth {
  const gateAtRisk = stageGate?.status === "blocked" || stageGate?.status === "correction_required";
  const gateNeedsAttention = stageGate?.status === "requirements_missing" || stageGate?.status === "waiting_validation" || stageGate?.status === "waiting_submission" || stageGate?.status === "work_in_progress";
  const atRisk = context.project.status?.toLowerCase() === "at risk" || context.tasks.blocked > 0 || context.timeline.delayed > 0 || context.budget.overBudgetItems > 0 || gateAtRisk;
  const coreRepositoriesUnavailable = !context.availability.tasks || !context.availability.timeline || !context.availability.documents;
  const essentialProjectContextMissing = (!context.project.stage || context.project.stage === "not_decided")
    && context.missingFields.includes("projectType")
    && context.tasks.total === 0
    && context.timeline.total === 0
    && context.documents.total === 0
    && context.team.total === 0
    && !context.budget.hasOwnerEstimate;
  const stageGateAttention = Boolean(gateNeedsAttention);
  const insufficient = coreRepositoriesUnavailable || essentialProjectContextMissing;
  const state = atRisk ? "at_risk" : insufficient ? "insufficient_data" : stageGateAttention || attentionItems.some((item) => item.severity === "warning") ? "attention_needed" : "on_track";
  const reasonKeys = state === "at_risk"
    ? ["projectIntelligence.health.reason.knownRisk"]
    : state === "insufficient_data"
      ? ["projectIntelligence.health.reason.insufficient"]
      : state === "attention_needed"
        ? ["projectIntelligence.health.reason.missingInformation"]
        : ["projectIntelligence.health.reason.noKnownBlocker"];
  return Object.freeze({ state, reasonKeys: Object.freeze(reasonKeys) });
}

export function createVoraSuggestedQuestions(context: VoraProjectContext, health: VoraProjectHealth): readonly string[] {
  const keys = ["projectIntelligence.question.next", "projectIntelligence.question.onTrack"];
  if (health.state === "at_risk") keys.push("projectIntelligence.question.risks");
  if (context.missingFields.length) keys.push("projectIntelligence.question.missing");
  if (!context.budget.hasOwnerEstimate) keys.push("projectIntelligence.question.budget");
  if (!context.timeline.total) keys.push("projectIntelligence.question.nextStage");
  if (!context.team.total) keys.push("projectIntelligence.question.team");
  return Object.freeze([...new Set(keys)].slice(0, 5));
}

export function createVoraProjectIntelligence(input: VoraProjectContextInput): VoraProjectIntelligence {
  const effectiveInput: VoraProjectContextInput = input.workflowState?.currentLifecycleStage
    ? { ...input, project: { ...input.project, metadata: { ...(input.project.metadata || {}), lifecycleStage: input.workflowState.currentLifecycleStage } } }
    : input;
  const context = createVoraProjectContext(effectiveInput);
  const stageGate = createProjectStageGate(effectiveInput);
  const attentionItems = collectVoraProjectAttention(context);
  const health = evaluateVoraProjectHealth(context, attentionItems, stageGate);
  const baseNextAction = resolveVoraProjectAction(context);
  const roleContext = getRoleVisibleLifecycleContext({
    project: effectiveInput.project,
    tasks: effectiveInput.tasks,
    milestones: effectiveInput.milestones,
    documents: effectiveInput.documents,
    members: effectiveInput.members,
    viewer: effectiveInput.viewer,
    sharedHealth: health.state,
    fallback: baseNextAction
  });
  const roleStageGate = getRoleStageGateContext(stageGate, roleContext.viewerRole);
  const persistedWorkflow = effectiveInput.workflowState?.source === "supabase" ? effectiveInput.workflowState.workflows.find((item) => item.isCurrent && allowedWorkflowActions(item, effectiveInput.workflowState!, effectiveInput.viewer?.userId).length) : undefined;
  const persistedAction = persistedWorkflow ? Object.freeze({ id: `workflow_${persistedWorkflow.id}`, titleKey: workflowRequiredActionKey(persistedWorkflow), descriptionKey: workflowRequiredActionKey(persistedWorkflow), whyKey: workflowRequiredActionKey(persistedWorkflow), actionKey: workflowRequiredActionKey(persistedWorkflow), destination: workspaceDestination(effectiveInput.project.id, "overview"), evidence: "known" as const }) : undefined;
  const nextAction = persistedAction || (stageGate.status === "ready_to_advance" && roleContext.roleSource !== "unavailable" && !roleContext.myActions.length && !roleContext.waitingOn.length
    ? Object.freeze({
      id: "stage_gate_ready",
      titleKey: "projectStageGate.role.ready",
      descriptionKey: "projectStageGate.explanation.ready_to_advance",
      whyKey: "projectStageGate.role.readyWhy",
      actionKey: "projectStageGate.role.ready",
      destination: workspaceDestination(effectiveInput.project.id, "overview"),
      evidence: "known" as const
    })
    : roleContext.recommendation);
  const suggestedQuestionKeys = roleContext.roleSource === "unavailable"
    ? createVoraSuggestedQuestions(context, health)
    : roleContext.suggestedQuestionKeys;
  return Object.freeze({
    context,
    lifecycle: roleContext.lifecycle,
    roleContext,
    stageGate,
    roleStageGate,
    ...(effectiveInput.workflowState ? { workflowState: effectiveInput.workflowState } : {}),
    health,
    statusKey: `projectIntelligence.status.${health.state}`,
    priorityKey: nextAction.titleKey,
    nextAction,
    attention: attentionItems,
    suggestedQuestionKeys
  });
}
