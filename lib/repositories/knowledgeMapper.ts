import type { KnowledgeArticle, KnowledgeArticleInput, KnowledgeArticleStatus } from "@/lib/models";
import type { Document as SupabaseDocument, KnowledgeArticle as SupabaseKnowledgeArticle, Profile } from "@/lib/supabase";

export type SupabaseKnowledgeArticleRecord = SupabaseKnowledgeArticle & {
  documents?: Pick<SupabaseDocument, "id" | "title" | "filename"> | null;
  created_by_profile?: Pick<Profile, "id" | "email" | "full_name" | "avatar_url"> | null;
};

export const knowledgeCategories = [
  "Building Standards",
  "Safety Procedures",
  "Concrete Specifications",
  "Quality Control",
  "Inspection Checklist",
  "Site Logistics",
  "Equipment Guide",
  "Procurement Process",
  "Permit Workflow",
  "Risk Management"
] as const;

export const knowledgeStatuses = ["Published", "Draft", "Archived"] as const satisfies readonly KnowledgeArticleStatus[];

function toDomainStatus(status?: string | null): KnowledgeArticleStatus {
  if (status === "draft") return "Draft";
  if (status === "archived") return "Archived";
  return "Published";
}

function toSupabaseStatus(status?: KnowledgeArticleStatus | string) {
  if (status === "Draft") return "draft";
  if (status === "Archived") return "archived";
  return "published";
}

export function mapSupabaseKnowledgeToDomain(record: SupabaseKnowledgeArticleRecord): KnowledgeArticle {
  return {
    id: record.id,
    organizationId: record.organization_id,
    projectId: record.project_id || undefined,
    documentId: record.document_id || undefined,
    documentTitle: record.documents?.title || record.documents?.filename || undefined,
    title: record.title,
    summary: record.summary || undefined,
    content: record.content || undefined,
    category: record.category || undefined,
    tags: record.tags || [],
    status: toDomainStatus(record.status),
    createdBy: record.created_by || undefined,
    createdByName: record.created_by_profile?.full_name || record.created_by_profile?.email || undefined,
    metadata: record.metadata || {},
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function mapKnowledgeInputToSupabase(input: Partial<KnowledgeArticleInput>, createdBy?: string) {
  return {
    ...(input.organizationId !== undefined ? { organization_id: input.organizationId } : {}),
    ...(input.projectId !== undefined ? { project_id: input.projectId || null } : {}),
    ...(input.documentId !== undefined ? { document_id: input.documentId || null } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.summary !== undefined ? { summary: input.summary || null } : {}),
    ...(input.content !== undefined ? { content: input.content || null } : {}),
    ...(input.category !== undefined ? { category: input.category || null } : {}),
    ...(input.tags !== undefined ? { tags: input.tags || [] } : {}),
    ...(input.status !== undefined ? { status: toSupabaseStatus(input.status) } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata || {} } : {}),
    ...(createdBy !== undefined ? { created_by: createdBy || null } : {})
  };
}

export function filterKnowledgeArticles(articles: KnowledgeArticle[], filters: {
  query?: string;
  category?: string;
  tag?: string;
  status?: string;
}) {
  const normalized = filters.query?.trim().toLowerCase();
  return articles.filter((article) => {
    const searchBody = [article.title, article.summary, article.content, article.category, ...(article.tags || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesQuery = normalized ? searchBody.includes(normalized) : true;
    const matchesCategory = !filters.category || filters.category === "All" || article.category === filters.category;
    const matchesTag = !filters.tag || filters.tag === "All" || (article.tags || []).includes(filters.tag);
    const matchesStatus = !filters.status || filters.status === "All" || article.status === filters.status;
    return matchesQuery && matchesCategory && matchesTag && matchesStatus;
  });
}
