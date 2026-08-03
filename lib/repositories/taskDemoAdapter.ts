import type { Task, TaskInput } from "@/lib/models";
import { departmentDemoAdapter } from "./departmentDemoAdapter";
import { employeeDemoAdapter } from "./employeeDemoAdapter";
import { makeDemoTask, slugifyTask } from "./taskMapper";

const taskTitles = [
  "Site preparation",
  "Excavation",
  "Foundations",
  "Concrete works",
  "Steel reinforcement",
  "Electrical rough-in",
  "Plumbing rough-in",
  "Interior finishes",
  "QA review",
  "Final inspection"
] as const;

async function makeTasks(projectId: string): Promise<Task[]> {
  const organizationId = "atlas";
  const departments = (await departmentDemoAdapter.getDepartments(organizationId)).data;
  const employees = (await employeeDemoAdapter.getEmployees(organizationId)).data;
  const statuses = ["Todo", "In Progress", "Review", "Blocked", "Done"] as const;
  const priorities = ["Medium", "High", "Critical", "Low"] as const;
  return taskTitles.map((title, index) => makeDemoTask({
    projectId,
    organizationId,
    title,
    status: statuses[index % statuses.length],
    priority: priorities[index % priorities.length],
    index: index + 1,
    department: departments[index % departments.length],
    assignee: employees[index % employees.length]
  }));
}

export const taskDemoAdapter = {
  async getTasks(projectId: string) {
    return { data: await makeTasks(projectId), source: "demo" as const, isFallback: false };
  },

  async getTask(taskId: string) {
    const projectId = taskId.split("-task-")[0] || "PRJ-1048";
    const task = (await makeTasks(projectId)).find((item) => item.id === taskId);
    return { data: task, source: "demo" as const, isFallback: false };
  },

  async createTask(input: TaskInput) {
    const task: Task = {
      id: `${input.projectId}-task-preview-${Date.now()}`,
      projectId: input.projectId,
      organizationId: input.organizationId,
      departmentId: input.departmentId,
      assigneeEmployeeId: input.assigneeEmployeeId,
      assigneeId: input.assigneeEmployeeId,
      title: input.title,
      slug: input.slug || slugifyTask(input.title),
      description: input.description,
      status: input.status || "Todo",
      priority: input.priority || "Medium",
      estimatedHours: input.estimatedHours,
      actualHours: input.actualHours,
      progress: input.progress || 0,
      startDate: input.startDate,
      dueDate: input.dueDate,
      metadata: input.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { data: task, source: "demo" as const, isFallback: false };
  },

  async updateTask(taskId: string, input: Partial<TaskInput>) {
    const projectId = input.projectId || taskId.split("-task-")[0] || "PRJ-1048";
    const task = (await makeTasks(projectId)).find((item) => item.id === taskId);
    if (!task) return { data: undefined, source: "demo" as const, isFallback: false, error: "Task not found in demo data." };
    return { data: { ...task, ...input, updatedAt: new Date().toISOString() }, source: "demo" as const, isFallback: false };
  },

  async archiveTask(taskId: string) {
    return { data: Boolean(taskId), source: "demo" as const, isFallback: false };
  }
};
