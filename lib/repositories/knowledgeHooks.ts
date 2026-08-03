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

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    knowledgeRepository.getKnowledge(filters).then((result) => {
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
  }, [filters.organizationId, filters.projectId, filters.category, filters.tag, filters.status, filters.query]);

  return state;
}
