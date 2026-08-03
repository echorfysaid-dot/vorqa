import type { DependencyType, TaskDependency, TaskDependencyInput, TimelineMilestone, TimelineMilestoneInput, MilestoneStatus } from "@/lib/models";
import type { Milestone as SupabaseMilestone, Task as SupabaseTask, TaskDependency as SupabaseTaskDependency } from "@/lib/supabase";

export type SupabaseMilestoneRecord = SupabaseMilestone;
export type SupabaseTaskDependencyRecord = SupabaseTaskDependency & {
  predecessor?: Pick<SupabaseTask, "id" | "title"> | null;
  successor?: Pick<SupabaseTask, "id" | "title"> | null;
};

export const milestoneStatuses: MilestoneStatus[] = ["Planned", "In Progress", "Completed", "Delayed"];
export const dependencyTypes: DependencyType[] = ["Finish-to-Start", "Start-to-Start", "Finish-to-Finish", "Start-to-Finish"];

function toDomainMilestoneStatus(status: string): MilestoneStatus {
  if (status === "in_progress") return "In Progress";
  if (status === "completed") return "Completed";
  if (status === "delayed") return "Delayed";
  if (status === "archived") return "Archived";
  return "Planned";
}

function toDatabaseMilestoneStatus(status?: MilestoneStatus) {
  if (status === "In Progress") return "in_progress";
  if (status === "Completed") return "completed";
  if (status === "Delayed") return "delayed";
  if (status === "Archived") return "archived";
  return "planned";
}

function toDomainDependencyType(type: string): DependencyType {
  if (type === "start_to_start") return "Start-to-Start";
  if (type === "finish_to_finish") return "Finish-to-Finish";
  if (type === "start_to_finish") return "Start-to-Finish";
  return "Finish-to-Start";
}

function toDatabaseDependencyType(type?: DependencyType) {
  if (type === "Start-to-Start") return "start_to_start";
  if (type === "Finish-to-Finish") return "finish_to_finish";
  if (type === "Start-to-Finish") return "start_to_finish";
  return "finish_to_start";
}

export function mapSupabaseMilestoneToDomain(record: SupabaseMilestoneRecord): TimelineMilestone {
  return {
    id: record.id,
    projectId: record.project_id,
    organizationId: record.organization_id,
    title: record.title,
    description: record.description || undefined,
    status: toDomainMilestoneStatus(record.status),
    progress: record.progress,
    startDate: record.start_date || undefined,
    dueDate: record.due_date || undefined,
    completedAt: record.completed_at || undefined,
    metadata: record.metadata || {},
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function mapMilestoneInputToSupabase(input: Partial<TimelineMilestoneInput>) {
  return {
    ...(input.projectId !== undefined ? { project_id: input.projectId } : {}),
    ...(input.organizationId !== undefined ? { organization_id: input.organizationId } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description || null } : {}),
    ...(input.status !== undefined ? { status: toDatabaseMilestoneStatus(input.status) } : {}),
    ...(input.progress !== undefined ? { progress: Math.max(0, Math.min(100, input.progress || 0)) } : {}),
    ...(input.startDate !== undefined ? { start_date: input.startDate || null } : {}),
    ...(input.dueDate !== undefined ? { due_date: input.dueDate || null } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata || {} } : {})
  };
}

export function mapSupabaseDependencyToDomain(record: SupabaseTaskDependencyRecord): TaskDependency {
  return {
    id: record.id,
    predecessorTaskId: record.predecessor_task_id,
    successorTaskId: record.successor_task_id,
    dependencyType: toDomainDependencyType(record.dependency_type),
    predecessorTitle: record.predecessor?.title,
    successorTitle: record.successor?.title,
    createdAt: record.created_at
  };
}

export function mapDependencyInputToSupabase(input: TaskDependencyInput) {
  return {
    predecessor_task_id: input.predecessorTaskId,
    successor_task_id: input.successorTaskId,
    dependency_type: toDatabaseDependencyType(input.dependencyType)
  };
}

export function makeDemoMilestone(input: {
  projectId: string;
  organizationId: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  progress: number;
  index: number;
}): TimelineMilestone {
  const startDay = String(1 + input.index * 5).padStart(2, "0");
  const dueDay = String(5 + input.index * 5).padStart(2, "0");
  return {
    id: `${input.projectId}-milestone-${input.index + 1}`,
    projectId: input.projectId,
    organizationId: input.organizationId,
    title: input.title,
    description: input.description,
    status: input.status,
    progress: input.progress,
    startDate: `2026-07-${startDay}`,
    dueDate: input.index > 5 ? `2026-08-${String((input.index - 5) * 5).padStart(2, "0")}` : `2026-07-${dueDay}`,
    completedAt: input.status === "Completed" ? `2026-07-${dueDay}T10:00:00.000Z` : undefined,
    metadata: {},
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-18T09:00:00.000Z"
  };
}
