import type { AdminDashboard, AdminStatus, AdminUser, AuditEventType, AuditSummary, FeatureFlag, FeatureFlagStatus, OrganizationSummary, PlatformSetting, SubscriptionSummary, SystemHealth } from "@/lib/models";

export type AdminRow = Record<string, unknown>;

export function toAdminStatus(value: unknown): AdminStatus {
  const text = String(value || "").toLowerCase();
  if (["invited", "suspended", "trialing", "past_due", "healthy", "warning", "critical"].includes(text)) return text as AdminStatus;
  return "active";
}

export function toAuditType(value: unknown): AuditEventType {
  const text = String(value || "").toLowerCase();
  if (["auth", "project", "marketplace", "contract", "billing", "ai", "admin", "system"].includes(text)) return text as AuditEventType;
  return "system";
}

export function toFeatureFlagStatus(value: unknown): FeatureFlagStatus {
  const text = String(value || "").toLowerCase();
  if (text === "disabled" || text === "beta") return text;
  return "enabled";
}

export function calculateAdminHealth(errorRate: number, apiLatencyMs: number): SystemHealth["status"] {
  if (errorRate > 5 || apiLatencyMs > 1200) return "incident";
  if (errorRate > 1.5 || apiLatencyMs > 650) return "degraded";
  return "healthy";
}

export function filterAdminUsers(users: AdminUser[], query = "") {
  const q = query.trim().toLowerCase();
  if (!q) return users;
  return users.filter((user) => [user.name, user.email, user.role, user.organization, user.status].some((value) => value?.toLowerCase().includes(q)));
}

export function filterOrganizations(organizations: OrganizationSummary[], query = "") {
  const q = query.trim().toLowerCase();
  if (!q) return organizations;
  return organizations.filter((org) => [org.name, org.owner, org.plan, org.status].some((value) => value.toLowerCase().includes(q)));
}

export function filterAudit(audit: AuditSummary[], query = "", type = "all") {
  const q = query.trim().toLowerCase();
  return audit.filter((event) => {
    if (type !== "all" && event.type !== type) return false;
    if (!q) return true;
    return [event.actor, event.action, event.target, event.status, event.type].some((value) => value.toLowerCase().includes(q));
  });
}

export function summarizeRevenue(subscriptions: SubscriptionSummary[]) {
  return subscriptions.reduce((total, subscription) => total + subscription.mrr, 0);
}

export function emptyAdminDashboard(): AdminDashboard {
  return {
    metrics: {
      totalUsers: 0,
      activeOrganizations: 0,
      projects: 0,
      marketplaceCompanies: 0,
      rfqs: 0,
      contracts: 0,
      revenue: 0,
      currency: "MAD",
      aiRequests: 0,
      storageGb: 0
    },
    health: {
      status: "healthy",
      apiLatencyMs: 0,
      errorRate: 0,
      uptime: 100,
      supabase: "healthy",
      openai: "healthy",
      storage: "healthy",
      jobs: "healthy",
      lastCheckedAt: new Date().toISOString()
    },
    users: [],
    organizations: [],
    subscriptions: [],
    audit: [],
    featureFlags: [],
    settings: []
  };
}

export function mapAdminRowToSetting(row: AdminRow): PlatformSetting {
  return {
    id: String(row.id || row.key || crypto.randomUUID()),
    key: String(row.key || ""),
    label: String(row.label || row.key || "Setting"),
    value: String(row.value || ""),
    category: row.category === "security" || row.category === "ai" || row.category === "billing" || row.category === "marketplace" ? row.category : "system",
    locked: Boolean(row.locked),
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  };
}
