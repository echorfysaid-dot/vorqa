import type { CurrencyCode, EntityId, OwnedEntity, Timestamped } from "./common";

export type AdminStatus = "active" | "invited" | "suspended" | "trialing" | "past_due" | "healthy" | "warning" | "critical";
export type AdminRole = "owner" | "admin" | "member" | "viewer" | "support" | "system";
export type AuditEventType = "auth" | "project" | "marketplace" | "contract" | "billing" | "ai" | "admin" | "system";
export type FeatureFlagStatus = "enabled" | "disabled" | "beta";

export interface PlatformMetrics {
  totalUsers: number;
  activeOrganizations: number;
  projects: number;
  marketplaceCompanies: number;
  rfqs: number;
  contracts: number;
  revenue: number;
  currency: CurrencyCode;
  aiRequests: number;
  storageGb: number;
}

export interface SystemHealth {
  status: "healthy" | "degraded" | "incident";
  apiLatencyMs: number;
  errorRate: number;
  uptime: number;
  supabase: AdminStatus;
  openai: AdminStatus;
  storage: AdminStatus;
  jobs: AdminStatus;
  lastCheckedAt: string;
}

export interface AdminUser extends Timestamped {
  id: EntityId;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  organization?: string;
  lastActiveAt?: string;
  aiRequests: number;
}

export interface OrganizationSummary extends Timestamped {
  id: EntityId;
  name: string;
  owner: string;
  status: AdminStatus;
  plan: string;
  members: number;
  projects: number;
  storageGb: number;
  aiRequests: number;
}

export interface SubscriptionSummary extends Timestamped, OwnedEntity {
  id: EntityId;
  organizationName: string;
  plan: string;
  status: AdminStatus;
  mrr: number;
  currency: CurrencyCode;
  renewalDate?: string;
  invoices: number;
  usagePercent: number;
}

export interface AuditSummary extends Timestamped, OwnedEntity {
  id: EntityId;
  type: AuditEventType;
  actor: string;
  action: string;
  target: string;
  status: "success" | "failed" | "warning";
  ip?: string;
}

export interface FeatureFlag extends Timestamped {
  id: EntityId;
  key: string;
  name: string;
  description: string;
  status: FeatureFlagStatus;
  rollout: number;
  owner: string;
}

export interface PlatformSetting extends Timestamped {
  id: EntityId;
  key: string;
  label: string;
  value: string;
  category: "security" | "ai" | "billing" | "marketplace" | "system";
  locked: boolean;
}

export interface AdminDashboard {
  metrics: PlatformMetrics;
  health: SystemHealth;
  users: AdminUser[];
  organizations: OrganizationSummary[];
  subscriptions: SubscriptionSummary[];
  audit: AuditSummary[];
  featureFlags: FeatureFlag[];
  settings: PlatformSetting[];
}
