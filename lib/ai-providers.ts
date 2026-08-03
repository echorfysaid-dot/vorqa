import { createMockOutput } from "@/lib/mock-ai";
import { getTool, type ToolSlug } from "@/lib/tools";
import type { VoraProjectContext } from "@/lib/ai-context-repository";
import { createAiApplicationContext, type AiApplicationContext } from "@/lib/ai-context";
import { createAiMemory } from "@/lib/ai-memory";
import { createAiPromptPayload, type AiOutputPreferences, type AiTaskIntent } from "@/lib/ai-prompt-builder";
import {
  AiOrchestrationError,
  createAiExecutionPlan,
  type AiExecutionPlan,
  type AiProviderAvailability
} from "@/lib/ai-orchestrator";
import { getAiModelDescriptor } from "@/lib/ai-model-registry";
import { composeVoraPrompt } from "@/lib/vora-prompt-composer";
import { aiSecurityPolicy, redactSensitiveText } from "@/lib/security";

export type AiProvider = "openai" | "anthropic" | "gemini" | "openrouter" | "mock";

export type ProjectAiContext = VoraProjectContext & {
  history?: Array<{
    tool: string;
    prompt: Record<string, unknown>;
    output: string;
    provider?: string;
    created_at?: string;
  }>;
  previousOutputs?: string[];
};

export type PromptSnapshot = {
  instructions: string;
  input: string;
  contextSummary: string;
};

export type ExportSnapshot = {
  markdown: string;
  copy: string;
  planned: Array<"pdf" | "docx">;
};

export type GenerateRequest = {
  tool: ToolSlug;
  payload: Record<string, string>;
  provider?: AiProvider;
  context?: ProjectAiContext;
};

export type GenerateResult = {
  provider: AiProvider;
  output: string;
  model: string;
  timestamp: string;
  usage?: Record<string, unknown>;
  fallback?: boolean;
  prompt?: PromptSnapshot;
  exports?: ExportSnapshot;
};

export class AiGenerationError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = "AI_GENERATION_FAILED") {
    super(message);
    this.name = "AiGenerationError";
    this.status = status;
    this.code = code;
  }
}

export const aiProviders = {
  openai: {
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    modelEnvKey: "OPENAI_MODEL",
    defaultModel: "gpt-4o-mini"
  },
  anthropic: {
    label: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    modelEnvKey: "ANTHROPIC_MODEL",
    defaultModel: "claude-3-5-sonnet-latest"
  },
  gemini: {
    label: "Google Gemini",
    envKey: "GEMINI_API_KEY",
    modelEnvKey: "GEMINI_MODEL",
    defaultModel: "gemini-1.5-pro"
  },
  openrouter: {
    label: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    modelEnvKey: "OPENROUTER_MODEL",
    defaultModel: "openai/gpt-4o-mini"
  }
} as const;

const openAiResponsesEndpoint = "https://api.openai.com/v1/responses";

function hasOpenAiKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function resolveProvider(requested?: AiProvider): AiProvider {
  if (requested === "mock") return "mock";
  if (hasOpenAiKey()) return "openai";
  return "mock";
}

export async function generateAiOutput({ tool, payload, provider, context }: GenerateRequest): Promise<GenerateResult> {
  const timestamp = new Date().toISOString();
  const prompt = buildPromptSnapshot(tool, payload, context);
  const runtime = createGenerationRuntime({ tool, payload, provider, context, prompt, timestamp });
  const selected = runtime.plan.provider as AiProvider;

  if (selected === "mock") {
    const output = createMockOutput(tool, payload);
    return normalizeGenerateResultWithPlan(
      {
        provider: "mock",
        model: runtime.plan.model,
        timestamp,
        output,
        fallback: true,
        prompt,
        exports: buildExportSnapshot(output)
      },
      runtime.plan
    );
  }

  if (selected !== "openai") {
    throw new AiGenerationError("مزود الذكاء الاصطناعي المحدد غير متصل بعد في بيئة التشغيل الحالية.", 503, "AI_PROVIDER_NOT_CONNECTED");
  }

  return normalizeGenerateResultWithPlan(await generateOpenAi(tool, payload, timestamp, prompt, resolveExecutableModel(runtime.plan)), runtime.plan);
}

function createGenerationRuntime({
  tool,
  payload,
  provider,
  context,
  prompt,
  timestamp
}: {
  tool: ToolSlug;
  payload: Record<string, string>;
  provider?: AiProvider;
  context?: ProjectAiContext;
  prompt: PromptSnapshot;
  timestamp: string;
}) {
  try {
    const applicationContext = buildRuntimeApplicationContext({ tool, payload, context, timestamp });
    const memory = createAiMemory({
      context: applicationContext,
      session: {
        sessionId: `ai-generation:${timestamp}`,
        startedAt: timestamp
      },
      conversation: {
        title: prompt.contextSummary || getTool(tool)?.title || tool,
        messageCount: context?.history?.length || context?.memory?.length || 0,
        lastInteractionAt: timestamp
      },
      referencedDocumentIds: collectDocumentReferences(context),
      now: new Date(timestamp)
    });
    const promptPayload = createAiPromptPayload({
      context: applicationContext,
      memory,
      userRequest: buildRuntimeUserRequest(tool, payload, prompt),
      taskIntent: inferTaskIntent(tool, payload),
      outputPreferences: buildRuntimeOutputPreferences(payload)
    });
    const plan = createAiExecutionPlan({
      prompt: promptPayload,
      availableProviders: resolveRuntimeAvailability(provider),
      availableModels: resolveRuntimeModelAvailability(),
      options: {
        providerPreference: provider || "auto",
        modelPreference: resolveRuntimeModelPreference(provider),
        policyId: provider === "mock" ? "mock_only" : "balanced",
        responseFormat: promptPayload.outputPreferences.responseFormat,
        metadata: {
          tool,
          workspace: applicationContext.workspace.type,
          route: applicationContext.route.pathname
        }
      }
    });

    // Build the neutral provider request now so adapter mapping is part of the runtime path.
    plan.adapter.toProviderRequest(plan.providerRequest);

    return { applicationContext, memory, promptPayload, plan };
  } catch (error) {
    if (error instanceof AiOrchestrationError) {
      throw mapOrchestrationError(error);
    }
    throw error;
  }
}

function normalizeGenerateResultWithPlan(result: GenerateResult, plan: AiExecutionPlan): GenerateResult {
  const normalized = plan.adapter.normalizeResponse({
    content: result.output,
    provider: plan.provider,
    model: result.model || plan.model,
    finishReason: "stop",
    usage: result.usage
      ? {
          inputTokens: typeof result.usage.inputTokens === "number" ? result.usage.inputTokens : undefined,
          outputTokens: typeof result.usage.outputTokens === "number" ? result.usage.outputTokens : undefined,
          totalTokens: typeof result.usage.totalTokens === "number" ? result.usage.totalTokens : undefined
        }
      : undefined,
    warnings: plan.warnings
  });

  return {
    ...result,
    provider: normalized.provider as AiProvider,
    model: normalized.model,
    output: normalized.content
  };
}

function resolveRuntimeAvailability(requested?: AiProvider): AiProviderAvailability {
  const openai = hasOpenAiKey();
  return {
    openai,
    anthropic: false,
    gemini: false,
    openrouter: false,
    mock: requested === "mock" || (!requested && !openai)
  };
}

function resolveRuntimeModelAvailability() {
  const configuredOpenAiModel = process.env.OPENAI_MODEL?.trim();
  return {
    "gpt-4o-mini": hasOpenAiKey(),
    "gpt-4o": hasOpenAiKey(),
    "gpt-4.1-mini": hasOpenAiKey(),
    "mock-vora-local": true,
    ...(configuredOpenAiModel && getAiModelDescriptor(configuredOpenAiModel) ? { [configuredOpenAiModel]: hasOpenAiKey() } : {})
  };
}

function resolveRuntimeModelPreference(provider?: AiProvider) {
  if (provider === "mock") return "mock-vora-local";
  const configuredOpenAiModel = process.env.OPENAI_MODEL?.trim();
  return configuredOpenAiModel && getAiModelDescriptor(configuredOpenAiModel) ? configuredOpenAiModel : undefined;
}

function resolveExecutableModel(plan: AiExecutionPlan) {
  const configuredOpenAiModel = process.env.OPENAI_MODEL?.trim();
  if (plan.provider === "openai" && configuredOpenAiModel) return configuredOpenAiModel;
  return plan.model;
}

function buildRuntimeApplicationContext({
  tool,
  payload,
  context,
  timestamp
}: {
  tool: ToolSlug;
  payload: Record<string, string>;
  context?: ProjectAiContext;
  timestamp: string;
}): AiApplicationContext {
  const projectId = extractContextId(context?.project, ["id", "code", "slug"]) || payload.projectId;
  const organizationId = extractContextId(context?.organization, ["id", "slug"]) || "atlas";
  const searchParams = new URLSearchParams();
  if (projectId) searchParams.set("projectId", projectId);
  if (organizationId) searchParams.set("organizationId", organizationId);

  const aiContext = createAiApplicationContext({
    pathname: `/tools/${tool}`,
    searchParams,
    language: normalizePromptLanguage(payload.language),
    direction: normalizePromptLanguage(payload.language) === "ar" ? "rtl" : "ltr",
    theme: "dark",
    isAuthenticated: true,
    now: new Date(timestamp)
  });

  return {
    ...aiContext,
    organization: organizationId ? { id: organizationId, slug: organizationId, label: getContextLabel(context?.organization) || organizationId } : aiContext.organization,
    project: projectId ? { id: projectId, slug: projectId, label: getContextLabel(context?.project) || projectId } : aiContext.project
  };
}

function buildRuntimeUserRequest(tool: ToolSlug, payload: Record<string, string>, prompt: PromptSnapshot) {
  const selectedTool = getTool(tool);
  const fields = Object.entries(payload)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `${key}: ${value.trim()}`)
    .join("\n");

  return [
    `Tool: ${selectedTool?.title || tool}`,
    `Context summary: ${prompt.contextSummary}`,
    "Current inputs:",
    fields || "No fields provided.",
    "",
    "Legacy execution prompt:",
    prompt.input
  ].join("\n");
}

function buildRuntimeOutputPreferences(payload: Record<string, string>): AiOutputPreferences {
  return {
    language: normalizePromptLanguage(payload.language),
    tone: normalizePromptTone(payload.tone || payload.style),
    responseFormat: "markdown",
    verbosity: "standard",
    includeSources: false,
    includeRecommendations: true
  };
}

function inferTaskIntent(tool: ToolSlug, payload: Record<string, string>): AiTaskIntent {
  const documentType = `${payload.documentType || ""} ${payload.goal || ""}`.toLowerCase();
  if (tool === "business-idea") return "plan";
  if (tool === "landing-page" || tool === "marketing") return "generate_report";
  if (documentType.includes("summary") || documentType.includes("ملخص")) return "summarize";
  if (documentType.includes("report") || documentType.includes("تقرير")) return "generate_report";
  return "general_assistance";
}

function normalizePromptLanguage(value?: string) {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("fran") || normalized.includes("francais") || normalized.includes("franÃ§ais")) return "fr";
  if (normalized.includes("english")) return "en";
  return "ar";
}

function normalizePromptTone(value?: string): AiOutputPreferences["tone"] {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("formal") || normalized.includes("رسمي")) return "formal";
  if (normalized.includes("friendly") || normalized.includes("ودود")) return "friendly";
  if (normalized.includes("technical") || normalized.includes("تقني")) return "technical";
  if (normalized.includes("executive") || normalized.includes("تنفيذي")) return "executive";
  return "professional";
}

function extractContextId(value: unknown, keys: string[]) {
  if (!value || typeof value !== "object") return undefined;
  for (const key of keys) {
    const entry = (value as Record<string, unknown>)[key];
    if (typeof entry === "string" && entry.trim()) return entry.trim();
  }
  return undefined;
}

function getContextLabel(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  for (const key of ["name", "title", "label"]) {
    const entry = (value as Record<string, unknown>)[key];
    if (typeof entry === "string" && entry.trim()) return entry.trim();
  }
  return undefined;
}

function collectDocumentReferences(context?: ProjectAiContext) {
  const documents = Array.isArray(context?.documents) ? context.documents : [];
  return documents
    .map((document) => extractContextId(document, ["id", "documentId", "storagePath"]))
    .filter((value): value is string => Boolean(value))
    .slice(0, 12);
}

function mapOrchestrationError(error: AiOrchestrationError): AiGenerationError {
  if (error.category === "provider_unavailable") {
    return new AiGenerationError("مزود الذكاء الاصطناعي المطلوب غير متاح حالياً. تحقق من الإعدادات أو اختر الوضع التجريبي.", 503, "AI_PROVIDER_UNAVAILABLE");
  }
  if (error.category === "invalid_request") {
    return new AiGenerationError("طلب الذكاء الاصطناعي غير صالح. راجع الإعدادات وحاول مرة أخرى.", 400, "AI_ORCHESTRATION_INVALID_REQUEST");
  }
  return new AiGenerationError("تعذر تجهيز طلب الذكاء الاصطناعي حالياً. حاول مرة أخرى.", 500, "AI_ORCHESTRATION_FAILED");
}

function buildPromptSnapshot(tool: ToolSlug, payload: Record<string, string>, context?: ProjectAiContext): PromptSnapshot {
  return composeVoraPrompt(tool, payload, context);
}

function buildExportSnapshot(output: string): ExportSnapshot {
  return {
    markdown: output,
    copy: output,
    planned: ["pdf", "docx"]
  };
}

type OpenAIConstructor = new (options: { apiKey: string; timeout?: number; maxRetries?: number }) => {
  responses: {
    create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
};

function safeJson(value: unknown) {
  try {
    return redactSensitiveText(JSON.stringify(value, null, 2));
  } catch {
    return redactSensitiveText(String(value));
  }
}

function logOpenAiRequest({
  model,
  endpoint,
  transport,
  payload
}: {
  model: string;
  endpoint: string;
  transport: "sdk" | "rest";
  payload: Record<string, unknown>;
}) {
  console.info("[VORA OpenAI] request", {
    transport,
    endpoint,
    model,
    payload: {
      model,
      instructionsLength: typeof payload.instructions === "string" ? payload.instructions.length : 0,
      inputLength: typeof payload.input === "string" ? payload.input.length : 0,
      maxOutputTokens: payload.max_output_tokens
    }
  });
}

function logOpenAiResponse({
  endpoint,
  status,
  body
}: {
  endpoint: string;
  status: number | string;
  body: unknown;
}) {
  const error = body && typeof body === "object" ? (body as { error?: { code?: unknown; type?: unknown; message?: unknown } }).error : undefined;
  console.info("[VORA OpenAI] response", {
    endpoint,
    httpStatus: status,
    errorCode: error?.code ?? null,
    errorType: error?.type ?? null,
    errorMessage: error?.message ?? null,
    body: safeJson(body)
  });
}

function stringifySdkError(error: unknown) {
  const raw = JSON.stringify(error, null, 2);
  if (raw && raw !== "{}") return raw;
  const value = error as {
    status?: number;
    code?: string;
    type?: string;
    message?: string;
    error?: unknown;
    response?: unknown;
  };
  return JSON.stringify(
    {
      status: value.status ?? null,
      code: value.code ?? null,
      type: value.type ?? null,
      message: value.message ?? null,
      error: value.error ?? null,
      response: value.response ?? null
    },
    null,
    2
  );
}

function printVoraOpenAiError({
  status,
  code,
  type,
  message,
  body
}: {
  status: unknown;
  code: unknown;
  type: unknown;
  message: unknown;
  body: unknown;
}) {
  console.error("=========================");
  console.error("[VORA OPENAI ERROR]");
  console.error("status:", status ?? "");
  console.error("code:", code ?? "");
  console.error("type:", type ?? "");
  console.error("message:", message ?? "");
  console.error("body:", typeof body === "string" ? body : safeJson(body));
  console.error("=========================");
}

async function loadOpenAiSdk(): Promise<OpenAIConstructor | null> {
  try {
    const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<Record<string, unknown>>;
    const mod = await dynamicImport("openai");
    const OpenAI = (mod.default || mod.OpenAI) as OpenAIConstructor | undefined;
    if (!OpenAI) throw new Error("OpenAI export not found.");
    return OpenAI;
  } catch {
    return null;
  }
}

function extractOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const output = Array.isArray(response.output) ? response.output : [];
  const text = output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((content) => {
      if (!content || typeof content !== "object") return "";
      const value = (content as { text?: unknown }).text;
      return typeof value === "string" ? value : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();

  return text;
}

function mapOpenAiError(error: unknown): AiGenerationError {
  const value = error as { status?: number; code?: string; message?: string; error?: { code?: string; message?: string } };
  const status = value.status || 500;
  const code = value.code || value.error?.code || "OPENAI_ERROR";
  const message = value.message || value.error?.message || "";

  if (status === 401 || status === 403) {
    return new AiGenerationError("تعذر الاتصال بـ OpenAI. تحقق من صحة مفتاح API على الخادم.", 502, "OPENAI_AUTH_FAILED");
  }

  if (status === 429) {
    const insufficient = code.toLowerCase().includes("quota") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("credit");
    return new AiGenerationError(
      insufficient ? "رصيد OpenAI غير كاف لإكمال التوليد حاليا." : "تم تجاوز حد الطلبات مؤقتا. حاول بعد قليل.",
      429,
      insufficient ? "OPENAI_INSUFFICIENT_CREDITS" : "OPENAI_RATE_LIMITED"
    );
  }

  if (status === 408 || status === 504 || code.toLowerCase().includes("timeout")) {
    return new AiGenerationError("استغرق مزود الذكاء وقتا أطول من المتوقع. حاول مرة أخرى.", 504, "OPENAI_TIMEOUT");
  }

  if (status >= 500) {
    return new AiGenerationError("مزود الذكاء غير متاح مؤقتا. حاول لاحقا.", 502, "OPENAI_PROVIDER_UNAVAILABLE");
  }

  return new AiGenerationError("تعذر إنشاء المحتوى حاليا. راجع المدخلات وحاول مرة أخرى.", 502, "OPENAI_REQUEST_FAILED");
}

async function generateOpenAi(
  tool: ToolSlug,
  payload: Record<string, string>,
  timestamp: string,
  prompt: PromptSnapshot,
  selectedModel?: string
): Promise<GenerateResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    const output = createMockOutput(tool, payload);
    return {
      provider: "mock",
      model: "mock-vora-local",
      timestamp,
      output,
      fallback: true,
      prompt,
      exports: buildExportSnapshot(output)
    };
  }

  const model = selectedModel || process.env.OPENAI_MODEL?.trim() || aiProviders.openai.defaultModel;
  const OpenAI = await loadOpenAiSdk();
  const requestPayload = {
    model,
    instructions: prompt.instructions,
    input: prompt.input,
    temperature: 0.7,
    max_output_tokens: aiSecurityPolicy.maxOutputTokens,
    store: false
  };

  if (!OpenAI) {
    return generateOpenAiWithResponsesRest({ apiKey, model, tool, payload, timestamp, prompt, requestPayload });
  }

  const client = new OpenAI({ apiKey, timeout: 45_000, maxRetries: 1 });

  try {
    logOpenAiRequest({ model, endpoint: openAiResponsesEndpoint, transport: "sdk", payload: requestPayload });
    const response = await client.responses.create(requestPayload);
    logOpenAiResponse({ endpoint: openAiResponsesEndpoint, status: 200, body: response });

    const output = extractOutputText(response);
    if (!output) {
      throw new AiGenerationError("لم يرجع مزود الذكاء محتوى قابلا للعرض. حاول مرة أخرى.", 502, "OPENAI_EMPTY_OUTPUT");
    }

    return {
      provider: "openai",
      model,
      timestamp,
      output,
      usage: typeof response.usage === "object" && response.usage ? (response.usage as Record<string, unknown>) : undefined,
      prompt,
      exports: buildExportSnapshot(output)
    };
  } catch (error) {
    if (error instanceof AiGenerationError) throw error;
    const value = error as {
      status?: number;
      code?: string;
      type?: string;
      message?: string;
      error?: { code?: string; type?: string; message?: string };
    };
    printVoraOpenAiError({
      status: value.status,
      code: value.error?.code ?? value.code,
      type: value.error?.type ?? value.type,
      message: value.error?.message ?? value.message,
      body: stringifySdkError(error)
    });
    throw mapOpenAiError(error);
  }
}

async function generateOpenAiWithResponsesRest({
  apiKey,
  model,
  timestamp,
  prompt,
  requestPayload
}: {
  apiKey: string;
  model: string;
  tool: ToolSlug;
  payload: Record<string, string>;
  timestamp: string;
  prompt: PromptSnapshot;
  requestPayload: Record<string, unknown>;
}): Promise<GenerateResult> {
  let response: Response;
  try {
    logOpenAiRequest({ model, endpoint: openAiResponsesEndpoint, transport: "rest", payload: requestPayload });
    response = await fetch(openAiResponsesEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(45_000)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    printVoraOpenAiError({
      status: message.toLowerCase().includes("timeout") ? 504 : 502,
      code: "network_error",
      type: "network_error",
      message,
      body: message
    });
    throw mapOpenAiError({ status: message.toLowerCase().includes("timeout") ? 504 : 502, message, code: "network_error" });
  }

  const responseText = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = { raw: responseText };
  }
  logOpenAiResponse({ endpoint: openAiResponsesEndpoint, status: response.status, body: data });
  if (!response.ok) {
    const openAiError =
      data.error && typeof data.error === "object"
        ? (data.error as { code?: unknown; type?: unknown; message?: unknown })
        : undefined;
    printVoraOpenAiError({
      status: response.status,
      code: openAiError?.code ?? data.code,
      type: openAiError?.type ?? data.type,
      message: openAiError?.message ?? data.message,
      body: responseText
    });
    throw mapOpenAiError({
      status: response.status,
      code: typeof openAiError?.code === "string" ? openAiError.code : typeof data.code === "string" ? data.code : undefined,
      message: typeof openAiError?.message === "string" ? openAiError.message : typeof data.message === "string" ? data.message : undefined
    });
  }

  const output = extractOutputText(data);
  if (!output) {
    throw new AiGenerationError("لم يرجع مزود الذكاء محتوى قابلا للعرض. حاول مرة أخرى.", 502, "OPENAI_EMPTY_OUTPUT");
  }

  return {
    provider: "openai",
    model,
    timestamp,
    output,
    usage: typeof data.usage === "object" && data.usage ? (data.usage as Record<string, unknown>) : undefined,
    prompt,
    exports: buildExportSnapshot(output)
  };
}
