export const vorqaAccountTypes = ["individual", "organization"] as const;
export type VorqaAccountType = (typeof vorqaAccountTypes)[number];

export const vorqaUserRoles = [
  "project_owner",
  "contractor",
  "engineer",
  "architect",
  "supplier",
  "worker",
  "inspector",
  "other"
] as const;
export type VorqaUserRole = (typeof vorqaUserRoles)[number];

export const vorqaOrganizationTypes = [
  "construction_company",
  "engineering_office",
  "architecture_studio",
  "supplier_company",
  "real_estate_developer"
] as const;
export type VorqaOrganizationType = (typeof vorqaOrganizationTypes)[number];

export const vorqaWorkspaceTypes = [
  "individual_project_owner",
  "individual_contractor",
  "individual_engineer",
  "individual_architect",
  "individual_supplier",
  "individual_worker",
  "individual_inspector",
  "individual_other",
  "organization_construction_company",
  "organization_engineering_office",
  "organization_architecture_studio",
  "organization_supplier_company",
  "organization_real_estate_developer"
] as const;
export type WorkspaceType = (typeof vorqaWorkspaceTypes)[number];

export type OnboardingStatus = "role_selected" | "account_created" | "workspace_setup" | "completed";

export type AccountIdentity = Readonly<{
  accountType: VorqaAccountType;
  primaryRole: VorqaUserRole | null;
  organizationType: VorqaOrganizationType | null;
}>;

export type RoleWorkspaceConfiguration = Readonly<{
  accountType: VorqaAccountType;
  role: VorqaUserRole | null;
  organizationType: VorqaOrganizationType | null;
  workspaceType: WorkspaceType;
  values: Readonly<Record<string, string>>;
}>;

export type OnboardingProfile = Readonly<{
  accountType: VorqaAccountType | null;
  primaryRole: VorqaUserRole | null;
  organizationType: VorqaOrganizationType | null;
  status: OnboardingStatus | null;
  completedAt: string | null;
  activeWorkspaceType: WorkspaceType | null;
  configuration: RoleWorkspaceConfiguration | null;
}>;

export type RoleNavigationItem = Readonly<{
  label: string;
  href: string;
  available: boolean;
}>;

export type WorkspaceSwitchTarget = Readonly<{
  type: WorkspaceType;
  accountType: VorqaAccountType;
  role: VorqaUserRole | null;
  organizationType: VorqaOrganizationType | null;
}>;
