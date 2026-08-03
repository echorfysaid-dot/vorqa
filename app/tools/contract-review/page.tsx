"use client";

import { useI18n } from "@/components/i18n-provider";
import { LocalizedContent } from "@/components/localized-content";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSearch, FileText, Loader2, Scale, UploadCloud } from "lucide-react";
import { Alert, Badge, Button, EmptyState, GlassCard, PageHeader, ProgressBar, Textarea } from "@/components/ui";
import { authFetch } from "@/lib/auth-client";

type ContractReviewSection = Readonly<{
  executiveSummary?: string;
  contractOverview?: string;
  keyClauses?: readonly string[];
  potentialRisks?: readonly string[];
  missingInformation?: readonly string[];
  itemsRequiringReview?: readonly string[];
  recommendedActions?: readonly string[];
  confidence?: Readonly<Record<string, unknown>>;
  warnings?: readonly Readonly<{ code: string; message: string; severity: string }>[];
}>;

type ContractReviewApiResponse = Readonly<{
  status?: "success" | "failed";
  content?: string;
  summary?: string;
  provider?: string;
  model?: string;
  usedMock?: boolean;
  warnings?: readonly Readonly<{ code: string; message: string; severity: string }>[];
  errors?: readonly Readonly<{ code: string; message: string }>[]; 
  contractReview?: ContractReviewSection;
}>;

type ReviewState = "idle" | "reading" | "loading" | "success" | "error";

const readableExtensions = [".txt", ".md", ".markdown"];

function isReadableTextFile(file: File) {
  const name = file.name.toLowerCase();
  return file.type === "text/plain" || file.type === "text/markdown" || readableExtensions.some((extension) => name.endsWith(extension));
}

function listItems(items: readonly string[] | undefined, fallback: string) {
  const values = items?.filter(Boolean);
  return values?.length ? values : [fallback];
}

export default function ContractReviewPage() {
  const { locale } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<ReviewState>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ContractReviewApiResponse | null>(null);

  const parsingNote = useMemo(() => {
    if (!file) return "Upload a TXT, Markdown, PDF, or DOCX contract.";
    if (isReadableTextFile(file)) return "Readable text will be sent to VORA for analysis.";
    if (file.name.toLowerCase().endsWith(".pdf") || file.name.toLowerCase().endsWith(".docx")) {
      return "Real parsing is not connected yet. VORA will review metadata and your notes only.";
    }
    return "This file type is not supported by Contract Review.";
  }, [file]);

  async function chooseFile(selected: File | null) {
    setResult(null);
    setError("");
    setFile(selected);
    setFileText("");
    if (!selected) return;
    if (!isReadableTextFile(selected)) return;

    setState("reading");
    try {
      setFileText(await selected.text());
      setState("idle");
    } catch {
      setState("error");
      setError("Could not read this text contract. Try another TXT or Markdown file.");
    }
  }

  async function submitReview() {
    if (!file) {
      setError("Upload a contract document before running Contract Review.");
      setState("error");
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
          taskIntent: "contract_review",
          provider: "mock",
          projectId: "PRJ-1048",
          userRequest: notes || "Review the uploaded construction contract.",
          contractDocument: {
            name: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            text: fileText
          }
        })
      });
      const payload = (await response.json().catch(() => null)) as ContractReviewApiResponse | null;
      if (!response.ok || payload?.status === "failed") {
        setState("error");
        setResult(payload);
        setError(payload?.errors?.[0]?.message || "Contract Review failed safely.");
        return;
      }

      setState("success");
      setResult(payload);
    } catch (requestError) {
      setState("error");
      setError(requestError instanceof Error ? requestError.message : "Contract Review could not connect to VORA.");
    }
  }

  const review = result?.contractReview;

  return (<LocalizedContent locale={locale}>(
    <div className="space-y-6">
      <PageHeader
        eyebrow="VORA Intelligence"
        title="Contract Review"
        description="Upload a construction contract and run the activated VORA Intelligence pipeline for a structured, non-legal project review."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone="gold">Contract Input</Badge>
                <h2 className="mt-3 text-2xl font-black text-ds-token-text">Upload contract</h2>
                <p className="mt-2 text-sm leading-7 text-ds-token-text/58">{parsingNote}</p>
              </div>
              {file && <Badge tone={isReadableTextFile(file) ? "success" : "warning"}>{isReadableTextFile(file) ? "Text available" : "Placeholder parsing"}</Badge>}
            </div>

            <label className="group grid min-h-52 cursor-pointer place-items-center rounded-[2rem] border border-dashed border-ds-token-gold/28 bg-ds-token-gold/8 p-6 text-center transition hover:border-ds-token-gold/48 hover:bg-ds-token-gold/12">
              <input
                type="file"
                accept=".txt,.md,.markdown,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => void chooseFile(event.target.files?.[0] || null)}
              />
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-ds-token-gold/12 text-ds-token-gold shadow-gold-glow transition group-hover:-translate-y-1">
                <UploadCloud className="h-7 w-7" />
              </span>
              <span className="mt-5 text-lg font-black text-ds-token-text">{file ? file.name : "Choose a contract file"}</span>
              <span className="mt-2 text-sm font-bold text-ds-token-text/48">TXT and Markdown include readable text. PDF and DOCX are accepted as placeholders.</span>
            </label>

            {file && (
              <div className="mt-5 grid gap-3 rounded-2xl border border-ds-token-border bg-black/20 p-4 text-sm text-ds-token-text/68 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-ds-token-text/42">File</p>
                  <p className="mt-1 truncate font-black text-ds-token-text">{file.name}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-ds-token-text/42">Type</p>
                  <p className="mt-1 font-black text-ds-token-text">{file.type || "unknown"}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-ds-token-text/42">Size</p>
                  <p className="mt-1 font-black text-ds-token-text">{Math.max(1, Math.round(file.size / 1024))} KB</p>
                </div>
              </div>
            )}

            <div className="mt-5">
              <Textarea
                label="Reviewer notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Example: Focus on payment terms, delivery obligations, warranties, delay penalties, and missing attachments."
              />
            </div>

            {error && (
              <div className="mt-5">
                <Alert title="Contract Review could not continue" tone="danger">
                  {error}
                </Alert>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void submitReview()}
                disabled={state === "loading" || state === "reading"}
                icon={state === "loading" || state === "reading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" />}
              >
                {state === "loading" ? "Reviewing..." : state === "reading" ? "Reading file..." : "Run Contract Review"}
              </Button>
              <Badge tone="blue">Uses /api/generate</Badge>
              <Badge tone="gold">taskIntent: contract_review</Badge>
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone={state === "success" ? "success" : "neutral"}>Structured Output</Badge>
                <h2 className="mt-3 text-2xl font-black text-ds-token-text">VORA Contract Review</h2>
              </div>
              {result?.provider && <Badge tone={result.usedMock ? "gold" : "blue"}>{result.provider} · {result.model || "model"}</Badge>}
            </div>

            {!review && state !== "success" && (
              <EmptyState
                title="No contract review yet"
                description="Upload a supported contract and run VORA. The result will appear here with risks, missing information, recommended actions, and confidence."
                icon={<FileSearch className="h-7 w-7" />}
              />
            )}

            {review && (
              <div className="grid gap-4">
                <ReviewBlock title="Executive Summary" icon={<FileText className="h-5 w-5" />}>
                  {review.executiveSummary}
                </ReviewBlock>
                <ReviewBlock title="Contract Overview" icon={<Scale className="h-5 w-5" />}>
                  {review.contractOverview}
                </ReviewBlock>
                <ReviewList title="Key Clauses" items={listItems(review.keyClauses, "No key clauses were extracted deterministically.")} />
                <ReviewList title="Potential Risks" items={listItems(review.potentialRisks, "No risk item was extracted deterministically.")} />
                <ReviewList title="Missing Information" items={listItems(review.missingInformation, "No missing information was extracted deterministically.")} />
                <ReviewList title="Items Requiring Review" items={listItems(review.itemsRequiringReview, "Manual legal and commercial review is still required.")} />
                <ReviewList title="Recommended Actions" items={listItems(review.recommendedActions, "Use this review as a project-management aid, not legal advice.")} />
              </div>
            )}
          </GlassCard>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <GlassCard className="p-5">
            <Badge tone="blue">Runtime Status</Badge>
            <div className="mt-5 space-y-4">
              <ProgressBar value={state === "success" ? 100 : state === "loading" ? 64 : file ? 34 : 12} label="Review readiness" tone={state === "error" ? "danger" : "blue"} />
              <StatusRow label="Document" active={Boolean(file)} />
              <StatusRow label="Validation" active={state === "success" || state === "loading"} />
              <StatusRow label="VORA Runtime" active={state === "success"} />
              <StatusRow label="Structured result" active={Boolean(review)} />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="warning">Warnings</Badge>
            <div className="mt-4 space-y-3">
              {(result?.warnings?.length ? result.warnings : [{ code: "legal_notice", message: "Contract Review is not legal advice. Always verify with qualified counsel.", severity: "warning" }]).map((warning) => (
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

function ReviewBlock({ title, icon, children }: { title: string; icon: React.ReactNode; children?: React.ReactNode }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <div className="mb-3 flex items-center gap-2 text-ds-token-gold">
        {icon}
        <h3 className="font-black text-ds-token-text">{title}</h3>
      </div>
      <p className="text-sm leading-7 text-ds-token-text/68">{children}</p>
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
