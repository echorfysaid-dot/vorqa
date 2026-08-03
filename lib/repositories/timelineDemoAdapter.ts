import type { ProjectTimeline, TaskDependency, TaskDependencyInput, TimelineMilestone, TimelineMilestoneInput } from "@/lib/models";
import { taskDemoAdapter } from "./taskDemoAdapter";
import { makeDemoMilestone } from "./timelineMapper";

const milestoneTemplates = [
  ["Planning", "Initial scope, budget, and delivery strategy approved.", "Completed", 100],
  ["Permits", "Permitting package prepared and submitted for review.", "In Progress", 72],
  ["Excavation", "Site preparation and excavation window confirmed.", "Planned", 20],
  ["Foundation", "Foundation milestone tied to excavation completion.", "Planned", 0],
  ["Structure", "Structural frame delivery and inspection milestone.", "Planned", 0],
  ["MEP", "Mechanical, electrical, and plumbing coordination checkpoint.", "Delayed", 18],
  ["Finishes", "Interior and exterior finishes readiness review.", "Planned", 0],
  ["Inspection", "Quality assurance and final technical inspection.", "Planned", 0],
  ["Handover", "Final delivery, warranty handover, and closeout.", "Planned", 0]
] as const;

async function makeMilestones(projectId: string): Promise<TimelineMilestone[]> {
  return milestoneTemplates.map(([title, description, status, progress], index) =>
    makeDemoMilestone({
      projectId,
      organizationId: "atlas",
      title,
      description,
      status,
      progress,
      index
    })
  );
}

async function makeDependencies(projectId: string): Promise<TaskDependency[]> {
  const tasks = (await taskDemoAdapter.getTasks(projectId)).data;
  return tasks.slice(0, 5).map((task, index) => {
    const successor = tasks[index + 1] || tasks[0];
    return {
      id: `${projectId}-dependency-${index + 1}`,
      predecessorTaskId: task.id,
      successorTaskId: successor.id,
      predecessorTitle: task.title,
      successorTitle: successor.title,
      dependencyType: index % 2 === 0 ? "Finish-to-Start" : "Start-to-Start",
      createdAt: "2026-07-18T09:00:00.000Z"
    };
  });
}

export const timelineDemoAdapter = {
  async getTimeline(projectId: string) {
    const data: ProjectTimeline = {
      projectId,
      milestones: await makeMilestones(projectId),
      dependencies: await makeDependencies(projectId)
    };
    return { data, source: "demo" as const, isFallback: false };
  },

  async getMilestones(projectId: string) {
    return { data: await makeMilestones(projectId), source: "demo" as const, isFallback: false };
  },

  async createMilestone(input: TimelineMilestoneInput) {
    const milestone: TimelineMilestone = {
      id: `${input.projectId}-milestone-preview-${Date.now()}`,
      projectId: input.projectId,
      organizationId: input.organizationId,
      title: input.title,
      description: input.description,
      status: input.status || "Planned",
      progress: input.progress || 0,
      startDate: input.startDate,
      dueDate: input.dueDate,
      metadata: input.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { data: milestone, source: "demo" as const, isFallback: false };
  },

  async updateMilestone(milestoneId: string, input: Partial<TimelineMilestoneInput>) {
    const projectId = input.projectId || milestoneId.split("-milestone-")[0] || "PRJ-1048";
    const milestone = (await makeMilestones(projectId)).find((item) => item.id === milestoneId);
    if (!milestone) return { data: undefined as TimelineMilestone | undefined, source: "demo" as const, isFallback: false, error: "Milestone not found in demo data." };
    return { data: { ...milestone, ...input, updatedAt: new Date().toISOString() }, source: "demo" as const, isFallback: false };
  },

  async archiveMilestone(milestoneId: string) {
    return { data: Boolean(milestoneId), source: "demo" as const, isFallback: false };
  },

  async getDependencies(projectId: string) {
    return { data: await makeDependencies(projectId), source: "demo" as const, isFallback: false };
  },

  async createDependency(input: TaskDependencyInput) {
    const tasks = (await taskDemoAdapter.getTasks("PRJ-1048")).data;
    const predecessor = tasks.find((task) => task.id === input.predecessorTaskId);
    const successor = tasks.find((task) => task.id === input.successorTaskId);
    const dependency: TaskDependency = {
      id: `dependency-preview-${Date.now()}`,
      predecessorTaskId: input.predecessorTaskId,
      successorTaskId: input.successorTaskId,
      predecessorTitle: predecessor?.title,
      successorTitle: successor?.title,
      dependencyType: input.dependencyType,
      createdAt: new Date().toISOString()
    };
    return { data: dependency, source: "demo" as const, isFallback: false };
  },

  async removeDependency(dependencyId: string) {
    return { data: Boolean(dependencyId), source: "demo" as const, isFallback: false };
  }
};
