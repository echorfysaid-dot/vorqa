import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, BrainCircuit, CalendarClock, CircleDollarSign, Clock3, FileText, Paperclip, ShieldAlert, Trophy } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar, Table } from "@/components/ui";
import { VoraVisual } from "@/components/vorqa-official-visuals";
import { quotationRepository } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { getRequestLocale } from "@/lib/i18n-server";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function QuotationDetailsPage({ params }: { params: { id: string } }) {
  const locale = getRequestLocale();
  const quotation = quotationRepository.getById(params.id);
  if (!quotation) notFound();
  const totals = {
    subtotal: Number(quotation.metadata?.subtotal || quotation.items?.reduce((sum, item) => sum + item.subtotal, 0) || 0),
    tax: Number(quotation.metadata?.tax || quotation.items?.reduce((sum, item) => sum + (item.tax || 0), 0) || 0),
    total: quotation.totalPrice
  };

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/quotations" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white"><ArrowLeft className="h-4 w-4" />Back to quotations</Link>
            <div className="flex flex-wrap gap-2">
              <Badge tone="gold">{quotation.id}</Badge>
              <Badge tone={quotation.status === "Shortlisted" ? "gold" : quotation.status === "Awarded" ? "success" : "blue"}>{quotation.status || "Submitted"}</Badge>
              <Badge tone="blue">{quotation.rfqId || "RFQ"}</Badge>
            </div>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">{quotation.company}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">{quotation.rfqTitle || quotation.notes}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/rfq/${quotation.rfqId || "RFQ-1001"}`}><Button variant="secondary" icon={<FileText className="h-4 w-4" />}>Open RFQ</Button></Link>
            {quotation.supplierSlug && <Link href={`/marketplace/${quotation.supplierSlug}`}><Button variant="secondary" icon={<BadgeCheck className="h-4 w-4" />}>Supplier profile</Button></Link>}
            <Link href="/quotations/compare"><Button icon={<Trophy className="h-4 w-4" />}>Compare</Button></Link>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-6">
          <GlassCard className="p-5">
            <SectionHeader title="Quotation overview" icon={<CircleDollarSign className="h-5 w-5" />} />
            <div className="grid gap-4 md:grid-cols-4">
              <Metric label="Total price" value={formatCurrency(quotation.totalPrice, quotation.currency || "MAD", locale)} />
              <Metric label="Lead time" value={quotation.leadTime || quotation.duration} />
              <Metric label="Payment terms" value={quotation.paymentTerms} />
              <Metric label="Warranty" value={quotation.warranty} />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <ProgressBar value={quotation.technicalCompliance} label="Technical compliance" tone="blue" />
              <ProgressBar value={quotation.commercialCompliance} label="Commercial compliance" tone="success" />
              <ProgressBar value={quotation.evaluation?.overallScore || quotation.voraFit} label="Weighted score" tone="gold" />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionHeader title="Line items and automatic totals" icon={<FileText className="h-5 w-5" />} />
            {quotation.items?.length ? (
              <Table
                columns={["Item", "Qty", "Unit", "Unit price", "Tax", "Total"]}
                rows={quotation.items.map((item) => [
                  <span key="description" className="font-black text-white">{item.description}</span>,
                  item.quantity,
                  item.unit,
                  formatCurrency(item.unitPrice, "MAD", locale),
                  formatCurrency(item.tax || 0, "MAD", locale),
                  <span key="total" className="font-black text-gold">{formatCurrency(item.total, "MAD", locale)}</span>
                ])}
              />
            ) : (
              <EmptyState title="No line items" description="Line items will appear when a supplier quotation includes itemized pricing." />
            )}
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Metric label="Subtotal" value={formatCurrency(totals.subtotal, "MAD", locale)} compact />
              <Metric label="Tax" value={formatCurrency(totals.tax, "MAD", locale)} compact />
              <Metric label="Grand total" value={formatCurrency(totals.total, "MAD", locale)} compact />
            </div>
          </GlassCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <ScorePanel title="Technical evaluation" scores={quotation.evaluation?.technicalCriteria || []} />
            <ScorePanel title="Commercial evaluation" scores={quotation.evaluation?.commercialCriteria || []} />
          </div>

          <GlassCard className="p-5">
            <SectionHeader title="Attachments metadata" icon={<Paperclip className="h-5 w-5" />} />
            {quotation.attachments?.length ? (
              <div className="grid gap-3 md:grid-cols-3">
                {quotation.attachments.map((document) => (
                  <div key={document.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <Badge tone="blue">{document.type}</Badge>
                    <p className="mt-3 font-black text-white">{document.name}</p>
                    <p className="mt-1 text-sm text-ds-text/48">{document.size ? `${Math.round(document.size / 1000)} KB` : "Metadata only"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No attachments" description="Supplier documents are represented as metadata until production storage is connected." />
            )}
          </GlassCard>
        </main>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <VoraQuotationPanel quotation={quotation} />
          <GlassCard className="p-5">
            <SectionHeader title="Commercial terms" icon={<Clock3 className="h-5 w-5" />} />
            <div className="grid gap-3">
              <Metric label="Submission date" value={quotation.submissionDate ? formatDate(quotation.submissionDate, locale) : "N/A"} compact />
              <Metric label="Expiration date" value={quotation.expirationDate || "N/A"} compact />
              <Metric label="Delivery terms" value={quotation.deliveryTerms || "N/A"} compact />
              <Metric label="Start availability" value={quotation.startAvailability} compact />
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <SectionHeader title="Supplier reliability" icon={<CalendarClock className="h-5 w-5" />} />
            <div className="grid gap-3">
              <Metric label="Rating" value={String(quotation.rating)} compact />
              <Metric label="Response time" value={quotation.responseTime} compact />
              <Metric label="Capacity" value={quotation.capacity} compact />
              <Metric label="Risk level" value={quotation.riskLevel} compact />
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function VoraQuotationPanel({ quotation }: { quotation: NonNullable<ReturnType<typeof quotationRepository.getById>> }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start gap-4">
        <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
        <div>
          <Badge tone="blue">VORA Quotation Intelligence</Badge>
          <h2 className="mt-3 text-xl font-black text-white">Evaluation summary</h2>
        </div>
      </div>
      <p className="mt-5 text-sm leading-7 text-ds-text/62">{quotation.notes}</p>
      <div className="mt-5 grid gap-3">
        <Insight title="Preferred position" text={quotation.badge} icon={<Trophy className="h-4 w-4" />} />
        <Insight title="Anomaly check" text={quotation.totalPrice < 1000000 ? "Low total: verify scope assumptions and deliverables." : "No pricing anomaly detected in demo comparison."} icon={<ShieldAlert className="h-4 w-4" />} />
        <Insight title="Executive note" text={quotation.evaluation?.reviewerNotes || "Ready for reviewer notes."} icon={<BrainCircuit className="h-4 w-4" />} />
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function ScorePanel({ title, scores }: { title: string; scores: Array<{ label: string; value: number; weight?: number }> }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <SectionHeader title={title} icon={<BadgeCheck className="h-5 w-5" />} />
      <div className="grid gap-4">
        {scores.map((score) => <ProgressBar key={score.label} value={score.value} label={`${score.label}${score.weight ? ` · ${score.weight}% weight` : ""}`} />)}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (<AutoLocalizedContent><div className="mb-5 flex items-center gap-2 text-gold">{icon}<h2 className="text-2xl font-black text-white">{title}</h2></div></AutoLocalizedContent>);
}

function Metric({ label, value, compact = false }: { label: string; value?: string | number; compact?: boolean }) {
  return (<AutoLocalizedContent><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"><p className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</p><p className={`mt-2 font-black text-white ${compact ? "text-base" : "text-xl"}`}>{value || "N/A"}</p></div></AutoLocalizedContent>);
}

function Insight({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (<AutoLocalizedContent><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><div className="flex items-center gap-2 text-gold">{icon}<p className="font-black text-white">{title}</p></div><p className="mt-2 text-sm leading-6 text-ds-text/58">{text}</p></div></AutoLocalizedContent>);
}
