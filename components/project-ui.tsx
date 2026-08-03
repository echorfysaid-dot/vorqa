"use client";

import { AlertTriangle, Building2, CalendarDays, FileText, Users } from "lucide-react";
import { Badge, Card, ProgressBar, type StatusTone } from "@/components/ui";

export function ProjectHeader({ name, organization, status, statusTone = "blue", meta, actions }: { name: string; organization?: string; status?: string; statusTone?: StatusTone; meta?: React.ReactNode; actions?: React.ReactNode }) {
  return <header className="flex flex-col gap-4 border-b border-ds-token-border pb-5 lg:flex-row lg:items-end lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2">{organization && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ds-token-muted"><Building2 className="h-3.5 w-3.5" />{organization}</span>}{status && <Badge tone={statusTone}>{status}</Badge>}</div><h1 className="mt-2 truncate text-2xl font-semibold text-ds-token-text sm:text-[28px]">{name}</h1>{meta && <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ds-token-muted">{meta}</div>}</div>{actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}</header>;
}

export function ProjectStatus({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) { return <Badge tone={tone}>{label}</Badge>; }

type RowProps = { title: string; subtitle?: string; status?: string; statusTone?: StatusTone; meta?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode };

function OperationalRow({ title, subtitle, status, statusTone = "neutral", meta, action, icon }: RowProps) {
  return <div className="flex min-h-16 items-center gap-3 border-b border-ds-token-border px-4 py-3 last:border-b-0 hover:bg-white/[0.025]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-ds-sm bg-white/[0.04] text-ds-token-muted">{icon}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-ds-token-text">{title}</p>{status && <Badge tone={statusTone}>{status}</Badge>}</div>{subtitle && <p className="mt-1 truncate text-xs text-ds-token-muted">{subtitle}</p>}</div>{meta && <div className="hidden shrink-0 text-xs text-ds-token-muted sm:block">{meta}</div>}{action && <div className="shrink-0">{action}</div>}</div>;
}

export function TaskRow(props: RowProps) { return <OperationalRow {...props} />; }
export function TimelineRow(props: RowProps) { return <OperationalRow {...props} icon={props.icon || <CalendarDays className="h-4 w-4" />} />; }
export function DocumentRow(props: RowProps) { return <OperationalRow {...props} icon={props.icon || <FileText className="h-4 w-4" />} />; }
export function TeamRow(props: RowProps) { return <OperationalRow {...props} icon={props.icon || <Users className="h-4 w-4" />} />; }
export function RiskRow(props: RowProps) { return <OperationalRow {...props} icon={props.icon || <AlertTriangle className="h-4 w-4" />} />; }
export function IssueRow(props: RowProps) { return <OperationalRow {...props} icon={props.icon || <AlertTriangle className="h-4 w-4" />} />; }
export function ContractRow(props: RowProps) { return <OperationalRow {...props} icon={props.icon || <FileText className="h-4 w-4" />} />; }
export function QuotationRow(props: RowProps) { return <OperationalRow {...props} icon={props.icon || <FileText className="h-4 w-4" />} />; }
export function RFQRow(props: RowProps) { return <OperationalRow {...props} icon={props.icon || <FileText className="h-4 w-4" />} />; }

export function BudgetRow({ title, value, detail, progress, tone = "gold" }: { title: string; value: React.ReactNode; detail?: string; progress?: number; tone?: StatusTone }) {
  return <Card className="p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-semibold text-ds-token-text">{title}</h3>{detail && <p className="mt-1 text-xs text-ds-token-muted">{detail}</p>}</div><div className="shrink-0 text-sm font-semibold tabular-nums text-ds-token-text">{value}</div></div>{typeof progress === "number" && <div className="mt-3"><ProgressBar value={progress} tone={tone} /></div>}</Card>;
}
