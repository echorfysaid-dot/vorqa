import type { AuditLogEvent } from "@/types/collaboration";

const auditEvents: AuditLogEvent[] = [];

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const key of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[key];
    if (child && typeof child === "object" && !Object.isFrozen(child)) deepFreeze(child);
  }
  return value;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "audit";
}

export function appendAuditEvent(input: {
  actor: string;
  action: string;
  target: string;
  metadata?: Readonly<Record<string, unknown>>;
  now?: Date;
}): AuditLogEvent {
  const timestamp = (input.now || new Date()).toISOString();
  const event = deepFreeze({
    id: `audit-${slug(input.action)}-${auditEvents.length + 1}`,
    timestamp,
    actor: input.actor,
    action: input.action,
    target: input.target,
    metadata: input.metadata || {}
  });
  auditEvents.push(event);
  return event;
}

export function listAuditEvents(filter: { actor?: string; target?: string } = {}): readonly AuditLogEvent[] {
  return deepFreeze(auditEvents
    .filter((event) => !filter.actor || event.actor === filter.actor)
    .filter((event) => !filter.target || event.target === filter.target)
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp) || left.id.localeCompare(right.id)));
}

export function __resetAuditLog() {
  auditEvents.length = 0;
}
