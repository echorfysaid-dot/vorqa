"use client";

import { useEffect, useState } from "react";
import type { Document } from "@/lib/models";
import { documentRepository } from "./documentRepository";

type DocumentsState = {
  data: Document[];
  source: "demo" | "supabase" | "auto" | "demo-fallback";
  isFallback: boolean;
  loading: boolean;
  error?: string;
};

export function useDocumentsRepository(projectId: string): DocumentsState {
  const [state, setState] = useState<DocumentsState>({
    data: [],
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    documentRepository.getDocuments(projectId).then((result) => {
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
