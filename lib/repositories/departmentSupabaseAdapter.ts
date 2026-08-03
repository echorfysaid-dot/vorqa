import type { Department, DepartmentInput } from "@/lib/models";
import { isUuid, organizationRest } from "./organizationSupabaseRest";
import { organizationSupabaseAdapter } from "./organizationSupabaseAdapter";
import { mapDepartmentInputToSupabase, mapSupabaseDepartmentToDomain, type SupabaseDepartmentRecord } from "./departmentMapper";

async function resolveOrganizationId(organizationId: string) {
  if (isUuid(organizationId)) return organizationId;
  const organization = await organizationSupabaseAdapter.getOrganization(organizationId);
  return organization.data?.id;
}

const departmentSelect = "*,profiles(id,email,full_name,avatar_url)";

export const departmentSupabaseAdapter = {
  async getDepartments(organizationId: string) {
    const resolvedId = await resolveOrganizationId(organizationId);
    if (!resolvedId) return { data: [] as Department[], source: "supabase" as const, isFallback: false, error: "Organization not found." };
    const encoded = encodeURIComponent(resolvedId);
    const result = await organizationRest<SupabaseDepartmentRecord[]>(
      `/departments?organization_id=eq.${encoded}&select=${encodeURIComponent(departmentSelect)}&order=created_at.asc`
    );
    if (result.error) return { data: [] as Department[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseDepartmentToDomain), source: "supabase" as const, isFallback: false };
  },

  async getDepartmentById(organizationId: string, departmentId: string) {
    const resolvedId = await resolveOrganizationId(organizationId);
    if (!resolvedId) return { data: undefined as Department | undefined, source: "supabase" as const, isFallback: false, error: "Organization not found." };
    const encodedOrganization = encodeURIComponent(resolvedId);
    const encodedDepartment = encodeURIComponent(departmentId);
    const departmentFilter = isUuid(departmentId) ? `id.eq.${encodedDepartment}` : `slug.eq.${encodedDepartment}`;
    const result = await organizationRest<SupabaseDepartmentRecord[]>(
      `/departments?organization_id=eq.${encodedOrganization}&${departmentFilter.split(".")[0]}=${departmentFilter.split(".").slice(1).join(".")}&select=${encodeURIComponent(departmentSelect)}&limit=1`
    );
    if (result.error) return { data: undefined as Department | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseDepartmentToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async slugExists(organizationId: string, slug: string, excludeId?: string) {
    const resolvedId = await resolveOrganizationId(organizationId);
    if (!resolvedId) return { data: false, source: "supabase" as const, isFallback: false, error: "Organization not found." };
    const result = await organizationRest<Array<{ id: string }>>(
      `/departments?organization_id=eq.${encodeURIComponent(resolvedId)}&slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`
    );
    if (result.error) return { data: false, source: "supabase" as const, isFallback: false, error: result.error };
    const match = result.data?.[0];
    return { data: Boolean(match && match.id !== excludeId), source: "supabase" as const, isFallback: false };
  },

  async createDepartment(input: DepartmentInput) {
    const resolvedId = await resolveOrganizationId(input.organizationId);
    if (!resolvedId) return { data: undefined as Department | undefined, source: "supabase" as const, isFallback: false, error: "Organization not found." };
    const result = await organizationRest<SupabaseDepartmentRecord[]>("/departments", {
      method: "POST",
      body: JSON.stringify(mapDepartmentInputToSupabase({ ...input, organizationId: resolvedId }))
    });
    if (result.error) return { data: undefined as Department | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseDepartmentToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateDepartment(departmentId: string, input: Partial<DepartmentInput>) {
    const encoded = encodeURIComponent(departmentId);
    const result = await organizationRest<SupabaseDepartmentRecord[]>(`/departments?id=eq.${encoded}`, {
      method: "PATCH",
      body: JSON.stringify(mapDepartmentInputToSupabase(input))
    });
    if (result.error) return { data: undefined as Department | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseDepartmentToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async archiveDepartment(departmentId: string) {
    const result = await this.updateDepartment(departmentId, { status: "Archived" });
    return {
      data: Boolean(result.data),
      source: "supabase" as const,
      isFallback: false,
      error: "error" in result ? result.error : undefined
    };
  }
};
