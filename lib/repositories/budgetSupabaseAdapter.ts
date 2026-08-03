import type { BudgetCategory, BudgetCategoryInput, ProjectBudget, ProjectBudgetItem, ProjectBudgetItemInput } from "@/lib/models";
import type { BudgetCategory as SupabaseBudgetCategory } from "@/lib/supabase";
import { departmentSupabaseAdapter } from "./departmentSupabaseAdapter";
import { organizationSupabaseAdapter } from "./organizationSupabaseAdapter";
import { isUuid, organizationRest } from "./organizationSupabaseRest";
import { projectSupabaseAdapter } from "./projectSupabaseAdapter";
import { mapBudgetItemInputToSupabase, mapCategoryInputToSupabase, mapSupabaseBudgetItemToDomain, mapSupabaseCategoryToDomain, type SupabaseBudgetItemRecord } from "./budgetMapper";

async function resolveOrganizationId(organizationId?: string) {
  if (!organizationId) return undefined;
  if (isUuid(organizationId)) return organizationId;
  const organization = await organizationSupabaseAdapter.getOrganization(organizationId);
  return organization.data?.id;
}

async function validateItemScope(input: Partial<ProjectBudgetItemInput>) {
  const project = input.projectId ? await projectSupabaseAdapter.getProject(input.projectId) : undefined;
  if (input.projectId && !project?.data) return { error: "Project not found." };
  const organizationId = await resolveOrganizationId(input.organizationId || project?.data?.organizationId);
  if (!organizationId) return { error: "Organization not found." };
  if (project?.data?.organizationId && isUuid(project.data.organizationId) && project.data.organizationId !== organizationId) {
    return { error: "Project does not belong to this organization." };
  }
  if (input.departmentId) {
    const department = await departmentSupabaseAdapter.getDepartmentById(organizationId, input.departmentId);
    if (!department.data) return { error: "Department does not belong to this organization." };
  }
  if (input.categoryId) {
    const category = await organizationRest<Array<{ id: string }>>(`/budget_categories?organization_id=eq.${encodeURIComponent(organizationId)}&id=eq.${encodeURIComponent(input.categoryId)}&select=id&limit=1`);
    if (category.error) return { error: category.error };
    if (!category.data?.[0]) return { error: "Budget category does not belong to this organization." };
  }
  return { organizationId };
}

const itemSelect = "*,budget_categories(id,name,color),departments(id,name)";

export const budgetSupabaseAdapter = {
  async getBudget(projectId: string) {
    const project = await projectSupabaseAdapter.getProject(projectId);
    const organizationId = project.data?.organizationId;
    const categories = organizationId ? await this.getCategories(organizationId) : { data: [] as BudgetCategory[], error: project.error || "Organization not found." };
    const result = await organizationRest<SupabaseBudgetItemRecord[]>(
      `/project_budget_items?project_id=eq.${encodeURIComponent(projectId)}&status=neq.archived&select=${encodeURIComponent(itemSelect)}&order=created_at.asc`
    );
    const items = result.error ? [] : (result.data || []).map(mapSupabaseBudgetItemToDomain);
    const data: ProjectBudget = { projectId, categories: categories.data, items };
    return { data, source: "supabase" as const, isFallback: false, error: result.error || categories.error };
  },

  async getCategories(organizationId: string) {
    const resolvedId = await resolveOrganizationId(organizationId);
    if (!resolvedId) return { data: [] as BudgetCategory[], source: "supabase" as const, isFallback: false, error: "Organization not found." };
    const result = await organizationRest<SupabaseBudgetCategory[]>(
      `/budget_categories?organization_id=eq.${encodeURIComponent(resolvedId)}&select=*&order=name.asc`
    );
    if (result.error) return { data: [] as BudgetCategory[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseCategoryToDomain), source: "supabase" as const, isFallback: false };
  },

  async createCategory(input: BudgetCategoryInput) {
    const organizationId = await resolveOrganizationId(input.organizationId);
    if (!organizationId) return { data: undefined as BudgetCategory | undefined, source: "supabase" as const, isFallback: false, error: "Organization not found." };
    const result = await organizationRest<SupabaseBudgetCategory[]>("/budget_categories", {
      method: "POST",
      body: JSON.stringify(mapCategoryInputToSupabase({ ...input, organizationId }))
    });
    if (result.error) return { data: undefined as BudgetCategory | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseCategoryToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateCategory(categoryId: string, input: Partial<BudgetCategoryInput>) {
    const result = await organizationRest<SupabaseBudgetCategory[]>(`/budget_categories?id=eq.${encodeURIComponent(categoryId)}`, {
      method: "PATCH",
      body: JSON.stringify(mapCategoryInputToSupabase(input))
    });
    if (result.error) return { data: undefined as BudgetCategory | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseCategoryToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async archiveCategory(categoryId: string) {
    const result = await organizationRest<SupabaseBudgetCategory[]>(`/budget_categories?id=eq.${encodeURIComponent(categoryId)}`, { method: "DELETE" });
    if (result.error) return { data: false, source: "supabase" as const, isFallback: false, error: result.error };
    return { data: true, source: "supabase" as const, isFallback: false };
  },

  async createBudgetItem(input: ProjectBudgetItemInput) {
    const scope = await validateItemScope(input);
    if (scope.error) return { data: undefined as ProjectBudgetItem | undefined, source: "supabase" as const, isFallback: false, error: scope.error };
    const result = await organizationRest<SupabaseBudgetItemRecord[]>("/project_budget_items", {
      method: "POST",
      body: JSON.stringify(mapBudgetItemInputToSupabase({ ...input, organizationId: scope.organizationId }))
    });
    if (result.error) return { data: undefined as ProjectBudgetItem | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseBudgetItemToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateBudgetItem(itemId: string, input: Partial<ProjectBudgetItemInput>) {
    const scope = input.projectId || input.organizationId || input.departmentId || input.categoryId ? await validateItemScope(input) : {};
    if ("error" in scope && typeof scope.error === "string") return { data: undefined as ProjectBudgetItem | undefined, source: "supabase" as const, isFallback: false, error: scope.error };
    const organizationId = "organizationId" in scope && typeof scope.organizationId === "string" ? scope.organizationId : input.organizationId;
    const result = await organizationRest<SupabaseBudgetItemRecord[]>(`/project_budget_items?id=eq.${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      body: JSON.stringify(mapBudgetItemInputToSupabase({ ...input, organizationId }))
    });
    if (result.error) return { data: undefined as ProjectBudgetItem | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseBudgetItemToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async archiveBudgetItem(itemId: string) {
    const result = await organizationRest<SupabaseBudgetItemRecord[]>(`/project_budget_items?id=eq.${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "archived" })
    });
    if (result.error) return { data: false, source: "supabase" as const, isFallback: false, error: result.error };
    return { data: true, source: "supabase" as const, isFallback: false };
  }
};
