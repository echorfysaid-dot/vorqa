"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Building2, ChevronRight, Loader2, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { Input, Select } from "@/components/ui";
import { normalizeAccountIdentity, saveOnboardingDraft, workspaceTypeForIdentity } from "@/lib/onboarding";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { organizationTypes, roles, type OnboardingChoice } from "@/components/onboarding-wizard";
import type { VorqaAccountType, VorqaOrganizationType, VorqaUserRole } from "@/types/onboarding";

type RegistrationResult = { email: string; message: string; authenticated: boolean };

export function RegisterForm({ onRegistered }: { onRegistered?: (result: RegistrationResult) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, loading, error } = useAuth();
  const { dictionary: t, locale } = useI18n();
  const queryIdentity = normalizeAccountIdentity({ accountType: searchParams.get("accountType"), primaryRole: searchParams.get("role"), organizationType: searchParams.get("organizationType") });
  const [accountType, setAccountType] = useState<VorqaAccountType | null>(queryIdentity?.accountType || null);
  const [primaryRole, setPrimaryRole] = useState<VorqaUserRole | null>(queryIdentity?.primaryRole || null);
  const [organizationType, setOrganizationType] = useState<VorqaOrganizationType | null>(queryIdentity?.organizationType || null);
  const identity = useMemo(() => normalizeAccountIdentity({ accountType, primaryRole, organizationType }), [accountType, organizationType, primaryRole]);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "", country: "", preferredLanguage: locale, terms: false });
  const [validation, setValidation] = useState("");

  function update(key: keyof typeof form, value: string | boolean) { setForm((current) => ({ ...current, [key]: value })); }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identity) { router.replace("/onboarding"); return; }
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password || !form.country) return setValidation("Complete all required fields.");
    if (form.password !== form.confirmPassword) return setValidation("Passwords do not match.");
    if (!form.terms) return setValidation("Accept the terms to continue.");
    setValidation("");
    const result = await register({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, phone: form.phone, country: form.country, preferredLanguage: form.preferredLanguage, accountType: identity.accountType, primaryRole: identity.primaryRole || undefined, organizationType: identity.organizationType || undefined });
    if (result.success && result.authenticated) {
      const activeWorkspaceType = workspaceTypeForIdentity(identity);
      saveOnboardingDraft({ ...identity, status: "account_created", activeWorkspaceType });
      onRegistered?.({ email: form.email, authenticated: true, message: result.message || "Your account has been created." });
      router.replace("/dashboard");
      router.refresh();
    } else if (result.success) onRegistered?.({ email: form.email, authenticated: false, message: result.message || t.pages.registerNote });
  }

  function selectAccountType(value: VorqaAccountType) {
    setAccountType(value);
    setPrimaryRole(null);
    setOrganizationType(null);
  }

  function completeIdentity(value: VorqaUserRole | VorqaOrganizationType) {
    const nextIdentity = accountType === "organization"
      ? normalizeAccountIdentity({ accountType, organizationType: value })
      : normalizeAccountIdentity({ accountType, primaryRole: value });
    if (!nextIdentity) return;
    saveOnboardingDraft({ ...nextIdentity, status: "role_selected", activeWorkspaceType: workspaceTypeForIdentity(nextIdentity) });
    setPrimaryRole(nextIdentity.primaryRole);
    setOrganizationType(nextIdentity.organizationType);
  }

  if (!identity) return (<AutoLocalizedContent><div className="flex min-h-[24rem] flex-col justify-center py-1">
    <div className="mx-auto max-w-2xl text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-ds-lg border border-ds-token-gold/30 bg-ds-token-gold/10 text-gold">{accountType === "organization" ? <Building2 className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}</span>
      <h2 className="mt-4 text-2xl font-bold leading-tight text-ds-token-text sm:text-3xl">{accountType ? (accountType === "individual" ? "Choose your role" : "Choose your organization type") : "Choose how you will use Vorqa"}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ds-token-muted">{accountType ? "Select the option that best matches your work. Your registration form comes next." : "Choose an individual or organization account to prepare the right workspace."}</p>
    </div>
    {!accountType && <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => selectAccountType("individual")} aria-pressed={accountType === "individual"} className={`group min-h-28 rounded-ds-lg border p-4 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-token-gold ${accountType === "individual" ? "border-ds-token-gold bg-ds-token-gold/10" : "border-ds-token-border bg-ds-token-elevated/55 hover:border-ds-token-gold/60 hover:bg-ds-token-gold/10"}`}>
        <span className="flex h-full items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-ds-md bg-ds-token-gold/10 text-gold"><UserRound className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-lg text-ds-token-text">Individual</strong><span className="mt-1 block text-sm leading-6 text-ds-token-muted">Your personal professional workspace</span></span><ChevronRight className="h-5 w-5 shrink-0 text-ds-token-muted transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" /></span>
      </button>
      <button type="button" onClick={() => selectAccountType("organization")} aria-pressed={accountType === "organization"} className={`group min-h-28 rounded-ds-lg border p-4 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-token-gold ${accountType === "organization" ? "border-ds-token-gold bg-ds-token-gold/10" : "border-ds-token-border bg-ds-token-elevated/55 hover:border-ds-token-gold/60 hover:bg-ds-token-gold/10"}`}>
        <span className="flex h-full items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-ds-md bg-ds-token-gold/10 text-gold"><Building2 className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-lg text-ds-token-text">Organization</strong><span className="mt-1 block text-sm leading-6 text-ds-token-muted">A shared workspace for your teams</span></span><ChevronRight className="h-5 w-5 shrink-0 text-ds-token-muted transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" /></span>
      </button>
    </div>}
    {accountType && <div className="mt-5">
      <div className="mb-3 flex justify-end"><button type="button" onClick={() => setAccountType(null)} className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-gold hover:text-ds-token-text"><ChevronRight className="h-4 w-4 rotate-180 rtl:rotate-0" />Back to account type</button></div>
      <InlineChoiceGrid choices={accountType === "individual" ? roles : organizationTypes} onSelect={completeIdentity} />
    </div>}
    {!accountType && <p className="mt-5 text-center text-sm leading-6 text-ds-token-muted">Select one option to continue. Your role comes next on this same page.</p>}
  </div></AutoLocalizedContent>);

  return (<AutoLocalizedContent>
    <form onSubmit={onSubmit} className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
      <Input label="First name" value={form.firstName} onChange={(event) => update("firstName", event.target.value)} autoComplete="given-name" required />
      <Input label="Last name" value={form.lastName} onChange={(event) => update("lastName", event.target.value)} autoComplete="family-name" required />
      <Input label={t.common.email} type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" dir="ltr" required />
      <Input label="Phone number" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} autoComplete="tel" dir="ltr" required />
      <Input label={t.common.password} type="password" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" required />
      <Input label="Confirm password" type="password" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} autoComplete="new-password" required />
      <Input label="Country" value={form.country} onChange={(event) => update("country", event.target.value)} autoComplete="country-name" required />
      <Select label="Preferred language" value={form.preferredLanguage} onChange={(value) => update("preferredLanguage", value)} options={["ar", "fr", "en"]} />
      <label className="flex min-h-11 items-center gap-3 text-sm text-ds-token-text sm:col-span-2"><input type="checkbox" checked={form.terms} onChange={(event) => update("terms", event.target.checked)} className="h-4 w-4 accent-ds-token-gold" /><span>I accept the terms and privacy policy.</span></label>
      {(validation || error) && <p role="alert" className="rounded-ds-md border border-ds-token-danger/30 bg-ds-token-danger/10 p-3 text-sm text-ds-token-danger sm:col-span-2">{validation || error}</p>}
      <button type="submit" disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-ds-md bg-ds-token-gold px-5 py-3 font-semibold text-black disabled:opacity-60 sm:col-span-2">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowLeft className="h-5 w-5 rtl:rotate-180" />}{t.common.register}</button>
    </form>
  </AutoLocalizedContent>);
}

function InlineChoiceGrid<T extends VorqaUserRole | VorqaOrganizationType>({ choices, onSelect }: { choices: Array<OnboardingChoice<T>>; onSelect: (value: T) => void }) {
  const { translate } = useI18n();

  return <div className="grid max-h-[48vh] gap-2 overflow-y-auto pe-1 sm:grid-cols-2 lg:max-h-none lg:grid-cols-3 lg:overflow-visible xl:grid-cols-4">
    {choices.map((choice) => { const Icon = choice.icon; return <button key={choice.id} type="button" onClick={() => onSelect(choice.id)} className="group flex min-h-20 items-center gap-3 rounded-ds-md border border-ds-token-border bg-ds-token-elevated/45 p-3 text-start transition hover:border-ds-token-gold/60 hover:bg-ds-token-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-token-gold">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-ds-md bg-ds-token-gold/10 text-gold"><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><strong className="block text-sm text-ds-token-text">{translate(choice.title)}</strong><span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-ds-token-muted">{translate(choice.description)}</span></span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ds-token-muted transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
    </button>; })}
  </div>;
}
