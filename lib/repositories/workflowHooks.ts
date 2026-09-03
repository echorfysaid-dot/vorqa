"use client";

import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/lib/models";
import { workflowSupabaseAdapter } from "@/lib/repositories/workflowSupabaseAdapter";
import type { ProjectWorkflowState } from "@/types/project-workflow";

const empty: ProjectWorkflowState = { workflows: [], events: [], participants: [], authority: { viewerRole: "other_project_member", isProjectOwner: false, canReview: false, canApprove: false, confirmed: false }, source: "legacy" };

export function useProjectWorkflow(project: Project, userId?: string) {
  const [data, setData] = useState<ProjectWorkflowState>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [commandPending, setCommandPending] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await workflowSupabaseAdapter.load(project, userId);
    setData(result.data); setError(result.error); setLoading(false);
  }, [project, userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const command = useCallback(async (name: string, payload: Record<string, unknown>) => {
    setCommandPending(true); setError(undefined);
    const result = await workflowSupabaseAdapter.command(name, payload);
    if (result.error) setError(result.error);
    await refresh();
    setCommandPending(false);
    return !result.error;
  }, [refresh]);

  return { data, loading, error, commandPending, refresh, command };
}
