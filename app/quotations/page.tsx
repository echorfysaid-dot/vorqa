"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BadgeCheck, BrainCircuit, Clock3, FileStack, Filter, ReceiptText, Search, ShieldCheck, Trophy } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar, SkeletonCard } from "@/components/ui";
import { useQuotationDashboard, useQuotations } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function QuotationsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [supplierFilter, setSupplierFilter] = useState("All suppliers");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const quotationsState = useQuotations({ query, status: statusFilter as never, supplier: supplierFilter, category: categoryFilter });
  const dashboardState = useQuotationDashboard();
  const suppliers = Array.from(new Set(quotationsState.data.map((quotation) => quotation.company)));
  const categories = Array.from(new Set(quotationsState.data.map((quotation) => quotation.category).filter(Boolean))) as string[];

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="gold">Quotation Management</Badge>
              <Badge tone="blue">RFQs · Marketplace · Projects</Badge>
              <Badge tone={quotationsState.source === "supabase" ? "success" : quotationsState.isFallback ? "warning" : "neutral"}>{quotationsState.source === "supabase" ? "Supabase" : quotationsState.isFallback ? "Demo fallback" : "Demo"}</Badge>
            </div>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Quotation comparison command center.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">
              Manage supplier offers, evaluate technical and commercial strength, compare RFQ responses, and prepare VORA-backed award recommendations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/rfq"><Button variant="secondary" icon={<FileStack className="h-4 w-4" />}>Open RFQs</Button></Link>
            <Link href="/quotations/compare"><Button icon={<Trophy className="h-4 w-4" />}>Compare quotations</Button></Link>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <QuoteKpi label="Pending Quotations" value={dashboardState.loading ? "..." : String(dashboardState.data.pending)} icon={<Clock3 className="h-5 w-5" />} />
        <QuoteKpi label="Compared" value={dashboardState.loading ? "..." : String(dashboardState.data.compared)} icon={<Filter className="h-5 w-5" />} />
        <QuoteKpi label="Best Offers" value={dashboardState.loading ? "..." : String(dashboardState.data.bestOffers.length)} icon={<BadgeCheck className="h-5 w-5" />} />
        <QuoteKpi label="Award Recommendations" value={dashboardState.loading ? "..." : String(dashboardState.data.awardRecommendations.length)} icon={<Trophy className="h-5 w-5" />} />
        <QuoteKpi label="Recent Evaluations" value={dashboardState.loading ? "..." : String(dashboardState.data.recentEvaluations.length)} icon={<BrainCircuit className="h-5 w-5" />} />
      </div>

      <GlassCard className="p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_200px_180px]">
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 shadow-inner shadow-black/20 transition focus-within:border-[#D4AF37]/44">
            <Search className="h-4 w-4 text-gold" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search quotation, supplier, RFQ or project" className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-ds-text/36" />
          </label>
          <QuoteFilter value={statusFilter} onChange={setStatusFilter} options={["All statuses", "Submitted", "Under review", "Shortlisted", "Rejected", "Awarded"]} />
          <QuoteFilter value={supplierFilter} onChange={setSupplierFilter} options={["All suppliers", ...suppliers]} />
          <QuoteFilter value={categoryFilter} onChange={setCategoryFilter} options={["All categories", ...categories]} />
        </div>
        {quotationsState.error && quotationsState.isFallback && <p className="mt-3 text-sm font-bold text-warning">Production quotation data is unavailable, so Vorqa is showing demo fallback quotations.</p>}
      </GlassCard>

      {quotationsState.loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : quotationsState.data.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {quotationsState.data.map((quotation) => <QuotationCard key={quotation.id || quotation.company} quotation={quotation} />)}
        </div>
      ) : (
        <EmptyState title="No quotations found" description="Adjust search and filters or open an RFQ to invite suppliers." action={<Button variant="secondary" onClick={() => { setQuery(""); setStatusFilter("All statuses"); setSupplierFilter("All suppliers"); setCategoryFilter("All categories"); }}>Reset filters</Button>} />
      )}
    </div>
  </AutoLocalizedContent>);
}

function QuotationCard({ quotation }: { quotation: ReturnType<typeof useQuotations>["data"][number] }) {
  const tone = quotation.status === "Shortlisted" ? "gold" : quotation.status === "Awarded" ? "success" : quotation.status === "Rejected" ? "danger" : "blue";
  return (<AutoLocalizedContent>
    <Link href={`/quotations/${quotation.id}`} className="group block rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70">
      <GlassCard className="p-5 transition group-hover:border-[#D4AF37]/30">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D4AF37]/12 text-xs font-black text-gold shadow-gold-glow">{quotation.logo || quotation.company.slice(0, 2)}</span>
          <Badge tone={tone}>{quotation.status || "Submitted"}</Badge>
        </div>
        <h2 className="mt-5 text-2xl font-black text-white">{quotation.company}</h2>
        <p className="mt-2 text-sm leading-7 text-ds-text/58">{quotation.rfqTitle || quotation.notes}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <MiniMetric label="Total price" value={quotation.price} />
          <MiniMetric label="Lead time" value={quotation.duration} />
          <MiniMetric label="Warranty" value={quotation.warranty} />
          <MiniMetric label="RFQ" value={quotation.rfqId || "RFQ"} />
        </div>
        <div className="mt-5"><ProgressBar value={quotation.evaluation?.overallScore || quotation.voraFit} label="Weighted evaluation" tone="gold" /></div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="blue">Technical {quotation.technicalCompliance}%</Badge>
          <Badge tone="success">Commercial {quotation.commercialCompliance}%</Badge>
          <Badge tone={quotation.riskLevel === "Medium" ? "warning" : "neutral"}>{quotation.riskLevel} risk</Badge>
        </div>
      </GlassCard>
    </Link>
  </AutoLocalizedContent>);
}

function QuoteKpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 text-gold">{icon}<span className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</span></div>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </GlassCard>
  </AutoLocalizedContent>);
}

function MiniMetric({ label, value }: { label: string; value?: string | number }) {
  return (<AutoLocalizedContent><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"><p className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</p><p className="mt-2 truncate font-black text-white">{value || "N/A"}</p></div></AutoLocalizedContent>);
}

function QuoteFilter({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (<AutoLocalizedContent>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-black text-white outline-none transition focus:border-[#D4AF37]/44">
      {options.map((option) => <option key={option} value={option} className="bg-[#111827] text-white">{option}</option>)}
    </select>
  </AutoLocalizedContent>);
}
