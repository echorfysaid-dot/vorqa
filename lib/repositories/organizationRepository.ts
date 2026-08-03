import { demoOrganizations, departments } from "@/lib/data";
import { getDataSourceMode } from "@/lib/data-source";
import { organizationDemoAdapter } from "./organizationDemoAdapter";
import { organizationSupabaseAdapter } from "./organizationSupabaseAdapter";
import type { OrganizationMutationInput } from "./organizationMapper";

export type DemoOrganization = (typeof demoOrganizations)[number];

export const organizationRepository = {
  list(): DemoOrganization[] {
    return [...demoOrganizations];
  },

  async getOrganizations() {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationDemoAdapter.getOrganizations();
    const result = await organizationSupabaseAdapter.getOrganizations();
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...organizationDemoAdapter.getOrganizations(),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  getById(id: string): DemoOrganization | undefined {
    return demoOrganizations.find((organization) => organization.id === id);
  },

  async getOrganization(id: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationDemoAdapter.getOrganization(id);
    const result = await organizationSupabaseAdapter.getOrganization(id);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...organizationDemoAdapter.getOrganization(id),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async getOrganizationById(id: string) {
    return this.getOrganization(id);
  },

  getOrganizationProjects(organizationId = "atlas") {
    return organizationDemoAdapter.getOrganizationProjects(organizationId);
  },

  getOrganizationEmployees(organizationId = "atlas") {
    return organizationDemoAdapter.getOrganizationEmployees(organizationId);
  },

  getOrganizationStats(organizationId = "atlas") {
    return organizationDemoAdapter.getOrganizationStats(organizationId);
  },

  async slugExists(slug: string, excludeId?: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationDemoAdapter.slugExists(slug, excludeId);
    const result = await organizationSupabaseAdapter.slugExists(slug, excludeId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return organizationDemoAdapter.slugExists(slug, excludeId);
  },

  async createOrganization(input: OrganizationMutationInput) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationDemoAdapter.createOrganization(input);
    const result = await organizationSupabaseAdapter.createOrganization(input);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await organizationDemoAdapter.createOrganization(input)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async updateOrganization(id: string, input: OrganizationMutationInput) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationDemoAdapter.updateOrganization(id, input);
    const result = await organizationSupabaseAdapter.updateOrganization(id, input);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await organizationDemoAdapter.updateOrganization(id, input)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async deleteOrganization(id: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return organizationDemoAdapter.deleteOrganization(id);
    const result = await organizationSupabaseAdapter.deleteOrganization(id);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await organizationDemoAdapter.deleteOrganization(id)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  getCurrent() {
    return organizationDemoAdapter.getCurrentCompany();
  },

  listDepartments(): string[] {
    return [...departments];
  }
};
