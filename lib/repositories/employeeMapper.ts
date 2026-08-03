import type { Department as DomainDepartment, Employee, EmployeeInput, EmployeeStatus } from "@/lib/models";
import type { Department as SupabaseDepartment, Employee as SupabaseEmployee, Profile } from "@/lib/supabase";

export type SupabaseEmployeeRecord = SupabaseEmployee & {
  departments?: Pick<SupabaseDepartment, "id" | "name"> | null;
  profiles?: Pick<Profile, "id" | "email" | "full_name" | "avatar_url"> | null;
  manager?: Pick<SupabaseEmployee, "id" | "first_name" | "last_name"> | null;
};

export function toEmployeeStatus(status?: string | null): EmployeeStatus {
  if (status === "away") return "Away";
  if (status === "pending") return "Pending";
  if (status === "inactive") return "Inactive";
  if (status === "archived") return "Archived";
  return "Active";
}

function toDatabaseStatus(status?: EmployeeStatus | string) {
  if (status === "Away") return "away";
  if (status === "Pending") return "pending";
  if (status === "Inactive") return "inactive";
  if (status === "Archived") return "archived";
  return "active";
}

export function mapSupabaseEmployeeToDomain(record: SupabaseEmployeeRecord): Employee {
  const fullName = `${record.first_name} ${record.last_name}`.trim();
  const managerName = record.manager ? `${record.manager.first_name} ${record.manager.last_name}`.trim() : undefined;
  return {
    id: record.id,
    organizationId: record.organization_id,
    departmentId: record.department_id || undefined,
    profileId: record.profile_id || undefined,
    managerId: record.manager_id || undefined,
    employeeNumber: record.employee_number || undefined,
    firstName: record.first_name,
    lastName: record.last_name,
    fullName,
    name: fullName,
    role: record.job_title || "Employee",
    jobTitle: record.job_title || undefined,
    department: record.departments?.name || "Unassigned",
    departmentName: record.departments?.name || undefined,
    managerName,
    email: record.profiles?.email || undefined,
    avatar: record.avatar_url || record.profiles?.avatar_url || undefined,
    avatarUrl: record.avatar_url || record.profiles?.avatar_url || undefined,
    phone: record.phone || undefined,
    employmentType: record.employment_type || undefined,
    status: toEmployeeStatus(record.status),
    workload: typeof record.metadata?.workload === "number" ? record.metadata.workload : 0,
    activeProjects: typeof record.metadata?.activeProjects === "number" ? record.metadata.activeProjects : 0,
    hireDate: record.hire_date || undefined,
    metadata: record.metadata || {},
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function mapDemoEmployeeToDomain(employee: { name: string; role: string; department: string; status: string; tasks: number; workload: number }, organizationId: string, departments: DomainDepartment[] = []): Employee {
  const [firstName = employee.name, ...rest] = employee.name.split(" ");
  const department = departments.find((item) => item.name === employee.department);
  return {
    id: `${organizationId}-employee-${employee.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    organizationId,
    departmentId: department?.id,
    employeeNumber: `EMP-${String(Math.abs(employee.name.length * 37)).padStart(4, "0")}`,
    firstName,
    lastName: rest.join(" ") || "-",
    fullName: employee.name,
    name: employee.name,
    role: employee.role,
    jobTitle: employee.role,
    department: employee.department,
    departmentName: employee.department,
    email: `${employee.name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.+$/g, "")}@atlas.demo`,
    phone: "+212 600 000 000",
    employmentType: "Full-time",
    status: employee.status,
    tasks: employee.tasks,
    workload: employee.workload,
    activeProjects: Math.max(1, Math.round(employee.tasks / 4)),
    hireDate: "2025-01-15",
    metadata: { workload: employee.workload, activeProjects: Math.max(1, Math.round(employee.tasks / 4)) },
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-07-18T09:00:00.000Z"
  };
}

export function mapEmployeeInputToSupabase(input: Partial<EmployeeInput>) {
  return {
    ...(input.organizationId !== undefined ? { organization_id: input.organizationId } : {}),
    ...(input.departmentId !== undefined ? { department_id: input.departmentId || null } : {}),
    ...(input.profileId !== undefined ? { profile_id: input.profileId || null } : {}),
    ...(input.managerId !== undefined ? { manager_id: input.managerId || null } : {}),
    ...(input.employeeNumber !== undefined ? { employee_number: input.employeeNumber || null } : {}),
    ...(input.firstName !== undefined ? { first_name: input.firstName } : {}),
    ...(input.lastName !== undefined ? { last_name: input.lastName } : {}),
    ...(input.jobTitle !== undefined ? { job_title: input.jobTitle || null } : {}),
    ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
    ...(input.employmentType !== undefined ? { employment_type: input.employmentType || null } : {}),
    ...(input.status !== undefined ? { status: toDatabaseStatus(input.status) } : {}),
    ...(input.hireDate !== undefined ? { hire_date: input.hireDate || null } : {}),
    ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl || null } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata || {} } : {})
  };
}
