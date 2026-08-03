import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { BillingSummary, Invoice, OrganizationSubscription, PaymentMethod, Plan, UsageRecord } from "@/lib/models";
import { billingDemoAdapter } from "./billingDemoAdapter";
import { billingSupabaseAdapter } from "./billingSupabaseAdapter";
import { cachedRepositoryCall } from "./repositoryCache";

export type BillingRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
  demo: () => BillingRepositoryResult<T> | Promise<BillingRepositoryResult<T>>,
  supabase: () => BillingRepositoryResult<T> | Promise<BillingRepositoryResult<T>>
): Promise<BillingRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

export const billingRepository = {
  listPlans(): Plan[] {
    return billingDemoAdapter.getPlans().data;
  },

  getSummarySync(): BillingSummary {
    return billingDemoAdapter.getSummary().data;
  },

  async getPlans(): Promise<BillingRepositoryResult<Plan[]>> {
    return cachedRepositoryCall("billing:plans", 60_000, () => withMode(() => billingDemoAdapter.getPlans(), () => billingSupabaseAdapter.getPlans()));
  },

  async getCurrentSubscription(): Promise<BillingRepositoryResult<OrganizationSubscription | undefined>> {
    return cachedRepositoryCall("billing:subscription", 30_000, () => withMode(() => billingDemoAdapter.getCurrentSubscription(), () => billingSupabaseAdapter.getCurrentSubscription()));
  },

  async getUsage(): Promise<BillingRepositoryResult<UsageRecord[]>> {
    return cachedRepositoryCall("billing:usage", 20_000, () => withMode(() => billingDemoAdapter.getUsage(), () => billingSupabaseAdapter.getUsage()));
  },

  async getInvoices(): Promise<BillingRepositoryResult<Invoice[]>> {
    return cachedRepositoryCall("billing:invoices", 30_000, () => withMode(() => billingDemoAdapter.getInvoices(), () => billingSupabaseAdapter.getInvoices()));
  },

  async getPaymentMethods(): Promise<BillingRepositoryResult<PaymentMethod[]>> {
    return cachedRepositoryCall("billing:payment-methods", 30_000, () => withMode(() => billingDemoAdapter.getPaymentMethods(), () => billingSupabaseAdapter.getPaymentMethods()));
  },

  async getSummary(): Promise<BillingRepositoryResult<BillingSummary>> {
    return cachedRepositoryCall("billing:summary", 20_000, async () => {
      const result = await withMode(() => billingDemoAdapter.getSummary(), () => billingSupabaseAdapter.getSummary());
      if (!result.data) return { ...billingDemoAdapter.getSummary(), source: "demo-fallback" as const, isFallback: true, error: result.error };
      return result as BillingRepositoryResult<BillingSummary>;
    });
  }
};
