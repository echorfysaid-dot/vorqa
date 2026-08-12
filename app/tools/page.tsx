�r�^�f��ئ{m�y�'vî���"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bot,
  BrainCircuit,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  FileSearch,
  FileText,
  FolderKanban,
  History,
  MessageSquareText,
  Plus,
  Scale,
  Search,
  Sparkles,
  UploadCloud
} from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar, SkeletonCard, ToolCard } from "@/components/ui";
import { BlueprintOverlay, VoraVisual } from "@/components/vorqa-official-visuals";
import { authFetch } from "@/lib/auth-client";
import { tools } from "@/lib/tools";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

const cardTools = tools.map(({ icon, ...tool }) => tool);

const suggestedPrompts = [
  { title: "Analyze this project", text: "Extract risks, opportunities, and recommended next steps.", href: "/tools/document", icon: BrainCircuit },
  { title: "Create project schedule", text: "Turn the project phases into an execution schedule.", href: "/tools/planning-review", icon: CalendarDays },
  { title: "Generate BOQ", text: "Prepare a structured draft bill of quantities.", href: "/tools/document", icon: ClipboardList },
  { title: "Review BOQ", text: "Review the bill of quantities for gaps and duplicates.", href: "/tools/boq-review", icon: Calculator },
  { title: "Risk assessment", text: "Assess project risks and potential delays.", href: "/tools/risk-assessment", icon: AlertTriangle },
  { title: "Create report", text: "Create an executive report for management.", href: "/tools/document", icon: FileText },
  { title: "Review contract", text: "Review a construction contract for risks and missing information.", href: "/tools/contract-review", icon: Scale },
  { title: "Create meeting summary", text: "Turn the team meeting into actionable points.", href: "/tools/marketing", icon: MessageSquareText }
];

const quickTools = [
  { title: "Upload document", href: "/projects#knowledge", icon: UploadCloud },
  { title: "New conversation", href: "/tools", icon: Plus },
  { title: "Generate document", href: "/tools/document", icon: FileText },
  { title: "Search knowledge", href: "/projects#knowledge", icon: Search },
  { title: "Open history", href: "/history", icon: History }
];

const messages = [
  { role: "assistant", text: "مرحباً، أنا VORA. أرى أنك داخل مساحة أدوات الذكاء الاصطناعي. كيف تريد أن أساعدك اليوم؟", time: "09:42" },
  { role: "user", text: "أحتاج تقريراً تنفيذياً عن تقدم مشروع الفيلا.", time: "09:43" },
  { role: "assistant", text: "ممتاز. أستطيع توليد تقرير منظم يشمل الملخص التنفيذي، المخاطر، الميزانية، الجدول الزمني، والخطوات التالية.", time: "09:43" }
];

const memory = [
  { title: "Recent conversation", text: "تحليل مخاطر مشروع الفيلا", icon: MessageSquareText },
  { title: "Recent output", text: "تقرير تنفيذي أسبوعي", icon: FileText },
  { title: "Recent report", text: "Budget health summary", icon: BarChart3 },
  { title: "Favorite prompt", text: "Create project schedule", icon: Sparkles }
];

export default function ToolsPage() {
  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <VoraHeader />
      <ConstructionIntelligenceGateway />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <ConversationExperience />
          <SuggestedPrompts />
          <ToolLibrary />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <ContextPanel />
          <AiMemoryPanel />
          <QuickToolsPanel />
        </aside>
      </section>
    </div>
  </AutoLocalizedContent>);
}

function ConstructionIntelligenceGateway() {
  return (<AutoLocalizedContent>
    <GlassCard className="relative overflow-hidden p-5 sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(214,179,106,.14),transparent_28%),radial-gradient(circle_at_86%_16%,rgba(56,189,248,.12),transparent_30%)]" />
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl border border-[#D4AF37]/24 bg-[#D4AF37]/12 text-gold shadow-gold-glow">
            <BrainCircuit className="h-7 w-7" />
          </span>
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="gold">Primary Workspace</Badge>
              <Badge tone="success">Contract + BOQ + Risk + Planning ready</Badge>
              <Badge tone="blue">VORA Runtime</Badge>
            </div>
            <h2 className="mt-3 text-2xl font-black text-white">Construction Intelligence</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-ds-token-text/58">
              One workspace for contract reviews, bills of quantities, and VORA construction tools without changing existing workflows.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/tools/construction-intelligence" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gold-linear px-5 text-sm font-black text-black shadow-gold-glow transition hover:-translate-y-0.5">
            <Sparkles className="h-4 w-4" />
            Open Workspace
          </Link>
          <Link href="/tools/contract-review" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-[#D4AF37]/30">
            <Scale className="h-4 w-4" />
            Contract Review
          </Link>
          <Link href="/tools/boq-review" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-[#38BDF8]/30">
            <Calculator className="h-4 w-4" />
            BOQ Review
          </Link>
          <Link href="/tools/risk-assessment" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-red-300/30">
            <AlertTriangle className="h-4 w-4" />
            Risk Assessment
          </Link>
          <Link href="/tools/planning-review" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-[#38BDF8]/30">
            <CalendarDays className="h-4 w-4" />
            Planning Review
          </Link>
        </div>
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function VoraHeader() {
  return (<AutoLocalizedContent>
    <GlassCard className="relative overflow-hidden p-5 sm:p-6">
      <BlueprintOverlay className="opacity-25" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(215,180,90,.16),transparent_28%),radial-gradient(circle_at_82%_10%,rgba(81,216,255,.16),transparent_30%)]" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-5">
          <div className="relative">
            <VoraVisual variant="avatar" className="h-24 w-24 rounded-[2rem]" sizes="96px" priority />
            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-[#0B1120] bg-[#22C783] shadow-[0_0_24px_rgba(34,199,131,.72)]" />
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">Online</Badge>
              <Badge tone="blue">AI Status: Ready</Badge>
              <Badge tone="gold">VORA Enterprise</Badge>
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">VORA AI Workspace</h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-ds-text/62">
              مساحة ذكاء اصطناعي احترافية لتحليل المشاريع، إنشاء الوثائق، قراءة السياق، وتجهيز المخرجات التنفيذية.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
          <HeaderContext label="Workspace context" value="Construction Command Center" />
          <HeaderContext label="Current project" value="PRJ-1048 · Villa" />
          <HeaderContext label="Selected language" value="العربية" />
          <HeaderContext label="AI mode" value="Project-aware" />
        </div>
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function ConversationExperience() {
  const [request, setRequest] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [meta, setMeta] = useState<{ provider?: string; usedMock?: boolean; warnings?: number }>({});

  async function submitVora(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request.trim()) return;
    setStatus("loading");
    setOutput("");
    setMeta({});
    try {
      const response = await authFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          mode: "vora_intelligence",
          userRequest: request,
          taskIntent: "general_assistance",
          provider: "mock",
          projectId: "PRJ-1048"
        })
      });
      const result = await response.json().catch(() => ({ error: "VORA returned an unreadable response." }));
      if (!response.ok || result.status === "failed") {
        setStatus("error");
        setOutput(result.errors?.[0]?.message || result.error || "VORA intelligence failed safely.");
        setMeta({ provider: result.provider, usedMock: result.usedMock, warnings: result.warnings?.length || 0 });
        return;
      }
      setStatus("success");
      setOutput(result.content || result.summary || "VORA completed the intelligence run.");
      setMeta({ provider: result.provider, usedMock: result.usedMock, warnings: result.warnings?.length || 0 });
    } catch (error) {
      setStatus("error");
      setOutput(error instanceof Error ? error.message : "VORA request failed.");
    }
  }

  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge tone="gold">Conversation</Badge>
          <h2 className="mt-2 text-2xl font-black text-white">محادثة VORA</h2>
        </div>
        <Badge tone="blue">UI typing simulation</Badge>
      </div>

      <div className="min-h-[440px] rounded-[2rem] border border-white/10 bg-black/22 p-4">
        <div className="grid gap-4">
          {messages.map((message, index) => (
            <motion.div
              key={`${message.role}-${index}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[82%] rounded-[1.5rem] border px-4 py-3 shadow-ds-sm ${message.role === "user" ? "border-[#4F8CFF]/20 bg-[#4F8CFF]/14 text-[#dce8ff]" : "border-[#D4AF37]/18 bg-[#D4AF37]/10 text-[#f8efd7]"}`}>
                <div className="mb-2 flex items-center gap-2">
                  {message.role === "assistant" ? <Bot className="h-4 w-4 text-gold" /> : <MessageSquareText className="h-4 w-4 text-blue" />}
                  <span className="text-xs font-black text-ds-text/44">{message.role === "assistant" ? "VORA" : "You"} · {message.time}</span>
                </div>
                <p className="text-sm leading-7">{message.text}</p>
              </div>
            </motion.div>
          ))}

          <div className="flex justify-start">
            <div className="rounded-[1.5rem] border border-[#D4AF37]/18 bg-[#D4AF37]/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:-.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gold [animation-delay:-.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gold" />
                <span className="ms-2 text-xs font-black text-ds-text/48">VORA is typing...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {output && (
        <div className={`mt-4 rounded-2xl border p-4 text-sm leading-7 ${status === "error" ? "border-red-400/20 bg-red-500/10 text-red-100" : "border-[#51D8FF]/20 bg-[#51D8FF]/10 text-[#e4f7ff]"}`}>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone={status === "error" ? "warning" : "success"}>{status === "error" ? "Failed safely" : "VORA Intelligence"}</Badge>
            {meta.provider && <Badge tone="blue">Provider: {meta.provider}</Badge>}
            {meta.usedMock && <Badge tone="gold">Mock used</Badge>}
            {typeof meta.warnings === "number" && meta.warnings > 0 && <Badge tone="warning">{meta.warnings} warnings</Badge>}
          </div>
          <pre className="whitespace-pre-wrap font-sans">{output}</pre>
        </div>
      )}

      <form onSubmit={submitVora} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 shadow-inner shadow-black/20">
          <Sparkles className="h-5 w-5 text-gold" />
          <input
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            placeholder="Start your first conversation with VORA..."
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-ds-text outline-none placeholder:text-ds-text/42"
          />
        </label>
        <Button type="submit" disabled={status === "loading"} className="w-full sm:w-auto" icon={<ArrowLeft className="h-4 w-4" />}>
          {status === "loading" ? "VORA running..." : "Ask VORA"}
        </Button>
      </form>
    </GlassCard>
  </AutoLocalizedContent>);
}

function SuggestedPrompts() {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <Badge tone="blue">Suggested Prompts</Badge>
          <h2 className="mt-2 text-2xl font-black text-white">اقتراحات جاهزة</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {suggestedPrompts.map((prompt) => {
          const Icon = prompt.icon;
          return (
            <Link key={prompt.title} href={prompt.href} className="group rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-1 hover:border-[#D4AF37]/30 hover:bg-white/[0.07]">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#D4AF37]/12 text-gold transition group-hover:-rotate-6">
                <Icon className="h-5 w-5" />
              </span>
              <span className="mt-4 block font-black text-white">{prompt.title}</span>
              <span className="mt-2 block text-xs leading-5 text-ds-text/48">{prompt.text}</span>
            </Link>
          );
        })}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function ContextPanel() {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <Badge tone="gold">Context Panel</Badge>
      <h2 className="mt-3 text-xl font-black text-white">سياق العمل</h2>
      <div className="mt-5 grid gap-3">
        <ContextRow label="Current project" value="PRJ-1048 · Villa" />
        <ContextRow label="Uploaded documents" value="24 files" />
        <ContextRow label="Active knowledge" value="Enabled" />
        <ContextRow label="Selected language" value="العربية" />
        <ContextRow label="AI mode" value="Project-aware" />
      </div>
      <div className="mt-5">
        <ProgressBar value={72} label="Context readiness" tone="blue" />
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function AiMemoryPanel() {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <Badge tone="blue">AI Memory</Badge>
      <h2 className="mt-3 text-xl font-black text-white">ذاكرة VORA</h2>
      <div className="mt-5 grid gap-4">
        {memory.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#D4AF37]/12 text-gold">
                  <Icon className="h-4 w-4" />
                </span>
                {index < memory.length - 1 && <span className="mt-2 h-full w-px bg-gradient-to-b from-[#D4AF37]/55 to-transparent" />}
              </div>
              <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <p className="font-black text-white">{item.title}</p>
                <p className="mt-1 truncate text-xs font-bold text-ds-text/46">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function QuickToolsPanel() {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <Badge tone="gold">Quick Tools</Badge>
      <div className="mt-4 grid gap-3">
        {quickTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.title} href={tool.href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/28 hover:bg-white/[0.065]">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#D4AF37]/12 text-gold">
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-black text-white">{tool.title}</span>
            </Link>
          );
        })}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function ToolLibrary() {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge tone="neutral">Tool Library</Badge>
          <h2 className="mt-2 text-2xl font-black text-white">مولدات VORA الحالية</h2>
        </div>
        <Badge tone="success">Existing functionality preserved</Badge>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cardTools.map((tool, index) => (
          <ToolCard key={tool.slug} tool={tool} index={index} />
        ))}
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <EmptyState title="Start your first conversation with VORA" description="اختر prompt جاهز أو افتح مولد الوثائق لتبدأ مخرجاً منظماً." />
        <SkeletonCard />
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function HeaderContext({ label, value }: { label: string; value: string }) {
  return (<AutoLocalizedContent>
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <p className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</p>
      <p className="mt-1 truncate font-black text-white">{value}</p>
    </div>
  </AutoLocalizedContent>);
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (<AutoLocalizedContent>
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <span className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</span>
      <span className="max-w-[55%] truncate text-sm font-black text-white">{value}</span>
    </div>
  </AutoLocalizedContent>);
}
