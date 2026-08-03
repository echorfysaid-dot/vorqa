"use client";

import { useI18n } from "@/components/i18n-provider";
import { LocalizedContent } from "@/components/localized-content";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, FileClock, Loader2, UploadCloud } from "lucide-react";
import { Alert, Badge, Button, EmptyState, GlassCard, PageHeader, ProgressBar, Textarea } from "@/components/ui";
import { authFetch } from "@/lib/auth-client";

type PlanningActivity = Readonly<{
  rowNumber: number;
  name: string;
  description?: string;
  phase?: string;
  milestone?: string;
  dependency?: string;
  owner?: string;
}>;

type PlanningIssue = Readonly<{
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
  rowNumber?: number;
  field?: string;
}>;

type PlanningReviewResult = Readonly<{
  executiveSummary?: string;
  planningOverview?: string;
  detectedActivities?: readonly PlanningActivity[];
  missingActivities?: readonly PlanningIssue[];
  milestoneReview?: readonly string[];
  dependencyReview?: readonly PlanningIssue[];
  planningRisks?: readonly string[];
  documentationGaps?: readonly PlanningIssue[];
  recommendedActions?: readonly string[];
  warnings?: readonly Readonly<{ code: string; message: string; severity: string }>[];
  summary?: Readonly<{
    activityCount: number;
    milestoneCount: number;
    phaseCount: number;
    issueCount: number;
    duplicateCount: number;
    structuralCompleteness: number;
  }>;
}>;

type PlanningApiResponse = Readonly<{
  status?: "success" | "failed";
  summary?: string;
  content?: string;
  provider?: string;
  model?: string;
  usedMock?: boolean;
  warnings?: readonly Readonly<{ code: string; message: string; severity: string }>[];
  errors?: readonly Readonly<{ code: string; message: string }>[];
  planningReview?: PlanningReviewResult;
}>;

type ReviewState = "idle" | "reading" | "loading" | "success" | "error";

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

export default function PlanningReviewPage() {
  const { locale } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [planningText, setPlanningText] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<ReviewState>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<PlanningApiResponse | null>(null);

  const inputNote = useMemo(() => {
    if (!file && !planningText.trim()) return "Upload or paste TXT, Markdown, CSV, activity lists, or planning notes.";
    if (file && canReadText(file)) return "Readable planning content will be checked deterministically before VORA runs.";
    if (file && isPlaceholder(file)) return "PDF/DOCX parsing is not connected yet. VORA will review metadata and pasted notes only.";
    if (planningText.trim()) return "Pasted planning notes will be reviewed as user-supplied planning information.";
    return "This file type is not supported by Planning Review.";
  }, [file, planningText]);

  async function chooseFile(selected: File | null) {
    setFile(selected);
    setResult(null);
    setError("");
    if (!selected || !canReadText(selected)) return;

    setState("reading");
    try {
      setPlanningText(await selected.text());
      setState("idle");
    } catch {
      setState("error");
      setError("Could not read this planning document. Try another TXT, Markdown, or CSV file.");
    }
  }

  async function submitReview() {
    if (!file && !planningText.trim()) {
      setState("error");
      setError("Upload or paste planning information before running Planning Review.");
      return;
    }

    setState("loading");
    setError("");
    setResult(null);

    try {
      const response = await authFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          mode: "vora_intelligence",
          taskIntent: "planning_review",
          provider: "mock",
          projectId: "PRJ-1048",
          userRequest: notes || "Review this project planning information.",
          planningNotes: planningText,
          planningDocument: file
            ? {
                name: file.name,
                mimeType: file.type,
                sizeBytes: file.size,
                text: planningText,
                delimiter: inferDelimiter(file)
              }
            : undefined
        })
      });
      const payload = (await response.json().catch(() => null)) as PlanningApiResponse | null;
      if (!response.ok || payload?.status === "failed") {
        setState("error");
        setResult(payload);
        setError(payload?.errors?.[0]?.message || "Planning Review failed safely.");
        return;
      }
      setState("success");
      setResult(payload);
    } catch (requestError) {
      setState("error");
      setError(requestError instanceof Error ? requestError.message : "Planning Review could not connect to VORA.");
    }
  }

  const review = result?.planningReview;
  const preview = planningText.trim().slice(0, 1000);

  return (<LocalizedContent locale={locale}>(
    <div className="space-y-6">
      <PageHeader
        eyebrow="VORA Intelligence"
        title="Planning Review"
        description="Review a construction schedule, activity list, or planning notes. VORA checks available planning information without calculating dates or optimizing the schedule."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone="gold">Planning Input</Badge>
                <h2 className="mt-3 text-2xl font-black text-ds-token-text">Upload or paste planning information</h2>
                <p className="mt-2 text-sm leading-7 text-ds-token-text/58">{inputNote}</p>
              </div>
              {file && <Badge tone={canReadText(file) ? "success" : "warning"}>{canReadText(file) ? "Text available" : "Placeholder parsing"}</Badge>}
            </div>

            <label className="group grid min-h-44 cursor-pointer place-items-center rounded-[2rem] border border-dashed border-ds-token-gold/28 bg-ds-token-gold/8 p-6 text-center transition hover:border-ds-token-gold/48 hover:bg-ds-token-gold/12">
              <input
                type="file"
                accept=".txt,.md,.markdown,.csv,.tsv,.pdf,.docx,text/plain,text/markdown,text/csv,text/tab-separated-values,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => void chooseFile(event.target.files?.[0] || null)}
              />
              <span className="grid h-14 w-14 place-items-center rounded-3xl bg-ds-token-gold/12 text-ds-token-gold shadow-gold-glow transition group-hover:-translate-y-1">
                <UploadCloud className="h-6 w-6" />
              </span>
              <span className="mt-4 text-lg font-black text-ds-token-text">{file ? file.name : "Choose a planning file"}</span>
              <span className="mt-2 text-sm font-bold text-ds-token-text/48">TXT, Markdown, CSV, and TSV are readable. PDF and DOCX are placeholders.</span>
            </label>

            <div className="mt-5">
              <Textarea
                label="Planning text or notes"
                value={planningText}
                onChange={(event) => setPlanningText(event.target.value)}
                placeholder="Example CSV: Activity,Description,Phase,Milestone,Dependency,Owner..."
              />
            </div>
            <div className="mt-5">
              <Textarea
                label="Reviewer notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Example: Focus on missing milestones, unclear owners, dependencies, and phase sequencing."
              />
            </div>

            {error && (
              <div className="mt-5">
                <Alert title="Planning Review could not continue" tone="danger">
                  {error}
                </Alert>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void submitReview()}
                disabled={state === "loading" || state === "reading"}
                icon={state === "loading" || state === "reading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
              >
                {state === "loading" ? "Reviewing..." : state === "reading" ? "Reading file..." : "Run Planning Review"}
              </Button>
              <Badge tone="blue">taskIntent: planning_review</Badge>
              <Badge tone="gold">No date calculation</Badge>
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone={state === "success" ? "success" : "neutral"}>Structured Output</Badge>
                <h2 className="mt-3 text-2xl font-black text-ds-token-text">VORA Planning Review</h2>
              </div>
              {result?.provider && <Badge tone={result.usedMock ? "gold" : "blue"}>{result.provider} · {result.model || "model"}</Badge>}
            </div>

            {!review && state !== "success" && (
              <EmptyState
                title="No planning review yet"
                description="Upload or paste planning information, then run VORA."
                icon={<FileClock className="h-7 w-7" />}
              />
            )}

            {review && (
              <div className="space-y-5">
                <Metrics review={review} />
                <ReviewBlock title="Executive Summary">{review.executiveSummary || result?.summary || "VORA completed the planning review."}</ReviewBlock>
                <ReviewBlock title="Planning Overview">{review.planningOverview}</ReviewBlock>
                <ActivityTable activities={review.detectedActivities || []} />
                <IssueList title="Missing Activities / Descriptions" issues={review.missingActivities || []} />
                <ReviewList title="Milestone Review" items={list(review.milestoneReview, "No milestone review was produced.")} />
                <IssueList title="Dependency Review" issues={review.dependencyReview || []} />
                <IssueList title="Documentation Gaps" issues={review.documentationGaps || []} />
                <ReviewList title="Planning Risks" items={list(review.planningRisks, "No planning risks were produced from supplied information.")} />
                <ReviewList title="Recommended Actions" items={list(review.recommendedActions, "Clarify planning gaps before relying on the schedule.")} />
              </div>
            )}
          </GlassCard>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <GlassCard className="p-5">
            <Badge tone="blue">Review Readiness</Badge>
            <div className="mt-5 space-y-3">
              <StatusRow label="Planning text" active={Boolean(planningText.trim())} />
              <StatusRow label="Planning file" active={Boolean(file)} />
              <StatusRow label="Reviewer notes" active={Boolean(notes.trim())} />
              <StatusRow label="Runtime route" active />
            </div>
            <div className="mt-5">
              <ProgressBar value={(Number(Boolean(planningText.trim())) + Number(Boolean(file)) + Number(Boolean(notes.trim()))) * 33.34} label="Evidence readiness" tone="gold" />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="gold">Text Preview</Badge>
            <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-ds-token-border bg-black/22 p-4 text-xs leading-6 text-ds-token-text/58">
              {preview || "Planning text preview will appear here."}
            </pre>
          </GlassCard>
        </aside>
      </section>
    </div>
  )</LocalizedContent>);
}

function StatusRow({ label, active }: { label: string; active: boolean }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <div className="flex items-center justify-between rounded-2xl border border-ds-token-border bg-white/[0.045] p-3">
      <span className="text-sm font-black text-ds-token-text/68">{label}</span>
      <span className={active ? "text-ds-token-success" : "text-ds-token-text/32"}>
        <CheckCircle2 className="h-4 w-4" />
      </span>
    </div>
  )</LocalizedContent>);
}

function Metrics({ review }: { review: PlanningReviewResult }) {
  const { locale } = useI18n();
  const summary = review.summary;
  const entries = [
    ["Activities", summary?.activityCount ?? 0],
    ["Milestones", summary?.milestoneCount ?? 0],
    ["Phases", summary?.phaseCount ?? 0],
    ["Issues", summary?.issueCount ?? 0],
    ["Completeness", `${summary?.structuralCompleteness ?? 0}%`]
  ];
  return (<LocalizedContent locale={locale}>(
    <div className="grid gap-3 sm:grid-cols-5">
      {entries.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-3">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-ds-token-text/42">{label}</p>
          <p className="mt-2 text-xl font-black text-ds-token-text">{value}</p>
        </div>
      ))}
    </div>
  )</LocalizedContent>);
}

function ReviewBlock({ title, children }: { title: string; children?: React.ReactNode }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <h3 className="font-black text-ds-token-text">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-ds-token-text/68">{children}</p>
    </section>
  )</LocalizedContent>);
}

function ActivityTable({ activities }: { activities: readonly PlanningActivity[] }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <h3 className="font-black text-ds-token-text">Detected Activities</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-[720px] w-full text-start text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-ds-token-text/42">
            <tr>
              <th className="p-3 text-start">Activity</th>
              <th className="p-3 text-start">Phase</th>
              <th className="p-3 text-start">Milestone</th>
              <th className="p-3 text-start">Dependency</th>
              <th className="p-3 text-start">Owner</th>
            </tr>
          </thead>
          <tbody>
            {activities.slice(0, 16).map((activity) => (
              <tr key={`${activity.rowNumber}-${activity.name}`} className="border-t border-ds-token-border text-ds-token-text/68">
                <td className="p-3 font-bold text-ds-token-text">{activity.name || "Missing activity"}</td>
                <td className="p-3">{activity.phase || "N/A"}</td>
                <td className="p-3">{activity.milestone || "N/A"}</td>
                <td className="p-3">{activity.dependency || "N/A"}</td>
                <td className="p-3">{activity.owner || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )</LocalizedContent>);
}

function IssueList({ title, issues }: { title: string; issues: readonly PlanningIssue[] }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
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
  )</LocalizedContent>);
}

function ReviewList({ title, items }: { title: string; items: readonly string[] }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
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
  )</LocalizedContent>);
}
