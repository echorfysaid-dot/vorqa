import type { KnowledgeEmbeddingStatus } from "@/types/knowledge";

export type EmbeddingProviderResult = Readonly<{
  status: KnowledgeEmbeddingStatus;
  embedding?: readonly number[];
  warnings: readonly string[];
}>;

export type EmbeddingProvider = Readonly<{
  id: string;
  label: string;
  status: KnowledgeEmbeddingStatus;
  dimensions: number;
  embed(text: string): Promise<EmbeddingProviderResult>;
}>;

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[key];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function tokenize(text: string) {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
}

function hashToken(token: string) {
  let hash = 2166136261;
  for (const char of token) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createDeterministicEmbedding(text: string, dimensions = 32): readonly number[] {
  const vector = Array.from({ length: dimensions }, () => 0);
  for (const token of tokenize(text)) {
    const hash = hashToken(token);
    const index = hash % dimensions;
    vector[index] += 1 + (token.length % 7) / 10;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return Object.freeze(vector.map((value) => Number((value / magnitude).toFixed(6))));
}

export function createFallbackEmbeddingProvider(dimensions = 32): EmbeddingProvider {
  return deepFreeze({
    id: "embedding.fallback.deterministic",
    label: "Deterministic fallback embeddings",
    status: "fallback",
    dimensions,
    async embed(text: string) {
      if (!text.trim()) {
        return deepFreeze({ status: "unavailable", warnings: ["Cannot embed empty text."] });
      }
      return deepFreeze({
        status: "fallback",
        embedding: createDeterministicEmbedding(text, dimensions),
        warnings: ["Using deterministic fallback embeddings until a production provider is configured."]
      });
    }
  });
}

export const unavailableEmbeddingProvider: EmbeddingProvider = deepFreeze({
  id: "embedding.unavailable",
  label: "Unavailable embedding provider",
  status: "unavailable",
  dimensions: 0,
  async embed() {
    return deepFreeze({
      status: "unavailable",
      warnings: ["Embedding provider is unavailable; semantic search will use lexical fallback."]
    });
  }
});

export const fallbackEmbeddingProvider = createFallbackEmbeddingProvider();
