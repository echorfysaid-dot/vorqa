"use client";

import { useEffect, useState } from "react";
import type { DashboardAnalyticsSummary } from "@/lib/models";
import { analyticsRepository } from "./analyticsRepository";

type AnalyticsState = {
  data?: DashboardAnalyticsSummary;
  source: "demo" | "supabase" | "auto" | "demo-fallback";
  isFallback: boolean;
  loading: boolean;
  error?: string;
};

export function useAnalyticsSummary(organizationId?: string, projectId?: string): AnalyticsState {
  const [state, setState] = useState<AnalyticsState>({
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    analyticsRepository.getDashboardSummary(organizationId, projectId).then((result) => {
      if (!active) return;
      setState({
        data: result.data,
        source: result.source,
        isFallback: result.isFallback,
        error: result.error,
        loading: false
      });
    });
    return () => {
      active = false;
    };
  }, [organizationId, projectId]);

  return state;
}
