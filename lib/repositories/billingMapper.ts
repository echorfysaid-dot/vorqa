import type { BillingSummary, Invoice, InvoiceStatus, OrganizationSubscription, PaymentMethod, PaymentProvider, Plan, PlanId, SubscriptionStatus, TrialStatus, UsageMetric, UsageRecord } from "@/lib/models";

export type BillingPlanRow = {
  id: string;
  name: string;
  description?: string | null;
  price_monthly?: number | null;
  price_yearly?: number | null;
  currency?: string | null;
  limits?: Record<string, number | "unlimited"> | null;
  features?: string[] | null;
  recommended?: boolean | null;
};

export type BillingSubscriptionRow = {
  id: string;
  owner_id?: string | null;
  organization_id?: string | null;
  organization_name?: string | null;
  plan_id?: string | null;
  status?: string | null;
  interval?: string | null;
  provider?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  renewal_date?: string | null;
  cancel_at_period_end?: boolean | null;
  trial_status?: string | null;
  trial_ends_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BillingInvoiceRow = {
  id: string;
  owner_id?: string | null;
  organization_id?: string | null;
  invoice_number: string;
  subscription_id?: string | null;
  status?: string | null;
  amount_subtotal?: number | null;
  tax_amount?: number | null;
  amount_total?: number | null;
  currency?: string | null;
  issued_at?: string | null;
  due_at?: string | null;
  paid_at?: string | null;
  download_url?: string | null;
  provider?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BillingUsageRow = {
  id: string;
  owner_id?: string | null;
  organization_id?: string | null;
  metric: string;
  used?: number | null;
  limit_value?: number | string | null;
  unit?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PaymentMethodRow = {
  id: string;
  owner_id?: string | null;
  organization_id?: string | null;
  provider?: string | null;
  type?: string | null;
  label?: string | null;
  last4?: string | null;
  brand?: string | null;
  exp_month?: number | null;
  exp_year?: number | null;
  is_default?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export const usageMetrics: UsageMetric[] = ["organizations", "members", "projects", "storage", "ai_requests", "marketplace_actions", "rfqs", "contracts", "notifications", "documents"];

export function toPlanId(value?: string | null): PlanId {
  return value === "starter" || value === "professional" || value === "enterprise" ? value : "free";
}

export function toSubscriptionStatus(value?: string | null): SubscriptionStatus {
  return value === "trialing" || value === "past_due" || value === "canceled" || value === "paused" || value === "expired" ? value : "active";
}

export function toTrialStatus(value?: string | null): TrialStatus {
  return value === "active" || value === "expired" || value === "converted" ? value : "not_started";
}

export function toInvoiceStatus(value?: string | null): InvoiceStatus {
  return value === "draft" || value === "open" || value === "void" || value === "overdue" || value === "uncollectible" ? value : "paid";
}

export function toProvider(value?: string | null): PaymentProvider {
  return value === "stripe" || value === "lemon_squeezy" ? value : "manual";
}

export function mapPlanRow(row: BillingPlanRow): Plan {
  return {
    id: toPlanId(row.id),
    name: row.name,
    description: row.description || "",
    priceMonthly: row.price_monthly || 0,
    priceYearly: row.price_yearly || 0,
    currency: row.currency === "USD" || row.currency === "EUR" || row.currency === "GBP" ? row.currency : "MAD",
    interval: "monthly",
    recommended: Boolean(row.recommended),
    limits: usageMetrics.reduce<Plan["limits"]>((acc, metric) => {
      acc[metric] = row.limits?.[metric] ?? 0;
      return acc;
    }, {} as Plan["limits"]),
    features: row.features || []
  };
}

export function mapSubscriptionRow(row: BillingSubscriptionRow): OrganizationSubscription {
  return {
    id: row.id,
    ownerId: row.owner_id || undefined,
    organizationId: row.organization_id || "atlas",
    organizationName: row.organization_name || undefined,
    planId: toPlanId(row.plan_id),
    status: toSubscriptionStatus(row.status),
    interval: row.interval === "yearly" || row.interval === "manual" ? row.interval : "monthly",
    provider: toProvider(row.provider),
    currentPeriodStart: row.current_period_start || undefined,
    currentPeriodEnd: row.current_period_end || undefined,
    renewalDate: row.renewal_date || undefined,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    trialStatus: toTrialStatus(row.trial_status),
    trialEndsAt: row.trial_ends_at || undefined,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined
  };
}

export function mapUsageRow(row: BillingUsageRow): UsageRecord {
  return {
    id: row.id,
    ownerId: row.owner_id || undefined,
    organizationId: row.organization_id || undefined,
    metric: usageMetrics.includes(row.metric as UsageMetric) ? (row.metric as UsageMetric) : "projects",
    used: row.used || 0,
    limit: row.limit_value === "unlimited" ? "unlimited" : Number(row.limit_value || 0),
    unit: row.unit || "count",
    periodStart: row.period_start || new Date().toISOString(),
    periodEnd: row.period_end || new Date().toISOString(),
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined
  };
}

export function mapInvoiceRow(row: BillingInvoiceRow): Invoice {
  return {
    id: row.id,
    ownerId: row.owner_id || undefined,
    organizationId: row.organization_id || undefined,
    invoiceNumber: row.invoice_number,
    subscriptionId: row.subscription_id || undefined,
    status: toInvoiceStatus(row.status),
    amountSubtotal: row.amount_subtotal || 0,
    taxAmount: row.tax_amount || 0,
    amountTotal: row.amount_total || 0,
    currency: row.currency === "USD" || row.currency === "EUR" || row.currency === "GBP" ? row.currency : "MAD",
    issuedAt: row.issued_at || new Date().toISOString(),
    dueAt: row.due_at || undefined,
    paidAt: row.paid_at || undefined,
    downloadUrl: row.download_url || undefined,
    provider: toProvider(row.provider),
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined
  };
}

export function mapPaymentMethodRow(row: PaymentMethodRow): PaymentMethod {
  return {
    id: row.id,
    ownerId: row.owner_id || undefined,
    organizationId: row.organization_id || undefined,
    provider: toProvider(row.provider),
    type: row.type === "card" || row.type === "bank_transfer" ? row.type : "manual_invoice",
    label: row.label || "Manual invoice",
    last4: row.last4 || undefined,
    brand: row.brand || undefined,
    expMonth: row.exp_month || undefined,
    expYear: row.exp_year || undefined,
    default: Boolean(row.is_default),
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined
  };
}

export function calculateRemainingQuota(plan: Plan, usage: UsageRecord[]): BillingSummary["remainingQuota"] {
  return usageMetrics.reduce<BillingSummary["remainingQuota"]>((acc, metric) => {
    const limit = plan.limits[metric];
    const record = usage.find((item) => item.metric === metric);
    acc[metric] = limit === "unlimited" ? "unlimited" : Math.max(0, Number(limit || 0) - (record?.used || 0));
    return acc;
  }, {} as BillingSummary["remainingQuota"]);
}
