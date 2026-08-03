import type { ProjectMember, ProjectMemberRole, ProjectPermission } from "@/types/collaboration";

const members = new Map<string, ProjectMember>();

export const projectRoles: readonly ProjectMemberRole[] = Object.freeze(["owner", "manager", "engineer", "reviewer", "viewer"]);

export const projectRolePermissions: Readonly<Record<ProjectMemberRole, readonly ProjectPermission[]>> = Object.freeze({
  owner: ["view_project", "edit_project", "comment", "review", "manage_members", "export"],
  manager: ["view_project", "edit_project", "comment", "review", "manage_members", "export"],
  engineer: ["view_project", "edit_project", "comment", "export"],
  reviewer: ["view_project", "comment", "review", "export"],
  viewer: ["view_project", "export"]
});

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[key];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function memberKey(projectId: string, userId: string) {
  return `${projectId}:${userId}`;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "member";
}

export function normalizeProjectRole(role: unknown): ProjectMemberRole {
  return projectRoles.includes(role as ProjectMemberRole) ? (role as ProjectMemberRole) : "viewer";
}

export function upsertProjectMember(input: {
  projectId: string;
  ownerId: string;
  userId: string;
  role: ProjectMemberRole;
  status?: ProjectMember["status"];
  now?: Date;
}): ProjectMember {
  const now = (input.now || new Date()).toISOString();
  const key = memberKey(input.projectId, input.userId);
  const existing = members.get(key);
  const member = deepFreeze({
    id: existing?.id || `pm-${slug(input.projectId)}-${slug(input.userId)}`,
    projectId: input.projectId,
    ownerId: input.ownerId,
    userId: input.userId,
    role: input.role,
    status: input.status || existing?.status || "active",
    joinedAt: existing?.joinedAt || now,
    updatedAt: now
  });
  members.set(key, member);
  return member;
}

export function getProjectMember(projectId: string, userId: string): ProjectMember | undefined {
  return members.get(memberKey(projectId, userId));
}

export function listProjectMembers(projectId: string): readonly ProjectMember[] {
  return deepFreeze([...members.values()].filter((member) => member.projectId === projectId).sort((left, right) => left.userId.localeCompare(right.userId)));
}

export function removeProjectMember(projectId: string, userId: string, now = new Date()): ProjectMember | undefined {
  const existing = getProjectMember(projectId, userId);
  if (!existing) return undefined;
  const removed = deepFreeze({ ...existing, status: "removed" as const, updatedAt: now.toISOString() });
  members.set(memberKey(projectId, userId), removed);
  return removed;
}

export function hasProjectPermission(member: ProjectMember | undefined, permission: ProjectPermission) {
  if (!member || member.status !== "active") return false;
  return projectRolePermissions[member.role].includes(permission);
}

export function canViewProject(member: ProjectMember | undefined) {
  return hasProjectPermission(member, "view_project");
}

export function canEditProject(member: ProjectMember | undefined) {
  return hasProjectPermission(member, "edit_project");
}

export function canComment(member: ProjectMember | undefined) {
  return hasProjectPermission(member, "comment");
}

export function canReview(member: ProjectMember | undefined) {
  return hasProjectPermission(member, "review");
}

export function canManageMembers(member: ProjectMember | undefined) {
  return hasProjectPermission(member, "manage_members");
}

export function canExport(member: ProjectMember | undefined) {
  return hasProjectPermission(member, "export");
}

export function ensureProjectMember(input: { projectId: string; ownerId: string; userId: string; now?: Date }): ProjectMember {
  return getProjectMember(input.projectId, input.userId) || upsertProjectMember({ ...input, role: input.ownerId === input.userId ? "owner" : "viewer", status: "active" });
}

export function __resetProjectMembers() {
  members.clear();
}
