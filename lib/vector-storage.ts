import { fallbackEmbeddingProvider, type EmbeddingProvider } from "@/lib/embedding-provider";
import { cosineSimilarity, createKnowledgeChunks, lexicalRelevance } from "@/lib/vector-index";
import type {
  KnowledgeChunk,
  KnowledgeIndexDocumentRequest,
  KnowledgeIndexResult,
  KnowledgeSearchRequest,
  KnowledgeSearchResponse,
  KnowledgeSearchResult,
  KnowledgeSourceDocument,
  KnowledgeStorageStats,
  StoredKnowledgeChunk
} from "@/types/knowledge";

export type VectorStorage = Readonly<{
  indexDocument(request: KnowledgeIndexDocumentRequest, provider?: EmbeddingProvider): Promise<KnowledgeIndexResult>;
  indexChunks(chunks: readonly KnowledgeChunk[], provider?: EmbeddingProvider): Promise<KnowledgeIndexResult>;
  search(request: KnowledgeSearchRequest, provider?: EmbeddingProvider): Promise<KnowledgeSearchResponse>;
  deleteDocument(projectId: string, documentId: string): Promise<{ ok: boolean; deletedChunks: number }>;
  deleteProject(projectId: string): Promise<{ ok: boolean; deletedChunks: number }>;
  stats(): KnowledgeStorageStats;
}>;

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[key];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function sourceDocumentFromChunk(chunk: StoredKnowledgeChunk): KnowledgeSourceDocument {
  return deepFreeze({
    id: chunk.documentId,
    filename: chunk.metadata.filename,
    mimeType: chunk.metadata.mimeType,
    type: chunk.metadata.documentType,
    confidence: chunk.embeddingStatus === "available" || chunk.embeddingStatus === "fallback" ? 0.82 : 0.58
  });
}

function resultConfidence(score: number, hasEmbedding: boolean) {
  const base = hasEmbedding ? 0.65 : 0.45;
  return Number(Math.min(0.98, base + score * 0.35).toFixed(4));
}

export function createInMemoryVectorStorage(): VectorStorage {
  const chunks = new Map<string, StoredKnowledgeChunk>();

  async function embedChunk(chunk: KnowledgeChunk, provider: EmbeddingProvider): Promise<StoredKnowledgeChunk> {
    const embedded = await provider.embed(chunk.text);
    return deepFreeze({
      ...chunk,
      embeddingStatus: embedded.status,
      embedding: embedded.embedding
    });
  }

  return {
    async indexDocument(request, provider = fallbackEmbeddingProvider) {
      try {
        const nextChunks = createKnowledgeChunks(request);
        const result = await this.indexChunks(nextChunks, provider);
        return deepFreeze({
          ...result,
          projectId: request.projectId,
          documentId: request.document.id
        });
      } catch (error) {
        return deepFreeze({
          ok: false,
          status: "failed",
          projectId: request.projectId,
          documentId: request.document.id,
          chunkCount: 0,
          embeddingStatus: "unavailable",
          warnings: [error instanceof Error ? error.message : "Document indexing failed."]
        });
      }
    },

    async indexChunks(nextChunks, provider = fallbackEmbeddingProvider) {
      if (!nextChunks.length) {
        return deepFreeze({
          ok: false,
          status: "failed",
          projectId: "",
          documentId: "",
          chunkCount: 0,
          embeddingStatus: "unavailable",
          warnings: ["No chunks were provided for indexing."]
        });
      }

      const embeddedChunks = await Promise.all(nextChunks.map((chunk) => embedChunk(chunk, provider)));
      for (const chunk of embeddedChunks) chunks.set(chunk.id, chunk);
      const embeddingStatus = embeddedChunks.some((chunk) => chunk.embeddingStatus === "available")
        ? "available"
        : embeddedChunks.some((chunk) => chunk.embeddingStatus === "fallback")
          ? "fallback"
          : "unavailable";

      return deepFreeze({
        ok: true,
        status: embeddingStatus === "unavailable" ? "partial" : "indexed",
        projectId: nextChunks[0].projectId,
        documentId: nextChunks[0].documentId,
        chunkCount: embeddedChunks.length,
        embeddingStatus,
        warnings: embeddingStatus === "unavailable" ? ["Indexed chunks without embeddings; lexical fallback is available."] : []
      });
    },

    async search(request, provider = fallbackEmbeddingProvider) {
      const query = request.query.trim();
      if (!request.projectId || !query) {
        return deepFreeze({ ok: false, projectId: request.projectId, query, results: [], status: "failed", warnings: ["Search requires a project ID and query."] });
      }

      const providerResult = await provider.embed(query);
      const candidates = [...chunks.values()].filter((chunk) => chunk.projectId === request.projectId);
      const results: KnowledgeSearchResult[] = candidates
        .map((chunk) => {
          const vectorScore = cosineSimilarity(providerResult.embedding, chunk.embedding);
          const lexicalScore = lexicalRelevance(query, chunk.text);
          const relevanceScore = Number(Math.max(vectorScore, lexicalScore).toFixed(6));
          return {
            chunk,
            relevanceScore,
            sourceDocument: sourceDocumentFromChunk(chunk),
            metadata: chunk.metadata,
            confidence: resultConfidence(relevanceScore, Boolean(providerResult.embedding && chunk.embedding))
          };
        })
        .filter((result) => result.relevanceScore > 0)
        .sort((left, right) => right.relevanceScore - left.relevanceScore || left.chunk.id.localeCompare(right.chunk.id))
        .slice(0, Math.max(1, Math.min(20, request.limit || 5)))
        .map((result) => deepFreeze(result));

      return deepFreeze({
        ok: true,
        projectId: request.projectId,
        query,
        results,
        status: results.length ? "success" : "empty",
        warnings: providerResult.status === "unavailable" ? providerResult.warnings : []
      });
    },

    async deleteDocument(projectId, documentId) {
      let deletedChunks = 0;
      for (const [id, chunk] of chunks.entries()) {
        if (chunk.projectId === projectId && chunk.documentId === documentId) {
          chunks.delete(id);
          deletedChunks += 1;
        }
      }
      return deepFreeze({ ok: true, deletedChunks });
    },

    async deleteProject(projectId) {
      let deletedChunks = 0;
      for (const [id, chunk] of chunks.entries()) {
        if (chunk.projectId === projectId) {
          chunks.delete(id);
          deletedChunks += 1;
        }
      }
      return deepFreeze({ ok: true, deletedChunks });
    },

    stats() {
      const projectIds = new Set<string>();
      const documentIds = new Set<string>();
      for (const chunk of chunks.values()) {
        projectIds.add(chunk.projectId);
        documentIds.add(`${chunk.projectId}:${chunk.documentId}`);
      }
      return deepFreeze({
        projectCount: projectIds.size,
        documentCount: documentIds.size,
        chunkCount: chunks.size
      });
    }
  };
}

export const inMemoryVectorStorage = createInMemoryVectorStorage();
