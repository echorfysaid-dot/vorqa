"use client";

import { BillingNav, UsageTable } from "@/components/billing-workspace";
import { Badge, GlassCard, PageHeader } from "@/components/ui";
import { useBillingUsage } from "@/lib/repositories/billingHooks";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function BillingUsagePage() {
  const state = useBillingUsage();
  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <PageHeader eyebrow="Usage" title="Usage and limits" description="Monitor AI generations, projects, documents, storage, marketplace actions, RFQs, contracts, and notifications." />
      <BillingNav active="usage" />
      <GlassCard className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <Badge tone={state.source === "supabase" ? "success" : state.isFallback ? "warning" : "neutral"}>{state.source}</Badge>
          <Badge tone="blue">Quota tracking prepared</Badge>
        </div>
        <UsageTable usage={state.data} />
      </GlassCard>
    </div>
  </AutoLocalizedContent>);
}
