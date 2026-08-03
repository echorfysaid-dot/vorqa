import type { EntityId, LocaleCode, Timestamped } from "./common";
import type { OnboardingStatus, RoleWorkspaceConfiguration, VorqaAccountType, VorqaOrganizationType, VorqaUserRole, WorkspaceType } from "@/types/onboarding";

export type UserRole = "Owner" | "Admin" | "Member" | "Guest";

export interface UserProfile extends Timestamped {
  id: EntityId;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role?: UserRole | string;
  organizationId?: EntityId;
  preferredLocale?: LocaleCode;
  defaultOutputLanguage?: LocaleCode;
  accountType?: VorqaAccountType;
  primaryRole?: VorqaUserRole;
  organizationType?: VorqaOrganizationType;
  onboardingStatus?: OnboardingStatus;
  onboardingCompletedAt?: string;
  activeWorkspaceType?: WorkspaceType;
  workspaceConfiguration?: RoleWorkspaceConfiguration;
}
