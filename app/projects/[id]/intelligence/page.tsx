"use client";

import { useI18n } from "@/components/i18n-provider";
import { LocalizedContent } from "@/components/localized-content";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, BarChart3, CalendarDays, CheckCircle2, ClipboardList, Clock3, FileText, Gauge, ShieldAlert, Sparkles } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, PageHeader, ProgressBar, SkeletonCard } from "@/components/ui";
import { useProjectRepository } from "@/lib/repositories/projectHooks";
import { createProjectIntelligenceSession, type ProjectIntelligenceAnalysis, type ProjectIntelligenceTimelineEvent } from "@/lib/project-intelligence";
import { createAnalysisWorkflow, type AnalysisWorkflowStage } from "@/lib/analysis-workflow";
import { ProjectAnalysisDashboard } from "@/components/project-analysis-dashboard";

export default function ProjectIntelligencePage({ params }: { params: { id: string } }) {
  const { locale } = useI18n();
  const projectId = decodeURIComponent(params.id);
  const { data: project, loading, error, isFallback } = useProjectRepository(projectId);

  if (loading) {
    return (<LocalizedContent locale={locale}>(
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )</LocalizedContent>);
  }

  if (!project) {
    return (<LocalizedContent locale={locale}>(
      <GlassCard className="p-6">
        <p className="text-2xl font-black text-white">Project Intelligence unavailable</p>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-ds-text/58">
          This project is not available for the current data source or authenticated account.
        </p>
        {error && isFallback && <p className="mt-3 text-sm font-bold text-ds-text/48">Demo fallback is active because production project data is unavailable.</p>}
        <Link href="/projects" className="mt-5 inline-flex">
          <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>Back to projects</Button>
        </Link>
      </GlassCard>
    )</LocalizedContent>);
  }

  const session = createProjectIntelligenceSession({
    projectId: project.id,
    projectTitle: project.title,
    projectStatus: project.status,
    organizationName: project.organizationName,
    updatedAt: project.updatedAt
  });
  const workflow = createAnalysisWorkflow(session);

  return (<LocalizedContent locale={locale}>(
    <div className="space-y-6">
      <PageHeader
        eyebrow="Project Intelligence Session"
        title={`${project.title} Intelligence`}
        description="A single project-level session that groups Contract Review, BOQ Review, Risk Assessment, Planning Review, Site Report Review, and Executive Summary."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/projects/${encodeURIComponent(project.id)}`}>
              <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>Project workspace</Button>
            </Link>
            <Link href="/tools/construction-intelligence">
              <Button icon={<Sparkles className="h-4 w-4" />}>Open tools</Button>
            </Link>
          </div>
        }
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Health" value={session.overallHealth} icon={<Gauge className="h-5 w-5" />} />
        <Metric label="Completed analyses" value={`${session.analysisCount}/${session.availableFeatures.length}`} icon={<CheckCircle2 className="h-5 w-5" />} />
        <Metric label="Detected risks" value={String(session.detectedRisks)} icon={<ShieldAlert className="h-5 w-5" />} />
        <Metric label="Workflow progress" value={`${workflow.completionPercentage}%`} icon={<BarChart3 className="h-5 w-5" />} />
      </section>

      <ProjectAnalysisDashboard projectId={project.id} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone="blue">Guided Workflow</Badge>
                <h2 className="mt-3 text-2xl font-black text-white">Analysis progress</h2>
                <p className="mt-2 text-sm leading-7 text-ds-text/58">
                  {workflow.completedImplementedStageCount} of {workflow.implementedStageCount} implemented analyses are complete. Coming-soon stages remain visible but disabled.
                </p>
              </div>
              <Badge tone={workflow.completionPercentage >= 100 ? "success" : "gold"}>{workflow.nextAction.label}</Badge>
            </div>
            <ProgressBar value={workflow.completionPercentage} label="Completion percentage" tone="blue" />
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <Info label="Current stage" value={workflow.currentStage?.title || "Complete"} />
              <Info label="Remaining analyses" value={String(workflow.remainingStages.filter((stage) => stage.isImplemented).length)} />
              <Info label="Project health" value={workflow.overallHealth} />
            </div>
            <div className="mt-5">
              {workflow.nextAction.route ? (
                <Link href={workflow.nextAction.route} className="inline-flex">
                  <Button icon={<Sparkles className="h-4 w-4" />}>{workflow.nextAction.label}</Button>
                </Link>
              ) : (
                <Button disabled icon={<Sparkles className="h-4 w-4" />}>{workflow.nextAction.label}</Button>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5">
              <Badge tone="gold">Workflow Timeline</Badge>
              <h2 className="mt-3 text-2xl font-black text-white">Guided analysis stages</h2>
            </div>
            <div className="grid gap-3">
              {workflow.stages.map((stage, index) => <WorkflowStageRow key={stage.id} stage={stage} index={index} />)}
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone="gold">Session Summary</Badge>
                <h2 className="mt-3 text-2xl font-black text-white">{session.id}</h2>
                <p className="mt-2 text-sm leading-7 text-ds-text/58">
                  Project: {session.project.title} · Status: {session.project.status || "Unavailable"} · Updated: {session.updatedAt}
                </p>
              </div>
              <Badge tone={session.currentStatus === "ready" ? "success" : "warning"}>{session.currentStatus.replace(/_/g, " ")}</Badge>
            </div>
            <ProgressBar value={session.overallConfidence} label="Overall confidence" tone={session.overallHealth === "High Risk" ? "danger" : session.overallHealth === "Attention Required" ? "warning" : "gold"} />
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Info label="Organization" value={session.project.organizationName || "Unavailable"} />
              <Info label="High priority risks" value={String(session.highPriorityRisks)} />
              <Info label="Available features" value={String(session.availableFeatures.length)} />
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone="blue">Analyses</Badge>
                <h2 className="mt-3 text-2xl font-black text-white">Session analyses</h2>
              </div>
              <Badge tone="neutral">No new database schema</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {session.analyses.map((analysis) => <AnalysisCard key={analysis.type} analysis={analysis} projectId={project.id} />)}
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5">
              <Badge tone="gold">Timeline</Badge>
              <h2 className="mt-3 text-2xl font-black text-white">Project intelligence timeline</h2>
            </div>
            <div className="space-y-4">
              {session.recentActivity.map((event, index) => <TimelineEvent key={event.id} event={event} isLast={index === session.recentActivity.length - 1} />)}
            </div>
          </GlassCard>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <GlassCard className="p-5">
            <Badge tone="blue">Quick Actions</Badge>
            <div className="mt-4 grid gap-3">
              {workflow.nextAction.route && <QuickAction href={workflow.nextAction.route} title={workflow.nextAction.label} icon={<Sparkles className="h-4 w-4" />} />}
              <QuickAction href="/tools/contract-review" title="Run Contract Review" icon={<FileText className="h-4 w-4" />} />
              <QuickAction href="/tools/boq-review" title="Run BOQ Review" icon={<BarChart3 className="h-4 w-4" />} />
              <QuickAction href="/tools/risk-assessment" title="Run Risk Assessment" icon={<ShieldAlert className="h-4 w-4" />} />
              <QuickAction href="/tools/planning-review" title="Run Planning Review" icon={<CalendarDays className="h-4 w-4" />} />
              <QuickAction href="/tools/site-report-review" title="Run Site Report Review" icon={<ClipboardList className="h-4 w-4" />} />
              <QuickAction href="/tools/executive-summary" title="Generate Executive Summary" icon={<FileText className="h-4 w-4" />} />
              <QuickAction href="/history" title="Open history" icon={<Clock3 className="h-4 w-4" />} />
            </div>
          </GlassCard>

          {session.analysisCount ? (
            <GlassCard className="p-5">
              <Badge tone="gold">Recent Activity</Badge>
              <div className="mt-4 grid gap-3">
                {session.recentActivity.filter((event) => event.status === "completed").slice(0, 3).map((event) => (
                  <div key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                    <p className="font-black text-white">{event.title}</p>
                    <p className="mt-1 text-xs leading-5 text-ds-text/48">{event.description}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : (
            <EmptyState title="No completed analyses" description="Run Contract Review, BOQ Review, or Risk Assessment to build this project intelligence session." />
          )}
        </aside>
      </section>
    </div>
  )</LocalizedContent>);
}

function WorkflowStageRow({ stage, index }: { stage: AnalysisWorkflowStage; index: number }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 lg:grid-cols-[48px_minmax(0,1fr)_160px] lg:items-center">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl font-black ${stage.isCompleted ? "bg-ds-token-success/12 text-ds-token-success" : stage.isCurrent ? "bg-ds-token-gold/12 text-gold" : "bg-white/[0.055] text-ds-text/42"}`}>
        {stage.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-black text-white">{stage.title}</h3>
          <Badge tone={stage.isCompleted ? "success" : stage.isCurrent ? "gold" : stage.isImplemented ? "blue" : "neutral"}>{stage.status.replace(/_/g, " ")}</Badge>
        </div>
        <p className="mt-2 text-sm leading-6 text-ds-text/56">{stage.description}</p>
        <p className="mt-1 text-xs font-bold text-ds-text/38">Output: {stage.estimatedOutput}</p>
      </div>
      <div className="flex lg:justify-end">
        {stage.route && !stage.isLocked ? (
          <Link href={stage.route} className="inline-flex rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-black text-white transition hover:border-[#D4AF37]/28">
            {stage.isCompleted ? "Open" : "Continue"}
          </Link>
        ) : (
          <button type="button" disabled className="inline-flex cursor-not-allowed rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-black text-ds-text/34">
            {stage.isImplemented ? "Locked" : "Coming Soon"}
          </button>
        )}
      </div>
    </div>
  )</LocalizedContent>);
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <GlassCard className="p-5">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#D4AF37]/12 text-gold">{icon}</span>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-ds-text/42">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </GlassCard>
  )</LocalizedContent>);
}

function Info({ label, value }: { label: string; value: string }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <p className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  )</LocalizedContent>);
}

function AnalysisCard({ analysis, projectId }: { analysis: ProjectIntelligenceAnalysis; projectId: string }) {
  const { locale } = useI18n();
  const active = analysis.status === "completed" || analysis.status === "pending";
  const href = analysis.href || `/projects/${encodeURIComponent(projectId)}/intelligence`;
  return (<LocalizedContent locale={locale}>(
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#51D8FF]/12 text-[#7DD3FC]">
          {analysis.type === "risk_assessment" ? <ShieldAlert className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </span>
        <Badge tone={analysis.status === "completed" ? "success" : analysis.status === "pending" ? "gold" : "neutral"}>{analysis.status.replace(/_/g, " ")}</Badge>
      </div>
      <h3 className="mt-4 font-black text-white">{analysis.title}</h3>
      <p className="mt-2 min-h-12 text-xs leading-5 text-ds-text/48">{analysis.summary || "This analysis will attach to the session when available."}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Info label="Risks" value={String(analysis.riskCount || 0)} />
        <Info label="Confidence" value={analysis.confidence ? `${analysis.confidence}%` : "N/A"} />
      </div>
      {active ? (
        <Link href={href} className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-black text-white transition hover:border-[#D4AF37]/28">
          {analysis.status === "completed" ? "Open source tool" : "Run analysis"}
        </Link>
      ) : (
        <button type="button" disabled className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-black text-ds-text/34">
          Future analysis
        </button>
      )}
    </GlassCard>
  )</LocalizedContent>);
}

function TimelineEvent({ event, isLast }: { event: ProjectIntelligenceTimelineEvent; isLast: boolean }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ${event.status === "completed" ? "bg-ds-token-success/12 text-ds-token-success" : "bg-white/[0.055] text-ds-text/42"}`}>
          {event.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
        </span>
        {!isLast && <span className="mt-2 h-full w-px bg-gradient-to-b from-[#D4AF37]/45 to-transparent" />}
      </div>
      <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-black text-white">{event.title}</h3>
          <Badge tone={event.status === "completed" ? "success" : event.status === "pending" ? "gold" : "neutral"}>{event.status.replace(/_/g, " ")}</Badge>
        </div>
        <p className="mt-2 text-sm leading-6 text-ds-text/56">{event.description}</p>
      </div>
    </div>
  )</LocalizedContent>);
}

function QuickAction({ href, title, icon }: { href: string; title: string; icon: ReactNode }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 font-black text-white transition hover:-translate-y-0.5 hover:border-[#D4AF37]/28">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#D4AF37]/12 text-gold">{icon}</span>
      {title}
    </Link>
  )</LocalizedContent>);
}
