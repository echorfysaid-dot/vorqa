import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { AnalyticsKpi, DashboardAnalyticsSummary } from "@/lib/models";
import { analyticsDemoAdapter } from "./analyticsDemoAdapter";
import { analyticsSupabaseAdapter } from "./analyticsSupabaseAdapter";
import { cachedRepositoryCall } from "./repositoryCache";

export type AnalyticsRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
  demo: () => Promise<AnalyticsRepositoryResult<T>>,
  supabase: () => Promise<AnalyticsRepositoryResult<T>>
): Promise<AnalyticsRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

export const analyticsRepository = {
  async getDashboardSummary(organizationId?: string, projectId?: string): Promise<AnalyticsRepositoryResult<DashboardAnalyticsSummary>> {
    return cachedRepositoryCall(
      `analytics:dashboard:${organizationId || "default"}:${projectId || "default"}`,
      20_000,
      () => withMode(
        () => analyticsDemoAdapter.getDashboardSummary(organizationId, projectId),
        () => analyticsSupabaseAdapter.getDashboardSummary(organizationId, projectId)
      )
    );
  },

  async getOrganizationKPIs(organizationId?: string): Promise<AnalyticsRepositoryResult<AnalyticsKpi[]>> {
    return withMode(() => analyticsDemoAdapter.getOrganizationKPIs(organizationId), () => analyticsSupabaseAdapter.getOrganizationKPIs(organizationId));
  },

  async getProjectKPIs(projectId?: string): Promise<AnalyticsRepositoryResult<AnalyticsKpi[]>> {
    return withMode(() => analyticsDemoAdapter.getProjectKPIs(projectId), () => analyticsSupabaseAdapter.getProjectKPIs(projectId));
  },

  async getBudgetKPIs(projectId?: string): Promise<AnalyticsRepositoryResult<AnalyticsKpi[]>> {
    return withMode(() => analyticsDemoAdapter.getBudgetKPIs(projectId), () => analyticsSupabaseAdapter.getBudgetKPIs(projectId));
  },

  async getTaskKPIs(projectId?: string): Promise<AnalyticsRepositoryResult<AnalyticsKpi[]>> {
    return withMode(() => analyticsDemoAdapter.getTaskKPIs(projectId), () => analyticsSupabaseAdapter.getTaskKPIs(projectId));
  },

  async getTimelineKPIs(projectId?: string): Promise<AnalyticsRepositoryResult<AnalyticsKpi[]>> {
    return withMode(() => analyticsDemoAdapter.getTimelineKPIs(projectId), () => analyticsSupabaseAdapter.getTimelineKPIs(projectId));
  },

  async getKnowledgeKPIs(projectId?: string): Promise<AnalyticsRepositoryResult<AnalyticsKpi[]>> {
    return withMode(() => analyticsDemoAdapter.getKnowledgeKPIs(projectId), () => analyticsSupabaseAdapter.getKnowledgeKPIs(projectId));
  }
};
