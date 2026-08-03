import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { Notification, NotificationActionResult, NotificationFilters, NotificationPreference, NotificationSummary } from "@/lib/models";
import { notificationDemoAdapter, demoNotifications } from "./notificationDemoAdapter";
import { notificationSupabaseAdapter } from "./notificationSupabaseAdapter";
import { cachedRepositoryCall, clearRepositoryCache } from "./repositoryCache";

export type NotificationRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
  demo: () => NotificationRepositoryResult<T> | Promise<NotificationRepositoryResult<T>>,
  supabase: () => NotificationRepositoryResult<T> | Promise<NotificationRepositoryResult<T>>
): Promise<NotificationRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

export const notificationRepository = {
  list(): Notification[] {
    return [...demoNotifications];
  },

  getSummarySync(): NotificationSummary {
    return notificationDemoAdapter.getSummary().data;
  },

  async getNotifications(filters: NotificationFilters = {}): Promise<NotificationRepositoryResult<Notification[]>> {
    return withMode(() => notificationDemoAdapter.getNotifications(filters), () => notificationSupabaseAdapter.getNotifications(filters));
  },

  async getNotification(id: string): Promise<NotificationRepositoryResult<Notification | undefined>> {
    return withMode(() => notificationDemoAdapter.getNotification(id), () => notificationSupabaseAdapter.getNotification(id));
  },

  async getSummary(): Promise<NotificationRepositoryResult<NotificationSummary>> {
    return cachedRepositoryCall("notifications:summary", 15_000, () => withMode(() => notificationDemoAdapter.getSummary(), () => notificationSupabaseAdapter.getSummary()));
  },

  async markAsRead(id: string): Promise<NotificationRepositoryResult<NotificationActionResult>> {
    clearRepositoryCache("notifications:");
    return withMode(() => notificationDemoAdapter.markAsRead(id), () => notificationSupabaseAdapter.markAsRead(id));
  },

  async markAllAsRead(): Promise<NotificationRepositoryResult<NotificationActionResult>> {
    clearRepositoryCache("notifications:");
    return withMode(() => notificationDemoAdapter.markAllAsRead(), () => notificationSupabaseAdapter.markAllAsRead());
  },

  async archiveNotification(id: string): Promise<NotificationRepositoryResult<NotificationActionResult>> {
    clearRepositoryCache("notifications:");
    return withMode(() => notificationDemoAdapter.archiveNotification(id), () => notificationSupabaseAdapter.archiveNotification(id));
  },

  async deleteNotification(id: string): Promise<NotificationRepositoryResult<NotificationActionResult>> {
    clearRepositoryCache("notifications:");
    return withMode(() => notificationDemoAdapter.deleteNotification(id), () => notificationSupabaseAdapter.deleteNotification(id));
  },

  async getPreferences(): Promise<NotificationRepositoryResult<NotificationPreference | undefined>> {
    return withMode(() => notificationDemoAdapter.getPreferences(), () => notificationSupabaseAdapter.getPreferences());
  },

  async updatePreferences(input: Partial<NotificationPreference>): Promise<NotificationRepositoryResult<NotificationPreference | undefined>> {
    return withMode(() => notificationDemoAdapter.updatePreferences(input), () => notificationSupabaseAdapter.updatePreferences(input));
  }
};
