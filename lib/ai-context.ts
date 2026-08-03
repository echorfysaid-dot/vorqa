export type AiWorkspaceType =
  | "public"
  | "command-center"
  | "projects"
  | "project-workspace"
  | "vora"
  | "organizations"
  | "organization-workspace"
  | "marketplace"
  | "rfq"
  | "quotations"
  | "contracts"
  | "billing"
  | "admin"
  | "notifications"
  | "settings"
  | "history"
  | "saved"
  | "favorites"
  | "unknown";

export type AiEntityType =
  | "organization"
  | "project"
  | "document"
  | "task"
  | "contract"
  | "rfq"
  | "quotation"
  | "marketplace-company"
  | "tool"
  | "notification"
  | "billing"
  | "admin"
  | "none";

export type AiTheme = "dark" | "light" | "system";

export type AiUserRole = "guest" | "authenticated";

export type AiContextRoute = {
  pathname: string;
  segments: string[];
  search: string;
};

export type AiContextWorkspace = {
  type: AiWorkspaceType;
  label: string;
};

export type AiContextEntity = {
  type: AiEntityType;
  id?: string;
  slug?: string;
  label?: string;
  source: "route" | "selection" | "none";
};

export type AiContextSelection = {
  organizationId?: string;
  projectId?: string;
  documentId?: string;
  taskId?: string;
  contractId?: string;
  rfqId?: string;
  quotationId?: string;
  marketplaceSlug?: string;
  toolSlug?: string;
};

export type AiContextPermissions = {
  isAuthenticated: boolean;
  canUsePrivateWorkspace: boolean;
};

export type AiApplicationContext = {
  organization?: { id?: string; slug?: string; label?: string };
  project?: { id?: string; slug?: string; label?: string };
  workspace: AiContextWorkspace;
  entity: AiContextEntity;
  route: AiContextRoute;
  selection: AiContextSelection;
  userRole: AiUserRole;
  accountType?: string;
  primaryRole?: string;
  organizationType?: string;
  activeWorkspaceType?: string;
  permissions: AiContextPermissions;
  language: string;
  direction: "rtl" | "ltr";
  theme: AiTheme;
  updatedAt: string;
};

const workspaceLabels: Record<AiWorkspaceType, string> = {
  public: "Public Experience",
  "command-center": "Command Center",
  projects: "Projects",
  "project-workspace": "Project Workspace",
  vora: "VORA Workspace",
  organizations: "Organizations",
  "organization-workspace": "Organization Workspace",
  marketplace: "Marketplace",
  rfq: "RFQ Workspace",
  quotations: "Quotation Workspace",
  contracts: "Contract Workspace",
  billing: "Billing Workspace",
  admin: "Administration",
  notifications: "Notification Center",
  settings: "Settings",
  history: "History",
  saved: "Saved Outputs",
  favorites: "Favorites",
  unknown: "Vorqa Workspace"
};

function cleanSegment(value?: string) {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function pickSearchValue(searchParams: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = cleanSegment(searchParams.get(key) || undefined);
    if (value) return value;
  }
  return undefined;
}

export function createAiApplicationContext(input: {
  pathname: string;
  searchParams?: URLSearchParams;
  language: string;
  direction: "rtl" | "ltr";
  theme: AiTheme;
  isAuthenticated: boolean;
  accountType?: string;
  primaryRole?: string;
  organizationType?: string;
  activeWorkspaceType?: string;
  now?: Date;
}): AiApplicationContext {
  const searchParams = input.searchParams || new URLSearchParams();
  const segments = input.pathname.split("/").filter(Boolean).map((segment) => cleanSegment(segment) || segment);
  const [root, second, third] = segments;

  let workspaceType: AiWorkspaceType = "unknown";
  let entity: AiContextEntity = { type: "none", source: "none" };
  const selection: AiContextSelection = {};
  let organization: AiApplicationContext["organization"];
  let project: AiApplicationContext["project"];

  if (!root) {
    workspaceType = "public";
  } else if (root === "dashboard") {
    workspaceType = "command-center";
  } else if (root === "projects") {
    if (second) {
      workspaceType = "project-workspace";
      selection.projectId = second;
      project = { id: second, label: second };
      entity = { type: "project", id: second, label: second, source: "route" };
    } else {
      workspaceType = "projects";
    }
  } else if (root === "tools") {
    workspaceType = "vora";
    if (second) {
      selection.toolSlug = second;
      entity = { type: "tool", slug: second, label: second, source: "route" };
    }
  } else if (root === "organizations") {
    if (second) {
      workspaceType = "organization-workspace";
      selection.organizationId = second;
      organization = { id: second, slug: second, label: second };
      entity = { type: "organization", id: second, slug: second, label: second, source: "route" };
    } else {
      workspaceType = "organizations";
    }
  } else if (root === "marketplace") {
    workspaceType = "marketplace";
    if (second === "rfq") {
      workspaceType = "rfq";
      if (third) {
        selection.rfqId = third;
        entity = { type: "rfq", id: third, label: third, source: "route" };
      }
    } else if (second && !["compare", "shortlist"].includes(second)) {
      selection.marketplaceSlug = second;
      entity = { type: "marketplace-company", slug: second, label: second, source: "route" };
    }
  } else if (root === "rfq") {
    workspaceType = "rfq";
    if (second) {
      selection.rfqId = second;
      entity = { type: "rfq", id: second, label: second, source: "route" };
    }
  } else if (root === "quotations") {
    workspaceType = "quotations";
    if (second && second !== "compare") {
      selection.quotationId = second;
      entity = { type: "quotation", id: second, label: second, source: "route" };
    }
  } else if (root === "contracts") {
    workspaceType = "contracts";
    if (second) {
      selection.contractId = second;
      entity = { type: "contract", id: second, label: second, source: "route" };
    }
  } else if (root === "billing") {
    workspaceType = "billing";
    entity = { type: "billing", source: "route", label: second || "billing" };
  } else if (root === "admin") {
    workspaceType = "admin";
    entity = { type: "admin", source: "route", label: second || "admin" };
  } else if (root === "notifications") {
    workspaceType = "notifications";
    entity = { type: "notification", source: "route", label: "notifications" };
  } else if (root === "settings") {
    workspaceType = "settings";
  } else if (root === "history") {
    workspaceType = "history";
  } else if (root === "saved") {
    workspaceType = "saved";
  } else if (root === "favorites") {
    workspaceType = "favorites";
  }

  const selectedOrganizationId = pickSearchValue(searchParams, ["organizationId", "org", "organization"]);
  const selectedProjectId = pickSearchValue(searchParams, ["projectId", "project"]);
  const selectedDocumentId = pickSearchValue(searchParams, ["documentId", "document"]);
  const selectedTaskId = pickSearchValue(searchParams, ["taskId", "task"]);
  const selectedContractId = pickSearchValue(searchParams, ["contractId", "contract"]);
  const selectedRfqId = pickSearchValue(searchParams, ["rfqId", "rfq"]);
  const selectedQuotationId = pickSearchValue(searchParams, ["quotationId", "quotation"]);

  selection.organizationId ||= selectedOrganizationId;
  selection.projectId ||= selectedProjectId;
  selection.documentId = selectedDocumentId;
  selection.taskId = selectedTaskId;
  selection.contractId ||= selectedContractId;
  selection.rfqId ||= selectedRfqId;
  selection.quotationId ||= selectedQuotationId;

  if (selectedDocumentId) entity = { type: "document", id: selectedDocumentId, label: selectedDocumentId, source: "selection" };
  if (selectedTaskId) entity = { type: "task", id: selectedTaskId, label: selectedTaskId, source: "selection" };

  organization ||= selection.organizationId ? { id: selection.organizationId, slug: selection.organizationId, label: selection.organizationId } : undefined;
  project ||= selection.projectId ? { id: selection.projectId, label: selection.projectId } : undefined;

  return {
    organization,
    project,
    workspace: {
      type: workspaceType,
      label: workspaceLabels[workspaceType]
    },
    entity,
    route: {
      pathname: input.pathname,
      segments,
      search: searchParams.toString()
    },
    selection,
    userRole: input.isAuthenticated ? "authenticated" : "guest",
    accountType: input.accountType,
    primaryRole: input.primaryRole,
    organizationType: input.organizationType,
    activeWorkspaceType: input.activeWorkspaceType,
    permissions: {
      isAuthenticated: input.isAuthenticated,
      canUsePrivateWorkspace: input.isAuthenticated
    },
    language: input.language,
    direction: input.direction,
    theme: input.theme,
    updatedAt: (input.now || new Date()).toISOString()
  };
}
