import { recordActivity } from "@/lib/activity-timeline";
import { canComment, ensureProjectMember } from "@/lib/project-members";
import type { ProjectAnalysisToolType } from "@/types/project-analysis";
import type { CollaborationActionResult, ProjectComment } from "@/types/collaboration";

const comments = new Map<string, ProjectComment>();

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[key];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "comment";
}

function result<T>(ok: boolean, data?: T, error?: string, warnings: readonly string[] = []): CollaborationActionResult<T> {
  return deepFreeze({ ok, status: ok ? "success" : "failed", data, error, warnings });
}

export function addProjectComment(input: {
  projectId: string;
  ownerId: string;
  authorId: string;
  targetType: ProjectAnalysisToolType;
  targetId: string;
  body: string;
  threadId?: string;
  now?: Date;
}): CollaborationActionResult<ProjectComment> {
  const member = ensureProjectMember({ projectId: input.projectId, ownerId: input.ownerId, userId: input.authorId, now: input.now });
  if (!canComment(member)) return result(false, undefined, "Permission denied.");
  if (!input.body.trim()) return result(false, undefined, "Comment body is required.");

  const now = (input.now || new Date()).toISOString();
  const id = `comment-${slug(input.projectId)}-${comments.size + 1}`;
  const comment = deepFreeze({
    id,
    projectId: input.projectId,
    ownerId: input.ownerId,
    targetType: input.targetType,
    targetId: input.targetId,
    threadId: input.threadId || `thread-${slug(input.targetId)}`,
    authorId: input.authorId,
    body: input.body.trim(),
    status: "open" as const,
    resolved: false,
    createdAt: now,
    updatedAt: now
  });
  comments.set(id, comment);
  recordActivity({
    projectId: input.projectId,
    ownerId: input.ownerId,
    actorId: input.authorId,
    type: "comment_added",
    target: input.targetId,
    metadata: { commentId: id, targetType: input.targetType },
    now: input.now
  });
  return result(true, comment);
}

export function resolveProjectComment(input: { projectId: string; ownerId: string; userId: string; commentId: string; now?: Date }): CollaborationActionResult<ProjectComment> {
  const comment = comments.get(input.commentId);
  if (!comment || comment.projectId !== input.projectId) return result(false, undefined, "Comment unavailable.");
  const member = ensureProjectMember({ projectId: input.projectId, ownerId: input.ownerId, userId: input.userId, now: input.now });
  if (!canComment(member)) return result(false, undefined, "Permission denied.");
  const updated = deepFreeze({ ...comment, status: "resolved" as const, resolved: true, updatedAt: (input.now || new Date()).toISOString() });
  comments.set(input.commentId, updated);
  recordActivity({
    projectId: input.projectId,
    ownerId: input.ownerId,
    actorId: input.userId,
    type: "comment_resolved",
    target: comment.targetId,
    metadata: { commentId: input.commentId, targetType: comment.targetType },
    now: input.now
  });
  return result(true, updated);
}

export function listProjectComments(projectId: string): readonly ProjectComment[] {
  return deepFreeze([...comments.values()]
    .filter((comment) => comment.projectId === projectId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id)));
}

export function __resetProjectComments() {
  comments.clear();
}
