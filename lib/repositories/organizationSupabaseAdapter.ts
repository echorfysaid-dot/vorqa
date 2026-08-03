import type { Organization } from "@/lib/models";
import { getValidSession } from "@/lib/auth-client";
import type { Organization as SupabaseOrganization } from "@/lib/supabase";
import { mapOrganizationInputToSupabase, mapSupabaseOrganizationToDomain, type OrganizationMutationInput } from "./organizationMapper";
import { isUuid, organizationRest } from "./organizationSupabaseRest";

export const organizationSupabaseAdapter = {
  async getOrganizations() {
    const result = await organizationRest<SupabaseOrganization[]>("/organizations?order=updated_at.desc");
    if (result.error) {
      return {
        data: [] as Organization[],
        source: "supabase" as const,
        isFallback: false,
        error: result.error
      };
    }

    return {
      data: (result.data || []).map(mapSupabaseOrganizationToDomain),
      source: "supabase" as const,
      isFallback: false
    };
  },

  async getOrganization(id: string) {
    const encoded = encodeURIComponent(id);
    const query = isUuid(id) ? `/organizations?or=(id.eq.${encoded},slug.eq.${encoded})&limit=1` : `/organizations?slug=eq.${encoded}&limit=1`;
    const result = await organizationRest<SupabaseOrganization[]>(query);
    if (result.error) {
      return {
        data: undefined as Organization | undefined,
        source: "supabase" as const,
        isFallback: false,
        error: result.error
      };
    }

    const record = result.data?.[0];
    return {
      data: record ? mapSupabaseOrganizationToDomain(record) : undefined,
      source: "supabase" as const,
      isFallback: false
    };
  },

  async getOrganizationProjects(_organizationId: string) {
    return {
      data: [],
      source: "supabase" as const,
      isFallback: false,
      error: "Organization-project relationships are not connected yet."
    };
  },

  async getOrganizationEmployees(_organizationId: string) {
    return {
      data: [],
      source: "supabase" as const,
      isFallback: false,
      error: "Organization-employee relationships are not connected yet."
    };
  },

  async getOrganizationStats(_organizationId: string) {
    return {
      data: undefined,
      source: "supabase" as const,
      isFallback: false,
      error: "Organization stats are not connected yet."
    };
  },

  async slugExists(slug: string, excludeId?: string) {
    const encoded = encodeURIComponent(slug);
    const result = await organizationRest<Array<{ id: string }>>(`/organizations?slug=eq.${encoded}&select=id&limit=1`);
    if (result.error) return { data: false, source: "supabase" as const, isFallback: false, error: result.error };
    const match = result.data?.[0];
    return { data: Boolean(match && match.id !== excludeId), source: "supabase" as const, isFallback: false };
  },

  async createOrganization(input: OrganizationMutationInput) {
    const session = await getValidSession();
    if (!session?.user?.id) {
      return { data: undefined as Organization | undefined, source: "supabase" as const, isFallback: false, error: "Authentication is required to create an organization." };
    }

    const result = await organizationRest<SupabaseOrganization[]>("/organizations", {
      method: "POST",
      body: JSON.stringify(mapOrganizationInputToSupabase(input, session.user.id))
    });
    if (result.error) return { data: undefined as Organization | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseOrganizationToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateOrganization(id: string, input: OrganizationMutationInput) {
    const encoded = encodeURIComponent(id);
    const query = isUuid(id) ? `/organizations?id=eq.${encoded}` : `/organizations?slug=eq.${encoded}`;
    const result = await organizationRest<SupabaseOrganization[]>(query, {
      method: "PATCH",
      body: JSON.stringify(mapOrganizationInputToSupabase(input))
    });
    if (result.error) return { data: undefined as Organization | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseOrganizationToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async deleteOrganization(id: string) {
    const result = await organizationSupabaseAdapter.updateOrganization(id, { status: "Archived" });
    const resultError = "error" in result ? result.error : undefined;
    return {
      data: Boolean(result.data),
      source: "supabase" as const,
      isFallback: false,
      error: resultError
    };
  }
};
