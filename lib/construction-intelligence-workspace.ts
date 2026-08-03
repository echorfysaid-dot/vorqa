export type ConstructionIntelligenceFeatureStatus = "active" | "coming_soon";

export type ConstructionIntelligenceFeature = {
  id: string;
  title: string;
  description: string;
  supportedFiles: string[];
  status: ConstructionIntelligenceFeatureStatus;
  href?: string;
  taskIntent?: "contract_review" | "cost_review" | "risk_assessment" | "planning_review" | "site_report_review" | "executive_summary";
  runtimeLayer: "vora_intelligence_runtime";
};

export const constructionIntelligenceFeatures: readonly ConstructionIntelligenceFeature[] = [
  {
    id: "contract-review",
    title: "Contract Review",
    description: "Review construction contracts with VORA for summaries, risks, missing information, and review actions.",
    supportedFiles: ["TXT", "Markdown", "PDF placeholder", "DOCX placeholder"],
    status: "active",
    href: "/tools/contract-review",
    taskIntent: "contract_review",
    runtimeLayer: "vora_intelligence_runtime"
  },
  {
    id: "boq-review",
    title: "BOQ Review",
    description: "Review bills of quantities and cost tables for missing items, duplicates, unit issues, and total mismatches.",
    supportedFiles: ["CSV", "TSV", "TXT", "Markdown", "Spreadsheet placeholder", "PDF/DOCX placeholder"],
    status: "active",
    href: "/tools/boq-review",
    taskIntent: "cost_review",
    runtimeLayer: "vora_intelligence_runtime"
  },
  {
    id: "risk-assessment",
    title: "Risk Assessment",
    description: "Project risk intelligence for contracts, schedules, budgets, documents, and execution readiness.",
    supportedFiles: ["Contract Review result", "BOQ Review result", "TXT", "Markdown", "PDF placeholder", "DOCX placeholder"],
    status: "active",
    href: "/tools/risk-assessment",
    taskIntent: "risk_assessment",
    runtimeLayer: "vora_intelligence_runtime"
  },
  {
    id: "planning-review",
    title: "Planning Review",
    description: "Schedule and planning intelligence for milestones, dependencies, and delivery readiness.",
    supportedFiles: ["TXT", "Markdown", "CSV", "Activity list", "PDF placeholder", "DOCX placeholder"],
    status: "active",
    href: "/tools/planning-review",
    taskIntent: "planning_review",
    runtimeLayer: "vora_intelligence_runtime"
  },
  {
    id: "site-report-review",
    title: "Site Report Review",
    description: "Review daily and weekly site reports for progress, issues, safety, and follow-up actions.",
    supportedFiles: ["TXT", "Markdown", "CSV", "Daily reports", "Inspection notes", "PDF/DOCX placeholder"],
    status: "active",
    href: "/tools/site-report-review",
    taskIntent: "site_report_review",
    runtimeLayer: "vora_intelligence_runtime"
  },
  {
    id: "executive-summary",
    title: "Executive Summary",
    description: "Prepare executive-level project summaries from available construction intelligence context.",
    supportedFiles: ["Project Intelligence Session", "Completed analyses", "Mock/OpenAI"],
    status: "active",
    href: "/tools/executive-summary",
    taskIntent: "executive_summary",
    runtimeLayer: "vora_intelligence_runtime"
  }
] as const;

export function getLaunchableConstructionIntelligenceFeatures() {
  return constructionIntelligenceFeatures.filter((feature) => feature.status === "active" && Boolean(feature.href));
}

export function getConstructionIntelligenceWorkspaceSummary() {
  const activeFeatures = getLaunchableConstructionIntelligenceFeatures();
  const comingSoonFeatures = constructionIntelligenceFeatures.filter((feature) => feature.status === "coming_soon");

  return {
    totalFeatures: constructionIntelligenceFeatures.length,
    activeFeatures: activeFeatures.length,
    comingSoonFeatures: comingSoonFeatures.length,
    supportedRuntime: "VORA Intelligence Runtime",
    providerMode: "Mock ready / OpenAI when configured"
  } as const;
}
