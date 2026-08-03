import type { EntityId, OwnedEntity, Timestamped } from "./common";

export type DepartmentStatus = "Active" | "Suspended" | "Archived" | "Excellent" | "Healthy" | "Watch" | "At risk";

export interface Department extends Timestamped, OwnedEntity {
  id: EntityId;
  organizationId?: EntityId;
  name: string;
  slug?: string;
  description?: string;
  lead?: string;
  leadUserId?: EntityId;
  leadName?: string;
  employees?: number;
  memberCount?: number;
  activeProjects?: number;
  activeProjectCount?: number;
  workload?: number;
  status: DepartmentStatus | string;
  priorities?: string[];
  recentActivity?: string[];
  metadata?: Record<string, unknown>;
}

export type DepartmentInput = {
  organizationId: EntityId;
  name: string;
  slug: string;
  description?: string;
  leadUserId?: EntityId;
  status?: DepartmentStatus;
  metadata?: Record<string, unknown>;
};
