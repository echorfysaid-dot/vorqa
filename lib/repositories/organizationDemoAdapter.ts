import { demoCompany, demoOrganizations, departments } from "@/lib/data";
import { employeeRepository } from "./employeeRepository";
import { projectRepository } from "./projectRepository";
import { mapDemoOrganizationToDomain, type OrganizationMutationInput } from "./organizationMapper";
import type { Organization } from "@/lib/models";

export type OrganizationRepositorySource = "demo" | "supabase";

export const organizationDemoAdapter = {
  getOrganizations() {
    return {
      data: demoOrganizations.map(mapDemoOrganizationToDomain),
      source: "demo" as const,
      isFallback: false
    };
  },

  getOrganization(id: string) {
    const organization = demoOrganizations.find((item) => item.id === id);
    return {
      data: organization ? mapDemoOrganizationToDomain(organization) : undefined,
      source: "demo" as const,
      isFallback: false
    };
  },

  getCurrentCompany() {
    return demoCompany;
  },

  getOrganizationProjects(_organizationId = "atlas") {
    return projectRepository.list();
  },

  getOrganizationEmployees(_organizationId = "atlas") {
    return employeeRepository.list();
  },

  getOrganizationStats(organizationId = "atlas") {
    const organization = demoOrganizations.find((item) => item.id === organizationId) || demoOrganizations[0];
    const projects = this.getOrganizationProjects(organizationId);
    const employees = this.getOrganizationEmployees(organizationId);
    return {
      organizationId,
      employees: organization.employees,
      activeProjects: organization.activeProjects,
      visibleProjects: projects.length,
      visibleEmployees: employees.length,
      employeeCount: employees.length,
      activeEmployeeCount: employees.filter((employee) => employee.status === "Active").length,
      departments: departments.length,
      departmentCount: departments.length,
      activeDepartmentCount: departments.length
    };
  },

  async slugExists(slug: string, excludeId?: string) {
    return {
      data: demoOrganizations.some((organization) => organization.id !== excludeId && organization.id === slug),
      source: "demo" as const,
      isFallback: false
    };
  },

  async createOrganization(input: OrganizationMutationInput) {
    const organization: Organization = {
      id: input.slug || `demo-${Date.now()}`,
      name: input.name || "Demo Organization",
      slug: input.slug,
      legalName: input.legalName,
      logo: input.logo || (input.name || "DO").slice(0, 2).toUpperCase(),
      website: input.website,
      industry: input.industry || "Construction",
      location: [input.city, input.country].filter(Boolean).join(", ") || "Demo location",
      city: input.city,
      country: input.country,
      timezone: input.timezone || "Africa/Casablanca",
      currency: input.currency || "MAD",
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      employees: 0,
      activeProjects: 0,
      role: "Owner",
      status: input.status || "Active",
      workspace: "Demo organization workspace",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { data: organization, source: "demo" as const, isFallback: false };
  },

  async updateOrganization(id: string, input: OrganizationMutationInput) {
    const existing = demoOrganizations.find((organization) => organization.id === id);
    if (!existing) return { data: undefined, source: "demo" as const, isFallback: false, error: "Organization not found in demo data." };
    return {
      data: {
        ...mapDemoOrganizationToDomain(existing),
        ...input,
        updatedAt: new Date().toISOString()
      },
      source: "demo" as const,
      isFallback: false
    };
  },

  async deleteOrganization(id: string) {
    const exists = demoOrganizations.some((organization) => organization.id === id);
    return {
      data: exists,
      source: "demo" as const,
      isFallback: false,
      error: exists ? undefined : "Organization not found in demo data."
    };
  }
};
