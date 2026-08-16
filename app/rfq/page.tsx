"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock3, FileText, Filter, PackageCheck, Plus, Search, Trophy, WandSparkles } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar, SkeletonCard } from "@/components/ui";
import { useRfqs, useRfqSummary } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function RfqPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [priorityFilter, setPriorityFilter] = useState("All priorities");
  const rfqState = useRfqs({ query, status: statusFilter, category: categoryFilter, priority: priorityFilter });
  const summaryState = useRfqSummary();
  const allRfqs = rfqState.data;
  const categories = Array.from(new Set(allRfqs.map((rfq) => rfq.category)));

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="gold">RFQ Management</Badge>
              <Badge tone="blue">Organizations · Projects · Marketplace</Badge>
              <Badge tone={rfqState.source === "supabase" ? "success" : rfqState.isFallback ? "warning" : "neutral"}>{rfqState.source === "supabase" ? "Supabase" : rfqState.isFallback ? "Demo fallback" : "Demo"}</Badge>
            </div>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">rfq.command.title</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">
              rfq.command.description
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/marketplace"><Button variant="secondary">Browse suppliers</Button></Link>
            <Link href="/rfq/new"><Button icon={<Plus className="h-4 w-4" />}>Create RFQ</Button></Link>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <RfqKpi label="Draft RFQs" value={summaryState.loading ? "..." : String(summaryState.data.draft)} icon={<FileText className="h-5 w-5" />} />
        <RfqKpi label="Open RFQs" value={summaryState.loading ? "..." : String(summaryState.data.published)} icon={<PackageCheck className="h-5 w-5" />} />
        <RfqKpi label="Pending Responses" value={summaryState.loading ? "..." : String(summaryState.data.pendingResponses)} icon={<Clock3 className="h-5 w-5" />} />
        <RfqKpi label="Under Review" value={summaryState.loading ? "..." : String(summaryState.data.underReview)} icon={<Filter className="h-5 w-5" />} />
        <RfqKpi label="Awarded" value={summaryState.loading ? "..." : String(summaryState.data.awarded)} icon={<Trophy className="h-5 w-5" />} />
        <RfqKpi label="Closed" value={summaryState.loading ? "..." : String(summaryState.data.closed)} icon={<WandSparkles className="h-5 w-5" />} />
      </div>

      <GlassCard className="p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_200px_180px]">
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 shadow-inner shadow-black/20 transition focus-within:border-[#D4AF37]/44">
            <Search className="h-4 w-4 text-gold" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search RFQs, projects, suppliers or services" className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-ds-text/36" />
          </label>
          <RfqFilter value={statusFilter} onChange={setStatusFilter} options={["All statuses", "Draft", "Published", "Open", "Pending Responses", "Under Review", "Awarded", "Cancelled", "Closed"]} />
          <RfqFilter value={categoryFilter} onChange={setCategoryFilter} options={["All categories", ...categories]} />
          <RfqFilter value={priorityFilter} onChange={setPriorityFilter} options={["All priorities", "Low", "Medium", "High", "Critical"]} />
        </div>
        {rfqState.error && rfqState.isFallback && <p className="mt-3 text-sm font-bold text-warning">rfq.fallback.demoNotice</p>}
      </GlassCard>

      {rfqState.loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : rfqState.data.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rfqState.data.map((rfq) => <RfqCard key={rfq.id} rfq={rfq} />)}
        </div>
      ) : (
        <EmptyState title="No RFQs found" description="Adjust search, status, category, or priority filters to find RFQs." action={<Button variant="secondary" onClick={() => { setQuery(""); setStatusFilter("All statuses"); setCategoryFilter("All categories"); setPriorityFilter("All priorities"); }}>Reset filters</Button>} />
      )}
    </div>
  </AutoLocalizedContent>);
}

function RfqCard({ rfq }: { rfq: ReturnType<typeof useRfqs>["data"][number] }) {
  const tone = rfq.status === "Published" || rfq.status === "Open" || rfq.status === "Pending Responses" ? "success" : rfq.status === "Draft" ? "warning" : rfq.status === "Awarded" ? "gold" : rfq.status === "Cancelled" ? "danger" : "neutral";
  const progress = Number(rfq.metadata?.progress || (rfq.status === "Awarded" ? 100 : rfq.status === "Closed" ? 88 : rfq.status === "Draft" ? 18 : 52));
  return (<AutoLocalizedContent>
    <Link href={`/rfq/${rfq.id}`} className="group block rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70">
      <GlassCard className="p-5 transition group-hover:border-[#D4AF37]/30">
        <div className="flex items-start justify-between gap-4">
          <Badge tone={tone}>{rfq.status}</Badge>
          <span className="font-black text-gold">{rfq.id}</span>
        </div>
        <h2 className="mt-5 text-2xl font-black text-white">{rfq.title}</h2>
        <p className="mt-2 text-sm leading-7 text-ds-text/58">{rfq.description}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <MiniMetric label="Project" value={rfq.project} />
          <MiniMetric label="Budget" value={rfq.budget} />
          <MiniMetric label="Deadline" value={rfq.dueDate} />
          <MiniMetric label="Suppliers" value={String(rfq.suppliers?.length || rfq.companies.length)} />
        </div>
        <div className="mt-5"><ProgressBar value={progress} label="RFQ workflow progress" tone={tone} /></div>
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
