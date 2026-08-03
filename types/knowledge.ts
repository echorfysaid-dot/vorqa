import type { ParsedConstructionDocument } from "@/lib/document-types";

export type KnowledgeEmbeddingStatus = "available" | "unavailable" | "fallback";
export type KnowledgeIndexStatus = "indexed" | "partial" | "failed";

export type KnowledgeChunkMetadata = Readonly<{
  filename: string;
  mimeType: string;
  documentType: string;
  language: string;
  sectionTitle?: string;
  pageNumber?: number;
  wordCount: number;
}>;

export type KnowledgeChunk = Readonly<{
  id: string;
  projectId: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  metadata: KnowledgeChunkMetadata;
  embeddingStatus: KnowledgeEmbeddingStatus;
  createdAt: string;
}>;

export type StoredKnowledgeChunk = KnowledgeChunk & Readonly<{
  embedding?: readonly number[];
}>;

export type KnowledgeSourceDocument = Readonly<{
  id: string;
  filename: string;
  mimeType: string;
  type: string;
  confidence: number;
}>;

export type KnowledgeSearchResult = Readonly<{
  chunk: KnowledgeChunk;
  relevanceScore: number;
  sourceDocument: KnowledgeSourceDocument;
  metadata: KnowledgeChunkMetadata;
  confidence: number;
}>;

export type KnowledgeSearchRequest = Readonly<{
  projectId: string;
  query: string;
  limit?: number;
}>;

export type KnowledgeIndexDocumentRequest = Readonly<{
  projectId: string;
  document: ParsedConstructionDocument;
  now?: Date;
}>;

export type KnowledgeIndexResult = Readonly<{
  ok: boolean;
  status: KnowledgeIndexStatus;
  projectId: string;
  documentId: string;
  chunkCount: number;
  embeddingStatus: KnowledgeEmbeddingStatus;
  warnings: readonly string[];
}>;

export type KnowledgeSearchResponse = Readonly<{
  ok: boolean;
  projectId: string;
  query: string;
  results: readonly KnowledgeSearchResult[];
  status: "success" | "empty" | "failed";
  warnings: readonly string[];
}>;

export type KnowledgeStorageStats = Readonly<{
  projectCount: number;
  documentCount: number;
  chunkCount: number;
}>;
