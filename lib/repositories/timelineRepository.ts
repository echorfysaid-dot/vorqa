import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { ProjectTimeline, TaskDependencyInput, TimelineMilestoneInput } from "@/lib/models";
import { timelineDemoAdapter } from "./timelineDemoAdapter";
import { timelineSupabaseAdapter } from "./timelineSupabaseAdapter";

export type TimelineRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
  demo: () => Promise<TimelineRepositoryResult<T>>,
  supabase: () => Promise<TimelineRepositoryResult<T>>
): Promise<TimelineRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

export const timelineRepository = {
  async getTimeline(projectId: string) {
    return withMode(() => timelineDemoAdapter.getTimeline(projectId), () => timelineSupabaseAdapter.getTimeline(projectId));
  },

  async getMilestones(projectId: string) {
    return withMode(() => timelineDemoAdapter.getMilestones(projectId), () => timelineSupabaseAdapter.getMilestones(projectId));
  },

  async createMilestone(input: TimelineMilestoneInput) {
    return withMode(() => timelineDemoAdapter.createMilestone(input), () => timelineSupabaseAdapter.createMilestone(input));
  },

  async updateMilestone(milestoneId: string, input: Partial<TimelineMilestoneInput>) {
    return withMode(() => timelineDemoAdapter.updateMilestone(milestoneId, input), () => timelineSupabaseAdapter.updateMilestone(milestoneId, input));
  },

  async archiveMilestone(milestoneId: string) {
    return withMode(() => timelineDemoAdapter.archiveMilestone(milestoneId), () => timelineSupabaseAdapter.archiveMilestone(milestoneId));
  },

  async getDependencies(projectId: string) {
    return withMode(() => timelineDemoAdapter.getDependencies(projectId), () => timelineSupabaseAdapter.getDependencies(projectId));
  },

  async createDependency(input: TaskDependencyInput) {
    return withMode(() => timelineDemoAdapter.createDependency(input), () => timelineSupabaseAdapter.createDependency(input));
  },

  async removeDependency(dependencyId: string) {
    return withMode(() => timelineDemoAdapter.removeDependency(dependencyId), () => timelineSupabaseAdapter.removeDependency(dependencyId));
  },

  getTimelineStats(timeline: ProjectTimeline) {
    const today = new Date("2026-07-18T00:00:00.000Z");
    const activeMilestones = timeline.milestones.filter((milestone) => milestone.status !== "Archived");
    const completed = activeMilestones.filter((milestone) => milestone.status === "Completed").length;
    const overdue = activeMilestones.filter((milestone) => milestone.dueDate && new Date(milestone.dueDate) < today && milestone.status !== "Completed").length;
    const upcoming = activeMilestones.filter((milestone) => milestone.dueDate && new Date(milestone.dueDate) >= today && milestone.status !== "Completed").length;
    return {
      total: activeMilestones.length,
      completed,
      upcoming,
      overdue,
      completionRate: activeMilestones.length ? Math.round((completed / activeMilestones.length) * 100) : 0
    };
  }
};
