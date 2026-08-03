import type {
  AccountIdentity,
  OnboardingProfile,
  RoleNavigationItem,
  VorqaAccountType,
  VorqaOrganizationType,
  VorqaUserRole,
  WorkspaceType
} from "@/types/onboarding";
import { vorqaAccountTypes, vorqaOrganizationTypes, vorqaUserRoles, vorqaWorkspaceTypes } from "@/types/onboarding";

const storageKey = "vorqa-onboarding-draft";

export function isVorqaAccountType(value: unknown): value is VorqaAccountType {
  return typeof value === "string" && vorqaAccountTypes.includes(value as VorqaAccountType);
}

export function isVorqaUserRole(value: unknown): value is VorqaUserRole {
  return typeof value === "string" && vorqaUserRoles.includes(value as VorqaUserRole);
}

export function isVorqaOrganizationType(value: unknown): value is VorqaOrganizationType {
  return typeof value === "string" && vorqaOrganizationTypes.includes(value as VorqaOrganizationType);
}

export function isVorqaWorkspaceType(value: unknown): value is WorkspaceType {
  return typeof value === "string" && vorqaWorkspaceTypes.includes(value as WorkspaceType);
}

export function workspaceTypeForIdentity(identity: AccountIdentity): WorkspaceType {
  if (identity.accountType === "organization") {
    return `organization_${identity.organizationType || "construction_company"}` as WorkspaceType;
  }
  return `individual_${identity.primaryRole || "other"}` as WorkspaceType;
}

export function workspaceTypeForRole(role: VorqaUserRole): WorkspaceType {
  return workspaceTypeForIdentity({ accountType: "individual", primaryRole: role, organizationType: null });
}

export function normalizeAccountIdentity(input: {
  accountType?: unknown;
  primaryRole?: unknown;
  organizationType?: unknown;
}): AccountIdentity | null {
  if (input.primaryRole === "company") {
    return { accountType: "organization", primaryRole: null, organizationType: "construction_company" };
  }
  const accountType = isVorqaAccountType(input.accountType)
    ? input.accountType
    : isVorqaOrganizationType(input.organizationType) ? "organization" : isVorqaUserRole(input.primaryRole) ? "individual" : null;
  if (accountType === "individual" && isVorqaUserRole(input.primaryRole)) {
    return { accountType, primaryRole: input.primaryRole, organizationType: null };
  }
  if (accountType === "organization" && isVorqaOrganizationType(input.organizationType)) {
    return { accountType, primaryRole: null, organizationType: input.organizationType };
  }
  return null;
}

export const roleDisplayNames: Record<VorqaUserRole, string> = {
  project_owner: "Project Owner",
  contractor: "Contractor",
  engineer: "Engineer",
  architect: "Architect",
  supplier: "Supplier",
  worker: "Worker or Technician",
  inspector: "Inspector or Supervisor",
  other: "Something Else"
};

export const organizationTypeDisplayNames: Record<VorqaOrganizationType, string> = {
  construction_company: "Construction Company",
  engineering_office: "Engineering Office",
  architecture_studio: "Architecture Studio",
  supplier_company: "Supplier Company",
  real_estate_developer: "Real Estate Developer"
};

export function readOnboardingDraft(): Partial<OnboardingProfile> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(storageKey) || "{}") as Partial<OnboardingProfile>;
  } catch {
    return {};
  }
}

export function saveOnboardingDraft(value: Partial<OnboardingProfile>) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(storageKey, JSON.stringify({ ...readOnboardingDraft(), ...value }));
}

export function clearOnboardingDraft() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(storageKey);
}

const existingRoutes = new Set(["/dashboard", "/projects", "/organizations", "/marketplace", "/rfq", "/quotations", "/contracts", "/billing", "/billing/invoices", "/admin", "/notifications", "/saved", "/history", "/settings", "/tools/document", "/tools/construction-intelligence"]);

const individualNavigation: Record<VorqaUserRole, Array<[string, string]>> = {
  project_owner: [["Dashboard", "/dashboard"], ["Projects", "/projects"], ["Contractors", "/marketplace"], ["Budget", "/projects"], ["Timeline", "/projects"], ["Approvals", "/notifications"], ["Documents", "/saved"], ["Reports", "/history"], ["VORA", "/tools/document"], ["Settings", "/settings"]],
  contractor: [["Mission Control", "/dashboard"], ["Projects", "/projects"], ["RFQs and Bids", "/rfq"], ["Contracts", "/contracts"], ["Tasks", "/projects"], ["Documents", "/saved"], ["Team", "/organizations"], ["Equipment", "/coming-soon?capability=equipment"], ["Finance", "/billing"], ["Reports", "/history"], ["VORA", "/tools/document"], ["Settings", "/settings"]],
  engineer: [["Mission Control", "/dashboard"], ["Projects", "/projects"], ["Drawings", "/saved"], ["Site Visits", "/coming-soon?capability=site-visits"], ["Issues", "/notifications"], ["Documents", "/saved"], ["Approvals", "/notifications"], ["Reports", "/history"], ["VORA", "/tools/document"], ["Settings", "/settings"]],
  architect: [["Dashboard", "/dashboard"], ["Projects", "/projects"], ["Designs", "/saved"], ["Drawings", "/saved"], ["Reviews", "/history"], ["Documents", "/saved"], ["Approvals", "/notifications"], ["Reports", "/history"], ["VORA", "/tools/document"], ["Settings", "/settings"]],
  supplier: [["Dashboard", "/dashboard"], ["Opportunities", "/marketplace"], ["RFQs", "/rfq"], ["Quotations", "/quotations"], ["Orders", "/contracts"], ["Products", "/marketplace"], ["Deliveries", "/coming-soon?capability=deliveries"], ["Invoices", "/billing/invoices"], ["Customers", "/organizations"], ["Reports", "/history"], ["VORA", "/tools/document"], ["Settings", "/settings"]],
  worker: [["Today", "/dashboard"], ["My Tasks", "/projects"], ["Schedule", "/projects"], ["Documents", "/saved"], ["Safety", "/tools/construction-intelligence"], ["Daily Report", "/tools/document"], ["VORA", "/tools/document"], ["Profile", "/settings"]],
  inspector: [["Dashboard", "/dashboard"], ["Projects", "/projects"], ["Inspections", "/tools/construction-intelligence"], ["Issues", "/notifications"], ["Approvals", "/notifications"], ["Documents", "/saved"], ["Reports", "/history"], ["VORA", "/tools/document"], ["Settings", "/settings"]],
  other: [["Dashboard", "/dashboard"], ["Projects", "/projects"], ["Documents", "/saved"], ["VORA", "/tools/document"], ["Settings", "/settings"]]
};

const organizationNavigation: Record<VorqaOrganizationType, Array<[string, string]>> = {
  construction_company: [["Dashboard", "/dashboard"], ["Organizations", "/organizations"], ["Projects", "/projects"], ["Teams", "/organizations"], ["Departments", "/organizations"], ["Documents", "/saved"], ["Finance", "/billing"], ["Reports", "/history"], ["Administration", "/admin"], ["VORA", "/tools/document"], ["Settings", "/settings"]],
  engineering_office: [["Dashboard", "/dashboard"], ["Organizations", "/organizations"], ["Projects", "/projects"], ["Teams", "/organizations"], ["Drawings", "/saved"], ["Reviews", "/history"], ["Documents", "/saved"], ["Reports", "/history"], ["VORA", "/tools/document"], ["Settings", "/settings"]],
  architecture_studio: [["Dashboard", "/dashboard"], ["Organizations", "/organizations"], ["Projects", "/projects"], ["Teams", "/organizations"], ["Designs", "/saved"], ["Drawings", "/saved"], ["Documents", "/saved"], ["Reports", "/history"], ["VORA", "/tools/document"], ["Settings", "/settings"]],
  supplier_company: [["Dashboard", "/dashboard"], ["Organizations", "/organizations"], ["Opportunities", "/marketplace"], ["RFQs", "/rfq"], ["Quotations", "/quotations"], ["Orders", "/contracts"], ["Products", "/marketplace"], ["Deliveries", "/coming-soon?capability=deliveries"], ["Invoices", "/billing/invoices"], ["Reports", "/history"], ["Settings", "/settings"]],
  real_estate_developer: [["Dashboard", "/dashboard"], ["Organizations", "/organizations"], ["Projects", "/projects"], ["Contractors", "/marketplace"], ["Budget", "/projects"], ["Timeline", "/projects"], ["Approvals", "/notifications"], ["Contracts", "/contracts"], ["Reports", "/history"], ["VORA", "/tools/document"], ["Settings", "/settings"]]
};

function toNavigation(items: Array<[string, string]>): RoleNavigationItem[] {
  return items.map(([label, href]) => ({ label, href, available: existingRoutes.has(href.split("?")[0]) }));
}

export function navigationForIdentity(identity: AccountIdentity): RoleNavigationItem[] {
  const items = identity.accountType === "organization"
    ? organizationNavigation[identity.organizationType || "construction_company"]
    : individualNavigation[identity.primaryRole || "other"];
  return toNavigation(items);
}

export function navigationForRole(role: VorqaUserRole | null): RoleNavigationItem[] {
  return navigationForIdentity({ accountType: "individual", primaryRole: role || "other", organizationType: null });
}

export const roleWelcomeMessage: Record<VorqaUserRole, string> = {
  project_owner: "Let's review your projects, approvals, and budget priorities.",
  contractor: "Let's review active projects, bids, teams, and execution risks.",
  engineer: "Let's review drawings, site issues, approvals, and technical actions.",
  architect: "Let's review designs, documents, approvals, and coordination priorities.",
  supplier: "Let's review opportunities, quotations, deliveries, and customer priorities.",
  worker: "Let's review today's tasks, schedule, documents, and safety priorities.",
  inspector: "Let's review inspections, issues, approvals, and compliance actions.",
  other: "Let's review your projects, documents, and next actions."
};
