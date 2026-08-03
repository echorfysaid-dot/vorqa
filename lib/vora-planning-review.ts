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

export type PlanningReviewDocument = Readonly<{
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  text?: string;
  delimiter?: "," | "\t" | ";" | "|";
}>;

export type PlanningReviewInput = Readonly<
  Omit<VoraIntelligenceExecutionRequest, "taskIntent" | "documents" | "documentMetadata" | "documentContent" | "userRequest"> & {
    document?: PlanningReviewDocument;
    planningNotes?: string;
    reviewerNotes?: string;
  }
>;

export type PlanningActivity = Readonly<{
  rowNumber: number;
  name: string;
  description?: string;
  phase?: string;
  milestone?: string;
  dependency?: string;
  owner?: string;
  raw: Readonly<Record<string, string>>;
}>;

export type PlanningIssueCode =
  | "missing_planning"
  | "unsupported_format"
  | "empty_content"
  | "parser_placeholder_only"
  | "missing_activity"
  | "missing_milestone"
  | "duplicate_activity"
  | "missing_description"
  | "missing_dependency"
  | "missing_owner"
  | "empty_phase"
  | "incomplete_sequence"
  | "documentation_gap"
  | "planning_inconsistency";

export type PlanningIssue = Readonly<{
  code: PlanningIssueCode;
  severity: "info" | "warning" | "critical";
  message: string;
  rowNumber?: number;
  field?: string;
}>;

export type PlanningReviewSummary = Readonly<{
  activityCount: number;
  milestoneCount: number;
  phaseCount: number;
  issueCount: number;
  duplicateCount: number;
  structuralCompleteness: number;
}>;

export type PlanningReviewPreparation = Readonly<{
  valid: boolean;
  errors: readonly PlanningIssue[];
  warnings: readonly VoraIntelligenceExecutionWarning[];
  descriptor?: DocumentDescriptor;
  documentContent?: DocumentContent;
  documentMetadata?: DocumentMetadata;
  activities: readonly PlanningActivity[];
  issues: readonly PlanningIssue[];
  summary: PlanningReviewSummary;
  userRequest?: string;
}>;

export type PlanningReviewStructuredResult = Readonly<{
  executiveSummary: string;
  planningOverview: string;
  detectedActivities: readonly PlanningActivity[];
  missingActivities: readonly PlanningIssue[];
  milestoneReview: readonly string[];
  dependencyReview: readonly PlanningIssue[];
  planningRisks: readonly string[];
  documentationGaps: readonly PlanningIssue[];
  recommendedActions: readonly string[];
  warnings: readonly VoraIntelligenceExecutionWarning[];
  confidence: VoraNormalizedIntelligenceResponse["confidence"];
  summary: PlanningReviewSummary;
}>;

export type PlanningReviewResponse = VoraNormalizedIntelligenceResponse &
  Readonly<{
    planningReview?: PlanningReviewStructuredResult;
  }>;

const supportedPlanningTypes: readonly DocumentType[] = ["txt", "markdown", "csv", "pdf", "docx"];
const readablePlanningTypes: readonly DocumentType[] = ["txt", "markdown", "csv"];
const maxPlanningCharacters = 18_000;

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

function issue(code: PlanningIssueCode, message: string, severity: PlanningIssue["severity"], rowNumber?: number, field?: string): PlanningIssue {
  return { code, message, severity, rowNumber, field };
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "planning";
}

function truncateText(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxPlanningCharacters) return { text: normalized, truncated: false };
  return {
    text: `${normalized.slice(0, maxPlanningCharacters - 36).trimEnd()}\n[PLANNING_TEXT_TRUNCATED]`,
    truncated: true
  };
}

function createDescriptor(document: PlanningReviewDocument): DocumentDescriptor {
  const type = document.name.toLowerCase().endsWith(".csv") || document.name.toLowerCase().endsWith(".tsv")
    ? "csv"
    : inferDocumentType({ mimeType: document.mimeType, name: document.name, category: "schedule" });
  return normalizeDocument({
    id: `planning-review:${slug(document.name)}`,
    name: document.name,
    type,
    source: "upload",
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    metadata: {
      title: document.name,
      category: "schedule",
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      sourceName: document.name,
      tags: ["planning", "schedule", "review"]
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

function detectDelimiter(text: string, requested?: PlanningReviewDocument["delimiter"]) {
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
  if (/activity|task|name|title|work|item|activite|tache/.test(normalized)) return "name";
  if (/description|detail|scope|notes/.test(normalized)) return "description";
  if (/phase|stage|section|lot/.test(normalized)) return "phase";
  if (/milestone|jalon|deliverable/.test(normalized)) return "milestone";
  if (/dependency|depends|predecessor|relation/.test(normalized)) return "dependency";
  if (/owner|responsible|assignee|manager|lead/.test(normalized)) return "owner";
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

function rowsFromDelimited(text: string, delimiter?: PlanningReviewDocument["delimiter"]) {
  const actualDelimiter = detectDelimiter(text, delimiter);
  return text.split(/\r?\n/).filter((line) => line.trim()).map((line) => splitDelimitedLine(line, actualDelimiter));
}

function rowsFromPlainText(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s+/, ""))
    .filter(Boolean)
    .map((line, index) => (index === 0 ? ["activity", "description"] : [line, line]));
}

function parseRows(document: PlanningReviewDocument, descriptor: DocumentDescriptor, text: string) {
  if (descriptor.type === "markdown" || text.includes("|")) return rowsFromMarkdown(text);
  if (descriptor.type === "csv" || document.delimiter || text.includes(",") || text.includes("\t") || text.includes(";")) return rowsFromDelimited(text, document.delimiter);
  return rowsFromPlainText(text);
}

export function normalizePlanningActivities(document: PlanningReviewDocument, descriptor: DocumentDescriptor, text: string): readonly PlanningActivity[] {
  const rows = parseRows(document, descriptor, text);
  const headers = rows[0]?.length ? rows[0] : ["activity", "description", "phase", "milestone", "dependency", "owner"];
  const columns = headers.map(columnFor);
  const dataRows = rows.slice(1);
  return deepFreeze(
    dataRows.map((row, index) => {
      const raw = Object.fromEntries(headers.map((header, cellIndex) => [header, row[cellIndex]?.trim() || ""]));
      const get = (column: string) => {
        const cellIndex = columns.findIndex((candidate) => candidate === column);
        return cellIndex >= 0 ? row[cellIndex]?.trim() || undefined : undefined;
      };
      const name = get("name") || row.find((cell) => cell?.trim())?.trim() || "";
      return {
        rowNumber: index + 2,
        name,
        description: get("description"),
        phase: get("phase"),
        milestone: get("milestone"),
        dependency: get("dependency"),
        owner: get("owner"),
        raw
      };
    })
  );
}

function normalizeActivityName(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
}

export function detectPlanningIssues(activities: readonly PlanningActivity[]): readonly PlanningIssue[] {
  const issues: PlanningIssue[] = [];
  if (!activities.length) issues.push(issue("missing_activity", "Missing information: no planning activities were detected.", "critical"));

  const grouped: Record<string, number[]> = {};
  for (const activity of activities) {
    const key = normalizeActivityName(activity.name);
    if (key) grouped[key] = [...(grouped[key] || []), activity.rowNumber];
    if (!activity.name) issues.push(issue("missing_activity", "Missing information: activity name is empty.", "critical", activity.rowNumber, "activity"));
    if (!activity.description) issues.push(issue("missing_description", "Requires review: activity has no description.", "warning", activity.rowNumber, "description"));
    if (!activity.owner) issues.push(issue("missing_owner", "Requires review: activity has no responsible owner.", "warning", activity.rowNumber, "owner"));
    if (!activity.dependency) issues.push(issue("missing_dependency", "Potential issue: activity has no dependency or predecessor reference.", "info", activity.rowNumber, "dependency"));
    if (!activity.phase) issues.push(issue("empty_phase", "Documentation gap: activity is not assigned to a phase or stage.", "info", activity.rowNumber, "phase"));
  }

  for (const [name, rows] of Object.entries(grouped)) {
    if (rows.length > 1) {
      rows.forEach((rowNumber) => issues.push(issue("duplicate_activity", `Planning inconsistency: duplicate activity candidate "${name}".`, "warning", rowNumber, "activity")));
    }
  }

  const hasMilestone = activities.some((activity) => Boolean(activity.milestone) || /milestone|handover|approval|deliverable/i.test(activity.name));
  if (!hasMilestone) issues.push(issue("missing_milestone", "Missing information: no milestone or deliverable marker was detected.", "warning"));

  const phaseCount = new Set(activities.map((activity) => activity.phase).filter(Boolean)).size;
  if (activities.length >= 4 && phaseCount <= 1) issues.push(issue("incomplete_sequence", "Planning inconsistency: activities are not clearly grouped into multiple phases.", "warning"));

  return deepFreeze(issues);
}

export function summarizePlanning(activities: readonly PlanningActivity[], issues: readonly PlanningIssue[]): PlanningReviewSummary {
  const phaseCount = new Set(activities.map((activity) => activity.phase).filter(Boolean)).size;
  const milestoneCount = activities.filter((activity) => Boolean(activity.milestone) || /milestone|handover|approval|deliverable/i.test(activity.name)).length;
  const duplicateCount = issues.filter((entry) => entry.code === "duplicate_activity").length;
  const requiredFields = ["name", "description", "owner"];
  const missingCount = issues.filter((entry) => ["missing_activity", "missing_description", "missing_owner"].includes(entry.code)).length;
  const totalPossible = Math.max(1, activities.length * requiredFields.length);
  return deepFreeze({
    activityCount: activities.length,
    milestoneCount,
    phaseCount,
    issueCount: issues.length,
    duplicateCount,
    structuralCompleteness: Math.max(0, Math.round(((totalPossible - missingCount) / totalPossible) * 100))
  });
}

function buildRuntimeRequest(input: {
  descriptor?: DocumentDescriptor;
  activities: readonly PlanningActivity[];
  issues: readonly PlanningIssue[];
  summary: PlanningReviewSummary;
  warnings: readonly VoraIntelligenceExecutionWarning[];
  reviewerNotes?: string;
}) {
  return [
    "Review this construction schedule or planning document using VORA Intelligence.",
    "",
    "Important rules:",
    "- This is not a scheduling engine.",
    "- Do not calculate dates automatically.",
    "- Do not optimize schedules.",
    "- Do not claim the project will be delayed.",
    "- Use language such as Requires review, Potential issue, Planning inconsistency, and Missing information.",
    "- If parsing is unavailable, state that the review is limited to metadata and supplied notes.",
    "",
    "Required output sections:",
    "- Executive Summary",
    "- Planning Overview",
    "- Detected Activities",
    "- Missing Activities",
    "- Milestone Review",
    "- Dependency Review",
    "- Planning Risks",
    "- Documentation Gaps",
    "- Recommended Actions",
    "- Warnings",
    "- Confidence",
    "",
    input.descriptor ? `Document name: ${input.descriptor.name}` : "Document name: pasted planning notes",
    input.descriptor ? `Document type: ${input.descriptor.type}` : "",
    `Activity count: ${input.summary.activityCount}`,
    `Milestone count: ${input.summary.milestoneCount}`,
    `Phase count: ${input.summary.phaseCount}`,
    `Issue count: ${input.summary.issueCount}`,
    `Structural completeness: ${input.summary.structuralCompleteness}%`,
    `Detected activities: ${JSON.stringify(input.activities.slice(0, 80))}`,
    `Planning issues: ${JSON.stringify(input.issues.slice(0, 80))}`,
    input.warnings.length ? `Warnings: ${input.warnings.map((entry) => entry.message).join(" | ")}` : "",
    input.reviewerNotes ? `Reviewer notes: ${input.reviewerNotes}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export async function preparePlanningReview(request: PlanningReviewInput): Promise<PlanningReviewPreparation> {
  const warnings: VoraIntelligenceExecutionWarning[] = [];
  let descriptor: DocumentDescriptor | undefined;
  let documentContent: DocumentContent | undefined;
  let documentMetadata: DocumentMetadata | undefined;
  let text = request.planningNotes || "";

  if (request.document) {
    descriptor = createDescriptor(request.document);
    if (!supportedPlanningTypes.includes(descriptor.type)) {
      const summary = summarizePlanning([], []);
      return {
        valid: false,
        errors: [issue("unsupported_format", "Planning Review supports TXT, Markdown, CSV, PDF placeholder, and DOCX placeholder documents.", "critical")],
        warnings: [warning("unsupported_format", `Unsupported planning document type: ${descriptor.type}.`, "critical")],
        descriptor,
        activities: [],
        issues: [],
        summary
      };
    }

    if (readablePlanningTypes.includes(descriptor.type)) {
      text = request.document.text || text;
    } else {
      documentContent = { status: "placeholder" };
      warnings.push(warning("parser_placeholder_only", `${descriptor.type.toUpperCase()} parsing is not available yet. VORA will not invent activities from the file body.`, "warning"));
    }
  }

  const truncated = truncateText(text);
  if (truncated.truncated) warnings.push(warning("planning_text_truncated", "Planning text was truncated before entering runtime prompt limits.", "warning"));

  if (!truncated.text && (!descriptor || readablePlanningTypes.includes(descriptor.type))) {
    const summary = summarizePlanning([], []);
    return {
      valid: false,
      errors: [issue("missing_planning", "A planning document or pasted planning notes are required.", "critical")],
      warnings,
      descriptor,
      activities: [],
      issues: [],
      summary
    };
  }

  const effectiveDocument: PlanningReviewDocument = request.document || { name: "pasted-planning-notes.txt", mimeType: "text/plain", text: truncated.text };
  if (!descriptor) descriptor = createDescriptor(effectiveDocument);
  const activities = truncated.text ? normalizePlanningActivities(effectiveDocument, descriptor, truncated.text) : [];
  const issues = detectPlanningIssues(activities);
  const summary = summarizePlanning(activities, issues);
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
    activities,
    issues,
    summary,
    userRequest: buildRuntimeRequest({ descriptor, activities, issues, summary, warnings, reviewerNotes: request.reviewerNotes })
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

export function createPlanningReviewStructuredResult(
  response: VoraNormalizedIntelligenceResponse,
  preparation: PlanningReviewPreparation
): PlanningReviewStructuredResult {
  const missingActivities = preparation.issues.filter((entry) => ["missing_activity", "missing_description", "empty_phase"].includes(entry.code));
  const dependencyReview = preparation.issues.filter((entry) => ["missing_dependency", "incomplete_sequence", "duplicate_activity"].includes(entry.code));
  const documentationGaps = preparation.issues.filter((entry) => ["documentation_gap", "missing_owner", "missing_milestone"].includes(entry.code));
  return deepFreeze({
    executiveSummary: response.summary || "VORA prepared a planning review through the existing intelligence runtime.",
    planningOverview: preparation.documentContent?.text
      ? `Review basis: readable planning information from ${preparation.descriptor?.name || "submitted notes"}. Dates were not calculated or optimized.`
      : `Review basis: metadata only for ${preparation.descriptor?.name || "submitted document"} because parsing is not available yet.`,
    detectedActivities: preparation.activities,
    missingActivities,
    milestoneReview: preparation.summary.milestoneCount ? [`Detected ${preparation.summary.milestoneCount} milestone marker(s). Review completeness manually.`] : ["Missing information: no milestone marker was detected."],
    dependencyReview,
    planningRisks: textFromUnknownItems(response.risks, "Potential planning risks should be reviewed only against supplied activities and notes."),
    documentationGaps,
    recommendedActions: textFromUnknownItems(response.recommendations, "Clarify missing owners, milestones, dependencies, phases, and activity descriptions before relying on the plan."),
    warnings: [...preparation.warnings, ...response.warnings],
    confidence: response.confidence,
    summary: preparation.summary
  });
}

export async function executePlanningReview(request: PlanningReviewInput): Promise<PlanningReviewResponse> {
  const preparation = await preparePlanningReview(request);
  const now = request.now || new Date();
  if (!preparation.valid || !preparation.userRequest) {
    return {
      id: `planning_review_error_${now.toISOString().replace(/[^0-9]/g, "")}`,
      status: "failed",
      taskIntent: "planning_review",
      reasoningType: "planning",
      warnings: preparation.warnings,
      errors: preparation.errors.map((entry) => ({ code: entry.code, message: entry.message })),
      confidence: { providerResponse: "placeholder" },
      usedMock: false,
      executionMetadata: {
        usedMock: false,
        taskIntent: "planning_review",
        reasoningType: "planning",
        reportType: "planning_report",
        createdAt: now.toISOString()
      },
      createdAt: now.toISOString()
    };
  }

  const response = await executeVoraIntelligence({
    ...request,
    userRequest: preparation.userRequest,
    taskIntent: "planning_review",
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
    planningReview: createPlanningReviewStructuredResult(response, preparation)
  };
}

export async function executePlanningReviewSafe(request: PlanningReviewInput): Promise<PlanningReviewResponse> {
  try {
    return await executePlanningReview(request);
  } catch (error) {
    const fallback = await executeVoraIntelligenceSafe({
      userRequest: "Planning Review failed before runtime execution.",
      taskIntent: "planning_review",
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
          code: "planning_review_failed",
          message: error instanceof Error ? error.message : "Planning Review failed safely."
        }
      ]
    };
  }
}
