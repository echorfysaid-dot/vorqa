"use client";

import { useI18n } from "@/components/i18n-provider";
import { LocalizedContent } from "@/components/localized-content";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, FileText, Gauge, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Alert, Badge, Button, EmptyState, GlassCard, PageHeader, ProgressBar, Textarea } from "@/components/ui";
import { authFetch } from "@/lib/auth-client";
import { analysisPhaseLabel, getAnalysisErrorMessage, printCurrentReport, type AnalysisPhase } from "@/lib/analysis-client";
import { createProjectIntelligenceSession, type ProjectHealthStatus } from "@/lib/project-intelligence";
import { useSearchParams } from "next/navigation";
import { useProjectRepository } from "@/lib/repositories/projectHooks";

type Analysis = Readonly<{
  type: string;
  title: string;
  status: "completed" | "pending" | "not_started";
  summary?: string;
  confidence?: number;
  riskCount?: number;
  highPriorityRiskCount?: number;
}>;

type ExecutiveSummaryResult = Readonly<{
  executiveOverview?: string;
  projectHealth?: ProjectHealthStatus;
  completedAnalyses?: readonly Analysis[];
  outstandingAnalyses?: readonly Analysis[];
  topFindings?: readonly string[];
  topRisks?: readonly string[];
  planningStatus?: string;
  siteStatus?: string;
  documentationStatus?: string;
  priorityActions?: readonly string[];
  recommendedNextSteps?: readonly string[];
  overallConfidence?: number;
  warnings?: readonly Readonly<{ code: string; message: string; severity: string }>[];
  analysisCoverage?: Readonly<{
    completedAnalyses: number;
    expectedAnalyses: number;
    missingAnalyses: readonly string[];
    availableAnalyses: readonly string[];
    coveragePercentage: number;
    label: string;
  }>;
}>;

type ExecutiveApiResponse = Readonly<{
  status?: "success" | "failed";
  summary?: string;
  provider?: string;
  model?: string;
  usedMock?: boolean;
  warnings?: readonly Readonly<{ code: string; message: string; severity: string }>[];
  errors?: readonly Readonly<{ code: string; message: string }>[];
  executiveSummary?: ExecutiveSummaryResult;
}>;

const projects = [
  {
    id: "PRJ-1048",
    title: "Luxury Villa Casablanca",
    status: "Execution",
    organizationName: "Atlas Construction Group"
  },
  {
    id: "PRJ-DEMO-PARTIAL",
    title: "Partial Evidence Demo",
    status: "Planning",
    organizationName: "Atlas Construction Group"
  }
];

function list(items: readonly string[] | undefined, fallback: string) {
  return items?.length ? items : [fallback];
}

export default function ExecutiveSummaryPage() {
  const { locale } = useI18n();
  const searchParams = useSearchParams();
  const requestedProjectId = searchParams.get("projectId") || "PRJ-1048";
  const sessionId = searchParams.get("sessionId") || undefined;
  const [projectId, setProjectId] = useState(requestedProjectId);
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<AnalysisPhase>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExecutiveApiResponse | null>(null);

  const persistedProject = useProjectRepository(projectId).data;
  const selectedProject = persistedProject || projects.find((project) => project.id === projectId) || projects[0];

  useEffect(() => {
    setProjectId(requestedProjectId);
  }, [requestedProjectId]);
  const session = useMemo(() => createProjectIntelligenceSession({
    projectId: selectedProject.id,
    projectTitle: selectedProject.title,
    projectStatus: selectedProject.status,
    organizationName: selectedProject.organizationName,
    now: new Date("2026-07-24T00:00:00.000Z")
  }), [selectedProject]);

  async function submitSummary() {
    setState("validating");
    setError("");
    setResult(null);

    try {
      setState("running");
      const response = await authFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          mode: "vora_intelligence",
          taskIntent: "executive_summary",
          provider: "mock",
          projectId: selectedProject.id,
          sessionId,
          userRequest: notes || "Create an executive summary from available Construction Intelligence analyses.",
          executiveSummaryRequest: {
            projectId: selectedProject.id,
            projectTitle: selectedProject.title,
            projectStatus: selectedProject.status,
            organizationName: selectedProject.organizationName
          }
        })
      });
      const payload = (await response.json().catch(() => null)) as ExecutiveApiResponse | null;
      if (!response.ok || payload?.status === "failed") {
        setState("error");
        setResult(payload);
        setError(getAnalysisErrorMessage(payload, "Executive Summary failed safely."));
        return;
      }
      setState("structuring");
      setState("success");
      setResult(payload);
    } catch (requestError) {
      setState("error");
      setError(requestError instanceof Error ? requestError.message : "Executive Summary could not connect to VORA.");
    }
  }

  const summary = result?.executiveSummary;
  const coverage = summary?.analysisCoverage;

  return (<LocalizedContent locale={locale}>
    <div className="space-y-6">
      <PageHeader
        eyebrow="VORA Intelligence"
        title="Executive Summary"
        description="Aggregate completed Construction Intelligence analyses into one professional executive report. VORA summarizes only available evidence."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone="gold">Project Intelligence Session</Badge>
                <h2 className="mt-3 text-2xl font-black text-ds-token-text">Select project evidence</h2>
                <p className="mt-2 text-sm leading-7 text-ds-token-text/58">
                  The summary uses completed analyses only. Missing analyses are reported as coverage gaps.
                </p>
              </div>
              <Badge tone={session.overallHealth === "High Risk" ? "danger" : session.overallHealth === "Attention Required" ? "warning" : "success"}>{session.overallHealth}</Badge>
            </div>

            <label className="grid gap-2 text-sm font-black text-ds-token-text/82">
              <span className="text-xs uppercase tracking-[0.12em] text-ds-token-text/58">Project session</span>
              <select
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setResult(null);
                  setError("");
                }}
                className="h-12 rounded-2xl border border-ds-token-border bg-black/24 px-4 text-ds-token-text outline-none transition focus:border-ds-token-gold/52"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id} className="bg-[#111827] text-ds-token-text">{project.title}</option>
                ))}
              </select>
            </label>

            <div className="mt-5">
              <Textarea
                label="Executive focus"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Example: Focus on investment readiness, risk exposure, execution priorities, and missing evidence."
              />
            </div>

            {error && (
              <div className="mt-5">
                <Alert title="Executive Summary could not continue" tone="danger">
                  {error}
                </Alert>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void submitSummary()}
                disabled={state === "running" || state === "validating" || state === "structuring"}
                aria-label="Generate executive summary with VORA"
                icon={state === "running" || state === "validating" || state === "structuring" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              >
                {state === "running" || state === "validating" || state === "structuring" ? analysisPhaseLabel(state) : "Generate Executive Summary"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setResult(null); setError(""); setState("idle"); }} aria-label="Reset executive summary form">Reset</Button>
              {summary && <Button type="button" variant="secondary" onClick={printCurrentReport} aria-label="Print executive report">Print Report</Button>}
              <Badge tone="blue">taskIntent: executive_summary</Badge>
              <Badge tone="gold">Evidence only</Badge>
            </div>
          </GlassCard>

          <GlassCard className="analysis-report p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="print-only mb-2 text-sm font-bold text-black">Generated at: {new Date().toISOString()}</p>
                <Badge tone={state === "success" ? "success" : "neutral"}>Structured Output</Badge>
                <h2 className="mt-3 text-2xl font-black text-ds-token-text">VORA Executive Report</h2>
              </div>
              {result?.provider && <Badge tone={result.usedMock ? "gold" : "blue"}>{result.provider} · {result.model || "model"}</Badge>}
            </div>

            {!summary && state !== "success" && (
              <EmptyState
                title="No executive summary yet"
                description="Select a Project Intelligence Session, then generate the executive report."
                icon={<FileText className="h-7 w-7" />}
              />
            )}

            {summary && (
              <div className="space-y-5">
                <Metrics summary={summary} />
                <ReviewBlock title="Executive Overview">{summary.executiveOverview || result?.summary || "VORA completed the executive summary."}</ReviewBlock>
                <ReviewBlock title="Project Health">{summary.projectHealth || "Needs Review"}</ReviewBlock>
                <AnalysisList title="Completed Analyses" analyses={summary.completedAnalyses || []} />
                <AnalysisList title="Outstanding Analyses" analyses={summary.outstandingAnalyses || []} />
                <ReviewList title="Top Findings" items={list(summary.topFindings, "No completed findings were supplied.")} />
                <ReviewList title="Top Risks" items={list(summary.topRisks, "No risks were supplied by completed analyses.")} />
                <ReviewBlock title="Planning Status">{summary.planningStatus}</ReviewBlock>
                <ReviewBlock title="Site Status">{summary.siteStatus}</ReviewBlock>
                <ReviewBlock title="Documentation Status">{summary.documentationStatus}</ReviewBlock>
                <ReviewList title="Priority Actions" items={list(summary.priorityActions, "No priority actions were derived from available evidence.")} />
                <ReviewList title="Recommended Next Steps" items={list(summary.recommendedNextSteps, "Complete missing analyses and refresh the summary.")} />
              </div>
            )}
          </GlassCard>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <GlassCard className="p-5">
            <Badge tone="blue">Coverage</Badge>
            <div className="mt-5">
              <ProgressBar value={coverage?.coveragePercentage ?? Math.round((session.analysisCount / session.availableFeatures.length) * 100)} label={coverage?.label || `${session.analysisCount} of ${session.availableFeatures.length} analyses completed`} tone="gold" />
            </div>
            <div className="mt-5 space-y-3">
              <StatusRow label="Completed" value={String(coverage?.completedAnalyses ?? session.analysisCount)} active />
              <StatusRow label="Expected" value={String(coverage?.expectedAnalyses ?? session.availableFeatures.length)} active />
              <StatusRow label="Health" value={summary?.projectHealth || session.overallHealth} active />
              <StatusRow label="Confidence" value={`${summary?.overallConfidence ?? session.overallConfidence}%`} active />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="gold">Session Preview</Badge>
            <div className="mt-4 grid gap-3">
              {session.analyses.map((analysis) => (
                <div key={analysis.type} className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-ds-token-text">{analysis.title}</p>
                    <Badge tone={analysis.status === "completed" ? "success" : "neutral"}>{analysis.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-ds-token-text/48">{analysis.summary || "Not available yet."}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </aside>
      </section>
    </div>
  </LocalizedContent>);
}

function Metrics({ summary }: { summary: ExecutiveSummaryResult }) {
  const { locale } = useI18n();
  const entries: Array<[string, string, LucideIcon]> = [
    ["Health", summary.projectHealth || "Needs Review", Gauge],
    ["Coverage", `${summary.analysisCoverage?.coveragePercentage ?? 0}%`, BarChart3],
    ["Confidence", `${summary.overallConfidence ?? 0}%`, CheckCircle2],
    ["Warnings", String(summary.warnings?.length ?? 0), TriangleAlert]
  ];
  return (<LocalizedContent locale={locale}>
    <div className="grid gap-3 md:grid-cols-4">
      {entries.map(([label, value, Icon]) => (
        <div key={String(label)} className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ds-token-gold/12 text-ds-token-gold">
            <Icon className="h-4 w-4" />
          </span>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-ds-token-text/42">{label}</p>
          <p className="mt-2 text-xl font-black text-ds-token-text">{value}</p>
        </div>
      ))}
    </div>
  </LocalizedContent>);
}

function StatusRow({ label, value, active }: { label: string; value: string; active: boolean }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>
    <div className="flex items-center justify-between rounded-2xl border border-ds-token-border bg-white/[0.045] p-3">
      <span className="text-sm font-black text-ds-token-text/68">{label}</span>
      <span className={active ? "text-ds-token-text" : "text-ds-token-text/32"}>{value}</span>
    </div>
  </LocalizedContent>);
}

function ReviewBlock({ title, children }: { title: string; children?: React.ReactNode }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <h3 className="font-black text-ds-token-text">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-ds-token-text/68">{children}</p>
    </section>
  </LocalizedContent>);
}

function AnalysisList({ title, analyses }: { title: string; analyses: readonly Analysis[] }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <h3 className="font-black text-ds-token-text">{title}</h3>
      {analyses.length ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {analyses.map((analysis) => (
            <div key={analysis.type} className="rounded-xl border border-ds-token-border bg-black/18 p-3 text-xs leading-5 text-ds-token-text/68">
              <strong className="text-ds-token-text">{analysis.title}</strong>
              <p className="mt-1">{analysis.summary || analysis.status}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ds-token-text/48">No analyses in this section.</p>
      )}
    </section>
  </LocalizedContent>);
}

function ReviewList({ title, items }: { title: string; items: readonly string[] }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <h3 className="font-black text-ds-token-text">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-7 text-ds-token-text/68">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-ds-token-gold" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  </LocalizedContent>);
}
