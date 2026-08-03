import type { AiNormalizedResponse } from "@/lib/ai-provider-adapter";

export type AiProviderCostTier = "free" | "low" | "medium" | "high" | "unknown";

const providerCostTier: Readonly<Record<string, AiProviderCostTier>> = {
  mock: "free",
  openai: "low",
  anthropic: "medium",
  gemini: "medium",
  openrouter: "unknown"
};

export function estimateTokensFromText(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function normalizeTokenUsage(response: AiNormalizedResponse | undefined, fallbackInputText = "") {
  const input = response?.usage.inputTokens ?? estimateTokensFromText(fallbackInputText);
  const output = response?.usage.outputTokens ?? estimateTokensFromText(response?.content || "");
  const total = response?.usage.totalTokens ?? input + output;
  return Object.freeze({ input, output, total });
}

export function estimateProviderCost(provider: string | undefined, totalTokens: number) {
  const tier = provider ? providerCostTier[provider] || "unknown" : "unknown";
  if (tier === "free") return 0;
  if (tier === "low") return Number((totalTokens * 0.0000004).toFixed(6));
  if (tier === "medium") return Number((totalTokens * 0.0000015).toFixed(6));
  if (tier === "high") return Number((totalTokens * 0.000004).toFixed(6));
  return undefined;
}

export function calculateProviderConfidence(input: {
  status: "success" | "failed";
  warnings: readonly string[];
  usedFallback: boolean;
  failoverCount: number;
}) {
  if (input.status === "failed") return 0;
  let confidence = 0.86;
  if (input.usedFallback) confidence -= 0.08;
  confidence -= Math.min(0.18, input.failoverCount * 0.06);
  confidence -= Math.min(0.12, input.warnings.length * 0.03);
  return Number(Math.max(0.4, confidence).toFixed(4));
}
