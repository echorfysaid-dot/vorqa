import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, CalendarDays, CheckCircle2, Clock3, FileText, Paperclip, ShieldCheck, UsersRound, WandSparkles } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar, TimelineCard } from "@/components/ui";
import { VoraVisual } from "@/components/vorqa-official-visuals";
import { contractRepository } from "@/lib/repositories";
import type { Contract } from "@/lib/models";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { getRequestLocale } from "@/lib/i18n-server";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function ContractDetailsPage({ params }: { params: { id: string } }) {
  const locale = getRequestLocale();
  const contract = contractRepository.getById(params.id);
  if (!contract) notFound();

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/contracts" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white"><ArrowLeft className="h-4 w-4" />Back to contracts</Link>
            <div className="flex flex-wrap gap-2"><Badge tone="gold">{contract.id}</Badge><Badge tone={contract.status === "Active" ? "success" : "neutral"}>{contract.status}</Badge><Badge tone="blue">{contract.linkedRfq}</Badge></div>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">{contract.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">{contract.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/rfq/${contract.linkedRfq}`}><Button variant="secondary" icon={<FileText className="h-4 w-4" />}>Open linked RFQ</Button></Link>
            {contract.quotationId && <Link href={`/quotations/${contract.quotationId}`}><Button variant="secondary" icon={<BadgeCheck className="h-4 w-4" />}>Winning quotation</Button></Link>}
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <main className="space-y-6">
          <GlassCard className="p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <Metric label="Winning company" value={contract.winningCompany} />
              <Metric label="Project" value={contract.project} />
              <Metric
                label="Contract value"
                value={contract.valueAmount == null ? contract.value : formatCurrency(contract.valueAmount, contract.currency || "MAD", locale)}
              />
              <Metric label="Period" value={`${formatDisplayDate(contract.startDate, locale)} - ${formatDisplayDate(contract.endDate, locale)}`} />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Metric label="Contract type" value={contract.contractType || contract.category || "Contract"} />
              <Metric label="Retention" value={contract.retention || "N/A"} />
              <Metric label="Warranty" value={contract.warranty || "N/A"} />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionHeader title="Award decision" icon={<BadgeCheck className="h-5 w-5" />} />
            {contract.award ? (
              <div className="grid gap-4 md:grid-cols-3">
                <Metric label="Winning quotation" value={contract.award.quotationId} />
                <Metric label="Award date" value={formatDisplayDate(contract.award.awardDate, locale)} />
                <Metric label="Award value" value={formatCurrency(contract.award.awardValue, "MAD", locale)} />
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 md:col-span-3">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">Award reason</p>
                  <p className="mt-2 text-sm font-bold leading-7 text-ds-text/62">{contract.award.awardReason}</p>
                  {contract.award.approvalNotes && <p className="mt-2 text-sm font-bold leading-7 text-gold">{contract.award.approvalNotes}</p>}
                </div>
              </div>
            ) : (
              <EmptyState title="No award decision" description="Award metadata will appear when this contract is created from a winning quotation." />
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <SectionHeader title="Milestones" icon={<CheckCircle2 className="h-5 w-5" />} />
            <div className="grid gap-4 md:grid-cols-2">
              {contract.milestones.length ? contract.milestones.map((milestone) => (
                <div key={milestone.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
                  <Badge tone={milestone.status === "Complete" ? "success" : milestone.status === "Scheduled" ? "warning" : "neutral"}>{milestone.status}</Badge>
                  <h3 className="mt-3 text-lg font-black text-white">{milestone.title}</h3>
                  <p className="mt-1 text-sm text-ds-text/50">{formatDisplayDate(milestone.date, locale)}</p>
                  <div className="mt-4"><ProgressBar value={milestone.progress} label="Milestone progress" /></div>
                </div>
              )) : <EmptyState title="No milestones in this demo contract" />}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionHeader title="Payment schedule" icon={<CalendarDays className="h-5 w-5" />} />
            <div className="grid gap-3 md:grid-cols-2">
              {contract.payments.length ? contract.payments.map((payment) => <Metric key={payment.label} label={`${payment.label} · ${formatDisplayDate(payment.due, locale)}`} value={`${payment.amount} · ${payment.status}`} />) : <EmptyState title="No payment schedule available" />}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionHeader title="Deliverables" icon={<FileText className="h-5 w-5" />} />
            <div className="grid gap-3 md:grid-cols-2">
              {contract.deliverables.map((deliverable) => {
                const item = typeof deliverable === "string" ? { id: deliverable, description: deliverable, status: "Pending", owner: contract.winningCompany, acceptanceStatus: "Pending" } : deliverable;
                return (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <Badge tone={item.status === "Accepted" ? "success" : item.status === "In progress" ? "blue" : "neutral"}>{item.status}</Badge>
                    <p className="mt-3 font-black text-white">{item.description}</p>
                    <p className="mt-1 text-sm text-ds-text/48">{item.owner || contract.winningCompany} · {item.acceptanceStatus || "Pending acceptance"}</p>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionHeader title="Approvals" icon={<ShieldCheck className="h-5 w-5" />} />
            <div className="grid gap-3 md:grid-cols-3">
              {(contract.approvals || []).map((approval) => (
                <div key={approval.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <Badge tone={approval.status === "Approved" || approval.status === "Executed" ? "success" : approval.status === "Rejected" ? "danger" : "warning"}>{approval.status}</Badge>
                  <p className="mt-3 font-black text-white">{approval.reviewer}</p>
                  <p className="mt-1 text-sm text-ds-text/48">{approval.reviewerRole || "Reviewer"}</p>
                  <p className="mt-3 text-sm leading-6 text-ds-text/58">{approval.notes}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <PartiesPanel title="Client" party={contract.parties.client} />
            <PartiesPanel title="Contractor" party={contract.parties.contractor} />
          </div>

          <GlassCard className="p-5">
            <SectionHeader title="Attachments placeholder" icon={<Paperclip className="h-5 w-5" />} />
            <EmptyState title="No real contract attachments" description="Contract files, signatures, and generated PDFs will be connected in a later backend sprint." />
          </GlassCard>
        </main>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <VoraContractInsights contract={contract} />
          <GlassCard className="p-5">
            <SectionHeader title="Contract timeline" icon={<Clock3 className="h-5 w-5" />} />
            <div className="grid gap-4">
              {(contract.timeline.length ? contract.timeline : [{ title: "Draft", date: contract.startDate, text: contract.summary || "Contract timeline is ready for future workflow events." }]).map((item, index) => <TimelineCard key={item.title} index={index + 1} title={`${item.title} · ${formatDisplayDate(item.date, locale)}`} text={item.text} />)}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionHeader title="Activity" icon={<Clock3 className="h-5 w-5" />} />
            <div className="grid gap-3">
              {contract.activity.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-sm font-bold text-ds-text/60">{item}</div>)}
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function formatDisplayDate(value: string, locale: "ar" | "fr" | "en") {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? value : formatDate(value, locale, { month: "long" });
}

function PartiesPanel({ title, party }: { title: string; party: Contract["parties"]["client"] }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <SectionHeader title={title} icon={<UsersRound className="h-5 w-5" />} />
      <h3 className="text-xl font-black text-white">{party.name}</h3>
      <p className="mt-1 text-sm text-gold">{party.contact}</p>
      <div className="mt-4 grid gap-2">
        {party.responsibilities.map((item) => <div key={item} className="rounded-xl bg-black/18 px-3 py-2 text-sm text-ds-text/58">{item}</div>)}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function VoraContractInsights({ contract }: { contract: Contract }) {
  const insights = [
    ["Missing clauses", contract.insights.missingClauses.length ? contract.insights.missingClauses.join(", ") : "No major missing clauses in demo."],
    ["Delivery risks", contract.insights.deliveryRisks.length ? contract.insights.deliveryRisks.join(", ") : "No active delivery risks."],
    ["Budget risks", contract.insights.budgetRisks.length ? contract.insights.budgetRisks.join(", ") : "No active budget risks."],
    ["Payment review", contract.insights.paymentReview || "Payment schedule is ready for review."],
    ["Milestone review", contract.insights.milestoneReview || "Milestone structure is ready for review."],
    ["Recommended checkpoints", contract.insights.checkpoints.join(", ")],
    ["Compliance summary", contract.insights.compliance]
  ];
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start gap-4"><VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" /><div><Badge tone="blue">VORA Contract Insights</Badge><h2 className="mt-3 text-xl font-black text-white">Contract review preview</h2></div></div>
      <div className="mt-5 grid gap-3">
        {insights.map(([title, text]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><div className="flex items-center gap-2 text-gold"><WandSparkles className="h-4 w-4" /><p className="font-black text-white">{title}</p></div><p className="mt-2 text-sm leading-6 text-ds-text/58">{text}</p></div>)}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (<AutoLocalizedContent><div className="mb-5 flex items-center gap-2 text-gold">{icon}<h2 className="text-2xl font-black text-white">{title}</h2></div></AutoLocalizedContent>);
}

function Metric({ label, value }: { label: string; value: string }) {
  return (<AutoLocalizedContent><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"><div className="flex items-center gap-2 text-gold"><ShieldCheck className="h-4 w-4" /><span className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</span></div><p className="mt-2 text-sm font-black leading-6 text-white">{value}</p></div></AutoLocalizedContent>);
}
