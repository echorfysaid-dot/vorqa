export type SupabaseTable =
  | "profiles"
  | "projects"
  | "documents"
  | "generation_history"
  | "favorites"
  | "user_settings"
  | "knowledge_files"
  | "knowledge_articles"
  | "organizations"
  | "organization_roles"
  | "organization_members"
  | "organization_teams"
  | "organization_team_members"
  | "departments"
  | "employees"
  | "tasks"
  | "milestones"
  | "task_dependencies"
  | "budget_categories"
  | "project_budget_items";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: "starter" | "pro" | "business";
  preferred_language: "ar" | "fr" | "en";
  created_at: string;
};

export type Project = {
  id: string;
  owner_id: string;
  organization_id?: string | null;
  project_manager_id?: string | null;
  department_id?: string | null;
  team_id?: string | null;
  slug?: string | null;
  description?: string | null;
  title: string;
  type: "document" | "cv" | "landing_page" | "business_idea" | "marketing";
  status: "draft" | "saved" | "archived";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  employee_id: string;
  role: string | null;
  joined_at: string;
  status: "active" | "inactive" | "removed";
};

export type Document = {
  id: string;
  owner_id: string;
  project_id: string | null;
  organization_id?: string | null;
  department_id?: string | null;
  uploader_id?: string | null;
  title: string;
  content: string;
  language: "ar" | "fr" | "en";
  document_type: string;
  category?: string | null;
  version?: string | null;
  filename?: string | null;
  storage_path?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  tags?: string[];
  archived?: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type GenerationHistory = {
  id: string;
  owner_id: string;
  project_id: string | null;
  tool_slug: string;
  provider: "mock" | "openai" | "anthropic" | "gemini" | "openrouter";
  input_payload: Record<string, unknown>;
  output_content: string;
  created_at: string;
};

export type Favorite = {
  id: string;
  owner_id: string;
  generation_id: string;
  created_at: string;
};

export type UserSettings = {
  owner_id: string;
  theme: "light" | "dark" | "system";
  default_provider: "openai" | "anthropic" | "gemini" | "openrouter" | "mock";
  notifications_enabled: boolean;
  updated_at: string;
};

export type KnowledgeFile = {
  id: string;
  owner_id: string;
  project_id: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size: number;
  status: "uploaded" | "processing" | "failed";
  created_at: string;
};

export type KnowledgeArticle = {
  id: string;
  organization_id: string;
  project_id: string | null;
  document_id: string | null;
  title: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  tags: string[];
  status: "draft" | "published" | "archived";
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  registration_number: string | null;
  tax_number: string | null;
  website: string | null;
  logo_url: string | null;
  industry: string | null;
  company_size: string | null;
  address: Record<string, unknown>;
  city: string | null;
  country: string | null;
  timezone: string;
  currency: string;
  contact_email: string | null;
  contact_phone: string | null;
  owner_id: string;
  status: "active" | "invited" | "suspended" | "archived";
  created_at: string;
  updated_at: string;
};

export type OrganizationRole = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  permissions: Record<string, unknown>;
  created_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role_id: string | null;
  joined_at: string;
  status: "active" | "invited" | "suspended" | "removed";
};

export type Department = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  lead_user_id: string | null;
  status: "active" | "suspended" | "archived";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Employee = {
  id: string;
  organization_id: string;
  department_id: string | null;
  profile_id: string | null;
  manager_id: string | null;
  employee_number: string | null;
  first_name: string;
  last_name: string;
  job_title: string | null;
  phone: string | null;
  employment_type: string | null;
  status: "active" | "away" | "pending" | "inactive" | "archived";
  hire_date: string | null;
  avatar_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  project_id: string;
  organization_id: string;
  department_id: string | null;
  assignee_employee_id: string | null;
  parent_task_id: string | null;
  title: string;
  slug: string | null;
  description: string | null;
  status: "todo" | "in_progress" | "review" | "blocked" | "done" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  estimated_hours: number | null;
  actual_hours: number | null;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Milestone = {
  id: string;
  project_id: string;
  organization_id: string;
  title: string;
  description: string | null;
  status: "planned" | "in_progress" | "completed" | "delayed" | "archived";
  progress: number;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type TaskDependency = {
  id: string;
  predecessor_task_id: string;
  successor_task_id: string;
  dependency_type: "finish_to_start" | "start_to_start" | "finish_to_finish" | "start_to_finish";
  created_at: string;
};

export type BudgetCategory = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectBudgetItem = {
  id: string;
  project_id: string;
  organization_id: string;
  category_id: string | null;
  department_id: string | null;
  title: string;
  description: string | null;
  planned_cost: number;
  actual_cost: number;
  committed_cost: number;
  status: "planned" | "approved" | "committed" | "paid" | "over_budget" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  start_date: string | null;
  end_date: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export const supabaseEnv = {
  url: "NEXT_PUBLIC_SUPABASE_URL",
  anonKey: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  serviceRole: "SUPABASE_SERVICE_ROLE_KEY"
} as const;

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
