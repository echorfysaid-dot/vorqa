import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { AdminDashboard, AdminUser, AuditSummary, FeatureFlag, OrganizationSummary, PlatformSetting, SubscriptionSummary, SystemHealth } from "@/lib/models";
import { adminDemoAdapter } from "./adminDemoAdapter";
import { adminSupabaseAdapter } from "./adminSupabaseAdapter";
import { cachedRepositoryCall } from "./repositoryCache";

export type AdminRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
  demo: () => AdminRepositoryResult<T> | Promise<AdminRepositoryResult<T>>,
  supabase: () => AdminRepositoryResult<T> | Promise<AdminRepositoryResult<T>>
): Promise<AdminRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

export const adminRepository = {
  getDashboardSync(): AdminDashboard {
    return adminDemoAdapter.getDashboard().data;
  },
  async getDashboard(): Promise<AdminRepositoryResult<AdminDashboard>> {
    return cachedRepositoryCall("admin:dashboard", 20_000, () => withMode(() => adminDemoAdapter.getDashboard(), () => adminSupabaseAdapter.getDashboard()));
  },
  async getUsers(query = ""): Promise<AdminRepositoryResult<AdminUser[]>> {
    return cachedRepositoryCall(`admin:users:${query}`, 20_000, () => withMode(() => adminDemoAdapter.getUsers(query), () => adminSupabaseAdapter.getUsers()));
  },
  async getOrganizations(query = ""): Promise<AdminRepositoryResult<OrganizationSummary[]>> {
    return cachedRepositoryCall(`admin:organizations:${query}`, 20_000, () => withMode(() => adminDemoAdapter.getOrganizations(query), () => adminSupabaseAdapter.getOrganizations()));
  },
  async getSubscriptions(): Promise<AdminRepositoryResult<SubscriptionSummary[]>> {
    return cachedRepositoryCall("admin:subscriptions", 20_000, () => withMode(() => adminDemoAdapter.getSubscriptions(), () => adminSupabaseAdapter.getSubscriptions()));
  },
  async getAudit(query = "", type = "all"): Promise<AdminRepositoryResult<AuditSummary[]>> {
    return cachedRepositoryCall(`admin:audit:${type}:${query}`, 20_000, () => withMode(() => adminDemoAdapter.getAudit(query, type), () => adminSupabaseAdapter.getAudit()));
  },
  async getFeatureFlags(): Promise<AdminRepositoryResult<FeatureFlag[]>> {
    return cachedRepositoryCall("admin:flags", 20_000, () => withMode(() => adminDemoAdapter.getFeatureFlags(), () => adminSupabaseAdapter.getFeatureFlags()));
  },
  async getSystemHealth(): Promise<AdminRepositoryResult<SystemHealth>> {
    return cachedRepositoryCall("admin:system", 20_000, () => withMode(() => adminDemoAdapter.getSystemHealth(), () => adminSupabaseAdapter.getSystemHealth()));
  },
  async getSettings(): Promise<AdminRepositoryResult<PlatformSetting[]>> {
    return cachedRepositoryCall("admin:settings", 20_000, () => withMode(() => adminDemoAdapter.getSettings(), () => adminSupabaseAdapter.getSettings()));
  },
  async getAiUsage() {
    return cachedRepositoryCall("admin:ai", 20_000, () => withMode(() => adminDemoAdapter.getAiUsage(), () => adminDemoAdapter.getAiUsage()));
  }
};
