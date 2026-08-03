import { demoUsers } from "@/lib/data";
import type { Employee, EmployeeInput } from "@/lib/models";
import { departmentDemoAdapter } from "./departmentDemoAdapter";
import { mapDemoEmployeeToDomain } from "./employeeMapper";

async function makeEmployees(organizationId: string): Promise<Employee[]> {
  const departments = (await departmentDemoAdapter.getDepartments(organizationId)).data;
  return demoUsers.map((employee) => mapDemoEmployeeToDomain(employee, organizationId, departments));
}

export const employeeDemoAdapter = {
  async getEmployees(organizationId: string) {
    return { data: await makeEmployees(organizationId), source: "demo" as const, isFallback: false };
  },

  async getEmployee(organizationId: string, employeeId: string) {
    const employee = (await makeEmployees(organizationId)).find((item) => item.id === employeeId || item.employeeNumber === employeeId);
    return { data: employee, source: "demo" as const, isFallback: false };
  },

  async employeeNumberExists(organizationId: string, employeeNumber: string, excludeId?: string) {
    const employees = await makeEmployees(organizationId);
    return {
      data: employees.some((employee) => employee.id !== excludeId && employee.employeeNumber === employeeNumber),
      source: "demo" as const,
      isFallback: false
    };
  },

  async createEmployee(input: EmployeeInput) {
    const now = new Date().toISOString();
    const employee: Employee = {
      id: `${input.organizationId}-employee-${input.employeeNumber || Date.now()}`,
      organizationId: input.organizationId,
      departmentId: input.departmentId,
      profileId: input.profileId,
      managerId: input.managerId,
      employeeNumber: input.employeeNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      fullName: `${input.firstName} ${input.lastName}`.trim(),
      name: `${input.firstName} ${input.lastName}`.trim(),
      role: input.jobTitle || "Employee",
      jobTitle: input.jobTitle,
      department: input.departmentId || "Unassigned",
      phone: input.phone,
      email: input.email,
      employmentType: input.employmentType || "Full-time",
      status: input.status || "Active",
      workload: 0,
      activeProjects: 0,
      hireDate: input.hireDate,
      avatarUrl: input.avatarUrl,
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now
    };
    return { data: employee, source: "demo" as const, isFallback: false };
  },

  async updateEmployee(employeeId: string, input: Partial<EmployeeInput>) {
    const organizationId = input.organizationId || employeeId.split("-employee-")[0] || "atlas";
    const existing = (await makeEmployees(organizationId)).find((employee) => employee.id === employeeId);
    if (!existing) return { data: undefined, source: "demo" as const, isFallback: false, error: "Employee not found in demo data." };
    const firstName = input.firstName ?? existing.firstName ?? existing.name;
    const lastName = input.lastName ?? existing.lastName ?? "";
    return {
      data: {
        ...existing,
        ...input,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        name: `${firstName} ${lastName}`.trim(),
        role: input.jobTitle || existing.role,
        updatedAt: new Date().toISOString()
      },
      source: "demo" as const,
      isFallback: false
    };
  },

  async archiveEmployee(employeeId: string) {
    const organizationId = employeeId.split("-employee-")[0] || "atlas";
    const exists = (await makeEmployees(organizationId)).some((employee) => employee.id === employeeId);
    return {
      data: exists,
      source: "demo" as const,
      isFallback: false,
      error: exists ? undefined : "Employee not found in demo data."
    };
  }
};
