import { createAiApplicationContext, type AiApplicationContext } from "@/lib/ai-context";
import { createAiMemory, type MemorySnapshot } from "@/lib/ai-memory";
import type { AiOutputPreferences, AiTaskIntent } from "@/lib/ai-prompt-builder";
import type { AiProviderId, AiNormalizedResponse } from "@/lib/ai-provider-adapter";
import type { DocumentContent, DocumentDescriptor, DocumentMetadata } from "@/lib/document-intelligence";
import type { ReasoningType } from "@/lib/vora-reasoning-engine";
import type { ReportType } from "@/lib/vora-report-engine";
import { executeVoraRuntime, type VoraRuntimeExecutionResult } from "@/lib/vora-intelligence-runtime";

export type VoraIntelligenceTaskIntent =
  | "general_assistance"
  | "document_review"
  | "contract_review"
  | "risk_assessment"
  | "risk_review"
  | "planning_review"
  | "site_report_review"
  | "executive_summary"
  | "planning"
  | "cost_review"
  | "quality_review"
  | "safety_review"
  | "schedule_review"
  | "compliance_review";

export type VoraIntelligenceExecutionStatus = "success" | "failed";

export type VoraIntelligenceExecutionWarning = Readonly<{
  code: string;
  message: string;
  severity: "info" | "warning" | "critical";
}>;

export type VoraIntelligenceExecutionError = Readonly<{
  code: string;
  message: string;
}>;

export type VoraIntelligenceExecutionMetadata = Readonly<{
  runtimeId?: string;
  provider?: string;
  model?: string;
  usedMock: boolean;
  taskIntent: VoraIntelligenceTaskIntent;
  reasoningType: ReasoningType;
  reportType?: ReportType;
  createdAt: string;
}>;

export type VoraIntelligenceArtifacts = Readonly<{
  runtime?: VoraRuntimeExecutionResult;
}>;

export type VoraIntelligenceExecutionRequest = Readonly<{
  userRequest: string;
  taskIntent?: VoraIntelligenceTaskIntent;
  provider?: Extract<AiProviderId, "openai" | "mock"> | "auto";
  projectId?: string;
  organizationId?: string;
  language?: string;
  direction?: "rtl" | "ltr";
  context?: AiApplicationContext;
  memory?: MemorySnapshot;
  documents?: readonly DocumentDescriptor[];
  documentMetadata?: readonly DocumentMetadata[];
  documentContent?: readonly DocumentContent[];
  outputPreferences?: AiOutputPreferences;
  now?: Date;
}>;

export type VoraNormalizedIntelligenceResponse = Readonly<{
  id: string;
  status: VoraIntelligenceExecutionStatus;
  taskIntent: VoraIntelligenceTaskIntent;
  reasoningType: ReasoningType;
  summary?: string;
  content?: string;
  structuredOutput?: Readonly<Record<string, unknown>>;
  findings?: readonly unknown[];
  risks?: readonly unknown[];
  actions?: readonly unknown[];
  recommendations?: readonly unknown[];
  missingInformation?: readonly unknown[];
  warnings: readonly VoraIntelligenceExecutionWarning[];
  errors: readonly VoraIntelligenceExecutionError[];
  confidence: Readonly<{
    providerResponse: "placeholder";
    decisionScore?: number;
    reportStructuralCompleteness?: number;
    runtimePipelineCompleteness?: number;
  }>;
  reportPlan?: unknown;
  recommendationPlan?: unknown;
  provider?: string;
  model?: string;
  usedMock: boolean;
  executionMetadata: VoraIntelligenceExecutionMetadata;
  createdAt: string;
  artifacts?: VoraIntelligenceArtifacts;
}>;

export class VoraIntelligenceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "VORA_INTELLIGENCE_FAILED", status = 500) {
    super(message);
    this.name = "VoraIntelligenceError";
    this.code = code;
    this.status = status;
  }
}

const taskIntentMap: Record<VoraIntelligenceTaskIntent, { aiTaskIntent: AiTaskIntent; reasoningType: ReasoningType; reportType: ReportType }> = {
  general_assistance: { aiTaskIntent: "general_assistance", reasoningType: "general_assistance", reportType: "general_report" },
  document_review: { aiTaskIntent: "analyze", reasoningType: "document_review", reportType: "document_review_report" },
  contract_review: { aiTaskIntent: "analyze", reasoningType: "contract_review", reportType: "contract_review_report" },
  risk_assessment: { aiTaskIntent: "analyze", reasoningType: "risk_review", reportType: "risk_report" },
  risk_review: { aiTaskIntent: "analyze", reasoningType: "risk_review", reportType: "risk_report" },
  planning_review: { aiTaskIntent: "plan", reasoningType: "planning", reportType: "planning_report" },
  site_report_review: { aiTaskIntent: "analyze", reasoningType: "document_review", reportType: "site_report" },
  executive_summary: { aiTaskIntent: "summarize", reasoningType: "general_assistance", reportType: "executive_summary" },
  planning: { aiTaskIntent: "plan", reasoningType: "planning", reportType: "planning_report" },
  cost_review: { aiTaskIntent: "analyze", reasoningType: "cost_review", reportType: "cost_report" },
  quality_review: { aiTaskIntent: "analyze", reasoningType: "quality_review", reportType: "quality_report" },
  safety_review: { aiTaskIntent: "analyze", reasoningType: "safety_review", reportType: "safety_report" },
  schedule_review: { aiTaskIntent: "plan", reasoningType: "schedule_review", reportType: "schedule_report" },
  compliance_review: { aiTaskIntent: "analyze", reasoningType: "compliance_review", reportType: "compliance_report" }
};

function hasOpenAiKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function normalizeTaskIntent(value?: string): VoraIntelligenceTaskIntent {
  return value && value in taskIntentMap ? (value as VoraIntelligenceTaskIntent) : "general_assistance";
}

function createDefaultContext(request: VoraIntelligenceExecutionRequest, now: Date) {
  const projectId = request.projectId || "PRJ-1048";
  return createAiApplicationContext({
    pathname: projectId ? `/projects/${projectId}` : "/tools",
    searchParams: new URLSearchParams(request.organizationId ? `organizationId=${encodeURIComponent(request.organizationId)}` : ""),
    language: request.language || "ar",
    direction: request.direction || "rtl",
    theme: "dark",
    isAuthenticated: true,
    now
  });
}

function createDefaultMemory(context: AiApplicationContext, now: Date) {
  return createAiMemory({
    context,
    session: {
      sessionId: `vora-intelligence:${now.toISOString()}`,
      startedAt: now.toISOString()
    },
    conversation: {
      title: "VORA Intelligence Session",
      messageCount: 1,
      lastInteractionAt: now.toISOString()
    },
    now
  });
}

function providerAvailability(provider: VoraIntelligenceExecutionRequest["provider"]) {
  const openai = hasOpenAiKey();
  return {
    openai: provider === "openai" ? openai : provider === "auto" || !provider ? openai : false,
    anthropic: false,
    gemini: false,
    openrouter: false,
    mock: provider === "mock" || ((!provider || provider === "auto") && !openai)
  };
}

function modelAvailability(provider: VoraIntelligenceExecutionRequest["provider"]) {
  const openai = hasOpenAiKey();
  return {
    "gpt-4o-mini": openai,
    "gpt-4o": openai,
    "gpt-4.1-mini": openai,
    "mock-vora-local": provider === "mock" || !openai
  };
}

function executionProviderPreference(provider: VoraIntelligenceExecutionRequest["provider"]) {
  if (provider === "openai" || provider === "mock") return provider;
  return "auto";
}

function normalizeWarnings(runtime: VoraRuntimeExecutionResult): readonly VoraIntelligenceExecutionWarning[] {
  const runtimeWarnings = [
    ...runtime.pipeline.validation.warnings,
    ...runtime.pipeline.stages.flatMap((stage) => stage.warnings),
    ...(runtime.recommendationPlan?.validation.warnings || [])
  ].map((warning) => ({
    code: warning.code || "warning",
    message: warning.message,
    severity: "severity" in warning && warning.severity ? warning.severity : "warning"
  }));
  const providerWarnings = runtime.aiResponse?.warnings.map((message) => ({
    code: "provider_warning",
    message,
    severity: "info" as const
  })) || [];

  return [...runtimeWarnings, ...providerWarnings];
}

function normalizeErrors(runtime: VoraRuntimeExecutionResult): readonly VoraIntelligenceExecutionError[] {
  return [
    ...runtime.validation.errors,
    ...runtime.pipeline.stages.flatMap((stage) => stage.errors)
  ].map((error) => ({
    code: error.code || "unknown_error",
    message: error.message
  }));
}

function structuredOutput(runtime: VoraRuntimeExecutionResult): Readonly<Record<string, unknown>> {
  return {
    reasoningPlanId: runtime.reasoningPlan?.id,
    decisionPlanId: runtime.decisionPlan?.id,
    reportPlanId: runtime.reportPlan?.id,
    recommendationPlanId: runtime.recommendationPlan?.id,
    pipelineCompleteness: runtime.metrics.pipelineCompleteness,
    reportCompleteness: runtime.reportPlan?.completeness,
    decisionConfidence: runtime.decisionPlan?.confidence
  };
}

export async function executeVoraIntelligence(request: VoraIntelligenceExecutionRequest): Promise<VoraNormalizedIntelligenceResponse> {
  const now = request.now || new Date();
  const taskIntent = normalizeTaskIntent(request.taskIntent);
  const mapping = taskIntentMap[taskIntent];
  const context = request.context || createDefaultContext(request, now);
  const memory = request.memory || createDefaultMemory(context, now);

  if (!request.userRequest.trim()) {
    throw new VoraIntelligenceError("A user request is required.", "invalid_request", 400);
  }

  const runtime = await executeVoraRuntime({
    userRequest: request.userRequest,
    context,
    memory,
    documents: request.documents,
    documentMetadata: request.documentMetadata,
    documentContent: request.documentContent,
    taskIntent: mapping.aiTaskIntent,
    reasoningType: mapping.reasoningType,
    reportType: mapping.reportType,
    outputPreferences: request.outputPreferences,
    availableProviders: providerAvailability(request.provider),
    availableModels: modelAvailability(request.provider),
    executionOptions: {
      providerPreference: executionProviderPreference(request.provider),
      policyId: request.provider === "mock" ? "mock_only" : "balanced"
    },
    now
  });
  const aiResponse: AiNormalizedResponse | undefined = runtime.aiResponse;
  const status: VoraIntelligenceExecutionStatus = runtime.executionStatus === "executed" && runtime.validation.valid ? "success" : "failed";

  return {
    id: runtime.id,
    status,
    taskIntent,
    reasoningType: mapping.reasoningType,
    summary: aiResponse?.content?.split("\n").find(Boolean),
    content: aiResponse?.content,
    structuredOutput: structuredOutput(runtime),
    findings: runtime.reportPlan?.findings,
    risks: runtime.reportPlan?.findings.filter((finding) => finding.severity === "high" || finding.severity === "critical"),
    actions: runtime.decisionPlan?.actions,
    recommendations: runtime.recommendationPlan?.items,
    missingInformation: runtime.decisionPlan?.missingInformation,
    warnings: normalizeWarnings(runtime),
    errors: normalizeErrors(runtime),
    confidence: {
      providerResponse: "placeholder",
      decisionScore: runtime.decisionPlan?.confidence.score,
      reportStructuralCompleteness: runtime.reportPlan?.completeness.structuralScore,
      runtimePipelineCompleteness: runtime.metrics.pipelineCompleteness
    },
    reportPlan: runtime.reportPlan,
    recommendationPlan: runtime.recommendationPlan,
    provider: aiResponse?.provider || runtime.aiExecutionPlan?.provider,
    model: aiResponse?.model || runtime.aiExecutionPlan?.model,
    usedMock: (aiResponse?.provider || runtime.aiExecutionPlan?.provider) === "mock",
    executionMetadata: {
      runtimeId: runtime.id,
      provider: aiResponse?.provider || runtime.aiExecutionPlan?.provider,
      model: aiResponse?.model || runtime.aiExecutionPlan?.model,
      usedMock: (aiResponse?.provider || runtime.aiExecutionPlan?.provider) === "mock",
      taskIntent,
      reasoningType: mapping.reasoningType,
      reportType: runtime.reportPlan?.type,
      createdAt: runtime.createdAt
    },
    createdAt: runtime.createdAt,
    artifacts: { runtime }
  };
}

export async function executeVoraIntelligenceSafe(request: VoraIntelligenceExecutionRequest): Promise<VoraNormalizedIntelligenceResponse> {
  try {
    return await executeVoraIntelligence(request);
  } catch (error) {
    const now = request.now || new Date();
    const taskIntent = normalizeTaskIntent(request.taskIntent);
    const mapping = taskIntentMap[taskIntent];
    const known = error instanceof VoraIntelligenceError;
    return {
      id: `vora_intelligence_error_${now.toISOString().replace(/[^0-9]/g, "")}`,
      status: "failed",
      taskIntent,
      reasoningType: mapping.reasoningType,
      warnings: [],
      errors: [
        {
          code: known ? error.code : "unknown_error",
          message: known ? error.message : "VORA intelligence execution failed safely."
        }
      ],
      confidence: {
        providerResponse: "placeholder"
      },
      usedMock: false,
      executionMetadata: {
        usedMock: false,
        taskIntent,
        reasoningType: mapping.reasoningType,
        reportType: mapping.reportType,
        createdAt: now.toISOString()
      },
      createdAt: now.toISOString()
    };
  }
}
