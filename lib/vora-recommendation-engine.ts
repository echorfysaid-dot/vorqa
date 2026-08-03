import type {
  ConstructionEntityType,
  ConstructionKnowledgeRegistry,
  ConstructionPriority,
  ConstructionRiskSeverity,
  ConstructionStatus
} from "@/lib/construction-knowledge";
import { constructionKnowledgeRegistry } from "@/lib/construction-knowledge";
import type { DecisionAction, DecisionActionType, DecisionPlan, DecisionPriority } from "@/lib/vora-decision-engine";
import type { ReasoningPlan } from "@/lib/vora-reasoning-engine";
import type { ReportFinding, ReportPlan } from "@/lib/vora-report-engine";
import type { VoraRuntimeContext } from "@/lib/vora-intelligence-runtime";

export type RecommendationCategory =
  | "risk_mitigation"
  | "cost_optimization"
  | "schedule_improvement"
  | "quality_improvement"
  | "safety_improvement"
  | "compliance_action"
  | "documentation_action"
  | "planning_action"
  | "resource_action"
  | "general_recommendation";

export type RecommendationPriority = ConstructionPriority;
export type RecommendationRisk = ConstructionRiskSeverity;

export type RecommendationImpact = Readonly<{
  level: "low" | "medium" | "high" | "critical";
  score: number;
  rationale: string;
  placeholder: true;
}>;

export type RecommendationDependency = Readonly<{
  id: string;
  label: string;
  source: "decision_action" | "decision_requirement" | "reasoning_objective" | "report_section" | "runtime_context";
  required: boolean;
  satisfied: boolean;
}>;

export type RecommendationItem = Readonly<{
  id: string;
  category: RecommendationCategory;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  priority: RecommendationPriority;
  impact: RecommendationImpact;
  risk: RecommendationRisk;
  rank: number;
  status: ConstructionStatus;
  relatedDecisionActions: readonly string[];
  relatedReasoningObjectives: readonly string[];
  relatedReportFindings: readonly string[];
  relatedConstructionEntities: readonly ConstructionEntityType[];
  dependencies: readonly RecommendationDependency[];
  warnings: readonly RecommendationError[];
}>;

export type RecommendationErrorCode =
  | "invalid_request"
  | "missing_decision_plan"
  | "missing_reasoning_plan"
  | "missing_runtime_context"
  | "missing_report_plan"
  | "missing_dependency"
  | "empty_recommendation_plan"
  | "unknown_recommendation_error";

export type RecommendationError = Readonly<{
  code: RecommendationErrorCode;
  message: string;
  severity: "info" | "warning" | "critical";
  field?: string;
}>;

export type RecommendationValidationResult = Readonly<{
  valid: boolean;
  errors: readonly RecommendationError[];
  warnings: readonly RecommendationError[];
}>;

export type RecommendationResultPlaceholder = Readonly<{
  status: "not_generated";
  reason: "architecture_only";
  summary: string;
}>;

export type RecommendationPlan = Readonly<{
  version: "1.0";
  id: string;
  createdAt: string;
  items: readonly RecommendationItem[];
  grouped: Readonly<Record<RecommendationCategory, readonly string[]>>;
  validation: RecommendationValidationResult;
  result: RecommendationResultPlaceholder;
  inputSummary: Readonly<{
    decisionPlanId: string;
    reasoningPlanId?: string;
    reportPlanId?: string;
    recommendationCount: number;
    warningCount: number;
  }>;
}>;

export type RecommendationRequest = Readonly<{
  decisionPlan?: DecisionPlan;
  reasoningPlan?: ReasoningPlan;
  constructionKnowledge?: ConstructionKnowledgeRegistry;
  runtimeContext?: VoraRuntimeContext;
  reportPlan?: ReportPlan;
  now?: Date;
}>;

const categoryByDecisionType: Record<DecisionPlan["type"], RecommendationCategory> = {
  document_review: "documentation_action",
  contract_review: "compliance_action",
  planning: "planning_action",
  risk_analysis: "risk_mitigation",
  quality_review: "quality_improvement",
  safety_review: "safety_improvement",
  schedule_review: "schedule_improvement",
  cost_review: "cost_optimization",
  compliance_review: "compliance_action",
  general_assistance: "general_recommendation"
};

const categoryByActionType: Partial<Record<DecisionActionType, RecommendationCategory>> = {
  review_document: "documentation_action",
  request_information: "documentation_action",
  highlight_risks: "risk_mitigation",
  verify_contract: "compliance_action",
  generate_summary: "general_recommendation",
  prepare_report: "planning_action",
  identify_missing_data: "documentation_action",
  validate_schedule: "schedule_improvement",
  escalate_issue: "risk_mitigation",
  no_action: "general_recommendation"
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

function createRecommendationPlanId(createdAt: string) {
  return `recommendation_plan_${createdAt.replace(/[^0-9]/g, "")}`;
}

function priorityWeight(priority: DecisionPriority | RecommendationPriority): number {
  const weights: Record<RecommendationPriority, number> = {
    low: 10,
    medium: 20,
    high: 30,
    urgent: 40
  };
  return weights[priority];
}

export function calculateRecommendationPriority(input: {
  action: DecisionAction;
  decisionPlan: DecisionPlan;
  dependencies?: readonly RecommendationDependency[];
}): RecommendationPriority {
  const missingRequiredDependency = (input.dependencies || []).some((dependency) => dependency.required && !dependency.satisfied);
  if (input.action.escalationRequired || input.action.priority === "urgent" || input.decisionPlan.escalationRequired) return "urgent";
  if (missingRequiredDependency || input.action.priority === "high" || input.decisionPlan.priority === "high") return "high";
  if (input.action.priority === "medium" || input.decisionPlan.priority === "medium") return "medium";
  return "low";
}

export function calculateRecommendationImpact(input: {
  priority: RecommendationPriority;
  category: RecommendationCategory;
  decisionConfidenceScore: number;
  reportCompletenessScore?: number;
}): RecommendationImpact {
  const categoryBoost: Partial<Record<RecommendationCategory, number>> = {
    risk_mitigation: 20,
    safety_improvement: 20,
    compliance_action: 15,
    cost_optimization: 12,
    schedule_improvement: 12,
    quality_improvement: 10
  };
  const readinessScore = Math.round(((input.decisionConfidenceScore || 0) + (input.reportCompletenessScore || input.decisionConfidenceScore || 0)) / 2);
  const score = Math.max(0, Math.min(100, priorityWeight(input.priority) + (categoryBoost[input.category] || 5) + Math.round(readinessScore * 0.35)));
  const level: RecommendationImpact["level"] = score >= 85 ? "critical" : score >= 65 ? "high" : score >= 35 ? "medium" : "low";

  return {
    level,
    score,
    rationale: "Deterministic placeholder impact based on priority, category, decision confidence, and report completeness. No AI judgment is performed.",
    placeholder: true
  };
}

function riskFromPriority(priority: RecommendationPriority): RecommendationRisk {
  if (priority === "urgent") return "critical";
  if (priority === "high") return "high";
  if (priority === "medium") return "medium";
  return "low";
}

function entitiesForRecommendation(input: {
  action: DecisionAction;
  decisionPlan: DecisionPlan;
  reasoningPlan?: ReasoningPlan;
  reportFindings?: readonly ReportFinding[];
  knowledge: ConstructionKnowledgeRegistry;
}): readonly ConstructionEntityType[] {
  const reasoningEntities = input.reasoningPlan?.objectives.flatMap((objective) => objective.relatedEntities) || [];
  const reportEntities = input.reportFindings?.flatMap((finding) => finding.relatedEntities) || [];
  const actionEntities: Partial<Record<DecisionActionType, readonly ConstructionEntityType[]>> = {
    review_document: ["report", "drawing", "specification"],
    request_information: ["stakeholder", "project"],
    highlight_risks: ["risk", "issue"],
    verify_contract: ["contract", "payment", "variation"],
    prepare_report: ["report", "project"],
    identify_missing_data: ["project", "report", "specification"],
    validate_schedule: ["schedule", "milestone", "task"],
    escalate_issue: ["issue", "risk", "stakeholder"]
  };

  return Array.from(new Set([...(actionEntities[input.action.type] || []), ...reasoningEntities, ...reportEntities]))
    .filter((entity): entity is ConstructionEntityType => entity in input.knowledge.entities)
    .sort();
}

function dependenciesForAction(input: {
  action: DecisionAction;
  decisionPlan: DecisionPlan;
  reasoningPlan?: ReasoningPlan;
  reportPlan?: ReportPlan;
  runtimeContext?: VoraRuntimeContext;
}): readonly RecommendationDependency[] {
  return [
    {
      id: `dependency.${input.action.id}`,
      label: input.action.label,
      source: "decision_action",
      required: true,
      satisfied: true
    },
    ...input.decisionPlan.missingInformation.map((requirement) => ({
      id: `dependency.${requirement.id}`,
      label: requirement.label,
      source: "decision_requirement" as const,
      required: requirement.required,
      satisfied: requirement.satisfied
    })),
    ...(input.reasoningPlan?.objectives.slice(0, 3).map((objective) => ({
      id: `dependency.${objective.id}`,
      label: objective.label,
      source: "reasoning_objective" as const,
      required: false,
      satisfied: true
    })) || []),
    ...(input.reportPlan?.sections.slice(0, 3).map((section) => ({
      id: `dependency.${section.id}`,
      label: section.title,
      source: "report_section" as const,
      required: section.required,
      satisfied: true
    })) || []),
    {
      id: "dependency.runtime_context",
      label: "Runtime context",
      source: "runtime_context",
      required: false,
      satisfied: Boolean(input.runtimeContext)
    }
  ];
}

function warningForDependencies(dependencies: readonly RecommendationDependency[]): readonly RecommendationError[] {
  return dependencies
    .filter((dependency) => dependency.required && !dependency.satisfied)
    .map((dependency) => ({
      code: "missing_dependency" as const,
      message: `Missing required recommendation dependency: ${dependency.label}`,
      severity: "warning" as const,
      field: dependency.id
    }));
}

function createRecommendationItem(input: {
  action: DecisionAction;
  decisionPlan: DecisionPlan;
  reasoningPlan?: ReasoningPlan;
  reportPlan?: ReportPlan;
  runtimeContext?: VoraRuntimeContext;
  knowledge: ConstructionKnowledgeRegistry;
  rank: number;
}): RecommendationItem {
  const dependencies = dependenciesForAction(input);
  const category = categoryByActionType[input.action.type] || categoryByDecisionType[input.decisionPlan.type];
  const priority = calculateRecommendationPriority({ action: input.action, decisionPlan: input.decisionPlan, dependencies });
  const impact = calculateRecommendationImpact({
    priority,
    category,
    decisionConfidenceScore: input.decisionPlan.confidence.score,
    reportCompletenessScore: input.reportPlan?.completeness.structuralScore
  });

  return {
    id: `recommendation.${input.action.type}`,
    category,
    titlePlaceholder: `${input.action.label} recommendation placeholder`,
    descriptionPlaceholder: `${input.action.description} No recommendation prose is generated in this foundation pass.`,
    priority,
    impact,
    risk: riskFromPriority(priority),
    rank: input.rank,
    status: input.action.type === "no_action" ? "archived" : "planned",
    relatedDecisionActions: [input.action.id],
    relatedReasoningObjectives: input.reasoningPlan?.objectives.map((objective) => objective.id) || [],
    relatedReportFindings: input.reportPlan?.findings.map((finding) => finding.id) || [],
    relatedConstructionEntities: entitiesForRecommendation({
      action: input.action,
      decisionPlan: input.decisionPlan,
      reasoningPlan: input.reasoningPlan,
      reportFindings: input.reportPlan?.findings,
      knowledge: input.knowledge
    }),
    dependencies,
    warnings: warningForDependencies(dependencies)
  };
}

export function rankRecommendations(items: readonly RecommendationItem[]): readonly RecommendationItem[] {
  return [...items]
    .sort((left, right) => {
      const priorityDelta = priorityWeight(right.priority) - priorityWeight(left.priority);
      if (priorityDelta !== 0) return priorityDelta;
      const impactDelta = right.impact.score - left.impact.score;
      if (impactDelta !== 0) return impactDelta;
      return left.id.localeCompare(right.id);
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function groupRecommendations(items: readonly RecommendationItem[]): Readonly<Record<RecommendationCategory, readonly string[]>> {
  return deepFreeze({
    risk_mitigation: items.filter((item) => item.category === "risk_mitigation").map((item) => item.id),
    cost_optimization: items.filter((item) => item.category === "cost_optimization").map((item) => item.id),
    schedule_improvement: items.filter((item) => item.category === "schedule_improvement").map((item) => item.id),
    quality_improvement: items.filter((item) => item.category === "quality_improvement").map((item) => item.id),
    safety_improvement: items.filter((item) => item.category === "safety_improvement").map((item) => item.id),
    compliance_action: items.filter((item) => item.category === "compliance_action").map((item) => item.id),
    documentation_action: items.filter((item) => item.category === "documentation_action").map((item) => item.id),
    planning_action: items.filter((item) => item.category === "planning_action").map((item) => item.id),
    resource_action: items.filter((item) => item.category === "resource_action").map((item) => item.id),
    general_recommendation: items.filter((item) => item.category === "general_recommendation").map((item) => item.id)
  });
}

export function validateRecommendationPlan(plan: RecommendationPlan): RecommendationValidationResult {
  const errors: RecommendationError[] = [];
  const warnings: RecommendationError[] = [];

  if (!plan.items.length) {
    errors.push({
      code: "empty_recommendation_plan",
      message: "Recommendation plan has no items.",
      severity: "warning"
    });
  }

  for (const item of plan.items) {
    warnings.push(...item.warnings);
    if (!item.relatedDecisionActions.length) {
      warnings.push({
        code: "invalid_request",
        message: `Recommendation item ${item.id} is not linked to a decision action.`,
        severity: "warning",
        field: item.id
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateRecommendationRequest(request: RecommendationRequest): RecommendationValidationResult {
  const errors: RecommendationError[] = [];
  const warnings: RecommendationError[] = [];

  if (!request.decisionPlan) {
    errors.push({
      code: "missing_decision_plan",
      message: "A decision plan is required to create recommendations.",
      severity: "critical",
      field: "decisionPlan"
    });
  }

  if (!request.reasoningPlan) {
    warnings.push({
      code: "missing_reasoning_plan",
      message: "Reasoning plan is missing. Recommendation links to reasoning objectives will be unavailable.",
      severity: "info",
      field: "reasoningPlan"
    });
  }

  if (!request.reportPlan) {
    warnings.push({
      code: "missing_report_plan",
      message: "Report plan is missing. Recommendation links to report findings will be unavailable.",
      severity: "info",
      field: "reportPlan"
    });
  }

  if (!request.runtimeContext) {
    warnings.push({
      code: "missing_runtime_context",
      message: "Runtime context is missing. Context-aware recommendation dependencies will remain placeholders.",
      severity: "info",
      field: "runtimeContext"
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function createRecommendationPlan(request: RecommendationRequest): RecommendationPlan {
  const createdAt = (request.now || new Date()).toISOString();
  const requestValidation = validateRecommendationRequest(request);
  const decisionPlan = request.decisionPlan;
  const knowledge = request.constructionKnowledge || request.runtimeContext?.constructionKnowledge || constructionKnowledgeRegistry;
  const items = decisionPlan
    ? rankRecommendations(
        decisionPlan.actions.map((action, index) =>
          createRecommendationItem({
            action,
            decisionPlan,
            reasoningPlan: request.reasoningPlan,
            reportPlan: request.reportPlan,
            runtimeContext: request.runtimeContext,
            knowledge,
            rank: index + 1
          })
        )
      )
    : [];
  const grouped = groupRecommendations(items);
  const preliminaryPlan: RecommendationPlan = {
    version: "1.0",
    id: `recommendation_plan_${createdAt.replace(/[^0-9]/g, "")}`,
    createdAt,
    items,
    grouped,
    validation: requestValidation,
    result: {
      status: "not_generated",
      reason: "architecture_only",
      summary: "Recommendation plan prepared. No natural-language recommendations, AI execution, prompt execution, persistence, API, or UI action was performed."
    },
    inputSummary: {
      decisionPlanId: decisionPlan?.id || "missing_decision_plan",
      reasoningPlanId: request.reasoningPlan?.id,
      reportPlanId: request.reportPlan?.id,
      recommendationCount: items.length,
      warningCount: requestValidation.warnings.length
    }
  };
  const planValidation = validateRecommendationPlan(preliminaryPlan);

  return deepFreeze({
    ...preliminaryPlan,
    validation: {
      valid: requestValidation.valid && planValidation.valid,
      errors: [...requestValidation.errors, ...planValidation.errors],
      warnings: [...requestValidation.warnings, ...planValidation.warnings]
    },
    inputSummary: {
      ...preliminaryPlan.inputSummary,
      warningCount: requestValidation.warnings.length + planValidation.warnings.length
    }
  });
}
