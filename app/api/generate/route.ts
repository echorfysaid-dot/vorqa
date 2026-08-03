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
import type { ProjectAnalysisToolType } from "@/types/project-analysis";

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
    return { error: "ÙŠØ±Ø¬Ù‰ Ø¥Ø±Ø³Ø§Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£Ø¯Ø§Ø© Ø¨Ø´ÙƒÙ„ ØµØ­ÙŠØ­.", status: 400, code: "INVALID_PAYLOAD" } as const;
  }

  const payload: Record<string, string> = {};
  let totalLength = 0;

  for (const [key, rawValue] of Object.entries(value)) {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
    if (!safeKey) continue;

    const safeValue = sanitizeText(rawValue);
    if (safeValue.length > MAX_FIELD_LENGTH) {
      return { error: "Ø¨Ø¹Ø¶ Ø§Ù„Ù…Ø¯Ø®Ù„Ø§Øª Ø·ÙˆÙŠÙ„Ø© Ø¬Ø¯Ø§. Ø§Ø®ØªØµØ± Ø§Ù„Ù†Øµ ÙˆØ­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.", status: 413, code: "FIELD_TOO_LONG" } as const;
    }

    totalLength += safeValue.length;
    if (detectPromptInjection(safeValue)) {
      return { error: "ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø·Ù„Ø¨ Ù„Ø£Ù†Ù‡ ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ ØªØ¹Ù„ÙŠÙ…Ø§Øª ØºÙŠØ± Ø¢Ù…Ù†Ø© Ø£Ùˆ Ù…Ø­Ø§ÙˆÙ„Ø© ØªØ¬Ø§ÙˆØ² Ù„Ù‚ÙˆØ§Ø¹Ø¯ VORA.", status: 400, code: "PROMPT_INJECTION_DETECTED" } as const;
    }
    payload[safeKey] = safeValue;
  }

  if (totalLength > MAX_TOTAL_LENGTH) {
    return { error: "Ø­Ø¬Ù… Ø§Ù„Ø·Ù„Ø¨ ÙƒØ¨ÙŠØ± Ø¬Ø¯Ø§. Ø§Ø®ØªØµØ± Ø§Ù„ØªÙØ§ØµÙŠÙ„ ÙˆØ­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.", status: 413, code: "REQUEST_TOO_LONG" } as const;
  }

  const meaningfulValues = Object.entries(payload).filter(([key, text]) => {
    if (!text) return false;
    return !["language", "tone", "style", "documentType", "channel", "projectId"].includes(key);
  });

  if (!meaningfulValues.length) {
    return { error: "Ø£Ø¶Ù Ù…ÙˆØ¶ÙˆØ¹Ø§ Ø£Ùˆ ØªÙØ§ØµÙŠÙ„ ÙˆØ§Ø¶Ø­Ø© Ø­ØªÙ‰ ØªØªÙ…ÙƒÙ† VORA Ù…Ù† Ø¥Ù†Ø´Ø§Ø¡ Ù…Ø­ØªÙˆÙ‰ Ù…ÙÙŠØ¯.", status: 400, code: "EMPTY_INPUT" } as const;
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
  return value === "docx" ? "docx" : "pdf";
}

function parseExportReport(value: unknown): ExportReadyReport | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const sections = Array.isArray(record.sections) ? record.sections : [];
  if (typeof record.title !== "string" || !sections.length) return undefined;
  return createExportReadyReport({
    title: sanitizeAiText(record.title, 180),
    source: typeof record.source === "string" ? record.source as ExportReadyReport["source"] : "project_intelligence",
    projectId: typeof record.projectId === "string" ? parseProjectId(record.projectId) : undefined,
    projectTitle: typeof record.projectTitle === "string" ? sanitizeAiText(record.projectTitle, 180) : undefined,
    warnings: Array.isArray(record.warnings) ? record.warnings.filter((item): item is string => typeof item === "string").map((item) => sanitizeAiText(item, 500)) : [],
    sections: sections
      .filter((section): section is Record<string, unknown> => Boolean(section && typeof section === "object"))
      .slice(0, 40)
      .map((section, index) => ({
        id: typeof section.id === "string" ? sanitizeAiText(section.id, 80) : `section-${index + 1}`,
        title: typeof section.title === "string" ? sanitizeAiText(section.title, 180) : `Section ${index + 1}`,
        content: Array.isArray(section.content)
          ? section.content.filter((item): item is string => typeof item === "string").map((item) => sanitizeAiText(item, 1200))
          : typeof section.content === "string"
            ? sanitizeAiText(section.content, 1200)
            : "No content available."
      }))
  });
}

function parseTaskIntent(value: unknown): VoraIntelligenceTaskIntent | undefined {
  if (typeof value !== "string") return undefined;
  const allowed = new Set<VoraIntelligenceTaskIntent>([
    "general_assistance",
    "document_review",
    "contract_review",
    "risk_assessment",
    "risk_review",
    "planning_review",
    "site_report_review",
    "executive_summary",
    "planning",
    "cost_review",
    "quality_review",
    "safety_review",
    "schedule_review",
    "compliance_review"
  ]);
  return allowed.has(value as VoraIntelligenceTaskIntent) ? (value as VoraIntelligenceTaskIntent) : undefined;
}

function sanitizeContractText(value: unknown) {
  if (typeof value !== "string") return "";
  return sanitizeAiText(value, MAX_CONTRACT_TEXT_LENGTH);
}

function parseContractDocument(value: unknown): ContractReviewDocumentInput | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const name = sanitizeAiText(typeof record.name === "string" ? record.name : "", 180);
  if (!name) return undefined;
  const mimeType = sanitizeAiText(typeof record.mimeType === "string" ? record.mimeType : "", 120) || undefined;
  const sizeBytes = typeof record.sizeBytes === "number" && Number.isFinite(record.sizeBytes) && record.sizeBytes >= 0 ? record.sizeBytes : undefined;
  return {
    name,
    mimeType,
    sizeBytes,
    text: sanitizeContractText(record.text)
  };
}

function sanitizeBoqText(value: unknown) {
  if (typeof value !== "string") return "";
  return sanitizeAiText(value, MAX_BOQ_TEXT_LENGTH);
}

function parseBoqDelimiter(value: unknown): BoqReviewDocument["delimiter"] | undefined {
  return value === "," || value === "\t" || value === ";" || value === "|" ? value : undefined;
}

function parseBoqDocument(value: unknown): BoqReviewDocument | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const name = sanitizeAiText(typeof record.name === "string" ? record.name : "", 180);
  if (!name) return undefined;
  const mimeType = sanitizeAiText(typeof record.mimeType === "string" ? record.mimeType : "", 120) || undefined;
  const sizeBytes = typeof record.sizeBytes === "number" && Number.isFinite(record.sizeBytes) && record.sizeBytes >= 0 ? record.sizeBytes : undefined;
  return {
    name,
    mimeType,
    sizeBytes,
    text: sanitizeBoqText(record.text),
    delimiter: parseBoqDelimiter(record.delimiter)
  };
}

function sanitizeRiskText(value: unknown) {
  if (typeof value !== "string") return "";
  return sanitizeAiText(value, MAX_RISK_TEXT_LENGTH);
}

function parseRiskDocument(value: unknown): RiskAssessmentDocumentInput | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const name = sanitizeAiText(typeof record.name === "string" ? record.name : "", 180);
  if (!name) return undefined;
  const mimeType = sanitizeAiText(typeof record.mimeType === "string" ? record.mimeType : "", 120) || undefined;
  const sizeBytes = typeof record.sizeBytes === "number" && Number.isFinite(record.sizeBytes) && record.sizeBytes >= 0 ? record.sizeBytes : undefined;
  return {
    name,
    mimeType,
    sizeBytes,
    text: sanitizeRiskText(record.text)
  };
}

function parseRiskSource(value: unknown) {
  if (typeof value === "string") return sanitizeRiskText(value);
  return value;
}

function sanitizePlanningText(value: unknown) {
  if (typeof value !== "string") return "";
  return sanitizeAiText(value, MAX_PLANNING_TEXT_LENGTH);
}

function parsePlanningDelimiter(value: unknown): PlanningReviewDocument["delimiter"] | undefined {
  return value === "," || value === "\t" || value === ";" || value === "|" ? value : undefined;
}

function parsePlanningDocument(value: unknown): PlanningReviewDocument | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const name = sanitizeAiText(typeof record.name === "string" ? record.name : "", 180);
  if (!name) return undefined;
  const mimeType = sanitizeAiText(typeof record.mimeType === "string" ? record.mimeType : "", 120) || undefined;
  const sizeBytes = typeof record.sizeBytes === "number" && Number.isFinite(record.sizeBytes) && record.sizeBytes >= 0 ? record.sizeBytes : undefined;
  return {
    name,
    mimeType,
    sizeBytes,
    text: sanitizePlanningText(record.text),
    delimiter: parsePlanningDelimiter(record.delimiter)
  };
}

function sanitizeSiteReportText(value: unknown) {
  if (typeof value !== "string") return "";
  return sanitizeAiText(value, MAX_SITE_REPORT_TEXT_LENGTH);
}

function parseSiteReportDelimiter(value: unknown): SiteReportReviewDocument["delimiter"] | undefined {
  return value === "," || value === "\t" || value === ";" || value === "|" ? value : undefined;
}

function parseSiteReportDocument(value: unknown): SiteReportReviewDocument | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const name = sanitizeAiText(typeof record.name === "string" ? record.name : "", 180);
  if (!name) return undefined;
  const mimeType = sanitizeAiText(typeof record.mimeType === "string" ? record.mimeType : "", 120) || undefined;
  const sizeBytes = typeof record.sizeBytes === "number" && Number.isFinite(record.sizeBytes) && record.sizeBytes >= 0 ? record.sizeBytes : undefined;
  return {
    name,
    mimeType,
    sizeBytes,
    text: sanitizeSiteReportText(record.text),
    delimiter: parseSiteReportDelimiter(record.delimiter)
  };
}

function parseExecutiveSummaryRequest(value: unknown): ExecutiveSummaryRequest | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const projectId = parseProjectId(record.projectId);
  if (!projectId) return undefined;
  return {
    projectId,
    projectTitle: sanitizeAiText(typeof record.projectTitle === "string" ? record.projectTitle : "", 180) || undefined,
    projectStatus: sanitizeAiText(typeof record.projectStatus === "string" ? record.projectStatus : "", 80) || undefined,
    organizationName: sanitizeAiText(typeof record.organizationName === "string" ? record.organizationName : "", 180) || undefined
  };
}

async function buildProjectContext({ token, ownerId, projectId }: { token: string; ownerId: string; projectId: string }): Promise<ProjectAiContext | { error: string; status: number; code: string }> {
  void token;
  void ownerId;

  if (!projectId) {
    const organization = await aiContextRepository.buildOrganizationContext("atlas");
    return {
      organization: organization.organization,
      project: null,
      members: [],
      departments: [],
      employees: organization.employees,
      tasks: [],
      timeline: null,
      milestones: [],
      budget: null,
      documents: [],
      knowledge: [],
      memory: [],
      references: ["organization:atlas"],
      source: organization.source,
      errors: organization.errors.filter((error): error is string => typeof error === "string")
    };
  }

  const context = await aiContextRepository.buildProjectContext(projectId);
  if (!context.project) {
    return { error: "Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯ Ø£Ùˆ Ù„Ø§ ØªÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ© Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„ÙŠÙ‡.", status: 404, code: "PROJECT_NOT_FOUND" };
  }
  return context;
}

export async function POST(request: Request) {
  const limit = await checkRateLimitAsync(request, "ai");
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const token = getBearerToken(request);
  if (!token) {
    return jsonError("ÙŠØ±Ø¬Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù‚Ø¨Ù„ Ø§Ø³ØªØ®Ø¯Ø§Ù… VORA.", 401, "AUTH_REQUIRED");
  }

  if (!isSupabaseServerConfigured()) {
    return jsonError("Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø© ØºÙŠØ± Ù…ÙƒØªÙ…Ù„Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø§Ø¯Ù….", 503, "SUPABASE_NOT_CONFIGURED");
  }

  const user = await verifySupabaseUser(token);
  if (isApiError(user)) {
    return jsonError("Ø§Ù†ØªÙ‡Øª Ø§Ù„Ø¬Ù„Ø³Ø© Ø£Ùˆ ØªØ¹Ø°Ø± Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…. Ø³Ø¬Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.", user.status === 401 ? 401 : 403, "AUTH_INVALID");
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return jsonError("ØµÙŠØºØ© Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± ØµØ­ÙŠØ­Ø©.", 400, "INVALID_JSON");
  }

  if (parseMode((body as { mode?: unknown }).mode) === "document_parse") {
    const document = parseDocumentParseInput((body as { document?: unknown }).document);
    if (!document) return jsonError("Document parsing requires a document filename.", 400, "INVALID_DOCUMENT_PARSE");
    const parsed = await parseConstructionDocument(document);
    auditEvent("document.parse.completed", { userId: user.id, filename: document.filename, status: parsed.status });
    return NextResponse.json({
      status: parsed.ok ? "success" : "failed",
      parsingStatus: {
        ok: parsed.ok,
        status: parsed.status,
        warnings: parsed.warnings,
        errors: parsed.errors
      },
      document: parsed.document
    }, { status: parsed.ok ? 200 : 400 });
  }

  if (parseMode((body as { mode?: unknown }).mode) === "knowledge_index") {
    const projectId = parseProjectId((body as { projectId?: unknown }).projectId);
    const documentInput = parseDocumentParseInput((body as { document?: unknown }).document);
    if (!projectId || !documentInput) return jsonError("Knowledge indexing requires a project ID and document.", 400, "INVALID_KNOWLEDGE_INDEX");
    const indexed = await knowledgeEngine.indexDocument({ projectId, documentInput });
    auditEvent("knowledge.index.completed", { userId: user.id, projectId, status: indexed.status, chunkCount: indexed.chunkCount });
    return NextResponse.json({
      status: indexed.ok ? "success" : "failed",
      indexingStatus: indexed
    }, { status: indexed.ok ? 200 : 400 });
  }

  if (parseMode((body as { mode?: unknown }).mode) === "knowledge_search") {
    const query = parseKnowledgeQuery(body);
    if (!query) return jsonError("Knowledge search requires a project ID and query.", 400, "INVALID_KNOWLEDGE_SEARCH");
    const searched = await knowledgeEngine.search(query);
    auditEvent("knowledge.search.completed", { userId: user.id, projectId: query.projectId, status: searched.status, resultCount: searched.results.length });
    return NextResponse.json({
      status: searched.ok ? "success" : "failed",
      searchStatus: searched
    }, { status: searched.ok ? 200 : 400 });
  }

  if (parseMode((body as { mode?: unknown }).mode) === "copilot_chat") {
    const copilotInput = parseCopilotChatInput(body, user.id);
    if (!copilotInput) return jsonError("Copilot chat requires a project ID and question.", 400, "INVALID_COPILOT_CHAT");
    const result = await executeCopilotChatSafe(copilotInput);
    auditEvent("copilot.chat.completed", { userId: user.id, projectId: copilotInput.projectId, sessionId: result.session.id, status: result.status, retrievalStatus: result.retrievalStatus });
    return NextResponse.json({
      status: result.status,
      copilot: result
    }, { status: result.status === "success" ? 200 : 500 });
  }

  if (parseMode((body as { mode?: unknown }).mode) === "ai_orchestrator") {
    const userRequest = sanitizeAiText(typeof (body as { userRequest?: unknown }).userRequest === "string" ? String((body as { userRequest?: unknown }).userRequest) : "", 4000);
    if (!userRequest) return jsonError("AI orchestration requires a user request.", 400, "INVALID_AI_ORCHESTRATOR");
    const projectId = parseProjectId((body as { projectId?: unknown }).projectId) || "PRJ-1048";
    const now = new Date();
    const context = createAiApplicationContext({
      pathname: `/projects/${projectId}`,
      searchParams: new URLSearchParams("mode=ai_orchestrator"),
      language: typeof (body as { language?: unknown }).language === "string" ? sanitizeAiText(String((body as { language?: unknown }).language), 20) : "ar",
      direction: (body as { direction?: unknown }).direction === "ltr" ? "ltr" : "rtl",
      theme: "dark",
      isAuthenticated: true,
      now
    });
    const memory = createAiMemory({
      context,
      session: { sessionId: `ai-orchestrator:${projectId}:${now.toISOString()}`, startedAt: now.toISOString() },
      conversation: { title: "AI Orchestration", messageCount: 1, lastInteractionAt: now.toISOString() },
      now
    });
    const prompt = createAiPromptPayload({
      context,
      memory,
      userRequest,
      taskIntent: parseAiTaskIntentValue((body as { taskIntent?: unknown }).taskIntent),
      outputPreferences: {
        language: context.language,
        responseFormat: "markdown",
        includeRecommendations: true
      },
      now
    });
    const policyId = parseAiExecutionPolicyId((body as { policyId?: unknown }).policyId);
    const result = await executeAiOrchestrator({
      prompt,
      policyId,
      providerPreference: (body as { provider?: unknown }).provider === "openai" || (body as { provider?: unknown }).provider === "anthropic" || (body as { provider?: unknown }).provider === "gemini" || (body as { provider?: unknown }).provider === "openrouter" || (body as { provider?: unknown }).provider === "mock"
        ? ((body as { provider: "openai" | "anthropic" | "gemini" | "openrouter" | "mock" }).provider)
        : "auto",
      availableProviders: parseProviderAvailabilityInput((body as { availableProviders?: unknown }).availableProviders),
      options: {
        policyId,
        responseFormat: "markdown",
        allowFallback: true
      },
      now
    });
    auditEvent("ai.orchestrator.completed", { userId: user.id, projectId, status: result.status, provider: result.provider || "none", model: result.model || "none" });
    return NextResponse.json({
      status: result.status,
      orchestration: result
    }, { status: result.status === "success" ? 200 : 503 });
  }

  if (parseMode((body as { mode?: unknown }).mode) === "project_comment") {
    const parsed = parseCollaborationBase(body, user.id);
    if (!parsed) return jsonError("Project comment requires a project ID.", 400, "INVALID_PROJECT_COMMENT");
    const action = typeof parsed.record.action === "string" ? parsed.record.action : "add";
    const result = action === "resolve"
      ? collaborationEngine.comments.resolve({
          projectId: parsed.projectId,
          ownerId: parsed.ownerId,
          userId: parsed.actorId,
          commentId: typeof parsed.record.commentId === "string" ? sanitizeAiText(parsed.record.commentId, 120) : ""
        })
      : collaborationEngine.comments.add({
          projectId: parsed.projectId,
          ownerId: parsed.ownerId,
          authorId: parsed.actorId,
          targetType: parseAnalysisToolType(parsed.record.targetType),
          targetId: typeof parsed.record.targetId === "string" ? sanitizeAiText(parsed.record.targetId, 120) : "analysis",
          body: typeof parsed.record.body === "string" ? sanitizeAiText(parsed.record.body, 2000) : "",
          threadId: typeof parsed.record.threadId === "string" ? sanitizeAiText(parsed.record.threadId, 120) : undefined
        });
    auditEvent("collaboration.comment.completed", { userId: user.id, projectId: parsed.projectId, status: result.status, action });
    return NextResponse.json({ status: result.status, comment: result }, { status: result.ok ? 200 : 403 });
  }

  if (parseMode((body as { mode?: unknown }).mode) === "project_review") {
    const parsed = parseCollaborationBase(body, user.id);
    if (!parsed) return jsonError("Project review requires a project ID.", 400, "INVALID_PROJECT_REVIEW");
    const action = typeof parsed.record.action === "string" ? parsed.record.action : "create";
    const result = action === "transition"
      ? collaborationEngine.reviews.transition({
          projectId: parsed.projectId,
          ownerId: parsed.ownerId,
          actorId: parsed.actorId,
          reviewId: typeof parsed.record.reviewId === "string" ? sanitizeAiText(parsed.record.reviewId, 120) : "",
          status: parsed.record.status === "approved" || parsed.record.status === "rejected" || parsed.record.status === "archived" || parsed.record.status === "draft" || parsed.record.status === "in_review" ? parsed.record.status : "in_review",
          notes: typeof parsed.record.notes === "string" ? sanitizeAiText(parsed.record.notes, 1000) : undefined
        })
      : collaborationEngine.reviews.create({
          projectId: parsed.projectId,
          ownerId: parsed.ownerId,
          requestedBy: parsed.actorId,
          targetType: parseAnalysisToolType(parsed.record.targetType),
          targetId: typeof parsed.record.targetId === "string" ? sanitizeAiText(parsed.record.targetId, 120) : "analysis",
          reviewerId: typeof parsed.record.reviewerId === "string" ? sanitizeAiText(parsed.record.reviewerId, 120) : undefined
        });
    auditEvent("collaboration.review.completed", { userId: user.id, projectId: parsed.projectId, status: result.status, action });
    return NextResponse.json({ status: result.status, review: result }, { status: result.ok ? 200 : 403 });
  }

  if (parseMode((body as { mode?: unknown }).mode) === "project_activity") {
    const parsed = parseCollaborationBase(body, user.id);
    if (!parsed) return jsonError("Project activity requires a project ID.", 400, "INVALID_PROJECT_ACTIVITY");
    const activity = collaborationEngine.activity.list(parsed.projectId);
    const audit = collaborationEngine.audit.list({ target: parsed.projectId });
    auditEvent("collaboration.activity.listed", { userId: user.id, projectId: parsed.projectId, activityCount: activity.length });
    return NextResponse.json({ status: "success", activity, audit });
  }

  if (parseMode((body as { mode?: unknown }).mode) === "runtime_health") {
    const started = Date.now();
    const snapshot = await getRuntimeMonitorSnapshot();
    const duration = Date.now() - started;
    recordPerformanceMetric("runtime_health", duration);
    logRuntimeEvent({
      requestId: createRequestId("runtime-health"),
      ownerId: user.id,
      operation: "runtime_health",
      duration,
      status: snapshot.health.status === "unhealthy" ? "failed" : "success",
      warnings: snapshot.health.warnings,
      metadata: { healthStatus: snapshot.health.status }
    });
    return NextResponse.json({ status: "success", runtime: snapshot });
  }

  if (parseMode((body as { mode?: unknown }).mode) === "performance_metrics") {
    const metrics = getPerformanceMetrics();
    logRuntimeEvent({
      requestId: createRequestId("performance-metrics"),
      ownerId: user.id,
      operation: "performance_metrics",
      duration: 0,
      status: "success",
      warnings: [],
      metadata: { cacheHitRate: metrics.cache.hitRate, operationCount: metrics.operations.length }
    });
    return NextResponse.json({ status: "success", performance: getPerformanceMetrics() });
  }

  if (parseMode((body as { mode?: unknown }).mode) === "report_export") {
    const report = parseExportReport((body as { report?: unknown }).report);
    if (!report) return jsonError("Report export requires a normalized report with title and sections.", 400, "INVALID_REPORT_EXPORT");
    const format = parseExportFormat((body as { format?: unknown }).format);
    const exported = exportProfessionalReportSafe({
      report,
      format,
      metadata: {
        projectName: typeof (body as { projectName?: unknown }).projectName === "string" ? sanitizeAiText(String((body as { projectName?: unknown }).projectName), 180) : report.projectTitle,
        projectId: report.projectId,
        client: typeof (body as { client?: unknown }).client === "string" ? sanitizeAiText(String((body as { client?: unknown }).client), 180) : undefined,
        organization: typeof (body as { organization?: unknown }).organization === "string" ? sanitizeAiText(String((body as { organization?: unknown }).organization), 180) : undefined,
        analysisType: report.source.replace(/_/g, " "),
        healthScore: typeof (body as { healthScore?: unknown }).healthScore === "string" ? sanitizeAiText(String((body as { healthScore?: unknown }).healthScore), 80) : undefined,
        confidenceScore: typeof (body as { confidenceScore?: unknown }).confidenceScore === "number" ? Number((body as { confidenceScore?: unknown }).confidenceScore) : undefined,
        generatedAt: report.generatedAt
      }
    });
    if (!exported.status.ok || !("base64" in exported)) {
      return NextResponse.json({ status: "failed", exportStatus: exported.status }, { status: 500 });
    }
    auditEvent("report.export.completed", { userId: user.id, projectId: report.projectId, format, source: report.source });
    return NextResponse.json({
      status: "success",
      exportStatus: exported.status,
      file: {
        filename: exported.filename,
        mimeType: exported.mimeType,
        base64: exported.base64
      }
    });
  }

  if (parseMode((body as { mode?: unknown }).mode) === "vora_intelligence") {
    const userRequest = sanitizeText((body as { userRequest?: unknown }).userRequest);
    if (!userRequest) {
      return jsonError("Ø£Ø¶Ù Ø·Ù„Ø¨Ø§ ÙˆØ§Ø¶Ø­Ø§ Ø­ØªÙ‰ ØªØªÙ…ÙƒÙ† VORA Ù…Ù† ØªØ´ØºÙŠÙ„ Ù…Ø³Ø§Ø± Ø§Ù„Ø°ÙƒØ§Ø¡.", 400, "EMPTY_INPUT");
    }
    if (detectPromptInjection(userRequest)) {
      return jsonError("ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø·Ù„Ø¨ Ù„Ø£Ù†Ù‡ ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ ØªØ¹Ù„ÙŠÙ…Ø§Øª ØºÙŠØ± Ø¢Ù…Ù†Ø© Ø£Ùˆ Ù…Ø­Ø§ÙˆÙ„Ø© ØªØ¬Ø§ÙˆØ² Ù„Ù‚ÙˆØ§Ø¹Ø¯ VORA.", 400, "PROMPT_INJECTION_DETECTED");
    }

    const projectId = parseProjectId((body as { projectId?: unknown }).projectId);
    const provider = parseProvider((body as { provider?: unknown }).provider);
    const intelligenceProvider = provider === "openai" || provider === "mock" ? provider : "auto";
    const taskIntent = parseTaskIntent((body as { taskIntent?: unknown }).taskIntent);
    auditEvent("ai.vora_intelligence.started", { userId: user.id, projectId, provider: intelligenceProvider, taskIntent: taskIntent || "general_assistance" });

    if (taskIntent === "contract_review") {
      const result = await executeContractReviewSafe({
        document: parseContractDocument((body as { contractDocument?: unknown }).contractDocument),
        reviewerNotes: userRequest,
        provider: intelligenceProvider,
        projectId,
        organizationId: typeof (body as { organizationId?: unknown }).organizationId === "string" ? String((body as { organizationId?: unknown }).organizationId).slice(0, 80) : undefined
      });

      auditEvent("ai.vora_intelligence.completed", { userId: user.id, projectId, provider: result.provider || "unknown", status: result.status, taskIntent: "contract_review" });
      return NextResponse.json(await attachProjectPersistence(result, { projectId, ownerId: user.id, token, toolType: "contract_review" }), { status: result.status === "success" ? 200 : 400 });
    }

    if (taskIntent === "cost_review" && (body as { boqDocument?: unknown }).boqDocument) {
      const result = await executeBoqReviewSafe({
        document: parseBoqDocument((body as { boqDocument?: unknown }).boqDocument),
        reviewerNotes: userRequest,
        provider: intelligenceProvider,
        projectId,
        organizationId: typeof (body as { organizationId?: unknown }).organizationId === "string" ? String((body as { organizationId?: unknown }).organizationId).slice(0, 80) : undefined
      });

      auditEvent("ai.vora_intelligence.completed", { userId: user.id, projectId, provider: result.provider || "unknown", status: result.status, taskIntent: "cost_review" });
      return NextResponse.json(await attachProjectPersistence(result, { projectId, ownerId: user.id, token, toolType: "boq_review" }), { status: result.status === "success" ? 200 : 400 });
    }

    if (taskIntent === "risk_assessment") {
      const result = await executeRiskAssessmentSafe({
        contractReview: parseRiskSource((body as { contractReview?: unknown }).contractReview),
        boqReview: parseRiskSource((body as { boqReview?: unknown }).boqReview),
        notes: sanitizeRiskText((body as { riskNotes?: unknown }).riskNotes),
        document: parseRiskDocument((body as { riskDocument?: unknown }).riskDocument),
        reviewerNotes: userRequest,
        provider: intelligenceProvider,
        projectId,
        organizationId: typeof (body as { organizationId?: unknown }).organizationId === "string" ? String((body as { organizationId?: unknown }).organizationId).slice(0, 80) : undefined
      });

      auditEvent("ai.vora_intelligence.completed", { userId: user.id, projectId, provider: result.provider || "unknown", status: result.status, taskIntent: "risk_assessment" });
      return NextResponse.json(await attachProjectPersistence(result, { projectId, ownerId: user.id, token, toolType: "risk_assessment" }), { status: result.status === "success" ? 200 : 400 });
    }

    if (taskIntent === "planning_review") {
      const result = await executePlanningReviewSafe({
        document: parsePlanningDocument((body as { planningDocument?: unknown }).planningDocument),
        planningNotes: sanitizePlanningText((body as { planningNotes?: unknown }).planningNotes),
        reviewerNotes: userRequest,
        provider: intelligenceProvider,
        projectId,
        organizationId: typeof (body as { organizationId?: unknown }).organizationId === "string" ? String((body as { organizationId?: unknown }).organizationId).slice(0, 80) : undefined
      });

      auditEvent("ai.vora_intelligence.completed", { userId: user.id, projectId, provider: result.provider || "unknown", status: result.status, taskIntent: "planning_review" });
      return NextResponse.json(await attachProjectPersistence(result, { projectId, ownerId: user.id, token, toolType: "planning_review" }), { status: result.status === "success" ? 200 : 400 });
    }

    if (taskIntent === "site_report_review") {
      const result = await executeSiteReportReviewSafe({
        document: parseSiteReportDocument((body as { siteReportDocument?: unknown }).siteReportDocument),
        siteReportNotes: sanitizeSiteReportText((body as { siteReportNotes?: unknown }).siteReportNotes),
        reviewerNotes: userRequest,
        provider: intelligenceProvider,
        projectId,
        organizationId: typeof (body as { organizationId?: unknown }).organizationId === "string" ? String((body as { organizationId?: unknown }).organizationId).slice(0, 80) : undefined
      });

      auditEvent("ai.vora_intelligence.completed", { userId: user.id, projectId, provider: result.provider || "unknown", status: result.status, taskIntent: "site_report_review" });
      return NextResponse.json(await attachProjectPersistence(result, { projectId, ownerId: user.id, token, toolType: "site_report_review" }), { status: result.status === "success" ? 200 : 400 });
    }

    if (taskIntent === "executive_summary") {
      const result = await executeExecutiveSummarySafe({
        executiveSummaryRequest: parseExecutiveSummaryRequest((body as { executiveSummaryRequest?: unknown }).executiveSummaryRequest) || {
          projectId: projectId || "PRJ-1048"
        },
        reviewerNotes: userRequest,
        provider: intelligenceProvider,
        projectId,
        organizationId: typeof (body as { organizationId?: unknown }).organizationId === "string" ? String((body as { organizationId?: unknown }).organizationId).slice(0, 80) : undefined
      });

      auditEvent("ai.vora_intelligence.completed", { userId: user.id, projectId, provider: result.provider || "unknown", status: result.status, taskIntent: "executive_summary" });
      return NextResponse.json(await attachProjectPersistence(result, { projectId, ownerId: user.id, token, toolType: "executive_summary" }), { status: result.status === "success" ? 200 : 400 });
    }

    const result = await executeVoraIntelligenceSafe({
      userRequest,
      taskIntent,
      provider: intelligenceProvider,
      projectId,
      organizationId: typeof (body as { organizationId?: unknown }).organizationId === "string" ? String((body as { organizationId?: unknown }).organizationId).slice(0, 80) : undefined
    });

    auditEvent("ai.vora_intelligence.completed", { userId: user.id, projectId, provider: result.provider || "unknown", status: result.status });
    return NextResponse.json(result, { status: result.status === "success" ? 200 : 502 });
  }

  const tool = sanitizeText((body as { tool?: unknown }).tool) as ToolSlug;
  if (!tool || !tools.some((item) => item.slug === tool)) {
    return jsonError("Ø§Ù„Ø£Ø¯Ø§Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙØ©.", 400, "UNKNOWN_TOOL");
  }

  const sanitized = sanitizePayload((body as { payload?: unknown }).payload || {});
  if ("error" in sanitized) {
    return jsonError(sanitized.error, sanitized.status, sanitized.code);
  }
  const projectId = parseProjectId((body as { projectId?: unknown }).projectId || sanitized.payload.projectId);
  const context = await buildProjectContext({ token, ownerId: user.id, projectId });
  if ("error" in context) {
    return jsonError(context.error, context.status, context.code);
  }

  try {
    auditEvent("ai.generate.started", { userId: user.id, tool, projectId, provider: parseProvider((body as { provider?: unknown }).provider) || "auto" });
    const result = await generateAiOutput({
      tool,
      payload: sanitized.payload,
      provider: parseProvider((body as { provider?: unknown }).provider),
      context
    });

    const saved = await saveGeneration({
      token,
      userId: user.id,
      projectId,
      tool,
      payload: sanitized.payload,
      output: result.output,
      provider: result.provider,
      model: result.model,
      timestamp: result.timestamp,
      usage: result.usage,
      prompt: result.prompt,
      exports: result.exports,
      context
    });

    auditEvent("ai.generate.completed", { userId: user.id, tool, projectId, provider: result.provider, model: result.model });
    return NextResponse.json({ ...result, saved });
  } catch (error) {
    auditEvent("ai.generate.failed", { userId: user.id, tool, projectId, error: error instanceof Error ? error.name : "UnknownError" });
    if (error instanceof AiGenerationError) {
      return jsonError(error.message, error.status, error.code);
    }

    return jsonError("Ø­Ø¯Ø« Ø®Ø·Ø£ ØºÙŠØ± Ù…ØªÙˆÙ‚Ø¹ Ø£Ø«Ù†Ø§Ø¡ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙˆÙ‰. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.", 500, "UNEXPECTED_GENERATION_ERROR");
  }
}






