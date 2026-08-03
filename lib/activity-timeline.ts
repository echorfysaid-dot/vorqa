import { appendAuditEvent } from "@/lib/audit-log";
import type { ActivityTimelineEvent, ActivityTimelineEventType } from "@/types/collaboration";

const events: ActivityTimelineEvent[] = [];

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
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "activity";
}

export function recordActivity(input: {
  projectId: string;
  ownerId: string;
  actorId: string;
  type: ActivityTimelineEventType;
  target: string;
  metadata?: Readonly<Record<string, unknown>>;
  now?: Date;
}): ActivityTimelineEvent {
  const createdAt = (input.now || new Date()).toISOString();
  const event = deepFreeze({
    id: `activity-${slug(input.projectId)}-${events.length + 1}`,
    projectId: input.projectId,
    ownerId: input.ownerId,
    actorId: input.actorId,
    type: input.type,
    target: input.target,
    createdAt,
    metadata: input.metadata || {}
  });
  events.push(event);
  appendAuditEvent({
    actor: input.actorId,
    action: input.type,
    target: input.target,
    metadata: { projectId: input.projectId, ...input.metadata },
    now: input.now
  });
  return event;
}

export function listProjectActivity(projectId: string): readonly ActivityTimelineEvent[] {
  return deepFreeze(events
    .filter((event) => event.projectId === projectId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id)));
}

export function __resetActivityTimeline() {
  events.length = 0;
}
