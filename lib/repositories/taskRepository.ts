import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { Task, TaskInput, TaskStatus } from "@/lib/models";
import { taskDemoAdapter } from "./taskDemoAdapter";
import { taskSupabaseAdapter } from "./taskSupabaseAdapter";

export type TaskRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
  demo: () => Promise<TaskRepositoryResult<T>>,
  supabase: () => Promise<TaskRepositoryResult<T>>
): Promise<TaskRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

export const taskRepository = {
  async getTasks(projectId: string) {
    return withMode(() => taskDemoAdapter.getTasks(projectId), () => taskSupabaseAdapter.getTasks(projectId));
  },

  async getTask(taskId: string) {
    return withMode(() => taskDemoAdapter.getTask(taskId), () => taskSupabaseAdapter.getTask(taskId));
  },

  async createTask(input: TaskInput) {
    return withMode(() => taskDemoAdapter.createTask(input), () => taskSupabaseAdapter.createTask(input));
  },

  async updateTask(taskId: string, input: Partial<TaskInput>) {
    return withMode(() => taskDemoAdapter.updateTask(taskId, input), () => taskSupabaseAdapter.updateTask(taskId, input));
  },

  async archiveTask(taskId: string) {
    return withMode(() => taskDemoAdapter.archiveTask(taskId), () => taskSupabaseAdapter.archiveTask(taskId));
  },

  async moveTask(taskId: string, status: TaskStatus) {
    return withMode(
      () => taskDemoAdapter.updateTask(taskId, { status, progress: status === "Done" ? 100 : undefined }),
      () => taskSupabaseAdapter.moveTask(taskId, status)
    );
  },

  async updateTaskProgress(taskId: string, progress: number) {
    return withMode(
      () => taskDemoAdapter.updateTask(taskId, { progress: Math.max(0, Math.min(100, progress)) }),
      () => taskSupabaseAdapter.updateTaskProgress(taskId, progress)
    );
  },

  async assignTask(taskId: string, assigneeEmployeeId?: string) {
    return withMode(
      () => taskDemoAdapter.updateTask(taskId, { assigneeEmployeeId }),
      () => taskSupabaseAdapter.assignTask(taskId, assigneeEmployeeId)
    );
  },

  getProjectTaskStats(tasks: Task[]) {
    const activeTasks = tasks.filter((task) => task.status !== "Done");
    const overdueTasks = activeTasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date("2026-07-18T00:00:00.000Z"));
    const completed = tasks.filter((task) => task.status === "Done").length;
    return {
      total: tasks.length,
      completed,
      inProgress: tasks.filter((task) => task.status === "In Progress").length,
      blocked: tasks.filter((task) => task.status === "Blocked").length,
      overdue: overdueTasks.length,
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0
    };
  }
};
