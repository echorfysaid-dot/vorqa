import type { DocumentLanguage, DocumentType } from "@/lib/document-intelligence";

export type ParsedDocumentStatus = "success" | "partial" | "failed";

export type ParsedDocumentWarningCode =
  | "unsupported_file"
  | "corrupted_document"
  | "empty_document"
  | "ocr_unavailable"
  | "partial_extraction"
  | "unsupported_compression"
  | "metadata_only";

export type ParsedDocumentWarning = Readonly<{
  code: ParsedDocumentWarningCode;
  message: string;
  severity: "info" | "warning" | "critical";
}>;

export type ParsedDocumentSection = Readonly<{
  id: string;
  title: string;
  order: number;
  text: string;
  pageNumber?: number;
}>;

export type ParsedDocumentTable = Readonly<{
  id: string;
  title?: string;
  rows: readonly Record<string, string>[];
}>;

export type ParsedDocumentMetadata = Readonly<{
  title?: string;
  author?: string;
  createdAt?: string;
  modifiedAt?: string;
  extension?: string;
  parser: string;
  checksum?: string;
  wordCount: number;
  characterCount: number;
}>;

export type ParsedConstructionDocument = Readonly<{
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  pageCount: number;
  language: DocumentLanguage;
  type: DocumentType;
  text: string;
  sections: readonly ParsedDocumentSection[];
  tables: readonly ParsedDocumentTable[];
  metadata: ParsedDocumentMetadata;
  warnings: readonly ParsedDocumentWarning[];
  confidence: number;
  status: ParsedDocumentStatus;
}>;

export type DocumentParseInput = Readonly<{
  filename: string;
  mimeType?: string;
  fileSize?: number;
  text?: string;
  base64?: string;
  bytes?: Uint8Array;
}>;

export type DocumentParseResult = Readonly<{
  ok: boolean;
  document?: ParsedConstructionDocument;
  status: ParsedDocumentStatus;
  warnings: readonly ParsedDocumentWarning[];
  errors: readonly ParsedDocumentWarning[];
}>;

export const supportedConstructionDocumentMimeTypes = [
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg"
] as const;

