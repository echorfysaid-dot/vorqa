"use client";

import { AlertTriangle, BookOpen, CheckCircle2, FileText, Lightbulb, LoaderCircle, Sparkles } from "lucide-react";
import { Alert, Badge, Button, Card } from "@/components/ui";

export function AiPrompt({ label, value, onChange, onSubmit, placeholder, submitLabel, disabled, actions }: { label: string; value: string; onChange: (value: string) => void; onSubmit: () => void; placeholder: string; submitLabel: string; disabled?: boolean; actions?: React.ReactNode }) {
  return <section className="rounded-ds-md border border-ds-token-border bg-ds-token-surface p-3" aria-label={label}>
    <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={label} disabled={disabled} className="min-h-24 w-full resize-y bg-transparent px-1 py-1 text-[15px] leading-6 text-ds-token-text outline-none placeholder:text-ds-token-muted-soft" />
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ds-token-border pt-3"><div className="flex items-center gap-2">{actions}</div><Button size="sm" disabled={disabled || !value.trim()} onClick={onSubmit} icon={<Sparkles className="h-4 w-4" />}>{submitLabel}</Button></div>
  </section>;
}

export function AiAnswer({ title, children, status, actions }: { title: string; children: React.ReactNode; status?: string; actions?: React.ReactNode }) {
  return <article className="ds-reading-width rounded-ds-md border border-ds-token-border bg-ds-token-surface p-5 sm:p-6"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-ds-token-border pb-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-ds-sm bg-ds-token-gold/10 text-ds-token-gold"><Sparkles className="h-4 w-4" /></span><div><h2 className="text-base font-semibold text-ds-token-text">{title}</h2>{status && <p className="mt-0.5 text-xs text-ds-token-muted">{status}</p>}</div></div>{actions}</header><div className="mt-5 text-[15px] leading-7 text-ds-token-text/86">{children}</div></article>;
}

export function AiEvidence({ title, source, children, confidence }: { title: string; source?: string; children: React.ReactNode; confidence?: number }) {
  return <section className="rounded-ds-md border border-ds-token-border bg-white/[0.025] p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><BookOpen className="h-4 w-4 shrink-0 text-ds-token-info" /><h3 className="truncate text-sm font-semibold text-ds-token-text">{title}</h3></div>{typeof confidence === "number" && <Badge tone="blue">{Math.round(confidence)}%</Badge>}</div>{source && <p className="mt-2 text-xs text-ds-token-muted">{source}</p>}<div className="mt-3 text-sm leading-6 text-ds-token-text/76">{children}</div></section>;
}

export function AiRecommendation({ title, children, priority, action }: { title: string; children: React.ReactNode; priority?: string; action?: React.ReactNode }) {
  return <Card className="p-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-ds-sm bg-ds-token-gold/10 text-ds-token-gold"><Lightbulb className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-ds-token-text">{title}</h3>{priority && <Badge tone="warning">{priority}</Badge>}</div><div className="mt-2 text-sm leading-6 text-ds-token-muted">{children}</div>{action && <div className="mt-3">{action}</div>}</div></div></Card>;
}

export function AiWarning({ title, children }: { title: string; children?: React.ReactNode }) {
  return <Alert title={title} tone="warning">{children}</Alert>;
}

export function AiSources({ title, sources }: { title: string; sources: Array<{ id: string; label: string; detail?: string }> }) {
  return <section><h3 className="mb-3 text-sm font-semibold text-ds-token-text">{title}</h3><ul className="grid gap-2">{sources.map((source) => <li key={source.id} className="flex items-start gap-3 rounded-ds-sm border border-ds-token-border bg-white/[0.02] p-3"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-ds-token-muted" /><span className="min-w-0"><span className="block truncate text-sm font-medium text-ds-token-text">{source.label}</span>{source.detail && <span className="mt-0.5 block text-xs text-ds-token-muted">{source.detail}</span>}</span></li>)}</ul></section>;
}

export function AiHistory({ title, items, emptyLabel, onSelect }: { title: string; items: Array<{ id: string; title: string; meta?: string }>; emptyLabel: string; onSelect?: (id: string) => void }) {
  return <section><h3 className="mb-3 text-sm font-semibold text-ds-token-text">{title}</h3>{items.length ? <ul className="divide-y divide-ds-token-border rounded-ds-md border border-ds-token-border">{items.map((item) => <li key={item.id}><button type="button" onClick={() => onSelect?.(item.id)} className="ds-focusable w-full px-4 py-3 text-start transition-colors hover:bg-white/[0.035]"><span className="block truncate text-sm font-medium text-ds-token-text">{item.title}</span>{item.meta && <span className="mt-1 block text-xs text-ds-token-muted">{item.meta}</span>}</button></li>)}</ul> : <p className="rounded-ds-md border border-dashed border-ds-token-border p-4 text-sm text-ds-token-muted">{emptyLabel}</p>}</section>;
}

export function AiLoading({ title, detail }: { title: string; detail?: string }) {
  return <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-ds-md border border-ds-token-border bg-white/[0.025] p-4"><LoaderCircle className="h-5 w-5 animate-spin text-ds-token-gold" /><span><span className="block text-sm font-semibold text-ds-token-text">{title}</span>{detail && <span className="mt-0.5 block text-xs text-ds-token-muted">{detail}</span>}</span></div>;
}

export function AiError({ title, detail, retryLabel, onRetry }: { title: string; detail?: string; retryLabel?: string; onRetry?: () => void }) {
  return <div role="alert" className="flex items-start gap-3 rounded-ds-md border border-ds-token-danger/24 bg-ds-token-danger/5 p-4"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-ds-token-danger" /><div><p className="text-sm font-semibold text-ds-token-text">{title}</p>{detail && <p className="mt-1 text-sm leading-6 text-ds-token-muted">{detail}</p>}{retryLabel && onRetry && <Button className="mt-3" size="sm" variant="secondary" onClick={onRetry} icon={<CheckCircle2 className="h-4 w-4" />}>{retryLabel}</Button>}</div></div>;
}
