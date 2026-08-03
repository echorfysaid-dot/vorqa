import type { AdminDashboard, AdminUser, AuditSummary, FeatureFlag, OrganizationSummary, PlatformSetting, SubscriptionSummary } from "@/lib/models";
import { billingRepository } from "./billingRepository";
import { contractRepository } from "./contractRepository";
import { marketplaceRepository } from "./marketplaceRepository";
import { organizationRepository } from "./organizationRepository";
import { projectRepository } from "./projectRepository";
import { rfqRepository } from "./rfqRepository";
import { filterAdminUsers, filterAudit, filterOrganizations, summarizeRevenue } from "./adminMapper";

const now = "2026-07-20T09:00:00.000Z";

export const demoAdminUsers: AdminUser[] = [
  { id: "USR-1001", name: "Amine El Mansouri", email: "amine@atlas.example", role: "owner", status: "active", organization: "Atlas Construction Group", lastActiveAt: now, aiRequests: 426, createdAt: "2026-07-01T08:00:00.000Z", updatedAt: now },
  { id: "USR-1002", name: "Sara Benjelloun", email: "sara@atlas.example", role: "admin", status: "active", organization: "Atlas Construction Group", lastActiveAt: "2026-07-20T08:35:00.000Z", aiRequests: 318, createdAt: "2026-07-02T08:00:00.000Z", updatedAt: now },
  { id: "USR-1003", name: "Youssef Alaoui", email: "youssef@atlas.example", role: "member", status: "active", organization: "Atlas Construction Group", lastActiveAt: "2026-07-20T07:50:00.000Z", aiRequests: 176, createdAt: "2026-07-03T08:00:00.000Z", updatedAt: now },
  { id: "USR-1004", name: "Nadia Idrissi", email: "nadia@urbanform.example", role: "admin", status: "active", organization: "UrbanForm Architects", lastActiveAt: "2026-07-19T17:15:00.000Z", aiRequests: 204, createdAt: "2026-07-04T08:00:00.000Z", updatedAt: now },
  { id: "USR-1005", name: "Karim Haddad", email: "karim@northbuild.example", role: "member", status: "invited", organization: "NorthBuild Engineering", aiRequests: 0, createdAt: "2026-07-18T08:00:00.000Z", updatedAt: now },
  { id: "USR-1006", name: "Leila Tazi", email: "leila@maghreb-logistics.example", role: "viewer", status: "suspended", organization: "Maghreb Logistics", lastActiveAt: "2026-07-12T12:10:00.000Z", aiRequests: 41, createdAt: "2026-07-05T08:00:00.000Z", updatedAt: now }
];

export const demoOrganizationSummaries: OrganizationSummary[] = organizationRepository.list().map((organization, index) => ({
  id: organization.id,
  name: organization.name,
  owner: index === 0 ? "Amine El Mansouri" : index === 1 ? "Omar Rachid" : index === 2 ? "Nadia Idrissi" : "Leila Tazi",
  status: organization.status === "Suspended organization" ? "suspended" : "active",
  plan: index === 0 ? "Professional" : index === 1 ? "Starter" : index === 2 ? "Professional" : "Starter",
  members: organization.employees,
  projects: organization.activeProjects,
  storageGb: [64, 22, 31, 18][index] || 12,
  aiRequests: [1240, 420, 740, 190][index] || 80,
  createdAt: "2026-07-01T08:00:00.000Z",
  updatedAt: now
}));

export const demoSubscriptionSummaries: SubscriptionSummary[] = [
  { id: "SUB-1001", ownerId: "USR-1001", organizationId: "atlas", organizationName: "Atlas Construction Group", plan: "Professional", status: "trialing", mrr: 890, currency: "MAD", renewalDate: "2026-08-01T00:00:00.000Z", invoices: 3, usagePercent: 42, createdAt: "2026-07-01T08:00:00.000Z", updatedAt: now },
  { id: "SUB-1002", ownerId: "USR-1002", organizationId: "northbuild", organizationName: "NorthBuild Engineering", plan: "Starter", status: "active", mrr: 290, currency: "MAD", renewalDate: "2026-08-04T00:00:00.000Z", invoices: 2, usagePercent: 33, createdAt: "2026-07-04T08:00:00.000Z", updatedAt: now },
  { id: "SUB-1003", ownerId: "USR-1004", organizationId: "urbanform", organizationName: "UrbanForm Architects", plan: "Professional", status: "active", mrr: 890, currency: "MAD", renewalDate: "2026-08-10T00:00:00.000Z", invoices: 4, usagePercent: 57, createdAt: "2026-07-05T08:00:00.000Z", updatedAt: now },
  { id: "SUB-1004", ownerId: "USR-1006", organizationId: "maghreb-logistics", organizationName: "Maghreb Logistics", plan: "Starter", status: "past_due", mrr: 290, currency: "MAD", renewalDate: "2026-07-24T00:00:00.000Z", invoices: 1, usagePercent: 68, createdAt: "2026-07-06T08:00:00.000Z", updatedAt: now }
];

export const demoAuditSummaries: AuditSummary[] = [
  { id: "AUD-1001", ownerId: "USR-1001", organizationId: "atlas", type: "auth", actor: "Amine El Mansouri", action: "Login successful", target: "Atlas workspace", status: "success", ip: "196.12.42.18", createdAt: "2026-07-20T08:55:00.000Z", updatedAt: now },
  { id: "AUD-1002", ownerId: "USR-1002", organizationId: "atlas", type: "ai", actor: "Sara Benjelloun", action: "Generated budget risk review", target: "Luxury Villa Casablanca", status: "success", createdAt: "2026-07-20T08:25:00.000Z", updatedAt: now },
  { id: "AUD-1003", ownerId: "USR-1003", organizationId: "atlas", type: "project", actor: "Youssef Alaoui", action: "Updated milestone progress", target: "Execution phase", status: "success", createdAt: "2026-07-20T07:40:00.000Z", updatedAt: now },
  { id: "AUD-1004", ownerId: "USR-1004", organizationId: "urbanform", type: "marketplace", actor: "Nadia Idrissi", action: "Opened supplier connection", target: "BetonPro Materials", status: "success", createdAt: "2026-07-19T16:20:00.000Z", updatedAt: now },
  { id: "AUD-1005", ownerId: "USR-1001", organizationId: "atlas", type: "contract", actor: "Amine El Mansouri", action: "Reviewed award decision", target: "CON-1001", status: "warning", createdAt: "2026-07-19T14:10:00.000Z", updatedAt: now },
  { id: "AUD-1006", ownerId: "USR-1006", organizationId: "maghreb-logistics", type: "billing", actor: "System", action: "Invoice payment overdue", target: "SUB-1004", status: "warning", createdAt: "2026-07-19T09:00:00.000Z", updatedAt: now },
  { id: "AUD-1007", ownerId: "USR-1001", organizationId: "atlas", type: "admin", actor: "Support Admin", action: "Changed feature flag rollout", target: "private-beta", status: "success", createdAt: "2026-07-18T11:15:00.000Z", updatedAt: now }
];

export const demoFeatureFlags: FeatureFlag[] = [
  { id: "FLAG-1001", key: "marketplace", name: "Marketplace", description: "Construction partner discovery, profiles, favorites, and comparison.", status: "enabled", rollout: 100, owner: "Product", createdAt: "2026-07-01T08:00:00.000Z", updatedAt: now },
  { id: "FLAG-1002", key: "vora-ai", name: "VORA AI", description: "Project-aware generation, summaries, risk reviews, and recommendations.", status: "enabled", rollout: 100, owner: "AI Platform", createdAt: "2026-07-01T08:00:00.000Z", updatedAt: now },
  { id: "FLAG-1003", key: "notifications", name: "Notifications Center", description: "Unified alerts across projects, RFQs, contracts, documents, and AI.", status: "enabled", rollout: 100, owner: "Platform", createdAt: "2026-07-03T08:00:00.000Z", updatedAt: now },
  { id: "FLAG-1004", key: "billing", name: "Billing Foundation", description: "Plans, invoices, usage records, and payment-provider abstraction.", status: "beta", rollout: 65, owner: "Revenue", createdAt: "2026-07-10T08:00:00.000Z", updatedAt: now },
  { id: "FLAG-1005", key: "private-beta", name: "Private Beta Controls", description: "Admin-supervised access gates for invited construction companies.", status: "beta", rollout: 25, owner: "Operations", createdAt: "2026-07-12T08:00:00.000Z", updatedAt: now }
];

export const demoPlatformSettings: PlatformSetting[] = [
  { id: "SET-1001", key: "data_source_mode", label: "Data source mode", value: "demo / supabase / auto", category: "system", locked: true, createdAt: "2026-07-01T08:00:00.000Z", updatedAt: now },
  { id: "SET-1002", key: "ai_model", label: "Default AI model", value: "OPENAI_MODEL fallback", category: "ai", locked: true, createdAt: "2026-07-01T08:00:00.000Z", updatedAt: now },
  { id: "SET-1003", key: "billing_provider", label: "Payment provider", value: "Manual invoices prepared", category: "billing", locked: false, createdAt: "2026-07-10T08:00:00.000Z", updatedAt: now },
  { id: "SET-1004", key: "marketplace_verification", label: "Marketplace verification", value: "Verified profiles are public", category: "marketplace", locked: false, createdAt: "2026-07-12T08:00:00.000Z", updatedAt: now },
  { id: "SET-1005", key: "security_headers", label: "Security headers", value: "Prepared in security hardening layer", category: "security", locked: true, createdAt: "2026-07-18T08:00:00.000Z", updatedAt: now }
];

function getDashboardData(): AdminDashboard {
  const billing = billingRepository.getSummarySync();
  return {
    metrics: {
      totalUsers: demoAdminUsers.length,
      activeOrganizations: demoOrganizationSummaries.filter((item) => item.status === "active").length,
      projects: projectRepository.list().length,
      marketplaceCompanies: marketplaceRepository.listCompanies().length,
      rfqs: rfqRepository.list().length,
      contracts: contractRepository.list().length,
      revenue: summarizeRevenue(demoSubscriptionSummaries),
      currency: "MAD",
      aiRequests: billing.usage.find((item) => item.metric === "ai_requests")?.used || 0,
      storageGb: billing.usage.find((item) => item.metric === "storage")?.used || 0
    },
    health: {
      status: "healthy",
      apiLatencyMs: 184,
      errorRate: 0.18,
      uptime: 99.96,
      supabase: "healthy",
      openai: "healthy",
      storage: "healthy",
      jobs: "warning",
      lastCheckedAt: now
    },
    users: demoAdminUsers,
    organizations: demoOrganizationSummaries,
    subscriptions: demoSubscriptionSummaries,
    audit: demoAuditSummaries,
    featureFlags: demoFeatureFlags,
    settings: demoPlatformSettings
  };
}

export const adminDemoAdapter = {
  getDashboard() {
    return { data: getDashboardData(), source: "demo" as const, isFallback: false };
  },
  getUsers(query = "") {
    return { data: filterAdminUsers(demoAdminUsers, query), source: "demo" as const, isFallback: false };
  },
  getOrganizations(query = "") {
    return { data: filterOrganizations(demoOrganizationSummaries, query), source: "demo" as const, isFallback: false };
  },
  getSubscriptions() {
    return { data: demoSubscriptionSummaries, source: "demo" as const, isFallback: false };
  },
  getAudit(query = "", type = "all") {
    return { data: filterAudit(demoAuditSummaries, query, type), source: "demo" as const, isFallback: false };
  },
  getFeatureFlags() {
    return { data: demoFeatureFlags, source: "demo" as const, isFallback: false };
  },
  getSystemHealth() {
    return { data: getDashboardData().health, source: "demo" as const, isFallback: false };
  },
  getAiUsage() {
    return { data: { requests: getDashboardData().metrics.aiRequests, users: demoAdminUsers, audit: demoAuditSummaries.filter((event) => event.type === "ai") }, source: "demo" as const, isFallback: false };
  },
  getSettings() {
    return { data: demoPlatformSettings, source: "demo" as const, isFallback: false };
  }
};
