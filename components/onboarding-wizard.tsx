"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, BriefcaseBusiness, Check, ClipboardCheck, Factory, HardHat, PackageCheck, ShieldCheck, UserRound, Users, Wrench } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useOnboardingProfile } from "@/lib/onboarding-client";
import { clearOnboardingDraft, isVorqaAccountType, isVorqaOrganizationType, isVorqaUserRole, normalizeAccountIdentity, readOnboardingDraft, saveOnboardingDraft, workspaceTypeForIdentity } from "@/lib/onboarding";
import type { AccountIdentity, VorqaAccountType, VorqaOrganizationType, VorqaUserRole } from "@/types/onboarding";
import { Badge, Button, EmptyState, Input, ProgressBar } from "@/components/ui";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { useI18n } from "@/components/i18n-provider";

export type OnboardingChoice<T extends string> = { id: T; title: string; description: string; icon: typeof Building2 };
type SetupField = { key: string; label: string; optional?: boolean };

export const accountTypes: Array<OnboardingChoice<VorqaAccountType>> = [
  { id: "individual", title: "Individual", description: "A personal workspace for your professional role.", icon: UserRound },
  { id: "organization", title: "Organization", description: "A shared workspace for departments, teams, members, and projects.", icon: Users }
];

export const roles: Array<OnboardingChoice<VorqaUserRole>> = [
  { id: "project_owner", title: "Project Owner", description: "Manage projects, approvals, budgets, and decisions.", icon: BriefcaseBusiness },
  { id: "contractor", title: "Contractor", description: "Coordinate execution, bids, teams, and site delivery.", icon: ClipboardCheck },
  { id: "engineer", title: "Engineer", description: "Review technical work, drawings, issues, and approvals.", icon: HardHat },
  { id: "architect", title: "Architect", description: "Coordinate designs, drawings, reviews, and documents.", icon: Building2 },
  { id: "supplier", title: "Supplier", description: "Manage opportunities, quotations, products, and deliveries.", icon: PackageCheck },
  { id: "worker", title: "Worker or Technician", description: "Follow tasks, schedules, documents, and safety actions.", icon: Wrench },
  { id: "inspector", title: "Inspector or Supervisor", description: "Manage inspections, issues, approvals, and compliance.", icon: ShieldCheck },
  { id: "other", title: "Something Else", description: "Create a flexible workspace for your professional activity.", icon: UserRound }
];

export const organizationTypes: Array<OnboardingChoice<VorqaOrganizationType>> = [
  { id: "construction_company", title: "Construction Company", description: "Coordinate construction teams, delivery, finance, and operations.", icon: Factory },
  { id: "engineering_office", title: "Engineering Office", description: "Coordinate engineering disciplines, reviews, and technical delivery.", icon: HardHat },
  { id: "architecture_studio", title: "Architecture Studio", description: "Manage design teams, drawings, reviews, and documents.", icon: Building2 },
  { id: "supplier_company", title: "Supplier Company", description: "Manage products, quotations, orders, and deliveries.", icon: PackageCheck },
  { id: "real_estate_developer", title: "Real Estate Developer", description: "Manage developments, projects, budgets, approvals, and contractors.", icon: BriefcaseBusiness }
];

const commonLocationFields: SetupField[] = [{ key: "city", label: "City" }, { key: "country", label: "Country" }];
const fieldsByRole: Record<VorqaUserRole, SetupField[]> = {
  project_owner: [{ key: "projectType", label: "Project type" }, ...commonLocationFields],
  contractor: [{ key: "companyName", label: "Company name", optional: true }, { key: "contractorType", label: "Contractor type" }, { key: "specialization", label: "Main specialization" }, ...commonLocationFields],
  engineer: [{ key: "discipline", label: "Engineering discipline" }, { key: "companyName", label: "Company", optional: true }, { key: "experience", label: "Years of experience" }, ...commonLocationFields, { key: "license", label: "License number", optional: true }],
  architect: [{ key: "studioName", label: "Studio name", optional: true }, { key: "specialization", label: "Specialization" }, { key: "experience", label: "Years of experience" }, ...commonLocationFields],
  supplier: [{ key: "companyName", label: "Company name", optional: true }, { key: "categories", label: "Product categories" }, { key: "deliveryRegion", label: "Delivery region" }, ...commonLocationFields],
  worker: [{ key: "trade", label: "Main trade" }, { key: "skills", label: "Skills" }, { key: "experience", label: "Years of experience" }, { key: "availability", label: "Availability" }, ...commonLocationFields],
  inspector: [{ key: "discipline", label: "Inspection discipline" }, { key: "organization", label: "Organization", optional: true }, { key: "experience", label: "Years of experience" }, { key: "certification", label: "Certification", optional: true }, ...commonLocationFields],
  other: [{ key: "activity", label: "Professional activity" }, { key: "description", label: "Short description" }, ...commonLocationFields]
};

const fieldsByOrganizationType: Record<VorqaOrganizationType, SetupField[]> = {
  construction_company: [{ key: "organizationName", label: "Organization name" }, { key: "companySize", label: "Company size" }, { key: "specialization", label: "Main specialization" }, ...commonLocationFields, { key: "logo", label: "Logo URL", optional: true }],
  engineering_office: [{ key: "organizationName", label: "Organization name" }, { key: "disciplines", label: "Engineering disciplines" }, { key: "companySize", label: "Company size" }, ...commonLocationFields, { key: "logo", label: "Logo URL", optional: true }],
  architecture_studio: [{ key: "organizationName", label: "Organization name" }, { key: "specialization", label: "Specialization" }, { key: "companySize", label: "Company size" }, ...commonLocationFields, { key: "logo", label: "Logo URL", optional: true }],
  supplier_company: [{ key: "organizationName", label: "Organization name" }, { key: "categories", label: "Product categories" }, { key: "deliveryRegion", label: "Delivery region" }, ...commonLocationFields, { key: "logo", label: "Logo URL", optional: true }],
  real_estate_developer: [{ key: "organizationName", label: "Organization name" }, { key: "developmentType", label: "Development type" }, { key: "companySize", label: "Company size" }, ...commonLocationFields, { key: "logo", label: "Logo URL", optional: true }]
};

function ChoiceGrid<T extends string>({ choices, selected, onSelect, label }: { choices: Array<OnboardingChoice<T>>; selected: T | null; onSelect: (value: T) => void; label: string }) {
  const { translate } = useI18n();

  return <div role="radiogroup" aria-label={label} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {choices.map((choice) => { const Icon = choice.icon; const active = selected === choice.id; return (
      <button key={choice.id} type="button" role="radio" aria-checked={active} onClick={() => onSelect(choice.id)} className={`min-h-32 rounded-ds-lg border p-4 text-start outline-none transition focus-visible:ring-2 focus-visible:ring-ds-token-gold ${active ? "border-ds-token-gold bg-ds-token-gold/10" : "border-ds-token-border bg-ds-token-surface hover:bg-ds-token-elevated"}`}>
        <span className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-ds-md bg-ds-token-gold/10 text-gold"><Icon className="h-5 w-5" /></span><span><span className="flex items-center gap-2 font-semibold text-ds-token-text">{translate(choice.title)}{active && <Check className="h-4 w-4 text-ds-token-success" />}</span><span className="mt-2 block text-sm leading-6 text-ds-token-muted">{translate(choice.description)}</span></span></span>
      </button>); })}
  </div>;
}

export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const { profile, loading, error, complete } = useOnboardingProfile(Boolean(session));
  const queryIdentity = normalizeAccountIdentity({ accountType: searchParams.get("accountType"), primaryRole: searchParams.get("role"), organizationType: searchParams.get("organizationType") });
  const [accountType, setAccountType] = useState<VorqaAccountType | null>(queryIdentity?.accountType || null);
  const [selectedRole, setSelectedRole] = useState<VorqaUserRole | null>(queryIdentity?.primaryRole || null);
  const [selectedOrganizationType, setSelectedOrganizationType] = useState<VorqaOrganizationType | null>(queryIdentity?.organizationType || null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState("");

  const identity = useMemo(() => normalizeAccountIdentity({ accountType, primaryRole: selectedRole, organizationType: selectedOrganizationType }), [accountType, selectedRole, selectedOrganizationType]);
  const setupFields = useMemo(() => identity?.accountType === "organization" ? fieldsByOrganizationType[identity.organizationType!] : identity ? fieldsByRole[identity.primaryRole!] : [], [identity]);

  useEffect(() => {
    if (profile?.status === "completed") router.replace("/dashboard");
    if (profile?.accountType) setAccountType(profile.accountType);
    if (profile?.primaryRole && isVorqaUserRole(profile.primaryRole)) setSelectedRole(profile.primaryRole);
    if (profile?.organizationType && isVorqaOrganizationType(profile.organizationType)) setSelectedOrganizationType(profile.organizationType);
  }, [profile, router]);

  useEffect(() => {
    if (identity || profile?.accountType) return;
    const draft = readOnboardingDraft();
    const restored = normalizeAccountIdentity(draft);
    if (!restored) return;
    setAccountType(restored.accountType);
    setSelectedRole(restored.primaryRole);
    setSelectedOrganizationType(restored.organizationType);
  }, [identity, profile?.accountType]);

  function chooseAccountType(value: VorqaAccountType) {
    setAccountType(value); setSelectedRole(null); setSelectedOrganizationType(null); setValidation("");
  }

  function saveIdentity(next: AccountIdentity) {
    setAccountType(next.accountType); setSelectedRole(next.primaryRole); setSelectedOrganizationType(next.organizationType); setValidation("");
    saveOnboardingDraft({ ...next, status: "role_selected", activeWorkspaceType: workspaceTypeForIdentity(next) });
  }

  async function continueFlow() {
    if (!accountType) { setValidation("Select an account type to continue."); return; }
    if (!identity) { setValidation(accountType === "individual" ? "Select one role to continue." : "Select an organization type to continue."); return; }
    if (!session) {
      const query = identity.accountType === "organization" ? `accountType=organization&organizationType=${identity.organizationType}` : `accountType=individual&role=${identity.primaryRole}`;
      router.push(`/register?${query}`); return;
    }
    const missing = setupFields.find((field) => !field.optional && !values[field.key]?.trim());
    if (missing) { setValidation(`${missing.label} is required.`); return; }
    const saved = await complete(identity, values);
    if (saved) { clearOnboardingDraft(); window.dispatchEvent(new Event("vorqa-onboarding-completed")); router.replace("/dashboard"); router.refresh(); }
  }

  if (session && loading && !profile) return <div className="mx-auto max-w-4xl py-16"><ProgressBar value={66} label="Loading workspace setup" /></div>;
  if (session && error && !profile) return <EmptyState title="Workspace setup unavailable" description={error} action={<Button onClick={() => window.location.reload()}>Retry</Button>} />;

  return <AutoLocalizedContent><div className="mx-auto max-w-5xl space-y-6">
    <div className="flex items-center justify-between gap-4"><div><Badge tone="gold">VORA Onboarding</Badge><p className="mt-2 text-sm text-ds-token-muted">Step {session ? 3 : 1} of 3</p></div><div className="w-40"><ProgressBar value={session ? 100 : 33.33} label="Setup progress" /></div></div>

    {(!session || !identity) && <section aria-labelledby="identity-title" className="space-y-6">
      <div className="text-center"><p className="text-sm font-semibold text-gold">Welcome to Vorqa AI</p><h1 id="identity-title" className="mt-2 text-3xl font-bold text-ds-token-text sm:text-4xl">How can I help you?</h1><p className="mt-3 text-sm text-ds-token-muted">Choose your account type, then select your role or organization type.</p></div>
      <ChoiceGrid choices={accountTypes} selected={accountType} onSelect={chooseAccountType} label="Account type" />
      {accountType === "individual" && <ChoiceGrid choices={roles} selected={selectedRole} onSelect={(role) => saveIdentity({ accountType: "individual", primaryRole: role, organizationType: null })} label="Primary role" />}
      {accountType === "organization" && <ChoiceGrid choices={organizationTypes} selected={selectedOrganizationType} onSelect={(organizationType) => saveIdentity({ accountType: "organization", primaryRole: null, organizationType })} label="Organization type" />}
    </section>}

    {session && identity && <section aria-labelledby="setup-title" className="mx-auto max-w-3xl"><div className="mb-6"><h1 id="setup-title" className="text-3xl font-bold text-ds-token-text">Set up your workspace</h1><p className="mt-2 text-sm text-ds-token-muted">Add the essentials now. Optional details can be completed later.</p></div><div className="grid gap-4 sm:grid-cols-2">
      {setupFields.map((field) => <Input key={field.key} label={`${field.label}${field.optional ? " (optional)" : ""}`} value={values[field.key] || ""} onChange={(event) => { const nextValues = { ...values, [field.key]: event.target.value }; setValues(nextValues); saveOnboardingDraft({ ...identity, status: "workspace_setup", activeWorkspaceType: workspaceTypeForIdentity(identity), configuration: { ...identity, role: identity.primaryRole, workspaceType: workspaceTypeForIdentity(identity), values: nextValues } }); }} />)}
    </div></section>}

    {validation && <p role="alert" className="rounded-ds-md border border-ds-token-danger/30 bg-ds-token-danger/10 p-3 text-sm text-ds-token-danger">{validation}</p>}
    <div className="flex flex-col-reverse gap-3 border-t border-ds-token-border pt-5 sm:flex-row sm:justify-between"><Button variant="secondary" onClick={() => identity ? chooseAccountType(accountType!) : router.back()}>Back</Button><Button onClick={continueFlow} disabled={loading}>{session ? "Complete setup" : "Continue"}</Button></div>
  </div></AutoLocalizedContent>;
}
