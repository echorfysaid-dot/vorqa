"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Clock3, FileText, Filter, PackageCheck, Plus, Search, Trophy } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar } from "@/components/ui";
import { rfqRepository } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { useI18n } from "@/components/i18n-provider";
import { localizeDemoDate, localizeDemoValue } from "@/lib/demo-localization";

const demoRfqs = rfqRepository.list();

export default function RfqDashboardPage() {
  const { locale, translate } = useI18n();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [categoryFilter, setCategoryFilter] = useState("All categories");

  const filteredRfqs = useMemo(() => demoRfqs.filter((rfq) => {
    const searchText = `${rfq.id} ${rfq.title} ${rfq.project} ${rfq.category}`.toLowerCase();
    return searchText.includes(query.toLowerCase())
      && (statusFilter === "All statuses" || rfq.status === statusFilter)
      && (categoryFilter === "All categories" || rfq.category === categoryFilter);
  }), [query, statusFilter, categoryFilter]);

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/marketplace" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white"><ArrowLeft className="h-4 w-4" />Back to marketplace</Link>
            <div className="flex flex-wrap gap-2"><Badge tone="gold">RFQ Center</Badge><Badge tone="blue">Marketplace procurement</Badge></div>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Request for Quotation workspace.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">Track open, draft, closed, and awarded RFQs before real procurement workflows are connected.</p>
          </div>
          <Link href="/marketplace/rfq/new"><Button icon={<Plus className="h-4 w-4" />}>Create RFQ</Button></Link>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <RfqKpi label="Open RFQs" value={String(demoRfqs.filter((rfq) => rfq.status === "Open").length)} icon={<PackageCheck className="h-5 w-5" />} />
        <RfqKpi label="Draft RFQs" value={String(demoRfqs.filter((rfq) => rfq.status === "Draft").length)} icon={<FileText className="h-5 w-5" />} />
        <RfqKpi label="Closed RFQs" value={String(demoRfqs.filter((rfq) => rfq.status === "Closed").length)} icon={<Clock3 className="h-5 w-5" />} />
        <RfqKpi label="Awarded RFQs" value={String(demoRfqs.filter((rfq) => rfq.status === "Awarded").length)} icon={<Trophy className="h-5 w-5" />} />
        <RfqKpi label="Invited firms" value={String(demoRfqs.reduce((sum, rfq) => sum + rfq.companies.length, 0))} icon={<Filter className="h-5 w-5" />} />
      </div>

      <GlassCard className="p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_200px]">
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 shadow-inner shadow-black/20 transition focus-within:border-[#D4AF37]/44">
            <Search className="h-4 w-4 text-gold" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search RFQs, projects or services" className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-ds-text/36" />
          </label>
          <RfqFilter value={statusFilter} onChange={setStatusFilter} options={["All statuses", ...Array.from(new Set(demoRfqs.map((rfq) => rfq.status)))]} />
          <RfqFilter value={categoryFilter} onChange={setCategoryFilter} options={["All categories", ...Array.from(new Set(demoRfqs.map((rfq) => rfq.category)))]} />
        </div>
      </GlassCard>

      {filteredRfqs.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredRfqs.map((rfq) => <RfqCard key={rfq.id} rfq={rfq} locale={locale} translate={translate} />)}
        </div>
      ) : (
        <EmptyState title="No RFQs found" description="Adjust your search or filters to restore the RFQ dashboard." action={<Button variant="secondary" onClick={() => { setQuery(""); setStatusFilter("All statuses"); setCategoryFilter("All categories"); }}>Reset filters</Button>} />
      )}
    </div>
  </AutoLocalizedContent>);
}

function RfqCard({ rfq, locale, translate }: { rfq: (typeof demoRfqs)[number]; locale: "ar" | "fr" | "en"; translate: (value: string) => string }) {
  const tone = rfq.status === "Open" ? "success" : rfq.status === "Draft" ? "warning" : rfq.status === "Awarded" ? "gold" : "neutral";
  return (<AutoLocalizedContent>
    <Link href={`/marketplace/rfq/${rfq.id}`} className="group block rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70">
      <GlassCard className="p-5 transition group-hover:border-[#D4AF37]/30">
        <div className="flex items-start justify-between gap-4"><Badge tone={tone}>{rfq.status}</Badge><span className="font-black text-gold">{rfq.id}</span></div>
        <h2 className="mt-5 text-2xl font-black text-white">{localizeDemoValue({ value: rfq.title, key: String(rfq.metadata?.titleKey || "") }, locale, translate)}</h2>
        <p className="mt-2 text-sm leading-7 text-ds-text/58">{localizeDemoValue({ value: rfq.description || "", key: String(rfq.metadata?.descriptionKey || "") }, locale, translate)}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <MiniMetric label="Project" value={rfq.project} />
          <MiniMetric label="Budget" value={rfq.budget} />
          <MiniMetric label="Timeline" value={rfq.timeline} />
          <MiniMetric label="Due" value={localizeDemoDate(rfq.dueDate, locale, translate)} />
        </div>
        <div className="mt-5"><ProgressBar value={rfq.status === "Awarded" ? 100 : rfq.status === "Closed" ? 84 : rfq.status === "Open" ? 52 : 24} label="RFQ progress" tone={tone} /></div>
      </GlassCard>
    </Link>
  </AutoLocalizedContent>);
}

function RfqKpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 text-gold">{icon}<span className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</span></div>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </GlassCard>
  </AutoLocalizedContent>);
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (<AutoLocalizedContent><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"><p className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</p><p className="mt-2 truncate font-black text-white">{value}</p></div></AutoLocalizedContent>);
}

function RfqFilter({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (<AutoLocalizedContent>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-black text-white outline-none transition focus:border-[#D4AF37]/44">
      {options.map((option) => <option key={option} value={option} className="bg-[#111827] text-white">{option}</option>)}
    </select>
  </AutoLocalizedContent>);
}
