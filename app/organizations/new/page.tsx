"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Globe2, MapPin, Save } from "lucide-react";
import { Badge, Button, Dropdown, GlassCard, Input } from "@/components/ui";
import { organizationRepository } from "@/lib/repositories";
import type { OrganizationMutationInput } from "@/lib/repositories/organizationMapper";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

const timezoneOptions = ["Africa/Casablanca", "Europe/Paris", "UTC"];
const currencyOptions = ["MAD", "EUR", "USD"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewOrganizationPage() {
  const router = useRouter();
  const [form, setForm] = useState<OrganizationMutationInput>({
    name: "",
    slug: "",
    legalName: "",
    website: "",
    country: "Morocco",
    city: "Casablanca",
    timezone: "Africa/Casablanca",
    currency: "MAD",
    industry: "Construction"
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validation = useMemo(() => {
    if (!form.name?.trim()) return "Organization name is required.";
    if (!form.slug?.trim()) return "Slug is required.";
    if (!/^[a-z0-9-]{3,64}$/.test(form.slug)) return "Slug must use 3-64 lowercase letters, numbers, or hyphens.";
    if (!form.country?.trim()) return "Country is required.";
    if (!form.city?.trim()) return "City is required.";
    return "";
  }, [form]);

  function update<K extends keyof OrganizationMutationInput>(key: K, value: OrganizationMutationInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    const slugCheck = await organizationRepository.slugExists(form.slug || "");
    if (slugCheck.data) {
      setSaving(false);
      setError("This slug is already used. Choose another organization slug.");
      return;
    }
    if ("error" in slugCheck && slugCheck.error) {
      setSaving(false);
      setError(slugCheck.error);
      return;
    }

    const result = await organizationRepository.createOrganization(form);
    setSaving(false);
    const resultError = "error" in result ? result.error : "";
    if (resultError || !result.data) {
      setError(resultError || "Unable to create organization.");
      return;
    }

    setSuccess(result.isFallback ? "Demo organization preview created. Demo mode does not persist new organizations." : "Organization created successfully.");
    if (!result.isFallback && result.source === "supabase") {
      router.push(`/organizations/${result.data.slug || result.data.id}`);
    }
  }

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <Link href="/organizations" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to organizations
        </Link>
        <div className="flex flex-wrap gap-2"><Badge tone="gold">New organization</Badge><Badge tone="blue">Repository flow</Badge></div>
        <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Create organization workspace.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">Create a production-ready organization record through the repository layer. Demo mode remains safe and non-persistent.</p>
      </GlassCard>

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <GlassCard className="p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Organization name" value={form.name || ""} onChange={(event) => {
              const name = event.target.value;
              setForm((current) => ({ ...current, name, slug: current.slug || slugify(name) }));
            }} icon={<Building2 className="h-4 w-4" />} />
            <Input label="Slug" value={form.slug || ""} onChange={(event) => update("slug", slugify(event.target.value))} />
            <Input label="Legal name" value={form.legalName || ""} onChange={(event) => update("legalName", event.target.value)} />
            <Input label="Website" value={form.website || ""} onChange={(event) => update("website", event.target.value)} icon={<Globe2 className="h-4 w-4" />} />
            <Input label="Country" value={form.country || ""} onChange={(event) => update("country", event.target.value)} icon={<MapPin className="h-4 w-4" />} />
            <Input label="City" value={form.city || ""} onChange={(event) => update("city", event.target.value)} />
            <Dropdown label="Timezone" value={form.timezone} options={timezoneOptions} onChange={(value) => update("timezone", value)} />
            <Dropdown label="Currency" value={form.currency} options={currencyOptions} onChange={(value) => update("currency", value)} />
          </div>

          {error && <p className="mt-5 rounded-2xl border border-[#EF4444]/24 bg-[#EF4444]/10 p-4 text-sm font-bold text-[#FFB4B4]">{error}</p>}
          {success && <p className="mt-5 rounded-2xl border border-[#16C784]/24 bg-[#16C784]/10 p-4 text-sm font-bold text-[#8DEAC4]">{success}</p>}

          <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5">
            <Link href="/organizations"><Button type="button" variant="secondary">Cancel</Button></Link>
            <Button type="submit" disabled={saving} icon={<Save className="h-4 w-4" />}>{saving ? "Creating..." : "Create organization"}</Button>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <Badge tone="gold">Validation</Badge>
          <div className="mt-5 grid gap-3">
            <PreviewRow label="Name" value={form.name || "-"} />
            <PreviewRow label="Slug" value={form.slug || "-"} />
            <PreviewRow label="Location" value={[form.city, form.country].filter(Boolean).join(", ") || "-"} />
            <PreviewRow label="Timezone" value={form.timezone || "-"} />
            <PreviewRow label="Currency" value={form.currency || "-"} />
          </div>
          <p className="mt-5 text-sm leading-7 text-ds-text/58">Duplicate slug protection runs through the repository and respects the selected data-source mode.</p>
        </GlassCard>
      </form>
    </div>
  </AutoLocalizedContent>);
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (<AutoLocalizedContent>
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <p className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</p>
      <p className="mt-2 truncate font-black text-white">{value}</p>
    </div>
  </AutoLocalizedContent>);
}
