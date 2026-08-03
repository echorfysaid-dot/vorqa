import type { ParsedConstructionDocument } from "@/lib/document-types";
import type { KnowledgeChunk } from "@/types/knowledge";

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "knowledge";
}

export function tokenizeKnowledgeText(text: string): readonly string[] {
  return Object.freeze(text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
}

export function countKnowledgeWords(text: string) {
  return tokenizeKnowledgeText(text).length;
}

export function cosineSimilarity(left?: readonly number[], right?: readonly number[]) {
  if (!left?.length || !right?.length || left.length !== right.length) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }
  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator ? Number((dot / denominator).toFixed(6)) : 0;
}

export function lexicalRelevance(query: string, text: string) {
  const queryTokens = new Set(tokenizeKnowledgeText(query));
  if (!queryTokens.size) return 0;
  const textTokens = new Set(tokenizeKnowledgeText(text));
  let matches = 0;
  for (const token of queryTokens) {
    if (textTokens.has(token)) matches += 1;
  }
  return Number((matches / queryTokens.size).toFixed(6));
}

export function createKnowledgeChunks(input: {
  projectId: string;
  document: ParsedConstructionDocument;
  maxChunkCharacters?: number;
  now?: Date;
}): readonly KnowledgeChunk[] {
  const maxChunkCharacters = Math.max(400, input.maxChunkCharacters || 900);
  const createdAt = (input.now || new Date(0)).toISOString();
  const sourceSections = input.document.sections.length
    ? input.document.sections
    : [{ id: `${input.document.id}:section:1`, title: input.document.filename, order: 1, text: input.document.text }];
  const chunks: KnowledgeChunk[] = [];

  for (const section of sourceSections) {
    const paragraphs = section.text.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
    let buffer = "";
    for (const paragraph of paragraphs.length ? paragraphs : [section.text]) {
      const next = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
      if (next.length > maxChunkCharacters && buffer) {
        chunks.push(createChunk(input, section.title, section.pageNumber, chunks.length, buffer, createdAt));
        buffer = paragraph;
      } else {
        buffer = next;
      }
    }
    if (buffer.trim()) chunks.push(createChunk(input, section.title, section.pageNumber, chunks.length, buffer, createdAt));
  }

  return Object.freeze(chunks);
}

function createChunk(
  input: { projectId: string; document: ParsedConstructionDocument },
  sectionTitle: string | undefined,
  pageNumber: number | undefined,
  chunkIndex: number,
  text: string,
  createdAt: string
): KnowledgeChunk {
  return Object.freeze({
    id: `${slug(input.projectId)}:${slug(input.document.id)}:chunk:${chunkIndex}`,
    projectId: input.projectId,
    documentId: input.document.id,
    chunkIndex,
    text,
    metadata: {
      filename: input.document.filename,
      mimeType: input.document.mimeType,
      documentType: input.document.type,
      language: input.document.language,
      sectionTitle,
      pageNumber,
      wordCount: countKnowledgeWords(text)
    },
    embeddingStatus: "unavailable",
    createdAt
  });
}
