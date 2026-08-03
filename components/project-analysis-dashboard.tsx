"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, FileClock, Gauge, History, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { Badge, Button, Card, EmptyState, Input, ProgressBar, TimelineCard } from "@/components/ui";
import { getProjectAnalysisState } from "@/lib/project-analysis-engine";
import { createProjectAnalysisUiModel, filterAnalysisHistory, type AnalysisHistorySort } from "@/lib/project-analysis-view-model";
import { getProjectAnalysisRegistryEntry } from "@/lib/project-analysis-registry";
import { listProjectAnalysesAsync } from "@/lib/project-analysis-storage";
import type { ProjectAnalysisRecord, ProjectAnalysisToolType } from "@/types/project-analysis";

export function ProjectAnalysisDashboard({ projectId }: { projectId: string }) {
  const { locale, translate } = useI18n();
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [toolType, setToolType] = useState<ProjectAnalysisToolType | "all">("all");
  const [sort, setSort] = useState<AnalysisHistorySort>("newest");
  const [revision, setRevision] = useState(0);
  const ownerId = session?.user.id;
  useEffect(() => {
    let active = true;
    listProjectAnalysesAsync(projectId, ownerId, session?.access_token).finally(() => {
      if (active) setRevision((value) => value + 1);
    });
    return () => { active = false; };
  }, [ownerId, projectId, session?.access_token]);
  const state = useMemo(() => getProjectAnalysisState(projectId, ownerId), [ownerId, projectId, revision]);
  const model = useMemo(() => createProjectAnalysisUiModel(state), [state]);
  const history = useMemo(() => filterAnalysisHistory(state.history, { query, toolType, sort }), [state.history, query, toolType, sort]);
  const formatDate = (value: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const nextActionHref = model.nextAction && model.unfinished
    ? `${model.nextAction.route}?projectId=${encodeURIComponent(projectId)}&sessionId=${encodeURIComponent(model.unfinished.sessionId)}&analysisId=${encodeURIComponent(model.unfinished.id)}&resume=1`
    : model.nextAction?.route;

  return (
    <section aria-labelledby="project-analysis-engine" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge tone="gold">{translate("Analysis Persistence")}</Badge>
          <h2 id="project-analysis-engine" className="mt-3 text-xl font-semibold text-ds-token-text">{translate("Project Analysis")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ds-token-muted">{translate("Saved analyses, version history, workflow readiness, and resumable work for this project.")}</p>
        </div>
        {nextActionHref ? <Link href={nextActionHref}><Button icon={model.unfinished ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}>{translate(model.unfinished ? "Continue Analysis" : "Next recommended action")}</Button></Link> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Latest Analysis" value={model.latestAnalysis ? getProjectAnalysisRegistryEntry(model.latestAnalysis.toolType)?.title || model.latestAnalysis.toolType : translate("Unavailable")} icon={<FileClock className="h-4 w-4" />} />
        <SummaryCard label="Current Stage" value={model.currentStage?.title || translate("Complete")} icon={<Clock3 className="h-4 w-4" />} />
        <SummaryCard label="Completion" value={`${state.completion}%`} icon={<CheckCircle2 className="h-4 w-4" />} />
        <SummaryCard label="Health" value={translate(state.health)} icon={<Gauge className="h-4 w-4" />} />
        <SummaryCard label="Confidence" value={typeof state.confidence === "number" ? `${state.confidence}%` : translate("Unavailable")} icon={<ShieldCheck className="h-4 w-4" />} />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="font-semibold text-ds-token-text">{translate("Readiness Dashboard")}</h3><p className="mt-1 text-sm text-ds-token-muted">{translate("Scores use completed persisted analyses only.")}</p></div>
          <Badge tone={state.readiness.available ? "gold" : "neutral"}>{translate("Overall readiness")}: {typeof state.readiness.overall === "number" ? `${state.readiness.overall}%` : translate("Unavailable")}</Badge>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {state.readiness.metrics.map((metric) => <div key={metric.category} className="rounded-ds-md border border-ds-token-border bg-black/15 p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium capitalize text-ds-token-text">{translate(metric.category)}</p><span className="text-sm font-semibold text-ds-token-text">{typeof metric.score === "number" ? `${metric.score}%` : translate("Unavailable")}</span></div><ProgressBar value={metric.score || 0} /><p className="mt-2 text-xs text-ds-token-muted">{metric.evidence.length ? metric.evidence.map((type) => translate(getProjectAnalysisRegistryEntry(type)?.title || type)).join(", ") : translate("No evidence available")}</p></div>)}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-ds-token-text">{translate("Analysis History")}</h3><p className="mt-1 text-sm text-ds-token-muted">{translate("Open previous analyses and inspect every saved version.")}</p></div><Badge tone="neutral">{model.versionCount} {translate("versions")}</Badge></div>
          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_170px]">
            <Input aria-label={translate("Search analyses")} placeholder={translate("Search analyses")} value={query} onChange={(event) => setQuery(event.target.value)} icon={<Search className="h-4 w-4" />} />
            <label className="grid gap-2 text-xs text-ds-token-muted"><span>{translate("Tool type")}</span><select className="h-11 rounded-ds-sm border border-ds-token-border bg-black/20 px-3 text-sm text-ds-token-text" value={toolType} onChange={(event) => setToolType(event.target.value as ProjectAnalysisToolType | "all")}><option value="all">{translate("All tools")}</option>{model.toolOptions.map((option) => <option key={option.value} value={option.value}>{translate(option.label)}</option>)}</select></label>
            <label className="grid gap-2 text-xs text-ds-token-muted"><span>{translate("Sort")}</span><select className="h-11 rounded-ds-sm border border-ds-token-border bg-black/20 px-3 text-sm text-ds-token-text" value={sort} onChange={(event) => setSort(event.target.value as AnalysisHistorySort)}><option value="newest">{translate("Newest first")}</option><option value="oldest">{translate("Oldest first")}</option></select></label>
          </div>
          <div className="mt-5 divide-y divide-ds-token-border">
            {history.map((record) => <HistoryRow key={record.id} record={record} date={formatDate(record.updatedAt)} />)}
            {!history.length ? <EmptyState title={translate("No analysis history")} description={translate("Completed and unfinished analyses will appear here after they are persisted.")} /> : null}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3"><History className="h-5 w-5 text-ds-token-gold" /><div><h3 className="font-semibold text-ds-token-text">{translate("Version Timeline")}</h3><p className="mt-1 text-sm text-ds-token-muted">{translate("Every saved version remains available.")}</p></div></div>
          <div className="mt-5 space-y-4">
            {state.timeline.map((event, index) => <TimelineCard key={event.id} index={index + 1} title={`${translate(getProjectAnalysisRegistryEntry(event.toolType)?.title || event.toolType)} - ${translate("Version")} ${event.version}`} text={`${translate(event.status)} - ${formatDate(event.occurredAt)}`} icon={<CalendarClock className="h-4 w-4" />} />)}
            {!state.timeline.length ? <p className="text-sm text-ds-token-muted">{translate("No saved versions yet")}</p> : null}
          </div>
        </Card>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  const { translate } = useI18n();
  return <Card className="p-4"><span className="grid h-9 w-9 place-items-center rounded-ds-sm bg-ds-token-gold/10 text-ds-token-gold">{icon}</span><p className="mt-3 text-xs text-ds-token-muted">{translate(label)}</p><p className="mt-1 truncate text-sm font-semibold text-ds-token-text">{value}</p></Card>;
}

function HistoryRow({ record, date }: { record: ProjectAnalysisRecord; date: string }) {
  const { translate } = useI18n();
  const definition = getProjectAnalysisRegistryEntry(record.toolType);
  const href = definition ? `${definition.route}?projectId=${encodeURIComponent(record.projectId)}&sessionId=${encodeURIComponent(record.sessionId)}&analysisId=${encodeURIComponent(record.id)}${record.status === "pending" ? "&resume=1" : ""}` : "";
  return <article className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-medium text-ds-token-text">{translate(definition?.title || record.toolType)}</h4><Badge tone={record.status === "completed" ? "success" : record.status === "pending" ? "gold" : "danger"}>{translate("Version")} {record.version}</Badge><Badge tone="neutral">{translate(record.status)}</Badge></div><p className="mt-2 text-xs text-ds-token-muted">{date} - {translate("Confidence")}: {typeof record.confidence === "number" ? `${record.confidence}%` : translate("Unavailable")}</p><details className="mt-2"><summary className="ds-focusable cursor-pointer text-xs font-medium text-ds-token-muted hover:text-ds-token-text">{translate("Analysis result")}</summary><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-ds-sm bg-black/20 p-3 text-xs text-ds-token-muted">{typeof record.analysisResult === "string" ? record.analysisResult : JSON.stringify(record.analysisResult, null, 2)}</pre></details><details className="mt-2"><summary className="ds-focusable cursor-pointer text-xs font-medium text-ds-token-muted hover:text-ds-token-text">{translate("Metadata")}</summary><pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-ds-sm bg-black/20 p-3 text-xs text-ds-token-muted">{JSON.stringify(record.metadata, null, 2)}</pre></details></div>{href ? <Link href={href}><Button variant="secondary">{translate(record.status === "pending" ? "Continue Analysis" : "Open analysis")}</Button></Link> : null}</article>;
}
