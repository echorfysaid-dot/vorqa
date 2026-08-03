import type { BillingSummary, Invoice, OrganizationSubscription, PaymentMethod, Plan, UsageRecord } from "@/lib/models";
import { organizationRest } from "./organizationSupabaseRest";
import { calculateRemainingQuota, mapInvoiceRow, mapPaymentMethodRow, mapPlanRow, mapSubscriptionRow, mapUsageRow, type BillingInvoiceRow, type BillingPlanRow, type BillingSubscriptionRow, type BillingUsageRow, type PaymentMethodRow } from "./billingMapper";

export const billingSupabaseAdapter = {
  async getPlans() {
    const result = await organizationRest<BillingPlanRow[]>("/billing_plans?select=*&order=price_monthly.asc");
    if (result.error || !result.data) return { data: [] as Plan[], source: "supabase" as const, isFallback: false, error: result.error || "Billing plans are unavailable." };
    return { data: result.data.map(mapPlanRow), source: "supabase" as const, isFallback: false };
  },

  async getCurrentSubscription() {
    const result = await organizationRest<BillingSubscriptionRow[]>("/organization_subscriptions?select=*&order=created_at.desc&limit=1");
    if (result.error || !result.data?.[0]) return { data: undefined as OrganizationSubscription | undefined, source: "supabase" as const, isFallback: false, error: result.error || "No subscription found." };
    return { data: mapSubscriptionRow(result.data[0]), source: "supabase" as const, isFallback: false };
  },

  async getUsage() {
    const result = await organizationRest<BillingUsageRow[]>("/billing_usage_records?select=*&order=period_end.desc");
    if (result.error || !result.data) return { data: [] as UsageRecord[], source: "supabase" as const, isFallback: false, error: result.error || "Billing usage is unavailable." };
    return { data: result.data.map(mapUsageRow), source: "supabase" as const, isFallback: false };
  },

  async getInvoices() {
    const result = await organizationRest<BillingInvoiceRow[]>("/billing_invoices?select=*&order=issued_at.desc");
    if (result.error || !result.data) return { data: [] as Invoice[], source: "supabase" as const, isFallback: false, error: result.error || "Invoices are unavailable." };
    return { data: result.data.map(mapInvoiceRow), source: "supabase" as const, isFallback: false };
  },

  async getPaymentMethods() {
    const result = await organizationRest<PaymentMethodRow[]>("/billing_payment_methods?select=*&order=created_at.desc");
    if (result.error || !result.data) return { data: [] as PaymentMethod[], source: "supabase" as const, isFallback: false, error: result.error || "Payment methods are unavailable." };
    return { data: result.data.map(mapPaymentMethodRow), source: "supabase" as const, isFallback: false };
  },

  async getSummary() {
    const [plans, subscription, usage, invoices, paymentMethods] = await Promise.all([
      this.getPlans(),
      this.getCurrentSubscription(),
      this.getUsage(),
      this.getInvoices(),
      this.getPaymentMethods()
    ]);
    const error = plans.error || subscription.error || usage.error || invoices.error || paymentMethods.error;
    const selectedPlan = plans.data.find((plan) => plan.id === subscription.data?.planId) || plans.data[0];
    if (error || !subscription.data || !selectedPlan) {
      return { data: undefined as BillingSummary | undefined, source: "supabase" as const, isFallback: false, error: error || "Billing summary is unavailable." };
    }
    return {
      data: {
        subscription: subscription.data,
        plan: selectedPlan,
        usage: usage.data,
        invoices: invoices.data,
        paymentMethods: paymentMethods.data,
        trialStatus: subscription.data.trialStatus,
        renewalDate: subscription.data.renewalDate,
        remainingQuota: calculateRemainingQuota(selectedPlan, usage.data)
      },
      source: "supabase" as const,
      isFallback: false
    };
  }
};
