import { listProjectActivity, recordActivity } from "@/lib/activity-timeline";
import { listAuditEvents } from "@/lib/audit-log";
import { addProjectComment, listProjectComments, resolveProjectComment } from "@/lib/project-comments";
import {
  canComment,
  canEditProject,
  canExport,
  canManageMembers,
  canReview,
  canViewProject,
  ensureProjectMember,
  getProjectMember,
  listProjectMembers,
  removeProjectMember,
  upsertProjectMember
} from "@/lib/project-members";
import { createProjectReview, listProjectReviews, transitionProjectReview } from "@/lib/project-review";
import type { ProjectMemberRole } from "@/types/collaboration";

export const collaborationEngine = Object.freeze({
  members: {
    ensure: ensureProjectMember,
    upsert: upsertProjectMember,
    get: getProjectMember,
    list: listProjectMembers,
    remove: removeProjectMember
  },
  permissions: {
    canViewProject,
    canEditProject,
    canComment,
    canReview,
    canManageMembers,
    canExport
  },
  comments: {
    add: addProjectComment,
    resolve: resolveProjectComment,
    list: listProjectComments
  },
  reviews: {
    create: createProjectReview,
    transition: transitionProjectReview,
    list: listProjectReviews
  },
  activity: {
    record: recordActivity,
    list: listProjectActivity
  },
  audit: {
    list: listAuditEvents
  }
});

export function createProjectPermissionSnapshot(input: { projectId: string; ownerId: string; userId: string; role?: ProjectMemberRole; now?: Date }) {
  const member = input.role
    ? upsertProjectMember({ projectId: input.projectId, ownerId: input.ownerId, userId: input.userId, role: input.role, status: "active", now: input.now })
    : ensureProjectMember(input);
  return Object.freeze({
    member,
    permissions: {
      viewProject: canViewProject(member),
      editProject: canEditProject(member),
      comment: canComment(member),
      review: canReview(member),
      manageMembers: canManageMembers(member),
      export: canExport(member)
    }
  });
}
