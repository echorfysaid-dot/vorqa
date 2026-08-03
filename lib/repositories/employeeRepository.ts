import { demoUsers } from "@/lib/data";
import type { EmployeeInput } from "@/lib/models";
import { getDataSourceMode } from "@/lib/data-source";
import { employeeDemoAdapter } from "./employeeDemoAdapter";
import { employeeSupabaseAdapter } from "./employeeSupabaseAdapter";

export type DemoEmployee = (typeof demoUsers)[number];

export const employeeRepository = {
  list(): DemoEmployee[] {
    return [...demoUsers];
  },

  listByDepartment(department: string): DemoEmployee[] {
    return demoUsers.filter((employee) => employee.department === department);
  },

  getByName(name: string): DemoEmployee | undefined {
    return demoUsers.find((employee) => employee.name === name);
  },

  async getEmployees(organizationId: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return employeeDemoAdapter.getEmployees(organizationId);
    const result = await employeeSupabaseAdapter.getEmployees(organizationId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await employeeDemoAdapter.getEmployees(organizationId)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async getEmployee(organizationId: string, employeeId: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return employeeDemoAdapter.getEmployee(organizationId, employeeId);
    const result = await employeeSupabaseAdapter.getEmployee(organizationId, employeeId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await employeeDemoAdapter.getEmployee(organizationId, employeeId)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async employeeNumberExists(organizationId: string, employeeNumber: string, excludeId?: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return employeeDemoAdapter.employeeNumberExists(organizationId, employeeNumber, excludeId);
    const result = await employeeSupabaseAdapter.employeeNumberExists(organizationId, employeeNumber, excludeId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return employeeDemoAdapter.employeeNumberExists(organizationId, employeeNumber, excludeId);
  },

  async createEmployee(input: EmployeeInput) {
    const mode = getDataSourceMode();
    if (mode === "demo") return employeeDemoAdapter.createEmployee(input);
    const result = await employeeSupabaseAdapter.createEmployee(input);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await employeeDemoAdapter.createEmployee(input)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async updateEmployee(employeeId: string, input: Partial<EmployeeInput>) {
    const mode = getDataSourceMode();
    if (mode === "demo") return employeeDemoAdapter.updateEmployee(employeeId, input);
    const result = await employeeSupabaseAdapter.updateEmployee(employeeId, input);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await employeeDemoAdapter.updateEmployee(employeeId, input)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async archiveEmployee(employeeId: string) {
    const mode = getDataSourceMode();
    if (mode === "demo") return employeeDemoAdapter.archiveEmployee(employeeId);
    const result = await employeeSupabaseAdapter.archiveEmployee(employeeId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return {
      ...(await employeeDemoAdapter.archiveEmployee(employeeId)),
      source: "demo-fallback" as const,
      isFallback: true,
      error: result.error
    };
  },

  async getOrganizationEmployeeStats(organizationId: string) {
    const employees = await this.getEmployees(organizationId);
    return {
      data: {
        employeeCount: employees.data.length,
        activeEmployeeCount: employees.data.filter((employee) => employee.status === "Active").length
      },
      source: employees.source,
      isFallback: employees.isFallback,
      error: "error" in employees ? employees.error : undefined
    };
  }
};
