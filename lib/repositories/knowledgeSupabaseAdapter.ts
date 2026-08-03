import type { KnowledgeArticle, KnowledgeArticleFilters, KnowledgeArticleInput } from "@/lib/models";
import { getValidSession } from "@/lib/auth-client";
import { documentSupabaseAdapter } from "./documentSupabaseAdapter";
import { organizationSupabaseAdapter } from "./organizationSupabaseAdapter";
import { isUuid, organizationRest } from "./organizationSupabaseRest";
import { projectSupabaseAdapter } from "./projectSupabaseAdapter";
import {
  filterKnowledgeArticles,
  mapKnowledgeInputToSupabase,
  mapSupabaseKnowledgeToDomain,
  type SupabaseKnowledgeArticleRecord
} from "./knowledgeMapper";

const knowledgeSelect = "*,documents(id,title,filename),created_by_profile:profiles!knowledge_articles_created_by_fkey(id,email,full_name,avatar_url)";

async function resolveOrganizationId(organizationId?: string) {
  if (!organizationId) return undefined;
  if (isUuid(organizationId)) return organizationId;
  const organization = await organizationSupabaseAdapter.getOrganization(organizationId);
  return organization.data?.id;
}

async function validateScope(input: Partial<KnowledgeArticleInput>) {
  const project = input.projectId ? await projectSupabaseAdapter.getProject(input.projectId) : undefined;
  if (input.projectId && !project?.data) return { error: "Project not found." };
  const organizationId = await resolveOrganizationId(input.organizationId || project?.data?.organizationId);
  if (!organizationId) return { error: "Organization not found." };
  if (project?.data?.organizationId && organizationId && isUuid(project.data.organizationId) && project.data.organizationId !== organizationId) {
    return { error: "Project does not belong to this organization." };
  }
  if (input.documentId) {
    const document = await documentSupabaseAdapter.getDocument(input.documentId);
    if (!document.data) return { error: "Related document not found." };
    if (document.data.projectId && input.projectId && document.data.projectId !== input.projectId) return { error: "Related document does not belong to this project." };
    if (document.data.organizationId && organizationId && document.data.organizationId !== organizationId) return { error: "Related document does not belong to this organization." };
  }
  return { organizationId };
}

function buildKnowledgePath(filters: KnowledgeArticleFilters = {}) {
  const params = new URLSearchParams();
  params.set("select", knowledgeSelect);
  params.set("order", "updated_at.desc");
  if (filters.organizationId) params.set("organization_id", `eq.${filters.organizationId}`);
  if (filters.projectId) params.set("project_id", `eq.${filters.projectId}`);
  if (filters.category && filters.category !== "All") params.set("category", `eq.${filters.category}`);
  if (filters.status && filters.status !== "All") {
    const status = filters.status === "Draft" ? "draft" : filters.status === "Archived" ? "archived" : "published";
    params.set("status", `eq.${status}`);
  } else {
    params.set("status", "neq.archived");
  }
  return `/knowledge_articles?${params.toString()}`;
}

export const knowledgeSupabaseAdapter = {
  async getKnowledge(filters: KnowledgeArticleFilters = {}) {
    const scope = filters.organizationId || filters.projectId ? await validateScope({ organizationId: filters.organizationId, projectId: filters.projectId }) : {};
    if ("error" in scope && typeof scope.error === "string") return { data: [] as KnowledgeArticle[], source: "supabase" as const, isFallback: false, error: scope.error };
    const organizationId = "organizationId" in scope && typeof scope.organizationId === "string" ? scope.organizationId : filters.organizationId;
    const result = await organizationRest<SupabaseKnowledgeArticleRecord[]>(buildKnowledgePath({ ...filters, organizationId }));
    if (result.error) return { data: [] as KnowledgeArticle[], source: "supabase" as const, isFallback: false, error: result.error };
    const mapped = (result.data || []).map(mapSupabaseKnowledgeToDomain);
    return { data: filterKnowledgeArticles(mapped, filters), source: "supabase" as const, isFallback: false };
  },

  async getKnowledgeArticle(articleId: string) {
    const result = await organizationRest<SupabaseKnowledgeArticleRecord[]>(
      `/knowledge_articles?id=eq.${encodeURIComponent(articleId)}&select=${encodeURIComponent(knowledgeSelect)}&limit=1`
    );
    if (result.error) return { data: undefined as KnowledgeArticle | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseKnowledgeToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async createKnowledge(input: KnowledgeArticleInput) {
    const session = await getValidSession();
    if (!session?.user?.id) return { data: undefined as KnowledgeArticle | undefined, source: "supabase" as const, isFallback: false, error: "Authentication is required to create knowledge articles." };
    const scope = await validateScope(input);
    if (scope.error) return { data: undefined as KnowledgeArticle | undefined, source: "supabase" as const, isFallback: false, error: scope.error };
    const result = await organizationRest<SupabaseKnowledgeArticleRecord[]>("/knowledge_articles", {
      method: "POST",
      body: JSON.stringify(mapKnowledgeInputToSupabase({ ...input, organizationId: scope.organizationId }, session.user.id))
    });
    if (result.error) return { data: undefined as KnowledgeArticle | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseKnowledgeToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateKnowledge(articleId: string, input: Partial<KnowledgeArticleInput>) {
    const scope = input.organizationId || input.projectId || input.documentId ? await validateScope(input) : {};
    if ("error" in scope && typeof scope.error === "string") return { data: undefined as KnowledgeArticle | undefined, source: "supabase" as const, isFallback: false, error: scope.error };
    const organizationId = "organizationId" in scope && typeof scope.organizationId === "string" ? scope.organizationId : input.organizationId;
    const result = await organizationRest<SupabaseKnowledgeArticleRecord[]>(`/knowledge_articles?id=eq.${encodeURIComponent(articleId)}`, {
      method: "PATCH",
      body: JSON.stringify(mapKnowledgeInputToSupabase({ ...input, organizationId }))
    });
    if (result.error) return { data: undefined as KnowledgeArticle | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseKnowledgeToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async archiveKnowledge(articleId: string) {
    const result = await this.updateKnowledge(articleId, { status: "Archived" });
    return { data: Boolean(result.data), source: "supabase" as const, isFallback: false, error: result.error };
  },

  async searchKnowledge(query: string, filters: KnowledgeArticleFilters = {}) {
    return this.getKnowledge({ ...filters, query });
  },

  async filterKnowledge(filters: KnowledgeArticleFilters = {}) {
    return this.getKnowledge(filters);
  }
};
