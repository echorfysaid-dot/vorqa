import type { OrganizationMember, OrganizationMemberInput, OrganizationMemberStatus } from "@/lib/models";
import type { OrganizationMember as SupabaseOrganizationMember, OrganizationRole, Profile } from "@/lib/supabase";

export type SupabaseOrganizationMemberRecord = SupabaseOrganizationMember & {
  profiles?: Pick<Profile, "id" | "email" | "full_name" | "avatar_url"> | null;
  organization_roles?: Pick<OrganizationRole, "id" | "name"> | null;
};

function toDomainStatus(status: string): OrganizationMemberStatus {
  if (status === "invited") return "Pending invitation";
  if (status === "suspended") return "Suspended";
  if (status === "removed") return "Removed";
  return "Active";
}

function toDatabaseStatus(status?: OrganizationMemberStatus) {
  if (status === "Pending invitation") return "invited";
  if (status === "Suspended") return "suspended";
  if (status === "Removed") return "removed";
  return "active";
}

export function mapSupabaseMemberToDomain(record: SupabaseOrganizationMemberRecord): OrganizationMember {
  return {
    id: record.id,
    organizationId: record.organization_id,
    userId: record.user_id,
    roleId: record.role_id || undefined,
    roleName: record.organization_roles?.name,
    fullName: record.profiles?.full_name || undefined,
    email: record.profiles?.email || undefined,
    avatarUrl: record.profiles?.avatar_url || undefined,
    status: toDomainStatus(record.status),
    joinedAt: record.joined_at,
    createdAt: record.joined_at
  };
}

export function mapMemberInputToSupabase(input: Partial<OrganizationMemberInput>) {
  return {
    ...(input.organizationId !== undefined ? { organization_id: input.organizationId } : {}),
    ...(input.userId !== undefined ? { user_id: input.userId } : {}),
    ...(input.roleId !== undefined ? { role_id: input.roleId || null } : {}),
    ...(input.status !== undefined ? { status: toDatabaseStatus(input.status) } : {})
  };
}
