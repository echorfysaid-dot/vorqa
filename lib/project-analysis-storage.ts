import type {
  CreateProjectAnalysisSessionInput,
  ProjectAnalysisRecord,
  ProjectAnalysisSession,
  ProjectAnalysisToolType,
  SaveProjectAnalysisInput,
  UpdateProjectAnalysisInput
} from "@/types/project-analysis";
import type { ProjectAnalysisAdapter } from "@/lib/project-analysis-adapter";
import { createProjectAnalysisSupabaseAdapter } from "@/lib/project-analysis-supabase";
import { isSupabaseServerConfigured } from "@/lib/supabase-server";

type Store = {
  sessions: ProjectAnalysisSession[];
  analyses: ProjectAnalysisRecord[];
};

const globalStore = globalThis as typeof globalThis & {
  __vorqaProjectAnalysisStore?: Store;
  __vorqaProjectAnalysisFailWrites?: boolean;
  __vorqaProjectAnalysisAdapter?: ProjectAnalysisAdapter;
};

function store(): Store {
  if (!globalStore.__vorqaProjectAnalysisStore) globalStore.__vorqaProjectAnalysisStore = { sessions: [], analyses: [] };
  return globalStore.__vorqaProjectAnalysisStore;
}

function timestamp(now?: Date) {
  return (now || new Date()).toISOString();
}

function stableId(prefix: string, parts: readonly string[]) {
  return `${prefix}_${parts.join("_").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function assertWritable() {
  if (globalStore.__vorqaProjectAnalysisFailWrites) throw new Error("Project analysis persistence is unavailable.");
}

export function __setProjectAnalysisStorageFailure(enabled: boolean) {
  globalStore.__vorqaProjectAnalysisFailWrites = enabled;
}

export function __setProjectAnalysisAdapter(adapter?: ProjectAnalysisAdapter) {
  globalStore.__vorqaProjectAnalysisAdapter = adapter;
}

export function __resetProjectAnalysisStorage() {
  globalStore.__vorqaProjectAnalysisStore = { sessions: [], analyses: [] };
  globalStore.__vorqaProjectAnalysisFailWrites = false;
  globalStore.__vorqaProjectAnalysisAdapter = undefined;
}

function adapterFor(token?: string): ProjectAnalysisAdapter | undefined {
  if (globalStore.__vorqaProjectAnalysisAdapter) return globalStore.__vorqaProjectAnalysisAdapter;
  if (token && isSupabaseServerConfigured()) return createProjectAnalysisSupabaseAdapter({ token });
  return undefined;
}

function cacheSession(session: ProjectAnalysisSession) {
  const current = store();
  const index = current.sessions.findIndex((item) => item.id === session.id);
  if (index >= 0) current.sessions[index] = session;
  else current.sessions.push(session);
}

function cacheAnalysis(record: ProjectAnalysisRecord) {
  const current = store();
  const index = current.analyses.findIndex((item) => item.id === record.id);
  if (index >= 0) current.analyses[index] = record;
  else current.analyses.push(record);
}

export function createSession(input: CreateProjectAnalysisSessionInput): ProjectAnalysisSession {
  assertWritable();
  const current = store();
  const existing = current.sessions.find((session) => session.projectId === input.projectId && session.ownerId === input.ownerId && session.status === "active");
  if (existing) return existing;
  const now = timestamp(input.now);
  const session: ProjectAnalysisSession = Object.freeze({
    id: stableId("pas", [input.projectId, input.ownerId, String(current.sessions.length + 1)]),
    projectId: input.projectId,
    ownerId: input.ownerId,
    createdAt: now,
    updatedAt: now,
    status: "active",
    metadata: input.metadata || {}
  });
  current.sessions.push(session);
  return session;
}

export async function createSessionAsync(input: CreateProjectAnalysisSessionInput): Promise<ProjectAnalysisSession> {
  assertWritable();
  const adapter = adapterFor(input.token);
  if (!adapter) return createSession(input);
  try {
    const session = await adapter.createSession(input);
    cacheSession(session);
    return session;
  } catch {
    return createSession(input);
  }
}

function nextVersion(projectId: string, ownerId: string, toolType: ProjectAnalysisToolType) {
  const versions = store().analyses
    .filter((analysis) => analysis.projectId === projectId && analysis.ownerId === ownerId && analysis.toolType === toolType)
    .map((analysis) => analysis.version);
  return versions.length ? Math.max(...versions) + 1 : 1;
}

export function saveAnalysis(input: SaveProjectAnalysisInput): ProjectAnalysisRecord {
  assertWritable();
  const current = store();
  const session = input.sessionId
    ? current.sessions.find((candidate) => candidate.id === input.sessionId) || createSession(input)
    : createSession(input);
  const now = timestamp(input.now);
  const version = nextVersion(input.projectId, input.ownerId, input.toolType);
  const record: ProjectAnalysisRecord = Object.freeze({
    id: stableId("pa", [input.projectId, input.ownerId, input.toolType, String(version)]),
    sessionId: session.id,
    projectId: input.projectId,
    ownerId: input.ownerId,
    toolType: input.toolType,
    status: input.status || "completed",
    createdAt: now,
    updatedAt: now,
    version,
    analysisResult: input.analysisResult,
    health: input.health || "Needs Review",
    confidence: input.confidence,
    metadata: Object.freeze({ ...(input.metadata || {}), persistedAt: now })
  });
  current.analyses.push(record);
  return record;
}

export async function saveAnalysisAsync(input: SaveProjectAnalysisInput): Promise<ProjectAnalysisRecord> {
  assertWritable();
  const adapter = adapterFor(input.token);
  if (!adapter) return saveAnalysis(input);
  const record = await adapter.saveAnalysis(input);
  cacheAnalysis(record);
  return record;
}

export function updateAnalysis(id: string, patch: UpdateProjectAnalysisInput): ProjectAnalysisRecord | undefined {
  assertWritable();
  const current = store();
  const index = current.analyses.findIndex((analysis) => analysis.id === id);
  if (index < 0) return undefined;
  const previous = current.analyses[index];
  const updated: ProjectAnalysisRecord = Object.freeze({
    ...previous,
    status: patch.status || previous.status,
    analysisResult: "analysisResult" in patch ? patch.analysisResult : previous.analysisResult,
    health: patch.health || previous.health,
    confidence: "confidence" in patch ? patch.confidence : previous.confidence,
    metadata: Object.freeze({ ...previous.metadata, ...(patch.metadata || {}) }),
    updatedAt: timestamp(patch.now)
  });
  current.analyses[index] = updated;
  return updated;
}

export async function updateAnalysisAsync(id: string, patch: UpdateProjectAnalysisInput & { token?: string }): Promise<ProjectAnalysisRecord | undefined> {
  assertWritable();
  const adapter = adapterFor(patch.token);
  if (!adapter) return updateAnalysis(id, patch);
  const updated = await adapter.updateAnalysis(id, patch);
  if (updated) cacheAnalysis(updated);
  return updated;
}

export function loadAnalysis(id: string): ProjectAnalysisRecord | undefined {
  return store().analyses.find((analysis) => analysis.id === id);
}

export async function loadAnalysisAsync(id: string, token?: string): Promise<ProjectAnalysisRecord | undefined> {
  const adapter = adapterFor(token);
  if (!adapter) return loadAnalysis(id);
  try {
    const record = await adapter.loadAnalysis(id);
    if (record) cacheAnalysis(record);
    return record;
  } catch {
    return loadAnalysis(id);
  }
}

export function latestAnalysis(projectId: string, toolType: ProjectAnalysisToolType, ownerId?: string): ProjectAnalysisRecord | undefined {
  return store().analyses
    .filter((analysis) => analysis.projectId === projectId && analysis.toolType === toolType && (!ownerId || analysis.ownerId === ownerId))
    .sort((left, right) => right.version - left.version || right.updatedAt.localeCompare(left.updatedAt))[0];
}

export async function latestAnalysisAsync(projectId: string, toolType: ProjectAnalysisToolType, ownerId?: string, token?: string): Promise<ProjectAnalysisRecord | undefined> {
  const adapter = adapterFor(token);
  if (!adapter) return latestAnalysis(projectId, toolType, ownerId);
  try {
    const record = await adapter.latestAnalysis(projectId, toolType, ownerId);
    if (record) cacheAnalysis(record);
    return record;
  } catch {
    return latestAnalysis(projectId, toolType, ownerId);
  }
}

export function listProjectAnalyses(projectId: string, ownerId?: string): readonly ProjectAnalysisRecord[] {
  return Object.freeze([...store().analyses]
    .filter((analysis) => analysis.projectId === projectId && (!ownerId || analysis.ownerId === ownerId))
    .sort((left, right) => left.toolType.localeCompare(right.toolType) || left.version - right.version));
}

export async function listProjectAnalysesAsync(projectId: string, ownerId?: string, token?: string): Promise<readonly ProjectAnalysisRecord[]> {
  const adapter = adapterFor(token);
  if (!adapter) return listProjectAnalyses(projectId, ownerId);
  try {
    const records = await adapter.listProjectAnalyses(projectId, ownerId);
    for (const record of records) cacheAnalysis(record);
    return records;
  } catch {
    return listProjectAnalyses(projectId, ownerId);
  }
}
