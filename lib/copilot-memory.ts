import type { CopilotMessage, CopilotSession } from "@/types/copilot";

const sessions = new Map<string, CopilotSession>();
const messages = new Map<string, CopilotMessage[]>();

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[key];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function sessionKey(projectId: string, ownerId: string, sessionId: string) {
  return `${ownerId}:${projectId}:${sessionId}`;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "copilot";
}

export function createSession(input: { projectId: string; ownerId: string; sessionId?: string; title?: string; now?: Date }): CopilotSession {
  const now = (input.now || new Date()).toISOString();
  const id = input.sessionId || `copilot-${slug(input.projectId)}-${now.replace(/[^0-9]/g, "")}`;
  const key = sessionKey(input.projectId, input.ownerId, id);
  const existing = sessions.get(key);
  if (existing) return existing;

  const session = deepFreeze({
    id,
    projectId: input.projectId,
    ownerId: input.ownerId,
    title: input.title || "VORA Copilot",
    createdAt: now,
    updatedAt: now
  });
  sessions.set(key, session);
  messages.set(key, []);
  return session;
}

export function appendMessage(input: {
  sessionId: string;
  projectId: string;
  ownerId: string;
  role: CopilotMessage["role"];
  content: string;
  metadata?: Readonly<Record<string, unknown>>;
  now?: Date;
}): CopilotMessage {
  const key = sessionKey(input.projectId, input.ownerId, input.sessionId);
  const session = sessions.get(key) || createSession({ projectId: input.projectId, ownerId: input.ownerId, sessionId: input.sessionId, now: input.now });
  const createdAt = (input.now || new Date()).toISOString();
  const list = messages.get(key) || [];
  const message = deepFreeze({
    id: `${session.id}:message:${list.length + 1}`,
    sessionId: session.id,
    projectId: input.projectId,
    ownerId: input.ownerId,
    role: input.role,
    content: input.content,
    createdAt,
    metadata: input.metadata
  });
  messages.set(key, [...list, message]);
  sessions.set(key, deepFreeze({ ...session, updatedAt: createdAt }));
  return message;
}

export function loadHistory(input: { sessionId: string; projectId: string; ownerId: string }): readonly CopilotMessage[] {
  return deepFreeze([...(messages.get(sessionKey(input.projectId, input.ownerId, input.sessionId)) || [])]);
}

export function clearHistory(input: { sessionId: string; projectId: string; ownerId: string }) {
  const key = sessionKey(input.projectId, input.ownerId, input.sessionId);
  const deletedMessages = messages.get(key)?.length || 0;
  messages.set(key, []);
  return deepFreeze({ ok: true, deletedMessages });
}

export function listSessions(input: { projectId: string; ownerId: string }): readonly CopilotSession[] {
  return deepFreeze([...sessions.values()]
    .filter((session) => session.projectId === input.projectId && session.ownerId === input.ownerId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id)));
}

export function __resetCopilotMemory() {
  sessions.clear();
  messages.clear();
}
