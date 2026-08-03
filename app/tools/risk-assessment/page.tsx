"use client";

import { useI18n } from "@/components/i18n-provider";
import { LocalizedContent } from "@/components/localized-content";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileWarning, Loader2, ShieldAlert, UploadCloud } from "lucide-react";
import { Alert, Badge, Button, EmptyState, GlassCard, PageHeader, ProgressBar, Textarea } from "@/components/ui";
import { authFetch } from "@/lib/auth-client";

type RiskItem = Readonly<{
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  probability: "low" | "medium" | "high";
  priority: "low" | "medium" | "high" | "urgent";
  potentialImpact: string;
  evidence: readonly string[];
  source: string;
  suggestedMitigation: string;
  recommendedOwner: string;
  followUpRequired: boolean;
  status: string;
}>;

type RiskMatrixEntry = Readonly<{
  probability: string;
  impact: string;
  priority: string;
  riskCount: number;
  riskIds: readonly string[];
}>;

type RiskAssessmentResult = Readonly<{
  executiveSummary?: string;
  overallRiskLevel?: "low" | "medium" | "high" | "critical";
  riskMatrix?: readonly RiskMatrixEntry[];
  detectedRisks?: readonly RiskItem[];
  riskCategories?: readonly string[];
  evidence?: readonly string[];
  highPriorityRisks?: readonly RiskItem[];
  mitigationActions?: readonly string[];
  recommendedFollowUp?: readonly string[];
  warnings?: readonly Readonly<{ code: string; message: string; severity: string }>[];
}>;

type RiskApiResponse = Readonly<{
  status?: "success" | "failed";
  content?: string;
  summary?: string;
  provider?: string;
  model?: string;
  usedMock?: boolean;
  warnings?: readonly Readonly<{ code: string; message: string; severity: string }>[];
  errors?: readonly Readonly<{ code: string; message: string }>[];
  riskAssessment?: RiskAssessmentResult;
}>;

type ReviewState = "idle" | "reading" | "loading" | "success" | "error";

const readableExtensions = [".txt", ".md", ".markdown"];
const placeholderExtensions = [".pdf", ".docx"];

function canReadText(file: File) {
  const name = file.name.toLowerCase();
  return file.type.startsWith("text/") || readableExtensions.some((extension) => name.endsWith(extension));
}

function isPlaceholder(file: File) {
  const name = file.name.toLowerCase();
  return placeholderExtensions.some((extension) => name.endsWith(extension));
}

function list(items: readonly string[] | undefined, fallback: string) {
  return items?.length ? items : [fallback];
}

export default function RiskAssessmentPage() {
  const { locale } = useI18n();
  const [contractFindings, setContractFindings] = useState("");
  const [boqFindings, setBoqFindings] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState("");
  const [state, setState] = useState<ReviewState>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<RiskApiResponse | null>(null);

  const inputNote = useMemo(() => {
    if (!file) return "Paste Contract Review findings, BOQ Review findings, or upload TXT/Markdown/PDF/DOCX project notes.";
    if (canReadText(file)) return "Readable notes will be included as user-supplied evidence.";
    if (isPlaceholder(file)) return "PDF/DOCX parsing is not connected yet. VORA will use metadata plus pasted notes only.";
    return "This file type is not supported by Risk Assessment.";
  }, [file]);

  async function chooseFile(selected: File | null) {
    setFile(selected);
    setFileText("");
    setResult(null);
    setError("");
    if (!selected || !canReadText(selected)) return;

    setState("reading");
    try {
      setFileText(await selected.text());
      setState("idle");
    } catch {
      setState("error");
      setError("Could not read this notes file. Try another TXT or Markdown file.");
    }
  }

  async function submitAssessment() {
    if (!contractFindings.trim() && !boqFindings.trim() && !notes.trim() && !file) {
      setState("error");
      setError("Add Contract Review findings, BOQ Review findings, project notes, or a supported notes file.");
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
          taskIntent: "risk_assessment",
          provider: "mock",
          projectId: "PRJ-1048",
          userRequest: "Generate a construction risk assessment from the supplied evidence.",
          contractReview: contractFindings,
          boqReview: boqFindings,
          riskNotes: notes,
          riskDocument: file
            ? {
                name: file.name,
                mimeType: file.type,
                sizeBytes: file.size,
                text: fileText
              }
            : undefined
        })
      });
      const payload = (await response.json().catch(() => null)) as RiskApiResponse | null;
      if (!response.ok || payload?.status === "failed") {
        setState("error");
        setResult(payload);
        setError(payload?.errors?.[0]?.message || "Risk Assessment failed safely.");
        return;
      }
      setState("success");
      setResult(payload);
    } catch (requestError) {
      setState("error");
      setError(requestError instanceof Error ? requestError.message : "Risk Assessment could not connect to VORA.");
    }
  }

  const assessment = result?.riskAssessment;

  return (<LocalizedContent locale={locale}>(
    <div className="space-y-6">
      <PageHeader
        eyebrow="VORA Intelligence"
        title="Risk Assessment"
        description="Generate a professional construction risk assessment from Contract Review, BOQ Review, and project notes using the existing VORA Intelligence Runtime."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge tone="gold">Risk Evidence</Badge>
                <h2 className="mt-3 text-2xl font-black text-ds-token-text">Supply existing findings</h2>
                <p className="mt-2 text-sm leading-7 text-ds-token-text/58">{inputNote}</p>
              </div>
              <Badge tone="blue">taskIntent: risk_assessment</Badge>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Textarea
                label="Contract Review findings"
                value={contractFindings}
                onChange={(event) => setContractFindings(event.target.value)}
                placeholder="Paste potential risks, missing contract information, payment issues, delay penalties, warranty concerns..."
              />
              <Textarea
                label="BOQ Review findings"
                value={boqFindings}
                onChange={(event) => setBoqFindings(event.target.value)}
                placeholder="Paste missing BOQ fields, duplicates, quantity/unit issues, rate/amount mismatches, cost risks..."
              />
            </div>

            <div className="mt-5">
              <Textarea
                label="Manual project notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Example: Permit approval is still pending. Supplier lead time may delay finishing works. Safety method statement is missing."
              />
            </div>

            <label className="group mt-5 grid min-h-44 cursor-pointer place-items-center rounded-[2rem] border border-dashed border-ds-token-gold/28 bg-ds-token-gold/8 p-6 text-center transition hover:border-ds-token-gold/48 hover:bg-ds-token-gold/12">
              <input
                type="file"
                accept=".txt,.md,.markdown,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => void chooseFile(event.target.files?.[0] || null)}
              />
              <span className="grid h-14 w-14 place-items-center rounded-3xl bg-ds-token-gold/12 text-ds-token-gold shadow-gold-glow transition group-hover:-translate-y-1">
                <UploadCloud className="h-6 w-6" />
              </span>
              <span className="mt-4 text-lg font-black text-ds-token-text">{file ? file.name : "Upload optional risk notes"}</span>
              <span className="mt-2 text-sm font-bold text-ds-token-text/48">TXT and Markdown include text. PDF and DOCX are metadata placeholders.</span>
            </label>

            {error && (
              <div className="mt-5">
                <Alert title="Risk Assessment could not continue" tone="danger">
                  {error}
                </Alert>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void submitAssessment()}
                disabled={state === "loading" || state === "reading"}
                icon={state === "loading" || state === "reading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
              >
                {state === "loading" ? "Assessing..." : state === "reading" ? "Reading file..." : "Run Risk Assessment"}
              </Button>
              <Badge tone="success">Runtime reused</Badge>
              <Badge tone="gold">No invented risks</Badge>
            </div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone={state === "success" ? "success" : "neutral"}>Structured Output</Badge>
                <h2 className="mt-3 text-2xl font-black text-ds-token-text">VORA Risk Assessment</h2>
              </div>
              {result?.provider && <Badge tone={result.usedMock ? "gold" : "blue"}>{result.provider} · {result.model || "model"}</Badge>}
            </div>

            {!assessment && state !== "success" && (
              <EmptyState
                title="No risk assessment yet"
                description="Supply evidence from Contract Review, BOQ Review, or notes, then run VORA."
                icon={<FileWarning className="h-7 w-7" />}
              />
            )}

            {assessment && (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <Metric label="Overall risk" value={assessment.overallRiskLevel || "medium"} />
                  <Metric label="Detected risks" value={String(assessment.detectedRisks?.length || 0)} />
                  <Metric label="High priority" value={String(assessment.highPriorityRisks?.length || 0)} />
                </div>
                <ReviewBlock title="Executive Summary">{assessment.executiveSummary || result?.summary || "VORA completed the risk assessment."}</ReviewBlock>
                <RiskMatrix entries={assessment.riskMatrix || []} />
                <RiskTable risks={assessment.detectedRisks || []} />
                <ReviewList title="Mitigation Actions" items={list(assessment.mitigationActions, "No mitigation action was generated from supplied evidence.")} />
                <ReviewList title="Recommended Follow-up" items={list(assessment.recommendedFollowUp, "No high-priority follow-up is required from the supplied evidence.")} />
                {!!assessment.warnings?.length && <WarningList warnings={assessment.warnings} />}
              </div>
            )}
          </GlassCard>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <GlassCard className="p-5">
            <Badge tone="blue">Assessment Readiness</Badge>
            <div className="mt-5 space-y-3">
              <StatusRow label="Contract findings" active={Boolean(contractFindings.trim())} />
              <StatusRow label="BOQ findings" active={Boolean(boqFindings.trim())} />
              <StatusRow label="Manual notes" active={Boolean(notes.trim() || file)} />
              <StatusRow label="Runtime route" active />
            </div>
            <div className="mt-5">
              <ProgressBar value={(Number(Boolean(contractFindings.trim())) + Number(Boolean(boqFindings.trim())) + Number(Boolean(notes.trim() || file))) * 33.34} label="Evidence readiness" tone="gold" />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="gold">Supported Categories</Badge>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Commercial", "Cost", "Planning", "Schedule", "Quality", "Safety", "Technical", "Documentation", "Compliance", "Procurement", "Execution"].map((category) => (
                <span key={category} className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs font-black text-ds-token-text/54">
                  {category}
                </span>
              ))}
            </div>
          </GlassCard>
        </aside>
      </section>
    </div>
  )</LocalizedContent>);
}

function Metric({ label, value }: { label: string; value: string }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <div className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-ds-token-text/42">{label}</p>
      <p className="mt-2 text-2xl font-black capitalize text-ds-token-text">{value}</p>
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

function ReviewBlock({ title, children }: { title: string; children?: React.ReactNode }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <h3 className="font-black text-ds-token-text">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-ds-token-text/68">{children}</p>
    </section>
  )</LocalizedContent>);
}

function RiskMatrix({ entries }: { entries: readonly RiskMatrixEntry[] }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <h3 className="font-black text-ds-token-text">Risk Matrix Summary</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {entries.length ? entries.map((entry) => (
          <div key={`${entry.probability}-${entry.impact}-${entry.priority}`} className="rounded-xl border border-ds-token-border bg-black/18 p-3 text-sm text-ds-token-text/68">
            <strong className="capitalize text-ds-token-text">{entry.priority}</strong>
            <p className="mt-1">Probability: {entry.probability} · Impact: {entry.impact} · Risks: {entry.riskCount}</p>
          </div>
        )) : <p className="text-sm text-ds-token-text/48">No matrix entries yet.</p>}
      </div>
    </section>
  )</LocalizedContent>);
}

function RiskTable({ risks }: { risks: readonly RiskItem[] }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <section className="rounded-2xl border border-ds-token-border bg-white/[0.045] p-4">
      <h3 className="font-black text-ds-token-text">Detected Risks</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-[760px] w-full text-start text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-ds-token-text/42">
            <tr>
              <th className="p-3 text-start">Risk</th>
              <th className="p-3 text-start">Category</th>
              <th className="p-3 text-start">Severity</th>
              <th className="p-3 text-start">Priority</th>
              <th className="p-3 text-start">Owner</th>
            </tr>
          </thead>
          <tbody>
            {risks.slice(0, 12).map((risk) => (
              <tr key={risk.id} className="border-t border-ds-token-border text-ds-token-text/68">
                <td className="p-3 font-bold text-ds-token-text">{risk.title}</td>
                <td className="p-3 capitalize">{risk.category.replace(/_/g, " ")}</td>
                <td className="p-3 capitalize">{risk.severity}</td>
                <td className="p-3 capitalize">{risk.priority}</td>
                <td className="p-3">{risk.recommendedOwner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

function WarningList({ warnings }: { warnings: readonly Readonly<{ code: string; message: string; severity: string }>[] }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>(
    <Alert title="Risk Assessment warnings" tone="warning">
      <ul className="mt-2 space-y-1">
        {warnings.slice(0, 6).map((warning) => (
          <li key={`${warning.code}-${warning.message}`}>{warning.message}</li>
        ))}
      </ul>
    </Alert>
  )</LocalizedContent>);
}
