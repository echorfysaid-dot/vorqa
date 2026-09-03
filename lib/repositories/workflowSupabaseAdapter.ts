import { getDataSourceMode } from "@/lib/data-source";
import type { Project } from "@/lib/models";
import { organizationRest, isUuid } from "@/lib/repositories/organizationSupabaseRest";
import type { ProjectLifecycleRole } from "@/types/project-lifecycle";
import type { ProjectWorkflow, ProjectWorkflowEvent, ProjectWorkflowState, WorkflowAuthority, WorkflowParticipant } from "@/types/project-workflow";

type WorkflowRow = {
  id: string; project_id: string; workflow_group_id: string; revision: number; previous_revision_id: string | null;
  workflow_type: string; subject_kind: ProjectWorkflow["subjectKind"]; subject_key: string | null; subject_version: string | null;
  lifecycle_stage: ProjectWorkflow["lifecycleStage"]; status: ProjectWorkflow["status"]; is_current: boolean;
  assigned_role: ProjectLifecycleRole | null; assigned_user_id: string | null; reviewer_role: ProjectLifecycleRole | null;
  reviewer_user_id: string | null; created_by: string | null; created_at: string; updated_at: string; lock_version: number;
};
type EventRow = { id: string; workflow_id: string; actor_id: string | null; actor_role: ProjectLifecycleRole | null; event_type: string; from_status: ProjectWorkflow["status"] | null; to_status: ProjectWorkflow["status"] | null; from_role: ProjectLifecycleRole | null; to_role: ProjectLifecycleRole | null; reason: string | null; payload: Record<string, unknown>; created_at: string };
type ParticipantRow = { role: string | null; employees: { profile_id: string | null; first_name: string; last_name: string } | null };
type MembershipRow = { organization_roles: { permissions: Record<string, unknown> } | null };
type TransitionRow = { to_stage: ProjectLifecycleRole | ProjectWorkflow["lifecycleStage"] };

const emptyAuthority: WorkflowAuthority = { viewerRole: "other_project_member", isProjectOwner: false, canReview: false, canApprove: false, confirmed: false };

function workflow(row: WorkflowRow): ProjectWorkflow {
  return { id: row.id, projectId: row.project_id, workflowGroupId: row.workflow_group_id, revision: row.revision, ...(row.previous_revision_id ? { previousRevisionId: row.previous_revision_id } : {}), workflowType: row.workflow_type, subjectKind: row.subject_kind, ...(row.subject_key ? { subjectKey: row.subject_key } : {}), ...(row.subject_version ? { subjectVersion: row.subject_version } : {}), lifecycleStage: row.lifecycle_stage, status: row.status, isCurrent: row.is_current, ...(row.assigned_role ? { assignedRole: row.assigned_role } : {}), ...(row.assigned_user_id ? { assignedUserId: row.assigned_user_id } : {}), ...(row.reviewer_role ? { reviewerRole: row.reviewer_role } : {}), ...(row.reviewer_user_id ? { reviewerUserId: row.reviewer_user_id } : {}), ...(row.created_by ? { createdBy: row.created_by } : {}), createdAt: row.created_at, updatedAt: row.updated_at, lockVersion: row.lock_version };
}

function normalizeEventType(value: string) {
  return value.startsWith("workflow_") ? value.slice("workflow_".length) : value;
}

function event(row: EventRow): ProjectWorkflowEvent {
  const revision = typeof row.payload?.revision === "number" ? row.payload.revision : undefined;
  return { id: row.id, workflowId: row.workflow_id, ...(row.actor_id ? { actorId: row.actor_id } : {}), ...(row.actor_role ? { actorRole: row.actor_role } : {}), eventType: normalizeEventType(row.event_type), ...(row.from_status ? { fromStatus: row.from_status } : {}), ...(row.to_status ? { toStatus: row.to_status } : {}), ...(row.from_role ? { fromRole: row.from_role } : {}), ...(row.to_role ? { toRole: row.to_role } : {}), ...(row.reason ? { reason: row.reason } : {}), ...(revision ? { revision } : {}), createdAt: row.created_at };
}

function role(value?: string | null): ProjectLifecycleRole {
  const normalized = (value || "").toLowerCase();
  return (["project_owner", "contractor", "architect", "engineer", "control_office", "laboratory", "surveyor"] as const).find((item) => item === normalized) || "other_project_member";
}

function safeError(status?: number, message?: string) {
  if (/changed; refresh and retry/i.test(message || "")) return "workflow.error.stale";
  if (/stage gate is not ready|cannot advance|must advance exactly one/i.test(message || "")) return "workflow.error.stageGate";
  if (status === 401) return "workflow.error.authentication";
  if (status === 403) return "workflow.error.authorization";
  if (status === 409) return "workflow.error.stale";
  return "workflow.error.network";
}

export const workflowSupabaseAdapter = {
  async load(project: Project, userId?: string): Promise<{ data: ProjectWorkflowState; error?: string }> {
    if (getDataSourceMode() === "demo" || !isUuid(project.id) || !userId) return { data: { workflows: [], events: [], participants: [], authority: emptyAuthority, source: "legacy" } };
    const rows = await organizationRest<WorkflowRow[]>(`/project_workflows?project_id=eq.${encodeURIComponent(project.id)}&select=*&order=created_at.desc`);
    if (rows.error) return { data: { workflows: [], events: [], participants: [], authority: emptyAuthority, source: "supabase" }, error: safeError(rows.status, rows.error) };
    const transitions = await organizationRest<TransitionRow[]>(`/project_lifecycle_transitions?project_id=eq.${encodeURIComponent(project.id)}&select=to_stage&order=created_at.desc,id.desc&limit=1`);
    const events = await organizationRest<EventRow[]>(`/project_workflow_events?project_id=eq.${encodeURIComponent(project.id)}&select=id,workflow_id,actor_id,actor_role,event_type,from_status,to_status,from_role,to_role,reason,payload,created_at&order=created_at.desc`);
    const people = await organizationRest<ParticipantRow[]>(`/project_members?project_id=eq.${encodeURIComponent(project.id)}&status=eq.active&select=role,employees(profile_id,first_name,last_name)`);
    const membership = project.organizationId ? await organizationRest<MembershipRow[]>(`/organization_members?organization_id=eq.${encodeURIComponent(project.organizationId)}&user_id=eq.${encodeURIComponent(userId)}&status=eq.active&select=organization_roles(permissions)&limit=1`) : { data: [] as MembershipRow[] };
    const permissions = membership.data?.[0]?.organization_roles?.permissions || {};
    const projectRole = people.data?.find((item) => item.employees?.profile_id === userId)?.role;
    const isProjectOwner = project.ownerId === userId;
    const authority: WorkflowAuthority = { viewerRole: isProjectOwner ? "project_owner" : role(projectRole), isProjectOwner, canReview: permissions.review_project_workflows === true, canApprove: permissions.approve_project_workflows === true, confirmed: !membership.error && !people.error };
    const participants: WorkflowParticipant[] = (people.data || []).flatMap((item) => item.employees?.profile_id ? [{ userId: item.employees.profile_id, name: `${item.employees.first_name} ${item.employees.last_name}`.trim(), role: role(item.role) }] : []);
    if (project.ownerId && !participants.some((item) => item.userId === project.ownerId)) participants.unshift({ userId: project.ownerId, name: "workflow.participant.projectOwner", role: "project_owner" });
    return { data: { workflows: (rows.data || []).map(workflow), events: (events.data || []).map(event), participants, authority, ...(transitions.data?.[0]?.to_stage ? { currentLifecycleStage: transitions.data[0].to_stage as ProjectWorkflow["lifecycleStage"] } : {}), source: "supabase" }, ...((events.error || transitions.error) ? { error: safeError(events.status || transitions.status, events.error || transitions.error) } : {}) };
  },

  async command(name: string, payload: Record<string, unknown>) {
    const result = await organizationRest<Record<string, unknown>>(`/rpc/${name}`, { method: "POST", body: JSON.stringify(payload) });
    return result.error ? { error: safeError(result.status, result.error), stale: result.status === 409 } : { data: result.data };
  }
};
