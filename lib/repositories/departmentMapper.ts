import type { Department, DepartmentInput, DepartmentStatus } from "@/lib/models";
import type { Department as SupabaseDepartment, Profile } from "@/lib/supabase";

export type SupabaseDepartmentRecord = SupabaseDepartment & {
  profiles?: Pick<Profile, "id" | "email" | "full_name" | "avatar_url"> | null;
};

export function toDepartmentStatus(status?: string | null): DepartmentStatus {
  if (status === "suspended") return "Suspended";
  if (status === "archived") return "Archived";
  if (status === "Excellent" || status === "Healthy" || status === "Watch" || status === "At risk") return status;
  return "Active";
}

function toDatabaseStatus(status?: DepartmentStatus | string) {
  if (status === "Archived") return "archived";
  if (status === "Suspended") return "suspended";
  return "active";
}

export function mapSupabaseDepartmentToDomain(record: SupabaseDepartmentRecord): Department {
  return {
    id: record.id,
    organizationId: record.organization_id,
    name: record.name,
    slug: record.slug,
    description: record.description || undefined,
    leadUserId: record.lead_user_id || undefined,
    leadName: record.profiles?.full_name || record.profiles?.email || undefined,
    lead: record.profiles?.full_name || record.profiles?.email || "Unassigned",
    memberCount: typeof record.metadata?.memberCount === "number" ? record.metadata.memberCount : undefined,
    activeProjectCount: typeof record.metadata?.activeProjectCount === "number" ? record.metadata.activeProjectCount : undefined,
    workload: typeof record.metadata?.workload === "number" ? record.metadata.workload : 0,
    priorities: Array.isArray(record.metadata?.priorities) ? record.metadata.priorities.filter((item): item is string => typeof item === "string") : [],
    status: toDepartmentStatus(record.status),
    metadata: record.metadata || {},
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function mapDepartmentInputToSupabase(input: Partial<DepartmentInput>) {
  return {
    ...(input.organizationId !== undefined ? { organization_id: input.organizationId } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.description !== undefined ? { description: input.description || null } : {}),
    ...(input.leadUserId !== undefined ? { lead_user_id: input.leadUserId || null } : {}),
    ...(input.status !== undefined ? { status: toDatabaseStatus(input.status) } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata || {} } : {})
  };
}

export function slugifyDepartment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
