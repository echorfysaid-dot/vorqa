import type { OrganizationPermissionKey, OrganizationPermissions, OrganizationRoleInput, OrganizationRoleRecord } from "@/lib/models";
import type { OrganizationRole as SupabaseOrganizationRole } from "@/lib/supabase";

export const organizationPermissionLabels: Record<"manage_organization" | "manage_roles" | "manage_members", string> = {
  manage_organization: "Manage organization",
  manage_roles: "Manage roles",
  manage_members: "Manage members"
};

export const supportedOrganizationPermissions = Object.keys(organizationPermissionLabels) as Array<keyof typeof organizationPermissionLabels>;

export type SupabaseOrganizationRoleRecord = SupabaseOrganizationRole & {
  organization_members?: Array<{ id: string }>;
};

export function normalizePermissions(value: unknown): OrganizationPermissions {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, permissionValue]) => [key as OrganizationPermissionKey, Boolean(permissionValue)])
  ) as OrganizationPermissions;
}

export function mapSupabaseRoleToDomain(record: SupabaseOrganizationRoleRecord): OrganizationRoleRecord {
  return {
    id: record.id,
    organizationId: record.organization_id,
    name: record.name,
    description: record.description || undefined,
    permissions: normalizePermissions(record.permissions),
    isBuiltIn: ["Owner", "Admin", "Member"].includes(record.name),
    assignedMemberCount: record.organization_members?.length,
    createdAt: record.created_at
  };
}

export function mapRoleInputToSupabase(input: Partial<OrganizationRoleInput>) {
  return {
    ...(input.organizationId !== undefined ? { organization_id: input.organizationId } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description || null } : {}),
    ...(input.permissions !== undefined ? { permissions: input.permissions || {} } : {})
  };
}
