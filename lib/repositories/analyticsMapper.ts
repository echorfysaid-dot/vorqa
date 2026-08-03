import type { AnalyticsChartPoint, AnalyticsKpi, AnalyticsTone, DashboardAnalyticsSummary, ReportDefinition } from "@/lib/models";
import { budgetRepository } from "./budgetRepository";
import { knowledgeRepository } from "./knowledgeRepository";
import { taskRepository } from "./taskRepository";
import { timelineRepository } from "./timelineRepository";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toneForScore(score: number): AnalyticsTone {
  if (score >= 80) return "success";
  if (score >= 65) return "gold";
  if (score >= 45) return "warning";
  return "danger";
}

function kpi(id: string, label: string, value: number, description: string): AnalyticsKpi {
  const score = clamp(value);
  return {
    id,
    label,
    value: score,
    displayValue: `${score}%`,
    unit: "%",
    tone: toneForScore(score),
    trend: score >= 72 ? "up" : score >= 52 ? "flat" : "down",
    description
  };
}

export function buildAnalyticsSummary({
  organizationId,
  projectId,
  projects,
  employees,
  tasks,
  timeline,
  budget,
  documents,
  knowledge,
  aiInsights
}: {
  organizationId?: string;
  projectId?: string;
  projects: any[];
  employees: any[];
  tasks: any[];
  timeline: any;
  budget: any;
  documents: any[];
  knowledge: any[];
  aiInsights: string[];
}): DashboardAnalyticsSummary {
  const taskStats = taskRepository.getProjectTaskStats(tasks);
  const timelineStats = timelineRepository.getTimelineStats(timeline || { projectId: projectId || "unknown", milestones: [], dependencies: [] });
  const budgetStats = budgetRepository.getBudgetStats(budget || { projectId: projectId || "unknown", categories: [], items: [] });
  const knowledgeStats = knowledgeRepository.getKnowledgeStats(knowledge);
  const projectAverage = projects.length ? projects.reduce((sum, project) => sum + Number(project.score || project.progress || 70), 0) / projects.length : 72;
  const budgetHealthValue = budgetStats.progress > 100 ? 35 : budgetStats.overBudget ? 62 : 86;
  const timelineHealthValue = clamp(100 - timelineStats.overdue * 12 + timelineStats.completionRate * 0.2);
  const taskHealthValue = taskStats.completionRate || 62;
  const documentCoverageValue = clamp(Math.min(100, documents.length * 8));
  const knowledgeCoverageValue = clamp(Math.min(100, knowledgeStats.count * 9));
  const employeeWorkloadValue = employees.length ? clamp(78 - Math.max(0, employees.length - 12)) : 50;
  const departmentWorkloadValue = clamp((employeeWorkloadValue + taskHealthValue) / 2);
  const healthScore = clamp((projectAverage + budgetHealthValue + timelineHealthValue + taskHealthValue + documentCoverageValue + knowledgeCoverageValue) / 6);
  const riskScore = clamp(100 - healthScore + taskStats.blocked * 4 + timelineStats.overdue * 5 + budgetStats.overBudget * 6);

  const taskDistribution: AnalyticsChartPoint[] = ["Todo", "In Progress", "Review", "Blocked", "Done"].map((status) => ({
    label: status,
    value: tasks.filter((task) => task.status === status).length,
    tone: status === "Done" ? "success" : status === "Blocked" ? "danger" : "blue"
  }));

  const departmentPerformance: AnalyticsChartPoint[] = Array.from(new Set(employees.map((employee) => employee.departmentName || employee.department || "General"))).slice(0, 6).map((department, index) => ({
    label: String(department),
    value: clamp(82 - index * 5 + (index % 2) * 7),
    tone: index % 3 === 0 ? "gold" : index % 3 === 1 ? "blue" : "success"
  }));

  const reports: ReportDefinition[] = [
    ["Executive", "Executive Project Intelligence Report"],
    ["Daily", "Daily Site Progress Report"],
    ["Weekly", "Weekly Management Report"],
    ["Monthly", "Monthly Portfolio Review"],
    ["Budget", "Budget Variance Report"],
    ["Timeline", "Timeline and Milestones Report"],
    ["Risk", "Risk Register Update"],
    ["Progress", "Progress Certification Report"]
  ].map(([type, title], index) => ({
    id: `RPT-${String(index + 1).padStart(3, "0")}`,
    title,
    type: type as ReportDefinition["type"],
    status: index === 6 && riskScore > 45 ? "Needs review" : index === 1 ? "Draft" : "Ready",
    date: `2026-07-${String(18 - index).padStart(2, "0")}`,
    author: index % 2 === 0 ? "VORA Analytics" : "Atlas PMO",
    summary: `${title}: health ${healthScore}%, risk ${riskScore}%, budget ${budgetHealthValue}%, timeline ${timelineHealthValue}%.`
  }));

  return {
    organizationId,
    projectId,
    healthScore,
    riskScore,
    projectHealth: kpi("project-health", "Project Health", healthScore, "Composite score across delivery, controls, and AI signals."),
    budgetHealth: kpi("budget-health", "Budget Health", budgetHealthValue, "Budget forecast, committed cost, and overrun pressure."),
    timelineHealth: kpi("timeline-health", "Timeline Health", timelineHealthValue, "Milestone completion and delay exposure."),
    taskCompletion: kpi("task-completion", "Task Completion", taskHealthValue, "Completed tasks compared with total assigned work."),
    milestoneCompletion: kpi("milestone-completion", "Milestone Completion", timelineStats.completionRate, "Completed milestones versus active milestones."),
    employeeWorkload: kpi("employee-workload", "Employee Workload", employeeWorkloadValue, "Balanced activity and available capacity."),
    departmentWorkload: kpi("department-workload", "Department Workload", departmentWorkloadValue, "Cross-department work balance."),
    knowledgeCoverage: kpi("knowledge-coverage", "Knowledge Coverage", knowledgeCoverageValue, "Procedures and standards available for the project."),
    documentCoverage: kpi("document-coverage", "Document Coverage", documentCoverageValue, "Project documentation completeness."),
    budgetTrend: [
      { label: "Planned", value: budgetStats.planned, tone: "blue" },
      { label: "Committed", value: budgetStats.committed, tone: "gold" },
      { label: "Actual", value: budgetStats.actual, tone: "success" },
      { label: "Remaining", value: budgetStats.remaining, tone: "neutral" }
    ],
    taskDistribution,
    departmentPerformance: departmentPerformance.length ? departmentPerformance : [{ label: "General", value: 72, tone: "gold" }],
    knowledgeActivity: Object.entries(knowledgeStats.categories).map(([label, value]) => ({ label, value, tone: "blue" })),
    recentAiInsights: aiInsights.length ? aiInsights : [
      "VORA recommends a weekly executive report for decision alignment.",
      "Risk score is driven by delayed milestones, blocked tasks, and missing knowledge coverage.",
      "Budget review should focus on committed cost before the next procurement award."
    ],
    reports,
    source: "demo"
  };
}
