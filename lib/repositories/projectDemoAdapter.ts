import { projects } from "@/lib/data";
import type { Project, ProjectInput, ProjectMember, ProjectMemberInput } from "@/lib/models";
import { departmentDemoAdapter } from "./departmentDemoAdapter";
import { employeeDemoAdapter } from "./employeeDemoAdapter";
import { organizationDemoAdapter } from "./organizationDemoAdapter";
import { mapDemoProjectToDomain, slugifyProject } from "./projectMapper";

const storageKey = "vorqa-demo-projects";
let sessionProjects: Project[] = [];

function readStoredProjects() {
  if (typeof window === "undefined") return sessionProjects;
  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? JSON.parse(value) as Project[] : [];
  } catch {
    return sessionProjects;
  }
}

function writeStoredProjects(items: Project[]) {
  sessionProjects = items;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  } catch {
    // Demo persistence remains available for the current session when storage is blocked.
  }
}

async function demoProjects(): Promise<Project[]> {
  const organizations = organizationDemoAdapter.getOrganizations().data;
  const departments = (await departmentDemoAdapter.getDepartments("atlas")).data;
  const employees = (await employeeDemoAdapter.getEmployees("atlas")).data;
  const seeded = projects.map((project) => mapDemoProjectToDomain(project, organizations, departments, employees));
  const stored = readStoredProjects();
  return [...stored, ...seeded.filter((project) => !stored.some((item) => item.id === project.id))];
}

export const projectDemoAdapter = {
  async getProjects() {
    return { data: await demoProjects(), source: "demo" as const, isFallback: false };
  },

  async getProject(id: string) {
    const project = (await demoProjects()).find((item) => item.id === id || item.slug === id);
    return { data: project, source: "demo" as const, isFallback: false };
  },

  async slugExists(organizationId: string, slug: string, excludeId?: string) {
    const items = await demoProjects();
    return {
      data: items.some((project) => project.organizationId === organizationId && project.id !== excludeId && project.slug === slug),
      source: "demo" as const,
      isFallback: false
    };
  },

  async createProject(input: ProjectInput) {
    const now = new Date().toISOString();
    const project: Project = {
      id: `PRJ-${Date.now()}`,
      organizationId: input.organizationId || "atlas",
      departmentId: input.departmentId,
      projectManagerId: input.projectManagerId,
      slug: input.slug || slugifyProject(input.title),
      title: input.title,
      description: input.description,
      type: input.type || "Project",
      status: input.status || "Planning",
      updatedAt: now,
      score: 0,
      budget: "Not set",
      timeline: "Not scheduled",
      team: 0,
      teamSize: 0,
      documents: 0,
      knowledgeFiles: 0,
      phase: input.status || "Planning",
      metadata: input.metadata || {},
      createdAt: now
    };
    writeStoredProjects([project, ...readStoredProjects()]);
    return { data: project, source: "demo" as const, isFallback: false };
  },

  async updateProject(id: string, input: Partial<ProjectInput>) {
    const project = (await demoProjects()).find((item) => item.id === id || item.slug === id);
    if (!project) return { data: undefined, source: "demo" as const, isFallback: false, error: "Project not found in demo data." };
    const updated = { ...project, ...input, updatedAt: new Date().toISOString() };
    const stored = readStoredProjects();
    writeStoredProjects(stored.some((item) => item.id === project.id)
      ? stored.map((item) => item.id === project.id ? updated : item)
      : [updated, ...stored]);
    return {
      data: updated,
      source: "demo" as const,
      isFallback: false
    };
  },

  async archiveProject(id: string) {
    const project = (await demoProjects()).find((item) => item.id === id || item.slug === id);
    if (project) {
      const stored = readStoredProjects();
      const archived = { ...project, status: "Archived", updatedAt: new Date().toISOString() };
      writeStoredProjects(stored.some((item) => item.id === project.id)
        ? stored.map((item) => item.id === project.id ? archived : item)
        : [archived, ...stored]);
    }
    return {
      data: Boolean(project),
      source: "demo" as const,
      isFallback: false,
      error: project ? undefined : "Project not found in demo data."
    };
  },

  async getProjectMembers(projectId: string) {
    const employees = (await employeeDemoAdapter.getEmployees("atlas")).data;
    const members: ProjectMember[] = employees.slice(0, 4).map((employee) => ({
      id: `${projectId}-${employee.id}`,
      projectId,
      employeeId: employee.id,
      employeeName: employee.fullName || employee.name,
      role: employee.jobTitle || String(employee.role),
      status: "Active",
      joinedAt: "2026-01-15T09:00:00.000Z",
      createdAt: "2026-01-15T09:00:00.000Z"
    }));
    return { data: members, source: "demo" as const, isFallback: false };
  },

  async assignProjectMember(input: ProjectMemberInput) {
    const member: ProjectMember = {
      id: `${input.projectId}-${input.employeeId}`,
      projectId: input.projectId,
      employeeId: input.employeeId,
      role: input.role,
      status: input.status || "Active",
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    return { data: member, source: "demo" as const, isFallback: false };
  },

  async removeProjectMember(memberId: string) {
    return { data: Boolean(memberId), source: "demo" as const, isFallback: false };
  },

  resetStoredProjects() {
    writeStoredProjects([]);
    if (typeof window !== "undefined") window.localStorage.removeItem(storageKey);
  }
};
