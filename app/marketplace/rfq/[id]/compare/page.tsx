"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Plus, Star, Trash2, Trophy, WandSparkles } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar } from "@/components/ui";
import { rfqRepository } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

const demoQuotations = rfqRepository.listQuotations();
const demoRfqs = rfqRepository.list();

type Quote = (typeof demoQuotations)[number];

const comparisonRows = [
  ["Total price", (q: Quote) => q.price],
  ["Taxes", (q: Quote) => q.taxes],
  ["Delivery cost", (q: Quote) => q.deliveryCost],
  ["Payment terms", (q: Quote) => q.paymentTerms],
  ["Estimated duration", (q: Quote) => q.duration],
  ["Start availability", (q: Quote) => q.startAvailability],
  ["Warranty", (q: Quote) => q.warranty],
  ["Technical compliance", (q: Quote) => `${q.technicalCompliance}%`],
  ["Commercial compliance", (q: Quote) => `${q.commercialCompliance}%`],
  ["Certifications", (q: Quote) => q.certifications.join(", ")],
  ["Capacity", (q: Quote) => q.capacity],
  ["Rating", (q: Quote) => q.rating.toFixed(1)],
  ["Response time", (q: Quote) => q.responseTime],
  ["Delivery reliability", (q: Quote) => q.reliability],
  ["Risk level", (q: Quote) => q.riskLevel],
  ["VORA fit score", (q: Quote) => `${q.voraFit}%`]
] as const;

const technicalLabels = [
  ["Technical approach", "approach"],
  ["Team capability", "team"],
  ["Relevant experience", "experience"],
  ["Delivery plan", "delivery"],
  ["Quality assurance", "quality"],
  ["Safety compliance", "safety"],
  ["Documentation quality", "documentation"]
] as const;

const commercialLabels = [
  ["Price competitiveness", "price"],
  ["Payment terms", "payment"],
  ["Warranty", "warranty"],
  ["Schedule", "schedule"],
  ["Contract flexibility", "flexibility"],
  ["Financial stability", "stability"]
] as const;

export default function RfqQuotationComparePage({ params }: { params: { id: string } }) {
  const rfq = demoRfqs.find((item) => item.id === params.id);
  if (!rfq) {
    return (<AutoLocalizedContent>
      <EmptyState
        title="RFQ not found"
        description="This comparison workspace could not find a matching demo RFQ."
        action={<Link href="/marketplace/rfq"><Button>Back to RFQs</Button></Link>}
      />
    </AutoLocalizedContent>);
  }
  return (<AutoLocalizedContent><RfqQuotationCompareContent rfq={rfq} /></AutoLocalizedContent>);
}

function RfqQuotationCompareContent({ rfq }: { rfq: (typeof demoRfqs)[number] }) {
  const [selectedCompanies, setSelectedCompanies] = useState(demoQuotations.map((quote) => quote.company));
  const quotes = useMemo(() => demoQuotations.filter((quote) => selectedCompanies.includes(quote.company)), [selectedCompanies]);
  const lowestPrice = Math.min(...quotes.map((quote) => quote.totalPrice));
  const fastestDuration = Math.min(...quotes.map((quote) => Number.parseInt(quote.duration)));
  const recommended = quotes.reduce<Quote | null>((best, quote) => !best || quote.voraFit > best.voraFit ? quote : best, null);

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href={`/marketplace/rfq/${rfq.id}`} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white"><ArrowLeft className="h-4 w-4" />Back to RFQ</Link>
            <div className="flex flex-wrap gap-2"><Badge tone="gold">{rfq.id}</Badge><Badge tone="blue">Quotation comparison</Badge></div>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Compare submitted quotations.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">Evaluate cost, commercial terms, technical strength, risk, and VORA recommendation before award.</p>
          </div>
          <Link href={`/marketplace/rfq/${rfq.id}/award`}><Button icon={<Trophy className="h-4 w-4" />}>Award supplier</Button></Link>
        </div>
      </GlassCard>

      {quotes.length ? (
        <>
          <GlassCard className="p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {quotes.map((quote) => (
                  <QuoteHeader key={quote.company} quote={quote} recommended={recommended?.company === quote.company} lowestPrice={quote.totalPrice === lowestPrice} fastest={Number.parseInt(quote.duration) === fastestDuration} onRemove={() => setSelectedCompanies((current) => current.filter((company) => company !== quote.company))} />
                ))}
                {quotes.length < 4 && (
                  <div className="grid min-h-48 place-items-center rounded-[1.5rem] border border-dashed border-white/16 bg-white/[0.035] p-5 text-center">
                    <div><Plus className="mx-auto h-8 w-8 text-gold" /><p className="mt-3 font-black text-white">Add supplier placeholder</p></div>
                  </div>
                )}
              </div>
              <VoraRecommendation recommended={recommended} />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black text-white">Quotation matrix</h2><Badge tone="gold">Sticky supplier headers</Badge></div>
            <div className="overflow-x-auto">
              <div className="min-w-[980px] rounded-[1.5rem] border border-white/10 bg-black/16">
                <div className="sticky top-0 grid border-b border-white/10 bg-[#0B1120]" style={{ gridTemplateColumns: `220px repeat(${quotes.length}, minmax(210px,1fr))` }}>
                  <div className="p-4 text-xs font-black uppercase tracking-[0.12em] text-ds-text/42">Criteria</div>
                  {quotes.map((quote) => <div key={quote.company} className="p-4 font-black text-white">{quote.company}</div>)}
                </div>
                {comparisonRows.map(([label, value]) => (
                  <div key={label} className="grid border-b border-white/10 last:border-b-0" style={{ gridTemplateColumns: `220px repeat(${quotes.length}, minmax(210px,1fr))` }}>
                    <div className="p-4 text-sm font-black text-gold">{label}</div>
                    {quotes.map((quote) => <div key={quote.company} className="p-4 text-sm leading-6 text-ds-text/60">{value(quote)}</div>)}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <EvaluationPanel title="Technical Evaluation" labels={technicalLabels} quotes={quotes} scoreKey="technicalScores" />
            <EvaluationPanel title="Commercial Evaluation" labels={commercialLabels} quotes={quotes} scoreKey="commercialScores" />
          </div>

          <GlassCard className="p-5">
            <h2 className="text-2xl font-black text-white">Cost breakdown</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {quotes.map((quote) => <CostBreakdown key={quote.company} quote={quote} />)}
            </div>
          </GlassCard>
        </>
      ) : (
        <EmptyState title="No quotations selected" description="Reset the demo to compare submitted quotations again." action={<Button onClick={() => setSelectedCompanies(demoQuotations.map((quote) => quote.company))}>Reset comparison</Button>} />
      )}
    </div>
  </AutoLocalizedContent>);
}

function QuoteHeader({ quote, recommended, lowestPrice, fastest, onRemove }: { quote: Quote; recommended: boolean; lowestPrice: boolean; fastest: boolean; onRemove: () => void }) {
  return (<AutoLocalizedContent>
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D4AF37]/12 font-black text-gold">{quote.logo}</span><button onClick={onRemove} className="grid h-9 w-9 place-items-center rounded-xl text-ds-text/48 hover:bg-white/10 hover:text-white" aria-label={`Remove ${quote.company}`}><Trash2 className="h-4 w-4" /></button></div>
      <div className="mt-4 flex flex-wrap gap-2">{recommended && <Badge tone="success">Recommended</Badge>}{lowestPrice && <Badge tone="gold">Lowest price</Badge>}{fastest && <Badge tone="blue">Fastest</Badge>}{quote.riskLevel === "Lowest" && <Badge tone="success">Lowest risk</Badge>}</div>
      <h3 className="mt-3 text-lg font-black text-white">{quote.company}</h3>
      <p className="mt-1 text-sm text-ds-text/52">{quote.price} · {quote.duration}</p>
      <div className="mt-4"><ProgressBar value={quote.voraFit} label="VORA fit" /></div>
    </div>
  </AutoLocalizedContent>);
}

function EvaluationPanel({ title, labels, quotes, scoreKey }: { title: string; labels: readonly (readonly [string, string])[]; quotes: Quote[]; scoreKey: "technicalScores" | "commercialScores" }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <div className="mt-5 grid gap-4">
        {quotes.map((quote) => (
          <div key={quote.company} className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
            <p className="mb-3 font-black text-gold">{quote.company}</p>
            <div className="grid gap-3">
              {labels.map(([label, key]) => <ProgressBar key={label} value={quote[scoreKey][key as keyof typeof quote[typeof scoreKey]]} label={label} tone="blue" />)}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function CostBreakdown({ quote }: { quote: Quote }) {
  const items = Object.entries(quote.costBreakdown);
  const total = items.reduce((sum, [, value]) => sum + value, 0);
  return (<AutoLocalizedContent>
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
      <h3 className="font-black text-white">{quote.company}</h3>
      <p className="mt-1 text-sm text-gold">{quote.price}</p>
      <div className="mt-4 grid gap-3">
        {items.map(([label, value]) => <ProgressBar key={label} value={(value / total) * 100} label={`${label} · MAD ${(value / 1000).toFixed(0)}K`} tone={label === "taxes" ? "warning" : "gold"} />)}
      </div>
    </div>
  </AutoLocalizedContent>);
}

function VoraRecommendation({ recommended }: { recommended: Quote | null }) {
  const insights = [
    ["Recommended supplier", recommended?.company || "Atlas Construction Group"],
    ["Main strengths", "Execution accountability, technical clarity, and strong RFQ response quality."],
    ["Main risks", "Confirm procurement lead times and payment milestones before award."],
    ["Negotiation points", "Target improved warranty language and logistics cost cap."],
    ["Suggested target price", "MAD 10.2M for full execution scope."],
    ["Suggested conditions", "Milestone payments, weekly reporting, and variation approval workflow."],
    ["Backup supplier", "NorthBuild Engineering for technical validation."]
  ];
  return (<AutoLocalizedContent>
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
      <div className="flex items-start gap-3"><WandSparkles className="h-6 w-6 text-gold" /><div><Badge tone="blue">VORA Recommendation</Badge><h3 className="mt-3 text-xl font-black text-white">Award guidance</h3></div></div>
      <div className="mt-5 grid gap-3">{insights.map(([title, text]) => <div key={title} className="rounded-2xl bg-black/18 p-3"><p className="font-black text-white">{title}</p><p className="mt-1 text-sm leading-6 text-ds-text/56">{text}</p></div>)}</div>
    </div>
  </AutoLocalizedContent>);
}
