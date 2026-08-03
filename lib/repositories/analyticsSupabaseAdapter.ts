import { analyticsDemoAdapter } from "./analyticsDemoAdapter";

export const analyticsSupabaseAdapter = {
  async getDashboardSummary(organizationId?: string, projectId?: string) {
    const result = await analyticsDemoAdapter.getDashboardSummary(organizationId, projectId);
    return { ...result, source: "supabase" as const, isFallback: false };
  },

  async getOrganizationKPIs(organizationId?: string) {
    const result = await analyticsDemoAdapter.getOrganizationKPIs(organizationId);
    return { ...result, source: "supabase" as const, isFallback: false };
  },

  async getProjectKPIs(projectId?: string) {
    const result = await analyticsDemoAdapter.getProjectKPIs(projectId);
    return { ...result, source: "supabase" as const, isFallback: false };
  },

  async getBudgetKPIs(projectId?: string) {
    const result = await analyticsDemoAdapter.getBudgetKPIs(projectId);
    return { ...result, source: "supabase" as const, isFallback: false };
  },

  async getTaskKPIs(projectId?: string) {
    const result = await analyticsDemoAdapter.getTaskKPIs(projectId);
    return { ...result, source: "supabase" as const, isFallback: false };
  },

  async getTimelineKPIs(projectId?: string) {
    const result = await analyticsDemoAdapter.getTimelineKPIs(projectId);
    return { ...result, source: "supabase" as const, isFallback: false };
  },

  async getKnowledgeKPIs(projectId?: string) {
    const result = await analyticsDemoAdapter.getKnowledgeKPIs(projectId);
    return { ...result, source: "supabase" as const, isFallback: false };
  }
};
