import type { AiApplicationContext } from "@/lib/ai-context";
import type { MemorySnapshot } from "@/lib/ai-memory";
import { createAiPromptPayload, type AiOutputPreferences, type AiPromptPayload, type AiTaskIntent } from "@/lib/ai-prompt-builder";
import { createAiExecutionPlan, type AiExecutionOptions, type AiExecutionPlan, type AiProviderAvailability } from "@/lib/ai-orchestrator";
import type { AiModelAvailability } from "@/lib/ai-execution-policy";
import type { AiNormalizedResponse, AiProviderResponse } from "@/lib/ai-provider-adapter";
import { constructionKnowledgeRegistry, type ConstructionKnowledgeRegistry } from "@/lib/construction-knowledge";
import type { DocumentContent, DocumentDescriptor, DocumentMetadata } from "@/lib/document-intelligence";
import { createPlaceholderExtractionResult, normalizeDocument, validateDocument } from "@/lib/document-intelligence";
import type { DocumentParserAdapter, DocumentParserValidationResult } from "@/lib/document-parser-adapters";
import { selectDocumentParser, validateParserForDocument } from "@/lib/document-parser-adapters";
import { createReasoningPlan, type ReasoningPlan, type ReasoningRequest, type ReasoningType } from "@/lib/vora-reasoning-engine";
import { createDecisionPlan, type DecisionPlan } from "@/lib/vora-decision-engine";
import { createReportPlan, type ReportOutputPreferences, type ReportPlan, type ReportType } from "@/lib/vora-report-engine";
import { createRecommendationPlan, type RecommendationPlan } from "@/lib/vora-recommendation-engine";

export type VoraRuntimeStageName =
  | "context"
  | "memory"
  | "document"
  | "parser"
  | "knowledge"
  | "reasoning"
  | "decision"
  | "report"
  | "recommendation"
  | "prompt"
  | "orchestrator"
  | "provider"
  | "response"
  | "completed"
  | "failed";

export type VoraRuntimeStageStatus = "pending" | "completed" | "failed" | "skipped";

export type VoraRuntimeErrorCode =
  | "invalid_request"
  | "missing_context"
  | "missing_memory"
  | "missing_reasoning"
  | "missing_decision"
  | "missing_report_plan"
  | "pipeline_failure"
  | "validation_failure"
  | "provider_unavailable"
  | "provider_execution_failed"
  | "unknown_runtime_error";

export type VoraRuntimeError = Readonly<{
  code: VoraRuntimeErrorCode;
  message: string;
  stage?: VoraRuntimeStageName;
  field?: string;
}>;

export type VoraRuntimeValidationResult = Readonly<{
  valid: boolean;
  errors: readonly VoraRuntimeError[];
  warnings: readonly VoraRuntimeError[];
}>;

export type VoraRuntimeStage = Readonly<{
  name: VoraRuntimeStageName;
  status: VoraRuntimeStageStatus;
  order: number;
  label: string;
  required: boolean;
  inputKeys: readonly string[];
  outputKeys: readonly string[];
  warnings: readonly VoraRuntimeError[];
  errors: readonly VoraRuntimeError[];
}>;

export type VoraRuntimeContext = Readonly<{
  context: AiApplicationContext;
  memory: MemorySnapshot;
  constructionKnowledge: ConstructionKnowledgeRegistry;
  documents: readonly DocumentDescriptor[];
  documentMetadata: readonly DocumentMetadata[];
  documentContent: readonly DocumentContent[];
  selectedParsers: readonly Readonly<{
    documentId: string;
    parserId?: string;
    parserType?: DocumentParserAdapter["parserType"];
    validation: DocumentParserValidationResult;
  }>[];
}>;

export type VoraRuntimeResultPlaceholder = Readonly<{
  status: "not_executed";
  reason: "architecture_only";
  summary: string;
}>;

export type VoraRuntimeMetrics = Readonly<{
  executionDurationMs: null;
  completedStages: number;
  failedStages: number;
  warningCount: number;
  confidence: Readonly<{
    decisionScore?: number;
    reportCompletenessScore?: number;
    recommendationCount?: number;
    placeholder: true;
  }>;
  pipelineCompleteness: number;
}>;

export type RuntimeExecutionStatus = "validated" | "planned" | "executed" | "failed";

export type RuntimeExecutionWarning = VoraRuntimeError;

export type RuntimeExecutionMetadata = Readonly<{
  provider?: string;
  model?: string;
  policyId?: string;
  promptVersion?: string;
  normalizedResponseVersion?: "1.0";
  architectureVersion: "1.0";
}>;

export type VoraRuntimeRequest = Readonly<{
  userRequest: string;
  context?: AiApplicationContext;
  memory?: MemorySnapshot;
  documents?: readonly DocumentDescriptor[];
  documentMetadata?: readonly DocumentMetadata[];
  documentContent?: readonly DocumentContent[];
  constructionKnowledge?: ConstructionKnowledgeRegistry;
  taskIntent?: AiTaskIntent;
  reasoningType?: ReasoningType;
  reportType?: ReportType;
  reportPreferences?: ReportOutputPreferences;
  outputPreferences?: AiOutputPreferences;
  availableProviders?: AiProviderAvailability;
  availableModels?: AiModelAvailability;
  executionOptions?: AiExecutionOptions;
  now?: Date;
}>;

export type VoraRuntimePipeline = Readonly<{
  version: "1.0";
  id: string;
  createdAt: string;
  stages: readonly VoraRuntimeStage[];
  validation: VoraRuntimeValidationResult;
}>;

export type VoraRuntimeExecutionResult = Readonly<{
  version: "1.0";
  id: string;
  createdAt: string;
  pipeline: VoraRuntimePipeline;
  runtimeContext?: VoraRuntimeContext;
  reasoningPlan?: ReasoningPlan;
  decisionPlan?: DecisionPlan;
  reportPlan?: ReportPlan;
  recommendationPlan?: RecommendationPlan;
  promptPayload?: AiPromptPayload;
  aiExecutionPlan?: AiExecutionPlan;
  aiResponse?: AiNormalizedResponse;
  metrics: VoraRuntimeMetrics;
  executionStatus?: RuntimeExecutionStatus;
  executionMetadata?: RuntimeExecutionMetadata;
  validation: VoraRuntimeValidationResult;
  result: VoraRuntimeResultPlaceholder;
}>;

const stageDefinitions: readonly Omit<VoraRuntimeStage, "status" | "warnings" | "errors">[] = [
  {
    name: "context",
    order: 1,
    label: "AI Context",
    required: true,
    inputKeys: ["context"],
    outputKeys: ["runtimeContext.context"]
  },
  {
    name: "memory",
    order: 2,
    label: "AI Memory",
    required: true,
    inputKeys: ["memory"],
    outputKeys: ["runtimeContext.memory"]
  },
  {
    name: "document",
    order: 3,
    label: "Document Intelligence",
    required: false,
    inputKeys: ["documents", "documentMetadata", "documentContent"],
    outputKeys: ["normalizedDocuments", "placeholderExtractions"]
  },
  {
    name: "parser",
    order: 4,
    label: "Parser Selection",
    required: false,
    inputKeys: ["documents"],
    outputKeys: ["selectedParsers"]
  },
  {
    name: "knowledge",
    order: 5,
    label: "Construction Knowledge",
    required: true,
    inputKeys: ["constructionKnowledge"],
    outputKeys: ["runtimeContext.constructionKnowledge"]
  },
  {
    name: "reasoning",
    order: 6,
    label: "Reasoning Plan",
    required: true,
    inputKeys: ["context", "memory", "constructionKnowledge", "documentMetadata", "userRequest"],
    outputKeys: ["reasoningPlan"]
  },
  {
    name: "decision",
    order: 7,
    label: "Decision Plan",
    required: true,
    inputKeys: ["reasoningPlan"],
    outputKeys: ["decisionPlan"]
  },
  {
    name: "report",
    order: 8,
    label: "Report Plan",
    required: true,
    inputKeys: ["reasoningPlan", "decisionPlan"],
    outputKeys: ["reportPlan"]
  },
  {
    name: "recommendation",
    order: 9,
    label: "Recommendation Plan",
    required: true,
    inputKeys: ["decisionPlan", "reasoningPlan", "reportPlan"],
    outputKeys: ["recommendationPlan"]
  },
  {
    name: "prompt",
    order: 10,
    label: "Prompt Builder",
    required: true,
    inputKeys: ["context", "memory", "userRequest"],
    outputKeys: ["promptPayload"]
  },
  {
    name: "orchestrator",
    order: 11,
    label: "AI Orchestrator",
    required: true,
    inputKeys: ["promptPayload", "availableProviders"],
    outputKeys: ["aiExecutionPlan"]
  },
  {
    name: "provider",
    order: 12,
    label: "Provider Execution",
    required: true,
    inputKeys: ["aiExecutionPlan"],
    outputKeys: ["providerResponse"]
  },
  {
    name: "response",
    order: 13,
    label: "Normalized Response",
    required: true,
    inputKeys: ["providerResponse"],
    outputKeys: ["aiResponse"]
  },
  {
    name: "completed",
    order: 14,
    label: "Runtime Completed",
    required: true,
    inputKeys: ["aiResponse"],
    outputKeys: ["runtimeResultPlaceholder"]
  },
  {
    name: "failed",
    order: 15,
    label: "Runtime Failed",
    required: false,
    inputKeys: ["runtimeError"],
    outputKeys: ["runtimeResultPlaceholder"]
  }
];

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const property of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[property];
    if (child && typeof child === "object" && !Object.isFrozen(child)) {
      deepFreeze(child);
    }
  }
  return value;
}

function runtimeError(code: VoraRuntimeErrorCode, message: string, stage?: VoraRuntimeStageName, field?: string): VoraRuntimeError {
  return { code, message, stage, field };
}

function createRuntimeId(createdAt: string) {
  return `vora_runtime_${createdAt.replace(/[^0-9]/g, "")}`;
}

export function getRuntimeStages(): readonly VoraRuntimeStageName[] {
  return stageDefinitions.map((stage) => stage.name);
}

function createStage(
  definition: Omit<VoraRuntimeStage, "status" | "warnings" | "errors">,
  status: VoraRuntimeStageStatus,
  warnings: readonly VoraRuntimeError[] = [],
  errors: readonly VoraRuntimeError[] = []
): VoraRuntimeStage {
  return {
    ...definition,
    status,
    warnings,
    errors
  };
}

export function validateRuntimeRequest(request: VoraRuntimeRequest): VoraRuntimeValidationResult {
  const errors: VoraRuntimeError[] = [];
  const warnings: VoraRuntimeError[] = [];

  if (!request.userRequest.trim()) {
    errors.push(runtimeError("invalid_request", "A user request is required to create a VORA intelligence runtime pipeline.", "context", "userRequest"));
  }

  if (!request.context) {
    errors.push(runtimeError("missing_context", "AI application context is required.", "context", "context"));
  }

  if (!request.memory) {
    errors.push(runtimeError("missing_memory", "AI memory snapshot is required.", "memory", "memory"));
  }

  if ((request.documents?.length || 0) > 0 && request.documentContent && request.documentContent.length !== request.documents?.length) {
    warnings.push(
      runtimeError(
        "validation_failure",
        "Document content count does not match document descriptor count. Missing content will use placeholder extraction only.",
        "document",
        "documentContent"
      )
    );
  }

  return deepFreeze({
    valid: errors.length === 0,
    errors,
    warnings
  });
}

export function resolveRuntimeContext(request: VoraRuntimeRequest): VoraRuntimeContext | undefined {
  if (!request.context || !request.memory) return undefined;

  const documents = (request.documents || []).map((document) => normalizeDocument(document));
  const documentMetadata = [...(request.documentMetadata || []), ...documents.map((document) => document.metadata).filter((metadata): metadata is DocumentMetadata => Boolean(metadata))];
  const documentContent = request.documentContent || [];
  const selectedParsers = documents.map((document, index) => {
    const input = {
      descriptor: document,
      content: documentContent[index]
    };
    const parser = selectDocumentParser(input);
    return {
      documentId: document.id,
      parserId: parser?.id,
      parserType: parser?.parserType,
      validation: validateParserForDocument(parser, input)
    };
  });

  return deepFreeze({
    context: request.context,
    memory: request.memory,
    constructionKnowledge: request.constructionKnowledge || constructionKnowledgeRegistry,
    documents,
    documentMetadata,
    documentContent,
    selectedParsers
  });
}

export function createRuntimePipeline(request: VoraRuntimeRequest): VoraRuntimePipeline {
  const createdAt = (request.now || new Date()).toISOString();
  const validation = validateRuntimeRequest(request);
  const stages = stageDefinitions.map((definition) => {
    const stageErrors = validation.errors.filter((error) => error.stage === definition.name);
    const stageWarnings = validation.warnings.filter((warning) => warning.stage === definition.name);
    const hasInputs =
      definition.name === "document"
        ? Boolean(request.documents?.length || request.documentMetadata?.length || request.documentContent?.length)
        : definition.inputKeys.every((key) => {
            if (key === "context") return Boolean(request.context);
            if (key === "memory") return Boolean(request.memory);
            if (key === "constructionKnowledge") return Boolean(request.constructionKnowledge || constructionKnowledgeRegistry);
            if (key === "userRequest") return Boolean(request.userRequest.trim());
            return true;
          });
    const status: VoraRuntimeStageStatus =
      definition.name === "failed" ? "skipped" : stageErrors.length ? "failed" : !definition.required && !hasInputs ? "skipped" : "pending";
    return createStage(definition, status, stageWarnings, stageErrors);
  });

  return deepFreeze({
    version: "1.0",
    id: createRuntimeId(createdAt),
    createdAt,
    stages,
    validation
  });
}

export function validateRuntimePipeline(pipeline: VoraRuntimePipeline): VoraRuntimeValidationResult {
  const errors: VoraRuntimeError[] = [...pipeline.validation.errors];
  const warnings: VoraRuntimeError[] = [...pipeline.validation.warnings];
  const stageNames = new Set(pipeline.stages.map((stage) => stage.name));

  for (const expectedStage of getRuntimeStages()) {
    if (!stageNames.has(expectedStage)) {
      errors.push(runtimeError("pipeline_failure", `Missing runtime stage: ${expectedStage}`, "failed", "stages"));
    }
  }

  if (pipeline.stages.some((stage) => stage.required && stage.status === "skipped")) {
    errors.push(runtimeError("pipeline_failure", "A required runtime stage was skipped.", "failed", "stages"));
  }

  return deepFreeze({
    valid: errors.length === 0,
    errors,
    warnings
  });
}

function completeStage(stage: VoraRuntimeStage, warnings: readonly VoraRuntimeError[] = []): VoraRuntimeStage {
  if (stage.status === "skipped" || stage.status === "failed") return stage;
  return {
    ...stage,
    status: "completed",
    warnings: [...stage.warnings, ...warnings]
  };
}

function failStage(stage: VoraRuntimeStage, error: VoraRuntimeError): VoraRuntimeStage {
  return {
    ...stage,
    status: "failed",
    errors: [...stage.errors, error]
  };
}

export function collectRuntimeMetrics(input: {
  pipeline: VoraRuntimePipeline;
  decisionPlan?: DecisionPlan;
  reportPlan?: ReportPlan;
  recommendationPlan?: RecommendationPlan;
}): VoraRuntimeMetrics {
  const completedStages = input.pipeline.stages.filter((stage) => stage.status === "completed").length;
  const failedStages = input.pipeline.stages.filter((stage) => stage.status === "failed").length;
  const warningCount =
    input.pipeline.validation.warnings.length +
    input.pipeline.stages.reduce((count, stage) => count + stage.warnings.length, 0) +
    (input.decisionPlan?.warnings.length || 0) +
    (input.reportPlan?.warnings.length || 0) +
    (input.recommendationPlan?.validation.warnings.length || 0);
  const totalRunnableStages = input.pipeline.stages.filter((stage) => stage.status !== "skipped").length || input.pipeline.stages.length;

  return deepFreeze({
    executionDurationMs: null,
    completedStages,
    failedStages,
    warningCount,
    confidence: {
      decisionScore: input.decisionPlan?.confidence.score,
      reportCompletenessScore: input.reportPlan?.completeness.structuralScore,
      recommendationCount: input.recommendationPlan?.items.length,
      placeholder: true
    },
    pipelineCompleteness: Math.round((completedStages / totalRunnableStages) * 100)
  });
}

function buildReasoningRequest(input: {
  request: VoraRuntimeRequest;
  runtimeContext: VoraRuntimeContext;
}): ReasoningRequest {
  return {
    context: input.runtimeContext.context,
    memory: input.runtimeContext.memory,
    constructionKnowledge: input.runtimeContext.constructionKnowledge,
    documentMetadata: input.runtimeContext.documentMetadata,
    documents: input.runtimeContext.documents,
    taskIntent: input.request.taskIntent,
    reasoningType: input.request.reasoningType,
    userRequest: input.request.userRequest,
    now: input.request.now
  };
}

function buildRuntimePromptInput(input: {
  request: VoraRuntimeRequest;
  reasoningPlan: ReasoningPlan;
  decisionPlan: DecisionPlan;
  reportPlan: ReportPlan;
  recommendationPlan: RecommendationPlan;
}) {
  return [
    input.request.userRequest,
    "",
    "Runtime context:",
    `reasoningPlan=${input.reasoningPlan.id}`,
    `decisionPlan=${input.decisionPlan.id}`,
    `reportPlan=${input.reportPlan.id}`,
    `recommendationPlan=${input.recommendationPlan.id}`,
    `decisionType=${input.decisionPlan.type}`,
    `reportType=${input.reportPlan.type}`,
    `recommendationCount=${input.recommendationPlan.items.length}`
  ].join("\n");
}

function resolveActivatedProviderAvailability(request: VoraRuntimeRequest): AiProviderAvailability {
  return request.availableProviders || { mock: true };
}

function resolveActivatedModelAvailability(request: VoraRuntimeRequest): AiModelAvailability {
  return request.availableModels || { "mock-vora-local": true };
}

async function executeProviderResponse(plan: AiExecutionPlan): Promise<AiProviderResponse> {
  if (plan.adapter.execute) {
    return plan.adapter.execute(plan.providerRequest);
  }

  if (plan.provider === "mock") {
    return {
      content: "VORA intelligence runtime completed through the mock provider.",
      provider: "mock",
      model: plan.model,
      finishReason: "stop",
      usage: {},
      warnings: plan.warnings
    };
  }

  throw runtimeError(
    "provider_unavailable",
    "Selected provider does not expose an executable adapter in the unified runtime.",
    "provider",
    plan.provider
  );
}

export async function executeVoraRuntime(request: VoraRuntimeRequest): Promise<VoraRuntimeExecutionResult> {
  const planned = executeRuntimePipeline(request);
  if (!planned.validation.valid || !planned.runtimeContext || !planned.reasoningPlan || !planned.decisionPlan || !planned.reportPlan) {
    return deepFreeze({
      ...planned,
      executionStatus: "failed",
      executionMetadata: {
        architectureVersion: "1.0"
      }
    });
  }

  let stages = planned.pipeline.stages;
  let recommendationPlan: RecommendationPlan | undefined;
  let promptPayload: AiPromptPayload | undefined;
  let aiExecutionPlan: AiExecutionPlan | undefined;
  let aiResponse: AiNormalizedResponse | undefined;

  try {
    recommendationPlan = createRecommendationPlan({
      decisionPlan: planned.decisionPlan,
      reasoningPlan: planned.reasoningPlan,
      reportPlan: planned.reportPlan,
      runtimeContext: planned.runtimeContext,
      constructionKnowledge: planned.runtimeContext.constructionKnowledge,
      now: request.now
    });

    promptPayload = createAiPromptPayload({
      context: planned.runtimeContext.context,
      memory: planned.runtimeContext.memory,
      userRequest: buildRuntimePromptInput({
        request,
        reasoningPlan: planned.reasoningPlan,
        decisionPlan: planned.decisionPlan,
        reportPlan: planned.reportPlan,
        recommendationPlan
      }),
      taskIntent: request.taskIntent || "general_assistance",
      outputPreferences: request.outputPreferences,
      now: request.now
    });

    aiExecutionPlan = createAiExecutionPlan({
      prompt: promptPayload,
      availableProviders: resolveActivatedProviderAvailability(request),
      availableModels: resolveActivatedModelAvailability(request),
      options: {
        policyId: "balanced",
        providerPreference: "auto",
        responseFormat: promptPayload.outputPreferences.responseFormat,
        ...request.executionOptions,
        metadata: {
          runtimeId: planned.id,
          reasoningPlanId: planned.reasoningPlan.id,
          decisionPlanId: planned.decisionPlan.id,
          reportPlanId: planned.reportPlan.id,
          recommendationPlanId: recommendationPlan.id,
          ...(request.executionOptions?.metadata || {})
        }
      }
    });

    aiExecutionPlan.adapter.toProviderRequest(aiExecutionPlan.providerRequest);
    const providerResponse = await executeProviderResponse(aiExecutionPlan);
    aiResponse = aiExecutionPlan.adapter.normalizeResponse(providerResponse);

    stages = stages.map((stage) => {
      if (["recommendation", "prompt", "orchestrator", "provider", "response", "completed"].includes(stage.name)) {
        return completeStage(stage);
      }
      return stage;
    });

    const pipeline: VoraRuntimePipeline = deepFreeze({
      ...planned.pipeline,
      stages,
      validation: {
        valid: true,
        errors: [],
        warnings: planned.pipeline.validation.warnings
      }
    });

    return deepFreeze({
      ...planned,
      pipeline,
      recommendationPlan,
      promptPayload,
      aiExecutionPlan,
      aiResponse,
      metrics: collectRuntimeMetrics({
        pipeline,
        decisionPlan: planned.decisionPlan,
        reportPlan: planned.reportPlan,
        recommendationPlan
      }),
      executionStatus: "executed",
      executionMetadata: {
        provider: aiExecutionPlan.provider,
        model: aiExecutionPlan.model,
        policyId: request.executionOptions?.policyId || "balanced",
        promptVersion: promptPayload.version,
        normalizedResponseVersion: aiResponse.trace.adapterVersion,
        architectureVersion: "1.0"
      },
      validation: pipeline.validation,
      result: {
        status: "not_executed",
        reason: "architecture_only",
        summary: "Unified VORA intelligence runtime executed through the configured provider path and returned a normalized AI response."
      }
    });
  } catch (error) {
    const normalizedError =
      typeof error === "object" && error && "code" in error
        ? (error as VoraRuntimeError)
        : runtimeError("provider_execution_failed", "Runtime provider execution failed.", "provider");
    const failedPipeline: VoraRuntimePipeline = deepFreeze({
      ...planned.pipeline,
      stages: stages.map((stage) => (stage.name === normalizedError.stage ? failStage(stage, normalizedError) : stage.name === "failed" ? failStage(stage, normalizedError) : stage)),
      validation: {
        valid: false,
        errors: [normalizedError],
        warnings: planned.pipeline.validation.warnings
      }
    });

    return deepFreeze({
      ...planned,
      pipeline: failedPipeline,
      recommendationPlan,
      promptPayload,
      aiExecutionPlan,
      aiResponse,
      metrics: collectRuntimeMetrics({
        pipeline: failedPipeline,
        decisionPlan: planned.decisionPlan,
        reportPlan: planned.reportPlan,
        recommendationPlan
      }),
      executionStatus: "failed",
      executionMetadata: {
        provider: aiExecutionPlan?.provider,
        model: aiExecutionPlan?.model,
        policyId: request.executionOptions?.policyId || "balanced",
        promptVersion: promptPayload?.version,
        normalizedResponseVersion: aiResponse?.trace.adapterVersion,
        architectureVersion: "1.0"
      },
      validation: failedPipeline.validation,
      result: {
        status: "not_executed",
        reason: "architecture_only",
        summary: "Unified VORA intelligence runtime failed safely before returning a normalized provider response."
      }
    });
  }
}

export function executeRuntimePipeline(request: VoraRuntimeRequest): VoraRuntimeExecutionResult {
  const createdAt = (request.now || new Date()).toISOString();
  const initialPipeline = createRuntimePipeline(request);
  const pipelineValidation = validateRuntimePipeline(initialPipeline);
  let stages = initialPipeline.stages;
  let runtimeContext: VoraRuntimeContext | undefined;
  let reasoningPlan: ReasoningPlan | undefined;
  let decisionPlan: DecisionPlan | undefined;
  let reportPlan: ReportPlan | undefined;

  if (!pipelineValidation.valid) {
    const failedPipeline: VoraRuntimePipeline = {
      ...initialPipeline,
      stages: stages.map((stage) => (stage.name === "failed" ? createStage({ ...stage }, "failed", [], pipelineValidation.errors) : stage)),
      validation: pipelineValidation
    };
    return deepFreeze({
      version: "1.0",
      id: initialPipeline.id,
      createdAt,
      pipeline: failedPipeline,
      metrics: collectRuntimeMetrics({ pipeline: failedPipeline }),
      validation: pipelineValidation,
      result: {
        status: "not_executed",
        reason: "architecture_only",
        summary: "Runtime pipeline validation failed before execution. No AI, provider, parser, report renderer, or recommendation engine was executed."
      }
    });
  }

  try {
    runtimeContext = resolveRuntimeContext(request);
    if (!runtimeContext) {
      throw runtimeError("pipeline_failure", "Runtime context could not be resolved.", "context");
    }

    const documentWarnings = runtimeContext.documents.flatMap((document) => {
      const validation = validateDocument(document);
      return [...validation.errors, ...validation.warnings].map((warning) =>
        runtimeError("validation_failure", warning.message, "document", warning.field || document.id)
      );
    });
    runtimeContext.documents.forEach((document, index) => {
      createPlaceholderExtractionResult({
        descriptor: document,
        content: runtimeContext?.documentContent[index]
      });
    });

    reasoningPlan = createReasoningPlan(buildReasoningRequest({ request, runtimeContext }));
    decisionPlan = createDecisionPlan({
      reasoningPlan,
      constructionKnowledge: runtimeContext.constructionKnowledge,
      documentMetadata: runtimeContext.documentMetadata,
      context: runtimeContext.context,
      memory: runtimeContext.memory,
      now: request.now
    });
    reportPlan = createReportPlan({
      reasoningPlan,
      decisionPlan,
      context: runtimeContext.context,
      memory: runtimeContext.memory,
      constructionKnowledge: runtimeContext.constructionKnowledge,
      documentMetadata: runtimeContext.documentMetadata,
      preferences: request.reportPreferences,
      reportType: request.reportType,
      now: request.now
    });

    stages = stages.map((stage) => {
      if (stage.name === "document") return completeStage(stage, documentWarnings);
      if (stage.name === "parser") {
        const parserWarnings = runtimeContext?.selectedParsers.flatMap((selection) =>
          [...selection.validation.errors, ...selection.validation.warnings].map((warning) =>
            runtimeError("validation_failure", warning.message, "parser", warning.field || selection.documentId)
          )
        );
        return completeStage(stage, parserWarnings);
      }
      return completeStage(stage);
    });

    const completedPipeline: VoraRuntimePipeline = deepFreeze({
      ...initialPipeline,
      stages,
      validation: {
        valid: true,
        errors: [],
        warnings: [...initialPipeline.validation.warnings]
      }
    });

    return deepFreeze({
      version: "1.0",
      id: initialPipeline.id,
      createdAt,
      pipeline: completedPipeline,
      runtimeContext,
      reasoningPlan,
      decisionPlan,
      reportPlan,
      metrics: collectRuntimeMetrics({ pipeline: completedPipeline, decisionPlan, reportPlan }),
      validation: completedPipeline.validation,
      result: {
        status: "not_executed",
        reason: "architecture_only",
        summary: "Unified VORA intelligence runtime pipeline completed with placeholders only. No AI, provider execution, OCR, embeddings, persistence, API, UI, recommendations, or report rendering were performed."
      }
    });
  } catch (error) {
    const normalizedError =
      typeof error === "object" && error && "code" in error
        ? (error as VoraRuntimeError)
        : runtimeError("unknown_runtime_error", "An unknown runtime planning error occurred.", "failed");
    const failedPipeline: VoraRuntimePipeline = deepFreeze({
      ...initialPipeline,
      stages: stages.map((stage) => (stage.name === normalizedError.stage ? failStage(stage, normalizedError) : stage.name === "failed" ? failStage(stage, normalizedError) : stage)),
      validation: {
        valid: false,
        errors: [normalizedError],
        warnings: initialPipeline.validation.warnings
      }
    });

    return deepFreeze({
      version: "1.0",
      id: initialPipeline.id,
      createdAt,
      pipeline: failedPipeline,
      runtimeContext,
      reasoningPlan,
      decisionPlan,
      reportPlan,
      metrics: collectRuntimeMetrics({ pipeline: failedPipeline, decisionPlan, reportPlan }),
      validation: failedPipeline.validation,
      result: {
        status: "not_executed",
        reason: "architecture_only",
        summary: "Runtime pipeline failed safely. No AI, provider, parser execution, persistence, API, UI, recommendation, or report rendering was performed."
      }
    });
  }
}
