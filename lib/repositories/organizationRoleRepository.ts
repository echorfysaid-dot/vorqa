import type { OrganizationRoleInput } from "@/lib/models";
import { getDataSourceMode } from "@/lib/data-source";
import { organizationRoleDemoAdapter } from "./organizationRoleDemoAdapter";
import { organizationRoleSupabaseAdapter } from "./organizationRoleSupabaseAdapter";

export const organizationRoleRepository = {
  async getOrganizationRoles(organizationId: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationRoleDemoAdapter.getOrganizationRoles(organizationId);
    const result = await organizationRoleSupabaseAdapter.getOrganizationRoles(organizationId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await organizationRoleDemoAdapter.getOrganizationRoles(organizationId)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async getOrganizationRole(roleId: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationRoleDemoAdapter.getOrganizationRole(roleId);
    const result = await organizationRoleSupabaseAdapter.getOrganizationRole(roleId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await organizationRoleDemoAdapter.getOrganizationRole(roleId)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async createOrganizationRole(input: OrganizationRoleInput) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationRoleDemoAdapter.createOrganizationRole(input);
    const result = await organizationRoleSupabaseAdapter.createOrganizationRole(input);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await organizationRoleDemoAdapter.createOrganizationRole(input)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async updateOrganizationRole(roleId: string, input: Partial<OrganizationRoleInput>) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationRoleDemoAdapter.updateOrganizationRole(roleId, input);
    const result = await organizationRoleSupabaseAdapter.updateOrganizationRole(roleId, input);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await organizationRoleDemoAdapter.updateOrganizationRole(roleId, input)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async deleteOrganizationRole(roleId: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationRoleDemoAdapter.deleteOrganizationRole(roleId);
    const result = await organizationRoleSupabaseAdapter.deleteOrganizationRole(roleId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await organizationRoleDemoAdapter.deleteOrganizationRole(roleId)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  }
};
