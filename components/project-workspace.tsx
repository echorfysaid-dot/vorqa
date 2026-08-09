"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coins,
  Download,
  FileArchive,
  FileText,
  FolderKanban,
  Gauge,
  Grid2X2,
  Hash,
  Lightbulb,
  List,
  LockKeyhole,
  MessageSquareText,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  UploadCloud,
  UsersRound
} from "lucide-react";
import { KnowledgeWorkspace } from "@/components/knowledge-workspace";
import { useI18n } from "@/components/i18n-provider";
import { LocalizedContent } from "@/components/localized-content";
import { Avatar, Badge, Button, ChartContainer, ChatBubble, Dropdown, EmptyState, GlassCard, IconButton, Input, PageHeader, ProgressBar, Table, Tabs, Textarea, TimelineCard } from "@/components/ui";
import { BlueprintOverlay, VillaVisual, VoraVisual } from "@/components/vorqa-official-visuals";
import type { AnalyticsChartPoint, BudgetCategory, BudgetCategoryInput, BudgetItemStatus, BudgetPriority, DependencyType, Document, DocumentUploadInput, KnowledgeArticle, KnowledgeArticleInput, ProjectBudgetItem, ProjectBudgetItemInput, ProjectDetails, ProjectDocumentCategory, ProjectDocumentInput, Task, TaskDependency, TaskDependencyInput, TaskInput, TaskPriority, TaskStatus, TimelineMilestone, TimelineMilestoneInput, MilestoneStatus } from "@/lib/models";
import { budgetRepository, documentRepository, knowledgeRepository, projectRepository, taskRepository, timelineRepository } from "@/lib/repositories";
import { budgetItemStatuses, budgetPriorities } from "@/lib/repositories/budgetMapper";
import { useBudgetRepository } from "@/lib/repositories/budgetHooks";
import { useAnalyticsSummary } from "@/lib/repositories/analyticsHooks";
import { documentCategories } from "@/lib/repositories/documentMapper";
import { useDocumentsRepository } from "@/lib/repositories/documentHooks";
import { useKnowledgeRepository } from "@/lib/repositories/knowledgeHooks";
import { knowledgeCategories, knowledgeStatuses } from "@/lib/repositories/knowledgeMapper";
import { useDepartmentsRepository } from "@/lib/repositories/departmentHooks";
import { useEmployeesRepository } from "@/lib/repositories/employeeHooks";
import { taskPriorities, taskStatuses } from "@/lib/repositories/taskMapper";
import { useTasksRepository } from "@/lib/repositories/taskHooks";
import { dependencyTypes, milestoneStatuses } from "@/lib/repositories/timelineMapper";
import { useTimelineRepository } from "@/lib/repositories/timelineHooks";
import { voraSkills } from "@/lib/vora-ai-skills";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

type ProjectWorkspaceProject = {
  id: string;
  title: string;
  type: string;
  status: string;
  updatedAt: string;
  score: number;
  organizationId?: string;
  departmentId?: string;
  projectManagerId?: string;
};

type ProjectDetail = Omit<ProjectDetails, "team"> & {
  team: Array<{ name: string; role: string; status: string; workload: number; tasks: number }>;
};

const emptyProjectDetail: ProjectDetail = {
  location: "",
  budgetPlanned: "",
  actualCost: "",
  remainingBudget: "",
  budgetHealth: 0,
  timelineHealth: 0,
  documents: [],
  knowledgeFiles: [],
  reports: [],
  aiHistory: [],
  tasks: [],
  milestones: [],
  team: []
};

const workspaceTabs = [
  { value: "overview", label: "Overview", icon: <Gauge className="h-4 w-4" /> },
  { value: "execution", label: "Execution", icon: <CheckCircle2 className="h-4 w-4" /> },
  { value: "timeline", label: "Timeline", icon: <CalendarDays className="h-4 w-4" /> },
  { value: "budget", label: "Budget", icon: <Coins className="h-4 w-4" /> },
  { value: "documents", label: "Documents", icon: <FileText className="h-4 w-4" /> },
  { value: "team", label: "Contractors", icon: <UsersRound className="h-4 w-4" /> },
  { value: "approvals", label: "Approvals", icon: <CheckCircle2 className="h-4 w-4" /> },
  { value: "reports", label: "Reports", icon: <BarChart3 className="h-4 w-4" /> },
  { value: "ai", label: "VORA", icon: <Bot className="h-4 w-4" /> },
  { value: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> }
];

export const ProjectWorkspace = memo(function ProjectWorkspace({ project }: { project: ProjectWorkspaceProject }) {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState("overview");
  const [documentSection, setDocumentSection] = useState<"documents" | "knowledge">("documents");
  const detail = (projectRepository.getDetails(project.id) as unknown as ProjectDetail | undefined) || emptyProjectDetail;

  const projectActivity = useMemo(
    () => [
      { title: "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ø§Ù„Ù…Ø´Ø±ÙˆØ¹", text: `${project.status} Â· ${project.updatedAt}`, icon: <CheckCircle2 className="h-4 w-4" /> },
      { title: "VORA Ø±Ø§Ø¬Ø¹Øª Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ø¹Ù…Ù„", text: detail?.aiHistory[0] || "ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ ØºÙŠØ± Ù…ØªØ§Ø­Ø© Ø¨Ø¹Ø¯.", icon: <Bot className="h-4 w-4" /> },
      { title: "Ø¬Ø§Ù‡Ø² Ù„Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ©", text: detail?.tasks[0] || "Ø§Ø±Ø¨Ø· Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ù‚Ø¨Ù„ Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°.", icon: <Clock3 className="h-4 w-4" /> }
    ],
    [detail?.aiHistory, detail?.tasks, project.status, project.updatedAt]
  );

  return (
    <LocalizedContent locale={locale}><div className="mx-auto max-w-[1480px] space-y-5">
      <PageHeader
        eyebrow="Project Workspace"
        title={project.title}
        description={`${project.type} Â· Updated ${project.updatedAt}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/projects">
              <Button variant="secondary">All projects</Button>
            </Link>
            <Link href={`/projects/${encodeURIComponent(project.id)}/intelligence`}>
              <Button icon={<Sparkles className="h-4 w-4" />}>Ask VORA</Button>
            </Link>
          </div>
        }
      />

      <div className="grid overflow-hidden rounded-ds-lg border border-ds-token-border bg-ds-token-surface sm:grid-cols-3">
        <WorkspaceSignal label="Project health" value={`${project.score}%`} tone={project.score >= 70 ? "success" : "warning"} />
        <WorkspaceSignal label="Next milestone" value={detail.tasks[0] || "No milestone available"} />
        <WorkspaceSignal label="Status" value={project.status} />
      </div>

      <section className="hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ds-token-gold/55 to-transparent" />
        <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
          <div className="relative min-h-[380px] overflow-hidden rounded-ds-xl border border-ds-token-border bg-black/22">
            <VillaVisual variant="project" className="absolute inset-0 h-full w-full rounded-none" imageClassName="object-cover" priority sizes="(max-width: 1280px) 100vw, 760px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/22 to-black/5" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <Badge tone="gold">{project.status}</Badge>
                  <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">{project.title}</h2>
                  <p className="mt-2 text-sm font-bold text-ds-text/58">{project.type} Â· Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ« {project.updatedAt}</p>
                </div>
                <div className="w-full max-w-sm rounded-ds-lg border border-ds-token-gold/22 bg-black/62 p-4 backdrop-blur-md">
                  <ProgressBar value={project.score} label="ØªÙ‚Ø¯Ù… Ø§Ù„Ù…Ø´Ø±ÙˆØ¹" />
                </div>
              </div>
            </div>
          </div>

          <GlassCard className="relative overflow-hidden p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Badge tone="blue">VORA Insight</Badge>
                <h3 className="mt-3 text-2xl font-black text-white">Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„Ø£Ù†Ø³Ø¨ Ø§Ù„Ø¢Ù†</h3>
              </div>
              <VoraVisual variant="avatar" className="h-16 w-16 rounded-ds-lg" sizes="64px" />
            </div>
            <p className="mt-5 text-sm leading-7 text-ds-text/62">
              {detail.aiHistory[1]} Ø±ÙƒÙ‘Ø² Ø¹Ù„Ù‰ ØªØ«Ø¨ÙŠØª Ø§Ù„ÙˆØ«Ø§Ø¦Ù‚ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© ÙˆØ±Ø¨Ø· Ù…Ù„ÙØ§Øª Ø§Ù„Ù…Ø¹Ø±ÙØ© Ù‚Ø¨Ù„ ØªÙˆÙ„ÙŠØ¯ ØªÙ‚Ø±ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ° Ø§Ù„ØªØ§Ù„ÙŠ.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniMetric label="Ø§Ù„ÙˆØ«Ø§Ø¦Ù‚" value={String(detail.documents.length)} icon={<FileText className="h-5 w-5" />} />
              <MiniMetric label="Ø§Ù„ÙØ±ÙŠÙ‚" value={String(detail.team.length)} icon={<UsersRound className="h-5 w-5" />} />
              <MiniMetric label="Ø§Ù„Ù…Ø®Ø§Ø·Ø±" value={detail.reports.length > 2 ? "2" : "1"} icon={<ShieldAlert className="h-5 w-5" />} />
              <MiniMetric label="Ø§Ù„Ø¬Ø§Ù‡Ø²ÙŠØ©" value={`${project.score}%`} icon={<Gauge className="h-5 w-5" />} />
            </div>
          </GlassCard>
        </div>
      </section>

      <nav aria-label="Project workspace" className="overflow-x-auto border-b border-ds-token-border pb-2">
        <div className="min-w-max">
          <Tabs tabs={workspaceTabs} active={activeTab} onChange={setActiveTab} />
        </div>
      </nav>

      {activeTab === "overview" ? (
        <OverviewTab project={project} activity={projectActivity} />
      ) : activeTab === "ai" ? (
        <AiWorkspaceTab project={project} />
      ) : activeTab === "documents" ? (
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-ds-token-border pb-3">
            <Button size="sm" variant={documentSection === "documents" ? "primary" : "ghost"} onClick={() => setDocumentSection("documents")}>Documents</Button>
            <Button size="sm" variant={documentSection === "knowledge" ? "primary" : "ghost"} onClick={() => setDocumentSection("knowledge")}>Knowledge</Button>
          </div>
          {documentSection === "documents" ? <DocumentsTab project={project} /> : <KnowledgeTab project={project} />}
        </div>
      ) : activeTab === "budget" ? (
        <BudgetTab project={project} detail={detail} />
      ) : activeTab === "execution" ? (
        <TasksTab project={project} />
      ) : activeTab === "timeline" ? (
        <TimelineTab project={project} />
      ) : activeTab === "team" ? (
        <TeamTab project={project} detail={detail} />
      ) : activeTab === "approvals" ? (
        <WorkspaceTabScaffold tab="approvals" project={project} />
      ) : activeTab === "reports" ? (
        <ReportsTab project={project} detail={detail} />
      ) : activeTab === "settings" ? (
        <SettingsTab project={project} />
      ) : (
        <WorkspaceTabScaffold tab={activeTab} project={project} />
      )}
    </div></LocalizedContent>
  );
});

function WorkspaceSignal({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "success" | "warning" }) {
  const valueClass = tone === "success" ? "text-ds-token-success" : tone === "warning" ? "text-ds-token-warning" : "text-ds-token-text";
  return (
    <div className="min-w-0 border-b border-ds-token-border px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-e">
      <p className="text-xs font-medium text-ds-token-muted">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function MissingProjectDetailState({ project }: { project: ProjectWorkspaceProject }) {
  const { locale } = useI18n();
  return (
    <LocalizedContent locale={locale}><div className="space-y-6">
      <PageHeader
        eyebrow="Project Workspace"
        title={project.title}
        description="Ù‡Ø°Ø§ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ù…ÙˆØ¬ÙˆØ¯ØŒ Ù„ÙƒÙ† ØªÙØ§ØµÙŠÙ„ Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ø¹Ù…Ù„ ØºÙŠØ± Ù…ØªØ§Ø­Ø© ÙÙŠ Ù…ØµØ¯Ø± Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø­Ø§Ù„ÙŠ. Ù„Ù… ÙŠØªÙ… Ø§Ø³ØªØ¨Ø¯Ø§Ù„Ù‡ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø¨Ù…Ø´Ø±ÙˆØ¹ ØªØ¬Ø±ÙŠØ¨ÙŠ Ø¢Ø®Ø±."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/projects">
              <Button variant="secondary">ÙƒÙ„ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹</Button>
            </Link>
            <Link href="/tools/document">
              <Button icon={<Sparkles className="h-4 w-4" />}>Ø§Ø³Ø£Ù„ VORA</Button>
            </Link>
          </div>
        }
      />
      <GlassCard className="relative overflow-hidden p-6">
        <BlueprintOverlay className="opacity-25" />
        <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_.7fr]">
          <div>
            <Badge tone="warning">Missing workspace data</Badge>
            <h2 className="mt-4 text-2xl font-black text-white">Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ø¹Ù…Ù„ ØªØ­ØªØ§Ø¬ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø´Ø±ÙˆØ¹ ØµØ±ÙŠØ­Ø©</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ds-text/62">
              Ø­ÙØ§Ø¸Ø§Ù‹ Ø¹Ù„Ù‰ ÙˆØ¶ÙˆØ­ Ø§Ù„Ù…Ù†ØªØ¬ØŒ Ù„Ù… ØªØ¹Ø¯ Vorqa ØªØ¹Ø±Ø¶ Ø¨ÙŠØ§Ù†Ø§Øª PRJ-1048 Ø¨ØµÙ…Øª Ø¹Ù†Ø¯Ù…Ø§ Ù„Ø§ ØªØªÙˆÙØ± ØªÙØ§ØµÙŠÙ„ Ù‡Ø°Ø§ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹. ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø±Ø¬ÙˆØ¹ Ø¥Ù„Ù‰ Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø£Ùˆ ØªÙˆÙ„ÙŠØ¯ ÙˆØ«ÙŠÙ‚Ø© Ù…Ø¨Ø¯Ø¦ÙŠØ© Ø¹Ø¨Ø± VORA.
            </p>
          </div>
          <div className="grid gap-3">
            <MiniMetric label="Ø§Ù„Ù…Ø´Ø±ÙˆØ¹" value={project.id} icon={<Hash className="h-5 w-5" />} />
            <MiniMetric label="Ø§Ù„Ø­Ø§Ù„Ø©" value={project.status || "ØºÙŠØ± Ù…ØªØ§Ø­Ø©"} icon={<Gauge className="h-5 w-5" />} />
            <MiniMetric label="Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ©" value="Ø±Ø¨Ø· Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª" icon={<Lightbulb className="h-5 w-5" />} />
          </div>
        </div>
      </GlassCard>
    </div></LocalizedContent>
  );
}

function OverviewTab({ project, activity }: { project: ProjectWorkspaceProject; activity: Array<{ title: string; text: string; icon: React.ReactNode }> }) {
  const { locale } = useI18n();
  const detail = projectRepository.getDetails(project.id);
  return (
    <LocalizedContent locale={locale}><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between gap-3 border-b border-ds-token-border pb-4">
            <div><p className="text-xs font-medium text-ds-token-muted">Today</p><h2 className="mt-1 text-lg font-semibold text-ds-token-text">Pending Tasks</h2></div>
            <Badge tone="neutral">{detail?.tasks.length || 0}</Badge>
          </div>
          <div className="divide-y divide-ds-token-border">
            {(detail?.tasks.slice(0, 4) || []).map((task, index) => (
              <div key={task} className="flex items-center gap-3 py-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ds-token-border text-xçôÖÚ$z{-®éÜj×w&–BÖ–â×rÕ³##…ÒvÓ2#à¢ÄÖ–æ”ÖWG&–2Æ&VÃÒ%&ö¦V7B6öFR"fÇVS×·&ö¦V7Bæ–GÒ–6öã×³ÄföÆFW$¶æ&â6Æ74æÖSÒ&‚ÓRrÓR"óçÒóà¢ÄÖ–æ”ÖWG&–2Æ&VÃÒ%7FGW2"fÇVS×·&ö¦V7Bç7FGW7Ò–6öã×³ÄvVvR6Æ74æÖSÒ&‚ÓRrÓR"óçÒóà¢ÂöF—cà¢ÂöF—cà¢ÂôvÆ746&Cà ¢ÆF—b6Æ74æÖSÒ&w&–BvÓR†Ã¦w&–BÖ6öÇ2Õ¶Ö–æÖ‚ƒÃg"•ó3c…Ò#à¢ÆF—b6Æ74æÖSÒ'76R×’ÓR#à¢Å6WGF–æw56V7F–öâF—FÆSÒ$vVæW&Â6WGF–æw2"&FvSÒ-‹Š}˜R"–6öã×³Å6WGF–æw26Æ74æÖSÒ&‚ÓRrÓR"óçÓà¢ÆF—b6Æ74æÖSÒ&w&–BvÓBÖC¦w&–BÖ6öÇ2Ó"#à¢Å6WGF–æw4–çWBÆ&VÃÒ%&ö¦V7BæÖR"fÇVS×·&ö¦V7BçF—FÆWÒóà¢Å6WGF–æw4–çWBÆ&VÃÒ%&ö¦V7B6öFR"fÇVS×·&ö¦V7Bæ–GÒóà¢Å6WGF–æw4–çWBÆ&VÃÒ%&ö¦V7BG—R"fÇVS×·&ö¦V7BçG—WÒóà¢Å6WGF–æw4–çWBÆ&VÃÒ$Æö6F–öâ"fÇVSÒ-Š}˜M˜]‹­‹ŠˆÂŠ=˜=Š}Šı˜­‹"óà¢Å6WGF–æw56VÆV7BÆ&VÃÒ%7FGW2"fÇVS×·&ö¦V7Bç7FGW7Ò÷F–öç3×µ²%Æææ–ær"Â$7F—fR"Â$öâ†öÆB"Â$6ö×ÆWFVB%×Òóà¢Å6WGF–æw4–çWBÆ&VÃÒ%7F'BFFR"fÇVSÒ###bÓrÓ"óà¢Å6WGF–æw4–çWBÆ&VÃÒ$W‡V7FVB6ö×ÆWF–öâFFR"fÇVSÒ###bÓ"Ó#"óà¢ÆF—b6Æ74æÖSÒ&ÖC¦6öÂ×7âÓ"#à¢Å6WGF–æw5FW‡F&VÆ&VÃÒ$FW67&—F–öâ"fÇVSÒ-˜]‹=Š}ŠİŠ’˜]‹M‹˜‹’˜]‹˜]Š}‹˜­Š’˜MŠ]ŠıŠ}‹Š’Š}˜MŠ­Ší‹}˜­‹}ˆÂŠ}˜M˜Š½Š}Šm˜-ˆÂŠ}˜M˜‹˜­˜-ˆÂŠ}˜MŠ­˜m˜˜­‹ˆÂ˜Š}˜MŠ­˜-Š}‹˜­‹Š˜]‹=Š}‹ŠıŠ’dõ$â"óà¢ÂöF—cà¢ÂöF—cà¢Âõ6WGF–æw56V7F–öãà ¢Å6WGF–æw56V7F–öâF—FÆSÒ%v÷&·76R&VfW&Væ6W2"&FvSÒ-Š}˜MŠ­˜‹m˜­˜MŠ}Š¢"–6öã×³ÄvVvR6Æ74æÖSÒ&‚ÓRrÓR"óçÓà¢ÆF—b6Æ74æÖSÒ&w&–BvÓBÖC¦w&–BÖ6öÇ2Ó"†Ã¦w&–BÖ6öÇ2Ó2#à¢Å6WGF–æw56VÆV7BÆ&VÃÒ$FVfVÇBÆæF–ær6V7F–öâ"fÇVSÒ$÷fW'f–Wr"÷F–öç3×µ²$÷fW'f–Wr"Â%dõ$’"Â$Fö7VÖVçG2"Â%F–ÖVÆ–æR"Â%&W÷'G2%×Òóà¢Å6WGF–æw56VÆV7BÆ&VÃÒ$ÆæwVvR"fÇVSÒ-Š}˜M‹‹Š˜­Š’"÷F–öç3×µ²-Š}˜M‹‹Š˜­Š’"Â$g&ì:v—2"Â$VævÆ—6‚%×Òóà¢Å6WGF–æw56VÆV7BÆ&VÃÒ$FFRf÷&ÖB"fÇVSÒ%•••’ÔÔÒÔDB"÷F–öç3×µ²%•••’ÔÔÒÔDB"Â$DBôÔÒõ•••’"Â$ÔÔÒDBÂ•••’%×Òóà¢Å6WGF–æw56VÆV7BÆ&VÃÒ$7W'&Væ7’"fÇVSÒ$ÔB"÷F–öç3×µ²$ÔB"Â%U4B"Â$UU"%×Òóà¢Å6WGF–æw56VÆV7BÆ&VÃÒ%F–ÖR¦öæR"fÇVSÒ$g&–6ô66&Ææ6"÷F–öç3×µ²$g&–6ô66&Ææ6"Â%UD2"Â$WW&÷Rõ&—2%×Òóà¢Å6WGF–æw56VÆV7BÆ&VÃÒ$F—7Æ’FVç6—G’"fÇVSÒ$6öÖf÷'F&ÆR"÷F–öç3×µ²$6öÖf÷'F&ÆR"Â$6ö×7B"Â%76–÷W2%×Òóà¢ÂöF—cà¢Âõ6WGF–æw56V7F–öãà ¢Å6WGF–æw56V7F–öâF—FÆSÒ$æ÷F–f–6F–öç2"&FvSÒ-Š}˜MŠ­˜mŠ˜­˜}Š}Š¢"–6öã×³Ä6Æö6³26Æ74æÖSÒ&‚ÓRrÓR"óçÓà¢ÆF—b6Æ74æÖSÒ&w&–BvÓ2ÖC¦w&–BÖ6öÇ2Ó"#à¢¶æ÷F–f–6F–öä—FV×2æÖ‚†—FVÒÂ–æFW‚’Óâ€¢Å6WGF–æw5FövvÆR¶W“×¶—FV×ÒÆ&VÃ×¶—FV×ÒVæ&ÆVC×¶–æFW‚ÓÒ'Òóà¢’—Ğ¢ÂöF—cà¢Âõ6WGF–æw56V7F–öãà ¢Å6WGF–æw56V7F–öâF—FÆSÒ$’&VfW&Væ6W2"&FvSÒ%dõ$"–6öã×³Ä&÷B6Æ74æÖSÒ&‚ÓRrÓR"óçÓà¢ÆF—b6Æ74æÖSÒ&w&–BvÓBÖC¦w&–BÖ6öÇ2Ó"#à¢¶•&VfW&Væ6W2æÖ‚†—FVÒ’Óâ€¢Å6WGF–æw56VÆV7B¶W“×¶—FVÒæÆ&VÇÒÆ&VÃ×¶—FVÒæÆ&VÇÒfÇVS×¶—FVÒçfÇVWÒ÷F–öç3×µ¶—FVÒçfÇVRÂ$F—6&ÆVB"Â$ÖçVÂ"Â$&Ææ6VB%×Òóà¢’—Ğ¢ÂöF—cà¢Âõ6WGF–æw56V7F–öãà ¢Å6WGF–æw56V7F–öâF—FÆSÒ$FFæBf–ÆW2"&FvSÒ-Š}˜MŠ˜­Š}˜mŠ}Š¢"–6öã×³Äf–ÆT&6†—fR6Æ74æÖSÒ&‚ÓRrÓR"óçÓà¢ÆF—b6Æ74æÖSÒ&w&–BvÓBÖC¦w&–BÖ6öÇ2Ó2#à¢Å&öw&W75æVÂÆ&VÃÒ%7F÷&vRW6vR"fÇVS×³CgÒFöæSÒ&&ÇVR"óà¢ÆF—b6Æ74æÖSÒ'&÷VæFVBÓ7†Â&÷&FW"&÷&FW"×v†—FRó&r×v†—FRõ³ãCUÒÓB#à¢Ä&FvRFöæSÒ&vöÆB#äW‡÷'CÂô&FvSà¢Ç6Æ74æÖSÒ&×BÓ2FW‡B×6ÒÆVF–ærÓbFW‡BÖG2×FW‡BóSb#íŠ­‹]Šı˜­‹Š˜­Š}˜mŠ}Š¢Š}˜M˜]‹M‹˜‹’˜=˜Š}ŠÍ˜}Š’˜˜-‹rãÂ÷à¢Ä'WGFöâ6Æ74æÖSÒ&×BÓBrÖgVÆÂ"f&–çCÒ'6V6öæF'’"–6öã×³ÄF÷væÆöB6Æ74æÖSÒ&‚ÓBrÓB"óçÓäW‡÷'B&ö¦V7BFFÂô'WGFöãà¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ'&÷VæFVBÓ7†Â&÷&FW"&÷&FW"×v†—FRó&r×v†—FRõ³ãCUÒÓB#à¢Ä&FvRFöæSÒ&&ÇVR#ä&6†—fSÂô&FvSà¢Ç6Æ74æÖSÒ&×BÓ2FW‡B×6ÒÆVF–ærÓbFW‡BÖG2×FW‡BóSb#íŠ­Šİ‹m˜­‹Š=‹‹M˜­˜˜=Š}˜]˜BŠı˜˜bŠ­˜m˜˜­‹Š}˜MŠ­˜m‹-˜­˜BãÂ÷à¢Ä'WGFöâ6Æ74æÖSÒ&×BÓBrÖgVÆÂ"f&–çCÒ'6V6öæF'’"–6öã×³Äf–ÆT&6†—fR6Æ74æÖSÒ&‚ÓBrÓB"óçÓäF÷væÆöB&6†—fSÂô'WGFöãà¢ÂöF—cà¢ÂöF—cà¢Âõ6WGF–æw56V7F–öãà ¢ÄvÆ746&B6Æ74æÖSÒ&&÷&FW"Õ²4TcCCCEÒó#BÓR#à¢ÆF—b6Æ74æÖSÒ&Ö"ÓRfÆW‚—FV×2×7F'B§W7F–g’Ö&WGvVVâvÓ2#à¢ÆF—cà¢Ä&FvRFöæSÒ&FævW"#äFævW"¦öæSÂô&FvSà¢Æƒ26Æ74æÖSÒ&×BÓ"FW‡BÓ'†ÂföçBÖ&Æ6²FW‡B×v†—FR#íŠ]ŠÍ‹Š}ŠŠ}Š¢Šİ‹=Š}‹=Š“Âöƒ3à¢Ç6Æ74æÖSÒ&×BÓ"FW‡B×6ÒÆVF–ærÓrFW‡BÖG2×FW‡BóSB#í˜=˜BŠ}˜MŠ=‹-‹Š}‹˜}˜mŠrT’˜˜-‹râ˜MŠr˜­˜ŠÍŠòŠ=‹‹M˜Š’Š=˜‚˜m˜-˜B˜]˜M˜=˜­Š’Š=˜‚Šİ‹˜˜‹˜M˜¢ãÂ÷à¢ÂöF—cà¢ÄÆö6´¶W–†öÆR6Æ74æÖSÒ&‚ÓbrÓbFW‡BÕ²4TcCCCEÒ"óà¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ&w&–BvÓ2ÖC¦w&–BÖ6öÇ2Ó2#à¢ÄFævW$7F–öâF—FÆSÒ$&6†—fR&ö¦V7B"FW67&—F–öãÒ-Š]Ší˜Š}ŠŠ}˜M˜]‹M‹˜‹’˜]˜bŠ}˜M‹˜]˜BŠ}˜M˜­˜˜]˜¢â"óà¢ÄFævW$7F–öâF—FÆSÒ%G&ç6fW"÷væW'6†—"FW67&—F–öãÒ-Š­Šİ‹m˜­‹˜m˜-˜B˜]˜M˜=˜­Š’Š}˜M˜]‹M‹˜‹’â"óà¢ÄFævW$7F–öâF—FÆSÒ$FVÆWFR&ö¦V7B"FW67&—F–öãÒ-Š]ŠÍ‹Š}ŠŠí‹}˜­‹‹­˜­‹˜]˜‹˜Bâ"óà¢ÂöF—cà¢ÂôvÆ746&Cà¢ÂöF—cà ¢Æ6–FR6Æ74æÖSÒ'76R×’ÓR#à¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢Ä&FvRFöæSÒ&vöÆB#åW&Ö—76–öç27VÖÖ'“Âô&FvSà¢Æƒ26Æ74æÖSÒ&×BÓ2FW‡B×†ÂföçBÖ&Æ6²FW‡B×v†—FR#í˜]˜MŠí‹RŠ}˜M‹]˜MŠ}Šİ˜­Š}Š£Âöƒ3à¢ÆF—b6Æ74æÖSÒ&×BÓRw&–BvÓ2#à¢Ä6öçFW‡E&÷rÆ&VÃÒ$÷væW""fÇVSÒ-‹=‹˜­ŠòŠ}˜M‹M‹˜˜¢"óà¢Ä6öçFW‡E&÷rÆ&VÃÒ$FÖ–ç2"fÇVSÒ#""óà¢Ä6öçFW‡E&÷rÆ&VÃÒ$VF—F÷'2"fÇVSÒ#B"óà¢Ä6öçFW‡E&÷rÆ&VÃÒ%f–WvW'2"fÇVSÒ#‚"óà¢Ä6öçFW‡E&÷rÆ&VÃÒ$66W72÷fW'f–Wr"fÇVSÒ%&—fFRv÷&·76R"óà¢ÂöF—cà¢ÂôvÆ746&Cà ¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢ÆF—b6Æ74æÖSÒ&fÆW‚—FV×2×7F'BvÓB#à¢Åf÷&f—7VÂf&–çCÒ&fF""6Æ74æÖSÒ&‚ÓbrÓb&÷VæFVBÓ'†Â"6—¦W3Ò#cG‚"óà¢ÆF—cà¢Ä&FvRFöæSÒ&&ÇVR#ådõ$6WGF–æw3Âô&FvSà¢Æƒ26Æ74æÖSÒ&×BÓ2FW‡B×†ÂföçBÖ&Æ6²FW‡B×v†—FR#íŠ­˜‹]˜­Š’Š}˜MŠ]‹ŠıŠ}ŠıŠ}Š£Âöƒ3à¢ÂöF—cà¢ÂöF—cà¢Ç6Æ74æÖSÒ&×BÓRFW‡B×6ÒÆVF–ærÓrFW‡BÖG2×FW‡Bóc#à¢Š=˜m‹]ŠÒŠŠ­˜‹˜­˜BŠ­˜mŠ˜­˜}Š}Š¢Š}˜MŠ­Š=Ší˜­‹˜Š}˜M˜]ŠíŠ}‹}‹Š}˜MŠ=‹=Š˜‹˜­Š’Ší˜MŠ}˜B˜]‹Šİ˜MŠ’Š}˜MŠ­˜m˜˜­‹ˆÂ˜]‹’Š]Š˜-Š}Š˜]˜MŠí‹Rdõ$Š­˜M˜-Š}Šm˜­Š}˜²˜M˜M˜‹˜­˜"Š}˜MŠ]ŠıŠ}‹˜¢à¢Â÷à¢ÂôvÆ746&Cà ¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢Ä&FvRFöæSÒ&æWWG&Â#ä66W72÷fW'f–WsÂô&FvSà¢ÆF—b6Æ74æÖSÒ&×BÓR76R×’ÓB#à¢Å&öw&W74&"fÇVS×³ÒÆ&VÃÒ$÷væW"66W72"FöæSÒ&vöÆB"óà¢Å&öw&W74&"fÇVS×³s'ÒÆ&VÃÒ$VF—F÷"66W72"FöæSÒ&&ÇVR"óà¢Å&öw&W74&"fÇVS×³3‡ÒÆ&VÃÒ%f–WvW"66W72"FöæSÒ'7V66W72"óà¢ÂöF—cà¢ÂôvÆ746&Cà¢Âö6–FSà¢ÂöF—cà¢ÂöF—cà¢ÂôWFôÆö6Æ—¦VD6öçFVçCâ“°§Ğ ¦gVæ7F–öâ6WGF–æw56V7F–öâ‡²F—FÆRÂ&FvRÂ–6öâÂ6†–ÆG&VâÓ¢²F—FÆS¢7G&–æs²&FvS¢7G&–æs²–6öã¢&V7Bå&V7DæöFS²6†–ÆG&Vã¢&V7Bå&V7DæöFRÒ’°¢&WGW&âƒÄWFôÆö6Æ—¦VD6öçFVçCà¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢ÆF—b6Æ74æÖSÒ&Ö"ÓRfÆW‚—FV×2Ö6VçFW"vÓ2#à¢Ç7â6Æ74æÖSÒ&w&–B‚ÓrÓÆ6RÖ—FV×2Ö6VçFW"&÷VæFVBÓ'†Â&rÕ²4CDc3uÒóFW‡BÖvöÆB6†F÷rÖvöÆBÖvÆ÷r#ç¶–6öçÓÂ÷7ãà¢ÆF—cà¢Ä&FvRFöæSÒ&vöÆB#ç¶&FvWÓÂô&FvSà¢Æƒ26Æ74æÖSÒ&×BÓ"FW‡BÓ'†ÂföçBÖ&Æ6²FW‡B×v†—FR#ç·F—FÆWÓÂöƒ3à¢ÂöF—cà¢ÂöF—cà¢¶6†–ÆG&VçĞ¢ÂôvÆ746&Cà¢ÂôWFôÆö6Æ—¦VD6öçFVçCâ“°§Ğ ¦gVæ7F–öâ6WGF–æw4–çWB‡²Æ&VÂÂfÇVRÓ¢²Æ&VÃ¢7G&–æs²fÇVS¢7G&–ærÒ’°¢&WGW&âƒÄWFôÆö6Æ—¦VD6öçFVçCà¢ÆÆ&VÂ6Æ74æÖSÒ&&Æö6²#à¢Ç7â6Æ74æÖSÒ&Ö"Ó"&Æö6²FW‡B×‡2föçBÖ&Æ6²WW&66RFW‡BÖG2×FW‡BóC"#ç¶Æ&VÇÓÂ÷7ãà¢Æ–çWBFVfVÇEfÇVS×·fÇVWÒ6Æ74æÖSÒ&‚Ó"rÖgVÆÂ&÷VæFVBÓ'†Â&÷&FW"&÷&FW"×v†—FRó&rÖ&Æ6²ó#B‚ÓBFW‡B×6ÒföçBÖ&öÆBFW‡BÖG2×FW‡B÷WFÆ–æRÖæöæRG&ç6—F–öâfö7W3¦&÷&FW"Õ²4CDc3uÒóCB"óà¢ÂöÆ&VÃà¢ÂôWFôÆö6Æ—¦VD6öçFVçCâ“°§Ğ ¦gVæ7F–öâ6WGF–æw5FW‡F&V‡²Æ&VÂÂfÇVRÓ¢²Æ&VÃ¢7G&–æs²fÇVS¢7G&–ærÒ’°¢&WGW&âƒÄWFôÆö6Æ—¦VD6öçFVçCà¢ÆÆ&VÂ6Æ74æÖSÒ&&Æö6²#à¢Ç7â6Æ74æÖSÒ&Ö"Ó"&Æö6²FW‡B×‡2föçBÖ&Æ6²WW&66RFW‡BÖG2×FW‡BóC"#ç¶Æ&VÇÓÂ÷7ãà¢ÇFW‡F&VFVfVÇEfÇVS×·fÇVWÒ&÷w3×³GÒ6Æ74æÖSÒ'rÖgVÆÂ&W6—¦RÖæöæR&÷VæFVBÓ'†Â&÷&FW"&÷&FW"×v†—FRó&rÖ&Æ6²ó#B‚ÓB’Ó2FW‡B×6ÒföçBÖ&öÆBÆVF–ærÓrFW‡BÖG2×FW‡B÷WFÆ–æRÖæöæRG&ç6—F–öâfö7W3¦&÷&FW"Õ²4CDc3uÒóCB"óà¢ÂöÆ&VÃà¢ÂôWFôÆö6Æ—¦VD6öçFVçCâ“°§Ğ ¦gVæ7F–öâ6WGF–æw56VÆV7B‡²Æ&VÂÂfÇVRÂ÷F–öç2Ó¢²Æ&VÃ¢7G&–æs²fÇVS¢7G&–æs²÷F–öç3¢7G&–æuµÒÒ’°¢&WGW&âƒÄWFôÆö6Æ—¦VD6öçFVçCà¢ÆÆ&VÂ6Æ74æÖSÒ&&Æö6²#à¢Ç7â6Æ74æÖSÒ&Ö"Ó"&Æö6²FW‡B×‡2föçBÖ&Æ6²WW&66RFW‡BÖG2×FW‡BóC"#ç¶Æ&VÇÓÂ÷7ãà¢Ç6VÆV7BFVfVÇEfÇVS×·fÇVWÒ6Æ74æÖSÒ&‚Ó"rÖgVÆÂ&÷VæFVBÓ'†Â&÷&FW"&÷&FW"×v†—FRó&rÖ&Æ6²ó#B‚ÓBFW‡B×6ÒföçBÖ&öÆBFW‡BÖG2×FW‡B÷WFÆ–æRÖæöæRG&ç6—F–öâfö7W3¦&÷&FW"Õ²4CDc3uÒóCB#à¢´'&’æg&öÒ†æWr6WB†÷F–öç2’’æÖ‚†÷F–öâ’Óâ€¢Æ÷F–öâ¶W“×¶÷F–öçÒfÇVS×¶÷F–öçÓç¶÷F–öçÓÂö÷F–öãà¢’—Ğ¢Â÷6VÆV7Cà¢ÂöÆ&VÃà¢ÂôWFôÆö6Æ—¦VD6öçFVçCâ“°§Ğ ¦gVæ7F–öâ6WGF–æw5FövvÆR‡²Æ&VÂÂVæ&ÆVBÓ¢²Æ&VÃ¢7G&–æs²Væ&ÆVC¢&ööÆVâÒ’°¢&WGW&âƒÄWFôÆö6Æ—¦VD6öçFVçCà¢Æ'WGFöâG—SÒ&'WGFöâ"6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"§W7F–g’Ö&WGvVVâvÓB&÷VæFVBÓ'†Â&÷&FW"&÷&FW"×v†—FRó&r×v†—FRõ³ãCUÒÓBFW‡B×&–v‡BG&ç6—F–öâ†÷fW#¢×G&ç6ÆFR×’Ó†÷fW#¦&÷&FW"Õ²4CDc3uÒó#‚†÷fW#¦&r×v†—FRõ³ãcUÒ#à¢Ç7ãà¢Ç7â6Æ74æÖSÒ&&Æö6²föçBÖ&Æ6²FW‡B×v†—FR#ç¶Æ&VÇÓÂ÷7ãà¢Ç7â6Æ74æÖSÒ&×BÓ&Æö6²FW‡B×‡2föçBÖ&öÆBFW‡BÖG2×FW‡BóC"#ç¶Væ&ÆVBò$Væ&ÆVBf÷"F†—2v÷&·76R"¢$F—6&ÆVB'’FVfVÇB'ÓÂ÷7ãà¢Â÷7ãà¢Ç7â6Æ74æÖS×¶&VÆF—fR‚ÓrrÓ"&÷VæFVBÖgVÆÂ&÷&FW"G&ç6—F–öâG¶Væ&ÆVBò&&÷&FW"Õ²3d3sƒEÒó3R&rÕ²3d3sƒEÒó#"¢&&÷&FW"×v†—FRó&rÖ&Æ6²ó3'ÖÓà¢Ç7â6Æ74æÖS×¶'6öÇWFRF÷Ó‚ÓRrÓR&÷VæFVBÖgVÆÂG&ç6—F–öâG¶Væ&ÆVBò'&–v‡BÓb&rÕ²3d3sƒEÒ6†F÷rÕ³óó‡…÷&v&ƒ#"Ã“’Ã3"ÂãSR•Ò"¢'&–v‡BÓ&rÖG2×FW‡BóCR'ÖÒóà¢Â÷7ãà¢Âö'WGFöãà¢ÂôWFôÆö6Æ—¦VD6öçFVçCâ“°§Ğ ¦gVæ7F–öâFævW$7F–öâ‡²F—FÆRÂFW67&—F–öâÓ¢²F—FÆS¢7G&–æs²FW67&—F–öã¢7G&–ærÒ’°¢&WGW&âƒÄWFôÆö6Æ—¦VD6öçFVçCà¢ÆF—b6Æ74æÖSÒ'&÷VæFVBÓ7†Â&÷&FW"&÷&FW"Õ²4TcCCCEÒó‚&rÕ²4TcCCCEÒó‚ÓB#à¢Ä&FvRFöæSÒ&FævW"#ç·F—FÆWÓÂô&FvSà¢Ç6Æ74æÖSÒ&×BÓ2Ö–âÖ‚Ó"FW‡B×6ÒÆVF–ærÓbFW‡BÖG2×FW‡BóSB#ç¶FW67&—F–öçÓÂ÷à¢Ä'WGFöâ6Æ74æÖSÒ&×BÓBrÖgVÆÂ"f&–çCÒ&FævW""–6öã×³ÄÆö6´¶W–†öÆR6Æ74æÖSÒ&‚ÓBrÓB"óçÓåT’öæÇ“Âô'WGFöãà¢ÂöF—cà¢ÂôWFôÆö6Æ—¦VD6öçFVçCâ“°§Ğ ¦gVæ7F–öâv÷&·76UF%66fföÆB‡²F"Â&ö¦V7BÓ¢²F#¢7G&–æs²&ö¦V7C¢&ö¦V7Ev÷&·76U&ö¦V7BÒ’°¢6öç7B7W'&VçBÒv÷&·76UF'2æf–æB‚†—FVÒ’Óâ—FVÒçfÇVRÓÓÒF"“°¢&WGW&âƒÄWFôÆö6Æ—¦VD6öçFVçCà¢ÄvÆ746&B6Æ74æÖSÒ'Ób#à¢ÄV×G•7FFP¢F—FÆS×¶G¶7W'&VçCòæÆ&VÂÇÂ%v÷&·76R'Ò+rG·&ö¦V7BçF—FÆWÖĞ¢FW67&—F–öãÒ-Š­˜RŠ­ŠÍ˜}˜­‹"˜]‹=Š}ŠİŠ’˜}‹ŠrŠ}˜M˜-‹=˜RŠ‹]‹˜­Š}˜²˜˜-‹r˜˜¢7&–çBrãâ‹=˜­Š­˜R‹Š‹rŠ}˜M˜]ŠİŠ­˜˜’Š}˜M˜]Š­Ší‹]‹R˜]˜bŠ}˜M˜‹Š}Šm˜Š}˜MŠİŠ}˜M˜­Š’ŠŠı˜˜bŠ]‹mŠ}˜Š’˜]˜m‹}˜"Ší˜M˜˜¢ŠÍŠı˜­Šòâ ¢7F–öã×°¢ÄÆ–æ²‡&Vc×·F"ÓÓÒ&’"ò"÷FööÇ2öFö7VÖVçB"¢F"ÓÓÒ&¶æ÷vÆVFvR"ò"÷&ö¦V7G26¶æ÷vÆVFvR"¢"÷&ö¦V7G2'Óà¢Ä'WGFöâf&–çCÒ'6V6öæF'’"–6öã×³ÅÇW26Æ74æÖSÒ&‚ÓBrÓB"óçÓí˜Š­ŠÒŠ}˜M˜]‹=Š}‹Š}˜MŠİŠ}˜M˜£Âô'WGFöãà¢ÂôÆ–æ³à¢Ğ¢óà¢ÂôvÆ746&Cà¢ÂôWFôÆö6Æ—¦VD6öçFVçCâ“°§Ğ ¦gVæ7F–öâÖ–æ”ÖWG&–2‡²Æ&VÂÂfÇVRÂ–6öâÓ¢²Æ&VÃ¢7G&–æs²fÇVS¢7G&–æs²–6öã¢&V7Bå&V7DæöFRÒ’°¢&WGW&âƒÄWFôÆö6Æ—¦VD6öçFVçCà¢ÆF—b6Æ74æÖSÒ'&÷VæFVBÓ'†Â&÷&FW"&÷&FW"×v†—FRó&r×v†—FRõ³ãCUÒÓ2#à¢ÆF—b6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"vÓ"FW‡BÖvöÆB#ç¶–6öçÓÇ7â6Æ74æÖSÒ'FW‡B×‡2föçBÖ&Æ6²FW‡BÖG2×FW‡BóS"#ç¶Æ&VÇÓÂ÷7ããÂöF—cà¢Ç6Æ74æÖSÒ&×BÓ"FW‡BÓ'†ÂföçBÖ&Æ6²FW‡B×v†—FR#ç·fÇVWÓÂ÷à¢ÂöF—cà¢ÂôWFôÆö6Æ—¦VD6öçFVçCâ“°§Ğ ¦gVæ7F–öâ'VFvWDÖWG&–46&B‡²F—FÆRÂfÇVRÂFWF–ÂÂ–6öâÂFöæRÓ¢²F—FÆS¢7G&–æs²fÇVS¢7G&–æs²FWF–Ã¢7G&–æs²–6öã¢&V7Bå&V7DæöFS²FöæS¢&vöÆB"Â&&ÇVR"Â'7V66W72"Ò’°¢&WGW&âƒÄWFôÆö6Æ—¦VD6öçFVçCà¢ÆF—b6Æ74æÖSÒ'&÷VæFVBÕ³ãW&VÕÒ&÷&FW"&÷&FW"×v†—FRó&r×v†—FRõ³ãCUÒÓB6†F÷rÖG2×6ÒG&ç6—F–öâ†÷fW#¢×G&ç6ÆFR×’Ó†÷fW#¦&÷&FW"Õ²4CDc3uÒó#‚†÷fW#¦&r×v†—FRõ³ãcUÒ#à¢ÆF—b6Æ74æÖSÒ&fÆW‚—FV×2×7F'B§W7F–g’Ö&WGvVVâvÓ2#à¢ÆF—cà¢Ä&FvRFöæS×·FöæWÓç·F—FÆWÓÂô&FvSà¢Ç6Æ74æÖSÒ&×BÓBFW‡BÓ'†ÂföçBÖ&Æ6²FW‡B×v†—FR#ç·fÇVWÓÂ÷à¢Ç6Æ74æÖSÒ&×BÓ"FW‡B×‡2föçBÖ&öÆBÆVF–ærÓRFW‡BÖG2×FW‡BóC‚#ç¶FWF–ÇÓÂ÷à¢ÂöF—cà¢Ç7â6Æ74æÖSÒ&w&–B‚Ó"rÓ"6‡&–æ²ÓÆ6RÖ—FV×2Ö6VçFW"&÷VæFVBÓ'†Â&rÕ²4CDc3uÒóFW‡BÖvöÆB6†F÷rÖvöÆBÖvÆ÷r#ç¶–6öçÓÂ÷7ãà¢ÂöF—cà¢ÂöF—cà¢ÂôWFôÆö6Æ—¦VD6öçFVçCâ“°§Ğ ¦gVæ7F–öâ'VFvWD7F–öä6öçFVçB‡²7F–öâÓ¢²7F–öã¢²F—FÆS¢7G&–æs²FW67&—F–öã¢7G&–æs²–6öã¢&V7Bå&V7DæöFS²FöæS¢&vöÆB"Â&&ÇVR"Â'7V66W72"Â&æWWG&Â"ÒÒ’°¢&WGW&âƒÄWFôÆö6Æ—¦VD6öçFVçCà¢Ç7â6Æ74æÖSÒ&fÆW‚—FV×2×7F'BvÓ2#à¢Ç7â6Æ74æÖSÒ&w&–B‚ÓrÓ6‡&–æ²ÓÆ6RÖ—FV×2Ö6VçFW"&÷VæFVBÓ'†Â&rÕ²4CDc3uÒó"FW‡BÖvöÆBG&ç6—F–öâw&÷WÖ†÷fW#¢×&÷FFRÓb#ç¶7F–öâæ–6öçÓÂ÷7ãà¢Ç7ãà¢Ä&FvRFöæS×¶7F–öâçFöæWÓç¶7F–öâçF—FÆWÓÂô&FvSà¢Ç7â6Æ74æÖSÒ&×BÓ"&Æö6²FW‡B×6ÒÆVF–ærÓbFW‡BÖG2×FW‡BóSb#ç¶7F–öâæFW67&—F–öçÓÂ÷7ãà¢Â÷7ãà¢Â÷7ãà¢ÂôWFôÆö6Æ—¦VD6öçFVçCâ“°§Ğ ¦gVæ7F–öâ&öw&W75æVÂ‡²Æ&VÂÂfÇVRÂFöæRÓ¢²Æ&VÃ¢7G&–æs²fÇVS¢çVÖ&W#²FöæS¢&vöÆB"Â&&ÇVR"Â'7V66W72"Ò’°¢&WGW&âƒÄWFôÆö6Æ—¦VD6öçFVçCà¢ÆF—b6Æ74æÖSÒ'&÷VæFVBÓ7†Â&÷&FW"&÷&FW"×v†—FRó&rÖ&Æ6²ó#ÓB#à¢Ç6Æ74æÖSÒ&Ö"ÓBFW‡B×6ÒföçBÖ&Æ6²FW‡BÖG2×FW‡Bós#ç¶Æ&VÇÓÂ÷à¢Å&öw&W74&"fÇVS×·fÇVWÒFöæS×·FöæWÒóà¢ÂöF—cà¢ÂôWFôÆö6Æ—¦VD6öçFVçCâ“°§Ğ ¦gVæ7F–öâ7F–öäÆ–æ²‡²‡&VbÂ–6öâÂF—FÆRÓ¢²‡&Vc¢7G&–æs²–6öã¢&V7Bå&V7DæöFS²F—FÆS¢7G&–ærÒ’°¢&WGW&âƒÄWFôÆö6Æ—¦VD6öçFVçCà¢ÄÆ–æ²‡&Vc×¶‡&VgÒ6Æ74æÖSÒ&w&÷W&÷VæFVBÓ7†Â&÷&FW"&÷&FW"×v†—FRó&r×v†—FRõ³ãCUÒÓBG&ç6—F–öâ†÷fW#¢×G&ç6ÆFR×’Ó†÷fW#¦&÷&FW"Õ²4CDc3uÒó3"†÷fW#¦&r×v†—FRõ³ãuÒ#à¢Ç7â6Æ74æÖSÒ&w&–B‚ÓrÓÆ6RÖ—FV×2Ö6VçFW"&÷VæFVBÓ'†Â&rÕ²4CDc3uÒó"FW‡BÖvöÆBG&ç6—F–öâw&÷WÖ†÷fW#¢×&÷FFRÓb#ç¶–6öçÓÂ÷7ãà¢Ç7â6Æ74æÖSÒ&×BÓB&Æö6²föçBÖ&Æ6²FW‡B×v†—FR#ç·F—FÆWÓÂ÷7ãà¢Ç7â6Æ74æÖSÒ&×BÓ"&Æö6²FW‡B×‡2ÆVF–ærÓRFW‡BÖG2×FW‡BóCb#í˜]Š­Š}ŠÒ‹Š‹Š}˜M˜‹Š}Šm˜Š}˜MŠİŠ}˜M˜­Š“Â÷7ãà¢ÂôÆ–æ³à¢ÂôWFôÆö6Æ—¦VD6öçFVçCâ“°§Ğ Ğ