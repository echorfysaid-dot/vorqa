import { recordActivity } from "@/lib/activity-timeline";
import { canReview, ensureProjectMember } from "@/lib/project-members";
import type { ProjectAnalysisToolType } from "@/types/project-analysis";
import type { CollaborationActionResult, ProjectReview, ProjectReviewStatus } from "@/types/collaboration";

const reviews = new Map<string, ProjectReview>();

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
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "review";
}

function result<T>(ok: boolean, data?: T, error?: string, warnings: readonly string[] = []): CollaborationActionResult<T> {
  return deepFreeze({ ok, status: ok ? "success" : "failed", data, error, warnings });
}

export function createProjectReview(input: {
  projectId: string;
  ownerId: string;
  requestedBy: string;
  targetType: ProjectAnalysisToolType;
  targetId: string;
  reviewerId?: string;
  status?: ProjectReviewStatus;
  now?: Date;
}): CollaborationActionResult<ProjectReview> {
  const member = ensureProjectMember({ projectId: input.projectId, ownerId: input.ownerId, userId: input.requestedBy, now: input.now });
  if (!canReview(member)) return result(false, undefined, "Permission denied.");
  const now = (input.now || new Date()).toISOString();
  const id = `review-${slug(input.projectId)}-${reviews.size + 1}`;
  const review = deepFreeze({
    id,
    projectId: input.projectId,
    ownerId: input.ownerId,
    targetType: input.targetType,
    targetId: input.targetId,
    status: input.status || "in_review",
    requestedBy: input.requestedBy,
    reviewerId: input.reviewerId,
    createdAt: now,
    updatedAt: now
  });
  reviews.set(id, review);
  recordActivity({
    projectId: input.projectId,
    ownerId: input.ownerId,
    actorId: input.requestedBy,
    type: "analysis_updated",
    target: input.targetId,
    metadata: { reviewId: id, reviewStatus: review.status, targetType: input.targetType },
    now: input.now
  });
  return result(true, review);
}

export function transitionProjectReview(input: {
  projectId: string;
  ownerId: string;
  actorId: string;
  reviewId: string;
  status: Extract<ProjectReviewStatus, "approved" | "rejected" | "archived" | "draft" | "in_review">;
  notes?: string;
  now?: Date;
}): CollaborationActionResult<ProjectReview> {
  const review = reviews.get(input.reviewId);
  if (!review || review.projectId !== input.projectId) return result(false, undefined, "Review unavailable.");
  const member = ensureProjectMember({ projectId: input.projectId, ownerId: input.ownerId, userId: input.actorId, now: input.now });
  if (!canReview(member)) return result(false, undefined, "Permission denied.");

  const updated = deepFreeze({
    ...review,
    status: input.status,
    reviewerId: review.reviewerId || input.actorId,
    decision: input.status === "approved" || input.status === "rejected" ? input.status : review.decision,
    notes: input.notes || review.notes,
    updatedAt: (input.now || new Date()).toISOString()
  });
  reviews.set(input.reviewId, updated);
  if (input.status === "approved" || input.status === "rejected") {
    recordActivity({
      projectId: input.projectId,
      ownerId: input.ownerId,
      actorId: input.actorId,
      type: input.status === "approved" ? "review_approved" : "review_rejected",
      target: review.targetId,
      metadata: { reviewId: input.reviewId, targetType: review.targetType, notes: input.notes },
      now: input.now
    });
  }
  return result(true, updated);
}

export function listProjectReviews(projectId: string): readonly ProjectReview[] {
  return deepFreeze([...reviews.values()]
    .filter((review) => review.projectId === projectId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id)));
}

export function __resetProjectReviews() {
  reviews.clear();
}
