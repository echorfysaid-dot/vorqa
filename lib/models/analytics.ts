import type { EntityId } from "./common";

export type AnalyticsTone = "gold" | "blue" | "success" | "warning" | "danger" | "neutral";

export interface AnalyticsKpi {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  unit?: string;
  tone: AnalyticsTone;
  trend?: "up" | "down" | "flat";
  description?: string;
}

export interface AnalyticsChartPoint {
  label: string;
  value: number;
  tone?: AnalyticsTone;
}

export interface ReportDefinition {
  id: string;
  title: string;
  type: "Executive" | "Daily" | "Weekly" | "Monthly" | "Budget" | "Timeline" | "Risk" | "Progress";
  status: "Ready" | "Draft" | "Needs review";
  date: string;
  author: string;
  summary: string;
}

export interface DashboardAnalyticsSummary {
  organizationId?: EntityId;
  projectId?: EntityId;
  healthScore: number;
  riskScore: number;
  projectHealth: AnalyticsKpi;
  budgetHealth: AnalyticsKpi;
  timelineHealth: AnalyticsKpi;
  taskCompletion: AnalyticsKpi;
  milestoneCompletion: AnalyticsKpi;
  employeeWorkload: AnalyticsKpi;
  departmentWorkload: AnalyticsKpi;
  knowledgeCoverage: AnalyticsKpi;
  documentCoverage: AnalyticsKpi;
  budgetTrend: AnalyticsChartPoint[];
  taskDistribution: AnalyticsChartPoint[];
  departmentPerformance: AnalyticsChartPoint[];
  knowledgeActivity: AnalyticsChartPoint[];
  recentAiInsights: string[];
  reports: ReportDefinition[];
  source?: "demo" | "supabase" | "auto" | "demo-fallback";
}
