"use client";

import Link from "next/link";
import { CheckCircle2, CreditCard, Download, Gauge, ReceiptText, Sparkles } from "lucide-react";
import { Badge, Button, GlassCard, ProgressBar, SkeletonCard, Table } from "@/components/ui";
import type { BillingSummary, Invoice, Plan, UsageRecord } from "@/lib/models";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export function BillingNav({ active }: { active: "overview" | "plans" | "invoices" | "usage" }) {
  const items = [
    { href: "/billing", label: "Overview", value: "overview" },
    { href: "/billing/plans", label: "Plans", value: "plans" },
    { href: "/billing/invoices", label: "Invoices", value: "invoices" },
    { href: "/billing/usage", label: "Usage", value: "usage" }
  ] as const;
  return (<AutoLocalizedContent>
    <div className="flex gap-2 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.045] p-2">
      {items.map((item) => (
        <Link key={item.value} href={item.href} className={`rounded-2xl px-4 py-2 text-sm font-black transition ${active === item.value ? "bg-[#D4AF37] text-black shadow-gold-glow" : "text-ds-text/58 hover:bg-white/[0.06] hover:text-white"}`}>
          {item.label}
        </Link>
      ))}
    </div>
  </AutoLocalizedContent>);
}

export function BillingHero({ summary, loading, source }: { summary: BillingSummary; loading: boolean; source?: string }) {
  return (<AutoLocalizedContent>
    <GlassCard className="relative overflow-hidden p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(81,216,255,.14),transparent_28%),radial-gradient(circle_at_16%_10%,rgba(215,180,90,.16),transparent_30%)]" />
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <Badge tone="gold">Billing & Subscription</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">Vorqa subscription control center</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ds-text/62">
            Track plan limits, AI usage, invoices, trial status, and future payment provider readiness for Atlas Construction Group.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone={summary.subscription.status === "active" || summary.subscription.status === "trialing" ? "success" : "warning"}>{summary.subscription.status}</Badge>
            <Badge tone="blue">{summary.subscription.provider}</Badge>
            <Badge tone="neutral">{source || "Repository-driven"}</Badge>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-black/28 p-5">
          <p className="text-sm font-black text-ds-text/52">Current plan</p>
          <p className="mt-2 text-3xl font-black text-[#F2D487]">{loading ? "..." : summary.plan.name}</p>
          <p className="mt-2 text-sm leading-6 text-ds-text/58">Renews {summary.renewalDate ? new Date(summary.renewalDate).toLocaleDateString("en-GB") : "manually"}</p>
          <div className="mt-5">
            <ProgressBar value={trialProgress(summary)} label="Trial progress" tone="gold" />
          </div>
        </div>
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

export function BillingMetricGrid({ summary }: { summary: BillingSummary }) {
  const ai = summary.usage.find((item) => item.metric === "ai_requests");
  const storage = summary.usage.find((item) => item.metric === "storage");
  const projects = summary.usage.find((item) => item.metric === "projects");
  const rfqs = summary.usage.find((item) => item.metric === "rfqs");
  return (<AutoLocalizedContent>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="AI requests" value={formatUsage(ai)} tone="blue" icon={<Sparkles className="h-5 w-5" />} />
      <Metric title="Projects" value={formatUsage(projects)} tone="gold" icon={<Gauge className="h-5 w-5" />} />
      <Metric title="Storage" value={formatUsage(storage)} tone="success" icon={<CreditCard className="h-5 w-5" />} />
      <Metric title="RFQs" value={formatUsage(rfqs)} tone="warning" icon={<ReceiptText className="h-5 w-5" />} />
    </div>
  </AutoLocalizedContent>);
}

export function PlanCards({ plans, currentPlanId }: { plans: Plan[]; currentPlanId?: string }) {
  return (<AutoLocalizedContent>
    <div className="grid gap-5 lg:grid-cols-4">
      {plans.map((plan) => (
        <GlassCard key={plan.id} className={`p-5 ${plan.recommended ? "ring-2 ring-[#D4AF37]/60" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge tone={plan.id === currentPlanId ? "success" : plan.recommended ? "gold" : "neutral"}>{plan.id === currentPlanId ? "Current" : plan.recommended ? "Recommended" : "Plan"}</Badge>
              <h2 className="mt-3 text-2xl font-black text-white">{plan.name}</h2>
              <p className="mt-2 text-sm leading-6 text-ds-text/58">{plan.description}</p>
            </div>
          </div>
          <p className="mt-5 text-3xl font-black text-[#F2D487]">{plan.priceMonthly ? `${plan.priceMonthly} ${plan.currency}` : plan.id === "enterprise" ? "Custom" : "Free"}</p>
          <div className="mt-5 grid gap-3">
            {plan.features.map((feature) => (
              <p key={feature} className="flex items-center gap-2 text-sm font-bold text-ds-text/70">
                <CheckCircle2 className="h-4 w-4 text-gold" />
                {feature}
              </p>
            ))}
          </div>
          <Button className="mt-6 w-full" variant={plan.id === currentPlanId ? "secondary" : "primary"}>{plan.id === currentPlanId ? "Current plan" : "Prepare upgrade"}</Button>
        </GlassCard>
      ))}
    </div>
  </AutoLocalizedContent>);
}

export function UsageTable({ usage }: { usage: UsageRecord[] }) {
  return (<AutoLocalizedContent>
    <Table
      columns={["Metric", "Used", "Limit", "Unit", "Progress"]}
      rows={usage.map((item) => [
        item.metric.replace(/_/g, " "),
        item.used,
        item.limit,
        item.unit,
        <ProgressBar key={item.id} value={usagePercent(item)} tone={usagePercent(item) > 85 ? "warning" : "gold"} />
      ])}
    />
  </AutoLocalizedContent>);
}

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (<AutoLocalizedContent>
    <Table
      columns={["Invoice", "Status", "Amount", "Issued", "Action"]}
      rows={invoices.map((invoice) => [
        invoice.invoiceNumber,
        <Badge key={`${invoice.id}-status`} tone={invoice.status === "paid" ? "success" : invoice.status === "open" ? "warning" : "neutral"}>{invoice.status}</Badge>,
        `${invoice.amountTotal.toLocaleString("en-US")} ${invoice.currency}`,
        new Date(invoice.issuedAt).toLocaleDateString("en-GB"),
        <Button key={`${invoice.id}-download`} variant="ghost" size="sm" icon={<Download className="h-4 w-4" />}>Download</Button>
      ])}
    />
  </AutoLocalizedContent>);
}

export function BillingLoading() {
  return (<AutoLocalizedContent>
    <div className="space-y-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </AutoLocalizedContent>);
}

function Metric({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: "gold" | "blue" | "success" | "warning" }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.055] text-gold">{icon}</span>
        <Badge tone={tone}>{title}</Badge>
      </div>
      <p className="mt-4 text-2xl font-black text-white">{value}</p>
    </GlassCard>
  </AutoLocalizedContent>);
}

function formatUsage(item?: UsageRecord) {
  if (!item) return "0";
  return `${item.used}${item.limit === "unlimited" ? "" : ` / ${item.limit}`}`;
}

function usagePercent(item: UsageRecord) {
  if (item.limit === "unlimited" || Number(item.limit) === 0) return 0;
  return Math.min(100, Math.round((item.used / Number(item.limit)) * 100));
}

function trialProgress(summary: BillingSummary) {
  if (summary.trialStatus !== "active" || !summary.subscription.trialEndsAt || !summary.subscription.createdAt) return 100;
  const start = new Date(summary.subscription.createdAt).getTime();
  const end = new Date(summary.subscription.trialEndsAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
}
