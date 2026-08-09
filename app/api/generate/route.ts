import { NextResponse } from "next/server";
import { AiGenerationError, generateAiOutput, type AiProvider, type ProjectAiContext } from "@/lib/ai-providers";
import { createAiApplicationContext } from "@/lib/ai-context";
import { createAiMemory } from "@/lib/ai-memory";
import { createAiPromptPayload, type AiTaskIntent } from "@/lib/ai-prompt-builder";
import type { AiExecutionPolicyId } from "@/lib/ai-execution-policy";
import { executeAiOrchestrator } from "@/lib/ai-orchestrator-engine";
import { aiContextRepository } from "@/lib/ai-context-repository";
import { collaborationEngine } from "@/lib/collaboration-engine";
import { getBearerToken, isApiError, isSupabaseServerConfigured, saveGeneration, verifySupabaseUser } from "@/lib/supabase-server";
import { tools, type ToolSlug } from "@/lib/tools";
import { auditEvent, checkRateLimitAsync, detectPromptInjection, rateLimitResponse, sanitizeAiText } from "@/lib/security";
import { executeVoraIntelligenceSafe, type VoraIntelligenceTaskIntent, type VoraNormalizedIntelligenceResponse } from "@/lib/vora-intelligence-service";
import { executeContractReviewSafe, type ContractReviewDocumentInput } from "@/lib/vora-contract-review";
import { executeBoqReviewSafe, type BoqReviewDocument } from "@/lib/vora-boq-review";
import { executeRiskAssessmentSafe, type RiskAssessmentDocumentInput } from "@/lib/vora-risk-assessment";
import { executePlanningReviewSafe, type PlanningReviewDocument } from "@/lib/vora-planning-review";
import { executeSiteReportReviewSafe, type SiteReportReviewDocument } from "@/lib/vora-site-report-review";
import { executeExecutiveSummarySafe, type ExecutiveSummaryRequest } from "@/lib/vora-executive-summary";
import { createErrorResponse, createExportReadyReport, createSafeError, mapHttpErrorRetryable, type ExportReadyReport } from "@/lib/analysis-hardening";
import { executeCopilotChatSafe } from "@/lib/copilot-engine";
import { exportProfessionalReportSafe, type DocumentExportFormat } from "@/lib/document-engine";
import { getPerformanceMetrics, recordPerformanceMetric } from "@/lib/performance-metrics";
import { parseConstructionDocument } from "@/lib/document-parser";
import { knowledgeEngine } from "@/lib/knowledge-engine";
import { persistAnalysisResultDurableSafe } from "@/lib/project-session";
import { getRuntimeMonitorSnapshot } from "@/lib/runtime-monitor";
import { createRequestId, logRuntimeEvent } from "@/lib/runtime-logger";
import type { DocumentParseInput } from "@/lib/document-types";
import type { ProjectAnalysisStatus, ProjectAnalysisToolType } from "@/types/project-analysis";
import { normalizeReportExportOptions, type ReportExportContext, type ReportExportOptions } from "@/types/report-export";

const MAX_FIELD_LENGTH = 2_000;
const MAX_TOTAL_LENGTH = 7_500;
const MAX_CONTRACT_TEXT_LENGTH = 12_000;
const MAX_BOQ_TEXT_LENGTH = 20_000;
const MAX_RISK_TEXT_LENGTH = 14_000;
const MAX_PLANNING_TEXT_LENGTH = 18_000;
const MAX_SITE_REPORT_TEXT_LENGTH = 18_000;
const allowedProviders = new Set<AiProvider>(["openai", "mock"]);
type PayloadValidation =
  | { payload: Record<string, string> }
  | { error: string; status: number; code: string };

function jsonError(message: string, status: number, code = "REQUEST_FAILED") {
  const normalized = createErrorResponse(createSafeError(code, message, mapHttpErrorRetryable(status)));
  return NextResponse.json({ ...normalized, error: message, safeError: normalized.error }, { status });
}


async function attachProjectPersistence<T extends VoraNormalizedIntelligenceResponse>(
  result: T,
  input: { projectId?: string; ownerId: string; token?: string; toolType: ProjectAnalysisToolType }
) {
  return {
    ...result,
    projectPersistence: await persistAnalysisResultDurableSafe({
      projectId: input.projectId,
      ownerId: input.ownerId,
      token: input.token,
      toolType: input.toolType,
      result,
      source: "api_generate"
    })
  };
}
function sanitizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return sanitizeAiText(value, MAX_FIELD_LENGTH);
}

function sanitizePayload(value: unknown): PayloadValidation {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Ã™Å Ã˜Â±Ã˜Â¬Ã™â€° Ã˜Â¥Ã˜Â±Ã˜Â³Ã˜Â§Ã™â€ Ã˜Â¨Ã™Å Ã˜Â§Ã™â€ Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€Ã˜Â£Ã˜Â¯Ã˜Â§Ã˜Â© Ã˜Â¨Ã˜Â´Ã™Æ’Ã™â€ Ã˜ÂµÃ˜Â­Ã™Å Ã˜Â­.", status: 400, code: "INVALID_PAYLOAD" } as const;
  }

  const payload: Record<string, string> = {};
  let totalLength = 0;

  for (const [key, rawValue] of Object.entries(value)) {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
    if (!safeKey) continue;

    const safeValue = sanitizeText(rawValue);
    if (safeValue.length > MAX_FIELD_LENGTH) {
      return { error: "Ã˜Â¨Ã˜Â¹Ã˜Â¶ Ã˜Â§Ã™â€Ã™â€¦Ã˜Â¯Ã˜Â®Ã™â€Ã˜Â§Ã˜Âª Ã˜Â·Ã™Ë†Ã™Å Ã™â€Ã˜Â© Ã˜Â¬Ã˜Â¯Ã˜Â§. Ã˜Â§Ã˜Â®Ã˜ÂªÃ˜ÂµÃ˜Â± Ã˜Â§Ã™â€Ã™â€ Ã˜Âµ Ã™Ë†Ã˜Â­Ã˜Â§Ã™Ë†Ã™â€ Ã™â€¦Ã˜Â±Ã˜Â© Ã˜Â£Ã˜Â®Ã˜Â±Ã™â€°.", status: 413, code: "FIELD_TOO_LONG" } as const;
    }

    totalLength += safeValue.length;
    if (detectPromptInjection(safeValue)) {
      return { error: "Ã˜ÂªÃ™â€¦ Ã˜Â±Ã™ÂÃ˜Â¶ Ã˜Â§Ã™â€Ã˜Â·Ã™â€Ã˜Â¨ Ã™â€Ã˜Â£Ã™â€ Ã™â€¡ Ã™Å Ã˜Â­Ã˜ÂªÃ™Ë†Ã™Å  Ã˜Â¹Ã™â€Ã™â€° Ã˜ÂªÃ˜Â¹Ã™â€Ã™Å Ã™â€¦Ã˜Â§Ã˜Âª Ã˜ÂºÃ™Å Ã˜Â± Ã˜Â¢Ã™â€¦Ã™â€ Ã˜Â© Ã˜Â£Ã™Ë† Ã™â€¦Ã˜Â­Ã˜Â§Ã™Ë†Ã™â€Ã˜Â© Ã˜ÂªÃ˜Â¬Ã˜Â§Ã™Ë†Ã˜Â² Ã™â€Ã™â€šÃ™Ë†Ã˜Â§Ã˜Â¹Ã˜Â¯ VORA.", status: 400, code: "PROMPT_INJECTION_DETECTED" } as const;
    }
    payload[safeKey] = safeValue;
  }

  if (totalLength > MAX_TOTAL_LENGTH) {
    return { error: "Ã˜Â­Ã˜Â¬Ã™â€¦ Ã˜Â§Ã™â€Ã˜Â·Ã™â€Ã˜Â¨ Ã™Æ’Ã˜Â¨Ã™Å Ã˜Â± Ã˜Â¬Ã˜Â¯Ã˜Â§. Ã˜Â§Ã˜Â®Ã˜ÂªÃ˜ÂµÃ˜Â± Ã˜Â§Ã™â€Ã˜ÂªÃ™ÂÃ˜Â§Ã˜ÂµÃ™Å Ã™â€ Ã™Ë†Ã˜Â­Ã˜Â§Ã™Ë†Ã™â€ Ã™â€¦Ã˜Â±Ã˜Â© Ã˜Â£Ã˜Â®Ã˜Â±Ã™â€°.", status: 413, code: "REQUEST_TOO_LONG" } as const;
  }

  const meaningfulValues = Object.entries(payload).filter(([key, text]) => {
    if (!text) return false;
    return !["language", "tone", "style", "documentType", "channel", "projectId"].includes(key);
  });

  if (!meaningfulValues.length) {
    return { error: "Ã˜Â£Ã˜Â¶Ã™Â Ã™â€¦Ã™Ë†Ã˜Â¶Ã™Ë†Ã˜Â¹Ã˜Â§ Ã˜Â£Ã™Ë† Ã˜ÂªÃ™ÂÃ˜Â§Ã˜ÂµÃ™Å Ã™â€ Ã™Ë†Ã˜Â§Ã˜Â¶Ã˜Â­Ã˜Â© Ã˜Â­Ã˜ÂªÃ™â€° Ã˜ÂªÃ˜ÂªÃ™â€¦Ã™Æ’Ã™â€  VORA Ã™â€¦Ã™â€  Ã˜Â¥Ã™â€ Ã˜Â´Ã˜Â§Ã˜Â¡ Ã™â€¦Ã˜Â­Ã˜ÂªÃ™Ë†Ã™â€° Ã™â€¦Ã™ÂÃ™Å Ã˜Â¯.", status: 400, code: "EMPTY_INPUT" } as const;
  }

  return { payload } as const;
}

function parseProvider(value: unknown): AiProvider | undefined {
  if (typeof value !== "string") return undefined;
  return allowedProviders.has(value as AiProvider) ? (value as AiProvider) : undefined;
}

function parseProjectId(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^[a-zA-Z0-9_-]{2,80}$/.test(trimmed) ? trimmed : "";
}

function parseMode(value: unknown) {
  if (value === "report_export") return "report_export";
  if (value === "document_parse") return "document_parse";
  if (value === "knowledge_index") return "knowledge_index";
  if (value === "knowledge_search") return "knowledge_search";
  if (value === "copilot_chat") return "copilot_chat";
  if (value === "ai_orchestrator") return "ai_orchestrator";
  if (value === "project_comment") return "project_comment";
  if (value === "project_review") return "project_review";
  if (value === "project_activity") return "project_activity";
  if (value === "runtime_health") return "runtime_health";
  if (value === "performance_metrics") return "performance_metrics";
  return value === "vora_intelligence" ? "vora_intelligence" : "legacy";
}

function parseDocumentParseInput(value: unknown): DocumentParseInput | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const rawFilename = typeof record.filename === "string" ? record.filename : typeof record.name === "string" ? record.name : "";
  const filename = sanitizeAiText(rawFilename, 180);
  if (!filename) return undefined;

  const mimeType = typeof record.mimeType === "string" ? sanitizeAiText(record.mimeType, 120) : undefined;
  const fileSize = typeof record.fileSize === "number" && Number.isFinite(record.fileSize)
    ? Math.max(0, Math.floor(record.fileSize))
    : typeof record.sizeBytes === "number" && Number.isFinite(record.sizeBytes)
      ? Math.max(0, Math.floor(record.sizeBytes))
      : undefined;
  const text = typeof record.text === "string" ? record.text.slice(0, 200_000) : undefined;
  const base64 = typeof record.base64 === "string" ? record.base64.slice(0, 8_000_000) : undefined;

  return { filename, mimeType, fileSize, text, base64 };
}

function parseKnowledgeQuery(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const projectId = parseProjectId(record.projectId);
  const query = typeof record.query === "string" ? sanitizeAiText(record.query, 500) : "";
  const limit = typeof record.limit === "number" && Number.isFinite(record.limit) ? Math.max(1, Math.min(20, Math.floor(record.limit))) : 5;
  if (!projectId || !query) return undefined;
  return { projectId, query, limit };
}

function parseCopilotChatInput(value: unknown, ownerId: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const projectId = parseProjectId(record.projectId);
  const question = typeof record.question === "string" ? sanitizeAiText(record.question, 1200) : "";
  const sessionId = typeof record.sessionId === "string" ? sanitizeAiText(record.sessionId, 120) : undefined;
  const provider: "openai" | "mock" | "auto" | undefined =
    record.provider === "openai" || record.provider === "mock" || record.provider === "auto" ? record.provider : undefined;
  const limit = typeof record.limit === "number" && Number.isFinite(record.limit) ? Math.max(1, Math.min(8, Math.floor(record.limit))) : 4;
  if (!projectId || !question) return undefined;
  return { projectId, ownerId, sessionId, question, provider, limit };
}

function parseAiTaskIntentValue(value: unknown): AiTaskIntent {
  const allowed = new Set<AiTaskIntent>(["general_assistance", "summarize", "analyze", "generate_report", "extract_actions", "explain", "compare", "plan"]);
  return typeof value === "string" && allowed.has(value as AiTaskIntent) ? (value as AiTaskIntent) : "general_assistance";
}

function parseAiExecutionPolicyId(value: unknown): AiExecutionPolicyId | undefined {
  const allowed = new Set<AiExecutionPolicyId>(["quality_first", "balanced", "speed_first", "cost_conscious", "provider_preferred", "mock_only"]);
  return typeof value === "string" && allowed.has(value as AiExecutionPolicyId) ? (value as AiExecutionPolicyId) : undefined;
}

function parseProviderAvailabilityInput(value: unknown) {
  const fallback = {
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
    anthropic: false,
    gemini: false,
    openrouter: false,
    mock: true
  };
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const record = value as Record<string, unknown>;
  return {
    openai: record.openai === true,
    anthropic: record.anthropic === true,
    gemini: record.gemini === true,
    openrouter: record.openrouter === true,
    mock: record.mock !== false
  };
}

function parseAnalysisToolType(value: unknown): ProjectAnalysisToolType {
  const allowed = new Set<ProjectAnalysisToolType>(["contract_review", "boq_review", "risk_assessment", "planning_review", "site_report_review", "executive_summary"]);
  return typeof value === "string" && allowed.has(value as ProjectAnalysisToolType) ? (value as ProjectAnalysisToolType) : "contract_review";
}

function parseCollaborationBase(value: unknown, ownerId: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const projectId = parseProjectId(record.projectId);
  if (!projectId) return undefined;
  return { record, projectId, ownerId, actorId: typeof record.actorId === "string" ? sanitizeAiText(record.actorId, 120) : ownerId };
}

function parseExportFormat(value: unknown): DocumentExportFormat {
  return value === "docx" || value === "html" ? value : "pdf";
}

function parseExportOptions(value: unknown): ReportExportOptions {
  if (!value || typeof value !== "object" || Array.isArray(value)) return normalizeReportExportOptions();
  const record = value as Record<string, unknown>;
  const enabled = (key: string, fallback = true) => typeof record[key] === "boolean" ? Boolean(record[key]) : fallback;
  return normalizeReportExportOptions({
    includeLogo: enabled("includeLogo"),
    includeProjectMetadata: enabled("includeProjectMetadata"),
    includeTimeline: enabled("includeTimeline"),
    includeReadiness: enabled("includeReadiness"),
    includeRecommendations: enabled("includeRecommendations"),
    includeEvidenceReferences: enabled("includeEvidenceReferences"),
    language: record.language === "ar" || record.language === "fr" ? record.language : "en"
  });
}

function parseExportContext(value: unknown): ReportExportContext {
  if (!value || typeof value !== "object" || Array.isArray(value)) return Object.freeze({});
  const record = value as Record<string, unknown>;
  const timeline = Array.isArray(record.timeline) ? record.timeline.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")).slice(0, 100).flatMap((item, index) => {
    if (typeof item.toolType !== "string" || typeof item.occurredAt !== "string") return [];
    const status: ProjectAnalysisStatus = item.status === "failed" || item.status === "pending" ? item.status : "completed";
    return [{ id: typeof item.id === "string" ? sanitizeAiText(item.id, 120) : `event-${index}`, sessionId: typeof item.sessionId === "string" ? sanitizeAiText(item.sessionId, 120) : "", toolType: parseAnalysisToolType(item.toolType), status, version: typeof item.version === "number" ? Math.max(1, Math.floor(item.version)) : 1, occurredAt: sanitizeAiText(item.occurredAt, 80) }];
  }) : [];
  const evidenceReferences = Array.isArray(record.evidenceReferences) ? record.evidenceReferences.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && typeof (item as Record<string, unknown>).label === "string")).slice(0, 100).map((item) => ({ label: sanitizeAiText(String(item.label), 180), ...(typeof item.reference === "string" ? { reference: sanitizeAiText(item.reference, 500) } : {}) })) : [];
  const missingInformation = Array.isArray(record.missingInformation) ? record.missingInformation.filter((item): item is string => typeof item === "string").slice(0, 100).map((item) => sanitizeAiText(item, 500)) : [];
  return Object.freeze({
    ...(typeof record.analysisId === "string" ? { analysisId: sanitizeAiText(record.analysisId, 120) } : {}),
    ...(typeof record.sessionId === "string" ? { sessionId: sanitizeAiText(record.sessionIdëx¶‰ËkºwµçQ½½±QåÁ”¡Á…ÉÍ•¹É•½É¹Ñ…É•ÑQåÁ”¤°(€€€€€€€€€Ñ…É•Ñ%èÑåÁ•½˜Á…ÉÍ•¹É•½É¹Ñ…É•Ñ%€ôôô€‰ÍÑÉ¥¹œˆ€üÍ…¹¥Ñ¥é•¥Q•áĞ¡Á…ÉÍ•¹É•½É¹Ñ…É•Ñ%°€ÄÈÀ¤€è€‰…¹…±åÍ¥Ìˆ°(€€€€€€€€€É•Ù¥•İ•É%èÑåÁ•½˜Á…ÉÍ•¹É•½É¹É•Ù¥•İ•É%€ôôô€‰ÍÑÉ¥¹œˆ€üÍ…¹¥Ñ¥é•¥Q•áĞ¡Á…ÉÍ•¹É•½É¹É•Ù¥•İ•É%°€ÄÈÀ¤€èÕ¹‘•™¥¹•(€€€€€€€ô¤ì(€€€…Õ‘¥ÑÙ•¹Ğ ‰½±±…‰½É…Ñ¥½¸¹É•Ù¥•Ü¹½µÁ±•Ñ•ˆ°ìÕÍ•É%èÕÍ•È¹¥°ÁÉ½©•Ñ%èÁ…ÉÍ•¹ÁÉ½©•Ñ%°ÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ°…Ñ¥½¸ô¤ì(€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡ìÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ°É•Ù¥•ÜèÉ•ÍÕ±Ğô°ìÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹½¬€ü€ÈÀÀ€è€ĞÀÌô¤ì(€ô((€¥˜€¡Á…ÉÍ•5½‘” ¡‰½‘ä…Ììµ½‘”üèÕ¹­¹½İ¸ô¤¹µ½‘”¤€ôôô€‰ÁÉ½©•Ñ}…Ñ¥Ù¥Ñäˆ¤ì(€€€½¹ÍĞÁ…ÉÍ•€ôÁ…ÉÍ•½±±…‰½É…Ñ¥½¹	…Í”¡‰½‘ä°ÕÍ•È¹¥¤ì(€€€¥˜€ …Á…ÉÍ•¤É•ÑÕÉ¸©Í½¹ÉÉ½È ‰AÉ½©•Ğ…Ñ¥Ù¥ÑäÉ•ÅÕ¥É•Ì„ÁÉ½©•Ğ%¸ˆ°€ĞÀÀ°€‰%9Y1%}AI=)Q}Q%Y%Qdˆ¤ì(€€€½¹ÍĞ…Ñ¥Ù¥Ñä€ô½±±…‰½É…Ñ¥½¹¹¥¹”¹…Ñ¥Ù¥Ñä¹±¥ÍĞ¡Á…ÉÍ•¹ÁÉ½©•Ñ%¤ì(€€€½¹ÍĞ…Õ‘¥Ğ€ô½±±…‰½É…Ñ¥½¹¹¥¹”¹…Õ‘¥Ğ¹±¥ÍĞ¡ìÑ…É•ĞèÁ…ÉÍ•¹ÁÉ½©•Ñ%ô¤ì(€€€…Õ‘¥ÑÙ•¹Ğ ‰½±±…‰½É…Ñ¥½¸¹…Ñ¥Ù¥Ñä¹±¥ÍÑ•ˆ°ìÕÍ•É%èÕÍ•È¹¥°ÁÉ½©•Ñ%èÁ…ÉÍ•¹ÁÉ½©•Ñ%°…Ñ¥Ù¥Ñå½Õ¹Ğè…Ñ¥Ù¥Ñä¹±•¹Ñ ô¤ì(€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡ìÍÑ…ÑÕÌè€‰ÍÕ•ÍÌˆ°…Ñ¥Ù¥Ñä°…Õ‘¥Ğô¤ì(€ô((€¥˜€¡Á…ÉÍ•5½‘” ¡‰½‘ä…Ììµ½‘”üèÕ¹­¹½İ¸ô¤¹µ½‘”¤€ôôô€‰ÉÕ¹Ñ¥µ•}¡•…±Ñ ˆ¤ì(€€€½¹ÍĞÍÑ…ÉÑ•€ô…Ñ”¹¹½Ü ¤ì(€€€½¹ÍĞÍ¹…ÁÍ¡½Ğ€ô…İ…¥Ğ•ÑIÕ¹Ñ¥µ•5½¹¥Ñ½ÉM¹…ÁÍ¡½Ğ ¤ì(€€€½¹ÍĞ‘ÕÉ…Ñ¥½¸€ô…Ñ”¹¹½Ü ¤€´ÍÑ…ÉÑ•ì(€€€É•½É‘A•É™½Éµ…¹•5•ÑÉ¥Œ ‰ÉÕ¹Ñ¥µ•}¡•…±Ñ ˆ°‘ÕÉ…Ñ¥½¸¤ì(€€€±½IÕ¹Ñ¥µ•Ù•¹Ğ¡ì(€€€€€É•ÅÕ•ÍÑ%èÉ•…Ñ•I•ÅÕ•ÍÑ% ‰ÉÕ¹Ñ¥µ”µ¡•…±Ñ ˆ¤°(€€€€€½İ¹•É%èÕÍ•È¹¥°(€€€€€½Á•É…Ñ¥½¸è€‰ÉÕ¹Ñ¥µ•}¡•…±Ñ ˆ°(€€€€€‘ÕÉ…Ñ¥½¸°(€€€€€ÍÑ…ÑÕÌèÍ¹…ÁÍ¡½Ğ¹¡•…±Ñ ¹ÍÑ…ÑÕÌ€ôôô€‰Õ¹¡•…±Ñ¡äˆ€ü€‰™…¥±•ˆ€è€‰ÍÕ•ÍÌˆ°(€€€€€İ…É¹¥¹ÌèÍ¹…ÁÍ¡½Ğ¹¡•…±Ñ ¹İ…É¹¥¹Ì°(€€€€€µ•Ñ…‘…Ñ„èì¡•…±Ñ¡MÑ…ÑÕÌèÍ¹…ÁÍ¡½Ğ¹¡•…±Ñ ¹ÍÑ…ÑÕÌô(€€€ô¤ì(€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡ìÍÑ…ÑÕÌè€‰ÍÕ•ÍÌˆ°ÉÕ¹Ñ¥µ”èÍ¹…ÁÍ¡½Ğô¤ì(€ô((€¥˜€¡Á…ÉÍ•5½‘” ¡‰½‘ä…Ììµ½‘”üèÕ¹­¹½İ¸ô¤¹µ½‘”¤€ôôô€‰Á•É™½Éµ…¹•}µ•ÑÉ¥Ìˆ¤ì(€€€½¹ÍĞµ•ÑÉ¥Ì€ô•ÑA•É™½Éµ…¹•5•ÑÉ¥Ì ¤ì(€€€±½IÕ¹Ñ¥µ•Ù•¹Ğ¡ì(€€€€€É•ÅÕ•ÍÑ%èÉ•…Ñ•I•ÅÕ•ÍÑ% ‰Á•É™½Éµ…¹”µµ•ÑÉ¥Ìˆ¤°(€€€€€½İ¹•É%èÕÍ•È¹¥°(€€€€€½Á•É…Ñ¥½¸è€‰Á•É™½Éµ…¹•}µ•ÑÉ¥Ìˆ°(€€€€€‘ÕÉ…Ñ¥½¸è€À°(€€€€€ÍÑ…ÑÕÌè€‰ÍÕ•ÍÌˆ°(€€€€€İ…É¹¥¹Ìèmt°(€€€€€µ•Ñ…‘…Ñ„èì…¡•!¥ÑI…Ñ”èµ•ÑÉ¥Ì¹…¡”¹¡¥ÑI…Ñ”°½Á•É…Ñ¥½¹½Õ¹Ğèµ•ÑÉ¥Ì¹½Á•É…Ñ¥½¹Ì¹±•¹Ñ ô(€€€ô¤ì(€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡ìÍÑ…ÑÕÌè€‰ÍÕ•ÍÌˆ°Á•É™½Éµ…¹”è•ÑA•É™½Éµ…¹•5•ÑÉ¥Ì ¤ô¤ì(€ô((€¥˜€¡Á…ÉÍ•5½‘” ¡‰½‘ä…Ììµ½‘”üèÕ¹­¹½İ¸ô¤¹µ½‘”¤€ôôô€‰É•Á½ÉÑ}•áÁ½ÉĞˆ¤ì(€€€½¹ÍĞÉ•Á½ÉĞ€ôÁ…ÉÍ•áÁ½ÉÑI•Á½ÉĞ ¡‰½‘ä…ÌìÉ•Á½ÉĞüèÕ¹­¹½İ¸ô¤¹É•Á½ÉĞ¤ì(€€€¥˜€ …É•Á½ÉĞ¤É•ÑÕÉ¸©Í½¹ÉÉ½È ‰I•Á½ÉĞ•áÁ½ÉĞÉ•ÅÕ¥É•Ì„¹½Éµ…±¥é•É•Á½ÉĞİ¥Ñ Ñ¥Ñ±”…¹Í•Ñ¥½¹Ì¸ˆ°€ĞÀÀ°€‰%9Y1%}IA=IQ}aA=IPˆ¤ì(€€€½¹ÍĞ™½Éµ…Ğ€ôÁ…ÉÍ•áÁ½ÉÑ½Éµ…Ğ ¡‰½‘ä…Ìì™½Éµ…ĞüèÕ¹­¹½İ¸ô¤¹™½Éµ…Ğ¤ì(€€€½¹ÍĞ•áÁ½ÉÑ•€ô•áÁ½ÉÑAÉ½™•ÍÍ¥½¹…±I•Á½ÉÑM…™”¡ì(€€€€€É•Á½ÉĞ°(€€€€€™½Éµ…Ğ°(€€€€€½ÁÑ¥½¹ÌèÁ…ÉÍ•áÁ½ÉÑ=ÁÑ¥½¹Ì ¡‰½‘ä…Ìì½ÁÑ¥½¹ÌüèÕ¹­¹½İ¸ô¤¹½ÁÑ¥½¹Ì¤°(€€€€€½¹Ñ•áĞèÁ…ÉÍ•áÁ½ÉÑ½¹Ñ•áĞ ¡‰½‘ä…Ìì½¹Ñ•áĞüèÕ¹­¹½İ¸ô¤¹½¹Ñ•áĞ¤°(€€€€€µ•Ñ…‘…Ñ„èì(€€€€€€€ÁÉ½©•Ñ9…µ”èÑåÁ•½˜€¡‰½‘ä…ÌìÁÉ½©•Ñ9…µ”üèÕ¹­¹½İ¸ô¤¹ÁÉ½©•Ñ9…µ”€ôôô€‰ÍÑÉ¥¹œˆ€üÍ…¹¥Ñ¥é•¥Q•áĞ¡MÑÉ¥¹œ ¡‰½‘ä…ÌìÁÉ½©•Ñ9…µ”üèÕ¹­¹½İ¸ô¤¹ÁÉ½©•Ñ9…µ”¤°€ÄàÀ¤€èÉ•Á½ÉĞ¹ÁÉ½©•ÑQ¥Ñ±”°(€€€€€€€ÁÉ½©•Ñ%èÉ•Á½ÉĞ¹ÁÉ½©•Ñ%°(€€€€€€€±¥•¹ĞèÑåÁ•½˜€¡‰½‘ä…Ìì±¥•¹ĞüèÕ¹­¹½İ¸ô¤¹±¥•¹Ğ€ôôô€‰ÍÑÉ¥¹œˆ€üÍ…¹¥Ñ¥é•¥Q•áĞ¡MÑÉ¥¹œ ¡‰½‘ä…Ìì±¥•¹ĞüèÕ¹­¹½İ¸ô¤¹±¥•¹Ğ¤°€ÄàÀ¤€èÕ¹‘•™¥¹•°(€€€€€€€½É…¹¥é…Ñ¥½¸èÑåÁ•½˜€¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¸üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¸€ôôô€‰ÍÑÉ¥¹œˆ€üÍ…¹¥Ñ¥é•¥Q•áĞ¡MÑÉ¥¹œ ¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¸üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¸¤°€ÄàÀ¤€èÕ¹‘•™¥¹•°(€€€€€€€…¹…±åÍ¥ÍQåÁ”èÉ•Á½ÉĞ¹Í½ÕÉ”¹É•Á±…” ½|½œ°€ˆ€ˆ¤°(€€€€€€€¡•…±Ñ¡M½É”èÑåÁ•½˜€¡‰½‘ä…Ìì¡•…±Ñ¡M½É”üèÕ¹­¹½İ¸ô¤¹¡•…±Ñ¡M½É”€ôôô€‰ÍÑÉ¥¹œˆ€üÍ…¹¥Ñ¥é•¥Q•áĞ¡MÑÉ¥¹œ ¡‰½‘ä…Ìì¡•…±Ñ¡M½É”üèÕ¹­¹½İ¸ô¤¹¡•…±Ñ¡M½É”¤°€àÀ¤€èÕ¹‘•™¥¹•°(€€€€€€€½¹™¥‘•¹•M½É”èÑåÁ•½˜€¡‰½‘ä…Ìì½¹™¥‘•¹•M½É”üèÕ¹­¹½İ¸ô¤¹½¹™¥‘•¹•M½É”€ôôô€‰¹Õµ‰•Èˆ€ü9Õµ‰•È ¡‰½‘ä…Ìì½¹™¥‘•¹•M½É”üèÕ¹­¹½İ¸ô¤¹½¹™¥‘•¹•M½É”¤€èÕ¹‘•™¥¹•°(€€€€€€€…¹…±åÍ¥ÍY•ÉÍ¥½¸èÑåÁ•½˜€¡‰½‘ä…Ìì…¹…±åÍ¥ÍY•ÉÍ¥½¸üèÕ¹­¹½İ¸ô¤¹…¹…±åÍ¥ÍY•ÉÍ¥½¸€ôôô€‰¹Õµ‰•Èˆ€ü9Õµ‰•È ¡‰½‘ä…Ìì…¹…±åÍ¥ÍY•ÉÍ¥½¸üèÕ¹­¹½İ¸ô¤¹…¹…±åÍ¥ÍY•ÉÍ¥½¸¤€èÕ¹‘•™¥¹•°(€€€€€€€•¹•É…Ñ•‘	äèÑåÁ•½˜€¡‰½‘ä…Ìì•¹•É…Ñ•‘	äüèÕ¹­¹½İ¸ô¤¹•¹•É…Ñ•‘	ä€ôôô€‰ÍÑÉ¥¹œˆ€üÍ…¹¥Ñ¥é•¥Q•áĞ¡MÑÉ¥¹œ ¡‰½‘ä…Ìì•¹•É…Ñ•‘	äüèÕ¹­¹½İ¸ô¤¹•¹•É…Ñ•‘	ä¤°€ÄàÀ¤€èÕ¹‘•™¥¹•°(€€€€€€€İ½É­™±½İMÑ…”èÑåÁ•½˜€¡‰½‘ä…Ììİ½É­™±½İMÑ…”üèÕ¹­¹½İ¸ô¤¹İ½É­™±½İMÑ…”€ôôô€‰ÍÑÉ¥¹œˆ€üÍ…¹¥Ñ¥é•¥Q•áĞ¡MÑÉ¥¹œ ¡‰½‘ä…Ììİ½É­™±½İMÑ…”üèÕ¹­¹½İ¸ô¤¹İ½É­™±½İMÑ…”¤°€ÄàÀ¤€èÕ¹‘•™¥¹•°(€€€€€€€•¹•É…Ñ•‘ĞèÉ•Á½ÉĞ¹•¹•É…Ñ•‘Ğ(€€€€€ô(€€€ô¤ì(€€€¥˜€ …•áÁ½ÉÑ•¹ÍÑ…ÑÕÌ¹½¬ñğ€„ ‰‰…Í”ØĞˆ¥¸•áÁ½ÉÑ•¤¤ì(€€€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡ìÍÑ…ÑÕÌè€‰™…¥±•ˆ°•áÁ½ÉÑMÑ…ÑÕÌè•áÁ½ÉÑ•¹ÍÑ…ÑÕÌô°ìÍÑ…ÑÕÌè€ÔÀÀô¤ì(€€€ô(€€€…Õ‘¥ÑÙ•¹Ğ ‰É•Á½ÉĞ¹•áÁ½ÉĞ¹½µÁ±•Ñ•ˆ°ìÕÍ•É%èÕÍ•È¹¥°ÁÉ½©•Ñ%èÉ•Á½ÉĞ¹ÁÉ½©•Ñ%°™½Éµ…Ğ°Í½ÕÉ”èÉ•Á½ÉĞ¹Í½ÕÉ”ô¤ì(€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡ì(€€€€€ÍÑ…ÑÕÌè€‰ÍÕ•ÍÌˆ°(€€€€€•áÁ½ÉÑMÑ…ÑÕÌè•áÁ½ÉÑ•¹ÍÑ…ÑÕÌ°(€€€€€™¥±”èì(€€€€€€€™¥±•¹…µ”è•áÁ½ÉÑ•¹™¥±•¹…µ”°(€€€€€€€µ¥µ•QåÁ”è•áÁ½ÉÑ•¹µ¥µ•QåÁ”°(€€€€€€€‰…Í”ØĞè•áÁ½ÉÑ•¹‰…Í”ØĞ(€€€€€ô(€€€ô¤ì(€ô((€¥˜€¡Á…ÉÍ•5½‘” ¡‰½‘ä…Ììµ½‘”üèÕ¹­¹½İ¸ô¤¹µ½‘”¤€ôôô€‰Ù½É…}¥¹Ñ•±±¥•¹”ˆ¤ì(€€€½¹ÍĞÕÍ•ÉI•ÅÕ•ÍĞ€ôÍ…¹¥Ñ¥é•Q•áĞ ¡‰½‘ä…ÌìÕÍ•ÉI•ÅÕ•ÍĞüèÕ¹­¹½İ¸ô¤¹ÕÍ•ÉI•ÅÕ•ÍĞ¤ì(€€€¥˜€ …ÕÍ•ÉI•ÅÕ•ÍĞ¤ì(€€€€€É•ÑÕÉ¸©Í½¹ÉÉ½È ‹c
c
Ûg
ƒc
ßgŠ{c
£c
œƒg.c
Ÿc
Ûc
·c
œƒc
·c
«gŠÀƒc
«c
«gŠ›gKgŠ€Y=IƒgŠ›gŠ€ƒc
«c
Óc
ëgƒgŠxƒgŠ›c
Ïc
Ÿc
Äƒc
ŸgŠ{c
ÃgKc
Ÿc
„¸ˆ°€ĞÀÀ°€‰5AQe}%9AUPˆ¤ì(€€€ô(€€€¥˜€¡‘•Ñ•ÑAÉ½µÁÑ%¹©•Ñ¥½¸¡ÕÍ•ÉI•ÅÕ•ÍĞ¤¤ì(€€€€€É•ÑÕÉ¸©Í½¹ÉÉ½È ‹c
«gŠ˜ƒc
Çg
c
Øƒc
ŸgŠ{c
ßgŠ{c
 ƒgŠ{c
gŠƒgŠ„ƒgƒc
·c
«g.g€ƒc
çgŠ{gŠÀƒc
«c
çgŠ{gƒgŠ›c
Ÿc
¨ƒc
ëgƒc
Äƒc
‹gŠ›gŠƒc
¤ƒc
g.ƒgŠ›c
·c
Ÿg.gŠ{c
¤ƒc
«c
³c
Ÿg.c
ÈƒgŠ{gŠkg.c
Ÿc
çc
¼Y=I¸ˆ°€ĞÀÀ°€‰AI=5AQ}%9)Q%=9}QQˆ¤ì(€€€ô((€€€½¹ÍĞÁÉ½©•Ñ%€ôÁ…ÉÍ•AÉ½©•Ñ% ¡‰½‘ä…ÌìÁÉ½©•Ñ%üèÕ¹­¹½İ¸ô¤¹ÁÉ½©•Ñ%¤ì(€€€½¹ÍĞÁÉ½Ù¥‘•È€ôÁ…ÉÍ•AÉ½Ù¥‘•È ¡‰½‘ä…ÌìÁÉ½Ù¥‘•ÈüèÕ¹­¹½İ¸ô¤¹ÁÉ½Ù¥‘•È¤ì(€€€½¹ÍĞ¥¹Ñ•±±¥•¹•AÉ½Ù¥‘•È€ôÁÉ½Ù¥‘•È€ôôô€‰½Á•¹…¤ˆñğÁÉ½Ù¥‘•È€ôôô€‰µ½¬ˆ€üÁÉ½Ù¥‘•È€è€‰…ÕÑ¼ˆì(€€€½¹ÍĞÑ…Í­%¹Ñ•¹Ğ€ôÁ…ÉÍ•Q…Í­%¹Ñ•¹Ğ ¡‰½‘ä…ÌìÑ…Í­%¹Ñ•¹ĞüèÕ¹­¹½İ¸ô¤¹Ñ…Í­%¹Ñ•¹Ğ¤ì(€€€…Õ‘¥ÑÙ•¹Ğ ‰…¤¹Ù½É…}¥¹Ñ•±±¥•¹”¹ÍÑ…ÉÑ•ˆ°ìÕÍ•É%èÕÍ•È¹¥°ÁÉ½©•Ñ%°ÁÉ½Ù¥‘•Èè¥¹Ñ•±±¥•¹•AÉ½Ù¥‘•È°Ñ…Í­%¹Ñ•¹ĞèÑ…Í­%¹Ñ•¹Ğñğ€‰•¹•É…±}…ÍÍ¥ÍÑ…¹”ˆô¤ì((€€€¥˜€¡Ñ…Í­%¹Ñ•¹Ğ€ôôô€‰½¹ÑÉ…Ñ}É•Ù¥•Üˆ¤ì(€€€€€½¹ÍĞÉ•ÍÕ±Ğ€ô…İ…¥Ğ•á•ÕÑ•½¹ÑÉ…ÑI•Ù¥•İM…™”¡ì(€€€€€€€‘½Õµ•¹ĞèÁ…ÉÍ•½¹ÑÉ…Ñ½Õµ•¹Ğ ¡‰½‘ä…Ìì½¹ÑÉ…Ñ½Õµ•¹ĞüèÕ¹­¹½İ¸ô¤¹½¹ÑÉ…Ñ½Õµ•¹Ğ¤°(€€€€€€€É•Ù¥•İ•É9½Ñ•ÌèÕÍ•ÉI•ÅÕ•ÍĞ°(€€€€€€€ÁÉ½Ù¥‘•Èè¥¹Ñ•±±¥•¹•AÉ½Ù¥‘•È°(€€€€€€€ÁÉ½©•Ñ%°(€€€€€€€½É…¹¥é…Ñ¥½¹%èÑåÁ•½˜€¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%€ôôô€‰ÍÑÉ¥¹œˆ€üMÑÉ¥¹œ ¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%¤¹Í±¥” À°€àÀ¤€èÕ¹‘•™¥¹•(€€€€€ô¤ì((€€€€€…Õ‘¥ÑÙ•¹Ğ ‰…¤¹Ù½É…}¥¹Ñ•±±¥•¹”¹½µÁ±•Ñ•ˆ°ìÕÍ•É%èÕÍ•È¹¥°ÁÉ½©•Ñ%°ÁÉ½Ù¥‘•ÈèÉ•ÍÕ±Ğ¹ÁÉ½Ù¥‘•Èñğ€‰Õ¹­¹½İ¸ˆ°ÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ°Ñ…Í­%¹Ñ•¹Ğè€‰½¹ÑÉ…Ñ}É•Ù¥•Üˆô¤ì(€€€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡…İ…¥Ğ…ÑÑ…¡AÉ½©•ÑA•ÉÍ¥ÍÑ•¹”¡É•ÍÕ±Ğ°ìÁÉ½©•Ñ%°½İ¹•É%èÕÍ•È¹¥°Ñ½­•¸°Ñ½½±QåÁ”è€‰½¹ÑÉ…Ñ}É•Ù¥•Üˆô¤°ìÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ€ôôô€‰ÍÕ•ÍÌˆ€ü€ÈÀÀ€è€ĞÀÀô¤ì(€€€ô((€€€¥˜€¡Ñ…Í­%¹Ñ•¹Ğ€ôôô€‰½ÍÑ}É•Ù¥•Üˆ€˜˜€¡‰½‘ä…Ìì‰½Å½Õµ•¹ĞüèÕ¹­¹½İ¸ô¤¹‰½Å½Õµ•¹Ğ¤ì(€€€€€½¹ÍĞÉ•ÍÕ±Ğ€ô…İ…¥Ğ•á•ÕÑ•	½ÅI•Ù¥•İM…™”¡ì(€€€€€€€‘½Õµ•¹ĞèÁ…ÉÍ•	½Å½Õµ•¹Ğ ¡‰½‘ä…Ìì‰½Å½Õµ•¹ĞüèÕ¹­¹½İ¸ô¤¹‰½Å½Õµ•¹Ğ¤°(€€€€€€€É•Ù¥•İ•É9½Ñ•ÌèÕÍ•ÉI•ÅÕ•ÍĞ°(€€€€€€€ÁÉ½Ù¥‘•Èè¥¹Ñ•±±¥•¹•AÉ½Ù¥‘•È°(€€€€€€€ÁÉ½©•Ñ%°(€€€€€€€½É…¹¥é…Ñ¥½¹%èÑåÁ•½˜€¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%€ôôô€‰ÍÑÉ¥¹œˆ€üMÑÉ¥¹œ ¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%¤¹Í±¥” À°€àÀ¤€èÕ¹‘•™¥¹•(€€€€€ô¤ì((€€€€€…Õ‘¥ÑÙ•¹Ğ ‰…¤¹Ù½É…}¥¹Ñ•±±¥•¹”¹½µÁ±•Ñ•ˆ°ìÕÍ•É%èÕÍ•È¹¥°ÁÉ½©•Ñ%°ÁÉ½Ù¥‘•ÈèÉ•ÍÕ±Ğ¹ÁÉ½Ù¥‘•Èñğ€‰Õ¹­¹½İ¸ˆ°ÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ°Ñ…Í­%¹Ñ•¹Ğè€‰½ÍÑ}É•Ù¥•Üˆô¤ì(€€€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡…İ…¥Ğ…ÑÑ…¡AÉ½©•ÑA•ÉÍ¥ÍÑ•¹”¡É•ÍÕ±Ğ°ìÁÉ½©•Ñ%°½İ¹•É%èÕÍ•È¹¥°Ñ½­•¸°Ñ½½±QåÁ”è€‰‰½Å}É•Ù¥•Üˆô¤°ìÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ€ôôô€‰ÍÕ•ÍÌˆ€ü€ÈÀÀ€è€ĞÀÀô¤ì(€€€ô((€€€¥˜€¡Ñ…Í­%¹Ñ•¹Ğ€ôôô€‰É¥Í­}…ÍÍ•ÍÍµ•¹Ğˆ¤ì(€€€€€½¹ÍĞÉ•ÍÕ±Ğ€ô…İ…¥Ğ•á•ÕÑ•I¥Í­ÍÍ•ÍÍµ•¹ÑM…™”¡ì(€€€€€€€½¹ÑÉ…ÑI•Ù¥•ÜèÁ…ÉÍ•I¥Í­M½ÕÉ” ¡‰½‘ä…Ìì½¹ÑÉ…ÑI•Ù¥•ÜüèÕ¹­¹½İ¸ô¤¹½¹ÑÉ…ÑI•Ù¥•Ü¤°(€€€€€€€‰½ÅI•Ù¥•ÜèÁ…ÉÍ•I¥Í­M½ÕÉ” ¡‰½‘ä…Ìì‰½ÅI•Ù¥•ÜüèÕ¹­¹½İ¸ô¤¹‰½ÅI•Ù¥•Ü¤°(€€€€€€€¹½Ñ•ÌèÍ…¹¥Ñ¥é•I¥Í­Q•áĞ ¡‰½‘ä…ÌìÉ¥Í­9½Ñ•ÌüèÕ¹­¹½İ¸ô¤¹É¥Í­9½Ñ•Ì¤°(€€€€€€€‘½Õµ•¹ĞèÁ…ÉÍ•I¥Í­½Õµ•¹Ğ ¡‰½‘ä…ÌìÉ¥Í­½Õµ•¹ĞüèÕ¹­¹½İ¸ô¤¹É¥Í­½Õµ•¹Ğ¤°(€€€€€€€É•Ù¥•İ•É9½Ñ•ÌèÕÍ•ÉI•ÅÕ•ÍĞ°(€€€€€€€ÁÉ½Ù¥‘•Èè¥¹Ñ•±±¥•¹•AÉ½Ù¥‘•È°(€€€€€€€ÁÉ½©•Ñ%°(€€€€€€€½É…¹¥é…Ñ¥½¹%èÑåÁ•½˜€¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%€ôôô€‰ÍÑÉ¥¹œˆ€üMÑÉ¥¹œ ¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%¤¹Í±¥” À°€àÀ¤€èÕ¹‘•™¥¹•(€€€€€ô¤ì((€€€€€…Õ‘¥ÑÙ•¹Ğ ‰…¤¹Ù½É…}¥¹Ñ•±±¥•¹”¹½µÁ±•Ñ•ˆ°ìÕÍ•É%èÕÍ•È¹¥°ÁÉ½©•Ñ%°ÁÉ½Ù¥‘•ÈèÉ•ÍÕ±Ğ¹ÁÉ½Ù¥‘•Èñğ€‰Õ¹­¹½İ¸ˆ°ÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ°Ñ…Í­%¹Ñ•¹Ğè€‰É¥Í­}…ÍÍ•ÍÍµ•¹Ğˆô¤ì(€€€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡…İ…¥Ğ…ÑÑ…¡AÉ½©•ÑA•ÉÍ¥ÍÑ•¹”¡É•ÍÕ±Ğ°ìÁÉ½©•Ñ%°½İ¹•É%èÕÍ•È¹¥°Ñ½­•¸°Ñ½½±QåÁ”è€‰É¥Í­}…ÍÍ•ÍÍµ•¹Ğˆô¤°ìÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ€ôôô€‰ÍÕ•ÍÌˆ€ü€ÈÀÀ€è€ĞÀÀô¤ì(€€€ô((€€€¥˜€¡Ñ…Í­%¹Ñ•¹Ğ€ôôô€‰Á±…¹¹¥¹}É•Ù¥•Üˆ¤ì(€€€€€½¹ÍĞÉ•ÍÕ±Ğ€ô…İ…¥Ğ•á•ÕÑ•A±…¹¹¥¹I•Ù¥•İM…™”¡ì(€€€€€€€‘½Õµ•¹ĞèÁ…ÉÍ•A±…¹¹¥¹½Õµ•¹Ğ ¡‰½‘ä…ÌìÁ±…¹¹¥¹½Õµ•¹ĞüèÕ¹­¹½İ¸ô¤¹Á±…¹¹¥¹½Õµ•¹Ğ¤°(€€€€€€€Á±…¹¹¥¹9½Ñ•ÌèÍ…¹¥Ñ¥é•A±…¹¹¥¹Q•áĞ ¡‰½‘ä…ÌìÁ±…¹¹¥¹9½Ñ•ÌüèÕ¹­¹½İ¸ô¤¹Á±…¹¹¥¹9½Ñ•Ì¤°(€€€€€€€É•Ù¥•İ•É9½Ñ•ÌèÕÍ•ÉI•ÅÕ•ÍĞ°(€€€€€€€ÁÉ½Ù¥‘•Èè¥¹Ñ•±±¥•¹•AÉ½Ù¥‘•È°(€€€€€€€ÁÉ½©•Ñ%°(€€€€€€€½É…¹¥é…Ñ¥½¹%èÑåÁ•½˜€¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%€ôôô€‰ÍÑÉ¥¹œˆ€üMÑÉ¥¹œ ¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%¤¹Í±¥” À°€àÀ¤€èÕ¹‘•™¥¹•(€€€€€ô¤ì((€€€€€…Õ‘¥ÑÙ•¹Ğ ‰…¤¹Ù½É…}¥¹Ñ•±±¥•¹”¹½µÁ±•Ñ•ˆ°ìÕÍ•É%èÕÍ•È¹¥°ÁÉ½©•Ñ%°ÁÉ½Ù¥‘•ÈèÉ•ÍÕ±Ğ¹ÁÉ½Ù¥‘•Èñğ€‰Õ¹­¹½İ¸ˆ°ÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ°Ñ…Í­%¹Ñ•¹Ğè€‰Á±…¹¹¥¹}É•Ù¥•Üˆô¤ì(€€€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡…İ…¥Ğ…ÑÑ…¡AÉ½©•ÑA•ÉÍ¥ÍÑ•¹”¡É•ÍÕ±Ğ°ìÁÉ½©•Ñ%°½İ¹•É%èÕÍ•È¹¥°Ñ½­•¸°Ñ½½±QåÁ”è€‰Á±…¹¹¥¹}É•Ù¥•Üˆô¤°ìÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ€ôôô€‰ÍÕ•ÍÌˆ€ü€ÈÀÀ€è€ĞÀÀô¤ì(€€€ô((€€€¥˜€¡Ñ…Í­%¹Ñ•¹Ğ€ôôô€‰Í¥Ñ•}É•Á½ÉÑ}É•Ù¥•Üˆ¤ì(€€€€€½¹ÍĞÉ•ÍÕ±Ğ€ô…İ…¥Ğ•á•ÕÑ•M¥Ñ•I•Á½ÉÑI•Ù¥•İM…™”¡ì(€€€€€€€‘½Õµ•¹ĞèÁ…ÉÍ•M¥Ñ•I•Á½ÉÑ½Õµ•¹Ğ ¡‰½‘ä…ÌìÍ¥Ñ•I•Á½ÉÑ½Õµ•¹ĞüèÕ¹­¹½İ¸ô¤¹Í¥Ñ•I•Á½ÉÑ½Õµ•¹Ğ¤°(€€€€€€€Í¥Ñ•I•Á½ÉÑ9½Ñ•ÌèÍ…¹¥Ñ¥é•M¥Ñ•I•Á½ÉÑQ•áĞ ¡‰½‘ä…ÌìÍ¥Ñ•I•Á½ÉÑ9½Ñ•ÌüèÕ¹­¹½İ¸ô¤¹Í¥Ñ•I•Á½ÉÑ9½Ñ•Ì¤°(€€€€€€€É•Ù¥•İ•É9½Ñ•ÌèÕÍ•ÉI•ÅÕ•ÍĞ°(€€€€€€€ÁÉ½Ù¥‘•Èè¥¹Ñ•±±¥•¹•AÉ½Ù¥‘•È°(€€€€€€€ÁÉ½©•Ñ%°(€€€€€€€½É…¹¥é…Ñ¥½¹%èÑåÁ•½˜€¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%€ôôô€‰ÍÑÉ¥¹œˆ€üMÑÉ¥¹œ ¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%¤¹Í±¥” À°€àÀ¤€èÕ¹‘•™¥¹•(€€€€€ô¤ì((€€€€€…Õ‘¥ÑÙ•¹Ğ ‰…¤¹Ù½É…}¥¹Ñ•±±¥•¹”¹½µÁ±•Ñ•ˆ°ìÕÍ•É%èÕÍ•È¹¥°ÁÉ½©•Ñ%°ÁÉ½Ù¥‘•ÈèÉ•ÍÕ±Ğ¹ÁÉ½Ù¥‘•Èñğ€‰Õ¹­¹½İ¸ˆ°ÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ°Ñ…Í­%¹Ñ•¹Ğè€‰Í¥Ñ•}É•Á½ÉÑ}É•Ù¥•Üˆô¤ì(€€€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡…İ…¥Ğ…ÑÑ…¡AÉ½©•ÑA•ÉÍ¥ÍÑ•¹”¡É•ÍÕ±Ğ°ìÁÉ½©•Ñ%°½İ¹•É%èÕÍ•È¹¥°Ñ½­•¸°Ñ½½±QåÁ”è€‰Í¥Ñ•}É•Á½ÉÑ}É•Ù¥•Üˆô¤°ìÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ€ôôô€‰ÍÕ•ÍÌˆ€ü€ÈÀÀ€è€ĞÀÀô¤ì(€€€ô((€€€¥˜€¡Ñ…Í­%¹Ñ•¹Ğ€ôôô€‰•á•ÕÑ¥Ù•}ÍÕµµ…Éäˆ¤ì(€€€€€½¹ÍĞÉ•ÍÕ±Ğ€ô…İ…¥Ğ•á•ÕÑ•á•ÕÑ¥Ù•MÕµµ…ÉåM…™”¡ì(€€€€€€€•á•ÕÑ¥Ù•MÕµµ…ÉåI•ÅÕ•ÍĞèÁ…ÉÍ•á•ÕÑ¥Ù•MÕµµ…ÉåI•ÅÕ•ÍĞ ¡‰½‘ä…Ìì•á•ÕÑ¥Ù•MÕµµ…ÉåI•ÅÕ•ÍĞüèÕ¹­¹½İ¸ô¤¹•á•ÕÑ¥Ù•MÕµµ…ÉåI•ÅÕ•ÍĞ¤ñğì(€€€€€€€€€ÁÉ½©•Ñ%èÁÉ½©•Ñ%ñğ€‰AI(´ÄÀĞàˆ(€€€€€€€ô°(€€€€€€€É•Ù¥•İ•É9½Ñ•ÌèÕÍ•ÉI•ÅÕ•ÍĞ°(€€€€€€€ÁÉ½Ù¥‘•Èè¥¹Ñ•±±¥•¹•AÉ½Ù¥‘•È°(€€€€€€€ÁÉ½©•Ñ%°(€€€€€€€½É…¹¥é…Ñ¥½¹%èÑåÁ•½˜€¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%€ôôô€‰ÍÑÉ¥¹œˆ€üMÑÉ¥¹œ ¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%¤¹Í±¥” À°€àÀ¤€èÕ¹‘•™¥¹•(€€€€€ô¤ì((€€€€€…Õ‘¥ÑÙ•¹Ğ ‰…¤¹Ù½É…}¥¹Ñ•±±¥•¹”¹½µÁ±•Ñ•ˆ°ìÕÍ•É%èÕÍ•È¹¥°ÁÉ½©•Ñ%°ÁÉ½Ù¥‘•ÈèÉ•ÍÕ±Ğ¹ÁÉ½Ù¥‘•Èñğ€‰Õ¹­¹½İ¸ˆ°ÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ°Ñ…Í­%¹Ñ•¹Ğè€‰•á•ÕÑ¥Ù•}ÍÕµµ…Éäˆô¤ì(€€€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡…İ…¥Ğ…ÑÑ…¡AÉ½©•ÑA•ÉÍ¥ÍÑ•¹”¡É•ÍÕ±Ğ°ìÁÉ½©•Ñ%°½İ¹•É%èÕÍ•È¹¥°Ñ½­•¸°Ñ½½±QåÁ”è€‰•á•ÕÑ¥Ù•}ÍÕµµ…Éäˆô¤°ìÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ€ôôô€‰ÍÕ•ÍÌˆ€ü€ÈÀÀ€è€ĞÀÀô¤ì(€€€ô((€€€½¹ÍĞÉ•ÍÕ±Ğ€ô…İ…¥Ğ•á•ÕÑ•Y½É…%¹Ñ•±±¥•¹•M…™”¡ì(€€€€€ÕÍ•ÉI•ÅÕ•ÍĞ°(€€€€€Ñ…Í­%¹Ñ•¹Ğ°(€€€€€ÁÉ½Ù¥‘•Èè¥¹Ñ•±±¥•¹•AÉ½Ù¥‘•È°(€€€€€ÁÉ½©•Ñ%°(€€€€€½É…¹¥é…Ñ¥½¹%èÑåÁ•½˜€¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%€ôôô€‰ÍÑÉ¥¹œˆ€üMÑÉ¥¹œ ¡‰½‘ä…Ìì½É…¹¥é…Ñ¥½¹%üèÕ¹­¹½İ¸ô¤¹½É…¹¥é…Ñ¥½¹%¤¹Í±¥” À°€àÀ¤€èÕ¹‘•™¥¹•(€€€ô¤ì((€€€…Õ‘¥ÑÙ•¹Ğ ‰…¤¹Ù½É…}¥¹Ñ•±±¥•¹”¹½µÁ±•Ñ•ˆ°ìÕÍ•É%èÕÍ•È¹¥°ÁÉ½©•Ñ%°ÁÉ½Ù¥‘•ÈèÉ•ÍÕ±Ğ¹ÁÉ½Ù¥‘•Èñğ€‰Õ¹­¹½İ¸ˆ°ÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌô¤ì(€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡É•ÍÕ±Ğ°ìÍÑ…ÑÕÌèÉ•ÍÕ±Ğ¹ÍÑ…ÑÕÌ€ôôô€‰ÍÕ•ÍÌˆ€ü€ÈÀÀ€è€ÔÀÈô¤ì(€ô((€½¹ÍĞÑ½½°€ôÍ…¹¥Ñ¥é•Q•áĞ ¡‰½‘ä…ÌìÑ½½°üèÕ¹­¹½İ¸ô¤¹Ñ½½°¤…ÌQ½½±M±Õœì(€¥˜€ …Ñ½½°ñğ€…Ñ½½±Ì¹Í½µ” ¡¥Ñ•´¤€ôø¥Ñ•´¹Í±Õœ€ôôôÑ½½°¤¤ì(€€€É•ÑÕÉ¸©Í½¹ÉÉ½È ‹c
ŸgŠ{c
c
¿c
Ÿc
¤ƒc
ŸgŠ{gŠ›c
ßgŠ{g.c
£c
¤ƒc
ëgƒc
ÄƒgŠ›c
çc
Çg.g
c
¤¸ˆ°€ĞÀÀ°€‰U9-9=]9}Q==0ˆ¤ì(€ô((€½¹ÍĞÍ…¹¥Ñ¥é•€ôÍ…¹¥Ñ¥é•A…å±½… ¡‰½‘ä…ÌìÁ…å±½…üèÕ¹­¹½İ¸ô¤¹Á…å±½…ñğíô¤ì(€¥˜€ ‰•ÉÉ½Èˆ¥¸Í…¹¥Ñ¥é•¤ì(€€€É•ÑÕÉ¸©Í½¹ÉÉ½È¡Í…¹¥Ñ¥é•¹•ÉÉ½È°Í…¹¥Ñ¥é•¹ÍÑ…ÑÕÌ°Í…¹¥Ñ¥é•¹½‘”¤ì(€ô(€½¹ÍĞÁÉ½©•Ñ%€ôÁ…ÉÍ•AÉ½©•Ñ% ¡‰½‘ä…ÌìÁÉ½©•Ñ%üèÕ¹­¹½İ¸ô¤¹ÁÉ½©•Ñ%ñğÍ…¹¥Ñ¥é•¹Á…å±½…¹ÁÉ½©•Ñ%¤ì(€½¹ÍĞ½¹Ñ•áĞ€ô…İ…¥Ğ‰Õ¥±‘AÉ½©•Ñ½¹Ñ•áĞ¡ìÑ½­•¸°½İ¹•É%èÕÍ•È¹¥°ÁÉ½©•Ñ%ô¤ì(€¥˜€ ‰•ÉÉ½Èˆ¥¸½¹Ñ•áĞ¤ì(€€€É•ÑÕÉ¸©Í½¹ÉÉ½È¡½¹Ñ•áĞ¹•ÉÉ½È°½¹Ñ•áĞ¹ÍÑ…ÑÕÌ°½¹Ñ•áĞ¹½‘”¤ì(€ô((€ÑÉäì(€€€…Õ‘¥ÑÙ•¹Ğ ‰…¤¹•¹•É…Ñ”¹ÍÑ…ÉÑ•ˆ°ìÕÍ•É%èÕÍ•È¹¥°Ñ½½°°ÁÉ½©•Ñ%°ÁÉ½Ù¥‘•ÈèÁ…ÉÍ•AÉ½Ù¥‘•È ¡‰½‘ä…ÌìÁÉ½Ù¥‘•ÈüèÕ¹­¹½İ¸ô¤¹ÁÉ½Ù¥‘•È¤ñğ€‰…ÕÑ¼ˆô¤ì(€€€½¹ÍĞÉ•ÍÕ±Ğ€ô…İ…¥Ğ•¹•É…Ñ•¥=ÕÑÁÕĞ¡ì(€€€€€Ñ½½°°(€€€€€Á…å±½…èÍ…¹¥Ñ¥é•¹Á…å±½…°(€€€€€ÁÉ½Ù¥‘•ÈèÁ…ÉÍ•AÉ½Ù¥‘•È ¡‰½‘ä…ÌìÁÉ½Ù¥‘•ÈüèÕ¹­¹½İ¸ô¤¹ÁÉ½Ù¥‘•È¤°(€€€€€½¹Ñ•áĞ(€€€ô¤ì((€€€½¹ÍĞÍ…Ù•€ô…İ…¥ĞÍ…Ù••¹•É…Ñ¥½¸¡ì(€€€€€Ñ½­•¸°(€€€€€ÕÍ•É%èÕÍ•È¹¥°(€€€€€ÁÉ½©•Ñ%°(€€€€€Ñ½½°°(€€€€€Á…å±½…èÍ…¹¥Ñ¥é•¹Á…å±½…°(€€€€€½ÕÑÁÕĞèÉ•ÍÕ±Ğ¹½ÕÑÁÕĞ°(€€€€€ÁÉ½Ù¥‘•ÈèÉ•ÍÕ±Ğ¹ÁÉ½Ù¥‘•È°(€€€€€µ½‘•°èÉ•ÍÕ±Ğ¹µ½‘•°°(€€€€€Ñ¥µ•ÍÑ…µÀèÉ•ÍÕ±Ğ¹Ñ¥µ•ÍÑ…µÀ°(€€€€€ÕÍ…”èÉ•ÍÕ±Ğ¹ÕÍ…”°(€€€€€ÁÉ½µÁĞèÉ•ÍÕ±Ğ¹ÁÉ½µÁĞ°(€€€€€•áÁ½ÉÑÌèÉ•ÍÕ±Ğ¹•áÁ½ÉÑÌ°(€€€€€½¹Ñ•áĞ(€€€ô¤ì((€€€…Õ‘¥ÑÙ•¹Ğ ‰…¤¹•¹•É…Ñ”¹½µÁ±•Ñ•ˆ°ìÕÍ•É%èÕÍ•È¹¥°Ñ½½°°ÁÉ½©•Ñ%°ÁÉ½Ù¥‘•ÈèÉ•ÍÕ±Ğ¹ÁÉ½Ù¥‘•È°µ½‘•°èÉ•ÍÕ±Ğ¹µ½‘•°ô¤ì(€€€É•ÑÕÉ¸9•áÑI•ÍÁ½¹Í”¹©Í½¸¡ì€¸¸¹É•ÍÕ±Ğ°Í…Ù•ô¤ì(€ô…Ñ €¡•ÉÉ½È¤ì(€€€…Õ‘¥ÑÙ•¹Ğ ‰…¤¹•¹•É…Ñ”¹™…¥±•ˆ°ìÕÍ•É%èÕÍ•È¹¥°Ñ½½°°ÁÉ½©•Ñ%°•ÉÉ½Èè•ÉÉ½È¥¹ÍÑ…¹•½˜ÉÉ½È€ü•ÉÉ½È¹¹…µ”€è€‰U¹­¹½İ¹ÉÉ½Èˆô¤ì(€€€¥˜€¡•ÉÉ½È¥¹ÍÑ…¹•½˜¥•¹•É…Ñ¥½¹ÉÉ½È¤ì(€€€€€É•ÑÕÉ¸©Í½¹ÉÉ½È¡•ÉÉ½È¹µ•ÍÍ…”°•ÉÉ½È¹ÍÑ…ÑÕÌ°•ÉÉ½È¹½‘”¤ì(€€€ô((€€€É•ÑÕÉ¸©Í½¹ÉÉ½È ‹c
·c
¿c
¬ƒc
»c
ßc
Œƒc
ëgƒc
ÄƒgŠ›c
«g.gŠkc
äƒc
c
¯gŠƒc
Ÿc
„ƒc
—gŠƒc
Óc
Ÿc
„ƒc
ŸgŠ{gŠ›c
·c
«g.gŠÀ¸ƒc
·c
Ÿg.gŠxƒgŠ›c
Çc
¤ƒc
c
»c
ÇgŠÀ¸ˆ°€ÔÀÀ°€‰U9aAQ}9IQ%=9}II=Hˆ¤ì(€ô)ô(4(4(4(4(4(4(