import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { Document, DocumentUploadInput, ProjectDocumentInput } from "@/lib/models";
import { documentDemoAdapter } from "./documentDemoAdapter";
import { documentSupabaseAdapter } from "./documentSupabaseAdapter";

export type DocumentRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
  demo: () => Promise<DocumentRepositoryResult<T>>,
  supabase: () => Promise<DocumentRepositoryResult<T>>
): Promise<DocumentRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

export const documentRepository = {
  async getDocuments(projectId: string) {
    return withMode(() => documentDemoAdapter.getDocuments(projectId), () => documentSupabaseAdapter.getDocuments(projectId));
  },

  async getDocument(documentId: string) {
    return withMode(() => documentDemoAdapter.getDocument(documentId), () => documentSupabaseAdapter.getDocument(documentId));
  },

  async uploadDocument(input: DocumentUploadInput) {
    return withMode(() => documentDemoAdapter.uploadDocument(input), () => documentSupabaseAdapter.uploadDocument(input));
  },

  async updateDocument(documentId: string, input: Partial<ProjectDocumentInput>) {
    return withMode(() => documentDemoAdapter.updateDocument(documentId, input), () => documentSupabaseAdapter.updateDocument(documentId, input));
  },

  async archiveDocument(documentId: string) {
    return withMode(() => documentDemoAdapter.archiveDocument(documentId), () => documentSupabaseAdapter.archiveDocument(documentId));
  },

  async deleteDocument(documentId: string) {
    return withMode(() => documentDemoAdapter.deleteDocument(documentId), () => documentSupabaseAdapter.deleteDocument(documentId));
  },

  async downloadDocument(document: Document) {
    return withMode(() => documentDemoAdapter.downloadDocument(document), () => documentSupabaseAdapter.downloadDocument(document));
  },

  getDocumentStats(documents: Document[]) {
    const active = documents.filter((document) => !document.archived);
    const storageUsage = active.reduce((sum, document) => sum + (document.fileSize || 0), 0);
    const categories = active.reduce<Record<string, number>>((acc, document) => {
      const key = String(document.category || "Other");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const largestFiles = [...active].sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0)).slice(0, 3);
    const recentUploads = [...active].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))).slice(0, 5);
    return { count: active.length, storageUsage, categories, largestFiles, recentUploads };
  }
};
