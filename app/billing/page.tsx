"use client";

import Link from "next/link";
import { CreditCard, ReceiptText } from "lucide-react";
import { Badge, Button, GlassCard, PageHeader } from "@/components/ui";
import { BillingHero, BillingMetricGrid, BillingNav, InvoiceTable, UsageTable } from "@/components/billing-workspace";
import { useBillingSummary } from "@/lib/repositories/billingHooks";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function BillingPage() {
  const state = useBillingSummary();
  const summary = state.data;
  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <PageHeader eyebrow="SaaS Billing" title="Billing control center" description="Plan, usage, invoices, trial status, and future payment provider readiness." />
      <BillingNav active="overview" />
      <BillingHero summary={summary} loading={state.loading} source={state.source} />
      <BillingMetricGrid summary={summary} />
      <section className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
        <GlassCard className="p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <Badge tone="blue">Usage</Badge>
              <h2 className="mt-2 text-2xl font-black text-white">Current billing period</h2>
            </div>
            <Link href="/billing/usage"><Button variant="secondary" icon={<CreditCard className="h-4 w-4" />}>View usage</Button></Link>
          </div>
          <UsageTable usage={summary.usage.slice(0, 5)} />
        </GlassCard>
        <GlassCard className="p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <Badge tone="gold">Invoices</Badge>
              <h2 className="mt-2 text-2xl font-black text-white">Recent invoices</h2>
            </div>
            <Link href="/billing/invoices"><Button variant="secondary" icon={<ReceiptText className="h-4 w-4" />}>Invoices</Button></Link>
          </div>
          <InvoiceTable invoices={summary.invoices.slice(0, 3)} />
        </GlassCard>
      </section>
      {state.error && state.isFallback && <GlassCard className="p-4"><p className="text-sm font-bold text-warning">Billing is shown from demo fallback while production billing tables are unavailable.</p></GlassCard>}
    </div>
  </AutoLocalizedContent>);
}
