import type { ProjectAnalysisToolType } from "@/types/project-analysis";

export type ProjectMemberRole = "owner" | "manager" | "engineer" | "reviewer" | "viewer";
export type ProjectMemberStatus = "active" | "invited" | "removed" | "suspended";

export type ProjectPermission =
  | "view_project"
  | "edit_project"
  | "comment"
  | "review"
  | "manage_members"
  | "export";

export type ProjectMember = Readonly<{
  id: string;
  projectId: string;
  ownerId: string;
  userId: string;
  role: ProjectMemberRole;
  status: ProjectMemberStatus;
  joinedAt: string;
  updatedAt: string;
}>;

export type ProjectCommentStatus = "open" | "resolved" | "archived";

export type ProjectComment = Readonly<{
  id: string;
  projectId: string;
  ownerId: string;
  targetType: ProjectAnalysisToolType;
  targetId: string;
  threadId: string;
  authorId: string;
  body: string;
  status: ProjectCommentStatus;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type ProjectReviewStatus = "draft" | "in_review" | "approved" | "rejected" | "archived";

export type ProjectReview = Readonly<{
  id: string;
  projectId: string;
  ownerId: string;
  targetType: ProjectAnalysisToolType;
  targetId: string;
  status: ProjectReviewStatus;
  requestedBy: string;
  reviewerId?: string;
  decision?: "approved" | "rejected";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type ActivityTimelineEventType =
  | "analysis_created"
  | "analysis_updated"
  | "comment_added"
  | "comment_resolved"
  | "member_invited"
  | "member_removed"
  | "review_approved"
  | "review_rejected"
  | "document_uploaded"
  | "knowledge_indexed"
  | "copilot_conversation_started";

export type ActivityTimelineEvent = Readonly<{
  id: string;
  projectId: string;
  ownerId: string;
  actorId: string;
  type: ActivityTimelineEventType;
  target: string;
  createdAt: string;
  metadata: Readonly<Record<string, unknown>>;
}>;

export type AuditLogEvent = Readonly<{
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  metadata: Readonly<Record<string, unknown>>;
}>;

export type CollaborationActionResult<T> = Readonly<{
  ok: boolean;
  status: "success" | "failed";
  data?: T;
  error?: string;
  warnings: readonly string[];
}>;
