import { createAiApplicationContext } from "@/lib/ai-context";
import { createAiMemory } from "@/lib/ai-memory";
import type { CopilotPrompt, CopilotSource } from "@/types/copilot";
import type { KnowledgeSearchResult } from "@/types/knowledge";

export function createCopilotApplicationContext(input: { projectId: string; now?: Date }) {
  return createAiApplicationContext({
    pathname: `/projects/${input.projectId}`,
    searchParams: new URLSearchParams("workspace=copilot"),
    language: "ar",
    direction: "rtl",
    theme: "dark",
    isAuthenticated: true,
    now: input.now || new Date()
  });
}

export function createCopilotMemorySnapshot(input: { projectId: string; sessionId: string; messageCount: number; now?: Date }) {
  const context = createCopilotApplicationContext({ projectId: input.projectId, now: input.now });
  const now = input.now || new Date();
  return createAiMemory({
    context,
    session: {
      sessionId: input.sessionId,
      startedAt: now.toISOString()
    },
    conversation: {
      title: "VORA Project Copilot",
      messageCount: input.messageCount,
      lastInteractionAt: now.toISOString()
    },
    now
  });
}

export function sourceFromSearchResult(result: KnowledgeSearchResult): CopilotSource {
  return Object.freeze({
    documentId: result.sourceDocument.id,
    filename: result.sourceDocument.filename,
    chunkId: result.chunk.id,
    sectionTitle: result.metadata.sectionTitle,
    relevanceScore: result.relevanceScore,
    confidence: result.confidence
  });
}

export function assembleCopilotPrompt(input: {
  projectId: string;
  question: string;
  results: readonly KnowledgeSearchResult[];
  retrievalStatus: CopilotPrompt["retrievalStatus"];
  maxChunks?: number;
}): CopilotPrompt {
  const selected = input.results.slice(0, Math.max(1, Math.min(6, input.maxChunks || 4)));
  const sources = selected.map(sourceFromSearchResult);
  const sourceContext = selected
    .map((result, index) => [
      `Source ${index + 1}: ${result.sourceDocument.filename}`,
      result.metadata.sectionTitle ? `Section: ${result.metadata.sectionTitle}` : undefined,
      `Relevance: ${result.relevanceScore}`,
      result.chunk.text.slice(0, 1200)
    ].filter(Boolean).join("\n"))
    .join("\n\n---\n\n");

  return Object.freeze({
    question: input.question,
    projectId: input.projectId,
    sourceContext,
    sources,
    retrievalStatus: input.retrievalStatus
  });
}

export function renderCopilotRuntimeRequest(prompt: CopilotPrompt) {
  if (prompt.retrievalStatus !== "success" || !prompt.sourceContext.trim()) {
    return [
      "You are VORA Copilot for a construction project.",
      "No relevant indexed project knowledge was found.",
      "Answer by stating that project documents do not currently contain enough indexed information. Do not invent project facts.",
      "",
      `User question: ${prompt.question}`
    ].join("\n");
  }

  return [
    "You are VORA Copilot for a construction project.",
    "Answer using only the retrieved project document excerpts below.",
    "If the excerpts are insufficient, say what is missing. Do not invent project facts.",
    "Cite the source filenames in the answer.",
    "",
    "Retrieved project excerpts:",
    prompt.sourceContext,
    "",
    `User question: ${prompt.question}`
  ].join("\n");
}
