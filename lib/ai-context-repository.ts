import {
  budgetRepository,
  documentRepository,
  employeeRepository,
  knowledgeRepository,
  organizationRepository,
  projectRepository,
  taskRepository,
  timelineRepository
} from "@/lib/repositories";
import { cachedRepositoryCall } from "@/lib/repositories/repositoryCache";
import { createProjectOwnerContext } from "@/lib/project-owner-journey";
import type { ProjectOwnerContext } from "@/types/project-journey";

export type AiConversationMemory = {
  title: string;
  tool: string;
  output: string;
  provider?: string;
  createdAt?: string;
  promptType?: string;
  saved?: boolean;
  favorite?: boolean;
};

export type VoraProjectContext = {
  organization?: unknown;
  project?: unknown;
  projectProfile?: ProjectOwnerContext;
  members: unknown[];
  departments: unknown[];
  employees: unknown[];
  tasks: unknown[];
  timeline: unknown | null;
  milestones: unknown[];
  budget: unknown | null;
  budgetStats?: unknown;
  documents: unknown[];
  knowledge: unknown[];
  memory: AiConversationMemory[];
  references: string[];
  source: "demo" | "supabase" | "auto" | "demo-fallback";
  errors: string[];
};

function resultError(value: unknown) {
  return value && typeof value === "object" && "error" in value && typeof value.error === "string" ? value.error : undefined;
}

function resultSource(value: unknown) {
  return value && typeof value === "object" && "source" in value && typeof value.source === "string" ? value.source : "demo";
}

function resultData<T>(value: unknown, fallback: T): T {
  return value && typeof value === "object" && "data" in value ? ((value as { data?: T }).data ?? fallback) : fallback;
}

export const aiContextRepository = {
  async buildProjectContext(projectId: string): Promise<VoraProjectContext> {
    return cachedRepositoryCall(`ai-context:project:${projectId}`, 30_000, () => buildProjectContextUncached(projectId));
  },

  async buildOrganizationContext(organizationId: string) {
    return cachedRepositoryCall(`ai-context:organization:${organizationId}`, 30_000, () => buildOrganizationContextUncached(organizationId));
  },

  async buildTaskContext(taskId: string) {
    return cachedRepositoryCall(`ai-context:task:${taskId}`, 30_000, async () => {
      const task = await taskRepository.getTask(taskId);
      return { task: task.data, source: task.source, errors: [resultError(task)].filter(Boolean) };
    });
  },

  async buildBudgetContext(projectId: string) {
    return cachedRepositoryCall(`ai-context:budget:${projectId}`, 30_000, async () => {
      const budget = await budgetRepository.getBudget(projectId);
      return {
        budget: budget.data,
        stats: budgetRepository.getBudgetStats(budget.data),
        source: budget.source,
        errors: [resultError(budget)].filter(Boolean)
      };
    });
  },

  async buildKnowledgeContext(projectId: string) {
    return cachedRepositoryCall(`ai-context:knowledge:${projectId}`, 30_000, async () => {
      const project = await projectRepository.getProject(projectId);
      const organizationId = project.data?.organizationId || "atlas";
      const knowledge = await knowledgeRepository.getKnowledge({ organizationId, projectId });
      return { knowledge: knowledge.data, source: knowledge.source, errors: [resultError(project), resultError(knowledge)].filter(Boolean) };
    });
  }
};

async function buildProjectContextUncached(projectId: string): Promise<VoraProjectContext> {
    const errors: string[] = [];
    const projectResult = await projectRepository.getProject(projectId);
    const project = projectResult.data || projectRepository.getById(projectId) || null;
    const organizationId = typeof project === "object" && project && "organizationId" in project && typeof project.organizationId === "string" ? project.organizationId : "atlas";

    const [organizationResult, membersResult, employeesResult, tasksResult, timelineResult, budgetResult, documentsResult, knowledgeResult] = await Promise.all([
      organizationRepository.getOrganization(organizationId),
      projectRepository.getProjectMembers(projectId),
      employeeRepository.getEmployees(organizationId),
      taskRepository.getTasks(projectId),
      timelineRepository.getTimeline(projectId),
      budgetRepository.getBudget(projectId),
      documentRepository.getDocuments(projectId),
      knowledgeRepository.getKnowledge({ organizationId, projectId })
    ]);

    [projectResult, organizationResult, membersResult, employeesResult, tasksResult, timelineResult, budgetResult, documentsResult, knowledgeResult].forEach((result) => {
      const error = resultError(result);
      if (error) errors.push(error);
    });

    const budget = resultData<any | null>(budgetResult, null);
    const timeline = resultData<any | null>(timelineResult, null);
    const documents = resultData<unknown[]>(documentsResult, []);
    const knowledge = resultData<unknown[]>(knowledgeResult, []);
    const tasks = resultData<unknown[]>(tasksResult, []);

    return {
      organization: resultData(organizationResult, undefined),
      project,
      ...(project ? { projectProfile: createProjectOwnerContext(project) } : {}),
      members: resultData(membersResult, []),
      departments: organizationRepository.listDepartments(),
      employees: resultData(employeesResult, []),
      tasks,
      timeline,
      milestones: timeline && typeof timeline === "object" && "milestones" in timeline && Array.isArray(timeline.milestones) ? timeline.milestones : [],
      budget,
      budgetStats: budget ? budgetRepository.getBudgetStats(budget) : undefined,
      documents,
      knowledge,
      memory: projectRepository.listSavedGenerations().slice(0, 8).map((item) => ({
        title: item.title,
        tool: item.tool,
        output: `${item.title} generated with ${item.tool}`,
        provider: "demo",
        createdAt: item.date,
        promptType: item.tool,
        saved: true,
        favorite: Boolean(item.favorite)
      })),
      references: [
        `project:${projectId}`,
        `organization:${organizationId}`,
        `tasks:${tasks.length}`,
        `documents:${documents.length}`,
        `knowledge:${knowledge.length}`
      ],
      source: resultSource(projectResult) as VoraProjectContext["source"],
      errors
    };
}

async function buildOrganizationContextUncached(organizationId: string) {
    const [organization, employees, stats] = await Promise.all([
      organizationRepository.getOrganization(organizationId),
      employeeRepository.getEmployees(organizationId),
      Promise.resolve(organizationRepository.getOrganizationStats(organizationId))
    ]);
    return {
      organization: organization.data,
      employees: employees.data,
      stats,
      source: organization.source,
      errors: [resultError(organization), resultError(employees)].filter(Boolean)
    };
}
