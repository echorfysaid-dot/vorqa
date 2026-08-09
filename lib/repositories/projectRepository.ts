import { notifications, projectDetails, projects, providerStatus, recentActivity, savedGenerations, workspaceStats } from "@/lib/data";
import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { Project, ProjectInput, ProjectMember, ProjectMemberInput } from "@/lib/models";
import { projectDemoAdapter } from "./projectDemoAdapter";
import { projectSupabaseAdapter } from "./projectSupabaseAdapter";
import { isUuid } from "./organizationSupabaseRest";

export type DemoProject = Project;
export type DemoProjectId = keyof typeof projectDetails;
export type ProjectRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

export function shouldUseDemoForProjectWrite(mode = getDataSourceMode()) {
  return mode === "demo";
}

async function withReadMode<T>(
  demo: () => Promise<ProjectRepositoryResult<T>>,
  supabase: () => Promise<ProjectRepositoryResult<T>>
): Promise<ProjectRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

async function withWriteMode<T>(
  demo: () => Promise<ProjectRepositoryResult<T>>,
  supabase: () => Promise<ProjectRepositoryResult<T>>
): Promise<ProjectRepositoryResult<T>> {
  return shouldUseDemoForProjectWrite() ? demo() : supabase();
}

export const projectRepository = {
  list(): DemoProject[] {
    return [...projects];
  },

  async getProjects(): Promise<ProjectRepositoryResult<DemoProject[]>> {
    return withReadMode(() => projectDemoAdapter.getProjects(), () => projectSupabaseAdapter.getProjects());
  },

  getById(id: string): DemoProject | undefined {
    return projects.find((project) => project.id === id);
  },

  async getProject(id: string): Promise<ProjectRepositoryResult<DemoProject | undefined>> {
    const mode = getDataSourceMode();
    if (mode === "demo") return projectDemoAdapter.getProject(id);
    if (mode === "supabase" || isUuid(id)) return projectSupabaseAdapter.getProject(id);
    return withReadMode(() => projectDemoAdapter.getProject(id), () => projectSupabaseAdapter.getProject(id));
  },

  async getProjectById(id: string): Promise<ProjectRepositoryResult<DemoProject | undefined>> {
    return this.getProject(id);
  },

  async getProjectsByOwner(_ownerId: string): Promise<ProjectRepositoryResult<DemoProject[]>> {
    return this.getProjects();
  },

  async createProject(input: ProjectInput): Promise<ProjectRepositoryResult<DemoProject | undefined>> {
    return withWriteMode(() => projectDemoAdapter.createProject(input), () => projectSupabaseAdapter.createProject(input));
  },

  async updateProject(id: string, input: Partial<ProjectInput>): Promise<ProjectRepositoryResult<DemoProject | undefined>> {
    return withWriteMode(() => projectDemoAdapter.updateProject(id, input), () => projectSupabaseAdapter.updateProject(id, input));
  },

  async archiveProject(id: string): Promise<ProjectRepositoryResult<boolean>> {
    return withWriteMode(() => projectDemoAdapter.archiveProject(id), () => projectSupabaseAdapter.archiveProject(id));
  },

  async slugExists(organizationId: string, slug: string, excludeId?: string): Promise<ProjectRepositoryResult<boolean>> {
    const mode = getDataSourceMode();
    if (mode === "demo") return projectDemoAdapter.slugExists(organizationId, slug, excludeId);
    const result = await projectSupabaseAdapter.slugExists(organizationId, slug, excludeId);
    return result;
  },

  async getProjectMembers(projectId: string): Promise<ProjectRepositoryResult<ProjectMember[]>> {
    return withReadMode(() => projectDemoAdapter.getProjectMembers(projectId), () => projectSupabaseAdapter.getProjectMembers(projectId));
  },

  async assignProjectMember(input: ProjectMemberInput): Promise<ProjectRepositoryResult<ProjectMember | undefined>> {
    return withWriteMode(() => projectDemoAdapter.assignProjectMember(input), () => projectSupabaseAdapter.assignProjectMember(input));
  },

  async removeProjectMember(memberId: string): Promise<ProjectRepositoryResult<boolean>> {
    return withWriteMode(() => projectDemoAdapter.removeProjectMember(memberId), () => projectSupabaseAdapter.removeProjectMember(memberId));
  },

  async updateProjectManager(projectId: string, projectManagerId: string): Promise<ProjectRepositoryResult<DemoProject | undefined>> {
    return this.updateProject(projectId, { projectManagerId });
  },

  getDetails(id: string) {
    return projectDetails[id as DemoProjectId];
  },

  listWorkspaceStats() {
    return [...workspaceStats];
  },

  listRecentActivity() {
    return [...recentActivity];
  },

  listSavedGenerations() {
    return [...savedGenerations];
  },

  listNotifications() {
    return [...notifications];
  },

  listProviderStatus() {
    return [...providerStatus];
  }
};
