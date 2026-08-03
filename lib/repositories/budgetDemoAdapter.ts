import type { BudgetCategory, BudgetCategoryInput, ProjectBudget, ProjectBudgetItem, ProjectBudgetItemInput } from "@/lib/models";
import { departmentDemoAdapter } from "./departmentDemoAdapter";

const categoryTemplates = [
  ["Site preparation", "Land clearance, mobilization, and temporary works.", "#D4AF37"],
  ["Excavation", "Earthworks and excavation operations.", "#4F8CFF"],
  ["Concrete", "Concrete supply, pouring, and curing.", "#16C784"],
  ["Steel", "Reinforcement and structural steel.", "#FFB020"],
  ["Electrical", "Electrical rough-in and fixtures.", "#51D8FF"],
  ["Plumbing", "Water supply and drainage systems.", "#9D7CFF"],
  ["HVAC", "Heating, ventilation, and air conditioning.", "#F97316"],
  ["Finishes", "Interior and exterior finishing works.", "#F2D487"],
  ["Inspection", "QA, testing, and regulatory inspection.", "#22C783"],
  ["Contingency", "Reserved budget for risk and variations.", "#EF5B5B"]
] as const;

async function makeCategories(organizationId = "atlas"): Promise<BudgetCategory[]> {
  return categoryTemplates.map(([name, description, color], index) => ({
    id: `${organizationId}-budget-category-${index + 1}`,
    organizationId,
    name,
    description,
    color,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-18T09:00:00.000Z"
  }));
}

async function makeItems(projectId: string): Promise<ProjectBudgetItem[]> {
  const organizationId = "atlas";
  const categories = await makeCategories(organizationId);
  const departments = (await departmentDemoAdapter.getDepartments(organizationId)).data;
  const statuses = ["Approved", "Committed", "Planned", "Paid", "Over Budget"] as const;
  const priorities = ["Medium", "High", "Critical", "Low"] as const;
  return categories.map((category, index) => {
    const plannedCost = [65000, 95000, 280000, 210000, 120000, 98000, 84000, 180000, 32000, 90000][index];
    const actualCost = Math.round(plannedCost * [0.2, 0.45, 0.62, 0.38, 0.18, 0.14, 0.08, 0.05, 0.5, 0][index]);
    const committedCost = Math.round(plannedCost * [0.3, 0.6, 0.7, 0.48, 0.26, 0.22, 0.12, 0.1, 0.65, 0][index]);
    const department = departments[index % departments.length];
    return {
      id: `${projectId}-budget-item-${index + 1}`,
      projectId,
      organizationId,
      categoryId: category.id,
      categoryName: category.name,
      categoryColor: category.color,
      departmentId: department?.id,
      departmentName: department?.name,
      title: category.name,
      description: category.description,
      plannedCost,
      actualCost,
      committedCost,
      status: statuses[index % statuses.length],
      priority: priorities[index % priorities.length],
      startDate: `2026-07-${String(index + 1).padStart(2, "0")}`,
      endDate: index > 5 ? `2026-08-${String((index - 5) * 4).padStart(2, "0")}` : `2026-07-${String(index + 8).padStart(2, "0")}`,
      metadata: {},
      createdAt: "2026-07-01T09:00:00.000Z",
      updatedAt: "2026-07-18T09:00:00.000Z"
    };
  });
}

export const budgetDemoAdapter = {
  async getBudget(projectId: string) {
    const data: ProjectBudget = {
      projectId,
      categories: await makeCategories(),
      items: await makeItems(projectId)
    };
    return { data, source: "demo" as const, isFallback: false };
  },

  async getCategories(organizationId: string) {
    return { data: await makeCategories(organizationId), source: "demo" as const, isFallback: false };
  },

  async createCategory(input: BudgetCategoryInput) {
    const category: BudgetCategory = {
      id: `${input.organizationId}-budget-category-preview-${Date.now()}`,
      organizationId: input.organizationId,
      name: input.name,
      description: input.description,
      color: input.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { data: category, source: "demo" as const, isFallback: false };
  },

  async updateCategory(categoryId: string, input: Partial<BudgetCategoryInput>) {
    const category = (await makeCategories(input.organizationId || "atlas")).find((item) => item.id === categoryId);
    if (!category) return { data: undefined as BudgetCategory | undefined, source: "demo" as const, isFallback: false, error: "Budget category not found in demo data." };
    return { data: { ...category, ...input, updatedAt: new Date().toISOString() }, source: "demo" as const, isFallback: false };
  },

  async archiveCategory(categoryId: string) {
    return { data: Boolean(categoryId), source: "demo" as const, isFallback: false };
  },

  async createBudgetItem(input: ProjectBudgetItemInput) {
    const item: ProjectBudgetItem = {
      id: `${input.projectId}-budget-item-preview-${Date.now()}`,
      projectId: input.projectId,
      organizationId: input.organizationId,
      categoryId: input.categoryId,
      departmentId: input.departmentId,
      title: input.title,
      description: input.description,
      plannedCost: input.plannedCost || 0,
      actualCost: input.actualCost || 0,
      committedCost: input.committedCost || 0,
      status: input.status || "Planned",
      priority: input.priority || "Medium",
      startDate: input.startDate,
      endDate: input.endDate,
      metadata: input.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { data: item, source: "demo" as const, isFallback: false };
  },

  async updateBudgetItem(itemId: string, input: Partial<ProjectBudgetItemInput>) {
    const projectId = input.projectId || itemId.split("-budget-item-")[0] || "PRJ-1048";
    const item = (await makeItems(projectId)).find((entry) => entry.id === itemId);
    if (!item) return { data: undefined as ProjectBudgetItem | undefined, source: "demo" as const, isFallback: false, error: "Budget item not found in demo data." };
    return { data: { ...item, ...input, updatedAt: new Date().toISOString() }, source: "demo" as const, isFallback: false };
  },

  async archiveBudgetItem(itemId: string) {
    return { data: Boolean(itemId), source: "demo" as const, isFallback: false };
  }
};
