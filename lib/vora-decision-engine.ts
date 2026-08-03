import type { AiApplicationContext } from "@/lib/ai-context";
import type { MemorySnapshot } from "@/lib/ai-memory";
import type {
  ConstructionDocumentCategory,
  ConstructionEntityType,
  ConstructionKnowledgeRegistry
} from "@/lib/construction-knowledge";
import {
  constructionKnowledgeRegistry,
  getEntitiesForDocument,
  validateConstructionDocumentCategory
} from "@/lib/construction-knowledge";
import type { DocumentMetadata } from "@/lib/document-intelligence";
import type { ReasoningEvidence, ReasoningPlan, ReasoningType, ReasoningWarning } from "@/lib/vora-reasoning-engine";

export type DecisionType =
  | "document_review"
  | "contract_review"
  | "planning"
  | "risk_analysis"
  | "quality_review"
  | "safety_review"
  | "schedule_review"
  | "cost_review"
  | "compliance_review"
  | "general_assistance";

export type DecisionActionType =
  | "review_document"
  | "request_information"
  | "highlight_risks"
  | "verify_contract"
  | "generate_summary"
  | "prepare_report"
  | "identify_missing_data"
  | "validate_schedule"
  | "escalate_issue"
  | "no_action";

export type DecisionPriority = "low" | "medium" | "high" | "urgent";
export type DecisionConfidenceLevel = "placeholder" | "low" | "medium" | "high";
export type DecisionOutputType = "summary" | "report" | "checklist" | "review" | "action_plan" | "none";

export type DecisionRequirementType =
  | "application_context"
  | "memory_snapshot"
  | "construction_knowledge"
  | "document_metadata"
  | "project_selection"
  | "organization_selection"
  | "evidence"
  | "permission_context";

export type DecisionWarningCode =
  | "missing_required_context"
  | "missing_required_memory"
  | "missing_evidence"
  | "missing_document_metadata"
  | "permission_context_unavailable"
  | "reasoning_plan_not_executed"
  | "low_confidence_placeholder"
  | "unknown_decision_type";

export type DecisionAction = Readonly<{
  id: string;
  type: DecisionActionType;
  label: string;
  description: string;
  priority: DecisionPriority;
  rank: number;
  requiredEvidence: readonly string[];
  outputType: DecisionOutputType;
  escalationRequired: boolean;
}>;

export type DecisionConfidence = Readonly<{
  level: DecisionConfidenceLevel;
  score: number;
  rationale: string;
  placeholder: true;
}>;

export type DecisionRequirement = Readonly<{
  id: string;
  type: DecisionRequirementType;
  label: string;
  required: boolean;
  satisfied: boolean;
  source: "reasoning_plan" | "application_context" | "memory" | "construction_knowledge" | "document_metadata";
  notes?: string;
}>;

export type DecisionWarning = Readonly<{
  code: DecisionWarningCode;
  message: string;
  severity: "info" | "warning" | "critical";
  source?: string;
}>;

export type DecisionEvidencePlaceholder = Readonly<{
  id: string;
  source: ReasoningEvidence["source"] | "decision_engine";
  label: string;
  available: boolean;
  requiredForActions: readonly DecisionActionType[];
  notes?: string;
}>;

export type DecisionOutcomePlaceholder = Readonly<{
  status: "not_executed";
  outputType: DecisionOutputType;
  summary: string;
}>;

export type DecisionPlan = Readonly<{
  version: "1.0";
  id: string;
  createdAt: string;
  type: DecisionType;
  priority: DecisionPriority;
  confidence: DecisionConfidence;
  actions: readonly DecisionAction[];
  requirements: readonly DecisionRequirement[];
  warnings: readonly DecisionWarning[];
  evidence: readonly DecisionEvidencePlaceholder[];
  missingInformation: readonly DecisionRequirement[];
  escalationRequired: boolean;
  outcome: DecisionOutcomePlaceholder;
  inputSummary: Readonly<{
    reasoningPlanId: string;
    reasoningType: ReasoningType;
    actionCount: number;
    missingRequirementCount: number;
    warningCount: number;
  }>;
}>;

export type DecisionRequest = Readonly<{
  reasoningPlan: ReasoningPlan;
  constructionKnowledge?: ConstructionKnowledgeRegistry;
  documentMetadata?: readonly DocumentMetadata[];
  context?: AiApplicationContext;
  memory?: MemorySnapshot;
  now?: Date;
}>;

const decisionTypeByReasoningType: Record<ReasoningType, DecisionType> = {
  document_review: "document_review",
  contract_review: "contract_review",
  risk_review: "risk_analysis",
  planning: "planning",
  cost_review: "cost_review",
  quality_review: "quality_review",
  safety_review: "safety_review",
  schedule_review: "schedule_review",
  compliance_review: "compliance_review",
  general_assistance: "general_assistance"
};

const primaryActionsByDecisionType: Record<DecisionType, readonly DecisionActionType[]> = {
  document_review: ["review_document", "generate_summary", "identify_missing_data"],
  contract_review: ["verify_contract", "review_document", "identify_missing_data", "escalate_issue"],
  planning: ["prepare_report", "request_information", "generate_summary"],
  risk_analysis: ["highlight_risks", "escalate_issue", "prepare_report"],
  quality_review: ["review_document", "identify_missing_data", "prepare_report"],
  safety_review: ["highlight_risks", "escalate_issue", "prepare_report"],
  schedule_review: ["validate_schedule", "identify_missing_data", "prepare_report"],
  cost_review: ["review_document", "identify_missing_data", "prepare_report"],
  compliance_review: ["verify_contract", "review_document", "request_information"],
  general_assistance: ["generate_summary", "request_information", "no_action"]
};

const outputTypeByAction: Record<DecisionActionType, DecisionOutputType> = {
  review_document: "review",
  request_information: "checklist",
  highlight_risks: "action_plan",
  verify_contract: "review",
  generate_summary: "summary",
  prepare_report: "report",
  identify_missing_data: "checklist",
  validate_schedule: "review",
  escalate_issue: "action_plan",
  no_action: "none"
};

const actionLabels: Record<DecisionActionType, Readonly<{ label: string; description: string }>> = {
  review_document: {
    label: "Review document",
    description: "Prepare a future review workflow for supplied document metadata."
  },
  request_information: {
    label: "Request information",
    description: "Identify information that must be supplied before future execution."
  },
  highlight_risks: {
    label: "Highlight risks",
    description: "Prepare a future risk highlighting workflow from the reasoning plan."
  },
  verify_contract: {
    label: "Verify contract",
    description: "Prepare a future contract verification workflow."
  },
  generate_summary: {
    label: "Generate summary",
    description: "Select summary as the future output type without generating content."
  },
  prepare_report: {
    label: "Prepare report",
    description: "Prepare the report output path without creating a report."
  },
  identify_missing_data: {
    label: "Identify missing data",
    description: "Collect missing inputs and unavailable evidence into a structured requirement list."
  },
  validate_schedule: {
    label: "Validate schedule",
    description: "Prepare a future schedule validation workflow."
  },
  escalate_issue: {
    label: "Escalate issue",
    description: "Mark that human review may be required when severity or uncertainty is high."
  },
  no_action: {
    label: "No action",
    description: "No execution action is appropriate until more information is available."
  }
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

function createDecisionPlanId(type: DecisionType, createdAt: string) {
  return `decision_${type}_${createdAt.replace(/[^0-9]/g, "")}`;
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

function documentCategoriesFromReasoningPlan(plan: ReasoningPlan): readonly ConstructionDocumentCategory[] {
  return Array.from(new Set(plan.objectives.flatMap((objective) => objective.documentCategories))).sort();
}

function entitiesFromCategories(categories: readonly ConstructionDocumentCategory[]): readonly ConstructionEntityType[] {
  return Array.from(new Set(categories.flatMap((category) => getEntitiesForDocument(category).map((entity) => entity.type)))).sort();
}

function buildDecisionRequirements(request: DecisionRequest): readonly DecisionRequirement[] {
  const plan = request.reasoningPlan;
  const hasEvidence = plan.evidence.some((evidence) => evidence.available);
  const hasDocumentEvidence = plan.evidence.some((evidence) => evidence.source === "document_metadata" && evidence.available);
  const needsDocuments = ["document_review", "contract_review", "cost_review", "quality_review", "safety_review", "schedule_review", "compliance_review"].includes(
    plan.type
  );

  return [
    {
      id: "requirement.reasoning_plan",
      type: "evidence",
      label: "Reasoning plan",
      required: true,
      satisfied: Boolean(plan.id),
      source: "reasoning_plan"
    },
    {
      id: "requirement.application_context",
      type: "application_context",
      label: "Application context",
      required: true,
      satisfied: Boolean(request.context || plan.inputSummary.workspaceType),
      source: "application_context"
    },
    {
      id: "requirement.permission_context",
      type: "permission_context",
      label: "Permission context",
      required: true,
      satisfied: Boolean(request.context?.permissions || plan.inputSummary.workspaceType),
      source: "application_context"
    },
    {
      id: "requirement.memory_snapshot",
      type: "memory_snapshot",
      label: "Memory snapshot",
      required: false,
      satisfied: Boolean(request.memory),
      source: "memory"
    },
    {
      id: "requirement.construction_knowledge",
      type: "construction_knowledge",
      label: "Construction knowledge",
      required: true,
      satisfied: Boolean(request.constructionKnowledge || constructionKnowledgeRegistry),
      source: "construction_knowledge"
    },
    {
      id: "requirement.document_metadata",
      type: "document_metadata",
      label: "Document metadata",
      required: needsDocuments,
      satisfied: !needsDocuments || hasDocumentEvidence || Boolean(request.documentMetadata?.length),
      source: "document_metadata",
      notes: needsDocuments ? "This decision type benefits from supplied document metadata." : "Document metadata is optional for this decision type."
    },
    {
      id: "requirement.project_selection",
      type: "project_selection",
      label: "Project selection",
      required: ["planning", "risk_review", "cost_review", "quality_review", "safety_review", "schedule_review"].includes(plan.type),
      satisfied: Boolean(request.context?.selection.projectId || request.memory?.project.projectId || plan.inputSummary.entityType === "project"),
      source: "application_context"
    },
    {
      id: "requirement.evidence",
      type: "evidence",
      label: "Available evidence",
      required: true,
      satisfied: hasEvidence,
      source: "reasoning_plan"
    }
  ];
}

function convertReasoningWarnings(warnings: readonly ReasoningWarning[]): readonly DecisionWarning[] {
  return warnings.map((warning) => ({
    code:
      warning.code === "missing_context"
        ? "missing_required_context"
        : warning.code === "missing_memory"
          ? "missing_required_memory"
          : warning.code === "missing_document_metadata"
            ? "missing_document_metadata"
            : warning.code === "permission_context_unavailable"
              ? "permission_context_unavailable"
              : "missing_evidence",
    message: warning.message,
    severity: warning.severity === "warning" ? "warning" : "info",
    source: "reasoning_plan"
  }));
}

export function calculateDecisionPriority(input: {
  type: DecisionType;
  requirements?: readonly DecisionRequirement[];
  warnings?: readonly DecisionWarning[];
  evidence?: readonly DecisionEvidencePlaceholder[];
}): DecisionPriority {
  const missingRequiredCount = (input.requirements || []).filter((requirement) => requirement.required && !requirement.satisfied).length;
  const criticalWarningCount = (input.warnings || []).filter((warning) => warning.severity === "critical").length;
  const unavailableEvidenceCount = (input.evidence || []).filter((evidence) => !evidence.available).length;

  if (criticalWarningCount > 0 || input.type === "safety_review" || input.type === "risk_analysis") return "urgent";
  if (missingRequiredCount >= 2 || input.type === "contract_review" || input.type === "compliance_review") return "high";
  if (missingRequiredCount === 1 || unavailableEvidenceCount > 2 || input.type === "schedule_review" || input.type === "cost_review") return "medium";
  return "low";
}

export function calculateDecisionConfidence(input: {
  requirements: readonly DecisionRequirement[];
  evidence: readonly DecisionEvidencePlaceholder[];
  warnings: readonly DecisionWarning[];
}): DecisionConfidence {
  const required = input.requirements.filter((requirement) => requirement.required);
  const satisfiedRequired = required.filter((requirement) => requirement.satisfied).length;
  const availableEvidence = input.evidence.filter((evidence) => evidence.available).length;
  const warningPenalty = input.warnings.filter((warning) => warning.severity !== "info").length * 10;
  const requirementScore = required.length ? (satisfiedRequired / required.length) * 70 : 70;
  const evidenceScore = input.evidence.length ? (availableEvidence / input.evidence.length) * 30 : 0;
  const score = Math.max(0, Math.min(100, Math.round(requirementScore + evidenceScore - warningPenalty)));

  const level: DecisionConfidenceLevel = score >= 75 ? "high" : score >= 45 ? "medium" : score > 0 ? "low" : "placeholder";

  return {
    level,
    score,
    rationale: "Deterministic placeholder confidence based on requirement completeness, evidence availability, and warnings. No AI judgment is performed.",
    placeholder: true
  };
}

function buildDecisionEvidence(plan: ReasoningPlan, actionTypes: readonly DecisionActionType[]): readonly DecisionEvidencePlaceholder[] {
  return plan.evidence.map((evidence) => ({
    id: `decision.${evidence.id}`,
    source: evidence.source,
    label: evidence.label,
    available: evidence.available,
    requiredForActions: actionTypes,
    notes: evidence.notes
  }));
}

function requiredEvidenceForAction(action: DecisionActionType): readonly string[] {
  const requiredEvidence: Record<DecisionActionType, readonly string[]> = {
    review_document: ["document_metadata"],
    request_information: ["application_context", "user_request"],
    highlight_risks: ["construction_knowledge", "application_context"],
    verify_contract: ["document_metadata", "construction_knowledge"],
    generate_summary: ["user_request", "application_context"],
    prepare_report: ["application_context", "memory", "construction_knowledge"],
    identify_missing_data: ["application_context", "reasoning_plan"],
    validate_schedule: ["document_metadata", "construction_knowledge"],
    escalate_issue: ["application_context", "construction_knowledge"],
    no_action: []
  };

  return requiredEvidence[action];
}

export function rankDecisionActions(input: {
  type: DecisionType;
  priority: DecisionPriority;
  requirements: readonly DecisionRequirement[];
  evidence: readonly DecisionEvidencePlaceholder[];
}): readonly DecisionAction[] {
  const missingRequired = input.requirements.filter((requirement) => requirement.required && !requirement.satisfied);
  const baseActions = [...primaryActionsByDecisionType[input.type]];
  if (missingRequired.length > 0 && !baseActions.includes("identify_missing_data")) {
    baseActions.unshift("identify_missing_data");
  }
  if (missingRequired.some((requirement) => requirement.type === "application_context" || requirement.type === "document_metadata") && !baseActions.includes("request_information")) {
    baseActions.unshift("request_information");
  }

  const uniqueActions = Array.from(new Set(baseActions));

  return uniqueActions.map((actionType, index) => {
    const actionPriority = actionType === "escalate_issue" ? "urgent" : actionType === "request_information" || actionType === "identify_missing_data" ? "high" : input.priority;
    const actionInfo = actionLabels[actionType];
    return {
      id: `action.${actionType}`,
      type: actionType,
      label: actionInfo.label,
      description: actionInfo.description,
      priority: actionPriority,
      rank: index + 1,
      requiredEvidence: requiredEvidenceForAction(actionType),
      outputType: outputTypeByAction[actionType],
      escalationRequired: actionType === "escalate_issue" || actionPriority === "urgent"
    };
  });
}

export function validateDecisionPlan(plan: DecisionPlan): readonly DecisionWarning[] {
  const warnings: DecisionWarning[] = [];

  if (!plan.actions.length) {
    warnings.push({
      code: "unknown_decision_type",
      message: "Decision plan has no actions.",
      severity: "warning",
      source: "decision_plan"
    });
  }

  if (plan.requirements.some((requirement) => requirement.required && !requirement.satisfied)) {
    warnings.push({
      code: "missing_required_context",
      message: "One or more required decision inputs are missing.",
      severity: "warning",
      source: "decision_plan"
    });
  }

  if (!plan.evidence.some((evidence) => evidence.available)) {
    warnings.push({
      code: "missing_evidence",
      message: "No available evidence placeholders were found.",
      severity: "warning",
      source: "decision_plan"
    });
  }

  if (plan.confidence.score < 45) {
    warnings.push({
      code: "low_confidence_placeholder",
      message: "Decision confidence placeholder is low because required information or evidence is incomplete.",
      severity: "info",
      source: "decision_plan"
    });
  }

  return warnings;
}

function pickOutcomeType(actions: readonly DecisionAction[]): DecisionOutputType {
  const firstActionWithOutput = actions.find((action) => action.outputType !== "none");
  return firstActionWithOutput?.outputType || "none";
}

export function createDecisionPlan(request: DecisionRequest): DecisionPlan {
  const createdAt = (request.now || new Date()).toISOString();
  const decisionType = decisionTypeByReasoningType[request.reasoningPlan.type];
  const documentCategories = Array.from(
    new Set([...documentCategoriesFromReasoningPlan(request.reasoningPlan), ...documentCategoriesFromMetadata(request.documentMetadata)])
  ).sort();
  const entities = entitiesFromCategories(documentCategories);
  const requirements = buildDecisionRequirements(request);
  const inheritedWarnings = convertReasoningWarnings(request.reasoningPlan.warnings);
  const provisionalEvidence = buildDecisionEvidence(request.reasoningPlan, primaryActionsByDecisionType[decisionType]);
  const priority = calculateDecisionPriority({
    type: decisionType,
    requirements,
    warnings: inheritedWarnings,
    evidence: provisionalEvidence
  });
  const actions = rankDecisionActions({
    type: decisionType,
    priority,
    requirements,
    evidence: provisionalEvidence
  });
  const evidence = [
    ...provisionalEvidence,
    ...entities.map<DecisionEvidencePlaceholder>((entityType) => ({
      id: `decision.construction_entity.${entityType}`,
      source: "decision_engine",
      label: `Decision entity: ${entityType}`,
      available: Boolean((request.constructionKnowledge || constructionKnowledgeRegistry).entities[entityType]),
      requiredForActions: actions.map((action) => action.type),
      notes: "Derived from construction document categories and construction knowledge metadata."
    }))
  ];
  const confidence = calculateDecisionConfidence({ requirements, evidence, warnings: inheritedWarnings });
  const missingInformation = requirements.filter((requirement) => requirement.required && !requirement.satisfied);
  const outcomeType = pickOutcomeType(actions);
  const preliminaryPlan: DecisionPlan = {
    version: "1.0",
    id: createDecisionPlanId(decisionType, createdAt),
    createdAt,
    type: decisionType,
    priority,
    confidence,
    actions,
    requirements,
    warnings: inheritedWarnings,
    evidence,
    missingInformation,
    escalationRequired: actions.some((action) => action.escalationRequired) || priority === "urgent",
    outcome: {
      status: "not_executed",
      outputType: outcomeType,
      summary: "Decision plan prepared. No report, recommendation, AI execution, provider call, or UI action was performed."
    },
    inputSummary: {
      reasoningPlanId: request.reasoningPlan.id,
      reasoningType: request.reasoningPlan.type,
      actionCount: actions.length,
      missingRequirementCount: missingInformation.length,
      warningCount: inheritedWarnings.length
    }
  };

  const validationWarnings = validateDecisionPlan(preliminaryPlan);
  return deepFreeze({
    ...preliminaryPlan,
    warnings: [...preliminaryPlan.warnings, ...validationWarnings],
    inputSummary: {
      ...preliminaryPlan.inputSummary,
      warningCount: preliminaryPlan.warnings.length + validationWarnings.length
    }
  });
}
