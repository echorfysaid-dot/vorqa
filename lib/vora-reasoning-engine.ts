import type { AiApplicationContext } from "@/lib/ai-context";
import type { MemorySnapshot } from "@/lib/ai-memory";
import type { AiTaskIntent } from "@/lib/ai-prompt-builder";
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
import type { DocumentDescriptor, DocumentMetadata } from "@/lib/document-intelligence";

export type ReasoningType =
  | "document_review"
  | "contract_review"
  | "risk_review"
  | "planning"
  | "cost_review"
  | "quality_review"
  | "safety_review"
  | "schedule_review"
  | "compliance_review"
  | "general_assistance";

export type ReasoningStepType =
  | "understand_request"
  | "inspect_context"
  | "inspect_memory"
  | "inspect_construction_knowledge"
  | "inspect_documents"
  | "identify_relevant_entities"
  | "prepare_evidence_placeholders"
  | "prepare_warnings"
  | "prepare_future_reasoning";

export type ReasoningConstraintType =
  | "no_ai_execution"
  | "no_document_parsing"
  | "no_external_lookup"
  | "read_only_context"
  | "preserve_user_request"
  | "respect_permissions"
  | "context_isolation";

export type ReasoningWarningCode =
  | "empty_user_request"
  | "missing_context"
  | "missing_memory"
  | "missing_document_metadata"
  | "unsupported_document_category"
  | "ambiguous_reasoning_type"
  | "permission_context_unavailable";

export type ReasoningConfidencePlaceholder = Readonly<{
  status: "placeholder";
  score: null;
  rationale: string;
}>;

export type ReasoningEvidence = Readonly<{
  id: string;
  source: "application_context" | "memory" | "construction_knowledge" | "document_metadata" | "user_request";
  label: string;
  entityType?: ConstructionEntityType;
  documentCategory?: ConstructionDocumentCategory;
  available: boolean;
  notes?: string;
}>;

export type ReasoningObjective = Readonly<{
  id: string;
  type: ReasoningType;
  label: string;
  description: string;
  priority: number;
  relatedEntities: readonly ConstructionEntityType[];
  documentCategories: readonly ConstructionDocumentCategory[];
}>;

export type ReasoningConstraint = Readonly<{
  id: ReasoningConstraintType;
  label: string;
  description: string;
  required: boolean;
}>;

export type ReasoningWarning = Readonly<{
  code: ReasoningWarningCode;
  message: string;
  severity: "info" | "warning";
  field?: string;
}>;

export type ReasoningStep = Readonly<{
  id: string;
  type: ReasoningStepType;
  label: string;
  description: string;
  order: number;
  requiredInputs: readonly string[];
  produces: readonly string[];
}>;

export type ReasoningResultPlaceholder = Readonly<{
  status: "not_executed";
  reason: "architecture_only";
  summary: string;
}>;

export type ReasoningRequest = Readonly<{
  context?: AiApplicationContext;
  memory?: MemorySnapshot;
  constructionKnowledge?: ConstructionKnowledgeRegistry;
  documentMetadata?: readonly DocumentMetadata[];
  documents?: readonly DocumentDescriptor[];
  taskIntent?: AiTaskIntent;
  reasoningType?: ReasoningType;
  userRequest: string;
  now?: Date;
}>;

export type ReasoningPlan = Readonly<{
  version: "1.0";
  id: string;
  createdAt: string;
  type: ReasoningType;
  taskIntent: AiTaskIntent;
  objectives: readonly ReasoningObjective[];
  steps: readonly ReasoningStep[];
  constraints: readonly ReasoningConstraint[];
  evidence: readonly ReasoningEvidence[];
  warnings: readonly ReasoningWarning[];
  confidence: ReasoningConfidencePlaceholder;
  result: ReasoningResultPlaceholder;
  inputSummary: Readonly<{
    workspaceType?: string;
    entityType?: string;
    documentCount: number;
    documentMetadataCount: number;
    userRequestLength: number;
  }>;
}>;

const reasoningTypeByIntent: Partial<Record<AiTaskIntent, ReasoningType>> = {
  summarize: "document_review",
  analyze: "risk_review",
  generate_report: "general_assistance",
  extract_actions: "planning",
  explain: "general_assistance",
  compare: "cost_review",
  plan: "planning",
  general_assistance: "general_assistance"
};

const defaultConstraints: readonly ReasoningConstraint[] = [
  {
    id: "no_ai_execution",
    label: "No AI execution",
    description: "The reasoning engine foundation prepares plans only and never calls an AI provider.",
    required: true
  },
  {
    id: "no_document_parsing",
    label: "No document parsing",
    description: "Document inputs are treated as descriptors and metadata only.",
    required: true
  },
  {
    id: "no_external_lookup",
    label: "No external lookup",
    description: "The plan is created from supplied application context, memory, construction knowledge, and metadata.",
    required: true
  },
  {
    id: "read_only_context",
    label: "Read-only context",
    description: "The planner does not mutate application context, memory snapshots, repositories, or user data.",
    required: true
  },
  {
    id: "preserve_user_request",
    label: "Preserve user request",
    description: "User text is carried as untrusted intent context and cannot override planning constraints.",
    required: true
  },
  {
    id: "respect_permissions",
    label: "Respect permission context",
    description: "Future reasoning execution must respect permission metadata already present in the AI application context.",
    required: true
  },
  {
    id: "context_isolation",
    label: "Context isolation",
    description: "Trusted application state, memory, construction knowledge, and user input remain separate planning inputs.",
    required: true
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

function createPlanId(type: ReasoningType, createdAt: string) {
  return `reasoning_${type}_${createdAt.replace(/[^0-9]/g, "")}`;
}

function normalizeUserRequest(userRequest: string) {
  return userRequest.trim();
}

function inferReasoningType(request: Pick<ReasoningRequest, "reasoningType" | "taskIntent" | "documents" | "documentMetadata">): ReasoningType {
  if (request.reasoningType) return request.reasoningType;
  const documentCategories = inferDocumentCategories(request.documents, request.documentMetadata);

  if (documentCategories.includes("contract")) return "contract_review";
  if (documentCategories.includes("risk_register")) return "risk_review";
  if (documentCategories.includes("schedule")) return "schedule_review";
  if (documentCategories.includes("invoice") || documentCategories.includes("payment_certificate") || documentCategories.includes("boq")) {
    return "cost_review";
  }
  if (documentCategories.includes("safety_report") || documentCategories.includes("method_statement")) return "safety_review";
  if (documentCategories.includes("quality_report") || documentCategories.includes("inspection_report")) return "quality_review";
  if (documentCategories.includes("permit") || documentCategories.includes("specification")) return "compliance_review";
  if (request.taskIntent) {
    const mappedReasoningType = reasoningTypeByIntent[request.taskIntent];
    if (mappedReasoningType) return mappedReasoningType;
  }
  return "general_assistance";
}

function inferDocumentCategories(
  documents: readonly DocumentDescriptor[] = [],
  documentMetadata: readonly DocumentMetadata[] = []
): readonly ConstructionDocumentCategory[] {
  const categories = [
    ...documents.map((document) => document.metadata?.category),
    ...documentMetadata.map((metadata) => metadata.category)
  ]
    .filter((category): category is string => Boolean(category))
    .filter(validateConstructionDocumentCategory);

  return Array.from(new Set(categories)).sort();
}

function entitiesForReasoningType(type: ReasoningType): readonly ConstructionEntityType[] {
  const entitiesByType: Record<ReasoningType, readonly ConstructionEntityType[]> = {
    document_review: ["report", "specification", "drawing"],
    contract_review: ["contract", "stakeholder", "payment", "variation", "change_order"],
    risk_review: ["risk", "issue", "task", "milestone", "schedule"],
    planning: ["project", "activity", "task", "milestone", "resource"],
    cost_review: ["boq", "cost_item", "invoice", "payment", "material"],
    quality_review: ["quality_control", "inspection", "observation", "specification"],
    safety_review: ["safety", "inspection", "risk", "issue"],
    schedule_review: ["schedule", "milestone", "task", "activity"],
    compliance_review: ["permit", "regulation", "contract", "specification"],
    general_assistance: ["project", "task", "report", "stakeholder"]
  };

  return entitiesByType[type];
}

function documentCategoriesForReasoningType(type: ReasoningType): readonly ConstructionDocumentCategory[] {
  const categoriesByType: Record<ReasoningType, readonly ConstructionDocumentCategory[]> = {
    document_review: ["progress_report", "meeting_minutes", "specification"],
    contract_review: ["contract", "change_order", "variation_order", "payment_certificate"],
    risk_review: ["risk_register", "progress_report", "inspection_report"],
    planning: ["schedule", "meeting_minutes", "progress_report"],
    cost_review: ["boq", "invoice", "payment_certificate", "change_order"],
    quality_review: ["quality_report", "inspection_report", "material_submittal", "specification"],
    safety_review: ["safety_report", "method_statement", "inspection_report"],
    schedule_review: ["schedule", "progress_report", "meeting_minutes"],
    compliance_review: ["permit", "specification", "contract", "inspection_report"],
    general_assistance: ["progress_report", "meeting_minutes", "other"]
  };

  return categoriesByType[type];
}

export function validateReasoningRequest(request: ReasoningRequest): readonly ReasoningWarning[] {
  const warnings: ReasoningWarning[] = [];

  if (!normalizeUserRequest(request.userRequest)) {
    warnings.push({
      code: "empty_user_request",
      message: "The user request is empty. The plan can only prepare generic reasoning objectives.",
      severity: "warning",
      field: "userRequest"
    });
  }

  if (!request.context) {
    warnings.push({
      code: "missing_context",
      message: "AI application context is missing.",
      severity: "warning",
      field: "context"
    });
  } else if (!request.context.permissions) {
    warnings.push({
      code: "permission_context_unavailable",
      message: "Permission context is unavailable.",
      severity: "warning",
      field: "context.permissions"
    });
  }

  if (!request.memory) {
    warnings.push({
      code: "missing_memory",
      message: "AI memory snapshot is missing.",
      severity: "info",
      field: "memory"
    });
  }

  const categories = [
    ...(request.documents || []).map((document) => document.metadata?.category),
    ...(request.documentMetadata || []).map((metadata) => metadata.category)
  ].filter((category): category is string => Boolean(category));

  for (const category of categories) {
    if (!validateConstructionDocumentCategory(category)) {
      warnings.push({
        code: "unsupported_document_category",
        message: `Unsupported construction document category: ${category}`,
        severity: "info",
        field: "documentMetadata.category"
      });
    }
  }

  if ((request.documents?.length || 0) > 0 && !request.documents?.some((document) => document.metadata)) {
    warnings.push({
      code: "missing_document_metadata",
      message: "Document descriptors were supplied without metadata.",
      severity: "info",
      field: "documents.metadata"
    });
  }

  if (!request.reasoningType && !request.taskIntent) {
    warnings.push({
      code: "ambiguous_reasoning_type",
      message: "No explicit reasoning type or task intent was supplied. The planner will use general assistance unless document metadata suggests a better type.",
      severity: "info",
      field: "reasoningType"
    });
  }

  return warnings;
}

export function rankReasoningObjectives(input: {
  type: ReasoningType;
  documentCategories?: readonly ConstructionDocumentCategory[];
  knowledge?: ConstructionKnowledgeRegistry;
}): readonly ReasoningObjective[] {
  const categories = input.documentCategories?.length ? [...input.documentCategories] : [...documentCategoriesForReasoningType(input.type)];
  const categoryEntities = categories.flatMap((category) => getEntitiesForDocument(category).map((entity) => entity.type));
  const relatedEntities = Array.from(new Set([...entitiesForReasoningType(input.type), ...categoryEntities])).sort();

  const objectives: ReasoningObjective[] = [
    {
      id: `${input.type}.understand_scope`,
      type: input.type,
      label: "Understand scope",
      description: "Identify the intended review scope from the user request and trusted application context.",
      priority: 1,
      relatedEntities,
      documentCategories: categories
    },
    {
      id: `${input.type}.map_relevant_entities`,
      type: input.type,
      label: "Map relevant construction entities",
      description: "Use construction knowledge metadata to identify the project concepts that future reasoning should inspect.",
      priority: 2,
      relatedEntities,
      documentCategories: categories
    },
    {
      id: `${input.type}.prepare_evidence`,
      type: input.type,
      label: "Prepare evidence placeholders",
      description: "Define where future reasoning should attach source evidence without performing analysis in this pass.",
      priority: 3,
      relatedEntities,
      documentCategories: categories
    }
  ];

  return objectives.sort((left, right) => left.priority - right.priority);
}

export function buildReasoningSteps(request: ReasoningRequest, objectives: readonly ReasoningObjective[]): readonly ReasoningStep[] {
  const hasDocuments = Boolean(request.documents?.length || request.documentMetadata?.length);
  const objectiveIds = objectives.map((objective) => objective.id);
  const steps: ReasoningStep[] = [
    {
      id: "step.understand_request",
      type: "understand_request",
      label: "Understand user request",
      description: "Preserve the user request as untrusted input and identify its requested outcome.",
      order: 1,
      requiredInputs: ["userRequest"],
      produces: ["request_scope"]
    },
    {
      id: "step.inspect_context",
      type: "inspect_context",
      label: "Inspect application context",
      description: "Read workspace, route, selected entity, permissions, language, and theme from the AI context.",
      order: 2,
      requiredInputs: ["context"],
      produces: ["context_summary"]
    },
    {
      id: "step.inspect_memory",
      type: "inspect_memory",
      label: "Inspect memory snapshot",
      description: "Read immutable application memory for current project, organization, selection, preferences, and session.",
      order: 3,
      requiredInputs: ["memory"],
      produces: ["memory_summary"]
    },
    {
      id: "step.inspect_construction_knowledge",
      type: "inspect_construction_knowledge",
      label: "Inspect construction knowledge",
      description: "Resolve relevant construction entities, document categories, classifications, and relationships.",
      order: 4,
      requiredInputs: ["constructionKnowledge"],
      produces: ["construction_scope"]
    },
    {
      id: "step.identify_relevant_entities",
      type: "identify_relevant_entities",
      label: "Identify relevant entities",
      description: "Connect objectives to construction entities and document categories for future reasoning.",
      order: 5,
      requiredInputs: objectiveIds,
      produces: ["entity_map"]
    },
    {
      id: "step.prepare_evidence_placeholders",
      type: "prepare_evidence_placeholders",
      label: "Prepare evidence placeholders",
      description: "Prepare evidence slots without parsing documents or performing AI analysis.",
      order: hasDocuments ? 7 : 6,
      requiredInputs: hasDocuments ? ["documents", "documentMetadata"] : ["context", "memory"],
      produces: ["evidence_placeholders"]
    },
    {
      id: "step.prepare_warnings",
      type: "prepare_warnings",
      label: "Prepare warnings",
      description: "Carry validation and readiness warnings into the plan.",
      order: hasDocuments ? 8 : 7,
      requiredInputs: ["validation"],
      produces: ["reasoning_warnings"]
    },
    {
      id: "step.prepare_future_reasoning",
      type: "prepare_future_reasoning",
      label: "Prepare future reasoning execution",
      description: "Return a plan that can later be passed to prompt, provider, report, or recommendation layers.",
      order: hasDocuments ? 9 : 8,
      requiredInputs: ["request_scope", "context_summary", "memory_summary", "construction_scope"],
      produces: ["reasoning_plan"]
    }
  ];

  if (hasDocuments) {
    steps.splice(5, 0, {
      id: "step.inspect_documents",
      type: "inspect_documents",
      label: "Inspect document metadata",
      description: "Use supplied document metadata only. No parsing, OCR, or extraction is performed.",
      order: 6,
      requiredInputs: ["documents", "documentMetadata"],
      produces: ["document_metadata_summary"]
    });
  }

  return steps.sort((left, right) => left.order - right.order);
}

function buildEvidencePlaceholders(request: ReasoningRequest, type: ReasoningType): readonly ReasoningEvidence[] {
  const documentCategories = inferDocumentCategories(request.documents, request.documentMetadata);
  const categoryEvidence = documentCategories.map<ReasoningEvidence>((category) => ({
    id: `evidence.document_category.${category}`,
    source: "document_metadata",
    label: `Document category: ${category}`,
    documentCategory: category,
    available: true,
    notes: "Category was supplied as metadata. No document content was parsed."
  }));

  const entityEvidence = Array.from(
    new Set([...entitiesForReasoningType(type), ...documentCategories.flatMap((category) => getEntitiesForDocument(category).map((entity) => entity.type))])
  )
    .sort()
    .map<ReasoningEvidence>((entityType) => ({
      id: `evidence.construction_entity.${entityType}`,
      source: "construction_knowledge",
      label: `Construction entity: ${entityType}`,
      entityType,
      available: Boolean(constructionKnowledgeRegistry.entities[entityType]),
      notes: "Entity metadata is available from the construction knowledge registry."
    }));

  return [
    {
      id: "evidence.application_context",
      source: "application_context",
      label: "Application context",
      available: Boolean(request.context),
      notes: "Trusted route, workspace, selection, language, theme, and permission metadata."
    },
    {
      id: "evidence.memory_snapshot",
      source: "memory",
      label: "Memory snapshot",
      available: Boolean(request.memory),
      notes: "Immutable application memory snapshot."
    },
    {
      id: "evidence.user_request",
      source: "user_request",
      label: "User request",
      available: normalizeUserRequest(request.userRequest).length > 0,
      notes: "Untrusted user-provided request text."
    },
    ...categoryEvidence,
    ...entityEvidence
  ];
}

export function createReasoningPlan(request: ReasoningRequest): ReasoningPlan {
  const createdAt = (request.now || new Date()).toISOString();
  const taskIntent = request.taskIntent || "general_assistance";
  const type = inferReasoningType(request);
  const documentCategories = inferDocumentCategories(request.documents, request.documentMetadata);
  const objectives = rankReasoningObjectives({
    type,
    documentCategories,
    knowledge: request.constructionKnowledge || constructionKnowledgeRegistry
  });
  const warnings = validateReasoningRequest(request);
  const steps = buildReasoningSteps(request, objectives);
  const evidence = buildEvidencePlaceholders(request, type);

  return deepFreeze({
    version: "1.0",
    id: createPlanId(type, createdAt),
    createdAt,
    type,
    taskIntent,
    objectives,
    steps,
    constraints: defaultConstraints,
    evidence,
    warnings,
    confidence: {
      status: "placeholder",
      score: null,
      rationale: "Confidence scoring is reserved for a future reasoning execution pass."
    },
    result: {
      status: "not_executed",
      reason: "architecture_only",
      summary: "Reasoning plan prepared. No AI reasoning, document parsing, recommendations, or reports were executed."
    },
    inputSummary: {
      workspaceType: request.context?.workspace.type,
      entityType: request.context?.entity.type,
      documentCount: request.documents?.length || 0,
      documentMetadataCount: request.documentMetadata?.length || 0,
      userRequestLength: normalizeUserRequest(request.userRequest).length
    }
  });
}
