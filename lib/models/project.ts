import type { EntityId, OwnedEntity, Timestamped } from "./common";

export type ProjectStatus = "Planning" | "Design Review" | "Procurement" | "Execution" | "Completed" | "On Hold" | "At Risk";
export type ProjectPhase = "Planning" | "Design" | "Procurement" | "Execution" | "Finishing" | "Handover";
export type ProjectMemberStatus = "Active" | "Inactive" | "Removed";

export interface Project extends Timestamped, OwnedEntity {
  id: EntityId;
  organizationId?: EntityId;
  organizationName?: string;
  departmentId?: EntityId;
  departmentName?: string;
  teamId?: EntityId;
  teamName?: string;
  projectManagerId?: EntityId;
  projectManagerName?: string;
  slug?: string;
  title: string;
  description?: string;
  type: string;
  status: ProjectStatus | string;
  updatedAt: string;
  score: number;
  budget: string;
  timeline: string;
  team: number;
  documents: number;
  knowledgeFiles: number;
  phase: string;
  location?: string;
  teamSize?: number;
  metadata?: Record<string, unknown>;
}

export interface ProjectMember extends Timestamped {
  id: EntityId;
  projectId: EntityId;
  employeeId: EntityId;
  employeeName?: string;
  role?: string;
  status: ProjectMemberStatus;
  joinedAt: string;
}

export type ProjectInput = {
  organizationId?: EntityId;
  departmentId?: EntityId;
  teamId?: EntityId;
  projectManagerId?: EntityId;
  title: string;
  slug?: string;
  description?: string;
  type?: string;
  status?: string;
  metadata?: Record<string, unknown>;
};

export type ProjectMemberInput = {
  projectId: EntityId;
  employeeId: EntityId;
  role?: string;
  status?: ProjectMemberStatus;
};

export interface ProjectDetails {
  location: string;
  budgetPlanned: string;
  actualCost: string;
  remainingBudget: string;
  budgetHealth: number;
  timelineHealth: number;
  documents: string[];
  knowledgeFiles: string[];
  reports: string[];
  aiHistory: string[];
  tasks: string[];
  milestones: string[];
  team: unknown[];
}
