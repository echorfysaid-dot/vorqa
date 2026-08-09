"use client";

import { useEffect, useState } from "react";
import type { KnowledgeArticle, KnowledgeArticleFilters } from "@/lib/models";
import { knowledgeRepository } from "./knowledgeRepository";

type KnowledgeState = {
  data: KnowledgeArticle[];
  source: "demo" | "supabase" | "auto" | "demo-fallback";
  isFallback: boolean;
  loading: boolean;
  error?: string;
};

export function useKnowledgeRepository(filters: KnowledgeArticleFilters = {}): KnowledgeState {
  const [state, setState] = useState<KnowledgeState>({
    data: [],
    source: "demo",
    isFallback: false,
    loading: true
  });
  const { organizationId, projectId, category, tag, status, query } = filters;

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    knowledgeRepository.getKnowledge({ organizationId, projectId, category, tag, status, query }).then((result) => {
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
  }, [organizationId, projectId, category, tag, status, query]);

  return state;
}
