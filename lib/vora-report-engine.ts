import type { AiApplicationContext } from "@/lib/ai-context";
import type { MemorySnapshot } from "@/lib/ai-memory";
import type {
  ConstructionApprovalState,
  ConstructionDocumentCategory,
  ConstructionEntityType,
  ConstructionKnowledgeRegistry,
  ConstructionPriority,
  ConstructionRiskSeverity,
  ConstructionStatus
} from "@/lib/construction-knowledge";
import {
  constructionKnowledgeRegistry,
  validateConstructionDocumentCategory
} from "@/lib/construction-knowledge";
import type { DocumentMetadata } from "@/lib/document-intelligence";
import type { DecisionAction, DecisionActionType, DecisionPlan, DecisionWarning } from "@/lib/vora-decision-engine";
import type { ReasoningEvidence, ReasoningPlan } from "@/lib/vora-reasoning-engine";

export type ReportType =
  | "document_review_report"
  | "contract_review_report"
  | "risk_report"
  | "planning_report"
  | "cost_report"
  | "quality_report"
  | "safety_report"
  | "schedule_report"
  | "compliance_report"
  | "site_report"
  | "meeting_report"
  | "executive_summary"
  | "general_report";

export type ReportSectionType =
  | "title"
  | "executive_summary"
  | "project_context"
  | "document_context"
  | "scope"
  | "findings"
  | "risks"
  | "issues"
  | "missing_information"
  | "evidence"
  | "actions"
  | "schedule"
  | "cost"
  | "quality"
  | "safety"
  | "compliance"
  | "approvals"
  | "conclusion"
  | "appendices";

export type ReportAudience =
  | "project_team"
  | "site_manager"
  | "engineer"
  | "contractor"
  | "client"
  | "owner"
  | "executive"
  | "auditor"
  | "authority";

export type ReportOutputFormat = "structured_data" | "markdown" | "html" | "pdf_placeholder" | "docx_placeholder";
export type ReportDetailLevel = "brief" | "standard" | "detailed";

export type ReportErrorCode =
  | "invalid_request"
  | "missing_reasoning_plan"
  | "missing_decision_plan"
  | "unsupported_report_type"
  | "missing_required_section"
  | "missing_required_evidence"
  | "invalid_reference"
  | "incomplete_report_plan"
  | "permission_restriction"
  | "unknown_error";

export type ReportOutputPreferences = Readonly<{
  language?: string;
  direction?: "rtl" | "ltr";
  detailLevel?: ReportDetailLevel;
  audience?: ReportAudience;
  outputFormat?: ReportOutputFormat;
  includeEvidence?: boolean;
  includeAppendices?: boolean;
  includeRecommendationsPlaceholder?: boolean;
}>;

export type ReportEvidenceReference = Readonly<{
  id: string;
  source:
    | "reasoning_plan"
    | "decision_plan"
    | "application_context"
    | "memory"
    | "construction_knowledge"
    | "document_metadata"
    | "user_request";
  label: string;
  available: boolean;
  sectionTypes: readonly ReportSectionType[];
  reasoningEvidenceId?: string;
  decisionEvidenceId?: string;
  documentCategory?: ConstructionDocumentCategory;
  entityType?: ConstructionEntityType;
  notes?: string;
}>;

export type ReportFinding = Readonly<{
  id: string;
  category: ReportType;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  severity: ConstructionRiskSeverity;
  priority: ConstructionPriority;
  relatedEntities: readonly ConstructionEntityType[];
  relatedDocumentReferences: readonly string[];
  evidenceReferences: readonly string[];
  decisionActionReferences: readonly string[];
  confidencePlaceholder: Readonly<{
    status: "placeholder";
    score: number;
    rationale: string;
  }>;
  status: ConstructionStatus;
}>;

export type ReportWarning = Readonly<{
  code: ReportErrorCode;
  message: string;
  severity: "info" | "warning" | "critical";
  source: "report_engine" | "reasoning_plan" | "decision_plan";
}>;

export type ReportMissingInformation = Readonly<{
  id: string;
  label: string;
  required: boolean;
  source: "decision_requirement" | "report_validation" | "document_metadata";
  sectionTypes: readonly ReportSectionType[];
  notes?: string;
}>;

export type ReportApprovalRequirement = Readonly<{
  id: string;
  label: string;
  state: ConstructionApprovalState;
  required: boolean;
  audience: ReportAudience;
  relatedSections: readonly ReportSectionType[];
}>;

export type ReportSection = Readonly<{
  id: string;
  type: ReportSectionType;
  title: string;
  order: number;
  required: boolean;
  placeholders: readonly string[];
  evidenceReferences: readonly string[];
  findingReferences: readonly string[];
  decisionActionReferences: readonly string[];
  missingInformationReferences: readonly string[];
}>;

export type ReportValidationResult = Readonly<{
  valid: boolean;
  errors: readonly ReportError[];
  warnings: readonly ReportWarning[];
}>;

export type ReportError = Readonly<{
  code: ReportErrorCode;
  message: string;
  field?: string;
}>;

export type ReportResultPlaceholder = Readonly<{
  status: "not_rendered";
  reason: "architecture_only";
  outputFormat: ReportOutputFormat;
  summary: string;
}>;

export type ReportCompleteness = Readonly<{
  structuralScore: number;
  level: "incomplete" | "partial" | "ready";
  rationale: string;
}>;

export type ReportRequest = Readonly<{
  reasoningPlan?: ReasoningPlan;
  decisionPlan?: DecisionPlan;
  context?: AiApplicationContext;
  memory?: MemorySnapshot;
  constructionKnowledge?: ConstructionKnowledgeRegistry;
  documentMetadata?: readonly DocumentMetadata[];
  preferences?: ReportOutputPreferences;
  reportType?: ReportType;
  now?: Date;
}>;

export type ReportPlan = Readonly<{
  version: "1.0";
  id: string;
  createdAt: string;
  type: ReportType;
  title: string;
  preferences: Required<ReportOutputPreferences>;
  sections: readonly ReportSection[];
  findings: readonly ReportFinding[];
  evidence: readonly ReportEvidenceReference[];
  warnings: readonly ReportWarning[];
  missingInformation: readonly ReportMissingInformation[];
  approvalRequirements: readonly ReportApprovalRequirement[];
  completeness: ReportCompleteness;
  validation: ReportValidationResult;
  result: ReportResultPlaceholder;
  inputSummary: Readonly<{
    reasoningPlanId?: string;
    decisionPlanId?: string;
    sectionCount: number;
    findingCount: number;
    evidenceCount: number;
    missingInformationCount: number;
  }>;
}>;

const defaultPreferences: Required<ReportOutputPreferences> = {
  language: "ar",
  direction: "rtl",
  detailLevel: "standard",
  audience: "project_team",
  outputFormat: "structured_data",
  includeEvidence: true,
  includeAppendices: false,
  includeRecommendationsPlaceholder: false
};

const reportTypeByDecisionType: Record<DecisionPlan["type"], ReportType> = {
  document_review: "document_review_report",
  contract_review: "contract_review_report",
  planning: "planning_report",
  risk_analysis: "risk_report",
  quality_review: "quality_report",
  safety_review: "safety_report",
  schedule_review: "schedule_report",
  cost_review: "cost_report",
  compliance_review: "compliance_report",
  general_assistance: "general_report"
};

const reportTitles: Record<ReportType, string> = {
  document_review_report: "Document Review Report Plan",
  contract_review_report: "Contract Review Report Plan",
  risk_report: "Risk Report Plan",
  planning_report: "Planning Report Plan",
  cost_report: "Cost Report Plan",
  quality_report: "Quality Report Plan",
  safety_report: "Safety Report Plan",
  schedule_report: "Schedule Report Plan",
  compliance_report: "Compliance Report Plan",
  site_report: "Site Report Plan",
  meeting_report: "Meeting Report Plan",
  executive_summary: "Executive Summary Report Plan",
  general_report: "General Report Plan"
};

const baseSections: readonly ReportSectionType[] = ["title", "project_context", "scope", "findings", "missing_information", "actions", "conclusion"];

const sectionsByReportType: Record<ReportType, readonly ReportSectionType[]> = {
  document_review_report: ["document_context", "evidence", "approvals"],
  contract_review_report: ["document_context", "compliance", "cost", "approvals", "evidence"],
  risk_report: ["risks", "issues", "evidence", "approvals"],
  planning_report: ["schedule", "cost", "approvals"],
  cost_report: ["cost", "evidence", "approvals"],
  quality_report: ["quality", "evidence", "approvals"],
  safety_report: ["safety", "risks", "issues", "approvals"],
  schedule_report: ["schedule", "risks", "evidence"],
  compliance_report: ["compliance", "document_context", "approvals", "evidence"],
  site_report: ["document_context", "issues", "quality", "safety", "evidence"],
  meeting_report: ["document_context", "actions", "appendices"],
  executive_summary: ["executive_summary", "risks", "cost", "schedule", "approvals"],
  general_report: ["executive_summary", "evidence"]
};

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

function createReportPlanId(type: ReportType, createdAt: string) {
  return `report_${type}_${createdAt.replace(/[^0-9]/g, "")}`;
}

function normalizePreferences(preferences?: ReportOutputPreferences, context?: AiApplicationContext): Required<ReportOutputPreferences> {
  return {
    ...defaultPreferences,
    language: context?.language || defaultPreferences.language,
    direction: context?.direction || defaultPreferences.direction,
    ...preferences
  };
}

function documentCategoriesFromMetadata(metadata: readonly DocumentMetadata[] = []): readonly ConstructionDocumentCategory[] {
  return Array.from(
    new Set(
      metadata
        .map((item) => item.category)
        .filter((category): category is string => Boolean(category))
        .filter(validateConstructionDocumentCategory)
    )
  ).sort();
}

function reasoningEvidenceToReportEvidence(evidence: ReasoningEvidence): ReportEvidenceReference {
  return {
    id: `report.${evidence.id}`,
    source:
      evidence.source === "application_context"
        ? "application_context"
        : evidence.source === "memory"
          ? "memory"
          : evidence.source === "construction_knowledge"
            ? "construction_knowledge"
            : evidence.source === "document_metadata"
              ? "document_metadata"
              : "reasoning_plan",
    label: evidence.label,
    available: evidence.available,
    sectionTypes: evidence.documentCategory ? ["document_context", "evidence"] : evidence.entityType ? ["findings", "evidence"] : ["scope", "evidence"],
    reasoningEvidenceId: evidence.id,
    documentCategory: evidence.documentCategory,
    entityType: evidence.entityType,
    notes: evidence.notes
  };
}

function decisionEvidenceToReportEvidence(evidence: DecisionPlan["evidence"][number]): ReportEvidenceReference {
  return {
    id: `report.${evidence.id}`,
    source: evidence.source === "decision_engine" ? "decision_plan" : evidence.source,
    label: evidence.label,
    available: evidence.available,
    sectionTypes: evidence.requiredForActions.includes("escalate_issue") ? ["risks", "actions", "evidence"] : ["actions", "evidence"],
    decisionEvidenceId: evidence.id,
    notes: evidence.notes
  };
}

export function resolveReportType(request: ReportRequest): ReportType {
  if (request.reportType) return request.reportType;
  if (request.decisionPlan) return reportTypeByDecisionType[request.decisionPlan.type];

  const categories = documentCategoriesFromMetadata(request.documentMetadata);
  if (categories.includes("meeting_minutes")) return "meeting_report";
  if (categories.includes("safety_report") || categories.includes("method_statement")) return "safety_report";
  if (categories.includes("quality_report") || categories.includes("inspection_report")) return "quality_report";
  if (categories.includes("schedule")) return "schedule_report";
  if (categories.includes("contract")) return "contract_review_report";
  if (categories.includes("boq") || categories.includes("invoice") || categories.includes("payment_certificate")) return "cost_report";
  if (categories.includes("permit") || categories.includes("specification")) return "compliance_report";
  if (request.reasoningPlan?.type === "planning") return "planning_report";
  return "general_report";
}

export function validateReportRequest(request: ReportRequest): ReportValidationResult {
  const errors: ReportError[] = [];
  const warnings: ReportWarning[] = [];

  if (!request.reasoningPlan) {
    errors.push({
      code: "missing_reasoning_plan",
      message: "A reasoning plan is required to create a report plan.",
      field: "reasoningPlan"
    });
  }

  if (!request.decisionPlan) {
    errors.push({
      code: "missing_decision_plan",
      message: "A decision plan is required to create a report plan.",
      field: "decisionPlan"
    });
  }

  if (request.context && !request.context.permissions.canUsePrivateWorkspace) {
    warnings.push({
      code: "permission_restriction",
      message: "The current context indicates restricted workspace permissions.",
      severity: "warning",
      source: "report_engine"
    });
  }

  if (request.reasoningPlan?.result.status !== "not_executed" || request.decisionPlan?.outcome.status !== "not_executed") {
    warnings.push({
      code: "invalid_request",
      message: "Report planning expects architecture-only reasoning and decision placeholders.",
      severity: "info",
      source: "report_engine"
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function sectionTitle(type: ReportSectionType): string {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sectionPlaceholder(type: ReportSectionType): string {
  const placeholders: Record<ReportSectionType, string> = {
    title: "Report title placeholder.",
    executive_summary: "Executive summary placeholder. No prose generated.",
    project_context: "Project and organization context references.",
    document_context: "Document metadata references.",
    scope: "Report scope references.",
    findings: "Structured finding placeholders.",
    risks: "Risk placeholders.",
    issues: "Issue placeholders.",
    missing_information: "Missing information references.",
    evidence: "Evidence references.",
    actions: "Decision action references.",
    schedule: "Schedule review placeholders.",
    cost: "Cost review placeholders.",
    quality: "Quality review placeholders.",
    safety: "Safety review placeholders.",
    compliance: "Compliance review placeholders.",
    approvals: "Approval requirement placeholders.",
    conclusion: "Conclusion placeholder. No prose generated.",
    appendices: "Appendix references."
  };

  return placeholders[type];
}

export function mapDecisionActionsToReportSections(actions: readonly DecisionAction[]): Readonly<Record<ReportSectionType, readonly string[]>> {
  const actionSections: Partial<Record<ReportSectionType, string[]>> = {};
  for (const action of actions) {
    const sections: readonly ReportSectionType[] =
      action.type === "highlight_risks" || action.type === "escalate_issue"
        ? ["risks", "actions"]
        : action.type === "validate_schedule"
          ? ["schedule", "actions"]
          : action.type === "verify_contract"
            ? ["compliance", "approvals", "actions"]
            : action.type === "identify_missing_data" || action.type === "request_information"
              ? ["missing_information", "actions"]
              : ["actions"];

    for (const section of sections) {
      actionSections[section] = [...(actionSections[section] || []), action.id];
    }
  }

  return actionSections as Readonly<Record<ReportSectionType, readonly string[]>>;
}

export function mapEvidenceToReportSections(evidence: readonly ReportEvidenceReference[]): Readonly<Record<ReportSectionType, readonly string[]>> {
  const evidenceSections: Partial<Record<ReportSectionType, string[]>> = {};
  for (const item of evidence) {
    for (const section of item.sectionTypes) {
      evidenceSections[section] = [...(evidenceSections[section] || []), item.id];
    }
  }

  return evidenceSections as Readonly<Record<ReportSectionType, readonly string[]>>;
}

export function buildReportSections(input: {
  type: ReportType;
  findings: readonly ReportFinding[];
  evidence: readonly ReportEvidenceReference[];
  missingInformation: readonly ReportMissingInformation[];
  actions: readonly DecisionAction[];
  preferences: Required<ReportOutputPreferences>;
}): readonly ReportSection[] {
  const sectionTypes = Array.from(
    new Set([
      ...baseSections,
      ...sectionsByReportType[input.type],
      ...(input.preferences.includeEvidence ? ["evidence" as ReportSectionType] : []),
      ...(input.preferences.includeAppendices ? ["appendices" as ReportSectionType] : []),
      ...(input.missingInformation.length ? ["missing_information" as ReportSectionType] : []),
      ...(input.actions.some((action) => action.escalationRequired) ? ["approvals" as ReportSectionType] : [])
    ])
  );
  const actionMap = mapDecisionActionsToReportSections(input.actions);
  const evidenceMap = mapEvidenceToReportSections(input.evidence);

  return sectionTypes.map((type, index) => ({
    id: `section.${type}`,
    type,
    title: sectionTitle(type),
    order: index + 1,
    required: ["title", "project_context", "scope", "findings", "missing_information", "actions", "conclusion"].includes(type),
    placeholders: [sectionPlaceholder(type)],
    evidenceReferences: evidenceMap[type] || [],
    findingReferences: input.findings.filter((finding) => sectionForFinding(finding).includes(type)).map((finding) => finding.id),
    decisionActionReferences: actionMap[type] || [],
    missingInformationReferences: type === "missing_information" ? input.missingInformation.map((item) => item.id) : []
  }));
}

function sectionForFinding(finding: ReportFinding): readonly ReportSectionType[] {
  const map: Record<ReportType, readonly ReportSectionType[]> = {
    document_review_report: ["findings", "document_context"],
    contract_review_report: ["findings", "compliance"],
    risk_report: ["findings", "risks"],
    planning_report: ["findings", "schedule"],
    cost_report: ["findings", "cost"],
    quality_report: ["findings", "quality"],
    safety_report: ["findings", "safety"],
    schedule_report: ["findings", "schedule"],
    compliance_report: ["findings", "compliance"],
    site_report: ["findings", "issues"],
    meeting_report: ["findings", "actions"],
    executive_summary: ["findings", "executive_summary"],
    general_report: ["findings"]
  };

  return map[finding.category];
}

function severityFromAction(action: DecisionAction): ConstructionRiskSeverity {
  if (action.escalationRequired || action.priority === "urgent") return "critical";
  if (action.priority === "high") return "high";
  if (action.priority === "medium") return "medium";
  return "low";
}

function relatedEntitiesForAction(
  reportType: ReportType,
  reasoningPlan: ReasoningPlan,
  documentMetadata: readonly DocumentMetadata[]
): readonly ConstructionEntityType[] {
  const objectiveEntities = reasoningPlan.objectives.flatMap((objective) => objective.relatedEntities);
  const metadataCategories = documentCategoriesFromMetadata(documentMetadata);
  const metadataEntities = metadataCategories.flatMap((category) => constructionKnowledgeRegistry.documentCategories[category].primaryEntities);
  const reportEntities: Partial<Record<ReportType, readonly ConstructionEntityType[]>> = {
    contract_review_report: ["contract", "stakeholder", "payment"],
    risk_report: ["risk", "issue"],
    planning_report: ["project", "task", "milestone"],
    cost_report: ["boq", "cost_item", "invoice"],
    quality_report: ["quality_control", "inspection", "observation"],
    safety_report: ["safety", "risk", "inspection"],
    schedule_report: ["schedule", "milestone", "task"],
    compliance_report: ["permit", "regulation", "specification"]
  };

  return Array.from(new Set([...(reportEntities[reportType] || []), ...objectiveEntities, ...metadataEntities])).sort();
}

export function rankReportFindings(input: {
  type: ReportType;
  reasoningPlan: ReasoningPlan;
  decisionPlan: DecisionPlan;
  evidence: readonly ReportEvidenceReference[];
  documentMetadata?: readonly DocumentMetadata[];
}): readonly ReportFinding[] {
  return input.decisionPlan.actions.map((action, index) => {
    const severity = severityFromAction(action);
    return {
      id: `finding.${action.type}`,
      category: input.type,
      titlePlaceholder: `${action.label} finding placeholder`,
      descriptionPlaceholder: `${action.description} No report prose is generated in this foundation pass.`,
      severity,
      priority: action.priority as ConstructionPriority,
      relatedEntities: relatedEntitiesForAction(input.type, input.reasoningPlan, input.documentMetadata || []),
      relatedDocumentReferences: (input.documentMetadata || []).map((metadata, metadataIndex) => metadata.sourceName || `document_metadata_${metadataIndex + 1}`),
      evidenceReferences: input.evidence.filter((evidence) => evidence.available).map((evidence) => evidence.id),
      decisionActionReferences: [action.id],
      confidencePlaceholder: {
        status: "placeholder",
        score: input.decisionPlan.confidence.score,
        rationale: "Finding confidence reuses the decision readiness placeholder. No semantic confidence is calculated."
      },
      status: index === 0 && input.decisionPlan.escalationRequired ? "under_review" : "planned"
    };
  });
}

function buildMissingInformation(decisionPlan: DecisionPlan): readonly ReportMissingInformation[] {
  return decisionPlan.missingInformation.map((requirement) => ({
    id: `missing.${requirement.id}`,
    label: requirement.label,
    required: requirement.required,
    source: "decision_requirement",
    sectionTypes: ["missing_information"],
    notes: requirement.notes
  }));
}

function buildApprovalRequirements(input: {
  type: ReportType;
  preferences: Required<ReportOutputPreferences>;
  decisionPlan: DecisionPlan;
}): readonly ReportApprovalRequirement[] {
  const requiresApproval =
    input.decisionPlan.escalationRequired ||
    ["contract_review_report", "risk_report", "safety_report", "compliance_report", "cost_report"].includes(input.type) ||
    input.preferences.audience === "authority" ||
    input.preferences.audience === "auditor";

  if (!requiresApproval) return [];

  return [
    {
      id: "approval.primary_review",
      label: "Primary review",
      state: "submitted",
      required: true,
      audience: input.preferences.audience,
      relatedSections: ["findings", "actions", "approvals"]
    }
  ];
}

function convertDecisionWarnings(warnings: readonly DecisionWarning[]): readonly ReportWarning[] {
  return warnings.map((warning) => ({
    code:
      warning.code === "missing_required_context"
        ? "invalid_request"
        : warning.code === "missing_evidence"
          ? "missing_required_evidence"
          : warning.code === "missing_document_metadata"
            ? "missing_required_evidence"
            : "incomplete_report_plan",
    message: warning.message,
    severity: warning.severity,
    source: "decision_plan"
  }));
}

export function calculateReportCompleteness(input: {
  sections: readonly ReportSection[];
  evidence: readonly ReportEvidenceReference[];
  missingInformation: readonly ReportMissingInformation[];
  warnings: readonly ReportWarning[];
  approvals: readonly ReportApprovalRequirement[];
  decisionPlan: DecisionPlan;
}): ReportCompleteness {
  const requiredSections = input.sections.filter((section) => section.required);
  const sectionScore = requiredSections.length ? (requiredSections.length / requiredSections.length) * 35 : 35;
  const evidenceScore = input.evidence.length ? (input.evidence.filter((item) => item.available).length / input.evidence.length) * 25 : 0;
  const missingPenalty = Math.min(25, input.missingInformation.filter((item) => item.required).length * 8);
  const warningPenalty = Math.min(20, input.warnings.filter((warning) => warning.severity !== "info").length * 6);
  const approvalPenalty = input.approvals.some((approval) => approval.required && approval.state !== "approved") ? 8 : 0;
  const confidenceScore = Math.min(15, (input.decisionPlan.confidence.score / 100) * 15);
  const structuralScore = Math.max(0, Math.min(100, Math.round(sectionScore + evidenceScore + confidenceScore + 25 - missingPenalty - warningPenalty - approvalPenalty)));
  const level = structuralScore >= 80 ? "ready" : structuralScore >= 45 ? "partial" : "incomplete";

  return {
    structuralScore,
    level,
    rationale: "Structural completeness is based on required sections, evidence availability, missing information, warnings, approval readiness, and decision confidence placeholders. It does not claim factual accuracy."
  };
}

export function validateReportPlan(plan: ReportPlan): ReportValidationResult {
  const errors: ReportError[] = [];
  const warnings: ReportWarning[] = [];
  const requiredSectionTypes: readonly ReportSectionType[] = ["title", "project_context", "scope", "findings", "missing_information", "actions", "conclusion"];

  for (const requiredSection of requiredSectionTypes) {
    if (!plan.sections.some((section) => section.type === requiredSection)) {
      errors.push({
        code: "missing_required_section",
        message: `Missing required report section: ${requiredSection}`,
        field: "sections"
      });
    }
  }

  if (plan.preferences.includeEvidence && !plan.evidence.some((evidence) => evidence.available)) {
    errors.push({
      code: "missing_required_evidence",
      message: "Evidence was requested, but no available evidence references were found.",
      field: "evidence"
    });
  }

  if (plan.completeness.level === "incomplete") {
    warnings.push({
      code: "incomplete_report_plan",
      message: "The report plan is structurally incomplete.",
      severity: "warning",
      source: "report_engine"
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function createReportPlan(request: ReportRequest): ReportPlan {
  const requestValidation = validateReportRequest(request);
  const createdAt = (request.now || new Date()).toISOString();
  const type = resolveReportType(request);
  const preferences = normalizePreferences(request.preferences, request.context);
  const reasoningPlan = request.reasoningPlan;
  const decisionPlan = request.decisionPlan;

  const baseEvidence: readonly ReportEvidenceReference[] = [
    ...(reasoningPlan?.evidence.map(reasoningEvidenceToReportEvidence) || []),
    ...(decisionPlan?.evidence.map(decisionEvidenceToReportEvidence) || [])
  ];
  const metadataEvidence: readonly ReportEvidenceReference[] = documentCategoriesFromMetadata(request.documentMetadata).map((category) => ({
    id: `report.document_metadata.${category}`,
    source: "document_metadata",
    label: `Document metadata category: ${category}`,
    available: true,
    sectionTypes: ["document_context", "evidence"],
    documentCategory: category,
    notes: "Derived from supplied document metadata only."
  }));
  const evidence = [...baseEvidence, ...metadataEvidence];
  const missingInformation = decisionPlan ? buildMissingInformation(decisionPlan) : [];
  const findings =
    reasoningPlan && decisionPlan
      ? rankReportFindings({
          type,
          reasoningPlan,
          decisionPlan,
          evidence,
          documentMetadata: request.documentMetadata
        })
      : [];
  const approvalRequirements = decisionPlan ? buildApprovalRequirements({ type, preferences, decisionPlan }) : [];
  const sections = buildReportSections({
    type,
    findings,
    evidence,
    missingInformation,
    actions: decisionPlan?.actions || [],
    preferences
  });
  const inheritedWarnings = [...requestValidation.warnings, ...(decisionPlan ? convertDecisionWarnings(decisionPlan.warnings) : [])];
  const completeness = decisionPlan
    ? calculateReportCompleteness({
        sections,
        evidence,
        missingInformation,
        warnings: inheritedWarnings,
        approvals: approvalRequirements,
        decisionPlan
      })
    : {
        structuralScore: 0,
        level: "incomplete" as const,
        rationale: "A decision plan is required before structural completeness can be calculated."
      };
  const preliminaryPlan: ReportPlan = {
    version: "1.0",
    id: createReportPlanId(type, createdAt),
    createdAt,
    type,
    title: reportTitles[type],
    preferences,
    sections,
    findings,
    evidence,
    warnings: inheritedWarnings,
    missingInformation,
    approvalRequirements,
    completeness,
    validation: requestValidation,
    result: {
      status: "not_rendered",
      reason: "architecture_only",
      outputFormat: preferences.outputFormat,
      summary: "Report plan prepared. No final prose, AI generation, provider call, PDF, DOCX, recommendation, or UI action was created."
    },
    inputSummary: {
      reasoningPlanId: reasoningPlan?.id,
      decisionPlanId: decisionPlan?.id,
      sectionCount: sections.length,
      findingCount: findings.length,
      evidenceCount: evidence.length,
      missingInformationCount: missingInformation.length
    }
  };
  const planValidation = validateReportPlan(preliminaryPlan);

  return deepFreeze({
    ...preliminaryPlan,
    warnings: [...preliminaryPlan.warnings, ...planValidation.warnings],
    validation: {
      valid: requestValidation.valid && planValidation.valid,
      errors: [...requestValidation.errors, ...planValidation.errors],
      warnings: [...requestValidation.warnings, ...planValidation.warnings]
    }
  });
}
