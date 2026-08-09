"use client";

import { useI18n } from "@/components/i18n-provider";
import { LocalizedContent } from "@/components/localized-content";

import { useMemo, useState } from "react";
import { AlertTriangle, Calculator, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { Alert, Badge, Button, EmptyState, GlassCard, PageHeader, ProgressBar, Textarea } from "@/components/ui";
import { authFetch } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";

type BoqIssue = Readonly<{
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
  rowNumber?: number;
  field?: string;
}>;

type BoqReviewResult = Readonly<{
  executiveSummary?: string;
  boqOverview?: string;
  detectedStructure?: Readonly<{
    detectedColumns?: Readonly<Record<string, string>>;
    sectionCount?: number;
    itemCount?: number;
  }>;
  sections?: readonly Readonly<{ name: string; itemCount: number; totalAmount?: number }>[];
  itemStatistics?: Readonly<{
    itemCount: number;
    sectionCount: number;
    issueCount: number;
    duplicateCount: number;
    arithmeticMismatchCount: number;
    totalAmount?: number;
    structuralCompleteness: number;
  }>;
  missingInformation?: readonly string[];
  potentialDuplicates?: readonly Readonly<{ type: string; value: string; rowNumbers: readonly number[] }>[];
  quantityAndUnitIssues?: readonly BoqIssue[];
  rateAndAmountIssues?: readonly BoqIssue[];
  arithmeticChecks?: readonly Readonly<{ rowNumber: number; status: string; calculatedAmount?: number; amount?: number; difference?: number }>[];
  costRisks?: readonly string[];
  itemsRequiringReview?: readonly string[];
  recommendedActions?: readonly string[];
  warnings?: readonly Readonly<{ code: string; message: string; severity: string }>[];
}>;

type BoqApiResponse = Readonly<{
  status?: "success" | "failed";
  provider?: string;
  model?: string;
  usedMock?: boolean;
  content?: string;
  warnings?: readonly Readonly<{ code: string; message: string; severity: string }>[];
  errors?: readonly Readonly<{ code: string; message: string }>[];
  boqReview?: BoqReviewResult;
}>;

type ReviewState = "idle" | "reading" | "loading" | "success" | "error";

const readableNames = [".csv", ".tsv", ".txt", ".md", ".markdown"];
const placeholderNames = [".xlsx", ".xls", ".pdf", ".docx"];

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

function list(values: readonly string[] | undefined, fallback: string) {
  return values?.length ? values : [fallback];
}

export default function BoqReviewPage() {
  const { locale } = useI18n();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "PRJ-1048";
  const sessionId = searchParams.get("sessionId") || undefined;
  const [file, setFile] = useState<File | null>(null);
  const [boqText, setBoqText] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<ReviewState>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<BoqApiResponse | null>(null);

  const inputNote = useMemo(() => {
    if (!file && !boqText.trim()) return "Upload CSV, TSV, TXT, Markdown, XLS/XLSX, PDF, DOCX, or paste BOQ text.";
    if (file && canReadText(file)) return "Readable file content will be parsed deterministically before VORA runs.";
    if (file && isPlaceholder(file)) return "This format is accepted as a placeholder. Real extraction is not connected yet.";
    if (boqText.trim()) return "Pasted BOQ text will be parsed deterministically.";
    return "Unsupported file type.";
  }, [file, boqText]);

  async function chooseFile(selected: File | null) {
    setFile(selected);
    setResult(null);
    setError("");
    if (!selected) return;
    if (!canReadText(selected)) return;

    setState("reading");
    try {
      setBoqText(await selected.text());
      setState("idle");
    } catch {
      setState("error");
      setError("Could not read this BOQ file. Try CSV, TSV, TXT, or Markdown.");
    }
  }

  async function submitReview() {
    const fallbackName = file?.name || "pasted-boq.txt";
    const payloadText = boqText.trim();
    if (!file && !payloadText) {
      setState("error");
      setError("Upload or paste BOQ content before running the review.");
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
          taskIntent: "cost_review",
          provider: "mock",
          projectId,
          sessionId,
          userRequest: notes || "Review this BOQ structure and identify possible issues.",
          boqDocument: {
            name: fallbackName,
            mimeType: file?.type || "text/plain",
            sizeBytes: file?.size || payloadText.length,
            text: payloadText,
            delimiter: inferDelimiter(file)
          }
        })
      });
      const payload = (await response.json().catch(() => null)) as BoqApiResponse | null;
      if (!response.ok || payload?.status === "failed") {
        setState("error");
        setResult(payload);
        setError(payload?.errors?.[0]?.message || "BOQ Review failed safely.");
        return;
      }
      setState("success");
      setResult(payload);
    } catch (requestError) {
      setState("error");
      setError(requestError instanceof Error ? requestError.message : "BOQ Review could not connect to VORA.");
    }
  }

  const review = result?.boqReview;
  const preview = boqText.trim().slice(0, 1200);

  return (<LocalizedContent locale={locale}>
    <div className="space-y-6">
      <PageHeader
        eyebrow="VORA Intelligence"
        title="BOQ Review"
        description="Submit a Bill of Quantities or cost schedule and let VORA combine deterministic structure checks with the existing intelligence runtime."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone="gold">BOQ Input</Badge>
                <h2 className="mt-3 text-2xl font-black text-ds-token-text">Upload or paste BOQ</h2>
                <p className="mt-2 text-sm leading-7 text-ds-token-text/58">{inputNote}</p>
              </div>
              {file && <Badge tone={canReadText(file) ? "success" : "warning"}>{canReadText(file) ? "Readable" : "Placeholder"}</Badge>}
            </div>

            <label className="group grid min-h-44 cursor-pointer place-items-center rounded-[2rem] border border-dashed border-ds-token-gold/28 bg-ds-token-gold/8 p-6 text-center transition hover:border-ds-token-gold/48 hover:bg-ds-token-gold/12">
              <input
                type="file"
                accept=".csv,.tsv,.txt,.md,.markdown,.xlsx,.xls,.pdf,.docx,text/csv,text/tab-separated-values,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => void chooseFile(event.target.files?.[0] || null)}
              />
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-ds-token-gold/12 text-ds-token-gold shadow-gold-glow transition group-hover:-translate-y-1">
                <UploadCloud className="h-7 w-7" />
              </span>
              <span className="mt-5 text-lg font-black text-ds-token-text">{file ? file.name : "Choose BOQ file"}</span>
              <span className="mt-2 text-sm font-bold text-ds-token-text/48">CSV, TSV, TXT, Markdown parse now. XLS/XLSX/PDF/DOCX are clear placeholders.</span>
            </label>

            <div className="mt-5">
              <Textarea
                label="Paste BOQ content"
                value={boqText}
                onChange={(event) => {
                  setBoqText(event.target.value);
                  setResult(null);
                }}
                placeholder={"Example:\nRef,Section,Description,Quantity,Unit,Rate,Amount\nA-001,Concrete,Ready mix concrete,10,m3,900,9000"}
                className="min-h-44 font-mono text-xs"
              />
            </div>

            <div className="mt-5">
              <Textarea
                label="Reviewer notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Example: Focus on duplicated items, quantity/rate mismatches, missing units, and high-priority review rows."
              />
            </div>

            {preview && (
              <div className="mt-5 rounded-2xl border border-ds-token-border bg-black/24 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-ds-token-text/42">Safe preview</p>
                <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-6 text-ds-token-text/62">{preview}{boqText.length > preview.length ? "\n[preview truncated]" : ""}</pre>
              </div>
            )}

            {error && (
              <div className="mt-5">
                <Alert title="BOQ Review could not continue" tone="danger">
                  {error}
                </Alert>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void submitReview()}
                disabled={state === "loading" || state === "reading"}
                icon={state === "loading" || state === "reading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              >
                {state === "loading" ? "Reviewing..." : state === "reading" ? "Reading file..." : "Run BOQ Review"}
              </Button>
              <Badge tone="blue">taskIntent: cost_review</Badge>
              <Badge tone="gold">Deterministic checks first</Badge>
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone={state === "success" ? "success" : "neutral"}>Structured Output</Badge>
                <h2 className="mt-3 text-2xl font-black text-ds-token-text">VORA BOQ Review</h2>
              </div>
              {result?.provider && <Badge tone={result.usedMock ? "gold" : "blue"}>{result.provider} · {result.model || "model"}</Badge>}
            </div>

            {!review && state !== "success" && (
              <EmptyState
                title="No BOQ review yet"
                description="Upload or paste a BOQ. VORA will show deterministic checks, structural completeness, potential duplicates, and review actions here."
                icon={<FileSpreadsheet className="h-7 w-7" />}
              />
            )}

            {review && (
              <div className="grid gap-4">
                <ReviewBlock title="Executive Summary">{review.executiveSummary}</ReviewBlock>
                <ReviewBlock title="BOQ Overview">{review.boqOverview}</ReviewBlock>
                <Metrics review={review} />
                <ReviewList title="Missing Information" items={list(review.missingInformation, "No missing field issue was detected deterministically.")} />
                <IssueList title="Quantity and Unit Issues" issues={review.quantityAndUnitIssues || []} />
                <IssueList title="Rate and Amount Issues" issues={review.rateAndAmountIssues || []} />
                <DuplicateList duplicates={review.potentialDuplicates || []} />
                <ArithmeticList checks={review.arithmeticChecks || []} />
                <ReviewList title="Cost Risks" items={list(review.costRisks, "Market-price validation was not performed.")} />
                <ReviewList title="Recommended Actions" items={list(review.recommendedActions, "Review flagged rows before tender, procurement, or award decisions.")} />
              </div>
            )}
          </GlassCard>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <GlassCard className="p-5">
            <Badge tone="blue">Runtime Status</Badge>
            <div className="mt-5 space-y-4">
              <ProgressBar value={review?.itemStatistics?.structuralCompleteness ?? (state === "loading" ? 58 : boqText || file ? 34 : 10)} label="Structural completeness" tone={state === "error" ? "danger" : "blue"} />
              <StatusRow label="Input supplied" active={Boolean(file || boqText.trim())} />
              <StatusRow label="Validation" active={state === "success" || state === "loading"} />
              <StatusRow label="Runtime executed" active={state === "success"} />
              <StatusRow label="Structured result" active={Boolean(review)} />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="warning">Warnings</Badge>
            <div className="mt-4 space-y-3">
              {(result?.warnings?.length ? result.warnings : [{ code: "pricing_notice", message: "BOQ Review does not verify market prices or certify quantities.", severity: "warning" }]).map((warning) => (
                <div key={`${warning.code}-${warning.message}`} className="flex gap-3 rounded-2xl border border-ds-token-warning/20 bg-ds-token-warning/10 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ds-token-warning" />
                  <p className="text-xs font-bold leading-5 text-ds-token-text/68">{warning.message}</p>
                </div>
              ))}
            </div>
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

function ReviewBlock({ title, children }: { title: string; children?: React.ReactNode }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <h3 className="font-black text-ds-token-text">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-ds-token-text/68">{children}</p>
    </section>
  </LocalizedContent>);
}

function Metrics({ review }: { review: BoqReviewResult }) {
  const { locale } = useI18n();
  const stats = review.itemStatistics;
  const entries = [
    ["Items", stats?.itemCount ?? 0],
    ["Sections", stats?.sectionCount ?? 0],
    ["Issues", stats?.issueCount ?? 0],
    ["Duplicates", stats?.duplicateCount ?? 0],
    ["Mismatches", stats?.arithmeticMismatchCount ?? 0],
    ["Total", stats?.totalAmount ?? "N/A"]
  ];
  return (<LocalizedContent locale={locale}>
    <div className="grid gap-3 sm:grid-cols-3">
      {entries.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-ds-token-border bg-black/18 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-ds-token-text/42">{label}</p>
          <p className="mt-2 text-xl font-black text-ds-token-text">{value}</p>
        </div>
      ))}
    </div>
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

function IssueList({ title, issues }: { title: string; issues: readonly BoqIssue[] }) {
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
        <p className="mt-3 text-sm text-ds-token-text/52">No deterministic issue in this category.</p>
      )}
    </section>
  </LocalizedContent>);
}

function DuplicateList({ duplicates }: { duplicates: readonly Readonly<{ type: string; value: string; rowNumbers: readonly number[] }>[] }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <h3 className="font-black text-ds-token-text">Potential Duplicates</h3>
      {duplicates.length ? (
        <div className="mt-3 grid gap-2">
          {duplicates.map((duplicate) => (
            <p key={`${duplicate.type}-${duplicate.value}`} className="text-sm leading-7 text-ds-token-text/68">
              {duplicate.type}: {duplicate.value} · rows {duplicate.rowNumbers.join(", ")}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ds-token-text/52">No duplicate candidate detected.</p>
      )}
    </section>
  </LocalizedContent>);
}

function ArithmeticList({ checks }: { checks: readonly Readonly<{ rowNumber: number; status: string; calculatedAmount?: number; amount?: number; difference?: number }>[] }) {
  const { locale } = useI18n();
  const mismatches = checks.filter((check) => check.status === "mismatch");
  return (<LocalizedContent locale={locale}>
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <h3 className="font-black text-ds-token-text">Arithmetic Checks</h3>
      {mismatches.length ? (
        <div className="mt-3 grid gap-2">
          {mismatches.slice(0, 12).map((check) => (
            <p key={check.rowNumber} className="text-sm leading-7 text-ds-token-text/68">
              Row {check.rowNumber}: expected {check.calculatedAmount}, found {check.amount}, difference {check.difference}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ds-token-text/52">No computable mismatch detected.</p>
      )}
    </section>
  </LocalizedContent>);
}
