import type { Quotation, QuotationFilters } from "@/lib/models";
import { organizationRest } from "./organizationSupabaseRest";
import {
  buildQuotationComparison,
  buildQuotationDashboardSummary,
  filterQuotations,
  mapSupabaseQuotationToDomain,
  type SupabaseQuotationRecord
} from "./quotationMapper";

const quotationSelect = [
  "id",
  "owner_id",
  "organization_id",
  "project_id",
  "rfq_id",
  "supplier_id",
  "supplier_name",
  "supplier_slug",
  "currency",
  "total_price",
  "status",
  "submission_date",
  "expiration_date",
  "lead_time",
  "delivery_terms",
  "payment_terms",
  "warranty",
  "commercial_notes",
  "technical_notes",
  "attachments",
  "items",
  "evaluation",
  "metadata",
  "created_at",
  "updated_at"
].join(",");

async function loadQuotations() {
  const result = await organizationRest<SupabaseQuotationRecord[]>(
    `/quotations?select=${encodeURIComponent(quotationSelect)}&order=updated_at.desc`
  );
  if (result.error) {
    return { data: [] as Quotation[], source: "supabase" as const, isFallback: false, error: result.error };
  }
  return {
    data: (result.data || []).map(mapSupabaseQuotationToDomain),
    source: "supabase" as const,
    isFallback: false
  };
}

export const quotationSupabaseAdapter = {
  async getQuotations(filters: QuotationFilters = {}) {
    const result = await loadQuotations();
    if (result.error) return result;
    return { ...result, data: filterQuotations(result.data, filters) };
  },

  async getQuotation(id: string) {
    const result = await organizationRest<SupabaseQuotationRecord[]>(
      `/quotations?id=eq.${encodeURIComponent(id)}&select=${encodeURIComponent(quotationSelect)}&limit=1`
    );
    if (result.error) {
      return { data: undefined as Quotation | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    }
    const record = result.data?.[0];
    return { data: record ? mapSupabaseQuotationToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async getQuotationsByRfq(rfqId: string) {
    const result = await loadQuotations();
    if (result.error) return result;
    return { ...result, data: filterQuotations(result.data, { rfqId }) };
  },

  async getComparison(rfqId = "RFQ-1001") {
    const result = await loadQuotations();
    if (result.error) {
      return {
        data: buildQuotationComparison([], rfqId),
        source: "supabase" as const,
        isFallback: false,
        error: result.error
      };
    }
    return {
      data: buildQuotationComparison(result.data, rfqId),
      source: "supabase" as const,
      isFallback: false
    };
  },

  async getDashboardSummary() {
    const result = await loadQuotations();
    if (result.error) {
      return {
        data: buildQuotationDashboardSummary([]),
        source: "supabase" as const,
        isFallback: false,
        error: result.error
      };
    }
    return {
      data: buildQuotationDashboardSummary(result.data),
      source: "supabase" as const,
      isFallback: false
    };
  }
};
