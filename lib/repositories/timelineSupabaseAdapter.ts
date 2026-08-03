import type { ProjectTimeline, TaskDependency, TaskDependencyInput, TimelineMilestone, TimelineMilestoneInput } from "@/lib/models";
import { isUuid, organizationRest } from "./organizationSupabaseRest";
import { organizationSupabaseAdapter } from "./organizationSupabaseAdapter";
import { projectSupabaseAdapter } from "./projectSupabaseAdapter";
import { taskSupabaseAdapter } from "./taskSupabaseAdapter";
import {
  mapDependencyInputToSupabase,
  mapMilestoneInputToSupabase,
  mapSupabaseDependencyToDomain,
  mapSupabaseMilestoneToDomain,
  type SupabaseMilestoneRecord,
  type SupabaseTaskDependencyRecord
} from "./timelineMapper";

async function resolveOrganizationId(organizationId?: string) {
  if (!organizationId) return undefined;
  if (isUuid(organizationId)) return organizationId;
  const organization = await organizationSupabaseAdapter.getOrganization(organizationId);
  return organization.data?.id;
}

async function validateMilestoneScope(input: Partial<TimelineMilestoneInput>) {
  const project = input.projectId ? await projectSupabaseAdapter.getProject(input.projectId) : undefined;
  if (input.projectId && !project?.data) return { error: "Project not found." };
  const organizationId = await resolveOrganizationId(input.organizationId || project?.data?.organizationId);
  if (!organizationId) return { error: "Organization not found." };
  if (project?.data?.organizationId && isUuid(project.data.organizationId) && project.data.organizationId !== organizationId) {
    return { error: "Project does not belong to this organization." };
  }
  return { organizationId };
}

async function dependencyWouldCycle(predecessorTaskId: string, successorTaskId: string) {
  if (predecessorTaskId === successorTaskId) return true;
  const result = await organizationRest<Array<{ predecessor_task_id: string; successor_task_id: string }>>(
    `/task_dependencies?select=predecessor_task_id,successor_task_id`
  );
  if (result.error) return false;
  const edges = [...(result.data || []), { predecessor_task_id: predecessorTaskId, successor_task_id: successorTaskId }];
  const visit = (taskId: string, seen = new Set<string>()): boolean => {
    if (taskId === predecessorTaskId) return true;
    if (seen.has(taskId)) return false;
    seen.add(taskId);
    return edges.filter((edge) => edge.predecessor_task_id === taskId).some((edge) => visit(edge.successor_task_id, seen));
  };
  return visit(successorTaskId);
}

const dependencySelect = "*,predecessor:tasks!task_dependencies_predecessor_task_id_fkey(id,title),successor:tasks!task_dependencies_successor_task_id_fkey(id,title)";

export const timelineSupabaseAdapter = {
  async getTimeline(projectId: string) {
    const milestones = await this.getMilestones(projectId);
    const dependencies = await this.getDependencies(projectId);
    const data: ProjectTimeline = {
      projectId,
      milestones: milestones.data,
      dependencies: dependencies.data
    };
    return {
      data,
      source: "supabase" as const,
      isFallback: false,
      error: milestones.error || dependencies.error
    };
  },

  async getMilestones(projectId: string) {
    const result = await organizationRest<SupabaseMilestoneRecord[]>(
      `/milestones?project_id=eq.${encodeURIComponent(projectId)}&status=neq.archived&select=*&order=due_date.asc`
    );
    if (result.error) return { data: [] as TimelineMilestone[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseMilestoneToDomain), source: "supabase" as const, isFallback: false };
  },

  async createMilestone(input: TimelineMilestoneInput) {
    const scope = await validateMilestoneScope(input);
    if (scope.error) return { data: undefined as TimelineMilestone | undefined, source: "supabase" as const, isFallback: false, error: scope.error };
    const result = await organizationRest<SupabaseMilestoneRecord[]>("/milestones", {
      method: "POST",
      body: JSON.stringify(mapMilestoneInputToSupabase({ ...input, organizationId: scope.organizationId }))
    });
    if (result.error) return { data: undefined as TimelineMilestone | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseMilestoneToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateMilestone(milestoneId: string, input: Partial<TimelineMilestoneInput>) {
    const scope = input.projectId || input.organizationId ? await validateMilestoneScope(input) : {};
    if ("error" in scope && typeof scope.error === "string") return { data: undefined as TimelineMilestone | undefined, source: "supabase" as const, isFallback: false, error: scope.error };
    const organizationId = "organizationId" in scope && typeof scope.organizationId === "string" ? scope.organizationId : input.organizationId;
    const result = await organizationRest<SupabaseMilestoneRecord[]>(`/milestones?id=eq.${encodeURIComponent(milestoneId)}`, {
      method: "PATCH",
      body: JSON.stringify(mapMilestoneInputToSupabase({ ...input, organizationId }))
    });
    if (result.error) return { data: undefined as TimelineMilestone | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseMilestoneToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async archiveMilestone(milestoneId: string) {
    const result = await organizationRest<SupabaseMilestoneRecord[]>(`/milestones?id=eq.${encodeURIComponent(milestoneId)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "archived" })
    });
    if (result.error) return { data: false, source: "supabase" as const, isFallback: false, error: result.error };
    return { data: true, source: "supabase" as const, isFallback: false };
  },

  async getDependencies(projectId: string) {
    const tasks = await taskSupabaseAdapter.getTasks(projectId);
    const taskIds = tasks.data.map((task) => task.id);
    if (tasks.error) return { data: [] as TaskDependency[], source: "supabase" as const, isFallback: false, error: tasks.error };
    if (taskIds.length === 0) return { data: [] as TaskDependency[], source: "supabase" as const, isFallback: false };
    const result = await organizationRest<SupabaseTaskDependencyRecord[]>(
      `/task_dependencies?predecessor_task_id=in.(${taskIds.map(encodeURIComponent).join(",")})&select=${encodeURIComponent(dependencySelect)}&order=created_at.asc`
    );
    if (result.error) return { data: [] as TaskDependency[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseDependencyToDomain), source: "supabase" as const, isFallback: false };
  },

  async createDependency(input: TaskDependencyInput) {
    if (await dependencyWouldCycle(input.predecessorTaskId, input.successorTaskId)) {
      return { data: undefined as TaskDependency | undefined, source: "supabase" as const, isFallback: false, error: "Dependency would create a circular chain." };
    }
    const result = await organizationRest<SupabaseTaskDependencyRecord[]>("/task_dependencies", {
      method: "POST",
      body: JSON.stringify(mapDependencyInputToSupabase(input))
    });
    if (result.error) return { data: undefined as TaskDependency | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseDependencyToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async removeDependency(dependencyId: string) {
    const result = await organizationRest<SupabaseTaskDependencyRecord[]>(`/task_dependencies?id=eq.${encodeURIComponent(dependencyId)}`, {
      method: "DELETE"
    });
    if (result.error) return { data: false, source: "supabase" as const, isFallback: false, error: result.error };
    return { data: true, source: "supabase" as const, isFallback: false };
  }
};
