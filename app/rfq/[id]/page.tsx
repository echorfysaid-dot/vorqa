import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BrainCircuit, CheckCircle2, Clock3, FileText, MessageSquare, Paperclip, PackageCheck, ShieldAlert, Trophy, UsersRound, WandSparkles } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar, TimelineCard } from "@/components/ui";
import { VoraVisual } from "@/components/vorqa-official-visuals";
import { rfqRepository } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function RfqDetailsPage({ params }: { params: { id: string } }) {
  const rfq = rfqRepository.getById(params.id);
  if (!rfq) notFound();
  const progress = Number(rfq.metadata?.progress || 52);

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/rfq" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white"><ArrowLeft className="h-4 w-4" />Back to RFQs</Link>
            <div className="flex flex-wrap gap-2"><Badge tone="gold">{rfq.id}</Badge><Badge tone={rfq.status === "Draft" ? "warning" : rfq.status === "Awarded" ? "gold" : "success"}>{rfq.status}</Badge><Badge tone="blue">{rfq.visibility || "Invited Suppliers"}</Badge></div>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">{rfq.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">{rfq.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/marketplace"><Button variant="secondary" icon={<UsersRound className="h-4 w-4" />}>Find suppliers</Button></Link>
            <Link href="/quotations/compare"><Button variant="secondary" icon={<Trophy className="h-4 w-4" />}>Compare quotations</Button></Link>
            <Button variant="secondary" icon={<BrainCircuit className="h-4 w-4" />}>Ask VORA</Button>
            <Button icon={<Trophy className="h-4 w-4" />}>Review responses</Button>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-6">
          <GlassCard className="p-5">
            <SectionHeader title="Overview" icon={<PackageCheck className="h-5 w-5" />} />
            <div className="grid gap-4 md:grid-cols-4">
              <Metric label="Project" value={rfq.project} />
              <Metric label="Budget" value={rfq.budget} />
              <Metric label="Deadline" value={rfq.dueDate} />
              <Metric label="Priority" value={String(rfq.priority)} />
            </div>
            <div className="mt-5"><ProgressBar value={progress} label="RFQ workflow progress" /></div>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionHeader title="Requirements" icon={<FileText className="h-5 w-5" />} />
            <p className="text-sm leading-7 text-ds-text/58">{rfq.scopeOfWork}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(rfq.technicalRequirements || []).map((item) => <Requirement key={item} text={item} />)}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <SectionHeader title="Invited Suppliers" icon={<UsersRound className="h-5 w-5" />} />
            <div className="grid gap-4 md:grid-cols-2">
              {(rfq.suppliers || []).map((supplier) => (
                <div key={supplier.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Badge tone={supplier.verified ? "success" : "warning"}>{supplier.verified ? "Verified" : "Pending"}</Badge>
                    <Badge tone={supplier.status === "Recommended" ? "gold" : "neutral"}>{supplier.status || "Invited"}</Badge>
                  </div>
                  <h3 className="mt-3 text-xl font-black text-white">{supplier.companyName}</h3>
                  <p className="mt-1 text-sm text-ds-text/52">{supplier.category} · {supplier.city}, {supplier.country}</p>
                  <p className="mt-3 text-sm font-black text-gold">Rating {supplier.rating || "N/A"}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard className="p-5">
              <SectionHeader title="Attachments" icon={<Paperclip className="h-5 w-5" />} />
              {(rfq.attachments || []).length ? (
                <div className="grid gap-3">
                  {(rfq.attachments || []).map((document) => <div key={document.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><p className="font-black text-white">{document.name}</p><p className="mt-1 text-sm text-ds-text/48">{document.category} · metadata only</p></div>)}
                </div>
              ) : (
                <EmptyState title="No attachments" description="Attachment metadata will appear here when documents are linked." />
              )}
            </GlassCard>

            <GlassCard className="p-5">
              <SectionHeader title="Status" icon={<CheckCircle2 className="h-5 w-5" />} />
              <div className="grid gap-3">
                <Metric label="Current status" value={String(rfq.status)} compact />
                <Metric label="Visibility" value={rfq.visibility || "Invited Suppliers"} compact />
                <Metric label="Responses" value={String(rfq.responses?.length || 0)} compact />
              </div>
            </GlassCard>
          </div>
        </main>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <VoraRfqPanel rfq={rfq} />
          <GlassCard className="p-5">
            <SectionHeader title="Timeline" icon={<Clock3 className="h-5 w-5" />} />
            <div className="grid gap-4">
              {(rfq.rfqTimeline?.events || []).map((event, index) => <TimelineCard key={event.id} index={index + 1} title={event.title} text={`${event.date} · ${event.description || "RFQ event"}`} />)}
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <SectionHeader title="Activity" icon={<MessageSquare className="h-5 w-5" />} />
            <div className="grid gap-4">
              {(rfq.activity || []).map((event, index) => <TimelineCard key={event.id} index={index + 1} title={event.title} text={event.date} />)}
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function VoraRfqPanel({ rfq }: { rfq: NonNullable<ReturnType<typeof rfqRepository.getById>> }) {
  const insights = rfq.voraInsights;
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start gap-4">
        <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
        <div>
          <Badge tone="blue">VORA RFQ Intelligence</Badge>
          <h2 className="mt-3 text-xl font-black text-white">Scope and supplier review</h2>
        </div>
      </div>
      <p className="mt-5 text-sm leading-7 text-ds-text/62">{insights?.summary}</p>
      <div className="mt-5 grid gap-3">
        <Insight title="Missing information" text={(insights?.missingInformation || []).join(", ") || "No major gaps detected."} icon={<ShieldAlert className="h-4 w-4" />} />
        <Insight title="Suggested suppliers" text={(insights?.supplierSuggestions || []).join(", ") || "No supplier suggestions yet."} icon={<UsersRound className="h-4 w-4" />} />
        <Insight title="Project risks" text={(insights?.risks || []).join(", ") || "No major risks detected."} icon={<WandSparkles className="h-4 w-4" />} />
        <Insight title="Executive summary" text={insights?.executiveSummary || "VORA summary is ready for future AI generation."} icon={<BrainCircuit className="h-4 w-4" />} />
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

function Requirement({ text }: { text: string }) {
  return (<AutoLocalizedContent><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><p className="text-sm font-bold leading-7 text-ds-text/62">{text}</p></div></AutoLocalizedContent>);
}

function Insight({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (<AutoLocalizedContent><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><div className="flex items-center gap-2 text-gold">{icon}<p className="font-black text-white">{title}</p></div><p className="mt-2 text-sm leading-6 text-ds-text/58">{text}</p></div></AutoLocalizedContent>);
}
