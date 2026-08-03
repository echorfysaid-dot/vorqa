export type DocumentType =
  | "pdf"
  | "docx"
  | "txt"
  | "markdown"
  | "csv"
  | "spreadsheet"
  | "image"
  | "cad"
  | "bim"
  | "construction_specification"
  | "contract"
  | "report"
  | "drawing"
  | "meeting_minutes"
  | "unknown";

export type DocumentLanguage = "ar" | "fr" | "en" | "mixed" | "unknown";

export type DocumentSource = "upload" | "supabase_storage" | "generated" | "manual" | "external" | "unknown";

export type DocumentCapability =
  | "validation"
  | "metadata_extraction"
  | "normalization"
  | "section_detection"
  | "chunking"
  | "text_extraction_placeholder"
  | "table_extraction_placeholder"
  | "image_extraction_placeholder"
  | "cad_extraction_placeholder"
  | "bim_extraction_placeholder";

export type DocumentChunkStrategy = "fixed" | "semantic" | "page" | "section" | "heading";

export type DocumentErrorCode =
  | "unsupported_type"
  | "empty_document"
  | "invalid_metadata"
  | "oversized_document"
  | "unsupported_parser"
  | "corrupt_document_placeholder"
  | "missing_content"
  | "unknown_error";

export type DocumentErrorSeverity = "warning" | "error";

export type DocumentError = Readonly<{
  code: DocumentErrorCode;
  message: string;
  severity: DocumentErrorSeverity;
  field?: string;
}>;

export type DocumentMetadata = Readonly<{
  title?: string;
  author?: string;
  language?: DocumentLanguage;
  pageCount?: number;
  wordCount?: number;
  createdAt?: string;
  modifiedAt?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
  sourceName?: string;
  tags?: readonly string[];
  category?: string;
}>;

export type DocumentDescriptor = Readonly<{
  id: string;
  name: string;
  type: DocumentType;
  source: DocumentSource;
  mimeType?: string;
  sizeBytes?: number;
  storagePath?: string;
  metadata?: DocumentMetadata;
}>;

export type DocumentSection = Readonly<{
  id: string;
  title: string;
  order: number;
  type: "document" | "page" | "heading" | "table" | "appendix" | "unknown";
  text?: string;
  pageNumber?: number;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type DocumentContent = Readonly<{
  text?: string;
  sections?: readonly DocumentSection[];
  pages?: readonly Readonly<{ pageNumber: number; text?: string }>[];
  tables?: readonly Readonly<{ id: string; title?: string; rows?: readonly Record<string, unknown>[] }>[];
  status: "empty" | "placeholder" | "normalized";
}>;

export type DocumentStatistics = Readonly<{
  characterCount: number;
  wordCount: number;
  sectionCount: number;
  pageCount?: number;
  chunkCount?: number;
}>;

export type DocumentChunk = Readonly<{
  id: string;
  documentId: string;
  strategy: DocumentChunkStrategy;
  order: number;
  text: string;
  sectionId?: string;
  pageNumber?: number;
  characterCount: number;
  wordCount: number;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type DocumentValidationResult = Readonly<{
  valid: boolean;
  errors: readonly DocumentError[];
  warnings: readonly DocumentError[];
}>;

export type DocumentExtractionResult = Readonly<{
  descriptor: DocumentDescriptor;
  content: DocumentContent;
  sections: readonly DocumentSection[];
  chunks: readonly DocumentChunk[];
  statistics: DocumentStatistics;
  validation: DocumentValidationResult;
  capabilities: readonly DocumentCapability[];
  status: "validated" | "normalized" | "chunked" | "placeholder";
}>;

export type DocumentParserInput = Readonly<{
  descriptor: DocumentDescriptor;
  content?: DocumentContent;
}>;

export type DocumentParser = Readonly<{
  id: string;
  supportedTypes: readonly DocumentType[];
  capabilities: readonly DocumentCapability[];
  parse: (input: DocumentParserInput) => Promise<DocumentExtractionResult>;
}>;

export type DocumentPipelineStage =
  | "validation"
  | "metadata_extraction"
  | "normalization"
  | "section_detection"
  | "chunk_builder"
  | "extraction_placeholder"
  | "future_ai_analysis";

export type DocumentPipeline = Readonly<{
  id: string;
  stages: readonly DocumentPipelineStage[];
  supportedTypes: readonly DocumentType[];
  defaultChunkStrategy: DocumentChunkStrategy;
  capabilities: readonly DocumentCapability[];
}>;

export type DocumentValidationConstraints = Readonly<{
  maxSizeBytes?: number;
  requireContent?: boolean;
  supportedTypes?: readonly DocumentType[];
}>;

const defaultSupportedTypes: readonly DocumentType[] = [
  "pdf",
  "docx",
  "txt",
  "markdown",
  "csv",
  "spreadsheet",
  "image",
  "cad",
  "bim",
  "construction_specification",
  "contract",
  "report",
  "drawing",
  "meeting_minutes"
];

const defaultPipelineStages: readonly DocumentPipelineStage[] = [
  "validation",
  "metadata_extraction",
  "normalization",
  "section_detection",
  "chunk_builder",
  "extraction_placeholder",
  "future_ai_analysis"
];

const defaultPipelineCapabilities: readonly DocumentCapability[] = [
  "validation",
  "metadata_extraction",
  "normalization",
  "section_detection",
  "chunking",
  "text_extraction_placeholder",
  "table_extraction_placeholder",
  "image_extraction_placeholder",
  "cad_extraction_placeholder",
  "bim_extraction_placeholder"
];

export const defaultDocumentPipeline: DocumentPipeline = Object.freeze({
  id: "vora-document-intelligence-foundation",
  stages: defaultPipelineStages,
  supportedTypes: defaultSupportedTypes,
  defaultChunkStrategy: "section",
  capabilities: defaultPipelineCapabilities
});

const mimeTypeMap: Readonly<Record<string, DocumentType>> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "text/markdown": "markdown",
  "text/csv": "csv",
  "application/csv": "csv",
  "application/vnd.ms-excel": "spreadsheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "spreadsheet",
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "image/jpg": "image"
};

const extensionMap: Readonly<Record<string, DocumentType>> = {
  pdf: "pdf",
  docx: "docx",
  txt: "txt",
  md: "markdown",
  markdown: "markdown",
  csv: "csv",
  xls: "spreadsheet",
  xlsx: "spreadsheet",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  dwg: "cad",
  dxf: "cad",
  ifc: "bim",
  rvt: "bim"
};

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const property of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[property];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function normalizeString(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

function extensionFromName(name?: string) {
  const normalized = normalizeString(name).toLowerCase();
  const extension = normalized.includes(".") ? normalized.split(".").pop() : undefined;
  return extension ? extensionMap[extension] : undefined;
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function createError(code: DocumentErrorCode, message: string, severity: DocumentErrorSeverity, field?: string): DocumentError {
  return { code, message, severity, field };
}

export function inferDocumentType(input: { mimeType?: string; name?: string; category?: string }): DocumentType {
  const mimeType = normalizeString(input.mimeType).toLowerCase();
  if (mimeType && mimeTypeMap[mimeType]) return mimeTypeMap[mimeType];

  const byExtension = extensionFromName(input.name);
  if (byExtension) return byExtension;

  const category = normalizeString(input.category).toLowerCase();
  if (category.includes("contract")) return "contract";
  if (category.includes("report")) return "report";
  if (category.includes("drawing") || category.includes("architectural") || category.includes("structural")) return "drawing";
  if (category.includes("meeting")) return "meeting_minutes";
  if (category.includes("specification")) return "construction_specification";

  return "unknown";
}

export function normalizeDocument(input: Partial<DocumentDescriptor> & { id: string; name: string }): DocumentDescriptor {
  const metadata: DocumentMetadata = {
    ...input.metadata,
    mimeType: input.mimeType || input.metadata?.mimeType,
    sizeBytes: input.sizeBytes ?? input.metadata?.sizeBytes,
    sourceName: input.metadata?.sourceName || input.name,
    tags: input.metadata?.tags ? [...input.metadata.tags].filter(Boolean).sort() : undefined
  };

  return deepFreeze({
    id: normalizeString(input.id),
    name: normalizeString(input.name),
    type: input.type && input.type !== "unknown" ? input.type : inferDocumentType({ mimeType: input.mimeType, name: input.name, category: input.metadata?.category }),
    source: input.source || "unknown",
    mimeType: metadata.mimeType,
    sizeBytes: metadata.sizeBytes,
    storagePath: input.storagePath,
    metadata
  });
}

export function validateDocument(
  descriptor: DocumentDescriptor,
  content?: DocumentContent,
  constraints: DocumentValidationConstraints = {}
): DocumentValidationResult {
  const errors: DocumentError[] = [];
  const warnings: DocumentError[] = [];
  const supportedTypes = constraints.supportedTypes || defaultSupportedTypes;

  if (!descriptor.id) errors.push(createError("invalid_metadata", "Document id is required.", "error", "id"));
  if (!descriptor.name) errors.push(createError("invalid_metadata", "Document name is required.", "error", "name"));
  if (!supportedTypes.includes(descriptor.type)) errors.push(createError("unsupported_type", "Document type is not supported by the foundation pipeline.", "error", "type"));
  if ((descriptor.sizeBytes || 0) < 0) errors.push(createError("invalid_metadata", "Document size cannot be negative.", "error", "sizeBytes"));
  if (constraints.maxSizeBytes && (descriptor.sizeBytes || 0) > constraints.maxSizeBytes) {
    errors.push(createError("oversized_document", "Document exceeds the configured maximum size.", "error", "sizeBytes"));
  }
  if (constraints.requireContent && (!content || content.status === "empty")) {
    errors.push(createError("empty_document", "Document content is required for this pipeline step.", "error", "content"));
  }
  if (!content || content.status === "placeholder") {
    warnings.push(createError("missing_content", "Document content extraction is a placeholder in this pass.", "warning", "content"));
  }
  if (["image", "cad", "bim", "spreadsheet"].includes(descriptor.type)) {
    warnings.push(createError("unsupported_parser", "Parser support is prepared as architecture only.", "warning", "parser"));
  }

  return deepFreeze({
    valid: errors.length === 0,
    errors,
    warnings
  });
}

export function calculateDocumentStatistics(content: DocumentContent): DocumentStatistics {
  const sectionText = (content.sections || []).map((section) => section.text || "").join("\n");
  const pageText = (content.pages || []).map((page) => page.text || "").join("\n");
  const text = [content.text, sectionText, pageText].filter(Boolean).join("\n");

  return deepFreeze({
    characterCount: text.length,
    wordCount: countWords(text),
    sectionCount: content.sections?.length || 0,
    pageCount: content.pages?.length
  });
}

export function detectDocumentSections(descriptor: DocumentDescriptor, content?: DocumentContent): readonly DocumentSection[] {
  if (content?.sections?.length) {
    return deepFreeze([...content.sections].sort((left, right) => left.order - right.order));
  }
  if (content?.pages?.length) {
    return deepFreeze(
      content.pages.map((page, index) => ({
        id: `${descriptor.id}:page:${page.pageNumber}`,
        title: `Page ${page.pageNumber}`,
        order: index,
        type: "page",
        text: page.text,
        pageNumber: page.pageNumber
      }))
    );
  }
  if (content?.text) {
    return deepFreeze([
      {
        id: `${descriptor.id}:section:0`,
        title: descriptor.metadata?.title || descriptor.name,
        order: 0,
        type: "document",
        text: content.text
      }
    ]);
  }
  return deepFreeze([]);
}

export function createDocumentChunks(
  descriptor: DocumentDescriptor,
  sections: readonly DocumentSection[],
  strategy: DocumentChunkStrategy = defaultDocumentPipeline.defaultChunkStrategy
): readonly DocumentChunk[] {
  return deepFreeze(
    sections
      .filter((section) => normalizeString(section.text))
      .map((section, index) => {
        const text = normalizeString(section.text);
        return {
          id: `${descriptor.id}:chunk:${strategy}:${index}`,
          documentId: descriptor.id,
          strategy,
          order: index,
          text,
          sectionId: section.id,
          pageNumber: section.pageNumber,
          characterCount: text.length,
          wordCount: countWords(text),
          metadata: {
            sectionTitle: section.title,
            sectionType: section.type
          }
        };
      })
  );
}

export function createPlaceholderExtractionResult(input: {
  descriptor: DocumentDescriptor;
  content?: DocumentContent;
  chunkStrategy?: DocumentChunkStrategy;
  constraints?: DocumentValidationConstraints;
}): DocumentExtractionResult {
  const descriptor = normalizeDocument(input.descriptor);
  const content: DocumentContent = input.content || { status: "placeholder" };
  const sections = detectDocumentSections(descriptor, content);
  const chunks = createDocumentChunks(descriptor, sections, input.chunkStrategy);
  const statistics = {
    ...calculateDocumentStatistics(content),
    sectionCount: sections.length,
    chunkCount: chunks.length
  };
  const validation = validateDocument(descriptor, content, input.constraints);

  return deepFreeze({
    descriptor,
    content,
    sections,
    chunks,
    statistics,
    validation,
    capabilities: defaultDocumentPipeline.capabilities,
    status: chunks.length ? "chunked" : content.status === "placeholder" ? "placeholder" : "normalized"
  });
}

export function createUnsupportedParserResult(descriptor: DocumentDescriptor): DocumentExtractionResult {
  const normalized = normalizeDocument(descriptor);
  const validation = validateDocument(normalized, { status: "placeholder" });
  return deepFreeze({
    descriptor: normalized,
    content: { status: "placeholder" },
    sections: [],
    chunks: [],
    statistics: { characterCount: 0, wordCount: 0, sectionCount: 0, chunkCount: 0 },
    validation: {
      valid: false,
      errors: [createError("unsupported_parser", "No parser implementation is connected for this document type.", "error", "parser")],
      warnings: validation.warnings
    },
    capabilities: defaultDocumentPipeline.capabilities,
    status: "placeholder"
  });
}
