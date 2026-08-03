"use client";

import { BillingNav, PlanCards } from "@/components/billing-workspace";
import { PageHeader } from "@/components/ui";
import { useBillingPlans, useBillingSummary } from "@/lib/repositories/billingHooks";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function BillingPlansPage() {
  const plans = useBillingPlans();
  const summary = useBillingSummary();
  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <PageHeader eyebrow="Plans" title="Subscription plans" description="Compare Free, Starter, Professional, and Enterprise limits before connecting a live payment provider." />
      <BillingNav active="plans" />
      <PlanCards plans={plans.data} currentPlanId={summary.data.subscription.planId} />
    </div>
  </AutoLocalizedContent>);
}
