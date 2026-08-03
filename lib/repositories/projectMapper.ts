import type { Department, Employee, Organization, Project, ProjectInput, ProjectMember, ProjectMemberInput, ProjectMemberStatus } from "@/lib/models";
import type { Department as SupabaseDepartment, Employee as SupabaseEmployee, Organization as SupabaseOrganization, Project as SupabaseProject, ProjectMember as SupabaseProjectMember } from "@/lib/supabase";

export type SupabaseProjectRecord = SupabaseProject & {
  organizations?: Pick<SupabaseOrganization, "id" | "name" | "slug"> | null;
  departments?: Pick<SupabaseDepartment, "id" | "name" | "slug"> | null;
  project_manager?: Pick<SupabaseEmployee, "id" | "first_name" | "last_name"> | null;
  project_members?: Array<{ id: string }>;
};

export type SupabaseProjectMemberRecord = SupabaseProjectMember & {
  employees?: Pick<SupabaseEmployee, "id" | "first_name" | "last_name" | "job_title"> | null;
};

function metadataString(metadata: Record<string, unknown>, key: string, fallback: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function metadataNumber(metadata: Record<string, unknown>, key: string, fallback: number) {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function slugifyProject(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function mapSupabaseProject(record: SupabaseProjectRecord): Project {
  const metadata = record.metadata || {};
  const managerName = record.project_manager ? `${record.project_manager.first_name} ${record.project_manager.last_name}`.trim() : undefined;
  return {
    id: record.id,
    ownerId: record.owner_id,
    organizationId: record.organization_id || undefined,
    organizationName: record.organizations?.name || metadataString(metadata, "organizationName", ""),
    departmentId: record.department_id || undefined,
    teamId: record.team_id || undefined,
    departmentName: record.departments?.name || metadataString(metadata, "departmentName", ""),
    projectManagerId: record.project_manager_id || undefined,
    projectManagerName: managerName || metadataString(metadata, "projectManagerName", ""),
    slug: record.slug || undefined,
    title: record.title,
    description: record.description || metadataString(metadata, "description", ""),
    type: metadataString(metadata, "projectType", record.type?.replaceAll("_", " ") || "Project"),
    status: metadataString(metadata, "statusLabel", record.status),
    updatedAt: record.updated_at,
    score: metadataNumber(metadata, "score", 0),
    budget: metadataString(metadata, "budget", "Not set"),
    timeline: metadataString(metadata, "timeline", "Not scheduled"),
    team: record.project_members?.length ?? metadataNumber(metadata, "team", 0),
    teamSize: record.project_members?.length ?? metadataNumber(metadata, "team", 0),
    documents: metadataNumber(metadata, "documents", 0),
    knowledgeFiles: metadataNumber(metadata, "knowledgeFiles", 0),
    phase: metadataString(metadata, "phase", record.status),
    location: metadataString(metadata, "location", ""),
    metadata
  };
}

export function mapDemoProjectToDomain(project: Project, organizations: Organization[] = [], departments: Department[] = [], employees: Employee[] = []): Project {
  const organization = organizations[0];
  const department = departments.find((item) => project.type.toLowerCase().includes(item.name.toLowerCase())) || departments[0];
  const manager = employees.find((item) => String(item.role).toLowerCase().includes("manager")) || employees[0];
  return {
    ...project,
    organizationId: organization?.id || "atlas",
    organizationName: organization?.name || "Atlas Construction Group",
    departmentId: department?.id,
    departmentName: department?.name,
    projectManagerId: manager?.id,
    projectManagerName: manager?.fullName || manager?.name,
    slug: project.slug || slugifyProject(project.title),
    description: project.description || `${project.title} enterprise workspace.`,
    teamSize: project.team,
    metadata: project.metadata || {}
  };
}

export function mapProjectInputToSupabase(input: Partial<ProjectInput>, ownerId?: string) {
  return {
    ...(ownerId ? { owner_id: ownerId } : {}),
    ...(input.organizationId !== undefined ? { organization_id: input.organizationId || null } : {}),
    ...(input.departmentId !== undefined ? { department_id: input.departmentId || null } : {}),
    ...(input.teamId !== undefined ? { team_id: input.teamId || null } : {}),
    ...(input.projectManagerId !== undefined ? { project_manager_id: input.projectManagerId || null } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.slug !== undefined ? { slug: input.slug || null } : {}),
    ...(input.description !== undefined ? { description: input.description || null } : {}),
    ...(input.type !== undefined ? { type: input.type || "document" } : {}),
    ...(input.status !== undefined ? { status: input.status || "draft" } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata || {} } : {})
  };
}

function toMemberStatus(status?: ProjectMemberStatus) {
  if (status === "Inactive") return "inactive";
  if (status === "Removed") return "removed";
  return "active";
}

function fromMemberStatus(status: string): ProjectMemberStatus {
  if (status === "inactive") return "Inactive";
  if (status === "removed") return "Removed";
  return "Active";
}

export function mapSupabaseProjectMemberToDomain(record: SupabaseProjectMemberRecord): ProjectMember {
  return {
    id: record.id,
    projectId: record.project_id,
    employeeId: record.employee_id,
    employeeName: record.employees ? `${record.employees.first_name} ${record.employees.last_name}`.trim() : undefined,
    role: record.role || record.employees?.job_title || undefined,
    status: fromMemberStatus(record.status),
    joinedAt: record.joined_at,
    createdAt: record.joined_at
  };
}

export function mapProjectMemberInputToSupabase(input: ProjectMemberInput) {
  return {
    project_id: input.projectId,
    employee_id: input.employeeId,
    role: input.role || null,
    status: toMemberStatus(input.status)
  };
}
