import type { OrganizationMemberInput } from "@/lib/models";
import { getDataSourceMode } from "@/lib/data-source";
import { organizationMemberDemoAdapter } from "./organizationMemberDemoAdapter";
import { organizationMemberSupabaseAdapter } from "./organizationMemberSupabaseAdapter";

export const organizationMemberRepository = {
  async getOrganizationMembers(organizationId: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationMemberDemoAdapter.getOrganizationMembers(organizationId);
    const result = await organizationMemberSupabaseAdapter.getOrganizationMembers(organizationId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await organizationMemberDemoAdapter.getOrganizationMembers(organizationId)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async getOrganizationMember(memberId: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationMemberDemoAdapter.getOrganizationMember(memberId);
    const result = await organizationMemberSupabaseAdapter.getOrganizationMember(memberId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await organizationMemberDemoAdapter.getOrganizationMember(memberId)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async addOrganizationMember(input: OrganizationMemberInput) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationMemberDemoAdapter.addOrganizationMember(input);
    const result = await organizationMemberSupabaseAdapter.addOrganizationMember(input);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await organizationMemberDemoAdapter.addOrganizationMember(input)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async updateOrganizationMember(memberId: string, input: Partial<OrganizationMemberInput>) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationMemberDemoAdapter.updateOrganizationMember(memberId, input);
    const result = await organizationMemberSupabaseAdapter.updateOrganizationMember(memberId, input);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await organizationMemberDemoAdapter.updateOrganizationMember(memberId, input)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async removeOrganizationMember(memberId: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationMemberDemoAdapter.removeOrganizationMember(memberId);
    const result = await organizationMemberSupabaseAdapter.removeOrganizationMember(memberId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await organizationMemberDemoAdapter.removeOrganizationMember(memberId)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  }
};
