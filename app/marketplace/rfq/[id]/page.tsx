import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, FileText, MessageSquare, Paperclip, Scale, Star, Trophy, UsersRound, WandSparkles } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar, TimelineCard } from "@/components/ui";
import { VoraVisual } from "@/components/vorqa-official-visuals";
import { rfqRepository } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { getRequestLocale } from "@/lib/i18n-server";
import { translateUiText } from "@/lib/i18n";
import { localizeDemoDate, localizeDemoValue } from "@/lib/demo-localization";

const demoQuotations = rfqRepository.listQuotations();

export default function RfqDetailsPage({ params }: { params: { id: string } }) {
  const locale = getRequestLocale();
  const translate = (value: string) => translateUiText(value, locale);
  const rfq = rfqRepository.getById(params.id);
  if (!rfq) notFound();

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/marketplace/rfq" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white"><ArrowLeft className="h-4 w-4" />Back to RFQs</Link>
            <div className="flex flex-wrap gap-2"><Badge tone="gold">{rfq.id}</Badge><Badge tone={rfq.status === "Open" ? "success" : "neutral"}>{rfq.status}</Badge></div>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">{localizeDemoValue({ value: rfq.title, key: String(rfq.metadata?.titleKey || "") }, locale, translate)}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">{localizeDemoValue({ value: rfq.description || "", key: String(rfq.metadata?.descriptionKey || "") }, locale, translate)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/marketplace/rfq/${rfq.id}/compare`}><Button variant="secondary" icon={<Scale className="h-4 w-4" />}>Compare quotations</Button></Link>
            <Link href={`/marketplace/rfq/${rfq.id}/compare`}><Button variant="secondary" icon={<FileText className="h-4 w-4" />}>Start evaluation</Button></Link>
            <Link href={`/marketplace/rfq/${rfq.id}/award`}><Button icon={<Trophy className="h-4 w-4" />}>Award supplier</Button></Link>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-6">
          <GlassCard className="p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <Metric label="Budget" value={rfq.budget} />
              <Metric label="Timeline" value={rfq.timeline} />
              <Metric label="Due date" value={localizeDemoDate(rfq.dueDate, locale, translate)} />
              <Metric label="Invited" value={String(rfq.companies.length)} />
            </div>
            <div className="mt-5"><ProgressBar value={58} label="RFQ timeline" /></div>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionHeader title="Selected companies" icon={<UsersRound className="h-5 w-5" />} />
            <div className="grid gap-3 md:grid-cols-2">
              {rfq.companies.map((company) => <div key={company} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 font-black text-white">{company}</div>)}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionHeader title="Quotation preview" icon={<Trophy className="h-5 w-5" />} />
            <div className="grid gap-4 md:grid-cols-2">
              {demoQuotations.map((quote) => (
                <div key={quote.company} className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><Badge tone={quote.badge === "Recommended" ? "success" : "gold"}>{quote.badge}</Badge><h3 className="mt-3 text-xl font-black text-white">{quote.company}</h3></div>
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D4AF37]/12 font-black text-gold">{quote.logo}</span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Metric label="Price" value={quote.price} compact />
                    <Metric label="Duration" value={quote.duration} compact />
                    <Metric label="Rating" value={String(quote.rating)} compact />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-ds-text/58">{quote.notes}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard className="p-5">
              <SectionHeader title="Attachments placeholder" icon={<Paperclip className="h-5 w-5" />} />
              <EmptyState title="No real attachments" description="Attachment upload will be connected in a later backend sprint." />
            </GlassCard>
            <GlassCard className="p-5">
              <SectionHeader title="Messages placeholder" icon={<MessageSquare className="h-5 w-5" />} />
              <EmptyState title="No real messages" description="Supplier messaging is UI-only in this sprint." />
            </GlassCard>
          </div>
        </main>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <VoraRfqInsights />
          <GlassCard className="p-5">
            <SectionHeader title="Activity timeline" icon={<Clock3 className="h-5 w-5" />} />
            <div className="grid gap-4">
              {["RFQ draft created", "Companies selected", "Quotation preview generated", "VORA recommended supplier mix"].map((item, index) => <TimelineCard key={item} index={index + 1} title={item} text="Demo activity event for RFQ-1001." />)}
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function VoraRfqInsights() {
  const insights = [
    ["Best value", "BetonPro Materials has the strongest price-capacity balance."],
    ["Fastest delivery", "GeoConsult Africa can complete advisory in 4 weeks."],
    ["Lowest risk", "NorthBuild Engineering reduces technical uncertainty."],
    ["Highest rated", "Atlas Construction Group leads with 4.9 rating."],
    ["Recommended supplier mix", "Atlas + NorthBuild + BetonPro + GeoConsult."]
  ];
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start gap-4"><VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" /><div><Badge tone="blue">VORA RFQ Insights</Badge><h2 className="mt-3 text-xl font-black text-white">Quotation guidance</h2></div></div>
      <div className="mt-5 grid gap-3">
        {insights.map(([title, text]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><div className="flex items-center gap-2 text-gold"><WandSparkles className="h-4 w-4" /><p className="font-black text-white">{title}</p></div><p className="mt-2 text-sm leading-6 text-ds-text/58">{text}</p></div>)}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (<AutoLocalizedContent><div className="mb-5 flex items-center gap-2 text-gold">{icon}<h2 className="text-2xl font-black text-white">{title}</h2></div></AutoLocalizedContent>);
}

function Metric({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (<AutoLocalizedContent><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"><p className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</p><p className={`mt-2 font-black text-white ${compact ? "text-base" : "text-xl"}`}>{value}</p></div></AutoLocalizedContent>);
}
