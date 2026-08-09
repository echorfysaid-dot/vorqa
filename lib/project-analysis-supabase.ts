import { isApiError, supabaseRest } from "@/lib/supabase-server";
import type { ProjectAnalysisAdapter } from "@/lib/project-analysis-adapter";
import type {
  ProjectAnalysisMetadata,
  ProjectAnalysisRecord,
  ProjectAnalysisSession,
  ProjectAnalysisToolType
} from "@/types/project-analysis";

type SupabaseRestClient = (path: string, init?: RequestInit & { token?: string; serviceRole?: boolean }) => Promise<unknown>;

type ProjectAnalysisSessionRow = {
  id: string;
  project_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  status: "active" | "archived";
  metadata: ProjectAnalysisMetadata | null;
};

type ProjectAnalysisRow = {
  id: string;
  session_id: string;
  project_id: string;
  owner_id: string;
  tool_type: ProjectAnalysisToolType;
  status: "completed" | "failed" | "pending";
  created_at: string;
  updated_at: string;
  version: number;
  analysis_result: unknown;
  health: ProjectAnalysisRecord["health"];
  confidence: number | null;
  metadata: ProjectAnalysisMetadata | null;
};

function encodeFilter(value: string) {
  return encodeURIComponent(value);
}

function timestamp(now?: Date) {
  return (now || new Date()).toISOString();
}

function sessionFromRow(row: ProjectAnalysisSessionRow): ProjectAnalysisSession {
  return Object.freeze({
    id: row.id,
    projectId: row.project_id,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    metadata: Object.freeze(row.metadata || {})
  });
}

function analysisFromRow(row: ProjectAnalysisRow): ProjectAnalysisRecord {
  return Object.freeze({
    id: row.id,
    sessionId: row.session_id,
    projectId: row.project_id,
    ownerId: row.owner_id,
    toolType: row.tool_type,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
    analysisResult: row.analysis_result,
    health: row.health,
    confidence: row.confidence ?? undefined,
    metadata: Object.freeze(row.metadata || {})
  });
}

function assertSupabase<T>(result: unknown): T {
  if (isApiError(result)) throw new Error(result.error);
  return result as T;
}

export function createProjectAnalysisSupabaseAdapter({
  token,
  rest = supabaseRest
}: {
  token?: string;
  rest?: SupabaseRestClient;
} = {}): ProjectAnalysisAdapter {
  async function createSession(input: Parameters<ProjectAnalysisAdapter["createSession"]>[0]) {
    const existing = assertSupabase<ProjectAnalysisSessionRow[]>(
      await rest(
        `/project_analysis_sessions?project_id=eq.${encodeFilter(input.projectId)}&owner_id=eq.${encodeFilter(input.ownerId)}&status=eq.active&limit=1`,
        { token }
      )
    )[0];
    if (existing) return sessionFromRow(existing);

    const now = timestamp(input.now);
    const inserted = assertSupabase<ProjectAnalysisSessionRow[]>(
      await rest("/project_analysis_sessions", {
        method: "POST",
        token,
        body: JSON.stringify({
          project_id: input.projectId,
          owner_id: input.ownerId,
          status: "active",
          created_at: now,
          updated_at: now,
          metadata: input.metadata || {}
        })
      })
    )[0];
    if (!inserted) throw new Error("Project analysis session was not created.");
    return sessionFromRow(inserted);
  }

  async function latestAnalysis(projectId: string, toolType: ProjectAnalysisToolType, ownerId?: string) {
    const ownerFilter = ownerId ? `&owner_id=eq.${encodeFilter(ownerId)}` : "";
    const rows = assertSupabase<ProjectAnalysisRow[]>(
      await rest(
        `/project_analyses?project_id=eq.${encodeFilter(projectId)}&tool_type=eq.${encodeFilter(toolType)}${ownerFilter}&order=version.desc,updated_at.desc&limit=1`,
        { token }
      )
    );
    return rows[0] ? analysisFromRow(rows[0]) : undefined;
  }

  async function saveAnalysis(input: Parameters<ProjectAnalysisAdapter["saveAnalysis"]>[0]) {
    const session = input.sessionId
      ? await loadSession(input.sessionId).catch(() => undefined)
      : await createSession(input);
    const activeSession = session || (await createSession(input));
    const latest = await latestAnalysis(input.projectId, input.toolType, input.ownerId);
    const now = timestamp(input.now);
    const inserted = assertSupabase<ProjectAnalysisRow[]>(
      await rest("/project_analyses", {
        method: "POST",
        token,
        body: JSON.stringify({
          session_id: activeSession.id,
          project_id: input.projectId,
          owner_id: input.ownerId,
          tool_type: input.toolType,
          status: input.status || "completed",
          version: latest ? latest.version + 1 : 1,
          analysis_result: input.analysisResult,
          health: input.health || "Needs Review",
          confidence: input.confidence ?? null,
          metadata: { ...(input.metadata || {}), persistedAt: now },
          created_at: now,
          updated_at: now
        })
      })
    )[0];
    if (!inserted) throw new Error("Project analysis was not saved.");
    return analysisFromRow(inserted);
  }

  async function loadSession(id: string) {
    const rows = assertSupabase<ProjectAnalysisSessionRow[]>(
      await rest(`/project_analysis_sessions?id=eq.${encodeFilter(id)}&limit=1`, { token })
    );
    if (!rows[0]) throw new Error("Project analysis session not found.");
    return sessionFromRow(rows[0]);
  }

  async function updateAnalysis(id: string, patch: Parameters<ProjectAnalysisAdapter["updateAnalysis"]>[1]) {
    const now = timestamp(patch.now);
    const rows = assertSupabase<ProjectAnalysisRow[]>(
      await rest(`/project_analyses?id=eq.${encodeFilter(id)}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          ...(patch.status ? { status: patch.status } : {}),
          ...("analysisResult" in patch ? { analysis_result: patch.analysisResult } : {}),
          ...(patch.health ? { health: patch.health } : {}),
          ...("confidence" in patch ? { confidence: patch.confidence ?? null } : {}),
          ...(patch.metadata ? { metadata: patch.metadata } : {}),
          updated_at: now
        })
      })
    );
    return rows[0] ? analysisFromRow(rows[0]) : undefined;
  }

  async function loadAnalysis(id: string) {
    const rows = assertSupabase<ProjectAnalysisRow[]>(await rest(`/project_analyses?id=eq.${encodeFilter(id)}&limit=1`, { token }));
    return rows[0] ? analysisFromRow(rows[0]) : undefined;
  }

  async function listProjectAnalyses(projectId: string, ownerId?: string) {
    const ownerFilter = ownerId ? `&owner_id=eq.${encodeFilter(ownerId)}` : "";
    const rows = assertSupabase<ProjectAnalysisRow[]>(
      await rest(
        `/project_analyses?project_id=eq.${encodeFilter(projectId)}${ownerFilter}&order=tool_type.asc,version.asc`,
        { token }
      )
    );
    return Object.freeze(rows.map(analysisFromRow));
  }

  return Object.freeze({
    createSession,
    saveAnalysis,
    updateAnalysis,
    loadAnalysis,
    latestAnalysis,
    listProjectAnalyses
  });
}
