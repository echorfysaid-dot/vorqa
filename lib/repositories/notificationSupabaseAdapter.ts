import type { Notification, NotificationFilters, NotificationPreference } from "@/lib/models";
import { organizationRest } from "./organizationSupabaseRest";
import {
  buildNotificationSummary,
  filterNotifications,
  mapNotificationRow,
  mapNotificationToRow,
  mapPreferenceRow,
  okAction,
  paginateNotifications,
  type NotificationPreferenceRow,
  type NotificationRow
} from "./notificationMapper";

const selectFields = [
  "id",
  "owner_id",
  "organization_id",
  "project_id",
  "recipient_id",
  "title",
  "message",
  "type",
  "module",
  "priority",
  "status",
  "context",
  "href",
  "related_entity_id",
  "related_entity_type",
  "scheduled_for",
  "expires_at",
  "source",
  "metadata",
  "created_at",
  "updated_at"
].join(",");

function appendFilters(path: string, filters: NotificationFilters = {}) {
  const params = new URLSearchParams();
  params.set("select", selectFields);
  params.set("order", "created_at.desc");
  params.set("limit", String(Math.max(100, filters.pageSize || 100)));
  const query = params.toString();
  return `${path}?${query}`;
}

async function patchNotification(id: string, input: Partial<Notification>) {
  const body = mapNotificationToRow(input);
  const result = await organizationRest<NotificationRow[]>(
    `/notifications?id=eq.${encodeURIComponent(id)}&select=${selectFields}`,
    {
      method: "PATCH",
      body: JSON.stringify(body)
    }
  );
  if (result.error) return { data: okAction(id), source: "supabase" as const, isFallback: false, error: result.error };
  return { data: okAction(id), source: "supabase" as const, isFallback: false };
}

export const notificationSupabaseAdapter = {
  async getNotifications(filters: NotificationFilters = {}) {
    const result = await organizationRest<NotificationRow[]>(appendFilters("/notifications", filters));
    if (result.error || !result.data) {
      return { data: [] as Notification[], source: "supabase" as const, isFallback: false, error: result.error || "Notifications are unavailable." };
    }
    const mapped = result.data.map(mapNotificationRow);
    const filtered = filterNotifications(mapped, filters);
    return { data: paginateNotifications(filtered, filters), source: "supabase" as const, isFallback: false };
  },

  async getNotification(id: string) {
    const result = await organizationRest<NotificationRow[]>(`/notifications?id=eq.${encodeURIComponent(id)}&select=${selectFields}&limit=1`);
    if (result.error || !result.data) {
      return { data: undefined, source: "supabase" as const, isFallback: false, error: result.error || "Notification was not found." };
    }
    return { data: result.data[0] ? mapNotificationRow(result.data[0]) : undefined, source: "supabase" as const, isFallback: false };
  },

  async getSummary() {
    const result = await this.getNotifications({ pageSize: 250 });
    if (result.error) return { data: buildNotificationSummary([]), source: "supabase" as const, isFallback: false, error: result.error };
    return { data: buildNotificationSummary(result.data), source: "supabase" as const, isFallback: false };
  },

  markAsRead(id: string) {
    return patchNotification(id, { status: "Read", read: true });
  },

  async markAllAsRead() {
    const result = await organizationRest<NotificationRow[]>(
      `/notifications?status=eq.Unread&select=${selectFields}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: "Read", updated_at: new Date().toISOString() })
      }
    );
    if (result.error) return { data: okAction(), source: "supabase" as const, isFallback: false, error: result.error };
    return { data: okAction(), source: "supabase" as const, isFallback: false };
  },

  archiveNotification(id: string) {
    return patchNotification(id, { status: "Archived", read: true });
  },

  deleteNotification(id: string) {
    return patchNotification(id, { status: "Deleted", read: true });
  },

  async getPreferences() {
    const result = await organizationRest<NotificationPreferenceRow[]>("/notification_preferences?select=*&limit=1");
    if (result.error || !result.data?.[0]) {
      return { data: undefined as NotificationPreference | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    }
    return { data: mapPreferenceRow(result.data[0]), source: "supabase" as const, isFallback: false };
  },

  async updatePreferences(input: Partial<NotificationPreference>) {
    const current = await this.getPreferences();
    if (current.error || !current.data) {
      return { data: undefined as NotificationPreference | undefined, source: "supabase" as const, isFallback: false, error: current.error || "Notification preferences are unavailable." };
    }
    const body = {
      in_app_enabled: input.inAppEnabled,
      email_enabled: input.emailEnabled,
      push_enabled: input.pushEnabled,
      sms_enabled: input.smsEnabled,
      muted_modules: input.mutedModules,
      minimum_priority: input.minimumPriority,
      updated_at: new Date().toISOString()
    };
    const result = await organizationRest<NotificationPreferenceRow[]>(
      `/notification_preferences?id=eq.${encodeURIComponent(current.data.id)}&select=*`,
      {
        method: "PATCH",
        body: JSON.stringify(body)
      }
    );
    if (result.error || !result.data?.[0]) {
      return { data: current.data, source: "supabase" as const, isFallback: false, error: result.error };
    }
    return { data: mapPreferenceRow(result.data[0]), source: "supabase" as const, isFallback: false };
  }
};
