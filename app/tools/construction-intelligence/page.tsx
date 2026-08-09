"use client";

import { useI18n } from "@/components/i18n-provider";
import { LocalizedContent } from "@/components/localized-content";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  Calculator,
  ClipboardList,
  FileSearch,
  FileText,
  Lock,
  Scale,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge, EmptyState, GlassCard, ProgressBar } from "@/components/ui";
import {
  constructionIntelligenceFeatures,
  getConstructionIntelligenceWorkspaceSummary,
  getLaunchableConstructionIntelligenceFeatures
} from "@/lib/construction-intelligence-workspace";
import { createAnalysisWorkflow } from "@/lib/analysis-workflow";
import { createProjectIntelligenceSession } from "@/lib/project-intelligence";

const featureIcons = {
  "contract-review": Scale,
  "boq-review": Calculator,
  "risk-assessment": ShieldAlert,
  "planning-review": CalendarDays,
  "site-report-review": ClipboardList,
  "executive-summary": FileText
};

const recentAnalyses = [
  { title: "Contract Review", detail: "Available from the dedicated Contract Review flow.", status: "Ready" },
  { title: "BOQ Review", detail: "Available from the dedicated BOQ Review flow.", status: "Ready" },
  { title: "Risk Assessment", detail: "Combines Contract Review, BOQ Review, and project notes into a structured risk register.", status: "Ready" },
  { title: "Planning Review", detail: "Reviews planning activities, milestones, dependencies, and ownership gaps.", status: "Ready" },
  { title: "Site Report Review", detail: "Reviews supplied site observations, safety and quality findings, documentation gaps, and follow-up items.", status: "Ready" },
  { title: "Executive Summary", detail: "Aggregates completed analyses into one executive report without inventing missing findings.", status: "Ready" },
  { title: "History integration", detail: "Saved analysis history remains available through the existing History area.", status: "Preserved" }
];

export default function ConstructionIntelligencePage() {
  const { locale } = useI18n();
  const summary = getConstructionIntelligenceWorkspaceSummary();
  const launchableFeatures = getLaunchableConstructionIntelligenceFeatures();
  const recentProjectSession = createProjectIntelligenceSession({
    projectId: "PRJ-1048",
    projectTitle: "Luxury Villa Casablanca",
    now: new Date("2026-07-24T00:00:00.000Z")
  });
  const workflow = createAnalysisWorkflow(recentProjectSession);

  return (<LocalizedContent locale={locale}>
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(214,179,106,.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(56,189,248,.14),transparent_32%),linear-gradient(135deg,rgba(8,9,10,.96),rgba(12,18,27,.92))] p-5 shadow-ds-lg sm:p-7">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#D6B36A]/60 to-transparent" />
        <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <Link href="/tools" className="inline-flex items-center gap-2 text-sm font-black text-ds-token-text/58 transition hover:text-ds-token-gold">
              <ArrowLeft className="h-4 w-4" />
              Back to VORA tools
            </Link>
            <div className="mt-8 flex flex-wrap gap-2">
              <Badge tone="gold">VORA Intelligence Runtime</Badge>
              <Badge tone="success">Active Features: {summary.activeFeatures}</Badge>
              <Badge tone="blue">Provider Ready</Badge>
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-white sm:text-6xl">
              Construction Intelligence
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-ds-token-text/62 sm:text-lg">
              A central workspace for VORA document intelligence. Launch Contract Review, BOQ Review, Risk Assessment, Planning Review, Site Report Review, and Executive Summary from one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {launchableFeatures.map((feature) => (
                <Link
                  key={feature.id}
                  href={feature.href || "/tools/construction-intelligence"}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gold-linear px-5 text-sm font-black text-black shadow-gold-glow transition hover:-translate-y-0.5"
                >
                  <Sparkles className="h-4 w-4" />
                  Launch {feature.title}
                </Link>
              ))}
            </div>
          </div>

          <GlassCard className="p-5" delay={0.08}>
            <Badge tone="blue">Runtime Status</Badge>
            <div className="mt-5 grid gap-3">
              <StatusRow label="Runtime" value={summary.supportedRuntime} tone="success" />
              <StatusRow label="Provider mode" value={summary.providerMode} tone="blue" />
              <StatusRow label="Execution path" value="/api/generate preserved" tone="gold" />
              <StatusRow label="Architecture" value="No duplicate AI logic" tone="neutral" />
            </div>
            <div className="mt-5">
              <ProgressBar value={86} label="Workspace readiness" tone="gold" />
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BrainCircuit} label="Runtime Layers" value="9" detail="Context, memory, reasoning, decision, reports, recommendations, prompts, policies, providers" />
        <MetricCard icon={BadgeCheck} label="Active Tools" value={String(summary.activeFeatures)} detail="Implemented document intelligence reviews are ready to launch." />
        <MetricCard icon={Lock} label="Coming Soon" value={String(summary.comingSoonFeatures)} detail="Disabled safely with no navigation errors." />
        <MetricCard icon={Activity} label="Mode" value="Mock / OpenAI" detail="Existing provider behavior is preserved." />
      </section>

      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="blue">Current Workflow Progress</Badge>
              <Badge tone={workflow.completionPercentage >= 100 ? "success" : "gold"}>{workflow.completionPercentage}% complete</Badge>
              <Badge tone="neutral">{workflow.overallHealth}</Badge>
            </div>
            <h2 className="mt-3 text-2xl font-black text-white">Recent Project Session</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-ds-token-text/58">
              Continue the guided analysis for {recentProjectSession.project.title}. Next action: {workflow.nextAction.label}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/projects/PRJ-1048/intelligence" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gold-linear px-5 text-sm font-black text-black shadow-gold-glow transition hover:-translate-y-0.5">
              <BrainCircuit className="h-4 w-4" />
              Quick Resume
            </Link>
            {workflow.nextAction.route && (
              <Link href={workflow.nextAction.route} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:border-[#D6B36A]/30">
                <Sparkles className="h-4 w-4" />
                Continue Analysis
              </Link>
            )}
          </div>
        </div>
        <div className="mt-5">
          <ProgressBar value={workflow.completionPercentage} label="Implemented analysis progress" tone="blue" />
        </div>
      </GlassCard>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <GlassCard className="p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge tone="gold">Feature Grid</Badge>
              <h2 className="mt-2 text-2xl font-black text-white">VORA Construction Intelligence Tools</h2>
            </div>
            <Badge tone="success">Existing features reused</Badge>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {constructionIntelligenceFeatures.map((feature, index) => {
              const Icon = featureIcons[feature.id as keyof typeof featureIcons] || FileSearch;
              return <FeatureCard key={feature.id} feature={feature} icon={<Icon className="h-5 w-5" />} index={index} />;
            })}
          </div>
        </GlassCard>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <GlassCard className="p-5">
            <Badge tone="blue">Quick Actions</Badge>
            <div className="mt-4 grid gap-3">
              <QuickAction href="/tools/contract-review" icon={<Scale className="h-4 w-4" />} title="Review a contract" />
              <QuickAction href="/tools/boq-review" icon={<Calculator className="h-4 w-4" />} title="Review a BOQ" />
              <QuickAction href="/tools/risk-assessment" icon={<ShieldAlert className="h-4 w-4" />} title="Assess project risk" />
              <QuickAction href="/tools/planning-review" icon={<CalendarDays className="h-4 w-4" />} title="Review planning" />
              <QuickAction href="/tools/site-report-review" icon={<ClipboardList className="h-4 w-4" />} title="Review site report" />
              <QuickAction href="/tools/executive-summary" icon={<FileText className="h-4 w-4" />} title="Generate executive summary" />
              <QuickAction href="/projects/PRJ-1048/intelligence" icon={<BrainCircuit className="h-4 w-4" />} title="Open project session" />
              <QuickAction href="/history" icon={<BarChart3 className="h-4 w-4" />} title="Open history" />
              <QuickAction href="/tools" icon={<BrainCircuit className="h-4 w-4" />} title="Back to VORA tools" />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="neutral">Recent Analyses</Badge>
            <div className="mt-5 grid gap-3">
              {recentAnalyses.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-white">{item.title}</p>
                    <Badge tone={item.status === "Ready" ? "success" : "blue"}>{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-ds-token-text/48">{item.detail}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <EmptyState
            title="Document history remains unchanged"
            description="Saved outputs and history continue to use the existing application flow. This workspace only centralizes entry points."
            icon={<FileSearch className="h-7 w-7" />}
          />
        </aside>
      </section>
    </div>
  </LocalizedContent>);
}

function FeatureCard({
  feature,
  icon,
  index
}: {
  feature: (typeof constructionIntelligenceFeatures)[number];
  icon: ReactNode;
  index: number;
}) {
  const { locale } = useI18n();
  const isActive = feature.status === "active" && Boolean(feature.href);

  return (<LocalizedContent locale={locale}>
    <GlassCard className="flex min-h-[280px] flex-col p-5" delay={index * 0.04}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#D6B36A]/20 bg-[#D6B36A]/12 text-[#D6B36A] shadow-gold-glow">
          {icon}
        </span>
        <Badge tone={isActive ? "success" : "neutral"}>{isActive ? "Active" : "Coming Soon"}</Badge>
      </div>
      <h3 className="mt-5 text-xl font-black text-white">{feature.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-7 text-ds-token-text/56">{feature.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {feature.supportedFiles.map((file) => (
          <span key={file} className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-[11px] font-black text-ds-token-text/54">
            {file}
          </span>
        ))}
      </div>
      {isActive ? (
        <Link
          href={feature.href || "/tools/construction-intelligence"}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#D6B36A]/24 bg-[#D6B36A]/12 px-4 text-sm font-black text-[#F8E6B0] transition hover:-translate-y-0.5 hover:bg-[#D6B36A]/18"
        >
          Launch
          <ArrowLeft className="h-4 w-4" />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="mt-5 inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm font-black text-ds-token-text/36"
        >
          Coming Soon
          <Lock className="h-4 w-4" />
        </button>
      )}
    </GlassCard>
  </LocalizedContent>);
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>
    <GlassCard className="p-5">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#38BDF8]/12 text-[#7DD3FC]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-ds-token-text/42">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-ds-token-text/48">{detail}</p>
    </GlassCard>
  </LocalizedContent>);
}

function QuickAction({ href, icon, title }: { href: string; icon: ReactNode; title: string }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 font-black text-white transition hover:-translate-y-0.5 hover:border-[#D6B36A]/28 hover:bg-white/[0.07]">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#D6B36A]/12 text-[#D6B36A]">{icon}</span>
      {title}
    </Link>
  </LocalizedContent>);
}

function StatusRow({ label, value, tone }: { label: string; value: string; tone: "success" | "blue" | "gold" | "neutral" }) {
  const { locale } = useI18n();
  return (<LocalizedContent locale={locale}>
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-[0.12em] text-ds-token-text/42">{label}</span>
        <Badge tone={tone}>OK</Badge>
      </div>
      <p className="text-sm font-black text-white">{value}</p>
    </div>
  </LocalizedContent>);
}
