import { inferDocumentType, type DocumentLanguage } from "@/lib/document-intelligence";
import type { DocumentParseInput, ParsedDocumentMetadata, ParsedDocumentWarning } from "@/lib/document-types";

export function documentExtension(filename: string) {
  const lower = filename.toLowerCase();
  return lower.includes(".") ? lower.split(".").pop() || "" : "";
}

export function inferMimeType(input: Pick<DocumentParseInput, "filename" | "mimeType">) {
  if (input.mimeType?.trim()) return input.mimeType.trim().toLowerCase();
  const extension = documentExtension(input.filename);
  const map: Record<string, string> = {
    txt: "text/plain",
    md: "text/markdown",
    markdown: "text/markdown",
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg"
  };
  return map[extension] || "application/octet-stream";
}

export function inferParsedDocumentType(input: Pick<DocumentParseInput, "filename" | "mimeType">) {
  return inferDocumentType({ mimeType: inferMimeType(input), name: input.filename });
}

export function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

export function detectLanguage(text: string): DocumentLanguage {
  const sample = text.slice(0, 4000);
  const arabic = /[\u0600-\u06FF]/.test(sample);
  const latin = /[A-Za-z]/.test(sample);
  const frenchSignals = /\b(le|la|les|des|travaux|chantier|devis|contrat|rapport)\b/i.test(sample);
  if (arabic && latin) return "mixed";
  if (arabic) return "ar";
  if (frenchSignals) return "fr";
  if (latin) return "en";
  return "unknown";
}

export function checksum(bytes: Uint8Array) {
  let hash = 2166136261;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createDocumentMetadata(input: {
  parser: string;
  filename: string;
  text: string;
  bytes: Uint8Array;
  title?: string;
  author?: string;
}): ParsedDocumentMetadata {
  return Object.freeze({
    title: input.title || input.filename.replace(/\.[^.]+$/, ""),
    author: input.author,
    extension: documentExtension(input.filename),
    parser: input.parser,
    checksum: checksum(input.bytes),
    wordCount: countWords(input.text),
    characterCount: input.text.length
  });
}

export function warning(code: ParsedDocumentWarning["code"], message: string, severity: ParsedDocumentWarning["severity"] = "warning"): ParsedDocumentWarning {
  return Object.freeze({ code, message, severity });
}

