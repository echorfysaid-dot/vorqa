import {
  inferDocumentType,
  normalizeDocument,
  type DocumentContent,
  type DocumentDescriptor,
  type DocumentMetadata,
  type DocumentType
} from "@/lib/document-intelligence";
import { parseDocumentWithAdapter } from "@/lib/document-parser-adapters";
import {
  executeVoraIntelligence,
  executeVoraIntelligenceSafe,
  type VoraIntelligenceExecutionRequest,
  type VoraIntelligenceExecutionWarning,
  type VoraNormalizedIntelligenceResponse
} from "@/lib/vora-intelligence-service";

export type SiteReportReviewDocument = Readonly<{
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  text?: string;
  delimiter?: "," | "\t" | ";" | "|";
}>;

export type SiteReportReviewInput = Readonly<
  Omit<VoraIntelligenceExecutionRequest, "taskIntent" | "documents" | "documentMetadata" | "documentContent" | "userRequest"> & {
    document?: SiteReportReviewDocument;
    siteReportNotes?: string;
    reviewerNotes?: string;
  }
>;

export type SiteObservationCategory = "progress" | "safety" | "quality" | "execution" | "documentation" | "general";

export type SiteObservation = Readonly<{
  rowNumber: number;
  category: SiteObservationCategory;
  text: string;
  date?: string;
  responsiblePerson?: string;
  status?: string;
  followUpRequired: boolean;
  raw: Readonly<Record<string, string>>;
}>;

export type SiteReportIssueCode =
  | "missing_report"
  | "unsupported_format"
  | "empty_content"
  | "parser_placeholder_only"
  | "missing_observation"
  | "missing_responsible_person"
  | "missing_date"
  | "repeated_observation"
  | "incomplete_progress_note"
  | "safety_observation"
  | "quality_observation"
  | "execution_observation"
  | "documentation_gap"
  | "follow_up_required";

export type SiteReportIssue = Readonly<{
  code: SiteReportIssueCode;
  severity: "info" | "warning" | "critical";
  message: string;
  rowNumber?: number;
  field?: string;
}>;

export type SiteReportReviewSummary = Readonly<{
  observationCount: number;
  progressObservationCount: number;
  safetyObservationCount: number;
  qualityObservationCount: number;
  executionObservationCount: number;
  documentationGapCount: number;
  followUpCount: number;
  duplicateCount: number;
  issueCount: number;
  reportCompleteness: number;
}>;

export type SiteReportReviewPreparation = Readonly<{
  valid: boolean;
  errors: readonly SiteReportIssue[];
  warnings: readonly VoraIntelligenceExecutionWarning[];
  descriptor?: DocumentDescriptor;
  documentContent?: DocumentContent;
  documentMetadata?: DocumentMetadata;
  observations: readonly SiteObservation[];
  issues: readonly SiteReportIssue[];
  summary: SiteReportReviewSummary;
  userRequest?: string;
}>;

export type SiteReportReviewStructuredResult = Readonly<{
  executiveSummary: string;
  siteReportOverview: string;
  progressObservations: readonly SiteObservation[];
  safetyFindings: readonly SiteReportIssue[];
  qualityFindings: readonly SiteReportIssue[];
  executionFindings: readonly SiteReportIssue[];
  documentationGaps: readonly SiteReportIssue[];
  itemsRequiringFollowUp: readonly SiteReportIssue[];
  recommendedActions: readonly string[];
  warnings: readonly VoraIntelligenceExecutionWarning[];
  confidence: VoraNormalizedIntelligenceResponse["confidence"];
  summary: SiteReportReviewSummary;
}>;

export type SiteReportReviewResponse = VoraNormalizedIntelligenceResponse &
  Readonly<{
    siteReportReview?: SiteReportReviewStructuredResult;
  }>;

const supportedSiteReportTypes: readonly DocumentType[] = ["txt", "markdown", "csv", "pdf", "docx"];
const readableSiteReportTypes: readonly DocumentType[] = ["txt", "markdown", "csv"];
const maxSiteReportCharacters = 18_000;

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const property of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[property];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function warning(code: string, message: string, severity: VoraIntelligenceExecutionWarning["severity"] = "warning"): VoraIntelligenceExecutionWarning {
  return { code, message, severity };
}

function issue(code: SiteReportIssueCode, message: string, severity: SiteReportIssue["severity"], rowNumber?: number, field?: string): SiteReportIssue {
  return { code, message, severity, rowNumber, field };
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site-report";
}

function truncateText(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxSiteReportCharacters) return { text: normalized, truncated: false };
  return {
    text: `${normalized.slice(0, maxSiteReportCharacters - 39).trimEnd()}\n[SITE_REPORT_TEXT_TRUNCATED]`,
    truncated: true
  };
}

function createDescriptor(document: SiteReportReviewDocument): DocumentDescriptor {
  const type = document.name.toLowerCase().endsWith(".csv") || document.name.toLowerCase().endsWith(".tsv")
    ? "csv"
    : inferDocumentType({ mimeType: document.mimeType, name: document.name, category: "report" });
  return normalizeDocument({
    id: `site-report-review:${slug(document.name)}`,
    name: document.name,
    type,
    source: "upload",
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    metadata: {
      title: document.name,
      category: "report",
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      sourceName: document.name,
      tags: ["site-report", "progress", "quality", "safety"]
    }
  });
}

function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function detectDelimiter(text: string, requested?: SiteReportReviewDocument["delimiter"]) {
  if (requested) return requested;
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || "";
  const candidates: Array<"," | "\t" | ";" | "|"> = [",", "\t", ";", "|"];
  return candidates.map((delimiter) => ({ delimiter, count: splitDelimitedLine(firstLine, delimiter).length })).sort((left, right) => right.count - left.count)[0]?.delimiter || ",";
}

function normalizeHeader(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function columnFor(header: string) {
  const normalized = normalizeHeader(header);
  if (/observation|note|description|detail|comment|finding|diary|report/.test(normalized)) return "text";
  if (/date|day|time/.test(normalized)) return "date";
  if (/responsible|owner|assignee|engineer|inspector|supervisor|person/.test(normalized)) return "responsiblePerson";
  if (/status|state|condition/.test(normalized)) return "status";
  if (/category|type|discipline|section/.test(normalized)) return "category";
  return "unknown";
}

function rowsFromMarkdown(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line))
    .map((line) => line.slice(1, -1).split("|").map((cell) => cell.trim()));
}

function rowsFromDelimited(text: string, delimiter?: SiteReportReviewDocument["delimiter"]) {
  const actualDelimiter = detectDelimiter(text, delimiter);
  return text.split(/\r?\n/).filter((line) => line.trim()).map((line) => splitDelimitedLine(line, actualDelimiter));
}

function rowsFromPlainText(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim().replace(/^[-*]\s+/, "")).filter(Boolean);
  return [["observation"], ...lines.map((line) => [line])];
}

function parseRows(document: SiteReportReviewDocument, descriptor: DocumentDescriptor, text: string) {
  if (descriptor.type === "markdown" && text.includes("|")) return rowsFromMarkdown(text);
  if (descriptor.type === "csv" || document.delimiter || text.includes(",") || text.includes("\t") || text.includes(";")) return rowsFromDelimited(text, document.delimiter);
  return rowsFromPlainText(text);
}

function classifyObservation(text: string, explicitCategory?: string): SiteObservationCategory {
  const source = `${explicitCategory || ""} ${text}`.toLowerCase();
  if (/safety|incident|hazard|ppe|hse|unsafe|accident|near miss|حماية|سلامة/i.test(source)) return "safety";
  if (/quality|inspection|defect|snag|non[- ]?conform|qa|qc|test|checklist|جودة/i.test(source)) return "quality";
  if (/progress|completed|daily|pour|install|work|activity|advance|إنجاز|تقدم/i.test(source)) return "progress";
  if (/equipment|manpower|crew|material|delivery|access|site|execution|تنفيذ/i.test(source)) return "execution";
  if (/document|permit|drawing|approval|photo|attachment|record|report|وثيقة|رخصة/i.test(source)) return "documentation";
  return "general";
}

function normalizeObservationText(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
}

function requiresFollowUp(text: string, status?: string) {
  return /follow[- ]?up|pending|open|requires|issue|missing|blocked|hold|action|review|clarify|متابعة|ناقص/i.test(`${text} ${status || ""}`);
}

export function normalizeSiteReportObservations(document: SiteReportReviewDocument, descriptor: DocumentDescriptor, text: string): readonly SiteObservation[] {
  const rows = parseRows(document, descriptor, text);
  const headers = rows[0]?.length ? rows[0] : ["observation", "date", "responsiblePerson", "status", "category"];
  const columns = headers.map(columnFor);
  const dataRows = rows.slice(1);
  return deepFreeze(
    dataRows.map((row, index) => {
      const raw = Object.fromEntries(headers.map((header, cellIndex) => [header, row[cellIndex]?.trim() || ""]));
      const get = (column: string) => {
        const cellIndex = columns.findIndex((candidate) => candidate === column);
        return cellIndex >= 0 ? row[cellIndex]?.trim() || undefined : undefined;
      };
      const textValue = get("text") || row.find((cell) => cell?.trim())?.trim() || "";
      const status = get("status");
      return {
        rowNumber: index + 2,
        category: classifyObservation(textValue, get("category")),
        text: textValue,
        date: get("date"),
        responsiblePerson: get("responsiblePerson"),
        status,
        followUpRequired: requiresFollowUp(textValue, status),
        raw
      };
    })
  );
}

export function detectSiteReportIssues(observations: readonly SiteObservation[]): readonly SiteReportIssue[] {
  const issues: SiteReportIssue[] = [];
  if (!observations.length) issues.push(issue("missing_observation", "Missing information: no site observations were detected.", "critical"));

  const grouped: Record<string, number[]> = {};
  for (const observation of observations) {
    const key = normalizeObservationText(observation.text);
    if (key) grouped[key] = [...(grouped[key] || []), observation.rowNumber];
    if (!observation.text) issues.push(issue("missing_observation", "Missing information: observation text is empty.", "critical", observation.rowNumber, "observation"));
    if (!observation.responsiblePerson) issues.push(issue("missing_responsible_person", "Requires review: observation has no responsible person.", "warning", observation.rowNumber, "responsiblePerson"));
    if (!observation.date) issues.push(issue("missing_date", "Documentation gap: observation has no date.", "info", observation.rowNumber, "date"));
    if (observation.category === "progress" && observation.text.length < 18) issues.push(issue("incomplete_progress_note", "Requires review: progress observation is too brief to support execution decisions.", "warning", observation.rowNumber, "observation"));
    if (observation.category === "safety") issues.push(issue("safety_observation", "Safety observation detected from supplied text. Verify severity with site HSE records.", "warning", observation.rowNumber, "observation"));
    if (observation.category === "quality") issues.push(issue("quality_observation", "Quality observation detected from supplied text. Verify against inspection and QA/QC evidence.", "warning", observation.rowNumber, "observation"));
    if (observation.category === "execution") issues.push(issue("execution_observation", "Execution observation detected from supplied text. Confirm ownership and follow-up status.", "info", observation.rowNumber, "observation"));
    if (observation.category === "documentation") issues.push(issue("documentation_gap", "Documentation-related observation detected. Confirm attachments, approvals, or records.", "info", observation.rowNumber, "observation"));
    if (observation.followUpRequired) issues.push(issue("follow_up_required", "Follow-up wording detected from supplied observation.", "warning", observation.rowNumber, "status"));
  }

  for (const [name, rows] of Object.entries(grouped)) {
    if (rows.length > 1) {
      rows.forEach((rowNumber) => issues.push(issue("repeated_observation", `Repeated observation candidate: "${name}".`, "warning", rowNumber, "observation")));
    }
  }

  const hasProgress = observations.some((observation) => observation.category === "progress");
  if (!hasProgress) issues.push(issue("incomplete_progress_note", "Missing information: no clear progress observation was detected.", "warning"));

  return deepFreeze(issues);
}

export function summarizeSiteReport(observations: readonly SiteObservation[], issues: readonly SiteReportIssue[]): SiteReportReviewSummary {
  const countByCategory = (category: SiteObservationCategory) => observations.filter((observation) => observation.category === category).length;
  const requiredMissing = issues.filter((entry) => ["missing_observation", "missing_responsible_person", "missing_date"].includes(entry.code)).length;
  const totalPossible = Math.max(1, observations.length * 3);
  return deepFreeze({
    observationCount: observations.length,
    progressObservationCount: countByCategory("progress"),
    safetyObservationCount: countByCategory("safety"),
    qualityObservationCount: countByCategory("quality"),
    executionObservationCount: countByCategory("execution"),
    documentationGapCount: issues.filter((entry) => entry.code === "documentation_gap").length,
    followUpCount: issues.filter((entry) => entry.code === "follow_up_required").length,
    duplicateCount: issues.filter((entry) => entry.code === "repeated_observation").length,
    issueCount: issues.length,
    reportCompleteness: Math.max(0, Math.round(((totalPossible - requiredMissing) / totalPossible) * 100))
  });
}

function buildRuntimeRequest(input: {
  descriptor?: DocumentDescriptor;
  observations: readonly SiteObservation[];
  issues: readonly SiteReportIssue[];
  summary: SiteReportReviewSummary;
  warnings: readonly VoraIntelligenceExecutionWarning[];
  reviewerNotes?: string;
}) {
  return [
    "Review this construction site report using VORA Intelligence.",
    "",
    "Important rules:",
    "- Review only information supplied by the user.",
    "- Do not invent field observations.",
    "- Do not claim accidents occurred.",
    "- Do not claim delays occurred.",
    "- Use language such as Missing information, Requires review, Potential execution issue, and Follow-up required.",
    "- If parsing is unavailable, state that the review is limited to metadata and supplied notes.",
    "",
    "Required output sections:",
    "- Executive Summary",
    "- Site Report Overview",
    "- Progress Observations",
    "- Safety Findings",
    "- Quality Findings",
    "- Execution Findings",
    "- Documentation Gaps",
    "- Items Requiring Follow-up",
    "- Recommended Actions",
    "- Warnings",
    "- Confidence",
    "",
    input.descriptor ? `Document name: ${input.descriptor.name}` : "Document name: pasted site report notes",
    input.descriptor ? `Document type: ${input.descriptor.type}` : "",
    `Observation count: ${input.summary.observationCount}`,
    `Progress observations: ${input.summary.progressObservationCount}`,
    `Safety observations: ${input.summary.safetyObservationCount}`,
    `Quality observations: ${input.summary.qualityObservationCount}`,
    `Execution observations: ${input.summary.executionObservationCount}`,
    `Documentation gaps: ${input.summary.documentationGapCount}`,
    `Follow-up items: ${input.summary.followUpCount}`,
    `Report completeness: ${input.summary.reportCompleteness}%`,
    `Detected observations: ${JSON.stringify(input.observations.slice(0, 80))}`,
    `Site report issues: ${JSON.stringify(input.issues.slice(0, 80))}`,
    input.warnings.length ? `Warnings: ${input.warnings.map((entry) => entry.message).join(" | ")}` : "",
    input.reviewerNotes ? `Reviewer notes: ${input.reviewerNotes}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export async function prepareSiteReportReview(request: SiteReportReviewInput): Promise<SiteReportReviewPreparation> {
  const warnings: VoraIntelligenceExecutionWarning[] = [];
  let descriptor: DocumentDescriptor | undefined;
  let documentContent: DocumentContent | undefined;
  let documentMetadata: DocumentMetadata | undefined;
  let text = request.siteReportNotes || "";

  if (request.document) {
    descriptor = createDescriptor(request.document);
    if (!supportedSiteReportTypes.includes(descriptor.type)) {
      const summary = summarizeSiteReport([], []);
      return {
        valid: false,
        errors: [issue("unsupported_format", "Site Report Review supports TXT, Markdown, CSV, PDF placeholder, and DOCX placeholder documents.", "critical")],
        warnings: [warning("unsupported_format", `Unsupported site report document type: ${descriptor.type}.`, "critical")],
        descriptor,
        observations: [],
        issues: [],
        summary
      };
    }

    if (readableSiteReportTypes.includes(descriptor.type)) {
      text = request.document.text || text;
    } else {
      documentContent = { status: "placeholder" };
      warnings.push(warning("parser_placeholder_only", `${descriptor.type.toUpperCase()} parsing is not available yet. VORA will not invent observations from the file body.`, "warning"));
    }
  }

  const truncated = truncateText(text);
  if (truncated.truncated) warnings.push(warning("site_report_text_truncated", "Site report text was truncated before entering runtime prompt limits.", "warning"));

  if (!truncated.text && (!descriptor || readableSiteReportTypes.includes(descriptor.type))) {
    const summary = summarizeSiteReport([], []);
    return {
      valid: false,
      errors: [issue("missing_report", "A site report document or pasted site report notes are required.", "critical")],
      warnings,
      descriptor,
      observations: [],
      issues: [],
      summary
    };
  }

  const effectiveDocument: SiteReportReviewDocument = request.document || { name: "pasted-site-report-notes.txt", mimeType: "text/plain", text: truncated.text };
  if (!descriptor) descriptor = createDescriptor(effectiveDocument);
  const observations = truncated.text ? normalizeSiteReportObservations(effectiveDocument, descriptor, truncated.text) : [];
  const issues = detectSiteReportIssues(observations);
  const summary = summarizeSiteReport(observations, issues);
  documentContent = documentContent || (truncated.text ? { text: truncated.text, status: "normalized" } : { status: "placeholder" });
  const parser = await parseDocumentWithAdapter({ descriptor, content: documentContent });
  warnings.push(...parser.validation.warnings.map((entry) => warning(entry.code, entry.message, entry.severity === "error" ? "critical" : "warning")));
  documentMetadata = descriptor.metadata;

  return {
    valid: true,
    errors: [],
    warnings,
    descriptor,
    documentContent,
    documentMetadata,
    observations,
    issues,
    summary,
    userRequest: buildRuntimeRequest({ descriptor, observations, issues, summary, warnings, reviewerNotes: request.reviewerNotes })
  };
}

function textFromUnknownItems(value: readonly unknown[] | undefined, fallback: string): readonly string[] {
  if (!value?.length) return [fallback];
  const mapped = value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return String(record.title || record.label || record.description || record.summary || "").trim();
    }
    return "";
  }).filter(Boolean);
  return mapped.length ? mapped : [fallback];
}

export function createSiteReportReviewStructuredResult(
  response: VoraNormalizedIntelligenceResponse,
  preparation: SiteReportReviewPreparation
): SiteReportReviewStructuredResult {
  const byCode = (codes: readonly SiteReportIssueCode[]) => preparation.issues.filter((entry) => codes.includes(entry.code));
  return deepFreeze({
    executiveSummary: response.summary || "VORA prepared a site report review through the existing intelligence runtime.",
    siteReportOverview: preparation.documentContent?.text
      ? `Review basis: readable site report information from ${preparation.descriptor?.name || "submitted notes"}. Observations were not invented.`
      : `Review basis: metadata only for ${preparation.descriptor?.name || "submitted document"} because parsing is not available yet.`,
    progressObservations: preparation.observations.filter((observation) => observation.category === "progress"),
    safetyFindings: byCode(["safety_observation"]),
    qualityFindings: byCode(["quality_observation"]),
    executionFindings: byCode(["execution_observation", "incomplete_progress_note"]),
    documentationGaps: byCode(["documentation_gap", "missing_date", "missing_responsible_person", "missing_observation"]),
    itemsRequiringFollowUp: byCode(["follow_up_required", "repeated_observation"]),
    recommendedActions: textFromUnknownItems(response.recommendations, "Clarify missing observations, responsible persons, dates, attachments, and follow-up owners before using the report for project decisions."),
    warnings: [...preparation.warnings, ...response.warnings],
    confidence: response.confidence,
    summary: preparation.summary
  });
}

export async function executeSiteReportReview(request: SiteReportReviewInput): Promise<SiteReportReviewResponse> {
  const preparation = await prepareSiteReportReview(request);
  const now = request.now || new Date();
  if (!preparation.valid || !preparation.userRequest) {
    return {
      id: `site_report_review_error_${now.toISOString().replace(/[^0-9]/g, "")}`,
      status: "failed",
      taskIntent: "site_report_review",
      reasoningType: "document_review",
      warnings: preparation.warnings,
      errors: preparation.errors.map((entry) => ({ code: entry.code, message: entry.message })),
      confidence: { providerResponse: "placeholder" },
      usedMock: false,
      executionMetadata: {
        usedMock: false,
        taskIntent: "site_report_review",
        reasoningType: "document_review",
        reportType: "site_report",
        createdAt: now.toISOString()
      },
      createdAt: now.toISOString()
    };
  }

  const response = await executeVoraIntelligence({
    ...request,
    userRequest: preparation.userRequest,
    taskIntent: "site_report_review",
    documents: preparation.descriptor ? [preparation.descriptor] : [],
    documentMetadata: preparation.documentMetadata ? [preparation.documentMetadata] : [],
    documentContent: preparation.documentContent ? [preparation.documentContent] : [],
    outputPreferences: {
      language: request.outputPreferences?.language || request.language || "ar",
      tone: request.outputPreferences?.tone || "professional",
      responseFormat: request.outputPreferences?.responseFormat || "markdown",
      includeRecommendations: true,
      includeSources: true,
      ...request.outputPreferences
    }
  });

  return {
    ...response,
    warnings: [...preparation.warnings, ...response.warnings],
    siteReportReview: createSiteReportReviewStructuredResult(response, preparation)
  };
}

export async function executeSiteReportReviewSafe(request: SiteReportReviewInput): Promise<SiteReportReviewResponse> {
  try {
    return await executeSiteReportReview(request);
  } catch (error) {
    const fallback = await executeVoraIntelligenceSafe({
      userRequest: "Site Report Review failed before runtime execution.",
      taskIntent: "site_report_review",
      provider: request.provider,
      projectId: request.projectId,
      organizationId: request.organizationId,
      now: request.now
    });
    return {
      ...fallback,
      status: "failed",
      errors: [
        ...fallback.errors,
        {
          code: "site_report_review_failed",
          message: error instanceof Error ? error.message : "Site Report Review failed safely."
        }
      ]
    };
  }
}
