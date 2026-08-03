import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { KnowledgeArticle, KnowledgeArticleFilters, KnowledgeArticleInput } from "@/lib/models";
import { knowledgeDemoAdapter } from "./knowledgeDemoAdapter";
import { knowledgeSupabaseAdapter } from "./knowledgeSupabaseAdapter";

export type KnowledgeRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
  demo: () => Promise<KnowledgeRepositoryResult<T>>,
  supabase: () => Promise<KnowledgeRepositoryResult<T>>
): Promise<KnowledgeRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

export const knowledgeRepository = {
  async getKnowledge(filters: KnowledgeArticleFilters = {}) {
    return withMode(() => knowledgeDemoAdapter.getKnowledge(filters), () => knowledgeSupabaseAdapter.getKnowledge(filters));
  },

  async getKnowledgeArticle(articleId: string) {
    return withMode(() => knowledgeDemoAdapter.getKnowledgeArticle(articleId), () => knowledgeSupabaseAdapter.getKnowledgeArticle(articleId));
  },

  async createKnowledge(input: KnowledgeArticleInput) {
    return withMode(() => knowledgeDemoAdapter.createKnowledge(input), () => knowledgeSupabaseAdapter.createKnowledge(input));
  },

  async updateKnowledge(articleId: string, input: Partial<KnowledgeArticleInput>) {
    return withMode(() => knowledgeDemoAdapter.updateKnowledge(articleId, input), () => knowledgeSupabaseAdapter.updateKnowledge(articleId, input));
  },

  async archiveKnowledge(articleId: string) {
    return withMode(() => knowledgeDemoAdapter.archiveKnowledge(articleId), () => knowledgeSupabaseAdapter.archiveKnowledge(articleId));
  },

  async searchKnowledge(query: string, filters: KnowledgeArticleFilters = {}) {
    return withMode(() => knowledgeDemoAdapter.searchKnowledge(query, filters), () => knowledgeSupabaseAdapter.searchKnowledge(query, filters));
  },

  async filterKnowledge(filters: KnowledgeArticleFilters = {}) {
    return withMode(() => knowledgeDemoAdapter.filterKnowledge(filters), () => knowledgeSupabaseAdapter.filterKnowledge(filters));
  },

  getKnowledgeStats(articles: KnowledgeArticle[]) {
    const active = articles.filter((article) => article.status !== "Archived");
    const categories = active.reduce<Record<string, number>>((acc, article) => {
      const key = article.category || "Uncategorized";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const recentUpdates = [...active].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).slice(0, 5);
    const mostViewed = [...active].sort((a, b) => Number(b.metadata?.views || 0) - Number(a.metadata?.views || 0)).slice(0, 3);
    const draftCount = active.filter((article) => article.status === "Draft").length;
    return { count: active.length, categories, recentUpdates, mostViewed, draftCount };
  }
};
