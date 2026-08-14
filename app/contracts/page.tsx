"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, FileSignature, Search, ShieldCheck } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar, SkeletonCard } from "@/components/ui";
import { useContracts, useContractSummary } from "@/lib/repositories";
import type { Contract } from "@/lib/models";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { useI18n } from "@/components/i18n-provider";
import { formatCurrency } from "@/lib/utils/format";
import { localizeDemoDate } from "@/lib/demo-localization";

export default function ContractsPage() {
  const { locale, translate } = useI18n();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const contractsState = useContracts({ query, status: statusFilter, category: categoryFilter });
  const summaryState = useContractSummary();
  const contracts = contractsState.data;

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2"><Badge tone="gold">Contracts</Badge><Badge tone="blue">Post-award foundation</Badge><Badge tone={contractsState.source === "supabase" ? "success" : contractsState.isFallback ? "warning" : "neutral"}>{contractsState.source === "supabase" ? "Supabase" : contractsState.isFallback ? "Demo fallback" : "Demo"}</Badge></div>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Contract management workspace.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">Track active, draft, completed, and expiring contracts after RFQ award decisions. Demo UI only, with no persistence or backend actions.</p>
          </div>
          <Link href="/marketplace/rfq/RFQ-1001/award"><Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>Open award flow</Button></Link>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ContractKpi label="Active contracts" value={summaryState.loading ? "..." : String(summaryState.data.active)} icon={<FileSignature className="h-5 w-5" />} />
        <ContractKpi label="Awaiting approval" value={summaryState.loading ? "..." : String(summaryState.data.awaitingApproval)} icon={<Clock3 className="h-5 w-5" />} />
        <ContractKpi label="Upcoming milestones" value={summaryState.loading ? "..." : String(summaryState.data.upcomingMilestones.length)} icon={<CheckCircle2 className="h-5 w-5" />} />
        <ContractKpi label="Upcoming payments" value={summaryState.loading ? "..." : String(summaryState.data.upcomingPayments.length)} icon={<CalendarDays className="h-5 w-5" />} />
        <ContractKpi label="Total value" value={summaryState.loading ? "..." : formatCurrency(summaryState.data.totalValue, "MAD", locale)} icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      <GlassCard className="p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px]">
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 shadow-inner shadow-black/20 transition focus-within:border-[#D4AF37]/44">
            <Search className="h-4 w-4 text-gold" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search contracts, RFQs, companies or projects" className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-ds-text/36" />
          </label>
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={["All statuses", ...Array.from(new Set(contracts.map((contract) => String(contract.status))))]} />
          <FilterSelect value={categoryFilter} onChange={setCategoryFilter} options={["All categories", ...Array.from(new Set(contracts.map((contract) => contract.category || "Contract")))]} />
        </div>
        {contractsState.error && contractsState.isFallback && <p className="mt-3 text-sm font-bold text-warning">Production contract data is unavailable, so Vorqa is showing demo fallback contracts.</p>}
      </GlassCard>

      {contractsState.loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : contractsState.data.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {contractsState.data.map((contract) => <ContractCard key={contract.id} contract={contract} />)}
        </div>
      ) : (
        <EmptyState title="No contracts found" description="Adjust your search or filters to restore the contract dashboard." action={<Button variant="secondary" onClick={() => { setQuery(""); setStatusFilter("All statuses"); setCategoryFilter("All categories"); }}>Reset filters</Button>} />
      )}
    </div>
  </AutoLocalizedContent>);
}

function ContractCard({ contract }: { contract: Contract }) {
  const { locale, translate } = useI18n();
  const isDemo = contract.ownerId === "demo-user";
  const tone = contract.status === "Active" ? "success" : contract.status === "Draft" ? "warning" : contract.status === "Completed" ? "gold" : "danger";
  return (<AutoLocalizedContent>
    <Link href={`/contracts/${contract.id}`} className="group block rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70">
      <GlassCard className="p-5 transition group-hover:border-[#D4AF37]/30">
        <div className="flex items-start justify-between gap-4"><Badge tone={tone}>{contract.status}</Badge><span className="font-black text-gold">{contract.id}</span></div>
        <h2 className="mt-5 text-2xl font-black text-white">{contract.title}</h2>
        <p className="mt-2 text-sm leading-7 text-ds-text/58">{contract.summary}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <MiniMetric label="Linked RFQ" value={contract.linkedRfq} />
          <MiniMetric label="Company" value={contract.winningCompany} />
          <MiniMetric
            label="Value"
            value={contract.valueAmount == null ? contract.value : formatCurrency(contract.valueAmount, contract.currency || "MAD", locale)}
          />
          <MiniMetric label="End date" value={localizeDemoDate(contract.endDate, locale, isDemo ? translate : (value) => value)} />
        </div>
        <div className="mt-5"><ProgressBar value={contract.status === "Completed" ? 100 : contract.status === "Active" ? 42 : contract.status === "Expiring" ? 88 : 18} label="Contract progress" tone={tone} /></div>
      </GlassCard>
    </Link>
  </AutoLocalizedContent>);
}

function ContractKpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (<AutoLocalizedContent><GlassCard className="p-4"><div className="flex items-center gap-2 text-gold">{icon}<span className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</span></div><p className="mt-3 text-2xl font-black text-white">{value}</p></GlassCard></AutoLocalizedContent>);
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (<AutoLocalizedContent><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"><p className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</p><p className="mt-2 truncate font-black text-white">{value}</p></div></AutoLocalizedContent>);
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (<AutoLocalizedContent><select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-black text-white outline-none transition focus:border-[#D4AF37]/44">{options.map((option) => <option key={option} value={option} className="bg-[#111827] text-white">{option}</option>)}</select></AutoLocalizedContent>);
}
