"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, GitPullRequest, RefreshCw } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Badge, Button, GlassCard, Modal, StatusChip, Textarea } from "@/components/ui";
import { formatDate } from "@/lib/utils/format";
import { allowedWorkflowActions, isPersistedStageGateReady, workflowRequiredActionKey, workflowVoraGuidanceKey } from "@/lib/project-workflow-ui";
import { projectLifecycleStageIds } from "@/types/project-lifecycle";
import type { Project } from "@/lib/models";
import type { VoraProjectIntelligence } from "@/types/vora-project-intelligence";
import type { ProjectWorkflow, ProjectWorkflowState, WorkflowCommand } from "@/types/project-workflow";

type WorkflowController = {
  data: ProjectWorkflowState; loading: boolean; error?: string; commandPending: boolean; refresh: () => Promise<void>;
  command: (name: string, payload: Record<string, unknown>) => Promise<boolean>;
};

const rpc: Record<Exclude<WorkflowCommand, "create" | "advance">, string> = {
  submit: "submit_project_workflow", startReview: "start_project_workflow_review", requestCorrection: "request_project_workflow_correction",
  resubmit: "resubmit_project_workflow", approve: "approve_project_workflow", reject: "reject_project_workflow", handoff: "handoff_project_workflow"
};

export function ProjectWorkflowPanel({ project, userId, intelligence, controller }: { project: Project; userId?: string; intelligence: VoraProjectIntelligence; controller: WorkflowController }) {
  const { locale, translate } = useI18n();
  const { data, loading, error, commandPending } = controller;
  const [selectedId, setSelectedId] = useState<string>();
  const [pending, setPending] = useState<WorkflowCommand>();
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState("");
  const [targetKind, setTargetKind] = useState<"assignee" | "reviewer">("assignee");
  const current = useMemo(() => data.workflows.filter((item) => item.isCurrent), [data.workflows]);
  const selected = data.workflows.find((item) => item.id === selectedId) || current[0];
  const actions = selected ? allowedWorkflowActions(selected, data, userId) : [];
  const myActions = current.filter((item) => allowedWorkflowActions(item, data, userId).some((action) => action !== "handoff"));
  const waitingOn = current.filter((item) => !myActions.includes(item) && !["approved", "rejected"].includes(item.status));
  const persistedStage = data.currentLifecycleStage || intelligence.lifecycle.currentStageId;
  const persistedStageIndex = persistedStage ? projectLifecycleStageIds.indexOf(persistedStage) : -1;
  const persistedNextStage = persistedStageIndex >= 0 ? projectLifecycleStageIds[persistedStageIndex + 1] : undefined;
  const persistedGateReady = isPersistedStageGateReady(data, persistedStage);
  const guidanceKey = workflowVoraGuidanceKey(data, { ...intelligence.stageGate, transitionReadiness: persistedGateReady ? "yes" : "no" });
  const people = (workflow?: ProjectWorkflow) => ({
    assigned: data.participants.find((item) => item.userId === workflow?.assignedUserId),
    reviewer: data.participants.find((item) => item.userId === workflow?.reviewerUserId)
  });

  async function execute() {
    if (!pending) return;
    if (["reject", "requestCorrection"].includes(pending) && !reason.trim()) return;
    if (pending === "handoff" && (!selected || !target)) return;
    const key = crypto.randomUUID();
    let ok = false;
    if (pending === "create") {
      const reviewer = target || data.participants.find((item) => item.role && item.role !== "project_owner")?.userId;
      if (!reviewer || !userId) return;
      ok = await controller.command("create_project_workflow", { p_project_id: project.id, p_workflow_type: "workspace_review", p_subject_kind: "technical_submission", p_document_id: null, p_task_id: null, p_subject_key: `workspace:${key}`, p_subject_version: "v1", p_subject_snapshot: { source: "project_workspace" }, p_assigned_user_id: userId, p_reviewer_user_id: reviewer, p_idempotency_key: key });
    } else if (pending === "advance") {
      if (!persistedStage || !persistedNextStage || !persistedGateReady) return;
      ok = await controller.command("advance_project_lifecycle_stage", { p_project_id: project.id, p_expected_from_stage: persistedStage, p_to_stage: persistedNextStage, p_reason: reason.trim() || null, p_idempotency_key: key });
    } else if (selected) {
      const payload: Record<string, unknown> = { p_workflow_id: selected.id, p_expected_lock_version: selected.lockVersion, p_idempotency_key: key };
      if (["approve", "reject", "requestCorrection"].includes(pending)) payload.p_reason = reason.trim() || null;
      if (pending === "resubmit") { payload.p_subject_version = `v${selected.revision + 1}`; payload.p_subject_snapshot = { source: "project_workspace", previousRevision: selected.revision }; }
      if (pending === "handoff") { payload.p_target_kind = targetKind; payload.p_target_user_id = target; payload.p_reason = reason.trim() || null; }
      ok = await controller.command(rpc[pending], payload);
    }
    if (ok) { setPending(undefined); setReason(""); setTarget(""); }
  }

  if (loading) return <GlassCard className="p-5"><p className="text-sm text-ds-token-muted">{translate("workflow.loading")}</p></GlassCard>;
  return <section aria-labelledby="workflow-title" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><Badge tone="blue">{translate("workflow.section.badge")}</Badge><h2 id="workflow-title" className="mt-2 text-xl font-semibold text-ds-token-text">{translate("workflow.section.title")}</h2></div><Button size="sm" variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void controller.refresh()}>{translate("workflow.retry")}</Button></div>
    {error && <p role="alert" className="rounded-ds-md border border-ds-token-danger/30 bg-ds-token-danger/10 p-3 text-sm text-[#FFB4B4]">{translate(error)}</p>}
    {data.source === "legacy" ? <GlassCard className="p-5"><p className="text-sm text-ds-token-muted">{translate("workflow.legacy")}</p></GlassCard> : <>
      {!current.length && <GlassCard className="p-5"><p className="text-sm text-ds-token-muted">{translate("workflow.empty")}</p>{data.authority.isProjectOwner && data.authority.confirmed && <Button className="mt-4" onClick={() => setPending("create")}>{translate("workflow.create")}</Button>}</GlassCard>}
<div className="grid gap-3 sm:grid-cols-2"><GlassCard className="p-4"><p className="text-xs text-ds-token-muted">{translate("workflow.myActions")}</p><p className="mt-2 text-2xl font-semibold text-ds-token-text">{myActions.length}</p></GlassCard><GlassCard className="p-4"><p className="text-xs text-ds-token-muted">{translate("workflow.waitingOn")}</p><p className="mt-2 text-2xl font-semibold text-ds-token-text">{waitingOn.length}</p></GlassCard></div>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
        <div className="space-y-3">{current.map((item) => { const names=people(item); const itemActions=allowedWorkflowActions(item,data,userId); return <GlassCard key={item.id} className={`p-5 ${selected?.id===item.id?"border-ds-token-gold/45":""}`}><button type="button" className="w-full text-start" onClick={() => setSelectedId(item.id)}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-ds-token-text">{translate(`workflow.type.`+item.workflowType)}</p><p className="mt-1 text-xs text-ds-token-muted">{translate("workflow.revision")} <bdi dir="ltr">{item.revision}</bdi>{item.previousRevisionId ? ` · ${translate("workflow.previousRevision")}` : ""}</p></div><StatusChip tone={item.status==="approved"?"success":item.status==="rejected"||item.status==="correction_required"?"danger":item.status==="under_review"||item.status==="submitted"?"warning":"neutral"}>{translate(`workflow.status.${item.status}`)}</StatusChip></div><div className="mt-3 grid gap-2 text-xs text-ds-token-muted sm:grid-cols-2"><span>{translate("workflow.assignee")}: {names.assigned ? translate(names.assigned.name) : translate(`projectLifecycle.role.${item.assignedRole || "other_project_member"}`)}</span><span>{translate("workflow.reviewer")}: {names.reviewer ? names.reviewer.name : translate(`projectLifecycle.role.${item.reviewerRole || "other_project_member"}`)}</span></div><p className="mt-3 text-sm text-ds-token-text">{translate(workflowRequiredActionKey(item))}</p></button><div className="mt-4 flex flex-wrap gap-2">{itemActions.map((action)=><Button key={action} size="sm" variant={action==="reject"?"danger":"secondary"} onClick={()=>{setSelectedId(item.id);setPending(action);}}>{translate(`workflow.${action}`)}</Button>)}</div></GlassCard>;})}</div>
        <GlassCard className="p-5"><div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-ds-token-gold"/><h3 className="font-semibold text-ds-token-text">{translate("workflow.timeline")}</h3></div><div className="mt-4 space-y-3">{data.events.slice(0,8).map((event)=><div key={event.id} className="border-s-2 border-ds-token-border ps-3"><p className="text-sm font-semibold text-ds-token-text">{translate(`workflow.event.${event.eventType}`)}</p><p className="mt-1 text-xs text-ds-token-muted">{event.actorRole?translate(`projectLifecycle.role.${event.actorRole}`):translate("projectLifecycle.notAvailable")} · {formatDate(event.createdAt,locale)}</p>{event.reason&&<p className="mt-1 text-xs leading-5 text-ds-token-muted">{event.reason}</p>}</div>)}</div></GlassCard>
      </div>
      {guidanceKey && <GlassCard className="flex items-start gap-3 p-4"><GitPullRequest className="mt-0.5 h-5 w-5 text-ds-token-blue"/><div><p className="text-xs font-semibold text-ds-token-blue">VORA</p><p className="mt-1 text-sm leading-6 text-ds-token-text">{translate(guidanceKey)}</p></div></GlassCard>}
      {data.authority.isProjectOwner && persistedGateReady && Boolean(persistedNextStage) && <Button icon={<CheckCircle2 className="h-4 w-4"/>} onClick={()=>setPending("advance")}>{translate("workflow.advance")}</Button>}
    </>}
    <Modal open={Boolean(pending)} title={translate(pending ? `workflow.${pending}` : "workflow.confirm")} onClose={()=>setPending(undefined)}><div className="space-y-4">{pending==="handoff"&&data.authority.isProjectOwner?<label className="grid gap-2 text-sm text-ds-token-muted"><span>{translate("workflow.targetKind")}</span><select value={targetKind} onChange={(e)=>setTargetKind(e.target.value as "assignee"|"reviewer")} className="h-11 rounded-ds-sm border border-ds-token-border bg-black/30 px-3 text-ds-token-text"><option value="assignee">{translate("workflow.target.assignee")}</option><option value="reviewer">{translate("workflow.target.reviewer")}</option></select></label>:null}{pending==="handoff"||pending==="create"?<label className="grid gap-2 text-sm text-ds-token-muted"><span>{translate("workflow.target")}</span><select value={target} onChange={(e)=>setTarget(e.target.value)} className="h-11 rounded-ds-sm border border-ds-token-border bg-black/30 px-3 text-ds-token-text"><option value="">{translate("workflow.target")}</option>{data.participants.filter((p)=>p.userId!==userId&&p.role!=="project_owner").map((p)=><option key={p.userId} value={p.userId}>{p.name}</option>)}</select></label>:null}{pending&&["reject","requestCorrection","handoff","advance"].includes(pending)&&<Textarea label={translate("workflow.reason")} value={reason} onChange={(e)=>setReason(e.target.value)}/>}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={()=>setPending(undefined)}>{translate("workflow.cancel")}</Button><Button loading={commandPending} disabled={(["reject","requestCorrection"].includes(pending||"")&&!reason.trim())||(["handoff","create"].includes(pending||"")&&!target)} onClick={()=>void execute()}>{translate("workflow.confirm")}</Button></div></div></Modal>
  </section>;
}
