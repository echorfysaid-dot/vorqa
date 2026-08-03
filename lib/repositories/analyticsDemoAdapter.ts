import type { DashboardAnalyticsSummary } from "@/lib/models";
import { budgetRepository } from "./budgetRepository";
import { documentRepository } from "./documentRepository";
import { employeeRepository } from "./employeeRepository";
import { knowledgeRepository } from "./knowledgeRepository";
import { projectRepository } from "./projectRepository";
import { taskRepository } from "./taskRepository";
import { timelineRepository } from "./timelineRepository";
import { buildAnalyticsSummary } from "./analyticsMapper";

export const analyticsDemoAdapter = {
  async getDashboardSummary(organizationId = "atlas", projectId = "PRJ-1048") {
    const [projects, employees, tasks, timeline, budget, documents, knowledge] = await Promise.all([
      projectRepository.getProjects(),
      employeeRepository.getEmployees(organizationId),
      taskRepository.getTasks(projectId),
      timelineRepository.getTimeline(projectId),
      budgetRepository.getBudget(projectId),
      documentRepository.getDocuments(projectId),
      knowledgeRepository.getKnowledge({ organizationId, projectId })
    ]);
    const summary = buildAnalyticsSummary({
      organizationId,
      projectId,
      projects: projects.data,
      employees: employees.data,
      tasks: tasks.data,
      timeline: timeline.data,
      budget: budget.data,
      documents: documents.data,
      knowledge: knowledge.data,
      aiInsights: projectRepository.listSavedGenerations().map((item) => `${item.title} · ${item.tool}`)
    });
    return { data: { ...summary, source: "demo" as const }, source: "demo" as const, isFallback: false };
  },

  async getOrganizationKPIs(organizationId = "atlas") {
    const summary = await this.getDashboardSummary(organizationId);
    return { data: [summary.data.projectHealth, summary.data.employeeWorkload, summary.data.departmentWorkload, summary.data.knowledgeCoverage], source: "demo" as const, isFallback: false };
  },

  async getProjectKPIs(projectId = "PRJ-1048") {
    const summary = await this.getDashboardSummary("atlas", projectId);
    return { data: [summary.data.projectHealth, summary.data.documentCoverage, summary.data.knowledgeCoverage], source: "demo" as const, isFallback: false };
  },

  async getBudgetKPIs(projectId = "PRJ-1048") {
    const summary = await this.getDashboardSummary("atlas", projectId);
    return { data: [summary.data.budgetHealth], source: "demo" as const, isFallback: false };
  },

  async getTaskKPIs(projectId = "PRJ-1048") {
    const summary = await this.getDashboardSummary("atlas", projectId);
    return { data: [summary.data.taskCompletion], source: "demo" as const, isFallback: false };
  },

  async getTimelineKPIs(projectId = "PRJ-1048") {
    const summary = await this.getDashboardSummary("atlas", projectId);
    return { data: [summary.data.timelineHealth, summary.data.milestoneCompletion], source: "demo" as const, isFallback: false };
  },

  async getKnowledgeKPIs(projectId = "PRJ-1048") {
    const summary = await this.getDashboardSummary("atlas", projectId);
    return { data: [summary.data.knowledgeCoverage, summary.data.documentCoverage], source: "demo" as const, isFallback: false };
  }
};
