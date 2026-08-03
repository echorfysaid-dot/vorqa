"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardCheck, FileText, Trophy, WandSparkles } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar } from "@/components/ui";
import { rfqRepository } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

const awardSteps = rfqRepository.listAwardSteps();
const demoQuotations = rfqRepository.listQuotations();
const demoRfqs = rfqRepository.list();

export default function RfqAwardPage({ params }: { params: { id: string } }) {
  const rfq = demoRfqs.find((item) => item.id === params.id);
  if (!rfq) {
    return (<AutoLocalizedContent>
      <EmptyState
        title="RFQ not found"
        description="This award workflow could not find a matching demo RFQ."
        action={<Link href="/marketplace/rfq"><Button>Back to RFQs</Button></Link>}
      />
    </AutoLocalizedContent>);
  }
  return (<AutoLocalizedContent><RfqAwardContent rfq={rfq} /></AutoLocalizedContent>);
}

function RfqAwardContent({ rfq }: { rfq: (typeof demoRfqs)[number] }) {
  const [step, setStep] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState("Atlas Construction Group");
  const selectedQuote = demoQuotations.find((quote) => quote.company === selectedCompany) || demoQuotations[0];
  const progress = ((step + 1) / awardSteps.length) * 100;

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <Link href={`/marketplace/rfq/${rfq.id}/compare`} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white"><ArrowLeft className="h-4 w-4" />Back to comparison</Link>
        <div className="flex flex-wrap gap-2"><Badge tone="gold">{rfq.id}</Badge><Badge tone="blue">Supplier award flow</Badge></div>
        <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Award supplier decision.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">Complete a guided award decision preview. No real award, notification, contract, or persistence is created.</p>
        <div className="mt-6"><ProgressBar value={progress} label={awardSteps[step]} /></div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        <GlassCard className="p-4">
          <div className="grid gap-3">
            {awardSteps.map((label, index) => (
              <button key={label} type="button" onClick={() => setStep(index)} className={`rounded-2xl border p-3 text-start transition ${step === index ? "border-[#D4AF37]/42 bg-[#D4AF37]/12" : "border-white/10 bg-white/[0.045] hover:bg-white/[0.07]"}`}>
                <span className="text-xs font-black text-gold">Step {index + 1}</span>
                <p className="mt-1 font-black text-white">{label}</p>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <AwardStep step={step} selectedCompany={selectedCompany} setSelectedCompany={setSelectedCompany} selectedQuote={selectedQuote} />
          <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Previous</Button>
            {step < awardSteps.length - 1 ? <Button onClick={() => setStep((value) => Math.min(awardSteps.length - 1, value + 1))}>Continue</Button> : <Link href={`/marketplace/rfq/${rfq.id}`}><Button icon={<CheckCircle2 className="h-4 w-4" />}>Finish preview</Button></Link>}
          </div>
        </GlassCard>

        <AwardSummary selectedQuote={selectedQuote} />
      </div>
    </div>
  </AutoLocalizedContent>);
}

function AwardStep({ step, selectedCompany, setSelectedCompany, selectedQuote }: { step: number; selectedCompany: string; setSelectedCompany: (value: string) => void; selectedQuote: (typeof demoQuotations)[number] }) {
  if (step === 0) {
    return (<AutoLocalizedContent>
      <div>
        <StepTitle title="Select winning quotation" description="Choose the supplier to award in this UI-only preview." />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {demoQuotations.map((quote) => {
            const selected = selectedCompany === quote.company;
            return (
              <button key={quote.company} type="button" onClick={() => setSelectedCompany(quote.company)} className={`rounded-[1.5rem] border p-4 text-start transition hover:-translate-y-1 ${selected ? "border-[#D4AF37]/42 bg-[#D4AF37]/12" : "border-white/10 bg-white/[0.045]"}`}>
                <Badge tone={quote.badge === "Recommended" ? "success" : "gold"}>{quote.badge}</Badge>
                <h3 className="mt-3 text-lg font-black text-white">{quote.company}</h3>
                <p className="mt-1 text-sm text-ds-text/52">{quote.price} · {quote.duration}</p>
              </button>
            );
          })}
        </div>
      </div>
    </AutoLocalizedContent>);
  }
  if (step === 1) return (<AutoLocalizedContent><StepCards title="Confirm scope and final price" cards={[`Selected scope: RFQ-1001 execution package`, `Final amount: ${selectedQuote.price}`, `Delivery period: ${selectedQuote.duration}`, `Payment terms: ${selectedQuote.paymentTerms}`]} /></AutoLocalizedContent>);
  if (step === 2) return (<AutoLocalizedContent><StepCards title="Add award notes" cards={["Decision reason: best overall fit and delivery reliability.", "Negotiation note: cap logistics variation exposure.", "Contract note: include weekly reporting condition.", "Approval note: board review required before real award."]} /></AutoLocalizedContent>);
  if (step === 3) return (<AutoLocalizedContent><StepCards title="Review decision" cards={[`Winner: ${selectedQuote.company}`, `VORA fit: ${selectedQuote.voraFit}%`, `Risk level: ${selectedQuote.riskLevel}`, "Approval status: Pending executive confirmation"]} /></AutoLocalizedContent>);
  return (<AutoLocalizedContent><StepCards title="Award confirmation" cards={["Award preview complete", "No supplier notification sent", "No contract generated", "Next step: contract generation placeholder"]} /></AutoLocalizedContent>);
}

function AwardSummary({ selectedQuote }: { selectedQuote: (typeof demoQuotations)[number] }) {
  const nextSteps = ["Executive approval", "Contract generation placeholder", "Supplier notification placeholder", "Kickoff meeting scheduling"];
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start gap-3"><Trophy className="h-6 w-6 text-gold" /><div><Badge tone="gold">Award Summary</Badge><h2 className="mt-3 text-xl font-black text-white">{selectedQuote.company}</h2></div></div>
      <div className="mt-5 grid gap-3">
        <Metric label="Final amount" value={selectedQuote.price} />
        <Metric label="Delivery period" value={selectedQuote.duration} />
        <Metric label="Approval status" value="Pending approval" />
        <Metric label="Decision reasons" value="Best VORA fit, strong reliability, clear reporting." />
      </div>
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
        <div className="flex items-center gap-2 text-gold"><WandSparkles className="h-4 w-4" /><p className="font-black text-white">Next steps</p></div>
        <div className="mt-3 grid gap-2">{nextSteps.map((step) => <p key={step} className="rounded-xl bg-black/18 px-3 py-2 text-sm text-ds-text/58">{step}</p>)}</div>
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function StepCards({ title, cards }: { title: string; cards: string[] }) {
  return (<AutoLocalizedContent>
    <div>
      <StepTitle title={title} description="Review award details in this frontend-only workflow." />
      <div className="mt-5 grid gap-3 md:grid-cols-2">{cards.map((card) => <div key={card} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><ClipboardCheck className="mb-3 h-5 w-5 text-gold" /><p className="font-black text-white">{card}</p></div>)}</div>
    </div>
  </AutoLocalizedContent>);
}

function StepTitle({ title, description }: { title: string; description: string }) {
  return (<AutoLocalizedContent><div><Badge tone="gold">{title}</Badge><h2 className="mt-3 text-2xl font-black text-white">{title}</h2><p className="mt-2 text-sm leading-7 text-ds-text/58">{description}</p></div></AutoLocalizedContent>);
}

function Metric({ label, value }: { label: string; value: string }) {
  return (<AutoLocalizedContent><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"><div className="flex items-center gap-2 text-gold"><FileText className="h-4 w-4" /><span className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</span></div><p className="mt-2 text-sm font-black leading-6 text-white">{value}</p></div></AutoLocalizedContent>);
}
