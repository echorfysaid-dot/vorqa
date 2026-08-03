import type { ConstructionPriority, ConstructionRiskSeverity, ConstructionStatus } from "@/lib/construction-knowledge";
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

export type RiskAssessmentCategory =
  | "commercial"
  | "cost"
  | "planning"
  | "schedule"
  | "quality"
  | "safety"
  | "technical"
  | "documentation"
  | "compliance"
  | "procurement"
  | "construction_execution"
  | "general";

export type RiskProbability = "low" | "medium" | "high";
export type RiskSource = "contract_review" | "boq_review" | "user_notes" | "deterministic_validation";

export type RiskAssessmentDocumentInput = Readonly<{
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  text?: string;
}>;

export type RiskAssessmentInput = Readonly<
  Omit<VoraIntelligenceExecutionRequest, "taskIntent" | "documents" | "documentMetadata" | "documentContent" | "userRequest"> & {
    contractReview?: unknown;
    boqReview?: unknown;
    notes?: string;
    document?: RiskAssessmentDocumentInput;
    reviewerNotes?: string;
  }
>;

export type RiskAssessmentValidationErrorCode = "missing_input" | "unsupported_document" | "empty_available_text";

export type RiskAssessmentValidationError = Readonly<{
  code: RiskAssessmentValidationErrorCode;
  message: string;
}>;

export type RiskAssessmentItem = Readonly<{
  id: string;
  title: string;
  description: string;
  category: RiskAssessmentCategory;
  severity: ConstructionRiskSeverity;
  probability: RiskProbability;
  priority: ConstructionPriority;
  potentialImpact: string;
  evidence: readonly string[];
  source: RiskSource;
  suggestedMitigation: string;
  recommendedOwner: string;
  followUpRequired: boolean;
  status: ConstructionStatus;
  confidence: "deterministic" | "limited" | "placeholder";
}>;

export type RiskMatrixEntry = Readonly<{
  probability: RiskProbability;
  impact: ConstructionRiskSeverity;
  priority: ConstructionPriority;
  riskCount: number;
  riskIds: readonly string[];
}>;

export type RiskAssessmentPreparation = Readonly<{
  valid: boolean;
  errors: readonly RiskAssessmentValidationError[];
  warnings: readonly VoraIntelligenceExecutionWarning[];
  descriptor?: DocumentDescriptor;
  documentContent?: DocumentContent;
  documentMetadata?: DocumentMetadata;
  risks: readonly RiskAssessmentItem[];
  matrix: readonly RiskMatrixEntry[];
  overallRiskLevel: ConstructionRiskSeverity;
  userRequest?: string;
}>;

export type RiskAssessmentStructuredResult = Readonly<{
  executiveSummary: string;
  overallRiskLevel: ConstructionRiskSeverity;
  riskMatrix: readonly RiskMatrixEntry[];
  detectedRisks: readonly RiskAssessmentItem[];
  riskCategories: readonly RiskAssessmentCategory[];
  evidence: readonly string[];
  highPriorityRisks: readonly RiskAssessmentItem[];
  mitigationActions: readonly string[];
  recommendedFollowUp: readonly string[];
  warnings: readonly VoraIntelligenceExecutionWarning[];
  confidence: VoraNormalizedIntelligenceResponse["confidence"];
}>;

export type RiskAssessmentResponse = VoraNormalizedIntelligenceResponse &
  Readonly<{
    riskAssessment?: RiskAssessmentStructuredResult;
  }>;

const supportedRiskDocumentTypes: readonly DocumentType[] = ["txt", "markdown", "pdf", "docx", "report"];
const readableRiskDocumentTypes: readonly DocumentType[] = ["txt", "markdown"];
const maxRiskNotesCharacters = 14_000;

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

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "risk";
}

function truncateText(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxRiskNotesCharacters) return { text: normalized, truncated: false };
  return {
    text: `${normalized.slice(0, maxRiskNotesCharacters - 36).trimEnd()}\n[RISK_NOTES_TRUNCATED]`,
    truncated: true
  };
}

function createDescriptor(document: RiskAssessmentDocumentInput): DocumentDescriptor {
  const inferredType = inferDocumentType({
    mimeType: document.mimeType,
    name: document.name,
    category: "risk_register"
  });

  return normalizeDocument({
    id: `risk-assessment:${slug(document.name)}`,
    name: document.name,
    type: inferredType,
    source: "upload",
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    metadata: {
      title: document.name,
      category: "risk_register",
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      sourceName: document.name,
      tags: ["risk", "assessment"]
    }
  });
}

export function normalizeRiskSeverity(value: unknown): ConstructionRiskSeverity {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("critical") || normalized.includes("urgent") || normalized.includes("severe")) return "critical";
  if (normalized.includes("high") || normalized.includes("major")) return "high";
  if (normalized.includes("low") || normalized.includes("minor")) return "low";
  return "medium";
}

export function normalizeRiskProbability(value: unknown): RiskProbability {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("high") || normalized.includes("likely")) return "high";
  if (normalized.includes("low") || normalized.includes("unlikely")) return "low";
  return "medium";
}

export function calculateRiskPriority(severity: ConstructionRiskSeverity, probability: RiskProbability): ConstructionPriority {
  if (severity === "critical" || (severity === "high" && probability === "high")) return "urgent";
  if (severity === "high" || (severity === "medium" && probability === "high")) return "high";
  if (severity === "medium" || probability === "medium") return "medium";
  return "low";
}

function categoryFromText(text: string): RiskAssessmentCategory {
  const normalized = text.toLowerCase();
  if (/missing|document|attachment|permit|approval|record/.test(normalized)) return "documentation";
  if (/payment|penalt|warrant|claim|variation|liability|contract|scope|commercial/.test(normalized)) return "commercial";
  if (/boq|cost|budget|rate|amount|quantity|price|invoice|overrun/.test(normalized)) return "cost";
  if (/schedule|delay|deadline|milestone|timeline|handover/.test(normalized)) return "schedule";
  if (/plan|coordination|dependency|sequence/.test(normalized)) return "planning";
  if (/quality|inspection|defect|specification|nonconformance/.test(normalized)) return "quality";
  if (/safety|hazard|incident|hse|method statement/.test(normalized)) return "safety";
  if (/technical|drawing|design|engineering|structural|mep/.test(normalized)) return "technical";
  if (/compliance|regulation|authority|permit|legal/.test(normalized)) return "compliance";
  if (/supplier|procurement|material|delivery|lead time/.test(normalized)) return "procurement";
  if (/site|execution|construction|workforce|labor|equipment/.test(normalized)) return "construction_execution";
  return "general";
}

function severityFromText(text: string): ConstructionRiskSeverity {
  const normalized = text.toLowerCase();
  if (/critical|stop work|unsafe|illegal|severe|termination/.test(normalized)) return "critical";
  if (/delay|penalty|missing|mismatch|negative|overrun|duplicate|claim|unapproved/.test(normalized)) return "high";
  if (/review|verify|confirm|unclear|incomplete|placeholder/.test(normalized)) return "medium";
  return "low";
}

function ownerFromCategory(category: RiskAssessmentCategory) {
  const owners: Record<RiskAssessmentCategory, string> = {
    commercial: "Project Manager / Contract Manager",
    cost: "Cost Controller / Quantity Surveyor",
    planning: "Planning Manager",
    schedule: "Planning Manager",
    quality: "Quality Manager",
    safety: "HSE Manager",
    technical: "Technical Manager",
    documentation: "Document Controller",
    compliance: "Compliance Lead",
    procurement: "Procurement Manager",
    construction_execution: "Site Manager",
    general: "Project Manager"
  };
  return owners[category];
}

function mitigationFromCategory(category: RiskAssessmentCategory) {
  const actions: Record<RiskAssessmentCategory, string> = {
    commercial: "Review commercial terms against project scope, approvals, and contract attachments before decision.",
    cost: "Reconcile quantities, rates, totals, and missing BOQ data with the cost owner before tender or award.",
    planning: "Validate dependencies, responsibilities, and planning assumptions with the delivery team.",
    schedule: "Confirm milestones, delay exposure, and recovery actions with the planning manager.",
    quality: "Check specifications, inspection requirements, and acceptance criteria before execution.",
    safety: "Escalate to HSE for method statement, hazard controls, and site-readiness review.",
    technical: "Request technical clarification from the responsible engineer or design office.",
    documentation: "Collect missing attachments, approvals, permits, and source documents before relying on the package.",
    compliance: "Verify authority, regulatory, and contractual compliance requirements before proceeding.",
    procurement: "Validate supplier lead times, material availability, and procurement dependencies.",
    construction_execution: "Review execution constraints, site readiness, labor, equipment, and access requirements.",
    general: "Assign a project owner to validate the issue and define the next action."
  };
  return actions[category];
}

function potentialImpactFromCategory(category: RiskAssessmentCategory) {
  const impacts: Record<RiskAssessmentCategory, string> = {
    commercial: "Claims, payment disputes, scope conflict, or approval delays.",
    cost: "Budget variance, tender ambiguity, incorrect award basis, or cost overrun.",
    planning: "Coordination gaps, unclear sequencing, or delayed decision-making.",
    schedule: "Milestone slippage, delayed handover, or acceleration pressure.",
    quality: "Rework, rejected inspections, or unclear acceptance criteria.",
    safety: "Unsafe work conditions, incident exposure, or blocked execution.",
    technical: "Design conflict, engineering clarification delay, or construction error.",
    documentation: "Incomplete review basis, missing evidence, or blocked approvals.",
    compliance: "Regulatory delay, authority rejection, or contractual non-compliance.",
    procurement: "Late materials, supplier delay, or unavailable scope package.",
    construction_execution: "Site productivity loss, coordination delay, or execution blockage.",
    general: "Project uncertainty requiring owner review."
  };
  return impacts[category];
}

function extractStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return String(record.title || record.message || record.description || record.summary || record.label || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

function makeRisk(input: {
  text: string;
  source: RiskSource;
  index: number;
  severity?: ConstructionRiskSeverity;
  probability?: RiskProbability;
  evidence?: readonly string[];
}): RiskAssessmentItem {
  const category = categoryFromText(input.text);
  const severity = input.severity || severityFromText(input.text);
  const probability = input.probability || normalizeRiskProbability(input.text);
  const priority = calculateRiskPriority(severity, probability);
  return deepFreeze({
    id: `risk-${input.source}-${input.index + 1}-${slug(input.text)}`,
    title: input.text.length > 92 ? `${input.text.slice(0, 89).trimEnd()}...` : input.text,
    description: input.text,
    category,
    severity,
    probability,
    priority,
    potentialImpact: potentialImpactFromCategory(category),
    evidence: input.evidence?.length ? input.evidence : [input.text],
    source: input.source,
    suggestedMitigation: mitigationFromCategory(category),
    recommendedOwner: ownerFromCategory(category),
    followUpRequired: priority === "urgent" || priority === "high",
    status: "under_review",
    confidence: input.source === "deterministic_validation" ? "limited" : "deterministic"
  });
}

function uniqueRisks(risks: readonly RiskAssessmentItem[]) {
  const seen = new Set<string>();
  return risks.filter((risk) => {
    const key = `${risk.source}:${risk.description.toLowerCase().replace(/\s+/g, " ").slice(0, 140)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectContractRisks(contractReview: unknown): readonly RiskAssessmentItem[] {
  if (typeof contractReview === "string") {
    return uniqueRisks(
      contractReview
        .split(/\n+|(?<=[.!?])\s+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 24)
        .map((text, index) => makeRisk({ text, source: "contract_review", index, evidence: [text] }))
    );
  }
  if (!contractReview || typeof contractReview !== "object") return [];
  const record = contractReview as Record<string, unknown>;
  const review = (record.contractReview && typeof record.contractReview === "object" ? record.contractReview : record) as Record<string, unknown>;
  const findings = [
    ...extractStringArray(review.potentialRisks),
    ...extractStringArray(review.missingInformation).map((item) => `Missing contract information: ${item}`),
    ...extractStringArray(review.itemsRequiringReview).map((item) => `Contract item requiring review: ${item}`)
  ];
  return uniqueRisks(findings.map((text, index) => makeRisk({ text, source: "contract_review", index, evidence: [text] })));
}

function collectBoqRisks(boqReview: unknown): readonly RiskAssessmentItem[] {
  if (typeof boqReview === "string") {
    return uniqueRisks(
      boqReview
        .split(/\n+|(?<=[.!?])\s+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 24)
        .map((text, index) => makeRisk({ text, source: "boq_review", index, evidence: [text] }))
    );
  }
  if (!boqReview || typeof boqReview !== "object") return [];
  const record = boqReview as Record<string, unknown>;
  const review = (record.boqReview && typeof record.boqReview === "object" ? record.boqReview : record) as Record<string, unknown>;
  const issues = [
    ...extractStringArray(review.costRisks),
    ...extractStringArray(review.missingInformation).map((item) => `BOQ missing information: ${item}`),
    ...extractStringArray(review.quantityAndUnitIssues).map((item) => `BOQ quantity/unit issue: ${item}`),
    ...extractStringArray(review.rateAndAmountIssues).map((item) => `BOQ rate/amount issue: ${item}`),
    ...extractStringArray(review.potentialDuplicates).map((item) => `BOQ duplicate candidate: ${item}`)
  ];
  return uniqueRisks(issues.map((text, index) => makeRisk({ text, source: "boq_review", index, evidence: [text] })));
}

function collectNoteRisks(notes: string, startIndex = 0): readonly RiskAssessmentItem[] {
  const normalized = truncateText(notes).text;
  if (!normalized) return [];
  const candidates = normalized
    .split(/\n+|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /risk|delay|missing|unsafe|safety|permit|budget|cost|overrun|duplicate|mismatch|penalty|warranty|claim|approval|supplier|quality|technical|site/i.test(line));
  const sourceLines = candidates.length ? candidates : [normalized.slice(0, 280)];
  return uniqueRisks(sourceLines.slice(0, 24).map((text, index) => makeRisk({ text, source: "user_notes", index: startIndex + index, evidence: [text] })));
}

export function createRiskMatrix(risks: readonly RiskAssessmentItem[]): readonly RiskMatrixEntry[] {
  const grouped = new Map<string, RiskAssessmentItem[]>();
  for (const risk of risks) {
    const key = `${risk.probability}:${risk.severity}:${risk.priority}`;
    grouped.set(key, [...(grouped.get(key) || []), risk]);
  }
  return deepFreeze(
    [...grouped.entries()]
      .map(([, group]) => ({
        probability: group[0].probability,
        impact: group[0].severity,
        priority: group[0].priority,
        riskCount: group.length,
        riskIds: group.map((risk) => risk.id)
      }))
      .sort((left, right) => priorityRank(right.priority) - priorityRank(left.priority))
  );
}

function priorityRank(priority: ConstructionPriority) {
  return { low: 1, medium: 2, high: 3, urgent: 4 }[priority];
}

function severityRank(severity: ConstructionRiskSeverity) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity];
}

export function calculateOverallRiskLevel(risks: readonly RiskAssessmentItem[]): ConstructionRiskSeverity {
  return risks.reduce<ConstructionRiskSeverity>((current, risk) => (severityRank(risk.severity) > severityRank(current) ? risk.severity : current), "low");
}

function buildRiskRuntimeRequest(input: {
  risks: readonly RiskAssessmentItem[];
  matrix: readonly RiskMatrixEntry[];
  overallRiskLevel: ConstructionRiskSeverity;
  warnings: readonly VoraIntelligenceExecutionWarning[];
  reviewerNotes?: string;
  documentText?: string;
  descriptor?: DocumentDescriptor;
}) {
  return [
    "Prepare a professional construction risk assessment using VORA Intelligence.",
    "",
    "Important rules:",
    "- Do not invent risks.",
    "- Every risk must originate from Contract Review, BOQ Review, user notes, or deterministic validation.",
    "- Clearly distinguish detected evidence, AI explanation, and recommendation.",
    "- Do not provide legal, safety, quantity surveying, or engineering certification.",
    "- If parsing is unavailable, state that the assessment is limited to metadata and supplied notes.",
    "",
    "Required output sections:",
    "- Executive Summary",
    "- Overall Risk Level",
    "- Risk Matrix",
    "- Detected Risks",
    "- Risk Categories",
    "- Evidence",
    "- High Priority Risks",
    "- Mitigation Actions",
    "- Recommended Follow-up",
    "- Warnings",
    "- Confidence",
    "",
    `Overall risk level: ${input.overallRiskLevel}`,
    `Detected risk count: ${input.risks.length}`,
    `Risk matrix: ${JSON.stringify(input.matrix)}`,
    `Detected risks: ${JSON.stringify(input.risks)}`,
    input.descriptor ? `Notes document: ${input.descriptor.name} (${input.descriptor.type})` : "",
    input.warnings.length ? `Warnings: ${input.warnings.map((entry) => entry.message).join(" | ")}` : "",
    input.reviewerNotes ? `Reviewer notes: ${input.reviewerNotes}` : "",
    input.documentText ? `\n--- USER NOTES TEXT START ---\n${input.documentText}\n--- USER NOTES TEXT END ---` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export async function prepareRiskAssessment(request: RiskAssessmentInput): Promise<RiskAssessmentPreparation> {
  const warnings: VoraIntelligenceExecutionWarning[] = [];
  const collectedRisks: RiskAssessmentItem[] = [
    ...collectContractRisks(request.contractReview),
    ...collectBoqRisks(request.boqReview),
    ...collectNoteRisks(request.notes || "")
  ];

  let descriptor: DocumentDescriptor | undefined;
  let documentContent: DocumentContent | undefined;
  let documentMetadata: DocumentMetadata | undefined;
  let documentText = "";

  if (request.document) {
    descriptor = createDescriptor(request.document);
    if (!supportedRiskDocumentTypes.includes(descriptor.type)) {
      return {
        valid: false,
        errors: [{ code: "unsupported_document", message: "Risk Assessment supports TXT, Markdown, PDF placeholder, and DOCX placeholder notes." }],
        warnings: [warning("unsupported_document", `Unsupported risk assessment document type: ${descriptor.type}.`, "critical")],
        descriptor,
        risks: [],
        matrix: [],
        overallRiskLevel: "low"
      };
    }

    const readable = readableRiskDocumentTypes.includes(descriptor.type);
    const truncated = truncateText(request.document.text || "");
    if (readable && !truncated.text) {
      return {
        valid: false,
        errors: [{ code: "empty_available_text", message: "TXT and Markdown risk notes must contain readable text." }],
        warnings: [warning("empty_available_text", "The uploaded notes document did not contain readable text.", "warning")],
        descriptor,
        risks: [],
        matrix: [],
        overallRiskLevel: "low"
      };
    }

    if (readable) {
      documentText = truncated.text;
      collectedRisks.push(...collectNoteRisks(documentText, collectedRisks.length));
      documentContent = { text: documentText, status: "normalized" };
      if (truncated.truncated) warnings.push(warning("risk_notes_truncated", "Risk notes were truncated before entering runtime prompt limits.", "warning"));
    } else {
      documentContent = { status: "placeholder" };
      warnings.push(
        warning(
          "parser_placeholder_only",
          `${descriptor.type.toUpperCase()} parsing is not available yet. VORA will not invent risks from the file body and will use metadata plus supplied notes only.`,
          "warning"
        )
      );
      collectedRisks.push(
        makeRisk({
          text: `${descriptor.type.toUpperCase()} parsing unavailable for ${descriptor.name}; evidence is limited to metadata and supplied notes.`,
          source: "deterministic_validation",
          index: collectedRisks.length,
          severity: "medium",
          probability: "medium"
        })
      );
    }

    const parser = await parseDocumentWithAdapter({ descriptor, content: documentContent });
    warnings.push(...parser.validation.warnings.map((entry) => warning(entry.code, entry.message, entry.severity === "error" ? "critical" : "warning")));
    documentMetadata = descriptor.metadata;
  }

  const risks = uniqueRisks(collectedRisks);
  if (!risks.length) {
    return {
      valid: false,
      errors: [{ code: "missing_input", message: "Provide a Contract Review result, BOQ Review result, readable notes, or a supported notes file before running Risk Assessment." }],
      warnings,
      descriptor,
      documentContent,
      documentMetadata,
      risks: [],
      matrix: [],
      overallRiskLevel: "low"
    };
  }

  const matrix = createRiskMatrix(risks);
  const overallRiskLevel = calculateOverallRiskLevel(risks);
  return {
    valid: true,
    errors: [],
    warnings,
    descriptor,
    documentContent,
    documentMetadata,
    risks,
    matrix,
    overallRiskLevel,
    userRequest: buildRiskRuntimeRequest({
      risks,
      matrix,
      overallRiskLevel,
      warnings,
      reviewerNotes: request.reviewerNotes,
      documentText,
      descriptor
    })
  };
}

export function createRiskAssessmentStructuredResult(
  response: VoraNormalizedIntelligenceResponse,
  preparation: RiskAssessmentPreparation
): RiskAssessmentStructuredResult {
  const highPriorityRisks = preparation.risks.filter((risk) => risk.priority === "urgent" || risk.priority === "high");
  return deepFreeze({
    executiveSummary: response.summary || `VORA prepared a structured risk assessment from ${preparation.risks.length} detected risk inputs.`,
    overallRiskLevel: preparation.overallRiskLevel,
    riskMatrix: preparation.matrix,
    detectedRisks: preparation.risks,
    riskCategories: Array.from(new Set(preparation.risks.map((risk) => risk.category))).sort(),
    evidence: preparation.risks.flatMap((risk) => risk.evidence).slice(0, 80),
    highPriorityRisks,
    mitigationActions: preparation.risks.map((risk) => risk.suggestedMitigation).filter((value, index, values) => values.indexOf(value) === index),
    recommendedFollowUp: preparation.risks
      .filter((risk) => risk.followUpRequired)
      .map((risk) => `${risk.recommendedOwner}: ${risk.title}`)
      .slice(0, 20),
    warnings: [...preparation.warnings, ...response.warnings],
    confidence: response.confidence
  });
}

export async function executeRiskAssessment(request: RiskAssessmentInput): Promise<RiskAssessmentResponse> {
  const preparation = await prepareRiskAssessment(request);
  const now = request.now || new Date();
  if (!preparation.valid || !preparation.userRequest) {
    return {
      id: `risk_assessment_error_${now.toISOString().replace(/[^0-9]/g, "")}`,
      status: "failed",
      taskIntent: "risk_assessment",
      reasoningType: "risk_review",
      warnings: preparation.warnings,
      errors: preparation.errors,
      confidence: { providerResponse: "placeholder" },
      usedMock: false,
      executionMetadata: {
        usedMock: false,
        taskIntent: "risk_assessment",
        reasoningType: "risk_review",
        reportType: "risk_report",
        createdAt: now.toISOString()
      },
      createdAt: now.toISOString()
    };
  }

  const response = await executeVoraIntelligence({
    ...request,
    userRequest: preparation.userRequest,
    taskIntent: "risk_assessment",
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
    riskAssessment: createRiskAssessmentStructuredResult(response, preparation)
  };
}

export async function executeRiskAssessmentSafe(request: RiskAssessmentInput): Promise<RiskAssessmentResponse> {
  try {
    return await executeRiskAssessment(request);
  } catch (error) {
    const fallback = await executeVoraIntelligenceSafe({
      userRequest: "Risk Assessment failed before runtime execution.",
      taskIntent: "risk_assessment",
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
          code: "risk_assessment_failed",
          message: error instanceof Error ? error.message : "Risk Assessment failed safely."
        }
      ]
    };
  }
}
