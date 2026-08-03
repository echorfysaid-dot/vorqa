"use client";

import { useEffect, useState } from "react";
import type { Quotation, QuotationComparison, QuotationDashboardSummary, QuotationFilters } from "@/lib/models";
import { quotationRepository, type QuotationRepositoryResult } from "./quotationRepository";

type QuotationState<T> = QuotationRepositoryResult<T> & {
  loading: boolean;
};

function initialState<T>(data: T): QuotationState<T> {
  return {
    data,
    source: "demo",
    isFallback: false,
    loading: true
  };
}

export function useQuotations(filters: QuotationFilters = {}) {
  const [state, setState] = useState<QuotationState<Quotation[]>>(() => initialState(quotationRepository.list()));

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    quotationRepository.getQuotations(filters).then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, [filters.query, filters.rfqId, filters.supplier, filters.status, filters.category, filters.recommendation]);

  return state;
}

export function useQuotation(id: string) {
  const [state, setState] = useState<QuotationState<Quotation | undefined>>(() => initialState(quotationRepository.getById(id)));

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    quotationRepository.getQuotation(id).then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, [id]);

  return state;
}

export function useQuotationComparison(rfqId = "RFQ-1001") {
  const [state, setState] = useState<QuotationState<QuotationComparison>>(() => initialState(quotationRepository.getComparisonSync(rfqId)));

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    quotationRepository.getComparison(rfqId).then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, [rfqId]);

  return state;
}

export function useQuotationDashboard() {
  const [state, setState] = useState<QuotationState<QuotationDashboardSummary>>(() => initialState(quotationRepository.getDashboardSummarySync()));

  useEffect(() => {
    let active = true;
    quotationRepository.getDashboardSummary().then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
