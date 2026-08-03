import type { CurrencyCode, EntityId, OwnedEntity, Timestamped } from "./common";

export type BudgetStatus = "Healthy" | "Watch" | "Over budget" | "Closed";
export type BudgetItemStatus = "Planned" | "Approved" | "Committed" | "Paid" | "Over Budget" | "Archived";
export type BudgetPriority = "Low" | "Medium" | "High" | "Critical";

export interface BudgetSummary extends Timestamped, OwnedEntity {
  id: EntityId;
  projectId: EntityId;
  plannedAmount: number;
  actualAmount: number;
  remainingAmount: number;
  currency: CurrencyCode;
  progress: number;
  status: BudgetStatus;
}

export interface Expense extends Timestamped, OwnedEntity {
  id: EntityId;
  projectId: EntityId;
  category: string;
  amount: number;
  currency: CurrencyCode;
  vendor?: string;
  status?: string;
}

export interface BudgetCategory extends Timestamped, OwnedEntity {
  id: EntityId;
  organizationId: EntityId;
  name: string;
  description?: string;
  color?: string;
}

export type BudgetCategoryInput = {
  organizationId: EntityId;
  name: string;
  description?: string;
  color?: string;
};

export interface ProjectBudgetItem extends Timestamped, OwnedEntity {
  id: EntityId;
  projectId: EntityId;
  organizationId: EntityId;
  categoryId?: EntityId;
  categoryName?: string;
  categoryColor?: string;
  departmentId?: EntityId;
  departmentName?: string;
  title: string;
  description?: string;
  plannedCost: number;
  actualCost: number;
  committedCost: number;
  status: BudgetItemStatus;
  priority: BudgetPriority;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
}

export type ProjectBudgetItemInput = {
  projectId: EntityId;
  organizationId: EntityId;
  categoryId?: EntityId;
  departmentId?: EntityId;
  title: string;
  description?: string;
  plannedCost?: number;
  actualCost?: number;
  committedCost?: number;
  status?: BudgetItemStatus;
  priority?: BudgetPriority;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
};

export interface ProjectBudget {
  projectId: EntityId;
  categories: BudgetCategory[];
  items: ProjectBudgetItem[];
}
