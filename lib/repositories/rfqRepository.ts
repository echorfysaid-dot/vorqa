import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { Quotation, RFQ, RFQFilters, RFQInput, RFQSummary } from "@/lib/models";
import { rfqDemoAdapter } from "./rfqDemoAdapter";
import { rfqSupabaseAdapter } from "./rfqSupabaseAdapter";
import { cachedRepositoryCall } from "./repositoryCache";

export type DemoRfq = RFQ;
export type DemoQuotation = Quotation;

export type RfqRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
  demo: () => RfqRepositoryResult<T> | Promise<RfqRepositoryResult<T>>,
  supabase: () => RfqRepositoryResult<T> | Promise<RfqRepositoryResult<T>>
): Promise<RfqRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

export const rfqRepository = {
  list(): RFQ[] {
    return rfqDemoAdapter.getRfqs().data;
  },

  async getRfqs(filters: RFQFilters = {}): Promise<RfqRepositoryResult<RFQ[]>> {
    return withMode(() => rfqDemoAdapter.getRfqs(filters), () => rfqSupabaseAdapter.getRfqs(filters));
  },

  getById(id: string): RFQ | undefined {
    return rfqDemoAdapter.getRfq(id).data;
  },

  async getRfq(id: string): Promise<RfqRepositoryResult<RFQ | undefined>> {
    return withMode(() => rfqDemoAdapter.getRfq(id), () => rfqSupabaseAdapter.getRfq(id));
  },

  async createRfq(input: RFQInput): Promise<RfqRepositoryResult<RFQ | undefined>> {
    return withMode(() => rfqDemoAdapter.createRfq(input), () => rfqSupabaseAdapter.createRfq(input));
  },

  async updateRfq(id: string, input: Partial<RFQInput>): Promise<RfqRepositoryResult<RFQ | undefined>> {
    return withMode(() => rfqDemoAdapter.updateRfq(id, input), () => rfqSupabaseAdapter.updateRfq(id, input));
  },

  async getSummary(): Promise<RfqRepositoryResult<RFQSummary>> {
    return cachedRepositoryCall("rfq:summary", 20_000, () => withMode(() => rfqDemoAdapter.getSummary(), () => rfqSupabaseAdapter.getSummary()));
  },

  listQuotations(): Quotation[] {
    return rfqDemoAdapter.getQuotations().data;
  },

  listWizardSteps(): string[] {
    return rfqDemoAdapter.getWizardSteps().data;
  },

  listAwardSteps(): string[] {
    return rfqDemoAdapter.getAwardSteps().data;
  }
};
