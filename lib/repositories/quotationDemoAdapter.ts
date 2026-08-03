import type { Quotation, QuotationFilters } from "@/lib/models";
import { demoQuotations } from "@/lib/data";
import {
  buildQuotationComparison,
  buildQuotationDashboardSummary,
  filterQuotations,
  mapDemoQuotationToManagedQuotation
} from "./quotationMapper";

function quotations(): Quotation[] {
  return demoQuotations.map((quote, index) => mapDemoQuotationToManagedQuotation(quote, index, "RFQ-1001"));
}

export const quotationDemoAdapter = {
  getQuotations(filters: QuotationFilters = {}) {
    return { data: filterQuotations(quotations(), filters), source: "demo" as const, isFallback: false };
  },

  getQuotation(id: string) {
    return { data: quotations().find((quotation) => quotation.id === id), source: "demo" as const, isFallback: false };
  },

  getQuotationsByRfq(rfqId: string) {
    return { data: filterQuotations(quotations(), { rfqId }), source: "demo" as const, isFallback: false };
  },

  getComparison(rfqId = "RFQ-1001") {
    return { data: buildQuotationComparison(quotations(), rfqId), source: "demo" as const, isFallback: false };
  },

  getDashboardSummary() {
    return { data: buildQuotationDashboardSummary(quotations()), source: "demo" as const, isFallback: false };
  }
};
