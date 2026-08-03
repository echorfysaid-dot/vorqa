import {
  createPlaceholderExtractionResult,
  createUnsupportedParserResult,
  type DocumentCapability,
  type DocumentContent,
  type DocumentDescriptor,
  type DocumentError,
  type DocumentErrorCode,
  type DocumentExtractionResult,
  type DocumentType,
  normalizeDocument,
  validateDocument
} from "@/lib/document-intelligence";
import { parseConstructionDocument } from "@/lib/document-parser";

export type DocumentParserType =
  | "pdf"
  | "docx"
  | "txt"
  | "markdown"
  | "csv"
  | "spreadsheet"
  | "image"
  | "cad"
  | "bim";

export type DocumentParserStatus = "placeholder" | "prepared" | "deprecated";

export type DocumentParserErrorCode =
  | "parser_not_found"
  | "parser_deprecated"
  | "parser_type_mismatch"
  | "parser_capability_missing"
  | "parser_placeholder_only"
  | "unsupported_file"
  | "corrupted_document"
  | "ocr_unavailable"
  | "partial_extraction"
  | "unsupported_compression"
  | "metadata_only"
  | DocumentErrorCode;

export type DocumentParserError = Readonly<{
  code: DocumentParserErrorCode;
  message: string;
  severity: "warning" | "error";
  parserId?: string;
  field?: string;
}>;

export type DocumentParserValidationResult = Readonly<{
  valid: boolean;
  errors: readonly DocumentParserError[];
  warnings: readonly DocumentParserError[];
}>;

export type DocumentParserInput = Readonly<{
  descriptor: DocumentDescriptor;
  content?: DocumentContent;
}>;

export type NormalizedParserResult = Readonly<{
  parserId: string;
  parserType: DocumentParserType;
  descriptor: DocumentDescriptor;
  extraction: DocumentExtractionResult;
  validation: DocumentParserValidationResult;
  status: "placeholder" | "validated" | "unsupported";
  metadata: Readonly<{
    adapterVersion: "1.0";
    parsedAt: string;
    realParsingPerformed: boolean;
  }>;
}>;

export type DocumentParserAdapter = Readonly<{
  id: string;
  label: string;
  parserType: DocumentParserType;
  supportedTypes: readonly DocumentType[];
  supportedMimeTypes: readonly string[];
  supportedExtensions: readonly string[];
  capabilities: readonly DocumentCapability[];
  status: DocumentParserStatus;
  maxSizeBytes?: number;
  notes?: readonly string[];
  validate: (input: DocumentParserInput) => DocumentParserValidationResult;
  parse: (input: DocumentParserInput) => Promise<NormalizedParserResult>;
}>;

type ParserDefinition = Readonly<{
  id: string;
  label: string;
  parserType: DocumentParserType;
  supportedTypes: readonly DocumentType[];
  supportedMimeTypes: readonly string[];
  supportedExtensions: readonly string[];
  capabilities: readonly DocumentCapability[];
  status?: DocumentParserStatus;
  maxSizeBytes?: number;
  notes?: readonly string[];
}>;

const textCapabilities: readonly DocumentCapability[] = [
  "validation",
  "metadata_extraction",
  "normalization",
  "section_detection",
  "chunking",
  "text_extraction_placeholder"
];

const tableCapabilities: readonly DocumentCapability[] = [...textCapabilities, "table_extraction_placeholder"];

const binaryPlaceholderCapabilities: readonly DocumentCapability[] = ["validation", "metadata_extraction", "normalization"];

const parserDefinitions: readonly ParserDefinition[] = [
  {
    id: "parser.pdf.placeholder",
    label: "PDF Placeholder Parser",
    parserType: "pdf",
    supportedTypes: ["pdf", "report", "contract", "construction_specification", "drawing"],
    supportedMimeTypes: ["application/pdf"],
    supportedExtensions: ["pdf"],
    capabilities: textCapabilities,
    notes: ["Architecture only. No PDF text extraction is implemented."]
  },
  {
    id: "parser.docx.placeholder",
    label: "DOCX Placeholder Parser",
    parserType: "docx",
    supportedTypes: ["docx", "contract", "report", "meeting_minutes", "construction_specification"],
    supportedMimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    supportedExtensions: ["docx"],
    capabilities: textCapabilities,
    notes: ["Architecture only. No DOCX extraction is implemented."]
  },
  {
    id: "parser.txt.placeholder",
    label: "Text Placeholder Parser",
    parserType: "txt",
    supportedTypes: ["txt"],
    supportedMimeTypes: ["text/plain"],
    supportedExtensions: ["txt"],
    capabilities: textCapabilities
  },
  {
    id: "parser.markdown.placeholder",
    label: "Markdown Placeholder Parser",
    parserType: "markdown",
    supportedTypes: ["markdown"],
    supportedMimeTypes: ["text/markdown", "text/x-markdown"],
    supportedExtensions: ["md", "markdown"],
    capabilities: textCapabilities
  },
  {
    id: "parser.csv.placeholder",
    label: "CSV Placeholder Parser",
    parserType: "csv",
    supportedTypes: ["csv"],
    supportedMimeTypes: ["text/csv", "application/csv"],
    supportedExtensions: ["csv"],
    capabilities: tableCapabilities,
    notes: ["Architecture only. No CSV row extraction is implemented."]
  },
  {
    id: "parser.spreadsheet.placeholder",
    label: "Spreadsheet Placeholder Parser",
    parserType: "spreadsheet",
    supportedTypes: ["spreadsheet"],
    supportedMimeTypes: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    supportedExtensions: ["xls", "xlsx"],
    capabilities: tableCapabilities,
    notes: ["Architecture only. No workbook parsing is implemented."]
  },
  {
    id: "parser.image.placeholder",
    label: "Image Placeholder Parser",
    parserType: "image",
    supportedTypes: ["image"],
    supportedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
    supportedExtensions: ["png", "jpg", "jpeg", "webp"],
    capabilities: [...binaryPlaceholderCapabilities, "image_extraction_placeholder"],
    notes: ["Architecture only. No OCR or vision parsing is implemented."]
  },
  {
    id: "parser.cad.placeholder",
    label: "CAD Placeholder Parser",
    parserType: "cad",
    supportedTypes: ["cad", "drawing"],
    supportedMimeTypes: ["application/acad", "image/vnd.dwg", "application/dxf"],
    supportedExtensions: ["dwg", "dxf"],
    capabilities: [...binaryPlaceholderCapabilities, "cad_extraction_placeholder"],
    notes: ["Architecture only. No CAD parsing is implemented."]
  },
  {
    id: "parser.bim.placeholder",
    label: "BIM Placeholder Parser",
    parserType: "bim",
    supportedTypes: ["bim"],
    supportedMimeTypes: ["application/ifc", "application/octet-stream"],
    supportedExtensions: ["ifc", "rvt"],
    capabilities: [...binaryPlaceholderCapabilities, "bim_extraction_placeholder"],
    notes: ["Architecture only. No BIM parsing is implemented."]
  }
];

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const property of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[property];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function parserError(
  code: DocumentParserErrorCode,
  message: string,
  severity: "warning" | "error",
  parserId?: string,
  field?: string
): DocumentParserError {
  return { code, message, severity, parserId, field };
}

function fromDocumentError(error: DocumentError, parserId: string): DocumentParserError {
  return parserError(error.code, error.message, error.severity, parserId, error.field);
}

function normalizeExtension(name: string) {
  return name.toLowerCase().replace(/^\./, "");
}

function getDescriptorExtension(descriptor: DocumentDescriptor) {
  const name = descriptor.name.toLowerCase();
  if (!name.includes(".")) return undefined;
  return normalizeExtension(name.split(".").pop() || "");
}

function validateAdapterInput(definition: ParserDefinition, input: DocumentParserInput): DocumentParserValidationResult {
  const descriptor = normalizeDocument(input.descriptor);
  const documentValidation = validateDocument(descriptor, input.content, {
    maxSizeBytes: definition.maxSizeBytes,
    supportedTypes: definition.supportedTypes
  });
  const errors: DocumentParserError[] = documentValidation.errors.map((error) => fromDocumentError(error, definition.id));
  const warnings: DocumentParserError[] = documentValidation.warnings.map((warning) => fromDocumentError(warning, definition.id));
  const descriptorExtension = getDescriptorExtension(descriptor);

  if (definition.status === "deprecated") {
    errors.push(parserError("parser_deprecated", "Parser adapter is deprecated.", "error", definition.id));
  }
  if (!definition.supportedTypes.includes(descriptor.type)) {
    errors.push(parserError("parser_type_mismatch", "Parser does not support this document type.", "error", definition.id, "type"));
  }
  if (descriptor.mimeType && !definition.supportedMimeTypes.includes(descriptor.mimeType)) {
    warnings.push(parserError("invalid_metadata", "MIME type does not match parser metadata.", "warning", definition.id, "mimeType"));
  }
  if (descriptorExtension && !definition.supportedExtensions.includes(descriptorExtension)) {
    warnings.push(parserError("invalid_metadata", "File extension does not match parser metadata.", "warning", definition.id, "name"));
  }
  if ((definition.status || "placeholder") === "placeholder") {
    warnings.push(parserError("parser_placeholder_only", "Parser is a deterministic placeholder and does not read file bytes.", "warning", definition.id));
  }

  return deepFreeze({
    valid: errors.length === 0,
    errors,
    warnings
  });
}

function createPlaceholderAdapter(definition: ParserDefinition): DocumentParserAdapter {
  const adapter: DocumentParserAdapter = {
    ...definition,
    status: definition.status || "placeholder",
    validate: (input) => validateAdapterInput(definition, input),
    parse: async (input) => {
      const descriptor = normalizeDocument(input.descriptor);
      const validation = validateAdapterInput(definition, { ...input, descriptor });
      const extraction = validation.valid
        ? createPlaceholderExtractionResult({
            descriptor,
            content: input.content,
            constraints: {
              maxSizeBytes: definition.maxSizeBytes,
              supportedTypes: definition.supportedTypes
            }
          })
        : createUnsupportedParserResult(descriptor);

      return deepFreeze({
        parserId: definition.id,
        parserType: definition.parserType,
        descriptor,
        extraction,
        validation,
        status: validation.valid ? "placeholder" : "unsupported",
        metadata: {
          adapterVersion: "1.0",
          parsedAt: new Date(0).toISOString(),
          realParsingPerformed: false
        }
      });
    }
  };

  return deepFreeze(adapter);
}

export const documentParserRegistry: Readonly<Record<string, DocumentParserAdapter>> = deepFreeze(
  Object.fromEntries(parserDefinitions.map((definition) => [definition.id, createPlaceholderAdapter(definition)]))
);

export function getDocumentParserAdapter(parserId: string): DocumentParserAdapter | undefined {
  return documentParserRegistry[parserId];
}

export function getDocumentParserAdapters(): readonly DocumentParserAdapter[] {
  return Object.values(documentParserRegistry);
}

export function getParsersForType(type: DocumentType): readonly DocumentParserAdapter[] {
  return getDocumentParserAdapters().filter((adapter) => adapter.supportedTypes.includes(type) && adapter.status !== "deprecated");
}

export function getParsersForCapability(capability: DocumentCapability): readonly DocumentParserAdapter[] {
  return getDocumentParserAdapters().filter((adapter) => adapter.capabilities.includes(capability) && adapter.status !== "deprecated");
}

export function validateParserForDocument(parser: DocumentParserAdapter | undefined, input: DocumentParserInput): DocumentParserValidationResult {
  if (!parser) {
    return deepFreeze({
      valid: false,
      errors: [parserError("parser_not_found", "No parser adapter was found for this document.", "error")],
      warnings: []
    });
  }
  return parser.validate(input);
}

export function selectDocumentParser(input: DocumentParserInput): DocumentParserAdapter | undefined {
  const descriptor = normalizeDocument(input.descriptor);
  const candidates = getParsersForType(descriptor.type)
    .map((adapter) => ({
      adapter,
      validation: adapter.validate({ ...input, descriptor })
    }))
    .filter((candidate) => candidate.validation.valid);

  return candidates.sort((left, right) => left.adapter.id.localeCompare(right.adapter.id))[0]?.adapter;
}

export async function parseDocumentWithAdapter(input: DocumentParserInput & { parserId?: string }): Promise<NormalizedParserResult> {
  const parser = input.parserId ? getDocumentParserAdapter(input.parserId) : selectDocumentParser(input);
  const validation = validateParserForDocument(parser, input);
  if (!parser) {
    const descriptor = normalizeDocument(input.descriptor);
    return deepFreeze({
      parserId: "parser.none",
      parserType: "txt",
      descriptor,
      extraction: createUnsupportedParserResult(descriptor),
      validation,
      status: "unsupported",
      metadata: {
        adapterVersion: "1.0",
        parsedAt: new Date(0).toISOString(),
        realParsingPerformed: false
      }
    });
  }
  const normalizedText = input.content?.text;
  if (normalizedText || ["pdf", "docx", "txt", "markdown", "image"].includes(input.descriptor.type)) {
    const parsed = await parseConstructionDocument({
      filename: input.descriptor.name,
      mimeType: input.descriptor.mimeType,
      fileSize: input.descriptor.sizeBytes,
      text: normalizedText
    });
    if (parsed.document) {
      const descriptor = normalizeDocument(input.descriptor);
      const content: DocumentContent = {
        text: parsed.document.text,
        sections: parsed.document.sections.map((section) => ({
          id: section.id,
          title: section.title,
          order: section.order,
          type: "document",
          text: section.text,
          pageNumber: section.pageNumber
        })),
        tables: parsed.document.tables,
        status: parsed.document.text ? "normalized" : "placeholder"
      };
      const extraction = createPlaceholderExtractionResult({ descriptor, content });
      return deepFreeze({
        parserId: parser.id,
        parserType: parser.parserType,
        descriptor,
        extraction,
        validation: {
          valid: parsed.ok && validation.valid,
          errors: parsed.errors.map((error) => parserError(error.code, error.message, "error", parser.id)),
          warnings: [...validation.warnings, ...parsed.warnings.map((warning) => parserError(warning.code, warning.message, "warning", parser.id))]
        },
        status: parsed.ok ? "validated" : "placeholder",
        metadata: {
          adapterVersion: "1.0",
          parsedAt: new Date(0).toISOString(),
          realParsingPerformed: Boolean(parsed.document.text)
        }
      });
    }
  }
  return parser.parse(input);
}

export function hasParserCapability(parserId: string, capability: DocumentCapability): boolean {
  return Boolean(documentParserRegistry[parserId]?.capabilities.includes(capability));
}
