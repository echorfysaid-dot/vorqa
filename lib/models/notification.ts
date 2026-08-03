import type { EntityId, OwnedEntity, Timestamped } from "./common";

export type NotificationType =
  | "Project"
  | "Task"
  | "Milestone"
  | "Budget"
  | "Document"
  | "Knowledge"
  | "Marketplace"
  | "Connection"
  | "Message"
  | "RFQ"
  | "Quotation"
  | "Award"
  | "Contract"
  | "Approval"
  | "Payment"
  | "VORA AI"
  | "System";

export type NotificationPriority = "Low" | "Normal" | "Medium" | "High" | "Critical";
export type NotificationStatus = "Unread" | "Read" | "Archived" | "Deleted";
export type NotificationChannel = "in_app" | "email" | "push" | "sms";
export type NotificationCategory = "Projects" | "Tasks" | "Documents" | "Approvals" | "Budget" | "AI" | "Organization" | "Security";

export interface NotificationRecipient extends Timestamped {
  id: EntityId;
  notificationId: EntityId;
  profileId?: EntityId;
  organizationId?: EntityId;
  status: NotificationStatus;
  deliveryChannels: NotificationChannel[];
  readAt?: string;
  archivedAt?: string;
}

export interface NotificationPreference extends Timestamped {
  id: EntityId;
  profileId?: EntityId;
  organizationId?: EntityId;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  mutedModules: NotificationType[];
  minimumPriority: NotificationPriority;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  read: number;
  archived: number;
  critical: number;
  highPriority: number;
  reminders: number;
  aiAlerts: number;
  byType: Record<string, number>;
  recent: Notification[];
}

export interface Notification extends Timestamped, OwnedEntity {
  id: EntityId;
  title: string;
  message: string;
  type: NotificationType;
  category?: NotificationCategory | string;
  module: NotificationType | string;
  priority: NotificationPriority;
  status: NotificationStatus;
  read: boolean;
  context?: string;
  actionHref?: string;
  href?: string;
  relatedEntityId?: EntityId;
  relatedEntityType?: string;
  projectId?: EntityId;
  recipientId?: EntityId;
  scheduledFor?: string;
  expiresAt?: string;
  source?: "system" | "user" | "vora" | "integration";
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  query?: string;
  status?: "All" | NotificationStatus;
  priority?: "All" | NotificationPriority;
  type?: "All" | NotificationType;
  module?: "All" | string;
  page?: number;
  pageSize?: number;
}

export interface NotificationActionResult {
  ok: boolean;
  id?: EntityId;
  error?: string;
}

export interface NotificationItem {
  id: EntityId;
  title: string;
  text: string;
  time: string;
  unread: boolean;
  type?: string;
  createdAt?: string;
}
