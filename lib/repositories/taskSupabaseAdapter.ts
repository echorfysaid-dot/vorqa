import type { Task, TaskInput, TaskStatus } from "@/lib/models";
import { departmentSupabaseAdapter } from "./departmentSupabaseAdapter";
import { employeeSupabaseAdapter } from "./employeeSupabaseAdapter";
import { organizationSupabaseAdapter } from "./organizationSupabaseAdapter";
import { isUuid, organizationRest } from "./organizationSupabaseRest";
import { projectSupabaseAdapter } from "./projectSupabaseAdapter";
import { mapSupabaseTaskToDomain, mapTaskInputToSupabase, type SupabaseTaskRecord } from "./taskMapper";

async function resolveOrganizationId(organizationId?: string) {
  if (!organizationId) return undefined;
  if (isUuid(organizationId)) return organizationId;
  const organization = await organizationSupabaseAdapter.getOrganization(organizationId);
  return organization.data?.id;
}

async function validateTaskScope(input: Partial<TaskInput>) {
  const project = input.projectId ? await projectSupabaseAdapter.getProject(input.projectId) : undefined;
  if (input.projectId && !project?.data) return { error: "Project not found." };

  const projectOrganizationId = project?.data?.organizationId;
  const organizationId = await resolveOrganizationId(input.organizationId || projectOrganizationId);
  if (!organizationId) return { error: "Organization not found." };

  if (projectOrganizationId && organizationId !== projectOrganizationId && isUuid(projectOrganizationId)) {
    return { error: "Project does not belong to this organization." };
  }

  if (input.departmentId) {
    const department = await departmentSupabaseAdapter.getDepartmentById(organizationId, input.departmentId);
    if (!department.data) return { error: "Department does not belong to this organization." };
  }

  if (input.assigneeEmployeeId) {
    const assignee = await employeeSupabaseAdapter.getEmployee(organizationId, input.assigneeEmployeeId);
    if (!assignee.data) return { error: "Assignee does not belong to this organization." };
  }

  return { organizationId };
}

const taskSelect = "*,departments(id,name),employees(id,first_name,last_name,job_title)";

export const taskSupabaseAdapter = {
  async getTasks(projectId: string) {
    const result = await organizationRest<SupabaseTaskRecord[]>(
      `/tasks?project_id=eq.${encodeURIComponent(projectId)}&status=neq.archived&select=${encodeURIComponent(taskSelect)}&order=created_at.asc`
    );
    if (result.error) return { data: [] as Task[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseTaskToDomain), source: "supabase" as const, isFallback: false };
  },

  async getTask(taskId: string) {
    const result = await organizationRest<SupabaseTaskRecord[]>(
      `/tasks?id=eq.${encodeURIComponent(taskId)}&select=${encodeURIComponent(taskSelect)}&limit=1`
    );
    if (result.error) return { data: undefined as Task | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseTaskToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async createTask(input: TaskInput) {
    const scope = await validateTaskScope(input);
    if (scope.error) return { data: undefined as Task | undefined, source: "supabase" as const, isFallback: false, error: scope.error };
    const result = await organizationRest<SupabaseTaskRecord[]>("/tasks", {
      method: "POST",
      body: JSON.stringify(mapTaskInputToSupabase({ ...input, organizationId: scope.organizationId }))
    });
    if (result.error) return { data: undefined as Task | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseTaskToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateTask(taskId: string, input: Partial<TaskInput>) {
    const scope = input.projectId || input.organizationId || input.departmentId || input.assigneeEmployeeId
      ? await validateTaskScope(input)
      : {};
    if ("error" in scope && typeof scope.error === "string") return { data: undefined as Task | undefined, source: "supabase" as const, isFallback: false, error: scope.error };
    const organizationId = "organizationId" in scope && typeof scope.organizationId === "string" ? scope.organizationId : input.organizationId;

    const result = await organizationRest<SupabaseTaskRecord[]>(`/tasks?id=eq.${encodeURIComponent(taskId)}`, {
      method: "PATCH",
      body: JSON.stringify(mapTaskInputToSupabase({ ...input, organizationId }))
    });
    if (result.error) return { data: undefined as Task | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseTaskToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async archiveTask(taskId: string) {
    const result = await organizationRest<SupabaseTaskRecord[]>(`/tasks?id=eq.${encodeURIComponent(taskId)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "archived" })
    });
    if (result.error) return { data: false, source: "supabase" as const, isFallback: false, error: result.error };
    return { data: true, source: "supabase" as const, isFallback: false };
  },

  async moveTask(taskId: string, status: TaskStatus) {
    return this.updateTask(taskId, { status, progress: status === "Done" ? 100 : undefined });
  },

  async updateTaskProgress(taskId: string, progress: number) {
    return this.updateTask(taskId, { progress: Math.max(0, Math.min(100, progress)) });
  },

  async assignTask(taskId: string, assigneeEmployeeId?: string) {
    return this.updateTask(taskId, { assigneeEmployeeId });
  }
};
