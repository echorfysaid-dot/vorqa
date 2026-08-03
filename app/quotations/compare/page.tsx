"use client";

import Link from "next/link";
import { ArrowLeft, BadgeCheck, BrainCircuit, CircleDollarSign, Clock3, ShieldAlert, Trophy } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar, SkeletonCard } from "@/components/ui";
import { VoraVisual } from "@/components/vorqa-official-visuals";
import { useQuotationComparison } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function QuotationComparisonPage() {
  const comparisonState = useQuotationComparison("RFQ-1001");
  const comparison = comparisonState.data;

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/quotations" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white"><ArrowLeft className="h-4 w-4" />Back to quotations</Link>
            <div className="flex flex-wrap gap-2">
              <Badge tone="gold">Quotation Comparison</Badge>
              <Badge tone="blue">{comparison.rfqId || "RFQ-1001"}</Badge>
              <Badge tone={comparisonState.source === "supabase" ? "success" : comparisonState.isFallback ? "warning" : "neutral"}>{comparisonState.source === "supabase" ? "Supabase" : comparisonState.isFallback ? "Demo fallback" : "Demo"}</Badge>
            </div>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Supplier offer evaluation matrix.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">
              Compare supplier quotations by price, compliance, delivery, warranty, payment terms, risk, and VORA fit before preparing an award decision.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/rfq/RFQ-1001"><Button variant="secondary">Open RFQ</Button></Link>
            <Button icon={<Trophy className="h-4 w-4" />}>Prepare award memo</Button>
          </div>
        </div>
      </GlassCard>

      {comparisonState.loading ? (
        <div className="grid gap-5 md:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : comparison.quotations.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {comparison.recommendations.map((recommendation) => (
              <GlassCard key={recommendation.type} className="p-4">
                <Badge tone={recommendation.type === "Balanced Recommendation" ? "gold" : "blue"}>{recommendation.type}</Badge>
                <p className="mt-3 text-xl font-black text-white">{recommendation.supplierName}</p>
                <p className="mt-2 text-sm leading-6 text-ds-text/52">{recommendation.reason}</p>
                <div className="mt-4"><ProgressBar value={recommendation.score} label="Recommendation score" /></div>
              </GlassCard>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <main className="space-y-6">
              <GlassCard className="overflow-hidden p-5">
                <div className="mb-5 flex items-center gap-2 text-gold"><CircleDollarSign className="h-5 w-5" /><h2 className="text-2xl font-black text-white">Comparison matrix</h2></div>
                <div className="overflow-x-auto">
                  <table className="min-w-[920px] w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-right font-black text-gold">Criteria</th>
                        {comparison.quotations.map((quotation) => (
                          <th key={quotation.id} className="sticky top-0 px-4 py-3 text-right">
                            <Link href={`/quotations/${quotation.id}`} className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2 transition hover:border-[#D4AF37]/30">
                              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#D4AF37]/12 text-xs font-black text-gold">{quotation.logo}</span>
                              <span>
                                <span className="block font-black text-white">{quotation.company}</span>
                                <span className="text-xs text-ds-text/42">{quotation.price}</span>
                              </span>
                            </Link>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.matrix.map((row) => (
                        <tr key={row.label} className="border-b border-white/10 transition hover:bg-white/[0.035]">
                          <td className="px-4 py-4 font-black text-white">{row.label}</td>
                          {row.values.map((value) => (
                            <td key={`${row.label}-${value.quotationId}`} className="px-4 py-4">
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${value.highlight === "best" ? "border-[#D4AF37]/35 bg-[#D4AF37]/12 text-gold" : value.highlight === "risk" ? "border-[#FFB020]/28 bg-[#FFB020]/10 text-warning" : "border-white/10 bg-white/[0.045] text-ds-text/64"}`}>
                                {value.value}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>

              <div className="grid gap-6 lg:grid-cols-2">
                {comparison.quotations.map((quotation) => (
                  <GlassCard key={quotation.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge tone="gold">{quotation.badge}</Badge>
                        <h3 className="mt-3 text-2xl font-black text-white">{quotation.company}</h3>
                        <p className="mt-1 text-sm text-ds-text/48">{quotation.rfqTitle}</p>
                      </div>
                      <Badge tone={quotation.riskLevel === "Medium" ? "warning" : "success"}>{quotation.riskLevel}</Badge>
                    </div>
                    <div className="mt-5 grid gap-4">
                      <ProgressBar value={quotation.evaluation?.technicalScore || quotation.technicalCompliance} label="Technical score" tone="blue" />
                      <ProgressBar value={quotation.evaluation?.commercialScore || quotation.commercialCompliance} label="Commercial score" tone="success" />
                      <ProgressBar value={quotation.evaluation?.overallScore || quotation.voraFit} label="Overall score" tone="gold" />
                    </div>
                  </GlassCard>
                ))}
              </div>
            </main>

            <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
              <VoraComparisonPanel state={comparisonState} />
              <GlassCard className="p-5">
                <div className="mb-5 flex items-center gap-2 text-gold"><Clock3 className="h-5 w-5" /><h2 className="text-xl font-black text-white">Evaluation notes</h2></div>
                <div className="grid gap-3">
                  {comparison.recommendations.slice(0, 3).map((recommendation) => (
                    <div key={`note-${recommendation.type}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <p className="font-black text-white">{recommendation.type}</p>
                      <p className="mt-2 text-sm leading-6 text-ds-text/58">{recommendation.reason}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </aside>
          </div>
        </>
      ) : (
        <EmptyState title="No quotations to compare" description="Quotation responses will appear here after suppliers submit offers for the selected RFQ." action={<Link href="/rfq/RFQ-1001"><Button variant="secondary">Open RFQ</Button></Link>} />
      )}
    </div>
  </AutoLocalizedContent>);
}

function VoraComparisonPanel({ state }: { state: ReturnType<typeof useQuotationComparison> }) {
  const insights = state.data.voraInsights;
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start gap-4">
        <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
        <div>
          <Badge tone="blue">VORA Comparison</Badge>
          <h2 className="mt-3 text-xl font-black text-white">{insights.preferredSupplier}</h2>
        </div>
      </div>
      <p className="mt-5 text-sm leading-7 text-ds-text/62">{insights.summary}</p>
      <div className="mt-5 grid gap-3">
        <Insight title="Executive summary" text={insights.executiveSummary} icon={<BrainCircuit className="h-4 w-4" />} />
        <Insight title="Risks" text={insights.risks.join(", ") || "No major risks detected."} icon={<ShieldAlert className="h-4 w-4" />} />
        <Insight title="Anomalies" text={insights.anomalies.join(", ") || "No anomalies detected."} icon={<BadgeCheck className="h-4 w-4" />} />
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function Insight({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (<AutoLocalizedContent><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><div className="flex items-center gap-2 text-gold">{icon}<p className="font-black text-white">{title}</p></div><p className="mt-2 text-sm leading-6 text-ds-text/58">{text}</p></div></AutoLocalizedContent>);
}
