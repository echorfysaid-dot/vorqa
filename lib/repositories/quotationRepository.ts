import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { Quotation, QuotationComparison, QuotationDashboardSummary, QuotationFilters } from "@/lib/models";
import { quotationDemoAdapter } from "./quotationDemoAdapter";
import { quotationSupabaseAdapter } from "./quotationSupabaseAdapter";
import { cachedRepositoryCall } from "./repositoryCache";

export type QuotationRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
  demo: () => QuotationRepositoryResult<T> | Promise<QuotationRepositoryResult<T>>,
  supabase: () => QuotationRepositoryResult<T> | Promise<QuotationRepositoryResult<T>>
): Promise<QuotationRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

export const quotationRepository = {
  list(): Quotation[] {
    return quotationDemoAdapter.getQuotations().data;
  },

  getById(id: string): Quotation | undefined {
    return quotationDemoAdapter.getQuotation(id).data;
  },

  getComparisonSync(rfqId = "RFQ-1001"): QuotationComparison {
    return quotationDemoAdapter.getComparison(rfqId).data;
  },

  getDashboardSummarySync(): QuotationDashboardSummary {
    return quotationDemoAdapter.getDashboardSummary().data;
  },

  async getQuotations(filters: QuotationFilters = {}): Promise<QuotationRepositoryResult<Quotation[]>> {
    return withMode(() => quotationDemoAdapter.getQuotations(filters), () => quotationSupabaseAdapter.getQuotations(filters));
  },

  async getQuotation(id: string): Promise<QuotationRepositoryResult<Quotation | undefined>> {
    return withMode(() => quotationDemoAdapter.getQuotation(id), () => quotationSupabaseAdapter.getQuotation(id));
  },

  async getQuotationsByRfq(rfqId: string): Promise<QuotationRepositoryResult<Quotation[]>> {
    return withMode(() => quotationDemoAdapter.getQuotationsByRfq(rfqId), () => quotationSupabaseAdapter.getQuotationsByRfq(rfqId));
  },

  async getComparison(rfqId = "RFQ-1001"): Promise<QuotationRepositoryResult<QuotationComparison>> {
    return cachedRepositoryCall(`quotations:comparison:${rfqId}`, 20_000, () => withMode(() => quotationDemoAdapter.getComparison(rfqId), () => quotationSupabaseAdapter.getComparison(rfqId)));
  },

  async getDashboardSummary(): Promise<QuotationRepositoryResult<QuotationDashboardSummary>> {
    return cachedRepositoryCall("quotations:dashboard-summary", 20_000, () => withMode(() => quotationDemoAdapter.getDashboardSummary(), () => quotationSupabaseAdapter.getDashboardSummary()));
  }
};
