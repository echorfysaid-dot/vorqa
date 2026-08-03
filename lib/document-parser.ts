import { normalizeParsedDocument, normalizeExtractedText } from "@/lib/document-normalizer";
import { documentExtension, inferMimeType, warning } from "@/lib/document-metadata";
import { unavailableOcrAdapter, type OcrAdapter } from "@/lib/ocr-adapter";
import type { DocumentParseInput, DocumentParseResult, ParsedDocumentWarning } from "@/lib/document-types";

const textDecoder = new TextDecoder("utf-8", { fatal: false });
const supportedExtensions = new Set(["txt", "md", "markdown", "pdf", "docx", "png", "jpg", "jpeg"]);

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[key];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function bytesFromBase64(value: string) {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(value, "base64"));
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesFromInput(input: DocumentParseInput) {
  if (input.bytes) return input.bytes;
  if (input.base64) return bytesFromBase64(input.base64);
  return new TextEncoder().encode(input.text || "");
}

function fail(code: ParsedDocumentWarning["code"], message: string): DocumentParseResult {
  const error = warning(code, message, "critical");
  return deepFreeze({ ok: false, status: "failed", warnings: [], errors: [error] });
}

function extractPdfText(bytes: Uint8Array) {
  const raw = Array.from(bytes).map((byte) => String.fromCharCode(byte)).join("");
  if (!raw.startsWith("%PDF")) return { text: "", pageCount: 1, warnings: [warning("corrupted_document", "PDF header was not found.", "critical")] };
  const pageCount = Math.max(1, (raw.match(/\/Type\s*\/Page\b/g) || []).length);
  const strings = [...raw.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)]
    .map((match) => match[0].replace(/\)\s*Tj$/, "").slice(1).replace(/\\([()\\])/g, "$1"))
    .filter(Boolean);
  const arrayStrings = [...raw.matchAll(/\[((?:.|\n)*?)\]\s*TJ/g)]
    .flatMap((match) => [...match[1].matchAll(/\((?:\\.|[^\\)])*\)/g)].map((item) => item[0].slice(1, -1).replace(/\\([()\\])/g, "$1")));
  const text = normalizeExtractedText([...strings, ...arrayStrings].join("\n"));
  const warnings = text ? [] : [warning("partial_extraction", "PDF parsing completed but no text operators were found.", "warning")];
  return { text, pageCount, warnings };
}

function findZipEntry(bytes: Uint8Array, name: string) {
  let offset = 0;
  while (offset < bytes.length - 30) {
    const signature = bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
    if (signature !== 0x04034b50) {
      offset += 1;
      continue;
    }
    const compression = bytes[offset + 8] | (bytes[offset + 9] << 8);
    const compressedSize = bytes[offset + 18] | (bytes[offset + 19] << 8) | (bytes[offset + 20] << 16) | (bytes[offset + 21] << 24);
    const filenameLength = bytes[offset + 26] | (bytes[offset + 27] << 8);
    const extraLength = bytes[offset + 28] | (bytes[offset + 29] << 8);
    const filename = textDecoder.decode(bytes.slice(offset + 30, offset + 30 + filenameLength));
    const dataStart = offset + 30 + filenameLength + extraLength;
    const data = bytes.slice(dataStart, dataStart + compressedSize);
    if (filename === name) {
      if (compression !== 0) return { compressed: true, data };
      return { compressed: false, data };
    }
    offset = dataStart + compressedSize;
  }
  return undefined;
}

function extractDocxText(bytes: Uint8Array) {
  const directXml = textDecoder.decode(bytes);
  const entry = findZipEntry(bytes, "word/document.xml");
  const warnings: ParsedDocumentWarning[] = [];
  let xml = "";
  if (entry?.compressed) {
    return { text: "", warnings: [warning("unsupported_compression", "DOCX uses compressed XML that is not available in this lightweight parser.", "warning")] };
  }
  if (entry) xml = textDecoder.decode(entry.data);
  else if (directXml.includes("<w:document")) xml = directXml;
  else return { text: "", warnings: [warning("corrupted_document", "DOCX document.xml was not found.", "critical")] };

  const paragraphs = [...xml.matchAll(/<w:t[^>]*>((?:.|\n)*?)<\/w:t>/g)]
    .map((match) => match[1].replace(/<[^>]+>/g, ""))
    .map((value) => value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\""))
    .filter(Boolean);
  const text = normalizeExtractedText(paragraphs.join("\n"));
  if (!text) warnings.push(warning("partial_extraction", "DOCX XML was found but no text runs were extracted.", "warning"));
  return { text, warnings };
}

export async function parseConstructionDocument(input: DocumentParseInput, options: { ocrAdapter?: OcrAdapter } = {}): Promise<DocumentParseResult> {
  if (!input.filename?.trim()) return fail("corrupted_document", "Document filename is required.");
  const extension = documentExtension(input.filename);
  const mimeType = inferMimeType(input);
  if (!supportedExtensions.has(extension) && !["text/plain", "text/markdown", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg", "image/jpg"].includes(mimeType)) {
    return fail("unsupported_file", "Unsupported construction document type.");
  }

  try {
    const bytes = bytesFromInput(input);
    const warnings: ParsedDocumentWarning[] = [];
    let text = input.text || "";
    let pageCount = 1;
    let confidence = 85;
    let parser = "txt";

    if (mimeType === "application/pdf" || extension === "pdf") {
      parser = "pdf";
      const extracted = extractPdfText(bytes);
      text = extracted.text || text;
      pageCount = extracted.pageCount;
      warnings.push(...extracted.warnings);
      confidence = text ? 72 : 20;
    } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || extension === "docx") {
      parser = "docx";
      const extracted = extractDocxText(bytes);
      text = extracted.text || text;
      warnings.push(...extracted.warnings);
      confidence = text ? 76 : 20;
    } else if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg"].includes(extension)) {
      parser = "ocr";
      const ocr = await (options.ocrAdapter || unavailableOcrAdapter).extractText({ filename: input.filename, mimeType, bytes });
      const document = normalizeParsedDocument({ source: { ...input, mimeType }, parser, bytes, text: ocr.text, ocr, warnings, confidence: ocr.confidence });
      return deepFreeze({ ok: Boolean(document.text), document, status: document.status, warnings: document.warnings, errors: document.status === "failed" ? document.warnings : [] });
    } else {
      parser = extension === "md" || extension === "markdown" ? "markdown" : "txt";
      text = text || textDecoder.decode(bytes);
      confidence = text ? 94 : 0;
    }

    const document = normalizeParsedDocument({ source: { ...input, mimeType }, parser, bytes, text, pageCount, warnings, confidence });
    return deepFreeze({ ok: document.status !== "failed", document, status: document.status, warnings: document.warnings, errors: document.status === "failed" ? document.warnings : [] });
  } catch (error) {
    return fail("corrupted_document", error instanceof Error ? error.message : "Document could not be parsed.");
  }
}

