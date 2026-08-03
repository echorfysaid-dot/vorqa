import type { EntityId, OwnedEntity, Timestamped } from "./common";

export type KnowledgeFileStatus = "Uploaded" | "Processing" | "Ready" | "Failed";
export type KnowledgeArticleStatus = "Draft" | "Published" | "Archived";

export interface KnowledgeFile extends Timestamped, OwnedEntity {
  id: EntityId;
  projectId: EntityId;
  storagePath: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: KnowledgeFileStatus | string;
}

export interface KnowledgeArticle extends Timestamped, OwnedEntity {
  id: EntityId;
  projectId?: EntityId;
  documentId?: EntityId;
  documentTitle?: string;
  title: string;
  summary?: string;
  content?: string;
  category?: string;
  tags?: string[];
  status: KnowledgeArticleStatus | string;
  createdBy?: EntityId;
  createdByName?: string;
  metadata?: Record<string, unknown>;
}

export type KnowledgeArticleInput = {
  organizationId: EntityId;
  projectId?: EntityId;
  documentId?: EntityId;
  title: string;
  summary?: string;
  content?: string;
  category?: string;
  tags?: string[];
  status?: KnowledgeArticleStatus | string;
  metadata?: Record<string, unknown>;
};

export type KnowledgeArticleFilters = {
  organizationId?: EntityId;
  projectId?: EntityId;
  category?: string;
  tag?: string;
  status?: KnowledgeArticleStatus | string;
  query?: string;
};
