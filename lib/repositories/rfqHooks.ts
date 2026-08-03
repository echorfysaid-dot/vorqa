"use client";

import { useEffect, useState } from "react";
import type { RFQ, RFQFilters, RFQSummary } from "@/lib/models";
import { rfqRepository, type RfqRepositoryResult } from "./rfqRepository";

type RfqState<T> = RfqRepositoryResult<T> & {
  loading: boolean;
};

function initialState<T>(data: T): RfqState<T> {
  return {
    data,
    source: "demo",
    isFallback: false,
    loading: true
  };
}

export function useRfqs(filters: RFQFilters = {}) {
  const [state, setState] = useState<RfqState<RFQ[]>>(() => initialState(rfqRepository.list()));

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    rfqRepository.getRfqs(filters).then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, [filters.query, filters.status, filters.category, filters.projectId, filters.organizationId, filters.priority, filters.supplier]);

  return state;
}

export function useRfqSummary() {
  const [state, setState] = useState<RfqState<RFQSummary>>(() => initialState({
    draft: 0,
    published: 0,
    pendingResponses: 0,
    underReview: 0,
    awarded: 0,
    cancelled: 0,
    closed: 0,
    upcomingDeadlines: [],
    recentlyCreated: []
  }));

  useEffect(() => {
    let active = true;
    rfqRepository.getSummary().then((result) => {
      if (!active) return;
      setState({ ...result, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
