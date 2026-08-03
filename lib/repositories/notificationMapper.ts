import type {
  Notification,
  NotificationActionResult,
  NotificationFilters,
  NotificationPreference,
  NotificationPriority,
  NotificationStatus,
  NotificationSummary,
  NotificationType
} from "@/lib/models";

export type NotificationRow = {
  id: string;
  owner_id?: string | null;
  organization_id?: string | null;
  project_id?: string | null;
  recipient_id?: string | null;
  title: string;
  message: string;
  type: string;
  module?: string | null;
  priority: string;
  status: string;
  context?: string | null;
  href?: string | null;
  related_entity_id?: string | null;
  related_entity_type?: string | null;
  scheduled_for?: string | null;
  expires_at?: string | null;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type NotificationPreferenceRow = {
  id: string;
  profile_id?: string | null;
  organization_id?: string | null;
  in_app_enabled?: boolean | null;
  email_enabled?: boolean | null;
  push_enabled?: boolean | null;
  sms_enabled?: boolean | null;
  muted_modules?: string[] | null;
  minimum_priority?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const notificationTypes: NotificationType[] = [
  "Project",
  "Task",
  "Milestone",
  "Budget",
  "Document",
  "Knowledge",
  "Marketplace",
  "Connection",
  "Message",
  "RFQ",
  "Quotation",
  "Award",
  "Contract",
  "Approval",
  "Payment",
  "VORA AI",
  "System"
];

const priorities: NotificationPriority[] = ["Low", "Normal", "Medium", "High", "Critical"];
const statuses: NotificationStatus[] = ["Unread", "Read", "Archived", "Deleted"];

export function toNotificationType(value: string | null | undefined): NotificationType {
  return notificationTypes.includes(value as NotificationType) ? (value as NotificationType) : "System";
}

export function toNotificationPriority(value: string | null | undefined): NotificationPriority {
  return priorities.includes(value as NotificationPriority) ? (value as NotificationPriority) : "Normal";
}

export function toNotificationStatus(value: string | null | undefined): NotificationStatus {
  return statuses.includes(value as NotificationStatus) ? (value as NotificationStatus) : "Unread";
}

export function mapNotificationRow(row: NotificationRow): Notification {
  const status = toNotificationStatus(row.status);
  const type = toNotificationType(row.type);
  return {
    id: row.id,
    ownerId: row.owner_id || undefined,
    organizationId: row.organization_id || undefined,
    projectId: row.project_id || undefined,
    recipientId: row.recipient_id || undefined,
    title: row.title,
    message: row.message,
    type,
    module: row.module || type,
    priority: toNotificationPriority(row.priority),
    status,
    read: status === "Read" || status === "Archived",
    context: row.context || undefined,
    actionHref: row.href || undefined,
    href: row.href || undefined,
    relatedEntityId: row.related_entity_id || undefined,
    relatedEntityType: row.related_entity_type || undefined,
    scheduledFor: row.scheduled_for || undefined,
    expiresAt: row.expires_at || undefined,
    source: row.source === "user" || row.source === "vora" || row.source === "integration" ? row.source : "system",
    metadata: row.metadata || undefined,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined
  };
}

export function mapPreferenceRow(row: NotificationPreferenceRow): NotificationPreference {
  return {
    id: row.id,
    profileId: row.profile_id || undefined,
    organizationId: row.organization_id || undefined,
    inAppEnabled: row.in_app_enabled ?? true,
    emailEnabled: row.email_enabled ?? false,
    pushEnabled: row.push_enabled ?? false,
    smsEnabled: row.sms_enabled ?? false,
    mutedModules: (row.muted_modules || []).map(toNotificationType),
    minimumPriority: toNotificationPriority(row.minimum_priority),
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined
  };
}

export function mapNotificationToRow(input: Partial<Notification>): Partial<NotificationRow> {
  return {
    owner_id: input.ownerId,
    organization_id: input.organizationId,
    project_id: input.projectId,
    recipient_id: input.recipientId,
    title: input.title,
    message: input.message,
    type: input.type,
    module: typeof input.module === "string" ? input.module : input.type,
    priority: input.priority,
    status: input.status,
    context: input.context,
    href: input.href || input.actionHref,
    related_entity_id: input.relatedEntityId,
    related_entity_type: input.relatedEntityType,
    scheduled_for: input.scheduledFor,
    expires_at: input.expiresAt,
    source: input.source,
    metadata: input.metadata,
    updated_at: new Date().toISOString()
  };
}

export function filterNotifications(notifications: Notification[], filters: NotificationFilters = {}) {
  const query = filters.query?.trim().toLowerCase();
  return notifications.filter((item) => {
    if (item.status === "Deleted") return false;
    if (filters.status && filters.status !== "All" && item.status !== filters.status) return false;
    if (filters.priority && filters.priority !== "All" && item.priority !== filters.priority) return false;
    if (filters.type && filters.type !== "All" && item.type !== filters.type) return false;
    if (filters.module && filters.module !== "All" && item.module !== filters.module) return false;
    if (!query) return true;
    return [item.title, item.message, item.context, item.type, item.module].some((value) => value?.toLowerCase().includes(query));
  });
}

export function paginateNotifications(notifications: Notification[], filters: NotificationFilters = {}) {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.max(1, filters.pageSize || 20);
  return notifications.slice((page - 1) * pageSize, page * pageSize);
}

export function buildNotificationSummary(notifications: Notification[]): NotificationSummary {
  const active = notifications.filter((item) => item.status !== "Deleted");
  return {
    total: active.length,
    unread: active.filter((item) => item.status === "Unread").length,
    read: active.filter((item) => item.status === "Read").length,
    archived: active.filter((item) => item.status === "Archived").length,
    critical: active.filter((item) => item.priority === "Critical").length,
    highPriority: active.filter((item) => item.priority === "High" || item.priority === "Critical").length,
    reminders: active.filter((item) => Boolean(item.scheduledFor)).length,
    aiAlerts: active.filter((item) => item.type === "VORA AI" || item.source === "vora").length,
    byType: active.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {}),
    recent: [...active].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5)
  };
}

export function okAction(id?: string): NotificationActionResult {
  return { ok: true, id };
}
