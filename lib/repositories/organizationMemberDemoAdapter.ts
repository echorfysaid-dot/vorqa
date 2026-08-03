import { demoUsers } from "@/lib/data";
import type { OrganizationMember, OrganizationMemberInput } from "@/lib/models";
import { organizationRoleDemoAdapter } from "./organizationRoleDemoAdapter";

function makeMembers(organizationId: string): OrganizationMember[] {
  return demoUsers.map((user, index) => {
    const role = organizationRoleDemoAdapter.getDemoRoleForOrganization(
      organizationId,
      index === 0 ? "Owner" : index === 1 ? "Admin" : index === 2 ? "Project Manager" : "Member"
    );
    return {
      id: `${organizationId}-member-${index + 1}`,
      organizationId,
      userId: `demo-profile-${index + 1}`,
      roleId: role.id,
      roleName: role.name,
      fullName: user.name,
      email: `${user.name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.+$/g, "")}@atlas.demo`,
      status: index === 5 ? "Suspended" : "Active",
      joinedAt: `2026-01-${String(index + 5).padStart(2, "0")}T09:00:00.000Z`,
      createdAt: `2026-01-${String(index + 5).padStart(2, "0")}T09:00:00.000Z`
    };
  });
}

export const organizationMemberDemoAdapter = {
  async getOrganizationMembers(organizationId: string) {
    return { data: makeMembers(organizationId), source: "demo" as const, isFallback: false };
  },

  async getOrganizationMember(memberId: string) {
    const organizationId = memberId.split("-member-")[0] || "atlas";
    const member = makeMembers(organizationId).find((item) => item.id === memberId);
    return { data: member, source: "demo" as const, isFallback: false };
  },

  async addOrganizationMember(input: OrganizationMemberInput) {
    const role = input.roleId ? undefined : organizationRoleDemoAdapter.getDemoRoleForOrganization(input.organizationId, "Member");
    const member: OrganizationMember = {
      id: `${input.organizationId}-member-preview`,
      organizationId: input.organizationId,
      userId: input.userId,
      roleId: input.roleId || role?.id,
      roleName: role?.name || "Custom role",
      status: input.status || "Active",
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    return { data: member, source: "demo" as const, isFallback: false };
  },

  async updateOrganizationMember(memberId: string, input: Partial<OrganizationMemberInput>) {
    const organizationId = input.organizationId || memberId.split("-member-")[0] || "atlas";
    const existing = makeMembers(organizationId).find((item) => item.id === memberId);
    if (!existing) return { data: undefined, source: "demo" as const, isFallback: false, error: "Member not found in demo data." };
    return {
      data: {
        ...existing,
        roleId: input.roleId ?? existing.roleId,
        status: input.status ?? existing.status,
        updatedAt: new Date().toISOString()
      },
      source: "demo" as const,
      isFallback: false
    };
  },

  async removeOrganizationMember(memberId: string) {
    const organizationId = memberId.split("-member-")[0] || "atlas";
    const existing = makeMembers(organizationId).find((item) => item.id === memberId);
    const owner = existing?.roleName === "Owner";
    return {
      data: Boolean(existing && !owner),
      source: "demo" as const,
      isFallback: false,
      error: owner ? "Owner membership cannot be removed." : existing ? undefined : "Member not found in demo data."
    };
  }
};
