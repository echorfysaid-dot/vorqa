import type { BillingProviderAdapter, BillingSummary, Invoice, OrganizationSubscription, PaymentMethod, Plan, UsageRecord } from "@/lib/models";
import { calculateRemainingQuota } from "./billingMapper";

export const demoPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "For exploring Vorqa with one lightweight workspace.",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "MAD",
    interval: "monthly",
    limits: { organizations: 1, members: 2, projects: 1, storage: 1, ai_requests: 25, marketplace_actions: 10, rfqs: 1, contracts: 0, notifications: 100, documents: 25 },
    features: ["1 organization", "1 active project", "25 AI requests", "Basic marketplace browsing"]
  },
  {
    id: "starter",
    name: "Starter",
    description: "For small teams managing early construction projects.",
    priceMonthly: 290,
    priceYearly: 2900,
    currency: "MAD",
    interval: "monthly",
    limits: { organizations: 1, members: 8, projects: 5, storage: 25, ai_requests: 500, marketplace_actions: 100, rfqs: 10, contracts: 5, notifications: 2000, documents: 500 },
    features: ["5 projects", "8 members", "25GB storage", "500 VORA AI requests", "RFQ workspace"]
  },
  {
    id: "professional",
    name: "Professional",
    description: "For construction companies coordinating projects, vendors, RFQs, and contracts.",
    priceMonthly: 890,
    priceYearly: 8900,
    currency: "MAD",
    interval: "monthly",
    recommended: true,
    limits: { organizations: 3, members: 40, projects: 25, storage: 250, ai_requests: 5000, marketplace_actions: 1000, rfqs: 100, contracts: 50, notifications: 25000, documents: 5000 },
    features: ["25 projects", "40 members", "250GB storage", "5,000 AI requests", "Marketplace + RFQ + contracts", "Priority support"]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large owners, groups, and multi-organization construction operations.",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "MAD",
    interval: "manual",
    limits: { organizations: "unlimited", members: "unlimited", projects: "unlimited", storage: "unlimited", ai_requests: "unlimited", marketplace_actions: "unlimited", rfqs: "unlimited", contracts: "unlimited", notifications: "unlimited", documents: "unlimited" },
    features: ["Unlimited workspaces", "Custom AI limits", "Dedicated onboarding", "Manual invoicing", "Enterprise support"]
  }
];

const demoSubscription: OrganizationSubscription = {
  id: "SUB-1001",
  organizationId: "atlas",
  organizationName: "Atlas Construction Group",
  planId: "professional",
  status: "trialing",
  interval: "monthly",
  provider: "manual",
  currentPeriodStart: "2026-07-01T00:00:00.000Z",
  currentPeriodEnd: "2026-08-01T00:00:00.000Z",
  renewalDate: "2026-08-01T00:00:00.000Z",
  trialStatus: "active",
  trialEndsAt: "2026-08-03T00:00:00.000Z",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-20T08:00:00.000Z"
};

const demoUsage: UsageRecord[] = [
  { id: "USE-ORG", organizationId: "atlas", metric: "organizations", used: 1, limit: 3, unit: "workspace", periodStart: demoSubscription.currentPeriodStart!, periodEnd: demoSubscription.currentPeriodEnd! },
  { id: "USE-MEM", organizationId: "atlas", metric: "members", used: 10, limit: 40, unit: "member", periodStart: demoSubscription.currentPeriodStart!, periodEnd: demoSubscription.currentPeriodEnd! },
  { id: "USE-PRJ", organizationId: "atlas", metric: "projects", used: 4, limit: 25, unit: "project", periodStart: demoSubscription.currentPeriodStart!, periodEnd: demoSubscription.currentPeriodEnd! },
  { id: "USE-STO", organizationId: "atlas", metric: "storage", used: 64, limit: 250, unit: "GB", periodStart: demoSubscription.currentPeriodStart!, periodEnd: demoSubscription.currentPeriodEnd! },
  { id: "USE-AI", organizationId: "atlas", metric: "ai_requests", used: 1240, limit: 5000, unit: "request", periodStart: demoSubscription.currentPeriodStart!, periodEnd: demoSubscription.currentPeriodEnd! },
  { id: "USE-MKT", organizationId: "atlas", metric: "marketplace_actions", used: 132, limit: 1000, unit: "action", periodStart: demoSubscription.currentPeriodStart!, periodEnd: demoSubscription.currentPeriodEnd! },
  { id: "USE-RFQ", organizationId: "atlas", metric: "rfqs", used: 8, limit: 100, unit: "RFQ", periodStart: demoSubscription.currentPeriodStart!, periodEnd: demoSubscription.currentPeriodEnd! },
  { id: "USE-CON", organizationId: "atlas", metric: "contracts", used: 3, limit: 50, unit: "contract", periodStart: demoSubscription.currentPeriodStart!, periodEnd: demoSubscription.currentPeriodEnd! },
  { id: "USE-NOT", organizationId: "atlas", metric: "notifications", used: 840, limit: 25000, unit: "notification", periodStart: demoSubscription.currentPeriodStart!, periodEnd: demoSubscription.currentPeriodEnd! },
  { id: "USE-DOC", organizationId: "atlas", metric: "documents", used: 318, limit: 5000, unit: "document", periodStart: demoSubscription.currentPeriodStart!, periodEnd: demoSubscription.currentPeriodEnd! }
];

const demoInvoices: Invoice[] = [
  { id: "INV-1003", organizationId: "atlas", invoiceNumber: "VORQA-2026-1003", subscriptionId: "SUB-1001", status: "open", amountSubtotal: 890, taxAmount: 178, amountTotal: 1068, currency: "MAD", issuedAt: "2026-07-20T00:00:00.000Z", dueAt: "2026-08-01T00:00:00.000Z", provider: "manual" },
  { id: "INV-1002", organizationId: "atlas", invoiceNumber: "VORQA-2026-1002", subscriptionId: "SUB-1001", status: "paid", amountSubtotal: 890, taxAmount: 178, amountTotal: 1068, currency: "MAD", issuedAt: "2026-06-20T00:00:00.000Z", paidAt: "2026-06-21T10:00:00.000Z", provider: "manual" },
  { id: "INV-1001", organizationId: "atlas", invoiceNumber: "VORQA-2026-1001", subscriptionId: "SUB-1001", status: "paid", amountSubtotal: 890, taxAmount: 178, amountTotal: 1068, currency: "MAD", issuedAt: "2026-05-20T00:00:00.000Z", paidAt: "2026-05-20T16:30:00.000Z", provider: "manual" }
];

const demoPaymentMethods: PaymentMethod[] = [
  { id: "PM-1001", organizationId: "atlas", provider: "manual", type: "manual_invoice", label: "Manual invoice to Atlas finance", default: true, createdAt: "2026-07-01T00:00:00.000Z" }
];

export const billingProviderAdapters: BillingProviderAdapter[] = [
  { provider: "stripe", createCheckoutSession: async (planId) => ({ provider: "stripe", error: `Stripe checkout is prepared for ${planId} but not connected yet.` }), createCustomerPortal: async () => ({ provider: "stripe", error: "Stripe customer portal is not connected yet." }) },
  { provider: "lemon_squeezy", createCheckoutSession: async (planId) => ({ provider: "lemon_squeezy", error: `Lemon Squeezy checkout is prepared for ${planId} but not connected yet.` }), createCustomerPortal: async () => ({ provider: "lemon_squeezy", error: "Lemon Squeezy portal is not connected yet." }) },
  { provider: "manual", createCheckoutSession: async () => ({ provider: "manual", error: "Manual invoice checkout does not use a hosted session." }), createCustomerPortal: async () => ({ provider: "manual", error: "Manual invoices are managed by finance." }) }
];

export const billingDemoAdapter = {
  getPlans() {
    return { data: demoPlans, source: "demo" as const, isFallback: false };
  },
  getCurrentSubscription() {
    return { data: demoSubscription, source: "demo" as const, isFallback: false };
  },
  getUsage() {
    return { data: demoUsage, source: "demo" as const, isFallback: false };
  },
  getInvoices() {
    return { data: demoInvoices, source: "demo" as const, isFallback: false };
  },
  getPaymentMethods() {
    return { data: demoPaymentMethods, source: "demo" as const, isFallback: false };
  },
  getSummary() {
    const plan = demoPlans.find((item) => item.id === demoSubscription.planId) || demoPlans[0];
    const summary: BillingSummary = {
      subscription: demoSubscription,
      plan,
      usage: demoUsage,
      invoices: demoInvoices,
      paymentMethods: demoPaymentMethods,
      trialStatus: demoSubscription.trialStatus,
      renewalDate: demoSubscription.renewalDate,
      remainingQuota: calculateRemainingQuota(plan, demoUsage)
    };
    return { data: summary, source: "demo" as const, isFallback: false };
  }
};
