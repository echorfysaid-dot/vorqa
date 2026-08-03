import {
  assembleCopilotPrompt,
  createCopilotApplicationContext,
  createCopilotMemorySnapshot,
  renderCopilotRuntimeRequest
} from "@/lib/copilot-context";
import { appendMessage, createSession, loadHistory } from "@/lib/copilot-session";
import { knowledgeEngine } from "@/lib/knowledge-engine";
import { executeVoraIntelligenceSafe } from "@/lib/vora-intelligence-service";
import type { CopilotChatRequest, CopilotChatResponse, CopilotKnowledgeRetrieval } from "@/types/copilot";

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[key];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function confidenceFromSources(sources: readonly { confidence: number; relevanceScore: number }[]) {
  if (!sources.length) return 0.35;
  const average = sources.reduce((sum, source) => sum + (source.confidence + source.relevanceScore) / 2, 0) / sources.length;
  return Number(Math.min(0.95, Math.max(0.35, average)).toFixed(4));
}

async function retrieveKnowledge(input: { projectId: string; question: string; limit?: number }): Promise<CopilotKnowledgeRetrieval> {
  try {
    const searched = await knowledgeEngine.search({ projectId: input.projectId, query: input.question, limit: input.limit || 4 });
    return deepFreeze({
      status: searched.status === "success" ? "success" : searched.status === "empty" ? "empty" : "failed",
      results: searched.results,
      warnings: searched.warnings
    });
  } catch (error) {
    return deepFreeze({
      status: "failed",
      results: [],
      warnings: [error instanceof Error ? error.message : "Knowledge retrieval failed."]
    });
  }
}

function fallbackAnswer(question: string, status: CopilotKnowledgeRetrieval["status"]) {
  if (status === "empty") {
    return `I could not find relevant indexed project documents for: "${question}". Upload or index the related documents, then ask again.`;
  }
  return "Project knowledge retrieval is currently unavailable, so I cannot provide a grounded answer from your documents.";
}

export async function executeCopilotChat(request: CopilotChatRequest): Promise<CopilotChatResponse> {
  const now = request.now || new Date();
  const question = request.question.trim();
  const session = createSession({
    projectId: request.projectId,
    ownerId: request.ownerId,
    sessionId: request.sessionId,
    title: question.slice(0, 80) || "VORA Copilot",
    now
  });

  if (!question) {
    return deepFreeze({
      id: `copilot_error_${now.toISOString().replace(/[^0-9]/g, "")}`,
      status: "failed",
      session,
      answer: "A question is required.",
      sources: [],
      retrievalStatus: "failed",
      confidence: 0,
      warnings: ["Copilot question is empty."],
      history: loadHistory({ sessionId: session.id, projectId: request.projectId, ownerId: request.ownerId })
    });
  }

  appendMessage({ sessionId: session.id, projectId: request.projectId, ownerId: request.ownerId, role: "user", content: question, now });
  const retrieval = await retrieveKnowledge({ projectId: request.projectId, question, limit: request.limit });
  const prompt = assembleCopilotPrompt({
    projectId: request.projectId,
    question,
    results: retrieval.results,
    retrievalStatus: retrieval.status
  });

  const context = createCopilotApplicationContext({ projectId: request.projectId, now });
  const memory = createCopilotMemorySnapshot({
    projectId: request.projectId,
    sessionId: session.id,
    messageCount: loadHistory({ sessionId: session.id, projectId: request.projectId, ownerId: request.ownerId }).length,
    now
  });
  const runtime = retrieval.status === "success"
    ? await executeVoraIntelligenceSafe({
        userRequest: renderCopilotRuntimeRequest(prompt),
        taskIntent: "document_review",
        provider: request.provider || "auto",
        projectId: request.projectId,
        context,
        memory,
        now
      })
    : undefined;

  const answer = runtime?.content || fallbackAnswer(question, retrieval.status);
  const assistant = appendMessage({
    sessionId: session.id,
    projectId: request.projectId,
    ownerId: request.ownerId,
    role: "assistant",
    content: answer,
    metadata: {
      retrievalStatus: retrieval.status,
      sources: prompt.sources
    },
    now
  });

  return deepFreeze({
    id: assistant.id,
    status: runtime && runtime.status !== "success" ? "failed" : "success",
    session,
    answer,
    sources: prompt.sources,
    retrievalStatus: retrieval.status,
    confidence: confidenceFromSources(prompt.sources),
    warnings: [
      ...retrieval.warnings,
      ...(runtime?.warnings.map((warning) => warning.message) || []),
      ...(prompt.sources.length ? [] : ["No relevant indexed knowledge was found for this question."])
    ],
    history: loadHistory({ sessionId: session.id, projectId: request.projectId, ownerId: request.ownerId }),
    runtime
  });
}

export async function executeCopilotChatSafe(request: CopilotChatRequest): Promise<CopilotChatResponse> {
  try {
    return await executeCopilotChat(request);
  } catch (error) {
    const now = request.now || new Date();
    const session = createSession({ projectId: request.projectId, ownerId: request.ownerId, sessionId: request.sessionId, now });
    return deepFreeze({
      id: `copilot_error_${now.toISOString().replace(/[^0-9]/g, "")}`,
      status: "failed",
      session,
      answer: "VORA Copilot could not complete this request safely.",
      sources: [],
      retrievalStatus: "failed",
      confidence: 0,
      warnings: [error instanceof Error ? error.message : "Copilot execution failed."],
      history: loadHistory({ sessionId: session.id, projectId: request.projectId, ownerId: request.ownerId })
    });
  }
}
