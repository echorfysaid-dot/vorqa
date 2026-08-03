import type { BudgetCategory, BudgetCategoryInput, BudgetItemStatus, BudgetPriority, ProjectBudgetItem, ProjectBudgetItemInput } from "@/lib/models";
import type { BudgetCategory as SupabaseBudgetCategory, Department as SupabaseDepartment, ProjectBudgetItem as SupabaseProjectBudgetItem } from "@/lib/supabase";

export type SupabaseBudgetItemRecord = SupabaseProjectBudgetItem & {
  budget_categories?: Pick<SupabaseBudgetCategory, "id" | "name" | "color"> | null;
  departments?: Pick<SupabaseDepartment, "id" | "name"> | null;
};

export const budgetItemStatuses: BudgetItemStatus[] = ["Planned", "Approved", "Committed", "Paid", "Over Budget"];
export const budgetPriorities: BudgetPriority[] = ["Low", "Medium", "High", "Critical"];

function toDomainStatus(status: string): BudgetItemStatus {
  if (status === "approved") return "Approved";
  if (status === "committed") return "Committed";
  if (status === "paid") return "Paid";
  if (status === "over_budget") return "Over Budget";
  if (status === "archived") return "Archived";
  return "Planned";
}

function toDatabaseStatus(status?: BudgetItemStatus) {
  if (status === "Approved") return "approved";
  if (status === "Committed") return "committed";
  if (status === "Paid") return "paid";
  if (status === "Over Budget") return "over_budget";
  if (status === "Archived") return "archived";
  return "planned";
}

function toDomainPriority(priority: string): BudgetPriority {
  if (priority === "low") return "Low";
  if (priority === "high") return "High";
  if (priority === "critical") return "Critical";
  return "Medium";
}

function toDatabasePriority(priority?: BudgetPriority) {
  if (priority === "Low") return "low";
  if (priority === "High") return "high";
  if (priority === "Critical") return "critical";
  return "medium";
}

export function mapSupabaseCategoryToDomain(record: SupabaseBudgetCategory): BudgetCategory {
  return {
    id: record.id,
    organizationId: record.organization_id,
    name: record.name,
    description: record.description || undefined,
    color: record.color || undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function mapCategoryInputToSupabase(input: Partial<BudgetCategoryInput>) {
  return {
    ...(input.organizationId !== undefined ? { organization_id: input.organizationId } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description || null } : {}),
    ...(input.color !== undefined ? { color: input.color || null } : {})
  };
}

export function mapSupabaseBudgetItemToDomain(record: SupabaseBudgetItemRecord): ProjectBudgetItem {
  return {
    id: record.id,
    projectId: record.project_id,
    organizationId: record.organization_id,
    categoryId: record.category_id || undefined,
    categoryName: record.budget_categories?.name,
    categoryColor: record.budget_categories?.color || undefined,
    departmentId: record.department_id || undefined,
    departmentName: record.departments?.name,
    title: record.title,
    description: record.description || undefined,
    plannedCost: Number(record.planned_cost || 0),
    actualCost: Number(record.actual_cost || 0),
    committedCost: Number(record.committed_cost || 0),
    status: toDomainStatus(record.status),
    priority: toDomainPriority(record.priority),
    startDate: record.start_date || undefined,
    endDate: record.end_date || undefined,
    metadata: record.metadata || {},
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function mapBudgetItemInputToSupabase(input: Partial<ProjectBudgetItemInput>) {
  return {
    ...(input.projectId !== undefined ? { project_id: input.projectId } : {}),
    ...(input.organizationId !== undefined ? { organization_id: input.organizationId } : {}),
    ...(input.categoryId !== undefined ? { category_id: input.categoryId || null } : {}),
    ...(input.departmentId !== undefined ? { department_id: input.departmentId || null } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description || null } : {}),
    ...(input.plannedCost !== undefined ? { planned_cost: Number(input.plannedCost || 0) } : {}),
    ...(input.actualCost !== undefined ? { actual_cost: Number(input.actualCost || 0) } : {}),
    ...(input.committedCost !== undefined ? { committed_cost: Number(input.committedCost || 0) } : {}),
    ...(input.status !== undefined ? { status: toDatabaseStatus(input.status) } : {}),
    ...(input.priority !== undefined ? { priority: toDatabasePriority(input.priority) } : {}),
    ...(input.startDate !== undefined ? { start_date: input.startDate || null } : {}),
    ...(input.endDate !== undefined ? { end_date: input.endDate || null } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata || {} } : {})
  };
}
