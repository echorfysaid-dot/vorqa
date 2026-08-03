import { fallbackEmbeddingProvider, type EmbeddingProvider } from "@/lib/embedding-provider";
import { inMemoryVectorStorage, type VectorStorage } from "@/lib/vector-storage";
import type { KnowledgeSearchRequest, KnowledgeSearchResponse } from "@/types/knowledge";

export async function searchKnowledge(
  request: KnowledgeSearchRequest,
  options: { storage?: VectorStorage; provider?: EmbeddingProvider } = {}
): Promise<KnowledgeSearchResponse> {
  try {
    return await (options.storage || inMemoryVectorStorage).search(request, options.provider || fallbackEmbeddingProvider);
  } catch (error) {
    return Object.freeze({
      ok: false,
      projectId: request.projectId,
      query: request.query,
      results: [],
      status: "failed" as const,
      warnings: [error instanceof Error ? error.message : "Knowledge search failed."]
    });
  }
}
