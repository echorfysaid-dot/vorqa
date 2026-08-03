import type { Address, EntityId, OwnedEntity, Timestamped } from "./common";

export type OrganizationStatus = "Active" | "Pending invitation" | "Suspended organization" | "Archived";
export type OrganizationRole = "Owner" | "Admin" | "Member" | "Guest";
export type OrganizationType = "construction_company" | "engineering_office" | "architecture_studio" | "supplier_company" | "real_estate_developer";
export type OrganizationPermissionKey = "manage_organization" | "manage_roles" | "manage_members" | (string & {});
export type OrganizationMemberStatus = "Active" | "Pending invitation" | "Suspended" | "Removed";

export type OrganizationPermissions = Partial<Record<OrganizationPermissionKey, boolean>>;

export interface Organization extends Timestamped, OwnedEntity {
  id: EntityId;
  name: string;
  slug?: string;
  legalName?: string;
  registrationNumber?: string;
  taxNumber?: string;
  logo?: string;
  website?: string;
  type?: OrganizationType;
  industry: string;
  location: string;
  address?: Address;
  city?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  contactEmail?: string;
  contactPhone?: string;
  companySize?: string;
  employees: number;
  activeProjects: number;
  role: OrganizationRole;
  status: OrganizationStatus;
  workspace: string;
  recentProjects?: string[];
  teamSummary?: string;
}

export interface OrganizationRoleRecord extends Timestamped {
  id: EntityId;
  organizationId: EntityId;
  name: string;
  description?: string;
  permissions: OrganizationPermissions;
  isBuiltIn?: boolean;
  assignedMemberCount?: number;
}

export interface OrganizationMember extends Timestamped {
  id: EntityId;
  organizationId: EntityId;
  userId: EntityId;
  roleId?: EntityId;
  roleName?: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  status: OrganizationMemberStatus;
  joinedAt: string;
}

export interface OrganizationTeam extends Timestamped {
  id: EntityId;
  organizationId: EntityId;
  departmentId?: EntityId;
  name: string;
  description?: string;
  status: "Active" | "Inactive" | "Archived";
  memberCount?: number;
  projectCount?: number;
}

export interface OrganizationTeamMember {
  id: EntityId;
  teamId: EntityId;
  organizationMemberId: EntityId;
  status: "Active" | "Inactive" | "Removed";
  joinedAt: string;
}

export type OrganizationRoleInput = {
  organizationId: EntityId;
  name: string;
  description?: string;
  permissions?: OrganizationPermissions;
};

export type OrganizationMemberInput = {
  organizationId: EntityId;
  userId: EntityId;
  roleId?: EntityId;
  status?: OrganizationMemberStatus;
};
