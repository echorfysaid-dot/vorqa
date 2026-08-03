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

export type BoqReviewDocument = Readonly<{
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  text?: string;
  delimiter?: "," | "\t" | ";" | "|";
}>;

export type BoqReviewInput = Readonly<
  Omit<VoraIntelligenceExecutionRequest, "taskIntent" | "documents" | "documentMetadata" | "documentContent" | "userRequest"> & {
    document?: BoqReviewDocument;
    reviewerNotes?: string;
  }
>;

export type BoqCanonicalColumn = "reference" | "section" | "description" | "quantity" | "unit" | "rate" | "amount" | "unknown";
export type BoqSeverity = "info" | "warning" | "critical";
export type BoqIssueCode =
  | "missing_document"
  | "unsupported_format"
  | "empty_content"
  | "unrecognized_columns"
  | "missing_description"
  | "missing_quantity"
  | "missing_unit"
  | "missing_rate"
  | "missing_amount"
  | "zero_quantity"
  | "negative_quantity"
  | "zero_rate"
  | "negative_rate"
  | "zero_amount"
  | "negative_amount"
  | "quantity_rate_mismatch"
  | "duplicate_reference"
  | "duplicate_description"
  | "inconsistent_units"
  | "uncategorized_item"
  | "malformed_numeric_value"
  | "parser_placeholder_only";

export type BoqSection = Readonly<{
  name: string;
  itemCount: number;
  totalAmount?: number;
}>;

export type BoqItem = Readonly<{
  rowNumber: number;
  reference?: string;
  section?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount?: number;
  raw: Readonly<Record<string, string>>;
}>;

export type BoqValidationIssue = Readonly<{
  code: BoqIssueCode;
  severity: BoqSeverity;
  message: string;
  rowNumber?: number;
  field?: BoqCanonicalColumn;
}>;

export type BoqDuplicateCandidate = Readonly<{
  type: "reference" | "description";
  value: string;
  rowNumbers: readonly number[];
}>;

export type BoqArithmeticCheck = Readonly<{
  rowNumber: number;
  quantity?: number;
  rate?: number;
  amount?: number;
  calculatedAmount?: number;
  difference?: number;
  status: "matched" | "mismatch" | "not_computable";
}>;

export type BoqParsingResult = Readonly<{
  descriptor: DocumentDescriptor;
  content: DocumentContent;
  detectedColumns: Readonly<Record<string, BoqCanonicalColumn>>;
  items: readonly BoqItem[];
  sections: readonly BoqSection[];
  issues: readonly BoqValidationIssue[];
  duplicates: readonly BoqDuplicateCandidate[];
  arithmeticChecks: readonly BoqArithmeticCheck[];
  warnings: readonly VoraIntelligenceExecutionWarning[];
}>;

export type BoqReviewSummary = Readonly<{
  itemCount: number;
  sectionCount: number;
  issueCount: number;
  duplicateCount: number;
  arithmeticMismatchCount: number;
  totalAmount?: number;
  structuralCompleteness: number;
}>;

export type BoqReviewStructuredResult = Readonly<{
  executiveSummary: string;
  boqOverview: string;
  detectedStructure: Readonly<{
    detectedColumns: Readonly<Record<string, BoqCanonicalColumn>>;
    sectionCount: number;
    itemCount: number;
  }>;
  sections: readonly BoqSection[];
  itemStatistics: BoqReviewSummary;
  missingInformation: readonly string[];
  potentialDuplicates: readonly BoqDuplicateCandidate[];
  quantityAndUnitIssues: readonly BoqValidationIssue[];
  rateAndAmountIssues: readonly BoqValidationIssue[];
  arithmeticChecks: readonly BoqArithmeticCheck[];
  costRisks: readonly string[];
  itemsRequiringReview: readonly string[];
  recommendedActions: readonly string[];
  warnings: readonly VoraIntelligenceExecutionWarning[];
  confidence: VoraNormalizedIntelligenceResponse["confidence"];
}>;

export type BoqReviewResponse = VoraNormalizedIntelligenceResponse &
  Readonly<{
    boqReview?: BoqReviewStructuredResult;
  }>;

const supportedBoqTypes: readonly DocumentType[] = ["csv", "txt", "markdown", "spreadsheet", "pdf", "docx"];
const readableBoqTypes: readonly DocumentType[] = ["csv", "txt", "markdown"];
const maxBoqCharacters = 20_000;

const headerAliases: Readonly<Record<BoqCanonicalColumn, readonly string[]>> = {
  reference: ["ref", "reference", "référence", "reference no", "item no", "n", "no", "code", "article"],
  section: ["section", "lot", "chapitre", "chapter", "work section", "trade", "poste"],
  description: ["description", "designation", "désignation", "designation des travaux", "item", "ouvrage", "travaux", "libellé", "libelle"],
  quantity: ["quantity", "qty", "quantité", "quantite", "quantitã©", "quantitÃ©", "qte", "q.t.e", "qte.", "q"],
  unit: ["unit", "unité", "unite", "unitã©", "unitÃ©", "u", "um", "unit of measure"],
  rate: ["rate", "unit price", "prix unitaire", "pu", "p.u", "price", "prix"],
  amount: ["amount", "total", "montant", "montant total", "subtotal", "value"],
  unknown: []
};

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

function issue(code: BoqIssueCode, message: string, severity: BoqSeverity, rowNumber?: number, field?: BoqCanonicalColumn): BoqValidationIssue {
  return { code, message, severity, rowNumber, field };
}

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeBoqHeader(value: string): BoqCanonicalColumn {
  const normalized = normalizeHeader(value);
  for (const [column, aliases] of Object.entries(headerAliases) as Array<[BoqCanonicalColumn, readonly string[]]>) {
    if (column === "unknown") continue;
    if (aliases.some((alias) => normalizeHeader(alias) === normalized)) return column;
  }
  return "unknown";
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

function detectDelimiter(text: string, requested?: BoqReviewDocument["delimiter"]) {
  if (requested) return requested;
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || "";
  const candidates: Array<"," | "\t" | ";" | "|"> = [",", "\t", ";", "|"];
  return candidates
    .map((delimiter) => ({ delimiter, count: splitDelimitedLine(firstLine, delimiter).length }))
    .sort((left, right) => right.count - left.count)[0]?.delimiter || ",";
}

function normalizeNumber(value?: string): { value?: number; malformed: boolean } {
  const raw = (value || "").trim();
  if (!raw) return { malformed: false };
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/MAD|DH|DHS|د\.?م|درهم/gi, "")
    .replace(/,/g, ".");
  const numeric = Number(cleaned.replace(/[^0-9.+-]/g, ""));
  if (!Number.isFinite(numeric)) return { malformed: true };
  return { value: numeric, malformed: false };
}

function normalizeDescription(value?: string) {
  return (value || "").toLowerCase().replace(/\s+/g, " ").replace(/[^\p{L}\p{N}\s]/gu, "").trim();
}

function truncateText(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxBoqCharacters) return { text: normalized, truncated: false };
  return {
    text: `${normalized.slice(0, maxBoqCharacters - 32).trimEnd()}\n[BOQ_TEXT_TRUNCATED]`,
    truncated: true
  };
}

function createDescriptor(document: BoqReviewDocument): DocumentDescriptor {
  const lowerName = document.name.toLowerCase();
  const type = lowerName.endsWith(".tsv") || document.mimeType === "text/tab-separated-values"
    ? "csv"
    : inferDocumentType({ mimeType: document.mimeType, name: document.name, category: "boq" });
  return normalizeDocument({
    id: `boq-review:${document.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "document"}`,
    name: document.name,
    type,
    source: "upload",
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    metadata: {
      title: document.name,
      category: "boq",
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      sourceName: document.name,
      tags: ["boq", "cost", "review"]
    }
  });
}

function rowsFromMarkdownTable(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line))
    .map((line) => line.slice(1, -1).split("|").map((cell) => cell.trim()));
}

function rowsFromDelimited(text: string, delimiter?: BoqReviewDocument["delimiter"]) {
  const actualDelimiter = detectDelimiter(text, delimiter);
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => splitDelimitedLine(line, actualDelimiter));
}

function parsePlainTextRows(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split(/\s{2,}|\t/).map((part) => part.trim()).filter(Boolean);
      if (index === 0 && parts.length >= 3) return parts;
      if (parts.length >= 3) return parts;
      return ["", "", line, "", "", "", ""];
    });
}

export function detectBoqColumns(headers: readonly string[]): Readonly<Record<string, BoqCanonicalColumn>> {
  return deepFreeze(Object.fromEntries(headers.map((header) => [header, normalizeBoqHeader(header)])));
}

function itemFromRow(headers: readonly string[], canonical: readonly BoqCanonicalColumn[], row: readonly string[], rowNumber: number): BoqItem {
  const raw = Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() || ""]));
  const get = (column: BoqCanonicalColumn) => {
    const index = canonical.findIndex((candidate) => candidate === column);
    return index >= 0 ? row[index]?.trim() || undefined : undefined;
  };
  const quantity = normalizeNumber(get("quantity"));
  const rate = normalizeNumber(get("rate"));
  const amount = normalizeNumber(get("amount"));
  return deepFreeze({
    rowNumber,
    reference: get("reference"),
    section: get("section"),
    description: get("description"),
    quantity: quantity.value,
    unit: get("unit"),
    rate: rate.value,
    amount: amount.value,
    raw
  });
}

function validateBoqItem(item: BoqItem): readonly BoqValidationIssue[] {
  const issues: BoqValidationIssue[] = [];
  if (!item.description) issues.push(issue("missing_description", "Possible issue: missing item description.", "critical", item.rowNumber, "description"));
  if (item.quantity === undefined) issues.push(issue("missing_quantity", "Requires review: missing quantity.", "warning", item.rowNumber, "quantity"));
  if (!item.unit) issues.push(issue("missing_unit", "Requires review: missing unit.", "warning", item.rowNumber, "unit"));
  if (item.rate === undefined) issues.push(issue("missing_rate", "Requires review: missing rate.", "info", item.rowNumber, "rate"));
  if (item.amount === undefined) issues.push(issue("missing_amount", "Requires review: missing amount.", "info", item.rowNumber, "amount"));
  if (item.quantity === 0) issues.push(issue("zero_quantity", "Structural inconsistency: quantity is zero.", "warning", item.rowNumber, "quantity"));
  if (typeof item.quantity === "number" && item.quantity < 0) issues.push(issue("negative_quantity", "Structural inconsistency: quantity is negative.", "critical", item.rowNumber, "quantity"));
  if (item.rate === 0) issues.push(issue("zero_rate", "Potential issue: rate is zero.", "warning", item.rowNumber, "rate"));
  if (typeof item.rate === "number" && item.rate < 0) issues.push(issue("negative_rate", "Structural inconsistency: rate is negative.", "critical", item.rowNumber, "rate"));
  if (item.amount === 0) issues.push(issue("zero_amount", "Potential issue: amount is zero.", "warning", item.rowNumber, "amount"));
  if (typeof item.amount === "number" && item.amount < 0) issues.push(issue("negative_amount", "Structural inconsistency: amount is negative.", "critical", item.rowNumber, "amount"));
  if (!item.section) issues.push(issue("uncategorized_item", "Requires review: item has no section or lot.", "info", item.rowNumber, "section"));
  return issues;
}

function arithmeticCheck(item: BoqItem): BoqArithmeticCheck {
  if (typeof item.quantity !== "number" || typeof item.rate !== "number" || typeof item.amount !== "number") {
    return { rowNumber: item.rowNumber, quantity: item.quantity, rate: item.rate, amount: item.amount, status: "not_computable" };
  }
  const calculatedAmount = Number((item.quantity * item.rate).toFixed(2));
  const difference = Number((item.amount - calculatedAmount).toFixed(2));
  return {
    rowNumber: item.rowNumber,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.amount,
    calculatedAmount,
    difference,
    status: Math.abs(difference) <= 0.02 ? "matched" : "mismatch"
  };
}

function detectDuplicates(items: readonly BoqItem[]): readonly BoqDuplicateCandidate[] {
  const groups: Record<string, number[]> = {};
  const descriptionGroups: Record<string, number[]> = {};
  for (const item of items) {
    if (item.reference) groups[`ref:${item.reference.toLowerCase()}`] = [...(groups[`ref:${item.reference.toLowerCase()}`] || []), item.rowNumber];
    const normalized = normalizeDescription(item.description);
    if (normalized && normalized.length > 8) descriptionGroups[`description:${normalized}`] = [...(descriptionGroups[`description:${normalized}`] || []), item.rowNumber];
  }
  return deepFreeze([
    ...Object.entries(groups)
      .filter(([, rows]) => rows.length > 1)
      .map(([key, rows]) => ({ type: "reference" as const, value: key.replace("ref:", ""), rowNumbers: rows })),
    ...Object.entries(descriptionGroups)
      .filter(([, rows]) => rows.length > 1)
      .map(([key, rows]) => ({ type: "description" as const, value: key.replace("description:", ""), rowNumbers: rows }))
  ]);
}

function detectUnitIssues(items: readonly BoqItem[]): readonly BoqValidationIssue[] {
  const byDescription: Record<string, Set<string>> = {};
  const rows: Record<string, number[]> = {};
  for (const item of items) {
    const key = normalizeDescription(item.description);
    if (!key || !item.unit) continue;
    byDescription[key] = byDescription[key] || new Set<string>();
    byDescription[key].add(item.unit.toLowerCase());
    rows[key] = [...(rows[key] || []), item.rowNumber];
  }
  return Object.entries(byDescription)
    .filter(([, units]) => units.size > 1)
    .map(([key]) => issue("inconsistent_units", `Potential duplicate or similar item has inconsistent units: ${key}.`, "warning", rows[key][0], "unit"));
}

function sectionsFromItems(items: readonly BoqItem[]): readonly BoqSection[] {
  const grouped = new Map<string, BoqItem[]>();
  for (const item of items) {
    const section = item.section || "Uncategorized";
    grouped.set(section, [...(grouped.get(section) || []), item]);
  }
  return deepFreeze(
    [...grouped.entries()].map(([name, sectionItems]) => ({
      name,
      itemCount: sectionItems.length,
      totalAmount: sectionItems.some((item) => typeof item.amount === "number")
        ? Number(sectionItems.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2))
        : undefined
    }))
  );
}

function parseRows(document: BoqReviewDocument, descriptor: DocumentDescriptor, text: string) {
  if (descriptor.type === "markdown" || text.includes("|")) return rowsFromMarkdownTable(text);
  if (descriptor.type === "csv" || document.delimiter || text.includes(",") || text.includes("\t") || text.includes(";")) return rowsFromDelimited(text, document.delimiter);
  return parsePlainTextRows(text);
}

export function parseBoqContent(document: BoqReviewDocument, descriptor: DocumentDescriptor, text: string): BoqParsingResult {
  const rows = parseRows(document, descriptor, text);
  const fallbackHeaders = ["reference", "section", "description", "quantity", "unit", "rate", "amount"];
  const headers = rows[0]?.length ? rows[0] : fallbackHeaders;
  const canonical = headers.map(normalizeBoqHeader);
  const detectedColumns = detectBoqColumns(headers);
  const dataRows = rows.slice(1);
  const items = dataRows.map((row, index) => itemFromRow(headers, canonical, row, index + 2));
  const arithmeticChecks = items.map(arithmeticCheck);
  const duplicates = detectDuplicates(items);
  const issues: BoqValidationIssue[] = [
    ...items.flatMap(validateBoqItem),
    ...arithmeticChecks
      .filter((check) => check.status === "mismatch")
      .map((check) => issue("quantity_rate_mismatch", "Structural inconsistency: quantity x rate does not match amount.", "warning", check.rowNumber, "amount")),
    ...duplicates.flatMap((duplicate) =>
      duplicate.rowNumbers.map((rowNumber) =>
        issue(duplicate.type === "reference" ? "duplicate_reference" : "duplicate_description", `Potential duplicate ${duplicate.type}: ${duplicate.value}.`, "warning", rowNumber)
      )
    ),
    ...detectUnitIssues(items)
  ];
  if (!Object.values(detectedColumns).some((column) => column !== "unknown")) {
    issues.push(issue("unrecognized_columns", "BOQ columns were not recognized. Review headers manually.", "warning"));
  }

  const content: DocumentContent = {
    text,
    status: "normalized"
  };

  return deepFreeze({
    descriptor,
    content,
    detectedColumns,
    items,
    sections: sectionsFromItems(items),
    issues,
    duplicates,
    arithmeticChecks,
    warnings: []
  });
}

export function summarizeBoqStructure(parsing: BoqParsingResult): BoqReviewSummary {
  const totalAmount = parsing.items.some((item) => typeof item.amount === "number")
    ? Number(parsing.items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2))
    : undefined;
  const requiredFields: BoqCanonicalColumn[] = ["description", "quantity", "unit", "rate", "amount"];
  const missingCount = parsing.issues.filter((entry) => entry.code.startsWith("missing_")).length;
  const totalPossible = Math.max(1, parsing.items.length * requiredFields.length);
  return deepFreeze({
    itemCount: parsing.items.length,
    sectionCount: parsing.sections.length,
    issueCount: parsing.issues.length,
    duplicateCount: parsing.duplicates.length,
    arithmeticMismatchCount: parsing.arithmeticChecks.filter((check) => check.status === "mismatch").length,
    totalAmount,
    structuralCompleteness: Math.max(0, Math.round(((totalPossible - missingCount) / totalPossible) * 100))
  });
}

export async function prepareBoqReview(request: BoqReviewInput): Promise<
  Readonly<{
    valid: boolean;
    errors: readonly BoqValidationIssue[];
    warnings: readonly VoraIntelligenceExecutionWarning[];
    descriptor?: DocumentDescriptor;
    documentContent?: DocumentContent;
    documentMetadata?: DocumentMetadata;
    parsing?: BoqParsingResult;
    summary?: BoqReviewSummary;
    userRequest?: string;
  }>
> {
  const document = request.document;
  if (!document) {
    return { valid: false, errors: [issue("missing_document", "A BOQ document or pasted BOQ content is required.", "critical")], warnings: [] };
  }

  const descriptor = createDescriptor(document);
  if (!supportedBoqTypes.includes(descriptor.type)) {
    return {
      valid: false,
      errors: [issue("unsupported_format", "BOQ Review supports CSV, TSV, plain text, Markdown table, and placeholder XLS/XLSX/PDF/DOCX.", "critical")],
      warnings: [warning("unsupported_format", `Unsupported BOQ document type: ${descriptor.type}.`, "critical")],
      descriptor
    };
  }

  const warnings: VoraIntelligenceExecutionWarning[] = [];
  const readable = readableBoqTypes.includes(descriptor.type);
  const truncated = truncateText(document.text || "");

  if (!readable) {
    const content: DocumentContent = { status: "placeholder" };
    const parser = await parseDocumentWithAdapter({ descriptor, content });
    warnings.push(
      warning(
        "parser_placeholder_only",
        `${descriptor.type.toUpperCase()} extraction is not available yet. VORA will not invent BOQ line items and will review metadata/user notes only.`,
        "warning"
      ),
      ...parser.validation.warnings.map((entry) => warning(entry.code, entry.message, entry.severity === "error" ? "critical" : "warning"))
    );
    const metadata = descriptor.metadata;
    const summary: BoqReviewSummary = { itemCount: 0, sectionCount: 0, issueCount: 0, duplicateCount: 0, arithmeticMismatchCount: 0, structuralCompleteness: 0 };
    return {
      valid: true,
      errors: [],
      warnings,
      descriptor,
      documentContent: content,
      documentMetadata: metadata,
      summary,
      userRequest: buildBoqRuntimeRequest({ descriptor, summary, warnings, reviewerNotes: request.reviewerNotes })
    };
  }

  if (!truncated.text) {
    return {
      valid: false,
      errors: [issue("empty_content", "Readable BOQ content is required for CSV, TSV, TXT, and Markdown inputs.", "critical")],
      warnings: [warning("empty_content", "No readable BOQ text was supplied.", "warning")],
      descriptor
    };
  }

  if (truncated.truncated) warnings.push(warning("boq_text_truncated", "The BOQ text was truncated before entering runtime prompt limits.", "warning"));
  const parsing = parseBoqContent(document, descriptor, truncated.text);
  const summary = summarizeBoqStructure(parsing);
  const parser = await parseDocumentWithAdapter({ descriptor, content: parsing.content });
  warnings.push(...parser.validation.warnings.map((entry) => warning(entry.code, entry.message, entry.severity === "error" ? "critical" : "warning")));

  return {
    valid: true,
    errors: [],
    warnings,
    descriptor,
    documentContent: parsing.content,
    documentMetadata: descriptor.metadata,
    parsing,
    summary,
    userRequest: buildBoqRuntimeRequest({ descriptor, parsing, summary, warnings, reviewerNotes: request.reviewerNotes })
  };
}

function issueSummary(issues: readonly BoqValidationIssue[], codePrefix: string) {
  return issues.filter((entry) => entry.code.startsWith(codePrefix)).map((entry) => `row ${entry.rowNumber || "n/a"}: ${entry.message}`).slice(0, 18);
}

function buildBoqRuntimeRequest(input: {
  descriptor: DocumentDescriptor;
  parsing?: BoqParsingResult;
  summary: BoqReviewSummary;
  warnings: readonly VoraIntelligenceExecutionWarning[];
  reviewerNotes?: string;
}) {
  return [
    "Review this Bill of Quantities or cost schedule using VORA Intelligence.",
    "",
    "Important rules:",
    "- Do not verify or claim market prices.",
    "- Do not invent missing quantities, rates, amounts, or descriptions.",
    "- Do not provide financial, contractual, or quantity-surveying certification.",
    "- Distinguish deterministic structural findings from AI-generated explanation.",
    "- If extraction is unavailable, explain that the review is based only on metadata and notes.",
    "",
    "Required output sections:",
    "- Executive Summary",
    "- BOQ Overview",
    "- Detected Structure",
    "- Sections",
    "- Item Statistics",
    "- Missing Information",
    "- Potential Duplicates",
    "- Quantity and Unit Issues",
    "- Rate and Amount Issues",
    "- Arithmetic Checks",
    "- Cost Risks",
    "- Items Requiring Review",
    "- Recommended Actions",
    "- Warnings",
    "- Confidence / Structural Completeness",
    "",
    `Document name: ${input.descriptor.name}`,
    `Document type: ${input.descriptor.type}`,
    `Item count: ${input.summary.itemCount}`,
    `Section count: ${input.summary.sectionCount}`,
    `Structural completeness: ${input.summary.structuralCompleteness}%`,
    input.summary.totalAmount !== undefined ? `Available total amount: ${input.summary.totalAmount}` : "Available total amount: not computable",
    `Issue count: ${input.summary.issueCount}`,
    `Duplicate candidates: ${input.summary.duplicateCount}`,
    `Arithmetic mismatches: ${input.summary.arithmeticMismatchCount}`,
    input.parsing ? `Detected columns: ${JSON.stringify(input.parsing.detectedColumns)}` : "Detected columns: unavailable",
    input.parsing ? `Missing field findings: ${issueSummary(input.parsing.issues, "missing").join(" | ") || "none"}` : "",
    input.parsing ? `Arithmetic findings: ${input.parsing.arithmeticChecks.filter((check) => check.status === "mismatch").map((check) => `row ${check.rowNumber}: expected ${check.calculatedAmount}, found ${check.amount}`).join(" | ") || "none"}` : "",
    input.parsing ? `Duplicate findings: ${input.parsing.duplicates.map((duplicate) => `${duplicate.type}:${duplicate.value} rows ${duplicate.rowNumbers.join(",")}`).join(" | ") || "none"}` : "",
    input.warnings.length ? `Warnings: ${input.warnings.map((entry) => entry.message).join(" | ")}` : "",
    input.reviewerNotes ? `Reviewer notes: ${input.reviewerNotes}` : "",
    "",
    input.parsing ? "--- BOQ PREVIEW START ---" : "",
    input.parsing ? input.parsing.items.slice(0, 40).map((item) => JSON.stringify(item)).join("\n") : "",
    input.parsing ? "--- BOQ PREVIEW END ---" : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function textFromUnknownItems(value: readonly unknown[] | undefined, fallback: string): readonly string[] {
  if (!value?.length) return [fallback];
  const mapped = value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return String(record.title || record.label || record.description || record.summary || "").trim();
      }
      return "";
    })
    .filter(Boolean);
  return mapped.length ? mapped : [fallback];
}

export function createBoqReviewStructuredResult(
  response: VoraNormalizedIntelligenceResponse,
  preparation: Awaited<ReturnType<typeof prepareBoqReview>>
): BoqReviewStructuredResult {
  const parsing = preparation.parsing;
  const summary = preparation.summary || { itemCount: 0, sectionCount: 0, issueCount: 0, duplicateCount: 0, arithmeticMismatchCount: 0, structuralCompleteness: 0 };
  const issues = parsing?.issues || [];
  const quantityAndUnitIssues = issues.filter((entry) => ["missing_quantity", "missing_unit", "zero_quantity", "negative_quantity", "inconsistent_units"].includes(entry.code));
  const rateAndAmountIssues = issues.filter((entry) => ["missing_rate", "missing_amount", "zero_rate", "negative_rate", "zero_amount", "negative_amount", "quantity_rate_mismatch"].includes(entry.code));
  return {
    executiveSummary: response.summary || "VORA prepared a BOQ review through the intelligence runtime.",
    boqOverview: preparation.documentContent?.text
      ? `Review basis: readable BOQ text from ${preparation.descriptor?.name || "uploaded document"}. Market pricing was not verified.`
      : `Review basis: metadata only for ${preparation.descriptor?.name || "uploaded document"} because extraction is not available yet.`,
    detectedStructure: {
      detectedColumns: parsing?.detectedColumns || {},
      sectionCount: summary.sectionCount,
      itemCount: summary.itemCount
    },
    sections: parsing?.sections || [],
    itemStatistics: summary,
    missingInformation: issues.filter((entry) => entry.code.startsWith("missing_")).map((entry) => entry.message),
    potentialDuplicates: parsing?.duplicates || [],
    quantityAndUnitIssues,
    rateAndAmountIssues,
    arithmeticChecks: parsing?.arithmeticChecks || [],
    costRisks: textFromUnknownItems(response.risks, "No market-price validation was performed. Review zero, negative, missing, and mismatched values manually."),
    itemsRequiringReview: textFromUnknownItems(response.actions, "Review rows with missing fields, duplicates, arithmetic mismatches, or uncategorized items."),
    recommendedActions: textFromUnknownItems(response.recommendations, "Ask the quantity surveyor or cost controller to verify flagged BOQ rows before tender or award decisions."),
    warnings: [...preparation.warnings, ...response.warnings],
    confidence: response.confidence
  };
}

export async function executeBoqReview(request: BoqReviewInput): Promise<BoqReviewResponse> {
  const preparation = await prepareBoqReview(request);
  const now = request.now || new Date();
  if (!preparation.valid || !preparation.descriptor || !preparation.userRequest) {
    return {
      id: `boq_review_error_${now.toISOString().replace(/[^0-9]/g, "")}`,
      status: "failed",
      taskIntent: "cost_review",
      reasoningType: "cost_review",
      warnings: preparation.warnings,
      errors: preparation.errors.map((entry) => ({ code: entry.code, message: entry.message })),
      confidence: { providerResponse: "placeholder" },
      usedMock: false,
      executionMetadata: {
        usedMock: false,
        taskIntent: "cost_review",
        reasoningType: "cost_review",
        reportType: "cost_report",
        createdAt: now.toISOString()
      },
      createdAt: now.toISOString()
    };
  }

  const response = await executeVoraIntelligence({
    ...request,
    userRequest: preparation.userRequest,
    taskIntent: "cost_review",
    documents: [preparation.descriptor],
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
    boqReview: createBoqReviewStructuredResult(response, preparation)
  };
}

export async function executeBoqReviewSafe(request: BoqReviewInput): Promise<BoqReviewResponse> {
  try {
    return await executeBoqReview(request);
  } catch (error) {
    const fallback = await executeVoraIntelligenceSafe({
      userRequest: "BOQ Review failed before runtime execution.",
      taskIntent: "cost_review",
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
          code: "boq_review_failed",
          message: error instanceof Error ? error.message : "BOQ Review failed safely."
        }
      ]
    };
  }
}
