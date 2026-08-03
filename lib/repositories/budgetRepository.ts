import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { BudgetCategoryInput, ProjectBudget, ProjectBudgetItemInput } from "@/lib/models";
import { budgetDemoAdapter } from "./budgetDemoAdapter";
import { budgetSupabaseAdapter } from "./budgetSupabaseAdapter";

export type BudgetRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
  demo: () => Promise<BudgetRepositoryResult<T>>,
  supabase: () => Promise<BudgetRepositoryResult<T>>
): Promise<BudgetRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

export const budgetRepository = {
  async getBudget(projectId: string) {
    return withMode(() => budgetDemoAdapter.getBudget(projectId), () => budgetSupabaseAdapter.getBudget(projectId));
  },

  async getCategories(organizationId: string) {
    return withMode(() => budgetDemoAdapter.getCategories(organizationId), () => budgetSupabaseAdapter.getCategories(organizationId));
  },

  async createCategory(input: BudgetCategoryInput) {
    return withMode(() => budgetDemoAdapter.createCategory(input), () => budgetSupabaseAdapter.createCategory(input));
  },

  async updateCategory(categoryId: string, input: Partial<BudgetCategoryInput>) {
    return withMode(() => budgetDemoAdapter.updateCategory(categoryId, input), () => budgetSupabaseAdapter.updateCategory(categoryId, input));
  },

  async archiveCategory(categoryId: string) {
    return withMode(() => budgetDemoAdapter.archiveCategory(categoryId), () => budgetSupabaseAdapter.archiveCategory(categoryId));
  },

  async createBudgetItem(input: ProjectBudgetItemInput) {
    return withMode(() => budgetDemoAdapter.createBudgetItem(input), () => budgetSupabaseAdapter.createBudgetItem(input));
  },

  async updateBudgetItem(itemId: string, input: Partial<ProjectBudgetItemInput>) {
    return withMode(() => budgetDemoAdapter.updateBudgetItem(itemId, input), () => budgetSupabaseAdapter.updateBudgetItem(itemId, input));
  },

  async archiveBudgetItem(itemId: string) {
    return withMode(() => budgetDemoAdapter.archiveBudgetItem(itemId), () => budgetSupabaseAdapter.archiveBudgetItem(itemId));
  },

  getBudgetStats(budget: ProjectBudget) {
    const planned = budget.items.reduce((sum, item) => sum + item.plannedCost, 0);
    const actual = budget.items.reduce((sum, item) => sum + item.actualCost, 0);
    const committed = budget.items.reduce((sum, item) => sum + item.committedCost, 0);
    const remaining = Math.max(0, planned - actual - committed);
    const progress = planned ? Math.round(((actual + committed) / planned) * 100) : 0;
    const overBudget = budget.items.filter((item) => item.actualCost + item.committedCost > item.plannedCost).length;
    const topCategories = budget.categories
      .map((category) => ({
        category,
        total: budget.items.filter((item) => item.categoryId === category.id).reduce((sum, item) => sum + item.actualCost + item.committedCost, 0)
      }))
      .sort((a, b) => b.total - a.total);
    return { planned, actual, committed, remaining, progress, overBudget, forecast: actual + committed, topCategories };
  }
};
