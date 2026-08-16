import type { ProjectInput } from "@/lib/models/project";

export const projectTypeIds = ["house", "villa", "apartment_building", "commercial", "hotel", "renovation", "other", "not_decided"] as const;
export const projectOwnerStageIds = ["land_only", "idea", "architectural_plans", "permits", "looking_professionals", "construction_started", "under_execution", "not_decided"] as const;

export type ProjectTypeId = (typeof projectTypeIds)[number];
export type ProjectOwnerStageId = (typeof projectOwnerStageIds)[number];
export type KnownUnknown = "yes" | "no" | "unknown";

export type ProjectCreationAnswers = Readonly<{
  title: string;
  projectType: ProjectTypeId;
  description?: string;
  country?: string;
  city?: string;
  location?: string;
  landArea?: string;
  constructionArea?: string;
  floors?: string;
  budgetAmount?: string;
  currency?: string;
  stage: ProjectOwnerStageId;
  landStatus?: string;
  permitStatus?: string;
  drawingsStatus?: KnownUnknown;
  desiredStartDate?: string;
  completionTimeframe?: string;
  organizationId?: string;
  departmentId?: string;
  projectManagerId?: string;
}>;

export type ProjectOwnerContext = Readonly<{
  projectId: string;
  projectName: string;
  projectType?: ProjectTypeId | string;
  country?: string;
  city?: string;
  location?: string;
  landArea?: number;
  constructionArea?: number;
  floors?: number;
  budgetAmount?: number;
  currency?: string;
  stage?: ProjectOwnerStageId | string;
  landStatus?: string;
  permitStatus?: string;
  drawingsStatus?: KnownUnknown;
  desiredStartDate?: string;
  completionTimeframe?: string;
  description?: string;
  guidanceMode: "simple_owner" | "standard";
  missingFields: readonly string[];
}>;

export type ProjectOwnerNextStep = Readonly<{
  id: string;
  titleKey: string;
  descriptionKey: string;
  actionKey: string;
  route: string;
  legalDisclaimerKey?: string;
}>;

export type RecommendedProfessionalCategory = Readonly<{
  id: string;
  labelKey: string;
  reasonKey: string;
  availability: "category_only";
  matchingCriteria: Readonly<{
    country?: string;
    city?: string;
    location?: string;
    projectType?: string;
    projectStage?: string;
    budgetAmount?: number;
  }>;
  matches: readonly never[];
}>;

export type ProjectProgressStep = Readonly<{
  id: string;
  labelKey: string;
  status: "completed" | "current" | "upcoming";
}>;

export type ProjectOwnerExperience = Readonly<{
  context: ProjectOwnerContext;
  nextStep: ProjectOwnerNextStep;
  recommendedTeam: readonly RecommendedProfessionalCategory[];
  progress: Readonly<{
    steps: readonly ProjectProgressStep[];
    completedSteps: number;
    totalSteps: number;
    evidencePercentage?: number;
  }>;
}>;

export type ProjectJourneyInput = ProjectInput & {
  metadata: Record<string, unknown>;
};
