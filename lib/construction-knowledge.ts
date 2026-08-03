import type { DocumentType } from "@/lib/document-intelligence";

export type ConstructionEntityType =
  | "project"
  | "building"
  | "site"
  | "zone"
  | "level"
  | "room"
  | "discipline"
  | "trade"
  | "activity"
  | "task"
  | "milestone"
  | "material"
  | "equipment"
  | "resource"
  | "risk"
  | "issue"
  | "observation"
  | "inspection"
  | "quality_control"
  | "safety"
  | "contract"
  | "boq"
  | "specification"
  | "drawing"
  | "meeting"
  | "report"
  | "change_order"
  | "variation"
  | "payment"
  | "invoice"
  | "cost_item"
  | "schedule"
  | "permit"
  | "regulation"
  | "stakeholder";

export type ConstructionDocumentCategory =
  | "architectural_drawing"
  | "structural_drawing"
  | "mep_drawing"
  | "shop_drawing"
  | "as_built_drawing"
  | "boq"
  | "specification"
  | "contract"
  | "permit"
  | "inspection_report"
  | "quality_report"
  | "safety_report"
  | "meeting_minutes"
  | "progress_report"
  | "invoice"
  | "payment_certificate"
  | "change_order"
  | "variation_order"
  | "schedule"
  | "risk_register"
  | "material_submittal"
  | "method_statement"
  | "other";

export type ConstructionPhase =
  | "idea"
  | "feasibility"
  | "concept_design"
  | "design_development"
  | "permitting"
  | "procurement"
  | "mobilization"
  | "construction"
  | "quality_control"
  | "handover"
  | "operations"
  | "closeout";

export type ProjectLifecycleStage =
  | "initiation"
  | "planning"
  | "design"
  | "tendering"
  | "execution"
  | "monitoring"
  | "handover"
  | "closed";

export type ConstructionDiscipline =
  | "architecture"
  | "civil"
  | "structural"
  | "mep"
  | "electrical"
  | "mechanical"
  | "plumbing"
  | "hvac"
  | "interior"
  | "landscape"
  | "geotechnical"
  | "surveying"
  | "procurement"
  | "logistics"
  | "quality"
  | "safety"
  | "finance"
  | "contracts"
  | "project_management";

export type ConstructionRiskSeverity = "low" | "medium" | "high" | "critical";
export type ConstructionPriority = "low" | "medium" | "high" | "urgent";
export type ConstructionStatus = "not_started" | "planned" | "in_progress" | "blocked" | "under_review" | "approved" | "completed" | "archived";
export type ConstructionApprovalState = "draft" | "submitted" | "under_review" | "revise_and_resubmit" | "approved" | "rejected" | "void";

export type ConstructionRelationshipType =
  | "contains"
  | "belongs_to"
  | "depends_on"
  | "produces"
  | "references"
  | "requires_approval"
  | "assigned_to"
  | "impacts"
  | "mitigates"
  | "documents"
  | "costs"
  | "scheduled_by";

export type ConstructionReasoningMetadata = Readonly<{
  reasoningReady: boolean;
  futureSignals: readonly string[];
  notes?: string;
}>;

export type ConstructionEntityDescriptor = Readonly<{
  type: ConstructionEntityType;
  label: string;
  description: string;
  commonAliases: readonly string[];
  relatedDocumentCategories: readonly ConstructionDocumentCategory[];
  defaultPhase?: ConstructionPhase;
  defaultDiscipline?: ConstructionDiscipline;
  reasoning: ConstructionReasoningMetadata;
}>;

export type ConstructionClassificationDescriptor<T extends string> = Readonly<{
  id: T;
  label: string;
  description: string;
  order: number;
}>;

export type ConstructionEntityRelationship = Readonly<{
  from: ConstructionEntityType;
  to: ConstructionEntityType;
  type: ConstructionRelationshipType;
  description: string;
}>;

export type ConstructionDocumentCategoryDescriptor = ConstructionClassificationDescriptor<ConstructionDocumentCategory> &
  Readonly<{
    documentTypes: readonly DocumentType[];
    primaryEntities: readonly ConstructionEntityType[];
    typicalPhases: readonly ConstructionPhase[];
  }>;

export type ConstructionKnowledgeRegistry = Readonly<{
  entities: Readonly<Record<ConstructionEntityType, ConstructionEntityDescriptor>>;
  documentCategories: Readonly<Record<ConstructionDocumentCategory, ConstructionDocumentCategoryDescriptor>>;
  phases: Readonly<Record<ConstructionPhase, ConstructionClassificationDescriptor<ConstructionPhase>>>;
  lifecycle: Readonly<Record<ProjectLifecycleStage, ConstructionClassificationDescriptor<ProjectLifecycleStage>>>;
  disciplines: Readonly<Record<ConstructionDiscipline, ConstructionClassificationDescriptor<ConstructionDiscipline>>>;
  riskSeverities: Readonly<Record<ConstructionRiskSeverity, ConstructionClassificationDescriptor<ConstructionRiskSeverity>>>;
  priorities: Readonly<Record<ConstructionPriority, ConstructionClassificationDescriptor<ConstructionPriority>>>;
  statuses: Readonly<Record<ConstructionStatus, ConstructionClassificationDescriptor<ConstructionStatus>>>;
  approvalStates: Readonly<Record<ConstructionApprovalState, ConstructionClassificationDescriptor<ConstructionApprovalState>>>;
  relationships: readonly ConstructionEntityRelationship[];
}>;

function classification<T extends string>(id: T, label: string, description: string, order: number): ConstructionClassificationDescriptor<T> {
  return { id, label, description, order };
}

function entity(
  type: ConstructionEntityType,
  label: string,
  description: string,
  options: Partial<Omit<ConstructionEntityDescriptor, "type" | "label" | "description" | "reasoning">> & {
    reasoning?: Partial<ConstructionReasoningMetadata>;
  } = {}
): ConstructionEntityDescriptor {
  return {
    type,
    label,
    description,
    commonAliases: options.commonAliases || [],
    relatedDocumentCategories: options.relatedDocumentCategories || [],
    defaultPhase: options.defaultPhase,
    defaultDiscipline: options.defaultDiscipline,
    reasoning: {
      reasoningReady: false,
      futureSignals: options.reasoning?.futureSignals || [],
      notes: options.reasoning?.notes || "Architecture metadata only. No reasoning is implemented in this pass."
    }
  };
}

function category(
  id: ConstructionDocumentCategory,
  label: string,
  description: string,
  order: number,
  documentTypes: readonly DocumentType[],
  primaryEntities: readonly ConstructionEntityType[],
  typicalPhases: readonly ConstructionPhase[]
): ConstructionDocumentCategoryDescriptor {
  return {
    id,
    label,
    description,
    order,
    documentTypes,
    primaryEntities,
    typicalPhases
  };
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const property of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[property];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

export const constructionKnowledgeRegistry: ConstructionKnowledgeRegistry = deepFreeze({
  entities: {
    project: entity("project", "Project", "The top-level construction initiative.", {
      relatedDocumentCategories: ["progress_report", "schedule", "risk_register"]
    }),
    building: entity("building", "Building", "A physical building within a project.", {
      relatedDocumentCategories: ["architectural_drawing", "structural_drawing", "as_built_drawing"]
    }),
    site: entity("site", "Site", "The physical project location and working area.", {
      relatedDocumentCategories: ["permit", "safety_report", "method_statement"]
    }),
    zone: entity("zone", "Zone", "A subdivision of a site or building.", {
      relatedDocumentCategories: ["architectural_drawing", "schedule"]
    }),
    level: entity("level", "Level", "A floor or vertical project level.", {
      relatedDocumentCategories: ["architectural_drawing", "mep_drawing"]
    }),
    room: entity("room", "Room", "A defined room or space.", {
      relatedDocumentCategories: ["architectural_drawing", "as_built_drawing"]
    }),
    discipline: entity("discipline", "Discipline", "A technical or management discipline.", {
      relatedDocumentCategories: ["specification", "architectural_drawing"]
    }),
    trade: entity("trade", "Trade", "A construction trade or subcontract scope.", {
      relatedDocumentCategories: ["shop_drawing", "method_statement"]
    }),
    activity: entity("activity", "Activity", "A scheduled unit of construction work.", {
      relatedDocumentCategories: ["schedule", "progress_report"]
    }),
    task: entity("task", "Task", "An assignable action item.", {
      relatedDocumentCategories: ["meeting_minutes", "progress_report"]
    }),
    milestone: entity("milestone", "Milestone", "A major schedule checkpoint.", {
      relatedDocumentCategories: ["schedule", "progress_report"]
    }),
    material: entity("material", "Material", "A construction material or product.", {
      relatedDocumentCategories: ["material_submittal", "specification", "boq"]
    }),
    equipment: entity("equipment", "Equipment", "Construction equipment or machinery.", {
      relatedDocumentCategories: ["method_statement", "safety_report"]
    }),
    resource: entity("resource", "Resource", "Labor, equipment, material, or capacity.", {
      relatedDocumentCategories: ["schedule", "boq"]
    }),
    risk: entity("risk", "Risk", "A future event that may affect project outcomes.", {
      relatedDocumentCategories: ["risk_register", "progress_report"]
    }),
    issue: entity("issue", "Issue", "A current problem requiring action.", {
      relatedDocumentCategories: ["meeting_minutes", "progress_report"]
    }),
    observation: entity("observation", "Observation", "A site or quality observation.", {
      relatedDocumentCategories: ["inspection_report", "quality_report", "safety_report"]
    }),
    inspection: entity("inspection", "Inspection", "A formal check of work, quality, safety, or compliance.", {
      relatedDocumentCategories: ["inspection_report", "quality_report"]
    }),
    quality_control: entity("quality_control", "Quality Control", "Quality assurance and control process.", {
      defaultDiscipline: "quality",
      relatedDocumentCategories: ["quality_report", "inspection_report", "method_statement"]
    }),
    safety: entity("safety", "Safety", "Safety process, observation, or compliance item.", {
      defaultDiscipline: "safety",
      relatedDocumentCategories: ["safety_report", "method_statement"]
    }),
    contract: entity("contract", "Contract", "A binding agreement between parties.", {
      defaultDiscipline: "contracts",
      relatedDocumentCategories: ["contract", "change_order", "variation_order"]
    }),
    boq: entity("boq", "Bill of Quantities", "Quantified scope and cost items.", {
      relatedDocumentCategories: ["boq"],
      defaultDiscipline: "finance"
    }),
    specification: entity("specification", "Specification", "Technical requirements and standards.", {
      relatedDocumentCategories: ["specification", "material_submittal"]
    }),
    drawing: entity("drawing", "Drawing", "A technical drawing or visual construction document.", {
      relatedDocumentCategories: ["architectural_drawing", "structural_drawing", "mep_drawing", "shop_drawing", "as_built_drawing"]
    }),
    meeting: entity("meeting", "Meeting", "A project meeting or coordination session.", {
      relatedDocumentCategories: ["meeting_minutes"]
    }),
    report: entity("report", "Report", "A project status, quality, safety, or executive report.", {
      relatedDocumentCategories: ["progress_report", "inspection_report", "quality_report", "safety_report"]
    }),
    change_order: entity("change_order", "Change Order", "A formal change to contract scope, price, or time.", {
      relatedDocumentCategories: ["change_order"]
    }),
    variation: entity("variation", "Variation", "A scope or cost variation.", {
      relatedDocumentCategories: ["variation_order"]
    }),
    payment: entity("payment", "Payment", "A payment event or obligation.", {
      relatedDocumentCategories: ["payment_certificate", "invoice"]
    }),
    invoice: entity("invoice", "Invoice", "A billing document from supplier or contractor.", {
      relatedDocumentCategories: ["invoice"]
    }),
    cost_item: entity("cost_item", "Cost Item", "A budget or BOQ line item.", {
      relatedDocumentCategories: ["boq", "invoice", "payment_certificate"]
    }),
    schedule: entity("schedule", "Schedule", "Project timeline and sequencing data.", {
      relatedDocumentCategories: ["schedule"]
    }),
    permit: entity("permit", "Permit", "Authority approval or permit item.", {
      relatedDocumentCategories: ["permit"],
      defaultPhase: "permitting"
    }),
    regulation: entity("regulation", "Regulation", "Applicable law, code, or authority requirement.", {
      relatedDocumentCategories: ["permit", "specification"]
    }),
    stakeholder: entity("stakeholder", "Stakeholder", "A person, role, company, or authority involved in the project.", {
      relatedDocumentCategories: ["meeting_minutes", "contract", "permit"]
    })
  },
  documentCategories: {
    architectural_drawing: category("architectural_drawing", "Architectural Drawing", "Architectural plans, elevations, and details.", 10, ["drawing", "pdf"], ["drawing", "building", "level", "room"], ["concept_design", "design_development", "construction"]),
    structural_drawing: category("structural_drawing", "Structural Drawing", "Structural plans, details, and calculations.", 20, ["drawing", "pdf"], ["drawing", "discipline"], ["design_development", "construction"]),
    mep_drawing: category("mep_drawing", "MEP Drawing", "Mechanical, electrical, and plumbing drawings.", 30, ["drawing", "pdf"], ["drawing", "discipline"], ["design_development", "construction"]),
    shop_drawing: category("shop_drawing", "Shop Drawing", "Trade-level fabrication or installation drawings.", 40, ["drawing", "pdf"], ["trade", "drawing"], ["construction"]),
    as_built_drawing: category("as_built_drawing", "As-Built Drawing", "Final records of constructed conditions.", 50, ["drawing", "pdf"], ["drawing", "building"], ["handover", "closeout"]),
    boq: category("boq", "BOQ", "Bill of quantities and quantity schedules.", 60, ["csv", "spreadsheet", "pdf"], ["boq", "cost_item", "material"], ["procurement", "construction"]),
    specification: category("specification", "Specification", "Technical requirements and material/workmanship standards.", 70, ["construction_specification", "pdf", "docx"], ["specification", "material"], ["design_development", "procurement", "construction"]),
    contract: category("contract", "Contract", "Contract agreements and terms.", 80, ["contract", "pdf", "docx"], ["contract", "stakeholder"], ["procurement", "construction"]),
    permit: category("permit", "Permit", "Permits and authority approvals.", 90, ["pdf", "docx"], ["permit", "regulation", "stakeholder"], ["permitting"]),
    inspection_report: category("inspection_report", "Inspection Report", "Inspection findings and status.", 100, ["report", "pdf", "docx"], ["inspection", "observation", "quality_control"], ["construction", "quality_control"]),
    quality_report: category("quality_report", "Quality Report", "Quality control reporting.", 110, ["report", "pdf", "docx"], ["quality_control", "inspection"], ["quality_control", "handover"]),
    safety_report: category("safety_report", "Safety Report", "Safety observations and incidents.", 120, ["report", "pdf", "docx"], ["safety", "observation", "issue"], ["construction"]),
    meeting_minutes: category("meeting_minutes", "Meeting Minutes", "Meeting records, decisions, and actions.", 130, ["meeting_minutes", "docx", "pdf"], ["meeting", "task", "stakeholder"], ["mobilization", "construction"]),
    progress_report: category("progress_report", "Progress Report", "Project progress and executive status reporting.", 140, ["report", "pdf", "docx"], ["report", "activity", "milestone", "risk"], ["construction", "quality_control"]),
    invoice: category("invoice", "Invoice", "Supplier or contractor invoice.", 150, ["pdf", "docx"], ["invoice", "payment", "cost_item"], ["construction", "closeout"]),
    payment_certificate: category("payment_certificate", "Payment Certificate", "Certified payment record.", 160, ["pdf", "docx"], ["payment", "cost_item", "contract"], ["construction", "closeout"]),
    change_order: category("change_order", "Change Order", "Formal scope, time, or cost change.", 170, ["docx", "pdf"], ["change_order", "contract", "cost_item"], ["construction"]),
    variation_order: category("variation_order", "Variation Order", "Variation request or order.", 180, ["docx", "pdf"], ["variation", "contract", "cost_item"], ["construction"]),
    schedule: category("schedule", "Schedule", "Project schedule and timeline.", 190, ["spreadsheet", "pdf", "csv"], ["schedule", "activity", "milestone"], ["feasibility", "construction"]),
    risk_register: category("risk_register", "Risk Register", "Project risks and mitigations.", 200, ["spreadsheet", "csv", "pdf"], ["risk", "issue"], ["feasibility", "construction"]),
    material_submittal: category("material_submittal", "Material Submittal", "Material approval documents.", 210, ["pdf", "docx"], ["material", "specification", "stakeholder"], ["procurement", "construction"]),
    method_statement: category("method_statement", "Method Statement", "Execution method and safety procedure.", 220, ["pdf", "docx"], ["activity", "safety", "quality_control"], ["construction"]),
    other: category("other", "Other", "Unclassified construction document.", 999, ["unknown"], ["project"], ["idea"])
  },
  phases: {
    idea: classification("idea", "Idea", "Initial project idea.", 10),
    feasibility: classification("feasibility", "Feasibility", "Feasibility and early viability.", 20),
    concept_design: classification("concept_design", "Concept Design", "Conceptual design development.", 30),
    design_development: classification("design_development", "Design Development", "Technical design progression.", 40),
    permitting: classification("permitting", "Permitting", "Authority approvals and permits.", 50),
    procurement: classification("procurement", "Procurement", "Tendering, sourcing, and contracting.", 60),
    mobilization: classification("mobilization", "Mobilization", "Site setup and readiness.", 70),
    construction: classification("construction", "Construction", "Physical execution.", 80),
    quality_control: classification("quality_control", "Quality Control", "Inspection and quality verification.", 90),
    handover: classification("handover", "Handover", "Client handover and commissioning.", 100),
    operations: classification("operations", "Operations", "Operational phase.", 110),
    closeout: classification("closeout", "Closeout", "Final closeout and archiving.", 120)
  },
  lifecycle: {
    initiation: classification("initiation", "Initiation", "Project setup and intent.", 10),
    planning: classification("planning", "Planning", "Planning, estimates, and responsibilities.", 20),
    design: classification("design", "Design", "Design and engineering.", 30),
    tendering: classification("tendering", "Tendering", "Supplier selection and procurement.", 40),
    execution: classification("execution", "Execution", "Construction execution.", 50),
    monitoring: classification("monitoring", "Monitoring", "Controls, reports, and decisions.", 60),
    handover: classification("handover", "Handover", "Handover readiness.", 70),
    closed: classification("closed", "Closed", "Closed project.", 80)
  },
  disciplines: {
    architecture: classification("architecture", "Architecture", "Architectural design and coordination.", 10),
    civil: classification("civil", "Civil", "Civil engineering.", 20),
    structural: classification("structural", "Structural", "Structural engineering.", 30),
    mep: classification("mep", "MEP", "Mechanical, electrical, and plumbing.", 40),
    electrical: classification("electrical", "Electrical", "Electrical systems.", 50),
    mechanical: classification("mechanical", "Mechanical", "Mechanical systems.", 60),
    plumbing: classification("plumbing", "Plumbing", "Plumbing systems.", 70),
    hvac: classification("hvac", "HVAC", "Heating, ventilation, and air conditioning.", 80),
    interior: classification("interior", "Interior", "Interior design and fit-out.", 90),
    landscape: classification("landscape", "Landscape", "Landscape design and works.", 100),
    geotechnical: classification("geotechnical", "Geotechnical", "Soil and geotechnical engineering.", 110),
    surveying: classification("surveying", "Surveying", "Surveying and setting out.", 120),
    procurement: classification("procurement", "Procurement", "Sourcing and purchasing.", 130),
    logistics: classification("logistics", "Logistics", "Site logistics and deliveries.", 140),
    quality: classification("quality", "Quality", "Quality assurance and control.", 150),
    safety: classification("safety", "Safety", "Safety management.", 160),
    finance: classification("finance", "Finance", "Cost and payment management.", 170),
    contracts: classification("contracts", "Contracts", "Contracts and claims.", 180),
    project_management: classification("project_management", "Project Management", "Planning, coordination, and controls.", 190)
  },
  riskSeverities: {
    low: classification("low", "Low", "Low impact risk.", 10),
    medium: classification("medium", "Medium", "Moderate impact risk.", 20),
    high: classification("high", "High", "High impact risk.", 30),
    critical: classification("critical", "Critical", "Critical impact risk.", 40)
  },
  priorities: {
    low: classification("low", "Low", "Low priority.", 10),
    medium: classification("medium", "Medium", "Normal priority.", 20),
    high: classification("high", "High", "High priority.", 30),
    urgent: classification("urgent", "Urgent", "Immediate attention required.", 40)
  },
  statuses: {
    not_started: classification("not_started", "Not Started", "Work has not started.", 10),
    planned: classification("planned", "Planned", "Work is planned.", 20),
    in_progress: classification("in_progress", "In Progress", "Work is active.", 30),
    blocked: classification("blocked", "Blocked", "Work is blocked.", 40),
    under_review: classification("under_review", "Under Review", "Awaiting review.", 50),
    approved: classification("approved", "Approved", "Approved state.", 60),
    completed: classification("completed", "Completed", "Work is completed.", 70),
    archived: classification("archived", "Archived", "Archived state.", 80)
  },
  approvalStates: {
    draft: classification("draft", "Draft", "Draft state.", 10),
    submitted: classification("submitted", "Submitted", "Submitted for review.", 20),
    under_review: classification("under_review", "Under Review", "Currently under review.", 30),
    revise_and_resubmit: classification("revise_and_resubmit", "Revise and Resubmit", "Revision required.", 40),
    approved: classification("approved", "Approved", "Approved.", 50),
    rejected: classification("rejected", "Rejected", "Rejected.", 60),
    void: classification("void", "Void", "No longer valid.", 70)
  },
  relationships: [
    { from: "project", to: "building", type: "contains", description: "A project may contain one or more buildings." },
    { from: "building", to: "level", type: "contains", description: "A building contains levels." },
    { from: "level", to: "room", type: "contains", description: "A level contains rooms." },
    { from: "site", to: "zone", type: "contains", description: "A site can be divided into zones." },
    { from: "activity", to: "task", type: "contains", description: "Activities can be broken into tasks." },
    { from: "milestone", to: "schedule", type: "scheduled_by", description: "Milestones belong to a schedule." },
    { from: "boq", to: "cost_item", type: "contains", description: "BOQs contain cost items." },
    { from: "invoice", to: "payment", type: "references", description: "Invoices reference payment obligations." },
    { from: "change_order", to: "contract", type: "impacts", description: "Change orders impact contracts." },
    { from: "variation", to: "contract", type: "impacts", description: "Variations impact contract scope, cost, or time." },
    { from: "risk", to: "issue", type: "impacts", description: "Risks may become issues." },
    { from: "inspection", to: "quality_control", type: "documents", description: "Inspections document quality control." },
    { from: "permit", to: "regulation", type: "requires_approval", description: "Permits depend on authority regulations." },
    { from: "stakeholder", to: "task", type: "assigned_to", description: "Stakeholders can own tasks." }
  ]
});

export function getConstructionEntity(type: ConstructionEntityType): ConstructionEntityDescriptor {
  return constructionKnowledgeRegistry.entities[type];
}

export function getConstructionPhase(phase: ConstructionPhase): ConstructionClassificationDescriptor<ConstructionPhase> {
  return constructionKnowledgeRegistry.phases[phase];
}

export function getConstructionDocumentCategory(category: ConstructionDocumentCategory): ConstructionDocumentCategoryDescriptor {
  return constructionKnowledgeRegistry.documentCategories[category];
}

export function getEntitiesForDocument(category: ConstructionDocumentCategory): readonly ConstructionEntityDescriptor[] {
  return constructionKnowledgeRegistry.documentCategories[category].primaryEntities.map((entityType) => getConstructionEntity(entityType));
}

export function getDocumentCategoriesForEntity(type: ConstructionEntityType): readonly ConstructionDocumentCategoryDescriptor[] {
  const entityDescriptor = getConstructionEntity(type);
  return entityDescriptor.relatedDocumentCategories.map((categoryId) => getConstructionDocumentCategory(categoryId));
}

export function getRelationshipsForEntity(type: ConstructionEntityType): readonly ConstructionEntityRelationship[] {
  return constructionKnowledgeRegistry.relationships.filter((relationship) => relationship.from === type || relationship.to === type);
}

export function validateConstructionEntity(value: string): value is ConstructionEntityType {
  return value in constructionKnowledgeRegistry.entities;
}

export function validateConstructionDocumentCategory(value: string): value is ConstructionDocumentCategory {
  return value in constructionKnowledgeRegistry.documentCategories;
}

export function inferConstructionDocumentCategories(documentType: DocumentType): readonly ConstructionDocumentCategoryDescriptor[] {
  return Object.values(constructionKnowledgeRegistry.documentCategories)
    .filter((categoryDescriptor) => categoryDescriptor.documentTypes.includes(documentType))
    .sort((left, right) => left.order - right.order);
}
