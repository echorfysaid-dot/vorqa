"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, Search } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard } from "@/components/ui";
import { useOrganizationsRepository } from "@/lib/repositories/organizationHooks";
import type { Organization } from "@/lib/models";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function OrganizationsPage() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const { data: organizations, loading, error, isFallback } = useOrganizationsRepository();
  const currentOrganization = organizations[0];

  const filteredOrganizations = useMemo(() => organizations.filter((organization) => {
    const searchText = `${organization.name} ${organization.industry} ${organization.location}`.toLowerCase();
    return searchText.includes(query.toLowerCase())
      && (roleFilter === "All roles" || organization.role === roleFilter)
      && (statusFilter === "All statuses" || organization.status === statusFilter);
  }), [organizations, query, roleFilter, statusFilter]);

  return (<AutoLocalizedContent>
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-ds-token-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-token-text sm:text-3xl">Organizations</h1>
          <p className="mt-1 max-w-2xl text-sm text-ds-token-muted">Switch between construction companies, engineering offices, logistics partners, and design studios across the Vorqa operating system.</p>
        </div>
        <Link href="/organizations/new"><Button icon={<Building2 className="h-4 w-4" />}>Create organization</Button></Link>
      </header>

      {error && isFallback && (
        <GlassCard className="p-4"><p className="text-sm font-medium text-ds-token-muted">Showing demo organizations because production organization data is unavailable.</p></GlassCard>
      )}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px]">
        <label className="flex h-11 items-center gap-3 rounded-ds-md border border-ds-token-border bg-ds-token-surface px-4 transition focus-within:border-ds-token-gold/50">
          <Search className="h-4 w-4 text-gold" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search organizations" className="w-full bg-transparent text-sm text-ds-token-text outline-none placeholder:text-ds-token-muted" />
        </label>
        <OrgFilter value={roleFilter} onChange={setRoleFilter} options={["All roles", ...Array.from(new Set(organizations.map((organization) => organization.role)))]} />
        <OrgFilter value={statusFilter} onChange={setStatusFilter} options={["All statuses", ...Array.from(new Set(organizations.map((organization) => organization.status)))]} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ds-token-text">Organization directory</h2>
          <Badge tone="neutral">{filteredOrganizations.length}</Badge>
        </div>
        {loading ? (
          <div className="overflow-hidden rounded-ds-lg border border-ds-token-border">
            {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse border-b border-ds-token-border bg-ds-token-surface last:border-b-0"><span className="sr-only">Loading organization</span></div>)}
          </div>
        ) : filteredOrganizations.length ? (
          <div className="overflow-hidden rounded-ds-lg border border-ds-token-border bg-ds-token-surface">
            {filteredOrganizations.map((organization) => <OrganizationRow key={organization.id} organization={organization} featured={organization.id === currentOrganization?.id} />)}
          </div>
        ) : (
          <EmptyState title="No organizations found" description="Adjust your search or filters." action={<Button variant="secondary" onClick={() => { setQuery(""); setRoleFilter("All roles"); setStatusFilter("All statuses"); }}>Reset filters</Button>} />
        )}
      </section>
    </div>
  </AutoLocalizedContent>);
}

function OrganizationRow({ organization, featured }: { organization: Organization; featured: boolean }) {
  const href = `/organizations/${encodeURIComponent(organization.slug || organization.id)}`;
  const statusTone = organization.status === "Active" ? "success" : organization.status === "Pending invitation" ? "warning" : organization.status === "Suspended organization" ? "danger" : "neutral";
  const roleTone = organization.role === "Owner" ? "gold" : organization.role === "Admin" ? "blue" : organization.role === "Member" ? "success" : "neutral";

  return (<AutoLocalizedContent>
    <Link href={href} className={`group flex min-h-20 items-center gap-4 border-b border-ds-token-border px-4 py-3 outline-none transition last:border-b-0 hover:bg-ds-token-elevated focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ds-token-gold/70 sm:px-5 ${featured ? "bg-ds-token-gold/5" : ""}`}>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-ds-md border border-ds-token-gold/25 bg-ds-token-gold/10 text-sm font-bold text-gold">{organization.logo || organization.name.slice(0, 2)}</div>
      <div className="min-w-0 flex-1 sm:grid sm:grid-cols-[minmax(0,1fr)_140px_120px] sm:items-center sm:gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ds-token-text sm:text-base">{organization.name}</h2>
          <div className="mt-1 flex flex-wrap gap-2 sm:hidden"><Badge tone={statusTone}>{organization.status}</Badge><Badge tone={roleTone}>{organization.role}</Badge></div>
        </div>
        <div className="hidden sm:block"><Badge tone={statusTone}>{organization.status}</Badge></div>
        <div className="hidden sm:block"><Badge tone={roleTone}>{organization.role}</Badge></div>
      </div>
      <div className="hidden w-24 text-end text-sm text-ds-token-muted md:block"><span className="font-semibold text-ds-token-text">{organization.activeProjects}</span> Projects</div>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-gold">Open <ArrowRight className="h-4 w-4 rtl:rotate-180" /></span>
    </Link>
  </AutoLocalizedContent>);
}

function OrgFilter({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (<AutoLocalizedContent>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-ds-md border border-ds-token-border bg-ds-token-surface px-4 text-sm font-medium text-ds-token-text outline-none transition focus:border-ds-token-gold/50">
      {options.map((option) => <option key={option} value={option} className="bg-[#111827] text-white">{option}</option>)}
    </select>
  </AutoLocalizedContent>);
}
