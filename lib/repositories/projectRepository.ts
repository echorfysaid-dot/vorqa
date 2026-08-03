import { notifications, projectDetails, projects, providerStatus, recentActivity, savedGenerations, workspaceStats } from "@/lib/data";
import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { Project, ProjectInput, ProjectMember, ProjectMemberInput } from "@/lib/models";
import { projectDemoAdapter } from "./projectDemoAdapter";
import { projectSupabaseAdapter } from "./projectSupabaseAdapter";

export type DemoProject = Project;
export type DemoProjectId = keyof typeof projectDetails;
export type ProjectRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
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

export const projectRepository = {
  list(): DemoProject[] {
    return [...projects];
  },

  async getProjects(): Promise<ProjectRepositoryResult<DemoProject[]>> {
    return withMode(() => projectDemoAdapter.getProjects(), () => projectSupabaseAdapter.getProjects());
  },

  getById(id: string): DemoProject | undefined {
    return projects.find((project) => project.id === id);
  },

  async getProject(id: string): Promise<ProjectRepositoryResult<DemoProject | undefined>> {
    return withMode(() => projectDemoAdapter.getProject(id), () => projectSupabaseAdapter.getProject(id));
  },

  async getProjectById(id: string): Promise<ProjectRepositoryResult<DemoProject | undefined>> {
    return this.getProject(id);
  },

  async getProjectsByOwner(_ownerId: string): Promise<ProjectRepositoryResult<DemoProject[]>> {
    return this.getProjects();
  },

  async createProject(input: ProjectInput): Promise<ProjectRepositoryResult<DemoProject | undefined>> {
    return withMode(() => projectDemoAdapter.createProject(input), () => projectSupabaseAdapter.createProject(input));
  },

  async updateProject(id: string, input: Partial<ProjectInput>): Promise<ProjectRepositoryResult<DemoProject | undefined>> {
    return withMode(() => projectDemoAdapter.updateProject(id, input), () => projectSupabaseAdapter.updateProject(id, input));
  },

  async archiveProject(id: string): Promise<ProjectRepositoryResult<boolean>> {
    return withMode(() => projectDemoAdapter.archiveProject(id), () => projectSupabaseAdapter.archiveProject(id));
  },

  async slugExists(organizationId: string, slug: string, excludeId?: string): Promise<ProjectRepositoryResult<boolean>> {
    const mode = getDataSourceMode();
    if (mode === "demo") return projectDemoAdapter.slugExists(organizationId, slug, excludeId);
    const result = await projectSupabaseAdapter.slugExists(organizationId, slug, excludeId);
    if (mode === "supabase") return result;
    if (!result.error) return result;
    return projectDemoAdapter.slugExists(organizationId, slug, excludeId);
  },

  async getProjectMembers(projectId: string): Promise<ProjectRepositoryResult<ProjectMember[]>> {
    return withMode(() => projectDemoAdapter.getProjectMembers(projectId), () => projectSupabaseAdapter.getProjectMembers(projectId));
  },

  async assignProjectMember(input: ProjectMemberInput): Promise<ProjectRepositoryResult<ProjectMember | undefined>> {
    return withMode(() => projectDemoAdapter.assignProjectMember(input), () => projectSupabaseAdapter.assignProjectMember(input));
  },

  async removeProjectMember(memberId: string): Promise<ProjectRepositoryResult<boolean>> {
    return withMode(() => projectDemoAdapter.removeProjectMember(memberId), () => projectSupabaseAdapter.removeProjectMember(memberId));
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
