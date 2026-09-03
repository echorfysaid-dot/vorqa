import type { DocumentWorkflowState, ValidationWorkflowState } from "@/types/project-stage-gate";

export type WorkflowMetadata = Record<string, unknown> | undefined;
export type WorkflowEvidenceStatus = "uploaded" | "submitted" | "waiting_validation" | "approved" | "rejected" | "correction_required" | "missing" | "unavailable";

export function normalizeWorkflowToken(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") : "";
}

export function workflowMetadataString(metadata: WorkflowMetadata, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function workflowMetadataBoolean(metadata: WorkflowMetadata, ...keys: string[]) {
  for (const key of keys) if (typeof metadata?.[key] === "boolean") return Boolean(metadata[key]);
  return undefined;
}

export function workflowMetadataStrings(metadata: WorkflowMetadata, ...keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim());
  }
  return [];
}

export function normalizeWorkflowValidationStatus(value: unknown): ValidationWorkflowState | "submitted" {
  const normalized = normalizeWorkflowToken(value);
  if (["approved", "accepted", "validated"].includes(normalized)) return "approved";
  if (normalized === "rejected") return "rejected";
  if (["correction_required", "correction", "returned"].includes(normalized)) return "correction_required";
  if (["under_review", "in_review", "awaiting_review", "pending_review", "waiting_validation"].includes(normalized)) return "under_review";
  if (normalized === "submitted") return "submitted";
  if (normalized === "requested") return "requested";
  if (["cancelled", "canceled"].includes(normalized)) return "cancelled";
  return "unavailable";
}

export function normalizeWorkflowEvidenceStatus(value: unknown): WorkflowEvidenceStatus | undefined {
  const normalized = normalizeWorkflowToken(value);
  if (["uploaded", "submitted", "approved", "rejected", "correction_required", "missing", "unavailable"].includes(normalized)) return normalized as WorkflowEvidenceStatus;
  if (["waiting_validation", "awaiting_review", "pending_review", "in_review", "under_review"].includes(normalized)) return "waiting_validation";
  return undefined;
}

export function normalizeWorkflowDocumentStatus(input: Readonly<{
  metadata?: WorkflowMetadata;
  status?: unknown;
  archived?: boolean;
  storagePath?: string;
  filename?: string;
}>): DocumentWorkflowState {
  const explicit = normalizeWorkflowToken(workflowMetadataString(input.metadata, "documentWorkflowState", "workflowStatus", "documentStatus", "validationStatus", "approvalStatus", "reviewStatus"));
  if (["approved", "rejected", "correction_required", "superseded", "submitted", "under_review", "draft"].includes(explicit)) return explicit as DocumentWorkflowState;
  if (["awaiting_review", "pending_review", "in_review", "waiting_validation"].includes(explicit)) return "under_review";
  if (input.archived || normalizeWorkflowToken(input.status) === "archived") return "superseded";
  if (normalizeWorkflowToken(input.status) === "draft") return "draft";
  if (input.storagePath || input.filename || normalizeWorkflowToken(input.status) === "saved") return "uploaded";
  return "unavailable";
}