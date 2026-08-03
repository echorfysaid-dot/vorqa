import { fallbackEmbeddingProvider, type EmbeddingProvider } from "@/lib/embedding-provider";
import { parseConstructionDocument } from "@/lib/document-parser";
import { searchKnowledge } from "@/lib/knowledge-search";
import { inMemoryVectorStorage, type VectorStorage } from "@/lib/vector-storage";
import type { DocumentParseInput, ParsedConstructionDocument } from "@/lib/document-types";
import type { KnowledgeIndexResult, KnowledgeSearchRequest, KnowledgeSearchResponse } from "@/types/knowledge";

export type KnowledgeEngineIndexInput = Readonly<{
  projectId: string;
  document?: ParsedConstructionDocument;
  documentInput?: DocumentParseInput;
  now?: Date;
}>;

export type KnowledgeEngine = Readonly<{
  indexDocument(input: KnowledgeEngineIndexInput): Promise<KnowledgeIndexResult>;
  search(input: KnowledgeSearchRequest): Promise<KnowledgeSearchResponse>;
  deleteDocument(projectId: string, documentId: string): Promise<{ ok: boolean; deletedChunks: number }>;
  deleteProject(projectId: string): Promise<{ ok: boolean; deletedChunks: number }>;
}>;

export function createKnowledgeEngine(options: { storage?: VectorStorage; provider?: EmbeddingProvider } = {}): KnowledgeEngine {
  const storage = options.storage || inMemoryVectorStorage;
  const provider = options.provider || fallbackEmbeddingProvider;

  return Object.freeze({
    async indexDocument(input) {
      if (!input.projectId) {
        return Object.freeze({
          ok: false,
          status: "failed" as const,
          projectId: "",
          documentId: "",
          chunkCount: 0,
          embeddingStatus: "unavailable" as const,
          warnings: ["Knowledge indexing requires a project ID."]
        });
      }

      try {
        const document = input.document || (input.documentInput ? (await parseConstructionDocument(input.documentInput)).document : undefined);
        if (!document) {
          return Object.freeze({
            ok: false,
            status: "failed" as const,
            projectId: input.projectId,
            documentId: "",
            chunkCount: 0,
            embeddingStatus: "unavailable" as const,
            warnings: ["No parseable document was provided for indexing."]
          });
        }
        return await storage.indexDocument({ projectId: input.projectId, document, now: input.now }, provider);
      } catch (error) {
        return Object.freeze({
          ok: false,
          status: "failed" as const,
          projectId: input.projectId,
          documentId: input.document?.id || "",
          chunkCount: 0,
          embeddingStatus: "unavailable" as const,
          warnings: [error instanceof Error ? error.message : "Knowledge indexing failed."]
        });
      }
    },

    async search(input) {
      return searchKnowledge(input, { storage, provider });
    },

    async deleteDocument(projectId, documentId) {
      return storage.deleteDocument(projectId, documentId);
    },

    async deleteProject(projectId) {
      return storage.deleteProject(projectId);
    }
  });
}

export const knowledgeEngine = createKnowledgeEngine();
