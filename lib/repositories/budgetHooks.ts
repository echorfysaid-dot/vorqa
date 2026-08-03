"use client";

import { useEffect, useState } from "react";
import type { ProjectBudget } from "@/lib/models";
import { budgetRepository } from "./budgetRepository";

type BudgetState = {
  data: ProjectBudget;
  source: "demo" | "supabase" | "auto" | "demo-fallback";
  isFallback: boolean;
  loading: boolean;
  error?: string;
};

export function useBudgetRepository(projectId: string): BudgetState {
  const [state, setState] = useState<BudgetState>({
    data: { projectId, categories: [], items: [] },
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    budgetRepository.getBudget(projectId).then((result) => {
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
  }, [projectId]);

  return state;
}
