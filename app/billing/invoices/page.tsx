"use client";

import { BillingNav, InvoiceTable } from "@/components/billing-workspace";
import { Badge, GlassCard, PageHeader } from "@/components/ui";
import { useBillingInvoices } from "@/lib/repositories/billingHooks";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function BillingInvoicesPage() {
  const state = useBillingInvoices();
  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <PageHeader eyebrow="Invoices" title="Invoice history" description="Track invoice status, taxes, totals, due dates, and future download actions." />
      <BillingNav active="invoices" />
      <GlassCard className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <Badge tone={state.source === "supabase" ? "success" : state.isFallback ? "warning" : "neutral"}>{state.source}</Badge>
          <Badge tone="gold">{state.loading ? "Loading" : `${state.data.length} invoices`}</Badge>
        </div>
        <InvoiceTable invoices={state.data} />
      </GlassCard>
    </div>
  </AutoLocalizedContent>);
}
