import { departments, demoUsers } from "@/lib/data";
import type { Department, DepartmentInput } from "@/lib/models";
import { slugifyDepartment } from "./departmentMapper";

const descriptions: Record<string, string> = {
  Engineering: "Coordinates engineering delivery, site execution, technical reviews, and delivery risks.",
  Architecture: "Owns concept design, BIM coordination, permits, and client design packages.",
  Procurement: "Manages supplier sourcing, quotation comparison, contracts, and purchasing readiness.",
  Logistics: "Coordinates material movement, equipment availability, fleet plans, and site delivery windows.",
  Finance: "Tracks budgets, payment schedules, forecasts, and executive financial reporting."
};

export function makeDemoDepartments(organizationId: string): Department[] {
  return departments.map((name, index) => {
    const lead = demoUsers.find((user) => user.department === name) || demoUsers[index % demoUsers.length];
    const workload = [78, 70, 66, 58, 62][index] || 60;
    return {
      id: `${organizationId}-${slugifyDepartment(name)}`,
      organizationId,
      name,
      slug: slugifyDepartment(name),
      description: descriptions[name] || "Department workspace.",
      lead: lead?.name || "Unassigned",
      leadName: lead?.name,
      leadUserId: `demo-profile-${index + 1}`,
      employees: demoUsers.filter((user) => user.department === name).length || index + 3,
      memberCount: demoUsers.filter((user) => user.department === name).length || index + 3,
      activeProjects: Math.max(1, 5 - index),
      activeProjectCount: Math.max(1, 5 - index),
      workload,
      status: workload > 75 ? "Watch" : "Healthy",
      priorities: ["Project delivery", "Weekly reporting", "Risk follow-up"].slice(0, 2 + (index % 2)),
      recentActivity: ["Updated weekly priorities", "Reviewed workspace status"],
      metadata: { workload, priorities: ["Project delivery", "Weekly reporting"] },
      createdAt: "2026-01-04T09:00:00.000Z",
      updatedAt: "2026-07-18T09:00:00.000Z"
    };
  });
}

export const departmentDemoAdapter = {
  async getDepartments(organizationId: string) {
    return { data: makeDemoDepartments(organizationId), source: "demo" as const, isFallback: false };
  },

  async getDepartmentById(organizationId: string, departmentId: string) {
    const department = makeDemoDepartments(organizationId).find((item) => item.id === departmentId || item.slug === departmentId);
    return { data: department, source: "demo" as const, isFallback: false };
  },

  async slugExists(organizationId: string, slug: string, excludeId?: string) {
    return {
      data: makeDemoDepartments(organizationId).some((department) => department.id !== excludeId && department.slug === slug),
      source: "demo" as const,
      isFallback: false
    };
  },

  async createDepartment(input: DepartmentInput) {
    const now = new Date().toISOString();
    const department: Department = {
      id: `${input.organizationId}-${input.slug}`,
      organizationId: input.organizationId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      leadUserId: input.leadUserId,
      lead: input.leadUserId || "Unassigned",
      leadName: input.leadUserId || "Unassigned",
      memberCount: 0,
      activeProjectCount: 0,
      workload: 0,
      status: input.status || "Active",
      priorities: [],
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now
    };
    return { data: department, source: "demo" as const, isFallback: false };
  },

  async updateDepartment(departmentId: string, input: Partial<DepartmentInput>) {
    const organizationId = input.organizationId || departmentId.split("-").slice(0, -1).join("-") || "atlas";
    const existing = makeDemoDepartments(organizationId).find((department) => department.id === departmentId || department.slug === departmentId);
    if (!existing) return { data: undefined, source: "demo" as const, isFallback: false, error: "Department not found in demo data." };
    return {
      data: { ...existing, ...input, updatedAt: new Date().toISOString() },
      source: "demo" as const,
      isFallback: false
    };
  },

  async archiveDepartment(departmentId: string) {
    const organizationId = departmentId.split("-").slice(0, -1).join("-") || "atlas";
    const exists = makeDemoDepartments(organizationId).some((department) => department.id === departmentId || department.slug === departmentId);
    return {
      data: exists,
      source: "demo" as const,
      isFallback: false,
      error: exists ? undefined : "Department not found in demo data."
    };
  }
};
