import type { OrganizationMember, OrganizationMemberInput } from "@/lib/models";
import { isUuid, organizationRest } from "./organizationSupabaseRest";
import { mapMemberInputToSupabase, mapSupabaseMemberToDomain, type SupabaseOrganizationMemberRecord } from "./organizationMemberMapper";
import { organizationSupabaseAdapter } from "./organizationSupabaseAdapter";

async function resolveOrganizationId(organizationId: string) {
  if (isUuid(organizationId)) return organizationId;
  const organization = await organizationSupabaseAdapter.getOrganization(organizationId);
  return organization.data?.id;
}

const memberSelect = "*,profiles(id,email,full_name,avatar_url),organization_roles(id,name)";

export const organizationMemberSupabaseAdapter = {
  async getOrganizationMembers(organizationId: string) {
    const resolvedId = await resolveOrganizationId(organizationId);
    if (!resolvedId) return { data: [] as OrganizationMember[], source: "supabase" as const, isFallback: false, error: "Organization not found." };

    const encoded = encodeURIComponent(resolvedId);
    const result = await organizationRest<SupabaseOrganizationMemberRecord[]>(
      `/organization_members?organization_id=eq.${encoded}&select=${encodeURIComponent(memberSelect)}&order=joined_at.desc`
    );
    if (result.error) return { data: [] as OrganizationMember[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseMemberToDomain), source: "supabase" as const, isFallback: false };
  },

  async getOrganizationMember(memberId: string) {
    const encoded = encodeURIComponent(memberId);
    const result = await organizationRest<SupabaseOrganizationMemberRecord[]>(`/organization_members?id=eq.${encoded}&select=${encodeURIComponent(memberSelect)}&limit=1`);
    if (result.error) return { data: undefined as OrganizationMember | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseMemberToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async addOrganizationMember(input: OrganizationMemberInput) {
    const resolvedId = await resolveOrganizationId(input.organizationId);
    if (!resolvedId) return { data: undefined as OrganizationMember | undefined, source: "supabase" as const, isFallback: false, error: "Organization not found." };

    const result = await organizationRest<SupabaseOrganizationMemberRecord[]>("/organization_members", {
      method: "POST",
      body: JSON.stringify(mapMemberInputToSupabase({ ...input, organizationId: resolvedId }))
    });
    if (result.error) return { data: undefined as OrganizationMember | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseMemberToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateOrganizationMember(memberId: string, input: Partial<OrganizationMemberInput>) {
    const existing = await this.getOrganizationMember(memberId);
    if (!existing.data) return { data: undefined as OrganizationMember | undefined, source: "supabase" as const, isFallback: false, error: existing.error || "Member not found." };
    if (existing.data.roleName === "Owner") {
      return { data: undefined as OrganizationMember | undefined, source: "supabase" as const, isFallback: false, error: "Owner membership cannot be modified here." };
    }

    const encoded = encodeURIComponent(memberId);
    const result = await organizationRest<SupabaseOrganizationMemberRecord[]>(`/organization_members?id=eq.${encoded}`, {
      method: "PATCH",
      body: JSON.stringify(mapMemberInputToSupabase(input))
    });
    if (result.error) return { data: undefined as OrganizationMember | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseMemberToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async removeOrganizationMember(memberId: string) {
    const existing = await this.getOrganizationMember(memberId);
    if (!existing.data) return { data: false, source: "supabase" as const, isFallback: false, error: existing.error || "Member not found." };
    if (existing.data.roleName === "Owner") {
      return { data: false, source: "supabase" as const, isFallback: false, error: "Owner membership cannot be removed." };
    }

    const result = await this.updateOrganizationMember(memberId, { status: "Removed" });
    return {
      data: Boolean(result.data),
      source: "supabase" as const,
      isFallback: false,
      error: "error" in result ? result.error : undefined
    };
  }
};
