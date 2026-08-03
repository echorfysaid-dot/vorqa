import type { AiApplicationContext, AiContextSelection, AiEntityType, AiWorkspaceType } from "@/lib/ai-context";

export type MemorySource = "application-context" | "session" | "future-cache" | "future-repository" | "future-persistence";

export type MemoryEntityReference = Readonly<{
  type: AiEntityType;
  id?: string;
  slug?: string;
  label?: string;
}>;

export type ProjectMemory = Readonly<{
  projectId?: string;
  label?: string;
  routeBound: boolean;
  source: MemorySource;
}>;

export type OrganizationMemory = Readonly<{
  organizationId?: string;
  slug?: string;
  label?: string;
  routeBound: boolean;
  source: MemorySource;
}>;

export type WorkspaceMemory = Readonly<{
  type: AiWorkspaceType;
  label: string;
  route: string;
  source: MemorySource;
}>;

export type SelectionMemory = Readonly<{
  current: AiContextSelection;
  entity: MemoryEntityReference;
  source: MemorySource;
}>;

export type ConversationMetadataMemory = Readonly<{
  activeConversationId?: string;
  title?: string;
  messageCount: number;
  lastInteractionAt?: string;
  source: MemorySource;
}>;

export type UserPreferencesMemory = Readonly<{
  language: string;
  direction: "rtl" | "ltr";
  theme: "dark" | "light" | "system";
  source: MemorySource;
}>;

export type NavigationMemoryEntry = Readonly<{
  pathname: string;
  workspaceType: AiWorkspaceType;
  entityType: AiEntityType;
  visitedAt: string;
}>;

export type CurrentSessionMemory = Readonly<{
  sessionId: string;
  startedAt: string;
  userRole: string;
  isAuthenticated: boolean;
  source: MemorySource;
}>;

export type FutureDocumentReferencesMemory = Readonly<{
  selectedDocumentId?: string;
  referencedDocumentIds: readonly string[];
  status: "placeholder";
  source: MemorySource;
}>;

export type MemorySnapshot = Readonly<{
  version: "1.0";
  createdAt: string;
  sources: readonly MemorySource[];
  project: ProjectMemory;
  organization: OrganizationMemory;
  workspace: WorkspaceMemory;
  selection: SelectionMemory;
  conversation: ConversationMetadataMemory;
  userPreferences: UserPreferencesMemory;
  recentNavigation: readonly NavigationMemoryEntry[];
  currentSession: CurrentSessionMemory;
  documentReferences: FutureDocumentReferencesMemory;
}>;

export type CreateAiMemoryInput = Readonly<{
  context: AiApplicationContext;
  session: Pick<CurrentSessionMemory, "sessionId" | "startedAt">;
  recentNavigation?: readonly NavigationMemoryEntry[];
  conversation?: Partial<Omit<ConversationMetadataMemory, "source">>;
  referencedDocumentIds?: readonly string[];
  now?: Date;
}>;

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const property of Object.getOwnPropertyNames(value)) {
    const child = (value as Record<string, unknown>)[property];
    if (child && typeof child === "object" && !Object.isFrozen(child)) {
      deepFreeze(child);
    }
  }
  return value;
}

function compactSources(sources: MemorySource[]) {
  return Array.from(new Set(sources));
}

export function createAiMemory(input: CreateAiMemoryInput): MemorySnapshot {
  const createdAt = (input.now || new Date()).toISOString();
  const entity: MemoryEntityReference = {
    type: input.context.entity.type,
    id: input.context.entity.id,
    slug: input.context.entity.slug,
    label: input.context.entity.label
  };

  const snapshot: MemorySnapshot = {
    version: "1.0",
    createdAt,
    sources: compactSources(["application-context", "session"]),
    project: {
      projectId: input.context.project?.id || input.context.selection.projectId,
      label: input.context.project?.label,
      routeBound: Boolean(input.context.project?.id || input.context.selection.projectId),
      source: "application-context"
    },
    organization: {
      organizationId: input.context.organization?.id || input.context.selection.organizationId,
      slug: input.context.organization?.slug,
      label: input.context.organization?.label,
      routeBound: Boolean(input.context.organization?.id || input.context.selection.organizationId),
      source: "application-context"
    },
    workspace: {
      type: input.context.workspace.type,
      label: input.context.workspace.label,
      route: input.context.route.pathname,
      source: "application-context"
    },
    selection: {
      current: { ...input.context.selection },
      entity,
      source: "application-context"
    },
    conversation: {
      activeConversationId: input.conversation?.activeConversationId,
      title: input.conversation?.title,
      messageCount: input.conversation?.messageCount || 0,
      lastInteractionAt: input.conversation?.lastInteractionAt,
      source: "future-persistence"
    },
    userPreferences: {
      language: input.context.language,
      direction: input.context.direction,
      theme: input.context.theme,
      source: "application-context"
    },
    recentNavigation: [...(input.recentNavigation || [])],
    currentSession: {
      sessionId: input.session.sessionId,
      startedAt: input.session.startedAt,
      userRole: input.context.userRole,
      isAuthenticated: input.context.permissions.isAuthenticated,
      source: "session"
    },
    documentReferences: {
      selectedDocumentId: input.context.selection.documentId,
      referencedDocumentIds: [...(input.referencedDocumentIds || [])],
      status: "placeholder",
      source: "future-repository"
    }
  };

  return deepFreeze(snapshot);
}
