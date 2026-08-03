import type { Project, ProjectInput, ProjectMember, ProjectMemberInput } from "@/lib/models";
import { getValidSession } from "@/lib/auth-client";
import { isUuid, organizationRest } from "./organizationSupabaseRest";
import { departmentSupabaseAdapter } from "./departmentSupabaseAdapter";
import { employeeSupabaseAdapter } from "./employeeSupabaseAdapter";
import { organizationSupabaseAdapter } from "./organizationSupabaseAdapter";
import { mapProjectInputToSupabase, mapProjectMemberInputToSupabase, mapSupabaseProject, mapSupabaseProjectMemberToDomain, type SupabaseProjectMemberRecord, type SupabaseProjectRecord } from "./projectMapper";

async function resolveOrganizationId(organizationId?: string) {
  if (!organizationId) return undefined;
  if (isUuid(organizationId)) return organizationId;
  const organization = await organizationSupabaseAdapter.getOrganization(organizationId);
  return organization.data?.id;
}

async function validateScope(input: Partial<ProjectInput>) {
  const organizationId = await resolveOrganizationId(input.organizationId);
  if (input.organizationId && !organizationId) return { error: "Organization not found." };
  if (organizationId && input.departmentId) {
    const department = await departmentSupabaseAdapter.getDepartmentById(organizationId, input.departmentId);
    if (!department.data) return { error: "Department does not belong to this organization." };
  }
  if (organizationId && input.projectManagerId) {
    const manager = await employeeSupabaseAdapter.getEmployee(organizationId, input.projectManagerId);
    if (!manager.data) return { error: "Manager does not belong to this organization." };
  }
  return { organizationId };
}

const projectSelect = "*,organizations(id,name,slug),departments(id,name,slug),project_manager:employees!projects_project_manager_id_fkey(id,first_name,last_name),project_members(id)";
const memberSelect = "*,employees(id,first_name,last_name,job_title)";

export const projectSupabaseAdapter = {
  async getProjects() {
    const result = await organizationRest<SupabaseProjectRecord[]>(`/projects?select=${encodeURIComponent(projectSelect)}&order=updated_at.desc`);
    if (result.error) return { data: [] as Project[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseProject), source: "supabase" as const, isFallback: false };
  },

  async getProject(id: string) {
    const encoded = encodeURIComponent(id);
    const filter = isUuid(id) ? `id=eq.${encoded}` : `slug=eq.${encoded}`;
    const result = await organizationRest<SupabaseProjectRecord[]>(`/projects?${filter}&select=${encodeURIComponent(projectSelect)}&limit=1`);
    if (result.error) return { data: undefined as Project | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseProject(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async slugExists(organizationId: string, slug: string, excludeId?: string) {
    const resolvedId = await resolveOrganizationId(organizationId);
    if (!resolvedId) return { data: false, source: "supabase" as const, isFallback: false, error: "Organization not found." };
    const result = await organizationRest<Array<{ id: string }>>(`/projects?organization_id=eq.${encodeURIComponent(resolvedId)}&slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`);
    if (result.error) return { data: false, source: "supabase" as const, isFallback: false, error: result.error };
    const match = result.data?.[0];
    return { data: Boolean(match && match.id !== excludeId), source: "supabase" as const, isFallback: false };
  },

  async createProject(input: ProjectInput) {
    const session = await getValidSession();
    if (!session?.user?.id) return { data: undefined as Project | undefined, source: "supabase" as const, isFallback: false, error: "Authentication is required to create a project." };
    const scope = await validateScope(input);
    if (scope.error) return { data: undefined as Project | undefined, source: "supabase" as const, isFallback: false, error: scope.error };
    const result = await organizationRest<SupabaseProjectRecord[]>("/projects", {
      method: "POST",
      body: JSON.stringify(mapProjectInputToSupabase({ ...input, organizationId: scope.organizationId }, session.user.id))
    });
    if (result.error) return { data: undefined as Project | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseProject(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateProject(id: string, input: Partial<ProjectInput>) {
    const scope = await validateScope(input);
    if (scope.error) return { data: undefined as Project | undefined, source: "supabase" as const, isFallback: false, error: scope.error };
    const result = await organizationRest<SupabaseProjectRecord[]>(`/projects?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(mapProjectInputToSupabase({ ...input, organizationId: scope.organizationId ?? input.organizationId }))
    });
    if (result.error) return { data: undefined as Project | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseProject(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async archiveProject(id: string) {
    const result = await this.updateProject(id, { status: "archived", metadata: { statusLabel: "Archived" } });
    return { data: Boolean(result.data), source: "supabase" as const, isFallback: false, error: "error" in result ? result.error : undefined };
  },

  async getProjectMembers(projectId: string) {
    const result = await organizationRest<SupabaseProjectMemberRecord[]>(`/project_members?project_id=eq.${encodeURIComponent(projectId)}&select=${encodeURIComponent(memberSelect)}&order=joined_at.asc`);
    if (result.error) return { data: [] as ProjectMember[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseProjectMemberToDomain), source: "supabase" as const, isFallback: false };
  },

  async assignProjectMember(input: ProjectMemberInput) {
    const result = await organizationRest<SupabaseProjectMemberRecord[]>("/project_members", {
      method: "POST",
      body: JSON.stringify(mapProjectMemberInputToSupabase(input))
    });
    if (result.error) return { data: undefined as ProjectMember | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseProjectMemberToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async removeProjectMember(memberId: string) {
    const result = await organizationRest<SupabaseProjectMemberRecord[]>(`/project_members?id=eq.${encodeURIComponent(memberId)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "removed" })
    });
    if (result.error) return { data: false, source: "supabase" as const, isFallback: false, error: result.error };
    return { data: true, source: "supabase" as const, isFallback: false };
  }
};
