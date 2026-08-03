import { inferParsedDocumentType, inferMimeType, countWords, detectLanguage, createDocumentMetadata, warning } from "@/lib/document-metadata";
import type { OcrResult } from "@/lib/ocr-adapter";
import type {
  DocumentParseInput,
  ParsedConstructionDocument,
  ParsedDocumentSection,
  ParsedDocumentTable,
  ParsedDocumentWarning
} from "@/lib/document-types";

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "document";
}

function cleanText(value: string) {
  return value.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

export function normalizeExtractedText(value: string) {
  return cleanText(value);
}

export function detectSections(filename: string, text: string): readonly ParsedDocumentSection[] {
  const cleaned = normalizeExtractedText(text);
  if (!cleaned) return Object.freeze([]);
  const blocks = cleaned.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length <= 1) {
    return Object.freeze([{ id: `${slug(filename)}:section:1`, title: filename, order: 1, text: cleaned }]);
  }
  return Object.freeze(blocks.map((block, index) => Object.freeze({
    id: `${slug(filename)}:section:${index + 1}`,
    title: block.split("\n")[0].slice(0, 80) || `Section ${index + 1}`,
    order: index + 1,
    text: block
  })));
}

export function extractMarkdownTables(text: string): readonly ParsedDocumentTable[] {
  const lines = text.split(/\r?\n/);
  const tables: ParsedDocumentTable[] = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!lines[index].includes("|") || !/^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) continue;
    const headers = lines[index].split("|").map((item) => item.trim()).filter(Boolean);
    const rows: Record<string, string>[] = [];
    let rowIndex = index + 2;
    while (rowIndex < lines.length && lines[rowIndex].includes("|")) {
      const cells = lines[rowIndex].split("|").map((item) => item.trim()).filter(Boolean);
      if (cells.length) {
        rows.push(Object.fromEntries(headers.map((header, headerIndex) => [header, cells[headerIndex] || ""])));
      }
      rowIndex += 1;
    }
    if (headers.length && rows.length) tables.push(Object.freeze({ id: `table-${tables.length + 1}`, rows }));
  }
  return Object.freeze(tables);
}

export function normalizeParsedDocument(input: {
  source: DocumentParseInput;
  parser: string;
  bytes: Uint8Array;
  text: string;
  pageCount?: number;
  warnings?: readonly ParsedDocumentWarning[];
  confidence?: number;
  ocr?: OcrResult;
}): ParsedConstructionDocument {
  const mimeType = inferMimeType(input.source);
  const text = normalizeExtractedText(input.text || input.ocr?.text || "");
  const warnings = [...(input.warnings || []), ...(input.ocr?.warnings || [])];
  if (!text) warnings.push(warning("empty_document", "No readable text was extracted from the document.", "warning"));
  const pageCount = Math.max(1, input.pageCount || Math.ceil(Math.max(1, text.length) / 2400));
  const confidence = typeof input.confidence === "number"
    ? input.confidence
    : text ? Math.min(95, Math.max(40, 60 + Math.min(30, countWords(text)))) : 0;

  return Object.freeze({
    id: `${slug(input.source.filename)}:${input.bytes.length}:${input.parser}`,
    filename: input.source.filename,
    mimeType,
    fileSize: input.source.fileSize ?? input.bytes.length,
    pageCount,
    language: detectLanguage(text),
    type: inferParsedDocumentType(input.source),
    text,
    sections: detectSections(input.source.filename, text),
    tables: extractMarkdownTables(text),
    metadata: createDocumentMetadata({ parser: input.parser, filename: input.source.filename, text, bytes: input.bytes }),
    warnings: Object.freeze(warnings),
    confidence,
    status: text ? (warnings.some((item) => item.code === "partial_extraction") ? "partial" : "success") : "failed"
  });
}

