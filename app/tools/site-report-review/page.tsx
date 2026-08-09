"use client";

import { useI18n } from "@/components/i18n-provider";
import { LocalizedContent } from "@/components/localized-content";

import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, FileSearch, Loader2, UploadCloud } from "lucide-react";
import { Alert, Badge, Button, EmptyState, GlassCard, PageHeader, ProgressBar, Textarea } from "@/components/ui";
import { authFetch } from "@/lib/auth-client";
import { analysisPhaseLabel, getAnalysisErrorMessage, printCurrentReport, type AnalysisPhase } from "@/lib/analysis-client";
import { useSearchParams } from "next/navigation";

type SiteObservation = Readonly<{
  rowNumber: number;
  category: "progress" | "safety" | "quality" | "execution" | "documentation" | "general";
  text: string;
  date?: string;
  responsiblePerson?: string;
  status?: string;
  followUpRequired: boolean;
}>;

type SiteReportIssue = Readonly<{
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
  rowNumber?: number;
  field?: string;
}>;

type SiteReportReviewResult = Readonly<{
  executiveSummary?: string;
  siteReportOverview?: string;
  progressObservations?: readonly SiteObservation[];
  safetyFindings?: readonly SiteReportIssue[];
  qualityFindings?: readonly SiteReportIssue[];
  executionFindings?: readonly SiteReportIssue[];
  documentationGaps?: readonly SiteReportIssue[];
  itemsRequiringFollowUp?: readonly SiteReportIssue[];
  recommendedActions?: readonly string[];
  warnings?: readonly Readonly<{ code: string; message: string; severity: string }>[];
  summary?: Readonly<{
    observationCount: number;
    progressObservationCount: number;
    safetyObservationCount: number;
    qualityObservationCount: number;
    executionObservationCount: number;
    documentationGapCount: number;
    followUpCount: number;
    duplicateCount: number;
    issueCount: number;
    reportCompleteness: number;
  }>;
}>;

type SiteReportApiResponse = Readonly<{
  status?: "success" | "failed";
  summary?: string;
  content?: string;
  provider?: string;
  model?: string;
  usedMock?: boolean;
  warnings?: readonly Readonly<{ code: string; message: string; severity: string }>[];
  errors?: readonly Readonly<{ code: string; message: string }>[];
  siteReportReview?: SiteReportReviewResult;
}>;

const readableNames = [".csv", ".tsv", ".txt", ".md", ".markdown"];
const placeholderNames = [".pdf", ".docx"];

function canReadText(file: File) {
  const name = file.name.toLowerCase();
  return file.type.startsWith("text/") || readableNames.some((extension) => name.endsWith(extension));
}

function isPlaceholder(file: File) {
  const name = file.name.toLowerCase();
  return placeholderNames.some((extension) => name.endsWith(extension));
}

function inferDelimiter(file: File | null): "," | "\t" | ";" | "|" | undefined {
  if (!file) return undefined;
  if (file.name.toLowerCase().endsWith(".tsv")) return "\t";
  return undefined;
}

function list(items: readonly string[] | undefined, fallback: string) {
  return items?.length ? items : [fallback];
}

export default function SiteReportReviewPage() {
  const { locale } = useI18n();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "PRJ-1048";
  const sessionId = searchParams.get("sessionId") || undefined;
  const [file, setFile] = useState<File | null>(null);
  const [siteReportText, setSiteReportText] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<AnalysisPhase>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<SiteReportApiResponse | null>(null);

  const inputNote = useMemo(() => {
    if (!file && !siteReportText.trim()) return "Upload or paste TXT, Markdown, CSV, daily site reports, inspection notes, site diary entries, or progress notes.";
    if (file && canReadText(file)) return "Readable site report content will be checked deterministically before VORA runs.";
    if (file && isPlaceholder(file)) return "PDF/DOCX parsing is not connected yet. VORA will review metadata and pasted notes only.";
    if (siteReportText.trim()) return "Pasted site report notes will be reviewed as user-supplied site information.";
    return "This file type is not supported by Site Report Review.";
  }, [file, siteReportText]);

  async function chooseFile(selected: File | null) {
    setFile(selected);
    setResult(null);
    setError("");
    if (!selected || !canReadText(selected)) return;

    setState("reading");
    try {
      setSiteReportText(await selected.text());
      setState("idle");
    } catch {
      setState("error");
      setError("Could not read this site report. Try another TXT, Markdown, or CSV file.");
    }
  }

  async function submitReview() {
    if (!file && !siteReportText.trim()) {
      setState("error");
      setError("Upload or paste site report information before running Site Report Review.");
      return;
    }

    setState("validating");
    setError("");
    setResult(null);

    try {
      setState("running");
      const response = await authFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          mode: "vora_intelligence",
          taskIntent: "site_report_review",
          provider: "mock",
          projectId,
          sessionId,
          userRequest: notes || "Review this construction site report.",
          siteReportNotes: siteReportText,
          siteReportDocument: file
            ? {
                name: file.name,
                mimeType: file.type,
                sizeBytes: file.size,
                text: siteReportText,
                delimiter: inferDelimiter(file)
              }
            : undefined
        })
      });
      const payload = (await response.json().catch(() => null)) as SiteReportApiResponse | null;
      if (!response.ok || payload?.status === "failed") {
        setState("error");
        setResult(payload);
        setError(getAnalysisErrorMessage(payload, "Site Report Review failed safely."));
        return;
      }
      setState("structuring");
      setState("success");
      setResult(payload);
    } catch (requestError) {
      setState("error");
      setError(requestError instanceof Error ? requestError.message : "Site Report Review could not connect to VORA.");
    }
  }

  const review = result?.siteReportReview;
  const preview = siteReportText.trim().slice(0, 1000);

  return (<LocalizedContent locale={locale}>
    <div className="space-y-6">
      <PageHeader
        eyebrow="VORA Intelligence"
        title="Site Report Review"
        description="Review daily reports, inspection notes, and site diary entries. VORA checks supplied observations only and never invents site events."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone="gold">Site Report Input</Badge>
                <h2 className="mt-3 text-2xl font-black text-ds-token-text">Upload or paste site report information</h2>
                <p className="mt-2 text-sm leading-7 text-ds-token-text/58">{inputNote}</p>
              </div>
              {file && <Badge tone={canReadText(file) ? "success" : "warning"}>{canReadText(file) ? "Text available" : "Placeholder parsing"}</Badge>}
            </div>

            <label className="group grid min-h-44 cursor-pointer place-items-center rounded-[2rem] border border-dashed border-ds-token-gold/28 bg-ds-token-gold/8 p-6 text-center transition hover:border-ds-token-gold/48 hover:bg-ds-token-gold/12">
              <input
                type="file"
                aria-label="Upload site report file"
                accept=".txt,.md,.markdown,.csv,.tsv,.pdf,.docx,text/plain,text/markdown,text/csv,text/tab-separated-values,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => void chooseFile(event.target.files?.[0] || null)}
              />
              <span className="grid h-14 w-14 place-items-center rounded-3xl bg-ds-token-gold/12 text-ds-token-gold shadow-gold-glow transition group-hover:-translate-y-1">
                <UploadCloud className="h-6 w-6" />
              </span>
              <span className="mt-4 text-lg font-black text-ds-token-text">{file ? file.name : "Choose a site report file"}</span>
              <span className="mt-2 text-sm font-bold text-ds-token-text/48">TXT, Markdown, CSV, and TSV are readable. PDF and DOCX are placeholders.</span>
            </label>

            <div className="mt-5">
              <Textarea
                label="Site report text or notes"
                value={siteReportText}
                onChange={(event) => setSiteReportText(event.target.value)}
                placeholder="Example CSV: Observation,Date,Responsible,Status,Category..."
              />
            </div>
            <div className="mt-5">
              <Textarea
                label="Reviewer notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Example: Focus on missing observations, safety notes, quality findings, responsible persons, and follow-up items."
              />
            </div>

            {error && (
              <div className="mt-5">
                <Alert title="Site Report Review could not continue" tone="danger">
                  {error}
                </Alert>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void submitReview()}
                disabled={state === "running" || state === "reading" || state === "validating" || state === "structuring"}
                aria-label="Run site report review with VORA"
                icon={state === "running" || state === "reading" || state === "validating" || state === "structuring" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
              >
                {state === "running" || state === "reading" || state === "validating" || state === "structuring" ? analysisPhaseLabel(state) : "Run Site Report Review"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setResult(null); setError(""); setFile(null); setSiteReportText(""); setNotes(""); setState("idle"); }} aria-label="Reset site report review form">Reset</Button>
              {review && <Button type="button" variant="secondary" onClick={printCurrentReport} aria-label="Print site report review">Print Report</Button>}
              <Badge tone="blue">taskIntent: site_report_review</Badge>
              <Badge tone="gold">No invented observations</Badge>
            </div>
          </GlassCard>

          <GlassCard className="analysis-report p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="print-only mb-2 text-sm font-bold text-black">Generated at: {new Date().toISOString()}</p>
                <Badge tone={state === "success" ? "success" : "neutral"}>Structured Output</Badge>
                <h2 className="mt-3 text-2xl font-black text-ds-token-text">VORA Site Report Review</h2>
              </div>
              {result?.provider && <Badge tone={result.usedMock ? "gold" : "blue"}>{result.provider} · {result.model || "model"}</Badge>}
            </div>

            {!review && state !== "success" && (
              <EmptyState
                title="No site report review yet"
                description="Upload or paste site report information, then run VORA."
                icon={<FileSearch className="h-7 w-7" />}
              />
            )}

            {review && (
              <div className="space-y-5">
                <Metrics review={review} />
                <ReviewBlock title="Executive Summary">{review.executiveSummary || result?.summary || "VORA completed the site report review."}</ReviewBlock>
                <ReviewBlock title="Site Report Overview">{review.siteReportOverview}</ReviewBlock>
                <ObservationTable observations={review.progressObservations || []} />
                <IssueList title="Safety Findings" issues={review.safetyFindings || []} />
                <IssueList title="Quality Findings" issues={review.qualityFindings || []} />
                <IssueList title="Execution Findings" issues={review.executionFindings || []} />
                <IssueList title="Documentation Gaps" issues={review.documentationGaps || []} />
                <IssueList title="Items Requiring Follow-up" issues={review.itemsRequiringFollowUp || []} />
                <ReviewList title="Recommended Actions" items={list(review.recommendedActions, "Clarify missing observations, dates, responsible persons, and follow-up owners before decisions.")} />
              </div>
            )}
          </GlassCard>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <GlassCard className="p-5">
            <Badge tone="blue">Review Readiness</Badge>
            <div className="mt-5 space-y-3">
              <StatusRow label="Report text" active={Boolean(siteReportText.trim())} />
              <StatusRow label="Report file" active={Boolean(file)} />
              <StatusRow label="Reviewer notes" active={Boolean(notes.trim())} />
              <StatusRow label="Runtime route" active />
            </div>
            <div className="mt-5">
              <ProgressBar value={(Number(Boolean(siteReportText.trim())) + Number(Boolean(file)) + Number(Boolean(notes.trim()))) * 33.34} label="Evidence readiness" tone="gold" />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="gold">Text Preview</Badge>
            <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-ds-token-border bg-black/22 p-4 text-xs leading-6 text-ds-token-text/58">
              {preview || "Site report text preview will appear here."}
            </pre>
          </GlassCard>
        </aside>
      </section>
    </div>
  </LocalizedContent>);
}

function StatusRow({ label, active }: { label: string; active: boolean }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>
    <div className="flex items-center justify-between rounded-2xl border border-ds-token-border bg-white/[0.045] p-3">
      <span className="text-sm font-black text-ds-token-text/68">{label}</span>
      <span className={active ? "text-ds-token-success" : "text-ds-token-text/32"}>
        <CheckCircle2 className="h-4 w-4" />
      </span>
    </div>
  </LocalizedContent>);
}

function Metrics({ review }: { review: SiteReportReviewResult }) {
  const { locale } = useI18n();
  const summary = review.summary;
  const entries = [
    ["Observations", summary?.observationCount ?? 0],
    ["Progress", summary?.progressObservationCount ?? 0],
    ["Safety", summary?.safetyObservationCount ?? 0],
    ["Quality", summary?.qualityObservationCount ?? 0],
    ["Follow-up", summary?.followUpCount ?? 0],
    ["Completeness", `${summary?.reportCompleteness ?? 0}%`]
  ];
  return (<LocalizedContent locale={locale}>
    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {entries.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-3">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-ds-token-text/42">{label}</p>
          <p className="mt-2 text-xl font-black text-ds-token-text">{value}</p>
        </div>
      ))}
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

function ObservationTable({ observations }: { observations: readonly SiteObservation[] }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <h3 className="font-black text-ds-token-text">Progress Observations</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-[720px] w-full text-start text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-ds-token-text/42">
            <tr>
              <th className="p-3 text-start">Observation</th>
              <th className="p-3 text-start">Date</th>
              <th className="p-3 text-start">Responsible</th>
              <th className="p-3 text-start">Status</th>
              <th className="p-3 text-start">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {observations.slice(0, 16).map((observation) => (
              <tr key={`${observation.rowNumber}-${observation.text}`} className="border-t border-ds-token-border text-ds-token-text/68">
                <td className="p-3 font-bold text-ds-token-text">{observation.text || "Missing observation"}</td>
                <td className="p-3">{observation.date || "N/A"}</td>
                <td className="p-3">{observation.responsiblePerson || "N/A"}</td>
                <td className="p-3">{observation.status || "N/A"}</td>
                <td className="p-3">{observation.followUpRequired ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!observations.length && <p className="mt-3 text-sm text-ds-token-text/48">No progress observations were detected from supplied information.</p>}
    </section>
  </LocalizedContent>);
}

function IssueList({ title, issues }: { title: string; issues: readonly SiteReportIssue[] }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <h3 className="font-black text-ds-token-text">{title}</h3>
      {issues.length ? (
        <div className="mt-3 grid gap-2">
          {issues.slice(0, 12).map((issue) => (
            <div key={`${issue.code}-${issue.rowNumber}-${issue.message}`} className="rounded-xl border border-ds-token-border bg-black/18 p-3 text-xs leading-5 text-ds-token-text/68">
              <strong className="text-ds-token-text">Row {issue.rowNumber || "n/a"}:</strong> {issue.message}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ds-token-text/48">No deterministic issues in this section.</p>
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
