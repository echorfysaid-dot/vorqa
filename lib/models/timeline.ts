import type { EntityId, OwnedEntity, Timestamped } from "./common";

export type MilestoneStatus = "Planned" | "In Progress" | "Completed" | "Delayed" | "Archived";
export type DependencyType = "Finish-to-Start" | "Start-to-Start" | "Finish-to-Finish" | "Start-to-Finish";

export interface TimelineMilestone extends Timestamped, OwnedEntity {
  id: EntityId;
  projectId: EntityId;
  title: string;
  description?: string;
  status: MilestoneStatus;
  progress: number;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export type TimelineMilestoneInput = {
  projectId: EntityId;
  organizationId: EntityId;
  title: string;
  description?: string;
  status?: MilestoneStatus;
  progress?: number;
  startDate?: string;
  dueDate?: string;
  metadata?: Record<string, unknown>;
};

export interface TaskDependency extends Timestamped {
  id: EntityId;
  predecessorTaskId: EntityId;
  successorTaskId: EntityId;
  dependencyType: DependencyType;
  predecessorTitle?: string;
  successorTitle?: string;
}

export type TaskDependencyInput = {
  predecessorTaskId: EntityId;
  successorTaskId: EntityId;
  dependencyType: DependencyType;
};

export interface ProjectTimeline {
  projectId: EntityId;
  milestones: TimelineMilestone[];
  dependencies: TaskDependency[];
}
