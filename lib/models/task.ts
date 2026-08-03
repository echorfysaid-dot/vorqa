import type { EntityId, OwnedEntity, Timestamped } from "./common";

export type TaskStatus = "Todo" | "In Progress" | "Review" | "Blocked" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export interface Task extends Timestamped, OwnedEntity {
  id: EntityId;
  projectId: EntityId;
  organizationId?: EntityId;
  departmentId?: EntityId;
  departmentName?: string;
  assigneeEmployeeId?: EntityId;
  assigneeName?: string;
  parentTaskId?: EntityId;
  title: string;
  slug?: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: EntityId;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  progress?: number;
  metadata?: Record<string, unknown>;
}

export type TaskInput = {
  projectId: EntityId;
  organizationId: EntityId;
  departmentId?: EntityId;
  assigneeEmployeeId?: EntityId;
  parentTaskId?: EntityId;
  title: string;
  slug?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  startDate?: string;
  dueDate?: string;
  metadata?: Record<string, unknown>;
};
