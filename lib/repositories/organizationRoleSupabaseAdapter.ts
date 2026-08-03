import type { OrganizationRoleInput, OrganizationRoleRecord } from "@/lib/models";
import { isUuid, organizationRest } from "./organizationSupabaseRest";
import { mapRoleInputToSupabase, mapSupabaseRoleToDomain, type SupabaseOrganizationRoleRecord } from "./organizationRoleMapper";
import { organizationSupabaseAdapter } from "./organizationSupabaseAdapter";

async function resolveOrganizationId(organizationId: string) {
  if (isUuid(organizationId)) return organizationId;
  const organization = await organizationSupabaseAdapter.getOrganization(organizationId);
  return organization.data?.id;
}

const protectedRoleNames = new Set(["Owner", "Admin", "Member"]);

export const organizationRoleSupabaseAdapter = {
  async getOrganizationRoles(organizationId: string) {
    const resolvedId = await resolveOrganizationId(organizationId);
    if (!resolvedId) return { data: [] as OrganizationRoleRecord[], source: "supabase" as const, isFallback: false, error: "Organization not found." };

    const encoded = encodeURIComponent(resolvedId);
    const result = await organizationRest<SupabaseOrganizationRoleRecord[]>(
      `/organization_roles?organization_id=eq.${encoded}&select=*,organization_members(id)&order=created_at.asc`
    );
    if (result.error) return { data: [] as OrganizationRoleRecord[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseRoleToDomain), source: "supabase" as const, isFallback: false };
  },

  async getOrganizationRole(roleId: string) {
    const encoded = encodeURIComponent(roleId);
    const result = await organizationRest<SupabaseOrganizationRoleRecord[]>(`/organization_roles?id=eq.${encoded}&select=*,organization_members(id)&limit=1`);
    if (result.error) return { data: undefined as OrganizationRoleRecord | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseRoleToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async createOrganizationRole(input: OrganizationRoleInput) {
    const resolvedId = await resolveOrganizationId(input.organizationId);
    if (!resolvedId) return { data: undefined as OrganizationRoleRecord | undefined, source: "supabase" as const, isFallback: false, error: "Organization not found." };

    const result = await organizationRest<SupabaseOrganizationRoleRecord[]>("/organization_roles", {
      method: "POST",
      body: JSON.stringify(mapRoleInputToSupabase({ ...input, organizationId: resolvedId }))
    });
    if (result.error) return { data: undefined as OrganizationRoleRecord | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseRoleToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateOrganizationRole(roleId: string, input: Partial<OrganizationRoleInput>) {
    const existing = await this.getOrganizationRole(roleId);
    if (!existing.data) return { data: undefined as OrganizationRoleRecord | undefined, source: "supabase" as const, isFallback: false, error: existing.error || "Role not found." };
    if (existing.data.name === "Owner" && input.name && input.name !== "Owner") {
      return { data: undefined as OrganizationRoleRecord | undefined, source: "supabase" as const, isFallback: false, error: "Owner role cannot be renamed." };
    }

    const encoded = encodeURIComponent(roleId);
    const result = await organizationRest<SupabaseOrganizationRoleRecord[]>(`/organization_roles?id=eq.${encoded}`, {
      method: "PATCH",
      body: JSON.stringify(mapRoleInputToSupabase(input))
    });
    if (result.error) return { data: undefined as OrganizationRoleRecord | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseRoleToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async deleteOrganizationRole(roleId: string) {
    const existing = await this.getOrganizationRole(roleId);
    if (!existing.data) return { data: false, source: "supabase" as const, isFallback: false, error: existing.error || "Role not found." };
    if (protectedRoleNames.has(existing.data.name) || (existing.data.assignedMemberCount || 0) > 0) {
      return { data: false, source: "supabase" as const, isFallback: false, error: "Built-in or assigned roles cannot be deleted." };
    }

    const encoded = encodeURIComponent(roleId);
    const result = await organizationRest<null>(`/organization_roles?id=eq.${encoded}`, { method: "DELETE" });
    if (result.error) return { data: false, source: "supabase" as const, isFallback: false, error: result.error };
    return { data: true, source: "supabase" as const, isFallback: false };
  }
};
