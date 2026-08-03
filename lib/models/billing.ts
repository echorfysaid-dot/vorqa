import type { CurrencyCode, EntityId, OwnedEntity, Timestamped } from "./common";

export type PlanId = "free" | "starter" | "professional" | "enterprise";
export type BillingInterval = "monthly" | "yearly" | "manual";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "paused" | "expired";
export type TrialStatus = "not_started" | "active" | "expired" | "converted";
export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "overdue" | "uncollectible";
export type PaymentProvider = "stripe" | "lemon_squeezy" | "manual";
export type PaymentMethodType = "card" | "bank_transfer" | "manual_invoice";
export type UsageMetric =
  | "organizations"
  | "members"
  | "projects"
  | "storage"
  | "ai_requests"
  | "marketplace_actions"
  | "rfqs"
  | "contracts"
  | "notifications"
  | "documents";

export type PlanLimits = Record<UsageMetric, number | "unlimited">;

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: CurrencyCode;
  interval: BillingInterval;
  recommended?: boolean;
  limits: PlanLimits;
  features: string[];
}

export interface Subscription extends Timestamped, OwnedEntity {
  id: EntityId;
  planId: PlanId;
  status: SubscriptionStatus;
  interval: BillingInterval;
  provider: PaymentProvider;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  renewalDate?: string;
  cancelAtPeriodEnd?: boolean;
  trialStatus: TrialStatus;
  trialEndsAt?: string;
}

export interface OrganizationSubscription extends Subscription {
  organizationId: EntityId;
  organizationName?: string;
}

export interface UsageRecord extends Timestamped, OwnedEntity {
  id: EntityId;
  metric: UsageMetric;
  used: number;
  limit: number | "unlimited";
  unit: string;
  periodStart: string;
  periodEnd: string;
}

export interface Invoice extends Timestamped, OwnedEntity {
  id: EntityId;
  invoiceNumber: string;
  subscriptionId?: EntityId;
  status: InvoiceStatus;
  amountSubtotal: number;
  taxAmount: number;
  amountTotal: number;
  currency: CurrencyCode;
  issuedAt: string;
  dueAt?: string;
  paidAt?: string;
  downloadUrl?: string;
  provider: PaymentProvider;
}

export interface PaymentMethod extends Timestamped, OwnedEntity {
  id: EntityId;
  provider: PaymentProvider;
  type: PaymentMethodType;
  label: string;
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  default: boolean;
}

export interface BillingSummary {
  subscription: OrganizationSubscription;
  plan: Plan;
  usage: UsageRecord[];
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  trialStatus: TrialStatus;
  renewalDate?: string;
  remainingQuota: Record<UsageMetric, number | "unlimited">;
}

export interface BillingProviderAdapter {
  provider: PaymentProvider;
  createCheckoutSession: (planId: PlanId) => Promise<{ url?: string; provider: PaymentProvider; error?: string }>;
  createCustomerPortal: () => Promise<{ url?: string; provider: PaymentProvider; error?: string }>;
}
