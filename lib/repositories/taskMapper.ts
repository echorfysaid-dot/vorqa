import type { Department as DomainDepartment, Employee, Task, TaskInput, TaskPriority, TaskStatus } from "@/lib/models";
import type { Department as SupabaseDepartment, Employee as SupabaseEmployee, Task as SupabaseTask } from "@/lib/supabase";

export type SupabaseTaskRecord = SupabaseTask & {
  departments?: Pick<SupabaseDepartment, "id" | "name"> | null;
  employees?: Pick<SupabaseEmployee, "id" | "first_name" | "last_name" | "job_title"> | null;
};

export const taskStatuses: TaskStatus[] = ["Todo", "In Progress", "Review", "Blocked", "Done"];
export const taskPriorities: TaskPriority[] = ["Low", "Medium", "High", "Critical"];

export function slugifyTask(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function toDomainStatus(status: string): TaskStatus {
  if (status === "in_progress") return "In Progress";
  if (status === "review") return "Review";
  if (status === "blocked") return "Blocked";
  if (status === "done") return "Done";
  return "Todo";
}

function toDatabaseStatus(status?: TaskStatus) {
  if (status === "In Progress") return "in_progress";
  if (status === "Review") return "review";
  if (status === "Blocked") return "blocked";
  if (status === "Done") return "done";
  return "todo";
}

function toDomainPriority(priority: string): TaskPriority {
  if (priority === "low") return "Low";
  if (priority === "high") return "High";
  if (priority === "critical") return "Critical";
  return "Medium";
}

function toDatabasePriority(priority?: TaskPriority) {
  if (priority === "Low") return "low";
  if (priority === "High") return "high";
  if (priority === "Critical") return "critical";
  return "medium";
}

export function mapSupabaseTaskToDomain(record: SupabaseTaskRecord): Task {
  return {
    id: record.id,
    projectId: record.project_id,
    organizationId: record.organization_id,
    departmentId: record.department_id || undefined,
    departmentName: record.departments?.name,
    assigneeEmployeeId: record.assignee_employee_id || undefined,
    assigneeId: record.assignee_employee_id || undefined,
    assigneeName: record.employees ? `${record.employees.first_name} ${record.employees.last_name}`.trim() : undefined,
    parentTaskId: record.parent_task_id || undefined,
    title: record.title,
    slug: record.slug || undefined,
    description: record.description || undefined,
    status: toDomainStatus(record.status),
    priority: toDomainPriority(record.priority),
    estimatedHours: record.estimated_hours ?? undefined,
    actualHours: record.actual_hours ?? undefined,
    progress: record.progress,
    startDate: record.start_date || undefined,
    dueDate: record.due_date || undefined,
    completedAt: record.completed_at || undefined,
    metadata: record.metadata || {},
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function mapTaskInputToSupabase(input: Partial<TaskInput>) {
  return {
    ...(input.projectId !== undefined ? { project_id: input.projectId } : {}),
    ...(input.organizationId !== undefined ? { organization_id: input.organizationId } : {}),
    ...(input.departmentId !== undefined ? { department_id: input.departmentId || null } : {}),
    ...(input.assigneeEmployeeId !== undefined ? { assignee_employee_id: input.assigneeEmployeeId || null } : {}),
    ...(input.parentTaskId !== undefined ? { parent_task_id: input.parentTaskId || null } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.slug !== undefined ? { slug: input.slug || null } : {}),
    ...(input.description !== undefined ? { description: input.description || null } : {}),
    ...(input.status !== undefined ? { status: toDatabaseStatus(input.status) } : {}),
    ...(input.priority !== undefined ? { priority: toDatabasePriority(input.priority) } : {}),
    ...(input.estimatedHours !== undefined ? { estimated_hours: input.estimatedHours ?? null } : {}),
    ...(input.actualHours !== undefined ? { actual_hours: input.actualHours ?? null } : {}),
    ...(input.progress !== undefined ? { progress: Math.max(0, Math.min(100, input.progress || 0)) } : {}),
    ...(input.startDate !== undefined ? { start_date: input.startDate || null } : {}),
    ...(input.dueDate !== undefined ? { due_date: input.dueDate || null } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata || {} } : {})
  };
}

export function makeDemoTask(input: {
  projectId: string;
  organizationId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  index: number;
  department?: DomainDepartment;
  assignee?: Employee;
}): Task {
  const dueDay = String(10 + input.index).padStart(2, "0");
  return {
    id: `${input.projectId}-task-${input.index}`,
    projectId: input.projectId,
    organizationId: input.organizationId,
    departmentId: input.department?.id,
    departmentName: input.department?.name,
    assigneeEmployeeId: input.assignee?.id,
    assigneeId: input.assignee?.id,
    assigneeName: input.assignee?.fullName || input.assignee?.name,
    title: input.title,
    slug: slugifyTask(input.title),
    description: `${input.title} task for construction delivery coordination.`,
    status: input.status,
    priority: input.priority,
    estimatedHours: [8, 12, 16, 24][input.index % 4],
    actualHours: input.status === "Done" ? [6, 10, 14, 20][input.index % 4] : undefined,
    progress: input.status === "Done" ? 100 : input.status === "Review" ? 82 : input.status === "In Progress" ? 48 : input.status === "Blocked" ? 22 : 0,
    startDate: `2026-07-${String(1 + input.index).padStart(2, "0")}`,
    dueDate: `2026-07-${dueDay}`,
    completedAt: input.status === "Done" ? `2026-07-${dueDay}T10:00:00.000Z` : undefined,
    metadata: {},
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-18T09:00:00.000Z"
  };
}
