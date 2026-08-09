"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, Download, FileClock, Gauge, History, RotateCcw, Search, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { Badge, Button, Card, EmptyState, Input, ProgressBar, TimelineCard } from "@/components/ui";
import { getProjectAnalysisState } from "@/lib/project-analysis-engine";
import { createProjectAnalysisUiModel, filterAnalysisHistory, type AnalysisHistorySort } from "@/lib/project-analysis-view-model";
import { getProjectAnalysisRegistryEntry } from "@/lib/project-analysis-registry";
import { createAnalysisExportModel, createProjectIntelligenceExportModel } from "@/lib/project-report-export";
import { listProjectAnalysesAsync } from "@/lib/project-analysis-storage";
import type { ProjectAnalysisProjectState, ProjectAnalysisRecord, ProjectAnalysisToolType } from "@/types/project-analysis";
import { defaultReportExportOptions, type ReportExportFormat, type ReportExportOptions } from "@/types/report-export";

export function ProjectAnalysisDashboard({ projectId }: { projectId: string }) {
  const { locale, translate } = useI18n();
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [toolType, setToolType] = useState<ProjectAnalysisToolType | "all">("all");
  const [sort, setSort] = useState<AnalysisHistorySort>("newest");
  const [exportTarget, setExportTarget] = useState<ProjectAnalysisRecord | "project" | null>(null);
  const [revision, setRevision] = useState(0);
  const ownerId = session?.user.id;
  useEffect(() => {
    let active = true;
    listProjectAnalysesAsync(projectId, ownerId, session?.access_token).finally(() => {
      if (active) setRevision((value) => value + 1);
    });
    return () => { active = false; };
  }, [ownerId, projectId, session?.access_token]);
  const state = useMemo(() => {
    void revision;
    return getProjectAnalysisState(projectId, ownerId);
  }, [ownerId, projectId, revision]);
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
        <div className="flex flex-wrap gap-2">
          {model.latestAnalysis ? <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={() => setExportTarget(model.latestAnalysis)}>{translate("Export latest")}</Button> : null}
          {state.latestAnalyses.length ? <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={() => setExportTarget("project")}>{translate("Export project summary")}</Button> : null}
          {nextActionHref ? <Link href={nextActionHref}><Button icon={model.unfinished ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}>{translate(model.unfinished ? "Continue Analysis" : "Next recommended action")}</Button></Link> : null}
        </div>
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
            {history.map((record) => <HistoryRow key={record.id} record={record} date={formatDate(record.updatedAt)} onExport={() => setExportTarget(record)} />)}
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
      {exportTarget ? <ReportExportDialog target={exportTarget} state={state} token={session?.access_token} generatedBy={session?.user.email} initialLanguage={locale === "ar" || locale === "fr" ? locale : "en"} onClose={() => setExportTarget(null)} /> : null}
    </section>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  const { translate } = useI18n();
  return <Card className="p-4"><span className="grid h-9 w-9 place-items-center rounded-ds-sm bg-ds-token-gold/10 text-ds-token-gold">{icon}</span><p className="mt-3 text-xs text-ds-token-muted">{translate(label)}</p><p className="mt-1 truncate text-sm font-semibold text-ds-token-text">{value}</p></Card>;
}

function HistoryRow({ record, date, onExport }: { record: ProjectAnalysisRecord; date: string; onExport: () => void }) {
  const { translate } = useI18n();
  const definition = getProjectAnalysisRegistryEntry(record.toolType);
  const href = definition ? `${definition.route}?projectId=${encodeURIComponent(record.projectId)}&sessionId=${encodeURIComponent(record.sessionId)}&analysisId=${encodeURIComponent(record.id)}${record.status === "pending" ? "&resume=1" : ""}` : "";
  return <article className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-medium text-ds-token-text">{translate(definition?.title || record.toolType)}</h4><Badge tone={record.status === "completed" ? "success" : record.status === "pending" ? "gold" : "danger"}>{translate("Version")} {record.version}</Badge><Badge tone="neutral">{translate(record.status)}</Badge></div><p className="mt-2 text-xs text-ds-token-muted">{date} - {translate("Confidence")}: {typeof record.confidence === "number" ? `${record.confidence}%` : translate("Unavailable")}</p><details className="mt-2"><summary className="ds-focusable cursor-pointer text-xs font-medium text-ds-token-muted hover:text-ds-token-text">{translate("Analysis result")}</summary><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-ds-sm bg-black/20 p-3 text-xs text-ds-token-muted">{typeof record.analysisResult === "string" ? record.analysisResult : JSON.stringify(record.analysisResult, null, 2)}</pre></details><details className="mt-2"><summary className="ds-focusable cursor-pointer text-xs font-medium text-ds-token-muted hover:text-ds-token-text">{translate("Metadata")}</summary><pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-ds-sm bg-black/20 p-3 text-xs text-ds-token-muted">{JSON.stringify(record.metadata, null, 2)}</pre></details></div><div className="flex flex-wrap gap-2">{record.status === "completed" ? <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={onExport}>{translate("Export")}</Button> : null}{href ? <Link href={href}><Button variant="secondary">{translate(record.status === "pending" ? "Continue Analysis" : "Open analysis")}</Button></Link> : null}</div></article>;
}

function ReportExportDialog({ target, state, token, generatedBy, initialLanguage, onClose }: { target: ProjectAnalysisRecord | "project"; state: ProjectAnalysisProjectState; token?: string; generatedBy?: string; initialLanguage: "ar" | "fr" | "en"; onClose: () => void }) {
  const { translate } = useI18n();
  const [format, setFormat] = useState<ReportExportFormat>("pdf");
  const [options, setOptions] = useState<ReportExportOptions>({ ...defaultReportExportOptions, language: initialLanguage });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const model = target === "project" ? createProjectIntelligenceExportModel(state, { generatedBy }) : createAnalysisExportModel(target, { generatedBy });
  const optionRows: Array<[keyof Omit<ReportExportOptions, "language">, string]> = [["includeLogo", "Include Vorqa logo"], ["includeProjectMetadata", "Include project metadata"], ["includeTimeline", "Include timeline"], ["includeReadiness", "Include readiness dashboard"], ["includeRecommendations", "Include recommendations"], ["includeEvidenceReferences", "Include evidence references"]];

  const download = async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ mode: "report_export", format, report: model.report, options, context: model.context, ...model.metadata }) });
      const payload = await response.json() as { file?: { filename: string; mimeType: string; base64: string }; exportStatus?: { error?: string } };
      if (!response.ok || !payload.file) throw new Error(payload.exportStatus?.error || translate("Export failed"));
      const binary = atob(payload.file.base64);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: payload.file.mimeType }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = payload.file.filename; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      onClose();
    } catch (caught) { setError(caught instanceof Error ? caught.message : translate("Export failed")); }
    finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="report-export-title"><Card className="w-full max-w-2xl p-5"><div className="flex items-start justify-between gap-4"><div><h3 id="report-export-title" className="text-lg font-semibold text-ds-token-text">{translate("Export professional report")}</h3><p className="mt-1 text-sm text-ds-token-muted">{translate(target === "project" ? "Complete Project Intelligence Summary" : "Specific analysis version")}</p></div><button type="button" className="ds-focusable rounded-ds-sm p-2 text-ds-token-muted hover:text-ds-token-text" onClick={onClose} aria-label={translate("Close")}><X className="h-5 w-5" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm text-ds-token-muted"><span>{translate("Format")}</span><select className="h-11 rounded-ds-sm border border-ds-token-border bg-black/20 px-3 text-ds-token-text" value={format} onChange={(event) => setFormat(event.target.value as ReportExportFormat)}><option value="pdf">PDF</option><option value="docx">DOCX</option><option value="html">{translate("Print-ready HTML")}</option></select></label><label className="grid gap-2 text-sm text-ds-token-muted"><span>{translate("Language")}</span><select className="h-11 rounded-ds-sm border border-ds-token-border bg-black/20 px-3 text-ds-token-text" value={options.language} onChange={(event) => setOptions((current) => ({ ...current, language: event.target.value as "ar" | "fr" | "en" }))}><option value="ar">العربية</option><option value="fr">Français</option><option value="en">English</option></select></label></div><fieldset className="mt-5 grid gap-3 sm:grid-cols-2"><legend className="mb-3 text-sm font-medium text-ds-token-text">{translate("Report options")}</legend>{optionRows.map(([key, label]) => <label key={key} className="flex min-h-11 items-center gap-3 rounded-ds-sm border border-ds-token-border px-3 text-sm text-ds-token-muted"><input type="checkbox" checked={options[key]} onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.checked }))} /><span>{translate(label)}</span></label>)}</fieldset>{error ? <p className="mt-4 text-sm text-red-300" role="alert">{error}</p> : null}<div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>{translate("Cancel")}</Button><Button icon={<Download className="h-4 w-4" />} loading={busy} onClick={download}>{translate("Download report")}</Button></div></Card></div>;
}
