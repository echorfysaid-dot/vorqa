import type { AiTaskIntent } from "@/lib/ai-prompt-builder";

export type AiCapabilityId =
  | "text_generation"
  | "structured_output"
  | "json_output"
  | "streaming"
  | "vision"
  | "tool_calling"
  | "long_context"
  | "multilingual"
  | "reasoning"
  | "document_analysis";

export type AiCapabilityDescriptor = Readonly<{
  id: AiCapabilityId;
  label: string;
  description: string;
  runtimeImplemented: boolean;
  notes?: string;
}>;

export const aiCapabilityRegistry: Readonly<Record<AiCapabilityId, AiCapabilityDescriptor>> = {
  text_generation: {
    id: "text_generation",
    label: "Text generation",
    description: "Generates text from structured prompt messages.",
    runtimeImplemented: true
  },
  structured_output: {
    id: "structured_output",
    label: "Structured output",
    description: "Can follow requested structure such as sections, lists, and tables.",
    runtimeImplemented: true
  },
  json_output: {
    id: "json_output",
    label: "JSON output",
    description: "Can be asked to produce JSON-compatible output.",
    runtimeImplemented: false,
    notes: "Registry metadata only; no enforced JSON schema execution is connected yet."
  },
  streaming: {
    id: "streaming",
    label: "Streaming",
    description: "Can stream partial output.",
    runtimeImplemented: false,
    notes: "Existing generation route remains non-streaming."
  },
  vision: {
    id: "vision",
    label: "Vision",
    description: "Can accept image input.",
    runtimeImplemented: false
  },
  tool_calling: {
    id: "tool_calling",
    label: "Tool calling",
    description: "Can call external tools under orchestration.",
    runtimeImplemented: false
  },
  long_context: {
    id: "long_context",
    label: "Long context",
    description: "Can process larger prompt contexts.",
    runtimeImplemented: false,
    notes: "Context windows are descriptive metadata until runtime integration is added."
  },
  multilingual: {
    id: "multilingual",
    label: "Multilingual",
    description: "Supports Arabic, French, and English generation preferences.",
    runtimeImplemented: true
  },
  reasoning: {
    id: "reasoning",
    label: "Reasoning",
    description: "Suitable for planning, comparison, and analysis tasks.",
    runtimeImplemented: true
  },
  document_analysis: {
    id: "document_analysis",
    label: "Document analysis",
    description: "Prepared metadata for future document intelligence.",
    runtimeImplemented: false
  }
};

export const aiTaskIntentCapabilityHints: Readonly<Record<AiTaskIntent, readonly AiCapabilityId[]>> = {
  general_assistance: ["text_generation", "multilingual"],
  summarize: ["text_generation", "structured_output"],
  analyze: ["text_generation", "structured_output", "reasoning"],
  generate_report: ["text_generation", "structured_output", "reasoning"],
  extract_actions: ["text_generation", "structured_output"],
  explain: ["text_generation", "reasoning"],
  compare: ["text_generation", "structured_output", "reasoning"],
  plan: ["text_generation", "structured_output", "reasoning"]
};

export function isAiCapabilityId(value: string): value is AiCapabilityId {
  return value in aiCapabilityRegistry;
}
