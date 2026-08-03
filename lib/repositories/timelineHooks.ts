"use client";

import { useEffect, useState } from "react";
import type { ProjectTimeline } from "@/lib/models";
import { timelineRepository } from "./timelineRepository";

type TimelineState = {
  data: ProjectTimeline;
  source: "demo" | "supabase" | "auto" | "demo-fallback";
  isFallback: boolean;
  loading: boolean;
  error?: string;
};

export function useTimelineRepository(projectId: string): TimelineState {
  const [state, setState] = useState<TimelineState>({
    data: { projectId, milestones: [], dependencies: [] },
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    timelineRepository.getTimeline(projectId).then((result) => {
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
