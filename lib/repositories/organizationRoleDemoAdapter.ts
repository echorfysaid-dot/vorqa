import type { OrganizationRoleInput, OrganizationRoleRecord } from "@/lib/models";
import { supportedOrganizationPermissions } from "./organizationRoleMapper";

function makeRoles(organizationId: string): OrganizationRoleRecord[] {
  return [
    {
      id: `${organizationId}-owner-role`,
      organizationId,
      name: "Owner",
      description: "Full organization control and ownership.",
      permissions: { manage_organization: true, manage_roles: true, manage_members: true },
      isBuiltIn: true,
      assignedMemberCount: 1,
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: `${organizationId}-admin-role`,
      organizationId,
      name: "Admin",
      description: "Can manage organization settings, roles, and members.",
      permissions: { manage_organization: true, manage_roles: true, manage_members: true },
      isBuiltIn: true,
      assignedMemberCount: 2,
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: `${organizationId}-manager-role`,
      organizationId,
      name: "Project Manager",
      description: "Can manage members and coordinate delivery teams.",
      permissions: { manage_members: true },
      isBuiltIn: false,
      assignedMemberCount: 3,
      createdAt: "2026-01-02T00:00:00.000Z"
    },
    {
      id: `${organizationId}-member-role`,
      organizationId,
      name: "Member",
      description: "Can view organization workspace content.",
      permissions: {},
      isBuiltIn: true,
      assignedMemberCount: 6,
      createdAt: "2026-01-01T00:00:00.000Z"
    }
  ];
}

export const organizationRoleDemoAdapter = {
  async getOrganizationRoles(organizationId: string) {
    return { data: makeRoles(organizationId), source: "demo" as const, isFallback: false };
  },

  async getOrganizationRole(roleId: string) {
    const organizationId = roleId.split("-").slice(0, -2).join("-") || "atlas";
    const role = makeRoles(organizationId).find((item) => item.id === roleId);
    return { data: role, source: "demo" as const, isFallback: false };
  },

  async createOrganizationRole(input: OrganizationRoleInput) {
    const role: OrganizationRoleRecord = {
      id: `${input.organizationId}-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-role`,
      organizationId: input.organizationId,
      name: input.name,
      description: input.description,
      permissions: Object.fromEntries(supportedOrganizationPermissions.map((permission) => [permission, Boolean(input.permissions?.[permission])])),
      isBuiltIn: false,
      assignedMemberCount: 0,
      createdAt: new Date().toISOString()
    };
    return { data: role, source: "demo" as const, isFallback: false };
  },

  async updateOrganizationRole(roleId: string, input: Partial<OrganizationRoleInput>) {
    const organizationId = input.organizationId || roleId.split("-").slice(0, -2).join("-") || "atlas";
    const existing = makeRoles(organizationId).find((item) => item.id === roleId);
    if (!existing) return { data: undefined, source: "demo" as const, isFallback: false, error: "Role not found in demo data." };
    return {
      data: {
        ...existing,
        ...input,
        organizationId,
        permissions: input.permissions || existing.permissions,
        updatedAt: new Date().toISOString()
      },
      source: "demo" as const,
      isFallback: false
    };
  },

  async deleteOrganizationRole(roleId: string) {
    const organizationId = roleId.split("-").slice(0, -2).join("-") || "atlas";
    const role = makeRoles(organizationId).find((item) => item.id === roleId);
    const protectedRole = !role || role.isBuiltIn || role.assignedMemberCount;
    return {
      data: Boolean(role && !protectedRole),
      source: "demo" as const,
      isFallback: false,
      error: protectedRole ? "Built-in or assigned roles cannot be deleted." : undefined
    };
  },

  getDemoRoleForOrganization(organizationId: string, preferredName = "Member") {
    return makeRoles(organizationId).find((role) => role.name === preferredName) || makeRoles(organizationId)[0];
  }
};
