import type { KnowledgeSearchResult } from "@/types/knowledge";
import type { VoraNormalizedIntelligenceResponse } from "@/lib/vora-intelligence-service";

export type CopilotMessageRole = "user" | "assistant" | "system";
export type CopilotRetrievalStatus = "success" | "empty" | "failed";
export type CopilotExecutionStatus = "success" | "failed";

export type CopilotSession = Readonly<{
  id: string;
  projectId: string;
  ownerId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}>;

export type CopilotMessage = Readonly<{
  id: string;
  sessionId: string;
  projectId: string;
  ownerId: string;
  role: CopilotMessageRole;
  content: string;
  createdAt: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type CopilotSource = Readonly<{
  documentId: string;
  filename: string;
  chunkId: string;
  sectionTitle?: string;
  relevanceScore: number;
  confidence: number;
}>;

export type CopilotPrompt = Readonly<{
  question: string;
  projectId: string;
  sourceContext: string;
  sources: readonly CopilotSource[];
  retrievalStatus: CopilotRetrievalStatus;
}>;

export type CopilotChatRequest = Readonly<{
  projectId: string;
  ownerId: string;
  sessionId?: string;
  question: string;
  provider?: "openai" | "mock" | "auto";
  limit?: number;
  now?: Date;
}>;

export type CopilotChatResponse = Readonly<{
  id: string;
  status: CopilotExecutionStatus;
  session: CopilotSession;
  answer: string;
  sources: readonly CopilotSource[];
  retrievalStatus: CopilotRetrievalStatus;
  confidence: number;
  warnings: readonly string[];
  history: readonly CopilotMessage[];
  runtime?: VoraNormalizedIntelligenceResponse;
}>;

export type CopilotKnowledgeRetrieval = Readonly<{
  status: CopilotRetrievalStatus;
  results: readonly KnowledgeSearchResult[];
  warnings: readonly string[];
}>;
