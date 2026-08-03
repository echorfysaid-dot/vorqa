"use client";

import Link from "next/link";
import { ArrowLeft, Bot, CalendarClock } from "lucide-react";
import { Button, Card, ProgressBar, StatusChip } from "@/components/ui";

export type MissionControlRole = "project_owner" | "contractor" | "engineer" | "architect" | "supplier" | "worker" | "inspector" | "organization";
export type MissionPriority = "critical" | "high" | "medium" | "low";

export interface MissionBriefProps {
  greeting: string;
  workspace: string;
  missionTitle: string;
  missionSummary: string;
  role: MissionControlRole;
  workloadLabel: string;
  workload: string;
  urgencyLabel: string;
  urgency: string;
  criticalActionsLabel: string;
  criticalActions: number;
  currentFocusLabel: string;
  currentFocus: string;
  nextMilestoneLabel: string;
  nextMilestone: string;
  primaryAction?: { label: string; href: string };
  supplementary?: ReadonlyArray<{ label: string; value: string }>;
}

export interface MissionActionItem {
  id: string;
  type: string;
  priority: MissionPriority;
  project: string;
  title: string;
  description: string;
  dueDate?: string;
  dueDateLabel?: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}

export interface ProjectPulseItem {
  id: string;
  name: string;
  health: number;
  progress: number;
  budget: string;
  timeline: string;
  risk: string;
  milestone: string;
  href: string;
  operational?: ReadonlyArray<{ label: string; value: string }>;
}

const priorityWeight: Record<MissionPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const priorityTone: Record<MissionPriority, "danger" | "warning" | "blue" | "neutral"> = { critical: "danger", high: "warning", medium: "blue", low: "neutral" };

export function MissionBrief(props: MissionBriefProps) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="text-sm font-medium text-ds-token-gold">{props.greeting}</p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight text-ds-token-text sm:text-3xl">{props.missionTitle}</h1>
          <p className="mt-2 text-sm leading-6 text-ds-token-muted">{props.missionSummary}</p>
          <p className="mt-3 truncate text-xs text-ds-token-muted">{props.workspace}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 xl:min-w-[620px]">
          <MissionDatum label={props.workloadLabel} value={props.workload} />
          <MissionDatum label={props.urgencyLabel} value={props.urgency} emphasis />
          <MissionDatum label={props.criticalActionsLabel} value={String(props.criticalActions)} />
          <MissionDatum label={props.currentFocusLabel} value={props.currentFocus} />
        </dl>
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-ds-token-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 text-sm text-ds-token-muted"><CalendarClock className="h-4 w-4 shrink-0" /><span>{props.nextMilestoneLabel}:</span><span className="truncate font-medium text-ds-token-text">{props.nextMilestone}</span></div>
        {props.primaryAction && <Link href={props.primaryAction.href}><Button>{props.primaryAction.label}</Button></Link>}
      </div>
      {props.supplementary?.length ? <dl className="mt-4 grid gap-3 border-t border-ds-token-border pt-4 sm:grid-cols-2 lg:grid-cols-4">{props.supplementary.map((item) => <MissionDatum key={item.label} label={item.label} value={item.value} />)}</dl> : null}
    </Card>
  );
}

function MissionDatum({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div className="min-w-0"><dt className="text-xs text-ds-token-muted">{label}</dt><dd className={`mt-1 truncate text-sm font-semibold ${emphasis ? "text-ds-token-warning" : "text-ds-token-text"}`}>{value}</dd></div>;
}

export function ActionInbox({ title, description, items, emptyLabel }: { title: string; description: string; items: MissionActionItem[]; emptyLabel: string }) {
  const sorted = [...items].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority] || (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  return (
    <section aria-labelledby="mission-action-inbox">
      <SectionHeading id="mission-action-inbox" title={title} description={description} count={sorted.length} />
      <Card className="mt-4 overflow-hidden">
        {sorted.length ? <div className="divide-y divide-ds-token-border">{sorted.map((item) => <ActionCard key={item.id} item={item} />)}</div> : <p className="p-5 text-sm text-ds-token-muted">{emptyLabel}</p>}
      </Card>
    </section>
  );
}

export function ActionCard({ item }: { item: MissionActionItem }) {
  return (
    <article className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><StatusChip tone={priorityTone[item.priority]}>{item.type}</StatusChip><span className="text-xs text-ds-token-muted">{item.project}</span></div>
        <h3 className="mt-2 text-sm font-semibold text-ds-token-text">{item.title}</h3>
        <p className="mt-1 text-sm leading-6 text-ds-token-muted">{item.description}</p>
        {item.dueDate && <p className="mt-2 text-xs text-ds-token-muted">{item.dueDateLabel}: <time dateTime={item.dueDate} className="font-medium text-ds-token-text">{item.dueDate}</time></p>}
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {item.secondaryAction && <Link href={item.secondaryAction.href}><Button variant="ghost">{item.secondaryAction.label}</Button></Link>}
        <Link href={item.primaryAction.href}><Button>{item.primaryAction.label}</Button></Link>
      </div>
    </article>
  );
}

export function ProjectPulse({ title, description, projects, labels }: { title: string; description: string; projects: ProjectPulseItem[]; labels: { project: string; health: string; progress: string; budget: string; timeline: string; risk: string; milestone: string; open: string; empty: string } }) {
  return (
    <section aria-labelledby="mission-project-pulse">
      <SectionHeading id="mission-project-pulse" title={title} description={description} count={projects.length} />
      <Card className="mt-4 overflow-hidden">
        {projects.length ? <div className="overflow-x-auto"><div className="min-w-[980px]">
          <div className="grid grid-cols-[minmax(220px,1.4fr)_90px_180px_130px_130px_110px_170px_100px] gap-4 border-b border-ds-token-border px-5 py-3 text-xs font-medium text-ds-token-muted">
            <span>{labels.project}</span><span>{labels.health}</span><span>{labels.progress}</span><span>{labels.budget}</span><span>{labels.timeline}</span><span>{labels.risk}</span><span>{labels.milestone}</span><span />
          </div>
          {projects.map((project) => <div key={project.id} className="grid grid-cols-[minmax(220px,1.4fr)_90px_180px_130px_130px_110px_170px_100px] items-center gap-4 border-b border-ds-token-border px-5 py-4 last:border-b-0 hover:bg-white/[0.02]">
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-ds-token-text">{project.name}</p><p className="mt-1 text-xs text-ds-token-muted">{project.id}</p>{project.operational?.length ? <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{project.operational.map((metric) => <span key={metric.label} className="text-[11px] text-ds-token-muted">{metric.label}: <strong className="font-medium text-ds-token-text">{metric.value}</strong></span>)}</div> : null}</div>
            <span className={project.health >= 70 ? "text-sm font-semibold text-ds-token-success" : "text-sm font-semibold text-ds-token-warning"}>{project.health}%</span>
            <ProgressBar value={project.progress} />
            <span className="truncate text-sm text-ds-token-text">{project.budget}</span><span className="truncate text-sm text-ds-token-text">{project.timeline}</span><StatusChip tone={project.health < 55 ? "warning" : "neutral"}>{project.risk}</StatusChip><span className="truncate text-sm text-ds-token-muted">{project.milestone}</span>
            <Link href={project.href} className="ds-focusable inline-flex min-h-11 items-center justify-center gap-1 rounded-ds-sm border border-ds-token-border px-3 text-xs font-semibold text-ds-token-text hover:border-ds-token-gold/30">{labels.open}<ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /></Link>
          </div>)}
        </div></div> : <p className="p-5 text-sm text-ds-token-muted">{labels.empty}</p>}
      </Card>
    </section>
  );
}

export function VoraBrief({ title, summary, suggestedActionLabel, suggestedAction, buttonLabel, href, secondaryAction, metadata }: { title: string; summary: string; suggestedActionLabel: string; suggestedAction: string; buttonLabel: string; href: string; secondaryAction?: { label: string; href: string }; metadata?: Array<{ label: string; value: string }> }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-3xl"><div className="flex items-center gap-2 text-ds-token-gold"><Bot className="h-4 w-4" /><h2 className="text-sm font-semibold">{title}</h2></div><p className="mt-3 text-sm leading-6 text-ds-token-text">{summary}</p><p className="mt-3 text-sm text-ds-token-muted"><span>{suggestedActionLabel}: </span><span className="font-medium text-ds-token-text">{suggestedAction}</span></p></div>
        <div className="flex flex-wrap gap-2">{secondaryAction && <Link href={secondaryAction.href}><Button variant="ghost">{secondaryAction.label}</Button></Link>}<Link href={href}><Button variant="secondary">{buttonLabel}</Button></Link></div>
      </div>
      {metadata?.length ? <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-ds-token-border pt-4">{metadata.map((item) => <span key={item.label} className="text-xs text-ds-token-muted">{item.label}: <strong className="font-medium text-ds-token-text">{item.value}</strong></span>)}</div> : null}
    </Card>
  );
}

function SectionHeading({ id, title, description, count }: { id: string; title: string; description: string; count: number }) {
  return <div className="flex items-end justify-between gap-4"><div><h2 id={id} className="text-xl font-semibold text-ds-token-text">{title}</h2><p className="mt-1 text-sm text-ds-token-muted">{description}</p></div><span className="text-sm tabular-nums text-ds-token-muted">{count}</span></div>;
}
