import type { DepartmentInput } from "@/lib/models";
import { getDataSourceMode } from "@/lib/data-source";
import { departmentDemoAdapter } from "./departmentDemoAdapter";
import { departmentSupabaseAdapter } from "./departmentSupabaseAdapter";

export const departmentRepository = {
  async getDepartments(organizationId: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return departmentDemoAdapter.getDepartments(organizationId);
    const result = await departmentSupabaseAdapter.getDepartments(organizationId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await departmentDemoAdapter.getDepartments(organizationId)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async getDepartmentById(organizationId: string, departmentId: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return departmentDemoAdapter.getDepartmentById(organizationId, departmentId);
    const result = await departmentSupabaseAdapter.getDepartmentById(organizationId, departmentId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await departmentDemoAdapter.getDepartmentById(organizationId, departmentId)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async slugExists(organizationId: string, slug: string, excludeId?: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return departmentDemoAdapter.slugExists(organizationId, slug, excludeId);
    const result = await departmentSupabaseAdapter.slugExists(organizationId, slug, excludeId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return departmentDemoAdapter.slugExists(organizationId, slug, excludeId);
  },

  async createDepartment(input: DepartmentInput) {
    const mode = getDataSourceMode();
    if (mode === "demo") return departmentDemoAdapter.createDepartment(input);
    const result = await departmentSupabaseAdapter.createDepartment(input);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await departmentDemoAdapter.createDepartment(input)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async updateDepartment(departmentId: string, input: Partial<DepartmentInput>) {
    const mode = getDataSourceMode();
    if (mode === "demo") return departmentDemoAdapter.updateDepartment(departmentId, input);
    const result = await departmentSupabaseAdapter.updateDepartment(departmentId, input);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await departmentDemoAdapter.updateDepartment(departmentId, input)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async archiveDepartment(departmentId: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return departmentDemoAdapter.archiveDepartment(departmentId);
    const result = await departmentSupabaseAdapter.archiveDepartment(departmentId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await departmentDemoAdapter.archiveDepartment(departmentId)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async getOrganizationDepartmentStats(organizationId: string) {
    const departments = await this.getDepartments(organizationId);
    return {
      data: {
        departmentCount: departments.data.length,
        activeDepartmentCount: departments.data.filter((department) => department.status !== "Archived").length
      },
      source: departments.source,
      isFallback: departments.isFallback,
      error: "error" in departments ? departments.error : undefined
    };
  }
};
