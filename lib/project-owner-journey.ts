import type { Project } from "@/lib/models/project";
import type { Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils/format";
import type {
  ProjectCreationAnswers,
  ProjectJourneyInput,
  ProjectOwnerContext,
  ProjectOwnerExperience,
  ProjectOwnerNextStep,
  ProjectOwnerStageId,
  ProjectProgressStep,
  ProjectTypeId,
  RecommendedProfessionalCategory
} from "@/types/project-journey";

const typeLabels: Record<ProjectTypeId, string> = {
  house: "House",
  villa: "Villa",
  apartment_building: "Apartment building",
  commercial: "Commercial",
  hotel: "Hotel",
  renovation: "Renovation",
  other: "Other",
  not_decided: "Project"
};

const stageStatus: Record<ProjectOwnerStageId, Readonly<{ status: string; phase: string }>> = {
  land_only: { status: "Planning", phase: "Planning" },
  idea: { status: "Planning", phase: "Planning" },
  architectural_plans: { status: "Design Review", phase: "Design" },
  permits: { status: "Procurement", phase: "Procurement" },
  looking_professionals: { status: "Procurement", phase: "Procurement" },
  construction_started: { status: "Execution", phase: "Execution" },
  under_execution: { status: "Execution", phase: "Execution" },
  not_decided: { status: "Planning", phase: "Planning" }
};

const progressIds = ["brief", "design", "technical", "permits", "team", "construction"] as const;
const systemValueKeys: Readonly<Record<string, string>> = Object.freeze({
  "Industrial Warehouse": "projectJourney.demo.type.industrialWarehouse",
  "Residential Complex": "projectJourney.demo.type.residentialComplex",
  "Commercial Tower": "projectJourney.demo.type.commercialTower",
  "Residential Villa": "projectJourney.demo.type.residentialVilla",
  Today: "projectJourney.demo.time.today",
  Yesterday: "projectJourney.demo.time.yesterday",
  "2 days ago": "projectJourney.demo.time.twoDaysAgo",
  "12 minutes ago": "projectJourney.demo.time.twelveMinutesAgo",
  "Luxury Villa Casablanca enterprise workspace.": "projectJourney.demo.villaDescription",
  "VORA analyzed façade procurement risk.": "projectJourney.activity.demoVoraRisk"
});
const stageProgress: Record<ProjectOwnerStageId, number> = {
  land_only: 0,
  idea: 1,
  architectural_plans: 2,
  permits: 4,
  looking_professionals: 4,
  construction_started: 5,
  under_execution: 5,
  not_decided: 0
};

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown) {
  const numeric = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined;
}

function compactRecord(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== ""));
}

export function localizeProjectJourneySystemValue(value: string, translate: (key: string) => string) {
  const key = systemValueKeys[value];
  return key ? translate(key) : value;
}

export function localizeProjectJourneyTimestamp(value: string, locale: Locale, translate: (key: string) => string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp)
    ? localizeProjectJourneySystemValue(value, translate)
    : formatDate(value, locale, { month: "long" });
}

export function createProjectInputFromJourney(answers: ProjectCreationAnswers): ProjectJourneyInput {
  const stage = stageStatus[answers.stage];
  const location = [clean(answers.location), clean(answers.city), clean(answers.country)].filter(Boolean).join(", ");
  const budgetAmount = numberValue(answers.budgetAmount);
  const currency = clean(answers.currency);
  const usableCurrency = currency && /^[A-Z]{3}$/.test(currency) ? currency : undefined;
  const metadata = compactRecord({
    ownerJourneyVersion: 1,
    experienceMode: "simple_owner",
    projectTypeId: answers.projectType,
    projectType: typeLabels[answers.projectType],
    country: clean(answers.country),
    city: clean(answers.city),
    location: location || undefined,
    landArea: numberValue(answers.landArea),
    constructionArea: numberValue(answers.constructionArea),
    floors: numberValue(answers.floors),
    budgetAmount,
    budget: budgetAmount !== undefined && usableCurrency ? `${budgetAmount} ${usableCurrency}` : undefined,
    currency: usableCurrency,
    ownerStage: answers.stage,
    phase: stage.phase,
    statusLabel: stage.status,
    landStatus: clean(answers.landStatus),
    permitStatus: clean(answers.permitStatus),
    drawingsStatus: answers.drawingsStatus,
    desiredStartDate: clean(answers.desiredStartDate),
    completionTimeframe: clean(answers.completionTimeframe),
    description: clean(answers.description)
  });

  return {
    organizationId: answers.organizationId,
    departmentId: answers.departmentId,
    projectManagerId: answers.projectManagerId,
    title: answers.title.trim(),
    description: clean(answers.description),
    type: typeLabels[answers.projectType],
    status: stage.status,
    metadata
  };
}

export function createProjectOwnerContext(project: Project): ProjectOwnerContext {
  const metadata = project.metadata || {};
  const country = clean(metadata.country);
  const city = clean(metadata.city);
  const location = clean(metadata.location) || clean(project.location);
  const projectType = clean(metadata.projectTypeId) || clean(metadata.projectType) || clean(project.type);
  const stage = clean(metadata.ownerStage);
  const missingFields = Object.freeze([
    !projectType || projectType === "not_decided" ? "projectType" : undefined,
    !country ? "country" : undefined,
    !city ? "city" : undefined,
    !stage || stage === "not_decided" ? "stage" : undefined,
    numberValue(metadata.budgetAmount) === undefined ? "budget" : undefined
  ].filter((value): value is string => Boolean(value)));

  return Object.freeze({
    projectId: project.id,
    projectName: project.title,
    ...(projectType ? { projectType } : {}),
    ...(country ? { country } : {}),
    ...(city ? { city } : {}),
    ...(location ? { location } : {}),
    ...(numberValue(metadata.landArea) !== undefined ? { landArea: numberValue(metadata.landArea) } : {}),
    ...(numberValue(metadata.constructionArea) !== undefined ? { constructionArea: numberValue(metadata.constructionArea) } : {}),
    ...(numberValue(metadata.floors) !== undefined ? { floors: numberValue(metadata.floors) } : {}),
    ...(numberValue(metadata.budgetAmount) !== undefined ? { budgetAmount: numberValue(metadata.budgetAmount) } : {}),
    ...(clean(metadata.currency) ? { currency: clean(metadata.currency) } : {}),
    ...(stage ? { stage } : {}),
    ...(clean(metadata.landStatus) ? { landStatus: clean(metadata.landStatus) } : {}),
    ...(clean(metadata.permitStatus) ? { permitStatus: clean(metadata.permitStatus) } : {}),
    ...(metadata.drawingsStatus === "yes" || metadata.drawingsStatus === "no" || metadata.drawingsStatus === "unknown" ? { drawingsStatus: metadata.drawingsStatus } : {}),
    ...(clean(metadata.desiredStartDate) ? { desiredStartDate: clean(metadata.desiredStartDate) } : {}),
    ...(clean(metadata.completionTimeframe) ? { completionTimeframe: clean(metadata.completionTimeframe) } : {}),
    ...(clean(project.description) ? { description: clean(project.description) } : {}),
    guidanceMode: metadata.experienceMode === "simple_owner" ? "simple_owner" : "standard",
    missingFields
  });
}

export function resolveProjectOwnerNextStep(context: ProjectOwnerContext): ProjectOwnerNextStep {
  const projectQuery = `projectId=${encodeURIComponent(context.projectId)}`;
  switch (context.stage) {
    case "land_only":
      return Object.freeze({ id: "prepare_brief", titleKey: "projectJourney.next.prepareBrief.title", descriptionKey: "projectJourney.next.prepareBrief.description", actionKey: "projectJourney.next.prepareBrief.action", route: `/tools/document?${projectQuery}` });
    case "idea":
      return Object.freeze({ id: "consult_architect", titleKey: "projectJourney.next.architect.title", descriptionKey: "projectJourney.next.architect.description", actionKey: "projectJourney.next.architect.action", route: "/marketplace" });
    case "architectural_plans":
      return Object.freeze({ id: "technical_review", titleKey: "projectJourney.next.technical.title", descriptionKey: "projectJourney.next.technical.description", actionKey: "projectJourney.next.technical.action", route: "/marketplace", legalDisclaimerKey: "projectJourney.guidance.disclaimer" });
    case "permits":
    case "looking_professionals":
      return Object.freeze({ id: "assemble_team", titleKey: "projectJourney.next.team.title", descriptionKey: "projectJourney.next.team.description", actionKey: "projectJourney.next.team.action", route: "/marketplace" });
    case "construction_started":
    case "under_execution":
      return Object.freeze({ id: "control_execution", titleKey: "projectJourney.next.execution.title", descriptionKey: "projectJourney.next.execution.description", actionKey: "projectJourney.next.execution.action", route: `/tools/planning-review?${projectQuery}` });
    default:
      return Object.freeze({ id: "complete_context", titleKey: "projectJourney.next.context.title", descriptionKey: "projectJourney.next.context.description", actionKey: "projectJourney.next.context.action", route: `/tools/document?${projectQuery}` });
  }
}

function category(id: string, context: ProjectOwnerContext): RecommendedProfessionalCategory {
  return Object.freeze({
    id,
    labelKey: `projectJourney.professional.${id}.label`,
    reasonKey: `projectJourney.professional.${id}.reason`,
    availability: "category_only",
    matchingCriteria: Object.freeze(compactRecord({
      country: context.country,
      city: context.city,
      location: context.location,
      projectType: context.projectType,
      projectStage: context.stage,
      budgetAmount: context.budgetAmount
    })),
    matches: Object.freeze([]) as readonly never[]
  });
}

export function getRecommendedProfessionalCategories(context: ProjectOwnerContext): readonly RecommendedProfessionalCategory[] {
  const ids = context.stage === "land_only"
    ? ["surveyor", "architect"]
    : context.stage === "idea"
      ? ["architect", "engineering_office"]
      : context.stage === "architectural_plans"
        ? ["structural_engineer", "engineering_office"]
        : context.stage === "permits" || context.stage === "looking_professionals"
          ? ["general_contractor", "construction_company"]
          : context.stage === "construction_started" || context.stage === "under_execution"
            ? ["general_contractor", "civil_engineer", "electrical_contractor", "plumbing_contractor"]
            : ["architect", "engineering_office"];
  return Object.freeze(ids.map((id) => category(id, context)));
}

export function deriveProjectOwnerProgress(context: ProjectOwnerContext, project: Project): ProjectOwnerExperience["progress"] {
  const currentIndex = stageProgress[(context.stage as ProjectOwnerStageId) || "not_decided"] ?? 0;
  const steps = Object.freeze(progressIds.map((id, index): ProjectProgressStep => Object.freeze({
    id,
    labelKey: `projectJourney.progress.${id}`,
    status: index < currentIndex ? "completed" : index === currentIndex ? "current" : "upcoming"
  })));
  const evidencePercentage = numberValue(project.metadata?.progress ?? project.metadata?.completion);
  return Object.freeze({
    steps,
    completedSteps: steps.filter((step) => step.status === "completed").length,
    totalSteps: steps.length,
    ...(evidencePercentage !== undefined ? { evidencePercentage: Math.min(100, evidencePercentage) } : {})
  });
}

export function createProjectOwnerExperience(project: Project): ProjectOwnerExperience {
  const context = createProjectOwnerContext(project);
  return Object.freeze({
    context,
    nextStep: resolveProjectOwnerNextStep(context),
    recommendedTeam: getRecommendedProfessionalCategories(context),
    progress: deriveProjectOwnerProgress(context, project)
  });
}
