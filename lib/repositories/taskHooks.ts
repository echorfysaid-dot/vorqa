"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/models";
import { taskRepository } from "./taskRepository";

type TasksState = {
  data: Task[];
  source: "demo" | "supabase" | "auto" | "demo-fallback";
  isFallback: boolean;
  loading: boolean;
  error?: string;
};

export function useTasksRepository(projectId: string): TasksState {
  const [state, setState] = useState<TasksState>({
    data: [],
    source: "demo",
    isFallback: false,
    loading: true
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    taskRepository.getTasks(projectId).then((result) => {
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
