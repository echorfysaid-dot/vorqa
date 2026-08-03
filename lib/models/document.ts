import type { EntityId, OwnedEntity, Timestamped } from "./common";

export type DocumentStatus = "Draft" | "Generated" | "Saved" | "Archived";
export type DocumentType = "Document" | "CV" | "Landing Page" | "Business Idea" | "Marketing" | "Report" | "Contract";
export type ProjectDocumentCategory =
  | "Architectural Drawings"
  | "Structural Drawings"
  | "BOQ"
  | "Specifications"
  | "Contracts"
  | "Permits"
  | "Inspection Reports"
  | "Invoices"
  | "Safety Documents"
  | "QA Reports"
  | "Other";

export interface Document extends Timestamped, OwnedEntity {
  id: EntityId;
  projectId?: EntityId;
  organizationId?: EntityId;
  departmentId?: EntityId;
  departmentName?: string;
  uploaderId?: EntityId;
  uploaderName?: string;
  title: string;
  type: DocumentType | string;
  status: DocumentStatus | string;
  content?: string;
  provider?: string;
  model?: string;
  favorite?: boolean;
  category?: ProjectDocumentCategory | string;
  version?: string;
  filename?: string;
  storagePath?: string;
  fileSize?: number;
  mimeType?: string;
  tags?: string[];
  archived?: boolean;
  metadata?: Record<string, unknown>;
}

export type ProjectDocumentInput = {
  projectId: EntityId;
  organizationId?: EntityId;
  departmentId?: EntityId;
  uploaderId?: EntityId;
  title: string;
  type?: string;
  content?: string;
  category?: ProjectDocumentCategory | string;
  version?: string;
  filename?: string;
  storagePath?: string;
  fileSize?: number;
  mimeType?: string;
  tags?: string[];
  archived?: boolean;
  metadata?: Record<string, unknown>;
};

export type DocumentUploadInput = {
  projectId: EntityId;
  organizationId?: EntityId;
  departmentId?: EntityId;
  category?: ProjectDocumentCategory | string;
  version?: string;
  tags?: string[];
  file: File;
};
