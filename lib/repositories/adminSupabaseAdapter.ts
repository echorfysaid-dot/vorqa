import type { AdminDashboard, AdminUser, AuditSummary, FeatureFlag, OrganizationSummary, PlatformSetting, SubscriptionSummary, SystemHealth } from "@/lib/models";
import { emptyAdminDashboard, mapAdminRowToSetting, toAdminStatus, toAuditType, toFeatureFlagStatus } from "./adminMapper";
import { organizationRest } from "./organizationSupabaseRest";

type Result<T> = { data: T; source: "supabase"; error?: string; isFallback: false };
type Row = Record<string, unknown>;

function failed<T>(fallback: T, error?: string): Result<T> {
  return { data: fallback, source: "supabase", isFallback: false, error: error || "Admin production views are not configured yet." };
}

function userFromRow(row: Row): AdminUser {
  return {
    id: String(row.id || row.user_id || ""),
    name: String(row.name || row.full_name || row.email || "User"),
    email: String(row.email || ""),
    role: row.role === "owner" || row.role === "admin" || row.role === "member" || row.role === "viewer" || row.role === "support" || row.role === "system" ? row.role : "member",
    status: toAdminStatus(row.status),
    organization: typeof row.organization === "string" ? row.organization : undefined,
    lastActiveAt: typeof row.last_active_at === "string" ? row.last_active_at : undefined,
    aiRequests: Number(row.ai_requests || 0),
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  };
}

function organizationFromRow(row: Row): OrganizationSummary {
  return {
    id: String(row.id || ""),
    name: String(row.name || "Organization"),
    owner: String(row.owner || row.owner_email || "Owner"),
    status: toAdminStatus(row.status),
    plan: String(row.plan || "Free"),
    members: Number(row.members || row.member_count || 0),
    projects: Number(row.projects || row.project_count || 0),
    storageGb: Number(row.storage_gb || 0),
    aiRequests: Number(row.ai_requests || 0),
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  };
}

function subscriptionFromRow(row: Row): SubscriptionSummary {
  return {
    id: String(row.id || ""),
    ownerId: typeof row.owner_id === "string" ? row.owner_id : undefined,
    organizationId: typeof row.organization_id === "string" ? row.organization_id : undefined,
    organizationName: String(row.organization_name || "Organization"),
    plan: String(row.plan || "Free"),
    status: toAdminStatus(row.status),
    mrr: Number(row.mrr || 0),
    currency: row.currency === "USD" || row.currency === "EUR" || row.currency === "MAD" ? row.currency : "MAD",
    renewalDate: typeof row.renewal_date === "string" ? row.renewal_date : undefined,
    invoices: Number(row.invoices || 0),
    usagePercent: Number(row.usage_percent || 0),
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  };
}

function auditFromRow(row: Row): AuditSummary {
  return {
    id: String(row.id || ""),
    ownerId: typeof row.owner_id === "string" ? row.owner_id : undefined,
    organizationId: typeof row.organization_id === "string" ? row.organization_id : undefined,
    type: toAuditType(row.type),
    actor: String(row.actor || "System"),
    action: String(row.action || "Event"),
    target: String(row.target || "Platform"),
    status: row.status === "failed" || row.status === "warning" ? row.status : "success",
    ip: typeof row.ip === "string" ? row.ip : undefined,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  };
}

function flagFromRow(row: Row): FeatureFlag {
  return {
    id: String(row.id || row.key || ""),
    key: String(row.key || ""),
    name: String(row.name || row.key || "Feature"),
    description: String(row.description || ""),
    status: toFeatureFlagStatus(row.status),
    rollout: Number(row.rollout || 0),
    owner: String(row.owner || "Platform"),
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  };
}

export const adminSupabaseAdapter = {
  async getDashboard(): Promise<Result<AdminDashboard>> {
    const result = await organizationRest<Row[]>("/admin_dashboard?select=*&limit=1");
    if (result.error || !result.data?.[0]) return failed(emptyAdminDashboard(), result.error);
    return { data: { ...emptyAdminDashboard(), ...(result.data[0] as Partial<AdminDashboard>) }, source: "supabase", isFallback: false };
  },
  async getUsers(): Promise<Result<AdminUser[]>> {
    const result = await organizationRest<Row[]>("/admin_users?select=*&order=created_at.desc");
    if (result.error || !result.data) return failed([], result.error);
    return { data: result.data.map(userFromRow), source: "supabase", isFallback: false };
  },
  async getOrganizations(): Promise<Result<OrganizationSummary[]>> {
    const result = await organizationRest<Row[]>("/admin_organizations?select=*&order=created_at.desc");
    if (result.error || !result.data) return failed([], result.error);
    return { data: result.data.map(organizationFromRow), source: "supabase", isFallback: false };
  },
  async getSubscriptions(): Promise<Result<SubscriptionSummary[]>> {
    const result = await organizationRest<Row[]>("/admin_subscriptions?select=*&order=created_at.desc");
    if (result.error || !result.data) return failed([], result.error);
    return { data: result.data.map(subscriptionFromRow), source: "supabase", isFallback: false };
  },
  async getAudit(): Promise<Result<AuditSummary[]>> {
    const result = await organizationRest<Row[]>("/admin_audit?select=*&order=created_at.desc");
    if (result.error || !result.data) return failed([], result.error);
    return { data: result.data.map(auditFromRow), source: "supabase", isFallback: false };
  },
  async getFeatureFlags(): Promise<Result<FeatureFlag[]>> {
    const result = await organizationRest<Row[]>("/admin_feature_flags?select=*&order=key.asc");
    if (result.error || !result.data) return failed([], result.error);
    return { data: result.data.map(flagFromRow), source: "supabase", isFallback: false };
  },
  async getSystemHealth(): Promise<Result<SystemHealth>> {
    const result = await organizationRest<Row[]>("/admin_system_health?select=*&limit=1");
    if (result.error || !result.data?.[0]) return failed(emptyAdminDashboard().health, result.error);
    const row = result.data[0];
    return {
      data: {
        status: row.status === "incident" || row.status === "degraded" ? row.status : "healthy",
        apiLatencyMs: Number(row.api_latency_ms || 0),
        errorRate: Number(row.error_rate || 0),
        uptime: Number(row.uptime || 100),
        supabase: toAdminStatus(row.supabase),
        openai: toAdminStatus(row.openai),
        storage: toAdminStatus(row.storage),
        jobs: toAdminStatus(row.jobs),
        lastCheckedAt: String(row.last_checked_at || new Date().toISOString())
      },
      source: "supabase",
      isFallback: false
    };
  },
  async getSettings(): Promise<Result<PlatformSetting[]>> {
    const result = await organizationRest<Row[]>("/admin_platform_settings?select=*&order=key.asc");
    if (result.error || !result.data) return failed([], result.error);
    return { data: result.data.map(mapAdminRowToSetting), source: "supabase", isFallback: false };
  }
};
