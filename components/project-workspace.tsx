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
      { title: "تم تحديث حالة المشروع", text: `${project.status} · ${project.updatedAt}`, icon: <CheckCircle2 className="h-4 w-4" /> },
      { title: "VORA راجعت مساحة العمل", text: detail?.aiHistory[0] || "تفاصيل المشروع غير متاحة بعد.", icon: <Bot className="h-4 w-4" /> },
      { title: "جاهز للخطوة التالية", text: detail?.tasks[0] || "اربط بيانات المشروع قبل متابعة التنفيذ.", icon: <Clock3 className="h-4 w-4" /> }
    ],
    [detail?.aiHistory, detail?.tasks, project.status, project.updatedAt]
  );

  return (
    <LocalizedContent locale={locale}><div className="mx-auto max-w-[1480px] space-y-5">
      <PageHeader
        eyebrow="Project Workspace"
        title={project.title}
        description={`${project.type} · Updated ${project.updatedAt}`}
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
                  <p className="mt-2 text-sm font-bold text-ds-text/58">{project.type} · آخر تحديث {project.updatedAt}</p>
                </div>
                <div className="w-full max-w-sm rounded-ds-lg border border-ds-token-gold/22 bg-black/62 p-4 backdrop-blur-md">
                  <ProgressBar value={project.score} label="تقدم المشروع" />
                </div>
              </div>
            </div>
          </div>

          <GlassCard className="relative overflow-hidden p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Badge tone="blue">VORA Insight</Badge>
                <h3 className="mt-3 text-2xl font-black text-white">الخطوة الأنسب الآن</h3>
              </div>
              <VoraVisual variant="avatar" className="h-16 w-16 rounded-ds-lg" sizes="64px" />
            </div>
            <p className="mt-5 text-sm leading-7 text-ds-text/62">
              {detail.aiHistory[1]} ركّز على تثبيت الوثائق الأساسية وربط ملفات المعرفة قبل توليد تقرير التنفيذ التالي.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniMetric label="الوثائق" value={String(detail.documents.length)} icon={<FileText className="h-5 w-5" />} />
              <MiniMetric label="الفريق" value={String(detail.team.length)} icon={<UsersRound className="h-5 w-5" />} />
              <MiniMetric label="المخاطر" value={detail.reports.length > 2 ? "2" : "1"} icon={<ShieldAlert className="h-5 w-5" />} />
              <MiniMetric label="الجاهزية" value={`${project.score}%`} icon={<Gauge className="h-5 w-5" />} />
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
        description="هذا المشروع موجود، لكن تفاصيل مساحة العمل غير متاحة في مصدر البيانات الحالي. لم يتم استبداله تلقائياً بمشروع تجريبي آخر."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/projects">
              <Button variant="secondary">كل المشاريع</Button>
            </Link>
            <Link href="/tools/document">
              <Button icon={<Sparkles className="h-4 w-4" />}>اسأل VORA</Button>
            </Link>
          </div>
        }
      />
      <GlassCard className="relative overflow-hidden p-6">
        <BlueprintOverlay className="opacity-25" />
        <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_.7fr]">
          <div>
            <Badge tone="warning">Missing workspace data</Badge>
            <h2 className="mt-4 text-2xl font-black text-white">مساحة العمل تحتاج بيانات مشروع صريحة</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ds-text/62">
              حفاظاً على وضوح المنتج، لم تعد Vorqa تعرض بيانات PRJ-1048 بصمت عندما لا تتوفر تفاصيل هذا المشروع. يمكنك الرجوع إلى قائمة المشاريع أو توليد وثيقة مبدئية عبر VORA.
            </p>
          </div>
          <div className="grid gap-3">
            <MiniMetric label="المشروع" value={project.id} icon={<Hash className="h-5 w-5" />} />
            <MiniMetric label="الحالة" value={project.status || "غير متاحة"} icon={<Gauge className="h-5 w-5" />} />
            <MiniMetric label="الخطوة التالية" value="ربط البيانات" icon={<Lightbulb className="h-5 w-5" />} />
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
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ds-token-border text-xs text-ds-token-muted">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ds-token-text">{task}</span>
                <Badge tone={index === 0 ? "warning" : "neutral"}>{index === 0 ? "Next" : "Open"}</Badge>
              </div>
            ))}
            {!detail?.tasks.length && <p className="py-5 text-sm text-ds-token-muted">No pending tasks</p>}
          </div>
        </GlassCard>

        <GlassCard className="hidden p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <Badge tone="gold">Overview</Badge>
              <h2 className="mt-2 text-2xl font-black text-white">ملخص التنفيذ</h2>
            </div>
            <IconButton label="تنزيل الملخص" tone="gold">
              <Download className="h-5 w-5" />
            </IconButton>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <ProgressPanel label="التقدم العام" value={project.score} tone="gold" />
            <ProgressPanel label="جاهزية الوثائق" value={72} tone="blue" />
            <ProgressPanel label="تنسيق الفريق" value={64} tone="success" />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge tone="blue">Quick Actions</Badge>
              <h2 className="mt-2 text-2xl font-black text-white">إجراءات سريعة</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ActionLink href="/tools/document" icon={<FileText className="h-5 w-5" />} title="إنشاء وثيقة" />
            <ActionLink href="/tools" icon={<Bot className="h-5 w-5" />} title="اسأل VORA" />
            <ActionLink href="/projects#knowledge" icon={<UploadCloud className="h-5 w-5" />} title="إضافة ملف معرفة" />
            <ActionLink href="/history" icon={<Clock3 className="h-5 w-5" />} title="عرض النشاط" />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-white">النشاط الأخير</h2>
            <Badge tone="neutral">{activity.length} عناصر</Badge>
          </div>
          <div className="grid gap-4">
            {activity.map((item, index) => (
              <TimelineCard key={item.title} index={index + 1} title={item.title} text={item.text} icon={item.icon} />
            ))}
          </div>
        </GlassCard>
      </div>

      <aside className="space-y-5">
        <GlassCard className="p-5">
          <h3 className="text-base font-semibold text-ds-token-text">Overview</h3>
          <div className="mt-4 divide-y divide-ds-token-border">
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-ds-token-muted">Documents</span><Badge tone="warning">{Math.min(detail?.documents.length || 0, 3)}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 py-3"><span className="text-sm text-ds-token-muted">Budget Health</span><Badge tone="neutral">0</Badge></div>
            <div className="flex items-center justify-between gap-3 py-3"><span className="text-sm text-ds-token-muted">Top Risks</span><Badge tone={(detail?.reports.length || 0) > 2 ? "warning" : "neutral"}>{Math.min(detail?.reports.length || 0, 2)}</Badge></div>
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <Badge tone="gold">AI Insight</Badge>
          <div className="mt-4 flex items-start gap-4">
            <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
            <div>
              <h3 className="font-black text-white">توصية VORA</h3>
              <p className="mt-2 text-sm leading-7 text-ds-text/60">ابدأ بتوليد تقرير تنفيذي مختصر بعد رفع ملفات المعرفة الأساسية للمشروع.</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-xl font-black text-white">أحدث الوثائق</h3>
          <div className="mt-4 grid gap-3">
            {["ملخص المشروع", "خطة العمل الأولية", "قائمة متطلبات التنفيذ"].map((title) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <FileText className="h-5 w-5 text-gold" />
                <span className="min-w-0 flex-1 truncate text-sm font-black text-ds-text">{title}</span>
                <Badge tone="neutral">Draft</Badge>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-xl font-black text-white">الفريق</h3>
          <div className="mt-4 grid gap-3">
            {["مالك المشروع", "VORA", "مراجع الوثائق"].map((member) => (
              <div key={member} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <span className="font-bold text-ds-text/76">{member}</span>
                <span className="h-2.5 w-2.5 rounded-full bg-[#16C784] shadow-[0_0_18px_rgba(22,199,132,.72)]" />
              </div>
            ))}
          </div>
        </GlassCard>
      </aside>
    </div></LocalizedContent>
  );
}

function AiWorkspaceTab({ project }: { project: ProjectWorkspaceProject }) {
  const { locale } = useI18n();
  const organizationId = project.organizationId || "atlas";
  const tasksState = useTasksRepository(project.id);
  const timelineState = useTimelineRepository(project.id);
  const budgetState = useBudgetRepository(project.id);
  const documentsState = useDocumentsRepository(project.id);
  const knowledgeState = useKnowledgeRepository({ organizationId, projectId: project.id });
  const [selectedPrompt, setSelectedPrompt] = useState(voraSkills[0]?.prompt || "");
  const [conversationSearch, setConversationSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const moduleReferences = [
    { label: "Tasks", value: tasksState.loading ? "..." : tasksState.data.length },
    { label: "Milestones", value: timelineState.loading ? "..." : timelineState.data.milestones.length },
    { label: "Budget", value: budgetState.loading ? "..." : `${budgetRepository.getBudgetStats(budgetState.data).progress}%` },
    { label: "Documents", value: documentsState.loading ? "..." : documentsState.data.length },
    { label: "Knowledge", value: knowledgeState.loading ? "..." : knowledgeState.data.length }
  ];

  const recentConversations = projectRepository.listSavedGenerations().filter((item) => {
    const normalized = conversationSearch.trim().toLowerCase();
    if (!normalized) return true;
    return [item.title, item.tool, item.date].join(" ").toLowerCase().includes(normalized);
  });

  const demoResponse = [
    "## تحليل VORA السريع",
    "",
    `المشروع: **${project.title}**`,
    "",
    "| المحور | القراءة | الإجراء المقترح |",
    "|---|---|---|",
    `| المهام | ${tasksState.data.length} عنصر في السياق | راجع المهام الحرجة والمحجوبة أولاً |`,
    `| الجدول | ${timelineState.data.milestones.length} معلم | ثبّت المعلم القادم وحدد المالك |`,
    `| الوثائق | ${documentsState.data.length} ملف | جهّز قائمة الوثائق الناقصة |`,
    `| المعرفة | ${knowledgeState.data.length} مقالة | اربط إجراءات السلامة والجودة بالمرحلة الحالية |`,
    "",
    "### الخطوة التالية",
    selectedPrompt || "اختر مطالبة سريعة ليتم تمريرها إلى مولد VORA الحالي."
  ].join("\n");

  const copyResponse = async () => {
    await navigator.clipboard?.writeText(demoResponse).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <LocalizedContent locale={locale}><div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
      <div className="space-y-5">
        <GlassCard className="relative overflow-hidden p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ds-token-gold/42 to-transparent" />
          <div className="relative z-10">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge tone="blue">Conversation</Badge>
                <h2 className="mt-2 text-2xl font-black text-white">VORA Intelligence داخل المشروع</h2>
                <p className="mt-2 text-sm leading-7 text-ds-text/58">VORA يقرأ سياق المشروع من المستودعات الحالية: الفريق، المهام، الجدول، الميزانية، الوثائق، والمعرفة.</p>
              </div>
              <VoraVisual variant="thinking" className="h-20 w-20 rounded-ds-xl" sizes="80px" />
            </div>
            <div className="mb-5 grid gap-3 sm:grid-cols-5">
              {moduleReferences.map((module) => (
                <div key={module.label} className="rounded-ds-md border border-ds-token-border bg-white/[0.03] p-3">
                  <p className="text-xs text-ds-text/45">{module.label}</p>
                  <p className="mt-1 text-xl font-black text-white">{module.value}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 rounded-ds-xl border border-ds-token-border bg-black/22 p-4 sm:p-5">
              <ChatBubble role="assistant">مرحباً، أنا VORA. جهزت سياق {project.title} من المهام والجدول والميزانية والوثائق والمعرفة.</ChatBubble>
              <ChatBubble role="user">{selectedPrompt || "أريد تحليلاً سريعاً للمخاطر وخطة تنفيذ مختصرة."}</ChatBubble>
              <ChatBubble role="assistant">{demoResponse}</ChatBubble>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/tools/document">
                <Button icon={<Sparkles className="h-4 w-4" />}>فتح مولد الوثائق</Button>
              </Link>
              <Button variant="secondary" onClick={copyResponse} icon={<FileText className="h-4 w-4" />}>{copied ? "تم النسخ" : "نسخ الرد"}</Button>
              <Link href="/tools">
                <Button variant="secondary" icon={<Bot className="h-4 w-4" />}>كل أدوات VORA</Button>
              </Link>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <Badge tone="gold">Suggested Actions</Badge>
              <h2 className="mt-2 text-2xl font-black text-white">إجراءات مقترحة</h2>
            </div>
            <Badge tone="blue">VORA Ready</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {voraSkills.slice(0, 6).map((skill) => (
              <button key={skill.id} type="button" onClick={() => setSelectedPrompt(skill.prompt)} className="group rounded-ds-lg border border-ds-token-border bg-white/[0.03] p-4 text-start transition hover:border-ds-token-gold/32 hover:bg-white/[0.055]">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-ds-md bg-ds-token-gold/12 text-ds-token-gold transition group-hover:scale-105"><Sparkles className="h-5 w-5" /></span>
                  <div>
                    <Badge tone="gold">{skill.title}</Badge>
                    <p className="mt-3 text-sm leading-6 text-ds-text/56">{skill.prompt}</p>
                    <p className="mt-2 text-xs text-ds-text/40">{skill.modules.join(" · ")}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-5">
            <Badge tone="blue">Quick Prompts</Badge>
            <h2 className="mt-2 text-2xl font-black text-white">مطالبات سريعة</h2>
          </div>
          <div className="grid gap-3">
            {voraSkills.slice(6).map((skill) => (
              <button key={skill.id} type="button" onClick={() => setSelectedPrompt(skill.prompt)} className="group flex items-start gap-3 rounded-ds-md border border-ds-token-border bg-black/20 p-4 text-start transition hover:border-ds-token-gold/24 hover:bg-white/[0.045]">
                <Lightbulb className="mt-1 h-5 w-5 shrink-0 text-gold transition group-hover:-rotate-6" />
                <span className="text-sm font-bold leading-7 text-ds-text/72">{skill.prompt}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white">ذاكرة VORA</h2>
              <p className="mt-1 text-sm text-ds-text/50">محادثات ومخرجات محفوظة مرتبطة بسياق المشروع.</p>
            </div>
            <Link href="/history" className="text-sm font-black text-gold">عرض السجل</Link>
          </div>
          <Input value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} placeholder="ابحث في المحادثات السابقة" className="mb-4" />
          <div className="grid gap-3">
            {recentConversations.slice(0, 4).map((output) => (
              <div key={output.title} className="flex items-center gap-3 rounded-ds-md border border-ds-token-border bg-white/[0.03] p-4">
                <Sparkles className="h-5 w-5 text-[#51D8FF]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-white">{output.title}</p>
                  <p className="mt-1 text-xs text-ds-text/46">{output.tool} · {output.date}</p>
                </div>
                <Badge tone="neutral">VORA</Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <aside className="space-y-5">
        <GlassCard className="p-5">
          <Badge tone="gold">Project Context</Badge>
          <h3 className="mt-3 text-xl font-black text-white">سياق المشروع</h3>
          <div className="mt-4 grid gap-3">
            <ContextRow label="المشروع" value={project.title} />
            <ContextRow label="النوع" value={project.type} />
            <ContextRow label="الحالة" value={project.status} />
            <ContextRow label="التقدم" value={`${project.score}%`} />
            <ContextRow label="آخر تحديث" value={project.updatedAt} />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <Badge tone="blue">Attached Documents</Badge>
          <h3 className="mt-3 text-xl font-black text-white">وثائق مرتبطة</h3>
          <div className="mt-4 grid gap-3">
            {["ملخص المشروع", "متطلبات التنفيذ", "محضر اجتماع"].map((doc) => (
              <div key={doc} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <FileText className="h-5 w-5 text-gold" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ds-text/76">{doc}</span>
                <LockKeyhole className="h-4 w-4 text-ds-text/34" />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <Badge tone="success">Knowledge Summary</Badge>
          <h3 className="mt-3 text-xl font-black text-white">ملخص المعرفة</h3>
          <p className="mt-3 text-sm leading-7 text-ds-text/60">ملفات المعرفة تبقى مدارة عبر مساحة المعرفة الحالية. هذا القسم يعرض طبقة تنظيمية فقط داخل المشروع.</p>
          <div className="mt-4 grid gap-3">
            <MiniMetric label="ملفات معرفة" value="0" icon={<UploadCloud className="h-5 w-5" />} />
            <MiniMetric label="جاهزية السياق" value="قيد التجهيز" icon={<Bot className="h-5 w-5" />} />
          </div>
          <Link href="/projects#knowledge" className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-black text-ds-text transition hover:border-[#D4AF37]/30 hover:bg-white/[0.08]">
            فتح مساحة المعرفة
          </Link>
        </GlassCard>
      </aside>
    </div></LocalizedContent>
  );
}

function DocumentsTab({ project }: { project: ProjectWorkspaceProject }) {
  const { locale } = useI18n();
  const organizationId = project.organizationId || "atlas";
  const documentState = useDocumentsRepository(project.id);
  const departmentState = useDepartmentsRepository(organizationId);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [uploaderFilter, setUploaderFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [sort, setSort] = useState("updated");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [uploading, setUploading] = useState<Array<{ id: string; name: string; progress: number; error?: string; file?: File }>>([]);
  const [uploadMeta, setUploadMeta] = useState<Omit<DocumentUploadInput, "projectId" | "file">>({
    organizationId,
    category: "Architectural Drawings",
    version: "v1",
    tags: []
  });
  const [preview, setPreview] = useState<{ document: Document; url?: string; text?: string } | null>(null);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    setDocuments(documentState.data);
  }, [documentState.data]);

  useEffect(() => {
    setUploadMeta((current) => ({ ...current, organizationId }));
  }, [organizationId]);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return documents
      .filter((document) => {
        const matchesSearch = normalized ? [document.title, document.filename, document.category, document.departmentName, document.uploaderName, ...(document.tags || [])].filter(Boolean).join(" ").toLowerCase().includes(normalized) : true;
        const matchesCategory = categoryFilter === "All" || document.category === categoryFilter;
        const matchesUploader = uploaderFilter === "All" || document.uploaderName === uploaderFilter;
        const matchesTag = tagFilter === "All" || (document.tags || []).includes(tagFilter);
        return matchesSearch && matchesCategory && matchesUploader && matchesTag;
      })
      .sort((a, b) => {
        if (sort === "largest") return (b.fileSize || 0) - (a.fileSize || 0);
        if (sort === "name") return a.title.localeCompare(b.title);
        return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
      });
  }, [categoryFilter, documents, query, sort, tagFilter, uploaderFilter]);

  const stats = useMemo(() => documentRepository.getDocumentStats(documents), [documents]);
  const uploaders = useMemo(() => Array.from(new Set(documents.map((document) => document.uploaderName).filter(Boolean))) as string[], [documents]);
  const tags = useMemo(() => Array.from(new Set(documents.flatMap((document) => document.tags || []))), [documents]);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    for (const file of list) {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      setUploading((current) => [...current, { id, name: file.name, progress: 18, file }]);
      const result = await documentRepository.uploadDocument({
        projectId: project.id,
        organizationId,
        departmentId: uploadMeta.departmentId,
        category: uploadMeta.category,
        version: uploadMeta.version,
        tags: uploadMeta.tags,
        file
      });
      if (!result.data) {
        setUploading((current) => current.map((item) => item.id === id ? { ...item, progress: 100, error: result.error || "Upload failed." } : item));
        continue;
      }
      const department = departmentState.data.find((item) => item.id === result.data?.departmentId);
      setDocuments((current) => [{ ...result.data!, departmentName: result.data!.departmentName || department?.name }, ...current]);
      setUploading((current) => current.map((item) => item.id === id ? { ...item, progress: 100 } : item));
    }
  }

  async function downloadProjectDocument(document: Document) {
    const result = await documentRepository.downloadDocument(document);
    if (!result.data) {
      setMessage(result.error || "تعذر تحميل الوثيقة.");
      return;
    }
    const blob = result.data;
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = document.filename || `${document.title}.${document.mimeType?.includes("pdf") ? "pdf" : "txt"}`;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function previewDocument(document: Document) {
    const result = await documentRepository.downloadDocument(document);
    if (!result.data) {
      setMessage(result.error || "تعذر معاينة الوثيقة.");
      return;
    }
    const blob = result.data;
    if (document.mimeType?.startsWith("text/") || document.mimeType?.includes("markdown")) {
      setPreview({ document, text: await blob.text() });
      return;
    }
    if (document.mimeType?.startsWith("image/") || document.mimeType === "application/pdf") {
      setPreview({ document, url: URL.createObjectURL(blob) });
      return;
    }
    setPreview({ document, text: "لا تتوفر معاينة مباشرة لهذا النوع. يمكن تحميل الملف لفتحه في التطبيق المناسب." });
  }

  async function updateProjectDocument(documentId: string, input: Partial<ProjectDocumentInput>) {
    const result = await documentRepository.updateDocument(documentId, input);
    if (!result.data) {
      setMessage(result.error || "تعذر تحديث الوثيقة.");
      return;
    }
    setDocuments((current) => current.map((document) => document.id === documentId ? { ...document, ...result.data } : document));
    setMessage("تم تحديث بيانات الوثيقة.");
  }

  async function archiveProjectDocument(documentId: string) {
    const result = await documentRepository.archiveDocument(documentId);
    if (!result.data) {
      setMessage(result.error || "تعذر أرشفة الوثيقة.");
      return;
    }
    setDocuments((current) => current.filter((document) => document.id !== documentId));
    setMessage("تمت أرشفة الوثيقة.");
  }

  async function deleteProjectDocument(documentId: string) {
    const result = await documentRepository.deleteDocument(documentId);
    if (!result.data) {
      setMessage(result.error || "تعذر حذف الوثيقة نهائياً.");
      return;
    }
    setDocuments((current) => current.filter((document) => document.id !== documentId));
    setMessage("تم حذف الوثيقة نهائياً عبر المستودع.");
  }

  return (
    <LocalizedContent locale={locale}><div className="space-y-5">
      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Badge tone="gold">Documents</Badge>
            <h2 className="mt-2 text-2xl font-black text-white">وثائق المشروع</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-ds-text/58">إدارة وثائق المشروع وملفات التخزين عبر مستودع موحد يدعم Supabase Storage و Demo / Supabase / Auto modes.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer">
              <input type="file" multiple className="hidden" onChange={(event) => event.target.files && void uploadFiles(event.target.files)} />
              <span className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.065] px-5 text-sm font-black text-[#f8efd7] shadow-ds-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#D4AF37]/30 hover:bg-white/[0.095]">
                <UploadCloud className="h-4 w-4" /> رفع ملفات
              </span>
            </label>
            <Link href="/tools/document">
              <Button icon={<Sparkles className="h-4 w-4" />}>توليد وثيقة</Button>
            </Link>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_160px_160px_auto] xl:items-center">
          <Input label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في الوثائق، الفئات، الوسوم..." icon={<Search className="h-4 w-4" />} />
          <NativeSelect label="Category" value={categoryFilter} onChange={setCategoryFilter} options={[{ value: "All", label: "كل الفئات" }, ...documentCategories.map((category) => ({ value: category, label: category }))]} />
          <NativeSelect label="Uploader" value={uploaderFilter} onChange={setUploaderFilter} options={[{ value: "All", label: "كل الرافعين" }, ...uploaders.map((uploader) => ({ value: uploader, label: uploader }))]} />
          <NativeSelect label="Tag" value={tagFilter} onChange={setTagFilter} options={[{ value: "All", label: "كل الوسوم" }, ...tags.map((tag) => ({ value: tag, label: tag }))]} />
          <Dropdown label="Sort" value={sort} options={["updated", "largest", "name"]} onChange={setSort} />
          <div className="flex gap-2">
            <IconButton label="Grid view" tone={view === "grid" ? "gold" : "neutral"} onClick={() => setView("grid")}>
              <Grid2X2 className="h-5 w-5" />
            </IconButton>
            <IconButton label="Table view" tone={view === "table" ? "gold" : "neutral"} onClick={() => setView("table")}>
              <List className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
      </GlassCard>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniMetric label="Document count" value={String(stats.count)} icon={<FileText className="h-5 w-5" />} />
        <MiniMetric label="Storage usage" value={formatBytes(stats.storageUsage)} icon={<FileArchive className="h-5 w-5" />} />
        <MiniMetric label="Categories" value={String(Object.keys(stats.categories).length)} icon={<FolderKanban className="h-5 w-5" />} />
        <MiniMetric label="Largest file" value={stats.largestFiles[0] ? formatBytes(stats.largestFiles[0].fileSize || 0) : "0 B"} icon={<Download className="h-5 w-5" />} />
      </section>

      <section
        className="ds-surface ds-lift rounded-[1.85rem] border-dashed p-5"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void uploadFiles(event.dataTransfer.files);
        }}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px_180px] lg:items-end">
          <div>
            <Badge tone="blue">Upload Area</Badge>
            <h3 className="mt-2 text-xl font-black text-white">اسحب الملفات هنا أو اختر ملفات متعددة</h3>
            <p className="mt-2 text-sm leading-7 text-ds-text/56">Bucket expected: vorqa-project-documents. لن يتم إنشاء bucket تلقائياً.</p>
          </div>
          <NativeSelect label="Category" value={String(uploadMeta.category || "Other")} onChange={(value) => setUploadMeta((current) => ({ ...current, category: value as ProjectDocumentCategory }))} options={documentCategories.map((category) => ({ value: category, label: category }))} />
          <NativeSelect label="Department" value={uploadMeta.departmentId || ""} onChange={(value) => setUploadMeta((current) => ({ ...current, departmentId: value || undefined }))} options={[{ value: "", label: "عام" }, ...departmentState.data.map((department) => ({ value: department.id, label: department.name }))]} />
          <Input label="Tags" value={(uploadMeta.tags || []).join(", ")} onChange={(event) => setUploadMeta((current) => ({ ...current, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} placeholder="permit, approved" />
        </div>
        {uploading.length > 0 && (
          <div className="mt-5 grid gap-3">
            {uploading.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm font-black text-ds-text">
                  <span className="truncate">{item.name}</span>
                  <div className="flex gap-2">
                    {item.error && item.file && <Button type="button" size="sm" variant="secondary" onClick={() => void uploadFiles([item.file!])}>Retry</Button>}
                    <Button type="button" size="sm" variant="ghost" onClick={() => setUploading((current) => current.filter((upload) => upload.id !== item.id))}>Cancel</Button>
                  </div>
                </div>
                <ProgressBar value={item.progress} tone={item.error ? "danger" : "gold"} />
                {item.error && <p className="mt-2 text-xs font-bold text-[#FFB4B4]">{item.error}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {message && <p className="rounded-2xl border border-[#D4AF37]/18 bg-[#D4AF37]/10 p-3 text-sm font-bold leading-6 text-[#F5D878]">{message}</p>}

      {documentState.loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="ds-skeleton h-44 rounded-[1.75rem]" />)}</div>
      ) : documentState.error && !documentState.isFallback ? (
        <GlassCard className="p-5">
          <p className="rounded-2xl border border-[#EF4444]/24 bg-[#EF4444]/10 p-4 text-sm font-bold text-[#FFB4B4]">{documentState.error}</p>
        </GlassCard>
      ) : filteredDocuments.length === 0 ? (
        <EmptyState
          title="لا توجد وثائق لهذا المشروع بعد"
          description="ولّد وثيقة عبر VORA أو ارفع ملفاً جديداً إلى مساحة وثائق المشروع."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/tools/document"><Button>توليد وثيقة</Button></Link>
            </div>
          }
        />
      ) : (
        view === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((document) => (
              <ProjectDocumentCard key={document.id} document={document} onPreview={() => void previewDocument(document)} onDownload={() => void downloadProjectDocument(document)} onArchive={() => void archiveProjectDocument(document.id)} onDelete={() => void deleteProjectDocument(document.id)} onUpdate={(input) => void updateProjectDocument(document.id, input)} departments={departmentState.data} />
            ))}
          </div>
        ) : (
          <GlassCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] border-collapse text-sm">
                <thead className="border-b border-white/10 bg-white/[0.055] text-gold">
                  <tr>{["Document", "Category", "Uploader", "Size", "Tags", "Updated", "Actions"].map((column) => <th key={column} className="px-4 py-3 text-right font-black">{column}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((document) => (
                    <tr key={document.id} className="border-b border-white/10 text-ds-text/70 transition hover:bg-white/[0.045]">
                      <td className="px-4 py-3 font-black text-white">{document.title}</td>
                      <td className="px-4 py-3">{document.category || "Other"}</td>
                      <td className="px-4 py-3">{document.uploaderName || "VORA"}</td>
                      <td className="px-4 py-3">{formatBytes(document.fileSize || 0)}</td>
                      <td className="px-4 py-3">{(document.tags || []).join(", ") || "-"}</td>
                      <td className="px-4 py-3">{document.updatedAt?.slice(0, 10) || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => void previewDocument(document)}>Preview</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => void downloadProjectDocument(document)}>Download</Button>
                          <Button type="button" size="sm" variant="danger" onClick={() => void archiveProjectDocument(document.id)}>Archive</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {preview && (
          <GlassCard className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone="gold">Preview</Badge>
                <h3 className="mt-2 text-xl font-black text-white">{preview.document.title}</h3>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => setPreview(null)}>إغلاق</Button>
            </div>
            {preview.url && preview.document.mimeType?.startsWith("image/") && <Image src={preview.url} alt={preview.document.title} width={1600} height={900} unoptimized className="max-h-[520px] w-full rounded-3xl object-contain" />}
            {preview.url && preview.document.mimeType === "application/pdf" && <iframe src={preview.url} title={preview.document.title} className="h-[520px] w-full rounded-3xl border border-white/10" />}
            {preview.text && <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-3xl border border-white/10 bg-black/24 p-4 text-sm leading-7 text-ds-text/70">{preview.text}</pre>}
          </GlassCard>
        )}
        <GlassCard className="p-5">
          <div className="flex items-start gap-4">
            <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
            <div>
              <Badge tone="blue">VORA Document Insights</Badge>
              <h3 className="mt-3 text-xl font-black text-white">رؤية الوثائق</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <ContextRow label="Missing documents" value={stats.categories.Permits ? "Low" : "Permits"} />
            <ContextRow label="Recent uploads" value={String(stats.recentUploads.length)} />
            <ContextRow label="Large files" value={stats.largestFiles[0]?.filename || "None"} />
            <ContextRow label="Expiring permits" value={documents.some((document) => document.category === "Permits") ? "Review required" : "Not uploaded"} />
          </div>
        </GlassCard>
      </div>
    </div></LocalizedContent>
  );
}

function KnowledgeTab({ project }: { project: ProjectWorkspaceProject }) {
  const { locale } = useI18n();
  const organizationId = project.organizationId || "atlas";
  const knowledgeState = useKnowledgeRepository({ organizationId, projectId: project.id });
  const documentsState = useDocumentsRepository(project.id);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState("updated");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | undefined>();
  const [form, setForm] = useState<KnowledgeArticleInput>({
    organizationId,
    projectId: project.id,
    title: "",
    summary: "",
    content: "",
    category: "Building Standards",
    tags: [],
    status: "Published"
  });

  useEffect(() => {
    setArticles(knowledgeState.data);
  }, [knowledgeState.data]);

  useEffect(() => {
    setForm((current) => ({ ...current, organizationId, projectId: project.id }));
  }, [organizationId, project.id]);

  const allTags = useMemo(() => Array.from(new Set(articles.flatMap((article) => article.tags || []))).sort(), [articles]);
  const stats = useMemo(() => knowledgeRepository.getKnowledgeStats(articles), [articles]);
  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return articles
      .filter((article) => {
        const searchBody = [article.title, article.summary, article.content, article.category, ...(article.tags || [])].filter(Boolean).join(" ").toLowerCase();
        const matchesSearch = normalized ? searchBody.includes(normalized) : true;
        const matchesCategory = categoryFilter === "All" || article.category === categoryFilter;
        const matchesTag = tagFilter === "All" || (article.tags || []).includes(tagFilter);
        const matchesStatus = statusFilter === "All" || article.status === statusFilter;
        return matchesSearch && matchesCategory && matchesTag && matchesStatus;
      })
      .sort((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "category") return String(a.category || "").localeCompare(String(b.category || ""));
        return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
      });
  }, [articles, categoryFilter, query, sort, statusFilter, tagFilter]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      organizationId,
      projectId: project.id,
      title: "",
      summary: "",
      content: "",
      category: "Building Standards",
      tags: [],
      status: "Published"
    });
  };

  const saveArticle = async () => {
    if (!form.title.trim()) {
      setMessage("أدخل عنوان المقالة قبل الحفظ.");
      return;
    }
    const input = { ...form, title: form.title.trim(), tags: form.tags || [] };
    const result = editingId
      ? await knowledgeRepository.updateKnowledge(editingId, input)
      : await knowledgeRepository.createKnowledge(input);
    if (result.data) {
      setArticles((current) => editingId ? current.map((article) => article.id === editingId ? result.data! : article) : [result.data!, ...current]);
      setMessage(editingId ? "تم تحديث المقالة المعرفية." : "تم إنشاء مقالة معرفية جديدة.");
      resetForm();
    } else {
      setMessage(result.error || "تعذر حفظ المقالة المعرفية.");
    }
  };

  const archiveArticle = async (articleId: string) => {
    const result = await knowledgeRepository.archiveKnowledge(articleId);
    if (result.data) {
      setArticles((current) => current.map((article) => article.id === articleId ? { ...article, status: "Archived", updatedAt: new Date().toISOString() } : article));
      setMessage("تم أرشفة المقالة دون حذفها نهائياً.");
    } else {
      setMessage(result.error || "تعذر أرشفة المقالة.");
    }
  };

  return (
    <LocalizedContent locale={locale}><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricPanel label="المقالات" value={stats.count} hint="قاعدة معرفة المشروع" icon={<BookOpen className="h-5 w-5" />} />
          <MetricPanel label="الفئات" value={Object.keys(stats.categories).length} hint="تصنيف تشغيلي" icon={<Hash className="h-5 w-5" />} />
          <MetricPanel label="المسودات" value={stats.draftCount} hint="تحتاج اعتماداً" icon={<FileText className="h-5 w-5" />} />
          <MetricPanel label="الملفات" value={documentsState.data.length} hint="مرتبطة بالمشروع" icon={<FileArchive className="h-5 w-5" />} />
        </div>

        <GlassCard className="p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge tone="gold">Knowledge Base</Badge>
              <h2 className="mt-2 text-2xl font-black text-white">قاعدة معرفة المشروع</h2>
              <p className="mt-2 text-sm leading-7 text-ds-text/60">مقالات تشغيلية مرتبطة بالمشروع والوثائق والقرارات اليومية، مع بقاء ملفات المعرفة الحالية ضمن Supabase Storage.</p>
            </div>
            <Badge tone={knowledgeState.isFallback ? "warning" : "success"}>{knowledgeState.source}</Badge>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_180px_160px_150px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-text/45" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في المعرفة، الوسوم، أو المحتوى" className="pr-11" />
            </div>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none">
              <option>All</option>
              {knowledgeCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
            <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none">
              <option>All</option>
              {allTags.map((tag) => <option key={tag}>{tag}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none">
              <option>All</option>
              {knowledgeStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 rounded-xl border border-white/10 bg-white/[0.055] px-3 text-xs text-white outline-none">
              <option value="updated">الأحدث تحديثاً</option>
              <option value="title">حسب العنوان</option>
              <option value="category">حسب الفئة</option>
            </select>
            <span className="text-xs text-ds-text/55">{filteredArticles.length} نتيجة</span>
          </div>
        </GlassCard>

        {knowledgeState.loading ? (
          <GlassCard className="p-6 text-sm text-ds-text/60">جاري تحميل قاعدة المعرفة...</GlassCard>
        ) : knowledgeState.error && knowledgeState.source !== "demo-fallback" ? (
          <GlassCard className="p-6">
            <EmptyState title="تعذر تحميل المعرفة" description={knowledgeState.error} />
          </GlassCard>
        ) : filteredArticles.length === 0 ? (
          <GlassCard className="p-6">
            <EmptyState title="لا توجد مقالات مطابقة" description="ابدأ بإضافة إجراء، معيار، أو قائمة تحقق مرتبطة بهذا المشروع." />
          </GlassCard>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredArticles.map((article) => (
              <GlassCard key={article.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge tone={article.status === "Archived" ? "neutral" : article.status === "Draft" ? "warning" : "success"}>{article.status}</Badge>
                    <h3 className="mt-3 text-lg font-black text-white">{article.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-ds-text/60">{article.summary}</p>
                  </div>
                  <IconButton label="أرشفة" tone="warning" onClick={() => archiveArticle(article.id)}>
                    <FileArchive className="h-4 w-4" />
                  </IconButton>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {article.category && <Badge tone="blue">{article.category}</Badge>}
                  {(article.tags || []).map((tag) => <Badge key={tag} tone="neutral">#{tag}</Badge>)}
                </div>
                <div className="mt-4 grid gap-2 text-xs text-ds-text/55">
                  <span>وثيقة مرتبطة: {article.documentTitle || "غير محددة"}</span>
                  <span>آخر تحديث: {article.updatedAt ? new Date(article.updatedAt).toLocaleDateString("ar-MA") : "غير محدد"}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => {
                    setEditingId(article.id);
                    setForm({
                      organizationId,
                      projectId: project.id,
                      documentId: article.documentId,
                      title: article.title,
                      summary: article.summary,
                      content: article.content,
                      category: article.category,
                      tags: article.tags || [],
                      status: article.status
                    });
                  }}>تعديل</Button>
                  <Button size="sm" variant="ghost">فتح</Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <Badge tone="blue">{editingId ? "Edit" : "Create"}</Badge>
              <h3 className="mt-2 text-xl font-black text-white">{editingId ? "تعديل مقالة معرفية" : "إضافة مقالة معرفية"}</h3>
            </div>
            {editingId && <Button size="sm" variant="ghost" onClick={resetForm}>إلغاء</Button>}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="عنوان المقالة" />
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none">
              {knowledgeCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
            <select value={form.documentId || ""} onChange={(event) => setForm({ ...form, documentId: event.target.value || undefined })} className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none">
              <option value="">بدون وثيقة مرتبطة</option>
              {documentsState.data.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}
            </select>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none">
              {knowledgeStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
          <Textarea value={form.summary || ""} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="ملخص قصير" className="mt-3 min-h-[92px]" />
          <Textarea value={form.content || ""} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="المحتوى التفصيلي بصيغة Markdown" className="mt-3 min-h-[160px]" />
          <Input value={(form.tags || []).join(", ")} onChange={(event) => setForm({ ...form, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} placeholder="وسوم مفصولة بفواصل" className="mt-3" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={saveArticle} icon={<Plus className="h-4 w-4" />}>{editingId ? "حفظ التعديل" : "إنشاء مقالة"}</Button>
            {message && <span className="text-sm text-ds-text/60">{message}</span>}
          </div>
        </GlassCard>

        <KnowledgeWorkspace projectId={project.id} projectTitle={project.title} />
      </div>
      <aside className="space-y-5">
        <GlassCard className="p-5">
          <div className="flex items-start gap-4">
            <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
            <div>
              <Badge tone="success">VORA Knowledge</Badge>
              <h3 className="mt-3 text-xl font-black text-white">رؤى المعرفة</h3>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-ds-text/60">هذه الرؤى تجريبية فقط ولا تستدعي OpenAI. الهدف هو إظهار فجوات المعرفة والقراءة المقترحة داخل المشروع.</p>
          <div className="mt-5 space-y-3">
            <InsightRow title="توثيق ناقص" text="أضف إجراء اعتماد الموردين قبل مرحلة المشتريات." />
            <InsightRow title="قراءة مقترحة" text="راجع مواصفات الخرسانة وقائمة فحص الأساسات." />
            <InsightRow title="إجراء محدث" text="تم تحديث إجراءات السلامة مؤخراً وتحتاج مشاركة مع الفريق." />
            <InsightRow title="موضوع مكرر" text="يوجد تشابه بين ضبط الجودة وقائمة الفحص، يمكن دمجهما لاحقاً." />
          </div>
          <div className="mt-5 grid gap-3">
            <MiniMetric label="نطاق المشروع" value={project.id} icon={<FolderKanban className="h-5 w-5" />} />
            <MiniMetric label="الأكثر قراءة" value={stats.mostViewed[0]?.title || "غير متاح"} icon={<BookOpen className="h-5 w-5" />} />
            <MiniMetric label="RAG / OCR" value="غير مفعل" icon={<Bot className="h-5 w-5" />} />
          </div>
        </GlassCard>
      </aside>
    </div></LocalizedContent>
  );
}

function InsightRow({ title, text }: { title: string; text: string }) {
  return (<AutoLocalizedContent>
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs leading-6 text-ds-text/55">{text}</p>
    </div>
  </AutoLocalizedContent>);
}

function MetricPanel({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint: string; icon: React.ReactNode }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ds-text/55">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs text-ds-text/45">{hint}</p>
        </div>
        <span className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-[#F2D487]">{icon}</span>
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function BudgetTab({ project }: { project: ProjectWorkspaceProject; detail: ProjectDetail }) {
  const organizationId = project.organizationId || "atlas";
  const budgetState = useBudgetRepository(project.id);
  const departmentState = useDepartmentsRepository(organizationId);
  const [budget, setBudget] = useState(budgetState.data);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState<string | undefined>();
  const [categoryForm, setCategoryForm] = useState<BudgetCategoryInput>({
    organizationId,
    name: "",
    description: "",
    color: "#D4AF37"
  });
  const [itemForm, setItemForm] = useState<ProjectBudgetItemInput>({
    projectId: project.id,
    organizationId,
    title: "",
    description: "",
    plannedCost: 0,
    actualCost: 0,
    committedCost: 0,
    status: "Planned",
    priority: "Medium"
  });

  useEffect(() => {
    setBudget(budgetState.data);
  }, [budgetState.data]);

  useEffect(() => {
    setCategoryForm((current) => ({ ...current, organizationId }));
    setItemForm((current) => ({ ...current, projectId: project.id, organizationId }));
  }, [organizationId, project.id]);

  const stats = useMemo(() => budgetRepository.getBudgetStats(budget), [budget]);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return budget.items.filter((item) => {
      const queryMatch = !query || [item.title, item.description, item.categoryName, item.departmentName].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
      const categoryMatch = categoryFilter === "All" || item.categoryId === categoryFilter;
      const statusMatch = statusFilter === "All" || item.status === statusFilter;
      return queryMatch && categoryMatch && statusMatch;
    });
  }, [budget.items, categoryFilter, search, statusFilter]);

  const quickActions = [
    { title: "إضافة مصروف", description: "أنشئ بند تكلفة جديد للمشروع", icon: <Plus className="h-5 w-5" />, tone: "gold" as const },
    { title: "رفع فاتورة", description: "سيستخدم مسار الملفات عند الربط", icon: <UploadCloud className="h-5 w-5" />, tone: "blue" as const },
    { title: "توليد تقرير ميزانية", description: "افتح VORA لإعداد تقرير", icon: <BarChart3 className="h-5 w-5" />, tone: "success" as const, href: "/tools/document" },
    { title: "تصدير الميزانية", description: "واجهة تصدير فقط حالياً", icon: <Download className="h-5 w-5" />, tone: "neutral" as const }
  ];

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      setMessage("اسم فئة الميزانية مطلوب.");
      return;
    }
    const result = await budgetRepository.createCategory({ ...categoryForm, name: categoryForm.name.trim(), description: categoryForm.description?.trim() });
    if (!result.data) {
      setMessage(result.error || "تعذر إنشاء الفئة.");
      return;
    }
    setBudget((current) => ({ ...current, categories: [result.data!, ...current.categories] }));
    setCategoryForm({ organizationId, name: "", description: "", color: "#D4AF37" });
    setMessage("تم إنشاء فئة الميزانية.");
  }

  async function updateCategory(categoryId: string, input: Partial<BudgetCategoryInput>) {
    const result = await budgetRepository.updateCategory(categoryId, input);
    if (!result.data) {
      setMessage(result.error || "تعذر تحديث الفئة.");
      return;
    }
    setBudget((current) => ({ ...current, categories: current.categories.map((category) => (category.id === categoryId ? { ...category, ...result.data } : category)) }));
    setMessage("تم تحديث الفئة.");
  }

  async function archiveCategory(categoryId: string) {
    const result = await budgetRepository.archiveCategory(categoryId);
    if (!result.data) {
      setMessage(result.error || "تعذر أرشفة الفئة.");
      return;
    }
    setBudget((current) => ({ ...current, categories: current.categories.filter((category) => category.id !== categoryId), items: current.items.map((item) => item.categoryId === categoryId ? { ...item, categoryId: undefined, categoryName: undefined } : item) }));
    setMessage("تمت أرشفة الفئة.");
  }

  async function createBudgetItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!itemForm.title.trim()) {
      setMessage("عنوان بند الميزانية مطلوب.");
      return;
    }
    if (itemForm.categoryId && !budget.categories.some((category) => category.id === itemForm.categoryId)) {
      setMessage("فئة الميزانية لا تنتمي إلى المنظمة الحالية.");
      return;
    }
    if (itemForm.departmentId && !departmentState.data.some((department) => department.id === itemForm.departmentId)) {
      setMessage("القسم المختار لا ينتمي إلى المنظمة الحالية.");
      return;
    }
    const result = await budgetRepository.createBudgetItem({
      ...itemForm,
      title: itemForm.title.trim(),
      description: itemForm.description?.trim(),
      plannedCost: Number(itemForm.plannedCost || 0),
      actualCost: Number(itemForm.actualCost || 0),
      committedCost: Number(itemForm.committedCost || 0)
    });
    if (!result.data) {
      setMessage(result.error || "تعذر إنشاء بند الميزانية.");
      return;
    }
    const category = budget.categories.find((entry) => entry.id === result.data?.categoryId);
    const department = departmentState.data.find((entry) => entry.id === result.data?.departmentId);
    setBudget((current) => ({ ...current, items: [{ ...result.data!, categoryName: result.data!.categoryName || category?.name, categoryColor: result.data!.categoryColor || category?.color, departmentName: result.data!.departmentName || department?.name }, ...current.items] }));
    setItemForm({ projectId: project.id, organizationId, title: "", description: "", plannedCost: 0, actualCost: 0, committedCost: 0, status: "Planned", priority: "Medium" });
    setMessage("تم إنشاء بند الميزانية.");
  }

  async function updateBudgetItem(itemId: string, input: Partial<ProjectBudgetItemInput>) {
    const result = await budgetRepository.updateBudgetItem(itemId, input);
    if (!result.data) {
      setMessage(result.error || "تعذر تحديث بند الميزانية.");
      return;
    }
    const category = budget.categories.find((entry) => entry.id === result.data?.categoryId);
    const department = departmentState.data.find((entry) => entry.id === result.data?.departmentId);
    setBudget((current) => ({
      ...current,
      items: current.items.map((item) => item.id === itemId ? { ...item, ...result.data, categoryName: result.data?.categoryName || category?.name || item.categoryName, categoryColor: result.data?.categoryColor || category?.color || item.categoryColor, departmentName: result.data?.departmentName || department?.name || item.departmentName } : item)
    }));
    setMessage("تم تحديث بند الميزانية.");
  }

  async function archiveBudgetItem(itemId: string) {
    const result = await budgetRepository.archiveBudgetItem(itemId);
    if (!result.data) {
      setMessage(result.error || "تعذر أرشفة بند الميزانية.");
      return;
    }
    setBudget((current) => ({ ...current, items: current.items.filter((item) => item.id !== itemId) }));
    setMessage("تمت أرشفة بند الميزانية.");
  }

  return (<AutoLocalizedContent>
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <GlassCard className="relative overflow-hidden p-5">
          <BlueprintOverlay className="opacity-20" />
          <div className="relative z-10">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Badge tone="gold">Budget Overview</Badge>
                <h2 className="mt-2 text-2xl font-black text-white">مساحة ميزانية المشروع</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-ds-text/58">نظام ميزانية وتكلفة مرتبط بالمشروع والفئات والأقسام عبر طبقة المستودعات مع الحفاظ على Demo / Supabase / Auto modes.</p>
              </div>
              <Badge tone="blue">{budgetState.source}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <BudgetMetricCard title="الميزانية المخططة" value={formatMoney(stats.planned)} detail="Total planned budget" icon={<Coins className="h-6 w-6" />} tone="gold" />
              <BudgetMetricCard title="التكلفة الفعلية" value={formatMoney(stats.actual)} detail="Actual paid/captured cost" icon={<Gauge className="h-6 w-6" />} tone="blue" />
              <BudgetMetricCard title="الميزانية المتبقية" value={formatMoney(stats.remaining)} detail="Remaining after actual and committed" icon={<CheckCircle2 className="h-6 w-6" />} tone="success" />
            </div>

            <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-black/24 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-white">تقدم الميزانية</h3>
                  <p className="mt-1 text-sm text-ds-text/50">Actual + committed versus planned.</p>
                </div>
                <Badge tone={stats.overBudget ? "warning" : "neutral"}>{stats.progress}% مستخدم</Badge>
              </div>
              <ProgressBar value={stats.progress} tone={stats.overBudget ? "warning" : "gold"} label="نسبة الصرف والالتزام" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-start gap-4">
            <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
            <div>
              <Badge tone="blue">AI Budget Insights</Badge>
              <h3 className="mt-3 text-xl font-black text-white">رؤية VORA المالية</h3>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-ds-text/60">رصدت VORA {stats.overBudget ? `${stats.overBudget} بنداً فوق الميزانية` : "استقراراً في الميزانية الحالية"}، والتوقع الحالي هو {formatMoney(stats.forecast)}.</p>
          <div className="mt-4 grid gap-3">
            <ContextRow label="Cost overrun" value={stats.overBudget ? `${stats.overBudget} items` : "None"} />
            <ContextRow label="Unused budget" value={formatMoney(stats.remaining)} />
            <ContextRow label="Forecast" value={formatMoney(stats.forecast)} />
            <ContextRow label="المشروع" value={project.id} />
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <GlassCard className="p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
              <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث في البنود والفئات والأقسام" icon={<Search className="h-4 w-4" />} />
              <NativeSelect label="Category" value={categoryFilter} onChange={setCategoryFilter} options={[{ value: "All", label: "كل الفئات" }, ...budget.categories.map((category) => ({ value: category.id, label: category.name }))]} />
              <Dropdown label="Status" value={statusFilter} options={["All", ...budgetItemStatuses]} onChange={setStatusFilter} />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone="gold">Cost Categories</Badge>
                <h2 className="mt-2 text-2xl font-black text-white">فئات التكلفة</h2>
              </div>
              <Badge tone="neutral">{budget.categories.length} فئات</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {budget.categories.map((category) => <BudgetCategoryCard key={category.id} category={category} total={stats.topCategories.find((entry) => entry.category.id === category.id)?.total || 0} planned={stats.planned} onUpdate={(input) => void updateCategory(category.id, input)} onArchive={() => void archiveCategory(category.id)} />)}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone="blue">Budget Table</Badge>
                <h2 className="mt-2 text-2xl font-black text-white">بنود الميزانية</h2>
              </div>
              <Button type="button" variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => document.getElementById("budget-item-title")?.focus()}>إضافة بند</Button>
            </div>
            {budgetState.loading ? (
              <div className="grid gap-3">
                {[0, 1, 2].map((item) => <div key={item} className="ds-skeleton h-20 rounded-3xl" />)}
              </div>
            ) : budgetState.error && !budgetState.isFallback ? (
              <EmptyState title="تعذر تحميل الميزانية" description={budgetState.error} />
            ) : filteredItems.length === 0 ? (
              <EmptyState title="لا توجد بنود مطابقة" description="عدّل البحث أو أضف بند ميزانية جديد." />
            ) : (
              <div className="grid gap-3">
                {filteredItems.map((item) => <BudgetItemRow key={item.id} item={item} categories={budget.categories} departments={departmentState.data} onUpdate={(input) => void updateBudgetItem(item.id, input)} onArchive={() => void archiveBudgetItem(item.id)} />)}
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-5">
              <Badge tone="gold">Budget CRUD</Badge>
              <h2 className="mt-2 text-2xl font-black text-white">إضافة بند تكلفة</h2>
            </div>
            <form className="grid gap-4" onSubmit={createBudgetItem}>
              <Input id="budget-item-title" label="Title" value={itemForm.title} onChange={(event) => setItemForm((current) => ({ ...current, title: event.target.value }))} placeholder="مثلاً: Concrete supply" />
              <Textarea label="Description" value={itemForm.description} onChange={(event) => setItemForm((current) => ({ ...current, description: event.target.value }))} placeholder="وصف مختصر للبند" />
              <div className="grid gap-3 md:grid-cols-4">
                <NativeSelect label="Category" value={itemForm.categoryId || ""} onChange={(value) => setItemForm((current) => ({ ...current, categoryId: value || undefined }))} options={[{ value: "", label: "بدون فئة" }, ...budget.categories.map((category) => ({ value: category.id, label: category.name }))]} />
                <NativeSelect label="Department" value={itemForm.departmentId || ""} onChange={(value) => setItemForm((current) => ({ ...current, departmentId: value || undefined }))} options={[{ value: "", label: "عام" }, ...departmentState.data.map((department) => ({ value: department.id, label: department.name }))]} />
                <Dropdown label="Status" value={itemForm.status} options={budgetItemStatuses} onChange={(value) => setItemForm((current) => ({ ...current, status: value as BudgetItemStatus }))} />
                <Dropdown label="Priority" value={itemForm.priority} options={budgetPriorities} onChange={(value) => setItemForm((current) => ({ ...current, priority: value as BudgetPriority }))} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input label="Planned" type="number" min={0} value={String(itemForm.plannedCost || 0)} onChange={(event) => setItemForm((current) => ({ ...current, plannedCost: Number(event.target.value || 0) }))} />
                <Input label="Actual" type="number" min={0} value={String(itemForm.actualCost || 0)} onChange={(event) => setItemForm((current) => ({ ...current, actualCost: Number(event.target.value || 0) }))} />
                <Input label="Committed" type="number" min={0} value={String(itemForm.committedCost || 0)} onChange={(event) => setItemForm((current) => ({ ...current, committedCost: Number(event.target.value || 0) }))} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Start date" type="date" value={itemForm.startDate || ""} onChange={(event) => setItemForm((current) => ({ ...current, startDate: event.target.value || undefined }))} />
                <Input label="End date" type="date" value={itemForm.endDate || ""} onChange={(event) => setItemForm((current) => ({ ...current, endDate: event.target.value || undefined }))} />
              </div>
              <Button type="submit" icon={<Plus className="h-4 w-4" />}>إنشاء بند تكلفة</Button>
            </form>
          </GlassCard>
        </div>

        <aside className="space-y-5">
          <GlassCard className="p-5">
            <Badge tone="gold">Quick Actions</Badge>
            <h3 className="mt-3 text-xl font-black text-white">إجراءات الميزانية</h3>
            <div className="mt-4 grid gap-3">
              {quickActions.map((action) =>
                action.href ? (
                  <Link key={action.title} href={action.href} className="group rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/28 hover:bg-white/[0.065]">
                    <BudgetActionContent action={action} />
                  </Link>
                ) : (
                  <button key={action.title} type="button" className="group rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-start transition hover:-translate-y-0.5 hover:border-[#D4AF37]/28 hover:bg-white/[0.065]">
                    <BudgetActionContent action={action} />
                  </button>
                )
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="blue">Create Category</Badge>
            <h3 className="mt-3 text-xl font-black text-white">فئة ميزانية جديدة</h3>
            <form className="mt-4 grid gap-3" onSubmit={createCategory}>
              <Input label="Name" value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="مثلاً: Materials" />
              <Textarea label="Description" value={categoryForm.description} onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} placeholder="وصف الفئة" />
              <Input label="Color" type="color" value={categoryForm.color || "#D4AF37"} onChange={(event) => setCategoryForm((current) => ({ ...current, color: event.target.value }))} />
              <Button type="submit" size="sm">إضافة فئة</Button>
              {message && <p className="rounded-2xl border border-[#D4AF37]/18 bg-[#D4AF37]/10 p-3 text-sm font-bold leading-6 text-[#F5D878]">{message}</p>}
            </form>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="blue">Budget Timeline</Badge>
            <h3 className="mt-3 text-xl font-black text-white">خط الميزانية</h3>
            <div className="mt-5 grid gap-4">
              <TimelineCard index={1} title="تحديد الميزانية المخططة" text="الخطوة الأولى قبل احتساب المتبقي والانحرافات." icon={<Coins className="h-4 w-4" />} />
              <TimelineCard index={2} title="إضافة المصاريف والفواتير" text="سيتم ربطها لاحقاً دون تغيير العقود الحالية." icon={<UploadCloud className="h-4 w-4" />} />
              <TimelineCard index={3} title="تقرير VORA المالي" text="جاهز كمسار واجهة عبر مولد الوثائق الحالي." icon={<Bot className="h-4 w-4" />} />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="neutral">Repository Mode</Badge>
            <div className="mt-4 grid gap-3">
              <ContextRow label="المصدر" value={budgetState.source} />
              <ContextRow label="Fallback" value={budgetState.isFallback ? "مفعل" : "غير مفعل"} />
              <ContextRow label="Committed" value={formatMoney(stats.committed)} />
            </div>
          </GlassCard>
        </aside>
      </section>
    </div>
  </AutoLocalizedContent>);
}

function BudgetCategoryCard({ category, total, planned, onUpdate, onArchive }: { category: BudgetCategory; total: number; planned: number; onUpdate: (input: Partial<BudgetCategoryInput>) => void; onArchive: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<BudgetCategoryInput>>({ name: category.name, description: category.description, color: category.color });
  const percent = planned ? Math.round((total / planned) * 100) : 0;
  return (<AutoLocalizedContent>
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-1 hover:border-[#D4AF37]/28 hover:bg-white/[0.065]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone="gold">{category.name}</Badge>
          <p className="mt-4 text-2xl font-black text-white">{formatMoney(total)}</p>
          <p className="mt-2 text-xs leading-5 text-ds-text/48">{category.description || "Budget category"}</p>
        </div>
        <span className="h-6 w-6 rounded-full border border-white/20" style={{ backgroundColor: category.color || "#D4AF37" }} />
      </div>
      <div className="mt-5"><ProgressBar value={percent} tone="gold" label="نسبة من الميزانية" /></div>
      <div className="mt-4 flex gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => setEditing((current) => !current)}>تعديل</Button>
        <Button type="button" size="sm" variant="danger" onClick={onArchive}>أرشفة</Button>
      </div>
      {editing && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/22 p-3">
          <Input label="Name" value={draft.name || ""} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          <Input label="Color" type="color" value={draft.color || "#D4AF37"} onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))} />
          <Button type="button" size="sm" onClick={() => onUpdate(draft)}>حفظ</Button>
        </div>
      )}
    </div>
  </AutoLocalizedContent>);
}

function BudgetItemRow({ item, categories, departments, onUpdate, onArchive }: { item: ProjectBudgetItem; categories: BudgetCategory[]; departments: Array<{ id: string; name: string }>; onUpdate: (input: Partial<ProjectBudgetItemInput>) => void; onArchive: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<ProjectBudgetItemInput>>({
    categoryId: item.categoryId,
    departmentId: item.departmentId,
    status: item.status,
    priority: item.priority,
    plannedCost: item.plannedCost,
    actualCost: item.actualCost,
    committedCost: item.committedCost,
    endDate: item.endDate
  });
  const used = item.actualCost + item.committedCost;
  const percent = item.plannedCost ? Math.round((used / item.plannedCost) * 100) : 0;

  return (<AutoLocalizedContent>
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-1 hover:border-[#D4AF37]/28 hover:bg-white/[0.065]">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px_180px_auto] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge tone={budgetStatusTone(item.status)}>{item.status}</Badge>
            <Badge tone={budgetPriorityTone(item.priority)}>{item.priority}</Badge>
          </div>
          <h3 className="mt-3 text-lg font-black text-white">{item.title}</h3>
          <p className="mt-2 text-xs leading-5 text-ds-text/50">{item.categoryName || "بدون فئة"} · {item.departmentName || "عام"} · {item.endDate || "بدون تاريخ"}</p>
        </div>
        <ContextRow label="Planned" value={formatMoney(item.plannedCost)} />
        <ContextRow label="Used" value={formatMoney(used)} />
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditing((current) => !current)}>تعديل</Button>
          <Button type="button" size="sm" variant="danger" onClick={onArchive}>أرشفة</Button>
        </div>
      </div>
      <div className="mt-4"><ProgressBar value={percent} tone={percent > 100 ? "danger" : "gold"} label="Actual + committed" /></div>
      {editing && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/22 p-3 lg:grid-cols-4">
          <NativeSelect label="Category" value={draft.categoryId || ""} onChange={(value) => setDraft((current) => ({ ...current, categoryId: value || undefined }))} options={[{ value: "", label: "بدون فئة" }, ...categories.map((category) => ({ value: category.id, label: category.name }))]} />
          <NativeSelect label="Department" value={draft.departmentId || ""} onChange={(value) => setDraft((current) => ({ ...current, departmentId: value || undefined }))} options={[{ value: "", label: "عام" }, ...departments.map((department) => ({ value: department.id, label: department.name }))]} />
          <Dropdown label="Status" value={draft.status} options={budgetItemStatuses} onChange={(value) => setDraft((current) => ({ ...current, status: value as BudgetItemStatus }))} />
          <Dropdown label="Priority" value={draft.priority} options={budgetPriorities} onChange={(value) => setDraft((current) => ({ ...current, priority: value as BudgetPriority }))} />
          <Input label="Planned" type="number" min={0} value={String(draft.plannedCost || 0)} onChange={(event) => setDraft((current) => ({ ...current, plannedCost: Number(event.target.value || 0) }))} />
          <Input label="Actual" type="number" min={0} value={String(draft.actualCost || 0)} onChange={(event) => setDraft((current) => ({ ...current, actualCost: Number(event.target.value || 0) }))} />
          <Input label="Committed" type="number" min={0} value={String(draft.committedCost || 0)} onChange={(event) => setDraft((current) => ({ ...current, committedCost: Number(event.target.value || 0) }))} />
          <Input label="End date" type="date" value={draft.endDate || ""} onChange={(event) => setDraft((current) => ({ ...current, endDate: event.target.value || undefined }))} />
          <div className="lg:col-span-4 flex gap-2">
            <Button type="button" size="sm" onClick={() => onUpdate(draft)}>حفظ</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>إغلاق</Button>
          </div>
        </div>
      )}
    </div>
  </AutoLocalizedContent>);
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("en-US")} MAD`;
}

function budgetStatusTone(status: BudgetItemStatus): "gold" | "blue" | "success" | "warning" | "danger" | "neutral" {
  if (status === "Paid") return "success";
  if (status === "Committed") return "blue";
  if (status === "Approved") return "gold";
  if (status === "Over Budget") return "danger";
  return "neutral";
}

function budgetPriorityTone(priority: BudgetPriority): "gold" | "blue" | "success" | "warning" | "danger" | "neutral" {
  if (priority === "Critical") return "danger";
  if (priority === "High") return "warning";
  if (priority === "Low") return "blue";
  return "neutral";
}

function ProjectDocumentCard({
  document,
  departments,
  onPreview,
  onDownload,
  onArchive,
  onDelete,
  onUpdate
}: {
  document: Document;
  departments: Array<{ id: string; name: string }>;
  onPreview: () => void;
  onDownload: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onUpdate: (input: Partial<ProjectDocumentInput>) => void;
}) {
  const { locale } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<ProjectDocumentInput>>({
    title: document.title,
    category: document.category,
    version: document.version,
    departmentId: document.departmentId,
    tags: document.tags
  });

  return (
    <LocalizedContent locale={locale}><div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-1 hover:border-[#D4AF37]/28 hover:bg-white/[0.065]">
      <div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D4AF37]/10 text-gold shadow-gold-glow">
          <FileText className="h-6 w-6" />
        </span>
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blue">{document.category || "Other"}</Badge>
            <Badge tone="neutral">{document.version || "v1"}</Badge>
          </div>
          <h3 className="mt-3 truncate text-lg font-black text-white">{document.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-7 text-ds-text/58">
            {document.filename || "Generated document"} · {formatBytes(document.fileSize || 0)} · {document.departmentName || "عام"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(document.tags || []).slice(0, 4).map((tag) => <Badge key={tag} tone="neutral">{tag}</Badge>)}
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onPreview}>Preview</Button>
        <Button type="button" variant="secondary" size="sm" onClick={onDownload} icon={<Download className="h-4 w-4" />}>تحميل</Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setEditing((current) => !current)}>Edit</Button>
        <Button type="button" variant="danger" size="sm" onClick={onArchive}>Archive</Button>
        <Button type="button" variant="danger" size="sm" onClick={onDelete}>Delete</Button>
      </div>
      {editing && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/22 p-3">
          <Input label="Title" value={draft.title || ""} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
          <NativeSelect label="Category" value={String(draft.category || "Other")} onChange={(value) => setDraft((current) => ({ ...current, category: value }))} options={documentCategories.map((category) => ({ value: category, label: category }))} />
          <NativeSelect label="Department" value={draft.departmentId || ""} onChange={(value) => setDraft((current) => ({ ...current, departmentId: value || undefined }))} options={[{ value: "", label: "عام" }, ...departments.map((department) => ({ value: department.id, label: department.name }))]} />
          <Input label="Version" value={draft.version || ""} onChange={(event) => setDraft((current) => ({ ...current, version: event.target.value }))} />
          <Input label="Tags" value={(draft.tags || []).join(", ")} onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} />
          <Button type="button" size="sm" onClick={() => onUpdate(draft)}>Save metadata</Button>
        </div>
      )}
    </div></LocalizedContent>
  );
}

function formatBytes(value: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (<AutoLocalizedContent>
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-sm font-bold text-ds-text/46">{label}</span>
      <span className="truncate text-sm font-black text-ds-text">{value}</span>
    </div>
  </AutoLocalizedContent>);
}

function TasksTab({ project }: { project: ProjectWorkspaceProject }) {
  const { locale } = useI18n();
  const organizationId = project.organizationId || "atlas";
  const taskState = useTasksRepository(project.id);
  const departmentState = useDepartmentsRepository(organizationId);
  const employeeState = useEmployeesRepository(organizationId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | undefined>();
  const [form, setForm] = useState<TaskInput>({
    projectId: project.id,
    organizationId,
    title: "",
    description: "",
    status: "Todo",
    priority: "Medium",
    estimatedHours: 8,
    progress: 0
  });

  useEffect(() => {
    setTasks(taskState.data);
  }, [taskState.data]);

  useEffect(() => {
    setForm((current) => ({ ...current, projectId: project.id, organizationId }));
  }, [project.id, organizationId]);

  const stats = useMemo(() => taskRepository.getProjectTaskStats(tasks), [tasks]);
  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const queryMatch = !query || [task.title, task.description, task.assigneeName, task.departmentName].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
      const statusMatch = statusFilter === "All" || task.status === statusFilter;
      const priorityMatch = priorityFilter === "All" || task.priority === priorityFilter;
      return queryMatch && statusMatch && priorityMatch;
    });
  }, [priorityFilter, search, statusFilter, tasks]);

  const validateForm = () => {
    if (!form.title.trim()) return "اسم المهمة مطلوب.";
    if (form.departmentId && !departmentState.data.some((department) => department.id === form.departmentId)) return "القسم المختار لا ينتمي إلى المنظمة الحالية.";
    if (form.assigneeEmployeeId && !employeeState.data.some((employee) => employee.id === form.assigneeEmployeeId)) return "الموظف المختار لا ينتمي إلى المنظمة الحالية.";
    return undefined;
  };

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateForm();
    if (error) {
      setMessage(error);
      return;
    }
    const result = await taskRepository.createTask({
      ...form,
      title: form.title.trim(),
      description: form.description?.trim(),
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      progress: Number(form.progress || 0)
    });
    if (!result.data) {
      setMessage(result.error || "تعذر إنشاء المهمة.");
      return;
    }
    const department = departmentState.data.find((item) => item.id === result.data?.departmentId);
    const assignee = employeeState.data.find((item) => item.id === result.data?.assigneeEmployeeId);
    setTasks((current) => [
      {
        ...result.data!,
        departmentName: result.data!.departmentName || department?.name,
        assigneeName: result.data!.assigneeName || assignee?.fullName || assignee?.name
      },
      ...current
    ]);
    setForm({
      projectId: project.id,
      organizationId,
      title: "",
      description: "",
      status: "Todo",
      priority: "Medium",
      estimatedHours: 8,
      progress: 0
    });
    setMessage("تم إنشاء المهمة داخل مساحة المشروع.");
  }

  async function updateLocalTask(taskId: string, input: Partial<TaskInput>) {
    const result = await taskRepository.updateTask(taskId, input);
    if (!result.data) {
      setMessage(result.error || "تعذر تحديث المهمة.");
      return;
    }
    const department = departmentState.data.find((item) => item.id === result.data?.departmentId);
    const assignee = employeeState.data.find((item) => item.id === result.data?.assigneeEmployeeId);
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...result.data,
              departmentName: result.data?.departmentName || department?.name || task.departmentName,
              assigneeName: result.data?.assigneeName || assignee?.fullName || assignee?.name || task.assigneeName
            }
          : task
      )
    );
    setMessage("تم تحديث المهمة.");
  }

  async function moveTask(taskId: string, status: TaskStatus) {
    const result = await taskRepository.moveTask(taskId, status);
    if (!result.data) {
      setMessage(result.error || "تعذر نقل المهمة.");
      return;
    }
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status, progress: status === "Done" ? 100 : task.progress } : task)));
  }

  async function archiveTask(taskId: string) {
    const result = await taskRepository.archiveTask(taskId);
    if (!result.data) {
      setMessage(result.error || "تعذر أرشفة المهمة.");
      return;
    }
    setTasks((current) => current.filter((task) => task.id !== taskId));
    setMessage("تمت أرشفة المهمة بدون حذف دائم.");
  }

  const taskColumns = taskStatuses.map((status) => ({
    status,
    tasks: filteredTasks.filter((task) => task.status === status)
  }));

  return (
    <LocalizedContent locale={locale}><div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <TaskMetric title="إجمالي المهام" value={String(stats.total)} tone="gold" icon={<CheckCircle2 className="h-5 w-5" />} />
        <TaskMetric title="المكتملة" value={String(stats.completed)} tone="success" icon={<CheckCircle2 className="h-5 w-5" />} />
        <TaskMetric title="قيد التنفيذ" value={String(stats.inProgress)} tone="blue" icon={<Clock3 className="h-5 w-5" />} />
        <TaskMetric title="محجوبة" value={String(stats.blocked)} tone="danger" icon={<ShieldAlert className="h-5 w-5" />} />
        <TaskMetric title="متأخرة" value={String(stats.overdue)} tone="warning" icon={<CalendarDays className="h-5 w-5" />} />
        <TaskMetric title="نسبة الإنجاز" value={`${stats.completionRate}%`} tone="gold" icon={<Gauge className="h-5 w-5" />} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <GlassCard className="relative overflow-hidden p-5">
            <BlueprintOverlay className="opacity-20" />
            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Badge tone="gold">Tasks Workspace</Badge>
                <h2 className="mt-2 text-2xl font-black text-white">لوحة مهام المشروع</h2>
                <p className="mt-2 text-sm leading-7 text-ds-text/58">Kanban وقائمة عمل مرتبطة بالمشروع الحالي عبر طبقة المستودعات، مع بقاء منطق الخلفية كما هو.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant={view === "kanban" ? "primary" : "secondary"} size="sm" onClick={() => setView("kanban")} icon={<Grid2X2 className="h-4 w-4" />}>Kanban</Button>
                <Button type="button" variant={view === "list" ? "primary" : "secondary"} size="sm" onClick={() => setView("list")} icon={<List className="h-4 w-4" />}>List</Button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
              <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث في المهام أو الأقسام أو المسؤولين" icon={<Search className="h-4 w-4" />} />
              <Dropdown label="Status" value={statusFilter} options={["All", ...taskStatuses]} onChange={setStatusFilter} />
              <Dropdown label="Priority" value={priorityFilter} options={["All", ...taskPriorities]} onChange={setPriorityFilter} />
            </div>
          </GlassCard>

          {taskState.loading ? (
            <GlassCard className="p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[0, 1, 2].map((item) => <div key={item} className="ds-skeleton h-40 rounded-3xl" />)}
              </div>
            </GlassCard>
          ) : taskState.error && !taskState.isFallback ? (
            <EmptyState title="تعذر تحميل المهام" description={taskState.error} />
          ) : filteredTasks.length === 0 ? (
            <EmptyState title="لا توجد مهام مطابقة" description="عدّل البحث أو أنشئ مهمة جديدة لهذا المشروع." />
          ) : view === "kanban" ? (
            <div className="grid gap-4 xl:grid-cols-5">
              {taskColumns.map((column) => (
                <div
                  key={column.status}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const taskId = event.dataTransfer.getData("text/plain") || draggingTaskId;
                    if (taskId) void moveTask(taskId, column.status);
                    setDraggingTaskId(null);
                  }}
                  className="min-h-[420px] rounded-[1.75rem] border border-white/10 bg-black/18 p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-3 px-1">
                    <Badge tone={taskStatusTone(column.status)}>{taskStatusLabel(column.status)}</Badge>
                    <span className="text-xs font-black text-ds-text/42">{column.tasks.length}</span>
                  </div>
                  <div className="grid gap-3">
                    {column.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        editing={editingTaskId === task.id}
                        departments={departmentState.data}
                        employees={employeeState.data}
                        onEdit={() => setEditingTaskId((current) => (current === task.id ? null : task.id))}
                        onArchive={() => void archiveTask(task.id)}
                        onUpdate={(input) => void updateLocalTask(task.id, input)}
                        onDragStart={() => setDraggingTaskId(task.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <GlassCard className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.055] text-gold">
                    <tr>
                      {["المهمة", "الحالة", "الأولوية", "المسؤول", "القسم", "الاستحقاق", "التقدم", "إجراءات"].map((column) => (
                        <th key={column} className="px-4 py-3 text-right font-black">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="border-b border-white/10 text-ds-text/70 transition hover:bg-white/[0.045]">
                        <td className="px-4 py-3 font-black text-white">{task.title}</td>
                        <td className="px-4 py-3"><Badge tone={taskStatusTone(task.status)}>{taskStatusLabel(task.status)}</Badge></td>
                        <td className="px-4 py-3"><Badge tone={taskPriorityTone(task.priority)}>{task.priority}</Badge></td>
                        <td className="px-4 py-3">{task.assigneeName || "غير محدد"}</td>
                        <td className="px-4 py-3">{task.departmentName || "عام"}</td>
                        <td className="px-4 py-3">{task.dueDate || "غير محدد"}</td>
                        <td className="px-4 py-3"><ProgressBar value={task.progress || 0} /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button type="button" size="sm" variant="secondary" onClick={() => setEditingTaskId(task.id)}>تعديل</Button>
                            <Button type="button" size="sm" variant="danger" onClick={() => void archiveTask(task.id)}>أرشفة</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </div>

        <aside className="space-y-5">
          <GlassCard className="p-5">
            <Badge tone="gold">Quick Actions</Badge>
            <h3 className="mt-3 text-xl font-black text-white">إنشاء مهمة</h3>
            <form className="mt-5 grid gap-4" onSubmit={createTask}>
              <Input label="Task title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="مثلاً: Foundations inspection" />
              <Textarea label="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="وصف مختصر للمهمة" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Dropdown label="Status" value={form.status} options={taskStatuses} onChange={(value) => setForm((current) => ({ ...current, status: value as TaskStatus }))} />
                <Dropdown label="Priority" value={form.priority} options={taskPriorities} onChange={(value) => setForm((current) => ({ ...current, priority: value as TaskPriority }))} />
              </div>
              <NativeSelect label="Department" value={form.departmentId || ""} onChange={(value) => setForm((current) => ({ ...current, departmentId: value || undefined }))} options={[{ value: "", label: "عام" }, ...departmentState.data.map((department) => ({ value: department.id, label: department.name }))]} />
              <NativeSelect label="Assignee" value={form.assigneeEmployeeId || ""} onChange={(value) => setForm((current) => ({ ...current, assigneeEmployeeId: value || undefined }))} options={[{ value: "", label: "غير محدد" }, ...employeeState.data.map((employee) => ({ value: employee.id, label: employee.fullName || employee.name }))]} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Due date" type="date" value={form.dueDate || ""} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value || undefined }))} />
                <Input label="Hours" type="number" min={0} value={String(form.estimatedHours || "")} onChange={(event) => setForm((current) => ({ ...current, estimatedHours: Number(event.target.value || 0) }))} />
              </div>
              <Button type="submit" icon={<Plus className="h-4 w-4" />}>إضافة مهمة</Button>
              {message && <p className="rounded-2xl border border-[#D4AF37]/18 bg-[#D4AF37]/10 p-3 text-sm font-bold leading-6 text-[#F5D878]">{message}</p>}
            </form>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-start gap-4">
              <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
              <div>
                <Badge tone="blue">VORA Task Insights</Badge>
                <h3 className="mt-3 text-xl font-black text-white">رؤية المهام</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <ContextRow label="خطر التأخير" value={stats.overdue > 0 ? `${stats.overdue} مهام` : "منخفض"} />
              <ContextRow label="المهمة التالية" value={tasks.find((task) => task.status === "In Progress")?.title || "تحديد أولوية جديدة"} />
              <ContextRow label="الإجراء المقترح" value={stats.blocked ? "راجع المهام المحجوبة" : "انقل المهام الجاهزة للمراجعة"} />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="neutral">Repository Mode</Badge>
            <div className="mt-4 grid gap-3">
              <ContextRow label="المصدر" value={taskState.source} />
              <ContextRow label="Fallback" value={taskState.isFallback ? "مفعل" : "غير مفعل"} />
              <ContextRow label="المشروع" value={project.id} />
            </div>
          </GlassCard>
        </aside>
      </section>
    </div></LocalizedContent>
  );
}

function TaskCard({
  task,
  editing,
  departments,
  employees,
  onEdit,
  onArchive,
  onUpdate,
  onDragStart
}: {
  task: Task;
  editing: boolean;
  departments: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; fullName?: string; name: string }>;
  onEdit: () => void;
  onArchive: () => void;
  onUpdate: (input: Partial<TaskInput>) => void;
  onDragStart: () => void;
}) {
  const { locale } = useI18n();
  const [draft, setDraft] = useState<Partial<TaskInput>>({
    status: task.status,
    priority: task.priority,
    departmentId: task.departmentId,
    assigneeEmployeeId: task.assigneeEmployeeId,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    progress: task.progress
  });

  useEffect(() => {
    setDraft({
      status: task.status,
      priority: task.priority,
      departmentId: task.departmentId,
      assigneeEmployeeId: task.assigneeEmployeeId,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      progress: task.progress
    });
  }, [task]);

  return (
    <LocalizedContent locale={locale}><div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
        onDragStart();
      }}
      className="group rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-4 shadow-ds-sm transition hover:-translate-y-1 hover:border-[#D4AF37]/28 hover:bg-white/[0.075]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge tone={taskPriorityTone(task.priority)}>{task.priority}</Badge>
            <Badge tone={taskStatusTone(task.status)}>{taskStatusLabel(task.status)}</Badge>
          </div>
          <h3 className="mt-3 line-clamp-2 font-black leading-6 text-white">{task.title}</h3>
          {task.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-ds-text/50">{task.description}</p>}
        </div>
        <Avatar name={task.assigneeName || "VORA"} size="sm" />
      </div>

      <div className="mt-4 grid gap-2">
        <ProgressBar value={task.progress || 0} label="Progress" tone={task.status === "Blocked" ? "danger" : task.status === "Done" ? "success" : "gold"} />
        <div className="grid gap-2 text-xs font-bold text-ds-text/52">
          <span>المسؤول: {task.assigneeName || "غير محدد"}</span>
          <span>القسم: {task.departmentName || "عام"}</span>
          <span>الاستحقاق: {task.dueDate || "غير محدد"} · {task.estimatedHours || 0}h</span>
        </div>
      </div>

      {editing && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/22 p-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Dropdown label="Status" value={draft.status} options={taskStatuses} onChange={(value) => setDraft((current) => ({ ...current, status: value as TaskStatus }))} />
            <Dropdown label="Priority" value={draft.priority} options={taskPriorities} onChange={(value) => setDraft((current) => ({ ...current, priority: value as TaskPriority }))} />
          </div>
          <NativeSelect label="Department" value={draft.departmentId || ""} onChange={(value) => setDraft((current) => ({ ...current, departmentId: value || undefined }))} options={[{ value: "", label: "عام" }, ...departments.map((department) => ({ value: department.id, label: department.name }))]} />
          <NativeSelect label="Assignee" value={draft.assigneeEmployeeId || ""} onChange={(value) => setDraft((current) => ({ ...current, assigneeEmployeeId: value || undefined }))} options={[{ value: "", label: "غير محدد" }, ...employees.map((employee) => ({ value: employee.id, label: employee.fullName || employee.name }))]} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Input label="Due date" type="date" value={draft.dueDate || ""} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value || undefined }))} />
            <Input label="Progress" type="number" min={0} max={100} value={String(draft.progress || 0)} onChange={(event) => setDraft((current) => ({ ...current, progress: Number(event.target.value || 0) }))} />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => onUpdate(draft)}>حفظ</Button>
            <Button type="button" size="sm" variant="secondary" onClick={onEdit}>إغلاق</Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onEdit}>تعديل</Button>
        <Button type="button" size="sm" variant="danger" onClick={onArchive}>أرشفة</Button>
      </div>
    </div></LocalizedContent>
  );
}

function NativeSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (<AutoLocalizedContent>
    <label className="grid gap-2 text-sm font-black text-[#f8efd7]/82">
      <span className="text-xs uppercase tracking-[0.12em] text-[#f8efd7]/58">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-bold text-[#f8efd7] outline-none transition focus:border-[#D4AF37]/44">
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value} className="bg-[#111827] text-[#f8efd7]">{option.label}</option>
        ))}
      </select>
    </label>
  </AutoLocalizedContent>);
}

function TaskMetric({ title, value, tone, icon }: { title: string; value: string; tone: "gold" | "blue" | "success" | "warning" | "danger"; icon: React.ReactNode }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone={tone}>{title}</Badge>
          <p className="mt-4 text-3xl font-black text-white">{value}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#D4AF37]/10 text-gold shadow-gold-glow">{icon}</span>
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function taskStatusLabel(status: TaskStatus) {
  return {
    Todo: "To do",
    "In Progress": "In progress",
    Review: "Review",
    Blocked: "Blocked",
    Done: "Done"
  }[status];
}

function taskStatusTone(status: TaskStatus): "gold" | "blue" | "success" | "warning" | "danger" | "neutral" {
  if (status === "Done") return "success";
  if (status === "In Progress") return "blue";
  if (status === "Review") return "gold";
  if (status === "Blocked") return "danger";
  return "neutral";
}

function taskPriorityTone(priority: TaskPriority): "gold" | "blue" | "success" | "warning" | "danger" | "neutral" {
  if (priority === "Critical") return "danger";
  if (priority === "High") return "warning";
  if (priority === "Low") return "blue";
  return "neutral";
}

function TimelineTab({ project }: { project: ProjectWorkspaceProject }) {
  const { locale } = useI18n();
  const organizationId = project.organizationId || "atlas";
  const timelineState = useTimelineRepository(project.id);
  const taskState = useTasksRepository(project.id);
  const [timeline, setTimeline] = useState(timelineState.data);
  const [view, setView] = useState<"timeline" | "calendar">("timeline");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState<string | undefined>();
  const [milestoneForm, setMilestoneForm] = useState<TimelineMilestoneInput>({
    projectId: project.id,
    organizationId,
    title: "",
    description: "",
    status: "Planned",
    progress: 0
  });
  const [dependencyForm, setDependencyForm] = useState<TaskDependencyInput>({
    predecessorTaskId: "",
    successorTaskId: "",
    dependencyType: "Finish-to-Start"
  });

  useEffect(() => {
    setTimeline(timelineState.data);
  }, [timelineState.data]);

  useEffect(() => {
    setMilestoneForm((current) => ({ ...current, projectId: project.id, organizationId }));
  }, [organizationId, project.id]);

  const stats = useMemo(() => timelineRepository.getTimelineStats(timeline), [timeline]);
  const filteredMilestones = useMemo(() => {
    const query = search.trim().toLowerCase();
    return timeline.milestones.filter((milestone) => {
      const queryMatch = !query || [milestone.title, milestone.description].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
      const statusMatch = statusFilter === "All" || milestone.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [search, statusFilter, timeline.milestones]);

  const nextMilestone = timeline.milestones
    .filter((milestone) => milestone.status !== "Completed" && milestone.status !== "Archived")
    .sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")))[0];
  const delayedMilestone = timeline.milestones.find((milestone) => milestone.status === "Delayed");

  function dependencyCreatesCycle(input: TaskDependencyInput, dependencies = timeline.dependencies) {
    if (!input.predecessorTaskId || !input.successorTaskId) return false;
    if (input.predecessorTaskId === input.successorTaskId) return true;
    const edges = [...dependencies, { id: "draft", predecessorTaskId: input.predecessorTaskId, successorTaskId: input.successorTaskId, dependencyType: input.dependencyType }];
    const visit = (taskId: string, seen = new Set<string>()): boolean => {
      if (taskId === input.predecessorTaskId) return true;
      if (seen.has(taskId)) return false;
      seen.add(taskId);
      return edges.filter((edge) => edge.predecessorTaskId === taskId).some((edge) => visit(edge.successorTaskId, seen));
    };
    return visit(input.successorTaskId);
  }

  async function createMilestone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!milestoneForm.title.trim()) {
      setMessage("عنوان المعلم مطلوب.");
      return;
    }
    const result = await timelineRepository.createMilestone({
      ...milestoneForm,
      title: milestoneForm.title.trim(),
      description: milestoneForm.description?.trim(),
      progress: Number(milestoneForm.progress || 0)
    });
    if (!result.data) {
      setMessage(result.error || "تعذر إنشاء المعلم.");
      return;
    }
    setTimeline((current) => ({ ...current, milestones: [result.data!, ...current.milestones] }));
    setMilestoneForm({ projectId: project.id, organizationId, title: "", description: "", status: "Planned", progress: 0 });
    setMessage("تم إنشاء المعلم الزمني.");
  }

  async function updateMilestone(milestoneId: string, input: Partial<TimelineMilestoneInput>) {
    const result = await timelineRepository.updateMilestone(milestoneId, input);
    if (!result.data) {
      setMessage(result.error || "تعذر تحديث المعلم.");
      return;
    }
    setTimeline((current) => ({ ...current, milestones: current.milestones.map((milestone) => (milestone.id === milestoneId ? { ...milestone, ...result.data } : milestone)) }));
    setMessage("تم تحديث المعلم.");
  }

  async function archiveMilestone(milestoneId: string) {
    const result = await timelineRepository.archiveMilestone(milestoneId);
    if (!result.data) {
      setMessage(result.error || "تعذر أرشفة المعلم.");
      return;
    }
    setTimeline((current) => ({ ...current, milestones: current.milestones.filter((milestone) => milestone.id !== milestoneId) }));
    setMessage("تمت أرشفة المعلم بدون حذف دائم.");
  }

  async function createDependency(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dependencyForm.predecessorTaskId || !dependencyForm.successorTaskId) {
      setMessage("اختر مهمة سابقة ومهمة لاحقة.");
      return;
    }
    if (dependencyCreatesCycle(dependencyForm)) {
      setMessage("لا يمكن إضافة اعتماد دائري بين المهام.");
      return;
    }
    const existing = timeline.dependencies.some((dependency) =>
      dependency.predecessorTaskId === dependencyForm.predecessorTaskId &&
      dependency.successorTaskId === dependencyForm.successorTaskId &&
      dependency.dependencyType === dependencyForm.dependencyType
    );
    if (existing) {
      setMessage("هذا الاعتماد موجود مسبقاً.");
      return;
    }
    const result = await timelineRepository.createDependency(dependencyForm);
    if (!result.data) {
      setMessage(result.error || "تعذر إنشاء الاعتماد.");
      return;
    }
    const predecessor = taskState.data.find((task) => task.id === result.data?.predecessorTaskId);
    const successor = taskState.data.find((task) => task.id === result.data?.successorTaskId);
    setTimeline((current) => ({
      ...current,
      dependencies: [{ ...result.data!, predecessorTitle: result.data!.predecessorTitle || predecessor?.title, successorTitle: result.data!.successorTitle || successor?.title }, ...current.dependencies]
    }));
    setDependencyForm({ predecessorTaskId: "", successorTaskId: "", dependencyType: "Finish-to-Start" });
    setMessage("تمت إضافة اعتماد المهمة.");
  }

  async function removeDependency(dependencyId: string) {
    const result = await timelineRepository.removeDependency(dependencyId);
    if (!result.data) {
      setMessage(result.error || "تعذر حذف الاعتماد.");
      return;
    }
    setTimeline((current) => ({ ...current, dependencies: current.dependencies.filter((dependency) => dependency.id !== dependencyId) }));
    setMessage("تم حذف الاعتماد.");
  }

  return (
    <LocalizedContent locale={locale}><div className="space-y-5">
      <GlassCard className="relative overflow-hidden p-5">
        <BlueprintOverlay className="opacity-20" />
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Badge tone="gold">Timeline Workspace</Badge>
            <h2 className="mt-2 text-2xl font-black text-white">الجدول الزمني للمشروع</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-ds-text/58">
              نظام معالم واعتماديات مرتبط بالمشروع والمهام عبر طبقة المستودعات مع الحفاظ على Demo / Supabase / Auto modes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" icon={<Plus className="h-4 w-4" />} onClick={() => document.getElementById("milestone-title")?.focus()}>إضافة معلم</Button>
            <Button type="button" variant="secondary" icon={<CalendarDays className="h-4 w-4" />} onClick={() => setView("calendar")}>عرض التقويم</Button>
            <Button variant="secondary" icon={<Sparkles className="h-4 w-4" />}>توليد جدول عبر VORA</Button>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />}>تصدير</Button>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <TimelineMetric title="إجمالي المعالم" value={String(stats.total)} tone="gold" icon={<CalendarDays className="h-5 w-5" />} />
        <TimelineMetric title="مكتملة" value={String(stats.completed)} tone="success" icon={<CheckCircle2 className="h-5 w-5" />} />
        <TimelineMetric title="قادمة" value={String(stats.upcoming)} tone="blue" icon={<Gauge className="h-5 w-5" />} />
        <TimelineMetric title="متأخرة" value={String(stats.overdue)} tone="warning" icon={<ShieldAlert className="h-5 w-5" />} />
        <TimelineMetric title="إنجاز الجدول" value={`${stats.completionRate}%`} tone="neutral" icon={<Clock3 className="h-5 w-5" />} />
      </div>

      <GlassCard className="p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_auto] xl:items-center">
          <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث في المعالم والوصف" icon={<Search className="h-4 w-4" />} />
          <Dropdown label="Status" value={statusFilter} options={["All", ...milestoneStatuses]} onChange={setStatusFilter} />
          <div className="flex gap-2">
            <IconButton label="Timeline view" tone={view === "timeline" ? "gold" : "neutral"} onClick={() => setView("timeline")}><BarChart3 className="h-5 w-5" /></IconButton>
            <IconButton label="Calendar view" tone={view === "calendar" ? "gold" : "neutral"} onClick={() => setView("calendar")}><CalendarDays className="h-5 w-5" /></IconButton>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {timelineState.loading ? (
            <GlassCard className="p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[0, 1, 2].map((item) => <div key={item} className="ds-skeleton h-40 rounded-3xl" />)}
              </div>
            </GlassCard>
          ) : timelineState.error && !timelineState.isFallback ? (
            <EmptyState title="تعذر تحميل الجدول الزمني" description={timelineState.error} />
          ) : filteredMilestones.length === 0 ? (
            <EmptyState title="لا توجد معالم مطابقة" description="عدّل البحث أو أنشئ معلماً زمنياً جديداً." />
          ) : view === "timeline" ? (
            <GlassCard className="overflow-hidden p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge tone="blue">Milestone Timeline</Badge>
                  <h3 className="mt-2 text-2xl font-black text-white">المعالم والتقدم</h3>
                </div>
                <Badge tone="neutral">{filteredMilestones.length} visible</Badge>
              </div>
              <div className="grid gap-4">
                {filteredMilestones.map((milestone, index) => (
                  <MilestoneRow key={milestone.id} milestone={milestone} index={index} onUpdate={(input) => void updateMilestone(milestone.id, input)} onArchive={() => void archiveMilestone(milestone.id)} />
                ))}
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <Badge tone="gold">Calendar View</Badge>
                  <h3 className="mt-2 text-2xl font-black text-white">عرض التقويم</h3>
                </div>
                <Badge tone="blue">UI only</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {filteredMilestones.map((milestone) => (
                  <div key={milestone.id} className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                    <Badge tone={milestoneTone(milestone.status)}>{milestone.title}</Badge>
                    <p className="mt-4 text-lg font-black text-white">{milestone.startDate || "غير محدد"} - {milestone.dueDate || "غير محدد"}</p>
                    <p className="mt-2 text-sm font-bold text-ds-text/48">{milestone.description || "Project milestone"}</p>
                    <div className="mt-4"><ProgressBar value={milestone.progress} tone={milestoneTone(milestone.status) === "neutral" ? "gold" : milestoneTone(milestone.status)} /></div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <GlassCard className="p-5">
            <div className="mb-5">
              <Badge tone="gold">Milestone CRUD</Badge>
              <h3 className="mt-2 text-2xl font-black text-white">إضافة معلم زمني</h3>
            </div>
            <form className="grid gap-4" onSubmit={createMilestone}>
              <Input id="milestone-title" label="Title" value={milestoneForm.title} onChange={(event) => setMilestoneForm((current) => ({ ...current, title: event.target.value }))} placeholder="مثلاً: Foundation complete" />
              <Textarea label="Description" value={milestoneForm.description} onChange={(event) => setMilestoneForm((current) => ({ ...current, description: event.target.value }))} placeholder="وصف مختصر للمعلم" />
              <div className="grid gap-3 md:grid-cols-4">
                <Dropdown label="Status" value={milestoneForm.status} options={milestoneStatuses} onChange={(value) => setMilestoneForm((current) => ({ ...current, status: value as MilestoneStatus }))} />
                <Input label="Start date" type="date" value={milestoneForm.startDate || ""} onChange={(event) => setMilestoneForm((current) => ({ ...current, startDate: event.target.value || undefined }))} />
                <Input label="Due date" type="date" value={milestoneForm.dueDate || ""} onChange={(event) => setMilestoneForm((current) => ({ ...current, dueDate: event.target.value || undefined }))} />
                <Input label="Progress" type="number" min={0} max={100} value={String(milestoneForm.progress || 0)} onChange={(event) => setMilestoneForm((current) => ({ ...current, progress: Number(event.target.value || 0) }))} />
              </div>
              <Button type="submit" icon={<Plus className="h-4 w-4" />}>إنشاء معلم</Button>
              {message && <p className="rounded-2xl border border-[#D4AF37]/18 bg-[#D4AF37]/10 p-3 text-sm font-bold leading-6 text-[#F5D878]">{message}</p>}
            </form>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone="blue">Task Dependencies</Badge>
                <h3 className="mt-2 text-2xl font-black text-white">اعتماديات المهام</h3>
              </div>
              <Badge tone="neutral">{timeline.dependencies.length} dependencies</Badge>
            </div>
            <form className="mb-5 grid gap-3 xl:grid-cols-[1fr_1fr_180px_auto]" onSubmit={createDependency}>
              <NativeSelect label="Predecessor" value={dependencyForm.predecessorTaskId} onChange={(value) => setDependencyForm((current) => ({ ...current, predecessorTaskId: value }))} options={[{ value: "", label: "اختر المهمة السابقة" }, ...taskState.data.map((task) => ({ value: task.id, label: task.title }))]} />
              <NativeSelect label="Successor" value={dependencyForm.successorTaskId} onChange={(value) => setDependencyForm((current) => ({ ...current, successorTaskId: value }))} options={[{ value: "", label: "اختر المهمة اللاحقة" }, ...taskState.data.map((task) => ({ value: task.id, label: task.title }))]} />
              <Dropdown label="Type" value={dependencyForm.dependencyType} options={dependencyTypes} onChange={(value) => setDependencyForm((current) => ({ ...current, dependencyType: value as DependencyType }))} />
              <div className="flex items-end"><Button type="submit" className="w-full" size="sm">إضافة</Button></div>
            </form>
            <div className="grid gap-3">
              {timeline.dependencies.length === 0 ? (
                <EmptyState title="لا توجد اعتماديات بعد" description="أضف اعتماداً بين مهمتين لتوضيح تسلسل التنفيذ." />
              ) : (
                timeline.dependencies.map((dependency) => <DependencyRow key={dependency.id} dependency={dependency} onRemove={() => void removeDependency(dependency.id)} />)
              )}
            </div>
          </GlassCard>
        </div>

        <aside className="space-y-5">
          <GlassCard className="p-5">
            <div className="flex items-start gap-4">
              <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
              <div>
                <Badge tone="blue">VORA Insights</Badge>
                <h3 className="mt-3 text-xl font-black text-white">رؤية الجدول الزمني</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <ContextRow label="خطر التأخير" value={delayedMilestone?.title || "منخفض"} />
              <ContextRow label="المعلم القادم" value={nextMilestone?.title || "لا يوجد"} />
              <ContextRow label="اعتماد محجوب" value={timeline.dependencies.length ? `${timeline.dependencies.length} اعتماد` : "لا يوجد"} />
              <ContextRow label="توقع الإنجاز" value={`${stats.completionRate}%`} />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="gold">Milestones</Badge>
            <div className="mt-5 grid gap-4">
              {timeline.milestones.slice(0, 3).map((milestone, index) => (
                <TimelineCard key={milestone.id} index={index + 1} title={milestone.title} text={milestone.description || milestone.status} icon={milestone.status === "Completed" ? <CheckCircle2 className="h-4 w-4" /> : milestone.status === "Delayed" ? <ShieldAlert className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />} />
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="gold">Quick Actions</Badge>
            <div className="mt-4 grid gap-3">
              <ActionLink href="/tools/document" icon={<Sparkles className="h-5 w-5" />} title="توليد جدول زمني" />
              <ActionLink href="/tools/document" icon={<FileText className="h-5 w-5" />} title="تقرير الجدول" />
              <ActionLink href="/history" icon={<Download className="h-5 w-5" />} title="تصدير لاحقاً" />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="neutral">Repository Mode</Badge>
            <div className="mt-4 grid gap-3">
              <ContextRow label="المصدر" value={timelineState.source} />
              <ContextRow label="Fallback" value={timelineState.isFallback ? "مفعل" : "غير مفعل"} />
              <ContextRow label="المشروع" value={project.id} />
            </div>
          </GlassCard>
        </aside>
      </div>
    </div></LocalizedContent>
  );
}

function MilestoneRow({ milestone, index, onUpdate, onArchive }: { milestone: TimelineMilestone; index: number; onUpdate: (input: Partial<TimelineMilestoneInput>) => void; onArchive: () => void }) {
  const { locale } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<TimelineMilestoneInput>>({
    status: milestone.status,
    progress: milestone.progress,
    startDate: milestone.startDate,
    dueDate: milestone.dueDate
  });

  useEffect(() => {
    setDraft({
      status: milestone.status,
      progress: milestone.progress,
      startDate: milestone.startDate,
      dueDate: milestone.dueDate
    });
  }, [milestone]);

  return (
    <LocalizedContent locale={locale}><div className="relative rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-1 hover:border-[#D4AF37]/28 hover:bg-white/[0.065]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#D4AF37] text-sm font-black text-black shadow-gold-glow">{index + 1}</span>
            <Badge tone={milestoneTone(milestone.status)}>{milestone.status}</Badge>
            {milestone.status === "Delayed" && <ShieldAlert className="h-4 w-4 text-[#FFB020]" />}
          </div>
          <h3 className="mt-3 text-xl font-black text-white">{milestone.title}</h3>
          <p className="mt-2 text-sm leading-6 text-ds-text/54">{milestone.description || "Project timeline milestone"}</p>
        </div>
        <div className="min-w-[220px]">
          <ProgressBar value={milestone.progress} label={`${milestone.startDate || "TBD"} - ${milestone.dueDate || "TBD"}`} tone={milestoneTone(milestone.status) === "neutral" ? "gold" : milestoneTone(milestone.status)} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => setEditing((current) => !current)}>تعديل</Button>
        <Button type="button" size="sm" variant="danger" onClick={onArchive}>أرشفة</Button>
      </div>
      {editing && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/22 p-3 lg:grid-cols-4">
          <Dropdown label="Status" value={draft.status} options={milestoneStatuses} onChange={(value) => setDraft((current) => ({ ...current, status: value as MilestoneStatus }))} />
          <Input label="Start date" type="date" value={draft.startDate || ""} onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value || undefined }))} />
          <Input label="Due date" type="date" value={draft.dueDate || ""} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value || undefined }))} />
          <Input label="Progress" type="number" min={0} max={100} value={String(draft.progress || 0)} onChange={(event) => setDraft((current) => ({ ...current, progress: Number(event.target.value || 0) }))} />
          <div className="lg:col-span-4 flex gap-2">
            <Button type="button" size="sm" onClick={() => onUpdate(draft)}>حفظ</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>إغلاق</Button>
          </div>
        </div>
      )}
    </div></LocalizedContent>
  );
}

function DependencyRow({ dependency, onRemove }: { dependency: TaskDependency; onRemove: () => void }) {
  const { locale } = useI18n();
  return (
    <LocalizedContent locale={locale}><div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <Badge tone="blue">{dependency.dependencyType}</Badge>
        <p className="mt-3 text-sm font-black text-white">{dependency.predecessorTitle || dependency.predecessorTaskId}</p>
        <p className="mt-1 text-xs font-bold text-ds-text/46">ثم {dependency.successorTitle || dependency.successorTaskId}</p>
      </div>
      <Button type="button" size="sm" variant="danger" onClick={onRemove}>حذف</Button>
    </div></LocalizedContent>
  );
}

function TimelineMetric({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: "gold" | "blue" | "warning" | "success" | "neutral" | "danger" }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone={tone}>{title}</Badge>
          <p className="mt-4 text-2xl font-black text-white">{value}</p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D4AF37]/10 text-gold shadow-gold-glow">{icon}</span>
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function milestoneTone(status: MilestoneStatus): "gold" | "blue" | "warning" | "success" | "neutral" {
  if (status === "Completed") return "success";
  if (status === "In Progress") return "blue";
  if (status === "Delayed") return "warning";
  return "neutral";
}

function TeamTab({ project, detail }: { project: ProjectWorkspaceProject; detail: ProjectDetail }) {
  const { locale } = useI18n();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const members = detail.team.map((member) => ({
    name: member.name,
    role: member.role,
    status: member.status,
    availability: member.workload > 80 ? "Busy" : "Available",
    tasks: member.tasks,
    workload: member.workload
  }));

  const roles = ["Project Owner", "Architect", "Engineer", "Contractor", "Site Manager", "Supervisor", "Client"];
  const visibleMembers = members.filter((member) => {
    const matchesQuery = query.trim() ? `${member.name} ${member.role}`.toLowerCase().includes(query.trim().toLowerCase()) : true;
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    const matchesAvailability = availabilityFilter === "all" || member.availability === availabilityFilter;
    return matchesQuery && matchesRole && matchesStatus && matchesAvailability;
  });

  return (
    <LocalizedContent locale={locale}><div className="space-y-5">
      <GlassCard className="relative overflow-hidden p-5">
        <BlueprintOverlay className="opacity-20" />
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Badge tone="gold">Team Workspace</Badge>
            <h2 className="mt-2 text-2xl font-black text-white">فريق المشروع</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-ds-text/58">
              واجهة تنظيم الفريق داخل {project.title}: الأدوار، التوفر، عبء العمل، والنشاط. هذا القسم UI فقط دون أي دعوات أو صلاحيات فعلية.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={<Plus className="h-4 w-4" />}>دعوة عضو</Button>
            <Button variant="secondary" icon={<UsersRound className="h-4 w-4" />}>إسناد دور</Button>
            <Button variant="secondary" icon={<Sparkles className="h-4 w-4" />}>إنشاء فريق</Button>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />}>تصدير الفريق</Button>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TeamMetric title="إجمالي الأعضاء" value={String(members.length)} tone="gold" icon={<UsersRound className="h-5 w-5" />} />
        <TeamMetric title="نشطون اليوم" value={String(members.filter((member) => member.status === "Active").length)} tone="success" icon={<CheckCircle2 className="h-5 w-5" />} />
        <TeamMetric title="دعوات معلقة" value={String(members.filter((member) => member.status === "Invited" || member.status === "Pending").length)} tone="warning" icon={<Clock3 className="h-5 w-5" />} />
        <TeamMetric title="الأدوار المغطاة" value={`${new Set(members.map((member) => member.role)).size}/${roles.length}`} tone="blue" icon={<Gauge className="h-5 w-5" />} />
      </div>

      <GlassCard className="p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_repeat(3,180px)] xl:items-center">
          <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 py-3 shadow-inner shadow-black/20 transition focus-within:border-[#D4AF37]/40">
            <Search className="h-5 w-5 text-gold" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في الفريق..." className="w-full bg-transparent text-sm text-ds-text outline-none placeholder:text-ds-text/38" />
          </div>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-bold text-ds-text outline-none focus:border-[#D4AF37]/44">
            <option value="all">كل الأدوار</option>
            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-bold text-ds-text outline-none focus:border-[#D4AF37]/44">
            <option value="all">كل الحالات</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Invited">Invited</option>
          </select>
          <select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-bold text-ds-text outline-none focus:border-[#D4AF37]/44">
            <option value="all">كل التوفر</option>
            <option value="Available">Available</option>
            <option value="Busy">Busy</option>
            <option value="Limited">Limited</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </GlassCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <GlassCard className="p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone="blue">Team Directory</Badge>
                <h3 className="mt-2 text-2xl font-black text-white">دليل الفريق</h3>
              </div>
              <Badge tone="neutral">{visibleMembers.length} members</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {visibleMembers.map((member) => <TeamMemberCard key={member.name} member={member} />)}
            </div>
            {visibleMembers.length === 0 && <div className="mt-4"><EmptyState title="لا توجد نتائج" description="جرّب تغيير البحث أو الفلاتر الحالية." /></div>}
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone="gold">Team Roles</Badge>
                <h3 className="mt-2 text-2xl font-black text-white">الأدوار المطلوبة</h3>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {roles.map((role) => {
                const covered = members.some((member) => member.role === role);
                return (
                  <div key={role} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-black text-white">{role}</span>
                      <Badge tone={covered ? "success" : "warning"}>{covered ? "Covered" : "Missing"}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        <aside className="space-y-5">
          <GlassCard className="p-5">
            <div className="flex items-start gap-4">
              <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
              <div>
                <Badge tone="blue">VORA Insights</Badge>
                <h3 className="mt-3 text-xl font-black text-white">رؤية الفريق</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <ContextRow label="توازن العمل" value="Architect مرتفع" />
              <ContextRow label="أدوار ناقصة" value="Site Manager" />
              <ContextRow label="اقتراح تعاون" value="مراجعة أسبوعية" />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="gold">Activity Feed</Badge>
            <div className="mt-5 grid gap-4">
              <TimelineCard index={1} title="VORA راجعت توزيع العمل" text="يوجد ضغط أعلى على دور المعماري." icon={<Bot className="h-4 w-4" />} />
              <TimelineCard index={2} title="دعوة قيد الانتظار" text="مقاول المشروع لم يؤكد الدعوة بعد." icon={<Clock3 className="h-4 w-4" />} />
              <TimelineCard index={3} title="دور ناقص" text="يُنصح بإضافة Site Manager قبل التنفيذ." icon={<ShieldAlert className="h-4 w-4" />} />
            </div>
          </GlassCard>
        </aside>
      </div>
    </div></LocalizedContent>
  );
}

function TeamMetric({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: "gold" | "blue" | "warning" | "success" }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone={tone}>{title}</Badge>
          <p className="mt-4 text-3xl font-black text-white">{value}</p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D4AF37]/10 text-gold shadow-gold-glow">{icon}</span>
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function TeamMemberCard({ member }: { member: { name: string; role: string; status: string; availability: string; tasks: number; workload: number } }) {
  const { locale } = useI18n();
  return (
    <LocalizedContent locale={locale}><div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-1 hover:border-[#D4AF37]/28 hover:bg-white/[0.065]">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-lg font-black text-gold shadow-gold-glow">
          {member.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={member.status === "Active" ? "success" : member.status === "Pending" ? "warning" : "blue"}>{member.status}</Badge>
            <Badge tone="neutral">{member.availability}</Badge>
          </div>
          <h4 className="mt-3 truncate text-lg font-black text-white">{member.name}</h4>
          <p className="mt-1 text-sm font-bold text-ds-text/50">{member.role}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        <div className="flex items-center justify-between text-xs font-black text-ds-text/52">
          <span>Assigned tasks</span>
          <span>{member.tasks}</span>
        </div>
        <ProgressBar value={member.workload} label="Workload" tone={member.workload > 80 ? "warning" : member.workload > 60 ? "blue" : "success"} />
      </div>
    </div></LocalizedContent>
  );
}

function ReportsTab({ project, detail }: { project: ProjectWorkspaceProject; detail: ProjectDetail }) {
  const analyticsState = useAnalyticsSummary(project.organizationId || "atlas", project.id);
  const analytics = analyticsState.data;
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReportId, setSelectedReportId] = useState("RPT-001");

  const reportTypes = [
    { title: "Executive", label: "تقارير تنفيذية", count: analytics?.reports.filter((report) => report.type === "Executive").length || 1, tone: "gold" as const, icon: <BarChart3 className="h-5 w-5" /> },
    { title: "Weekly", label: "تقارير أسبوعية", count: analytics?.reports.filter((report) => report.type === "Weekly").length || 1, tone: "blue" as const, icon: <CalendarDays className="h-5 w-5" /> },
    { title: "Budget", label: "تقارير الميزانية", count: analytics?.reports.filter((report) => report.type === "Budget").length || 1, tone: "success" as const, icon: <Coins className="h-5 w-5" /> },
    { title: "Timeline", label: "تقارير الجدول الزمني", count: analytics?.reports.filter((report) => report.type === "Timeline").length || 1, tone: "warning" as const, icon: <Clock3 className="h-5 w-5" /> },
    { title: "Progress", label: "تقارير التقدم", count: analytics?.reports.filter((report) => report.type === "Progress").length || 1, tone: "neutral" as const, icon: <UsersRound className="h-5 w-5" /> },
    { title: "Risk", label: "تقارير المخاطر", count: analytics?.reports.filter((report) => report.type === "Risk").length || 1, tone: "warning" as const, icon: <ShieldAlert className="h-5 w-5" /> }
  ];

  const reports = analytics?.reports.map((report, index) => ({
    id: report.id,
    title: report.title,
    category: report.type,
    status: report.status,
    date: report.date,
    author: report.author,
    preview: report.summary,
    tone: (index === 0 ? "gold" : report.type === "Budget" ? "success" : report.type === "Risk" ? "warning" : "blue") as "gold" | "success" | "warning" | "blue"
  })) || detail.reports.map((title, index) => ({
    id: `RPT-${String(index + 1).padStart(3, "0")}`,
    title,
    category: index === 0 ? "Executive" : index === 1 ? "Budget" : "Risk",
    status: index === 2 ? "Needs review" : "Ready",
    date: `2026-07-${16 - index * 2}`,
    author: index === 1 ? "Finance Department" : "VORA",
    preview: `${title} for ${project.title}: includes project status, management actions, risks, budget signals, and next decisions.`,
    tone: (index === 0 ? "gold" : index === 1 ? "success" : "warning") as "gold" | "success" | "warning"
  }));

  const visibleReports = reports.filter((report) => {
    const searchTarget = `${report.title} ${report.category} ${report.status} ${report.author}`.toLowerCase();
    const matchesQuery = query.trim() ? searchTarget.includes(query.trim().toLowerCase()) : true;
    const matchesType = typeFilter === "all" || report.category === typeFilter;
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesDate = dateFilter === "all" || (dateFilter === "recent" ? report.date >= "2026-07-10" : report.date < "2026-07-10");
    return matchesQuery && matchesType && matchesStatus && matchesDate;
  });

  const selectedReport = visibleReports.find((report) => report.id === selectedReportId) || visibleReports[0] || reports[0];

  return (<AutoLocalizedContent>
    <div className="space-y-5">
      <GlassCard className="relative overflow-hidden p-5">
        <BlueprintOverlay className="opacity-20" />
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Badge tone="gold">Reports Workspace</Badge>
            <h2 className="mt-2 text-2xl font-black text-white">تقارير المشروع</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-ds-text/58">
              واجهة لإدارة تقارير {project.title}: التنفيذي، الأسبوعي، الميزانية، الجدول الزمني، الفريق، والمخاطر. هذا القسم UI فقط دون إنشاء ملفات أو APIs جديدة.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={<Sparkles className="h-4 w-4" />}>توليد تقرير</Button>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />}>Export PDF</Button>
            <Button variant="secondary" icon={<FileArchive className="h-4 w-4" />}>Export Excel</Button>
            <Button variant="secondary" icon={<CalendarDays className="h-4 w-4" />}>جدولة تقرير</Button>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportTypes.map((type) => (
          <ReportsOverviewCard key={type.title} title={type.label} value={String(type.count)} tone={type.tone} icon={type.icon} />
        ))}
      </div>

      {analyticsState.loading || !analytics ? (
        <GlassCard className="p-5">
          <p className="text-sm text-ds-text/60">جاري تحميل مؤشرات التقارير والتحليلات...</p>
        </GlassCard>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[analytics.projectHealth, analytics.budgetHealth, analytics.timelineHealth, analytics.taskCompletion].map((kpi) => (
              <GlassCard key={kpi.id} className="p-4">
                <Badge tone={kpi.tone}>{kpi.label}</Badge>
                <p className="mt-4 text-3xl font-black text-white">{kpi.displayValue}</p>
                <p className="mt-2 text-xs leading-6 text-ds-text/50">{kpi.description}</p>
                <div className="mt-4"><ProgressBar value={kpi.value} tone={kpi.tone} /></div>
              </GlassCard>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <ChartContainer title="Task Distribution">
              <MiniBarChart points={analytics.taskDistribution} />
            </ChartContainer>
            <ChartContainer title="Department Performance">
              <MiniBarChart points={analytics.departmentPerformance} />
            </ChartContainer>
            <ChartContainer title="Knowledge Activity">
              {analytics.knowledgeActivity.length ? <MiniBarChart points={analytics.knowledgeActivity} /> : <EmptyState title="لا توجد بيانات معرفة" description="ستظهر فئات المعرفة بعد إضافة مقالات للمشروع." />}
            </ChartContainer>
          </div>

          <GlassCard className="p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone="blue">Analytics Matrix</Badge>
                <h3 className="mt-2 text-xl font-black text-white">مؤشرات قابلة للتنفيذ</h3>
              </div>
              <Badge tone={analytics.riskScore > 55 ? "warning" : "success"}>Risk {analytics.riskScore}%</Badge>
            </div>
            <Table
              columns={["المؤشر", "القيمة", "الاتجاه", "الوصف"]}
              rows={[analytics.projectHealth, analytics.budgetHealth, analytics.timelineHealth, analytics.taskCompletion, analytics.knowledgeCoverage, analytics.documentCoverage].map((kpi) => [
                kpi.label,
                kpi.displayValue,
                kpi.trend || "flat",
                kpi.description || ""
              ])}
            />
          </GlassCard>
        </>
      )}

      <GlassCard className="p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_repeat(3,180px)] xl:items-center">
          <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 py-3 shadow-inner shadow-black/20 transition focus-within:border-[#D4AF37]/40">
            <Search className="h-5 w-5 text-gold" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في التقارير..." className="w-full bg-transparent text-sm text-ds-text outline-none placeholder:text-ds-text/38" />
          </div>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-bold text-ds-text outline-none focus:border-[#D4AF37]/44">
            <option value="all">كل أنواع التقارير</option>
            {reportTypes.map((type) => <option key={type.title} value={type.title}>{type.label}</option>)}
          </select>
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-bold text-ds-text outline-none focus:border-[#D4AF37]/44">
            <option value="all">كل التواريخ</option>
            <option value="recent">الأحدث</option>
            <option value="older">الأقدم</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-bold text-ds-text outline-none focus:border-[#D4AF37]/44">
            <option value="all">كل الحالات</option>
            <option value="Ready">Ready</option>
            <option value="Draft">Draft</option>
            <option value="Needs review">Needs review</option>
          </select>
        </div>
      </GlassCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <GlassCard className="p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone="blue">Reports Library</Badge>
                <h3 className="mt-2 text-2xl font-black text-white">مكتبة التقارير</h3>
              </div>
              <Badge tone="neutral">{visibleReports.length} reports</Badge>
            </div>
            <div className="grid gap-4">
              {visibleReports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedReportId(report.id)}
                  className={`w-full rounded-[1.75rem] border p-4 text-right transition hover:-translate-y-1 hover:border-[#D4AF37]/32 hover:bg-white/[0.065] ${selectedReport.id === report.id ? "border-[#D4AF37]/34 bg-[#D4AF37]/8 shadow-gold-glow" : "border-white/10 bg-white/[0.045]"}`}
                >
                  <span className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge tone={report.tone}>{report.category}</Badge>
                        <Badge tone={report.status === "Ready" ? "success" : report.status === "Draft" ? "blue" : "warning"}>{report.status}</Badge>
                      </span>
                      <span className="mt-3 block text-xl font-black text-white">{report.title}</span>
                      <span className="mt-2 block text-sm leading-7 text-ds-text/56">{report.preview}</span>
                      <span className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-ds-text/42">
                        <span>{report.date}</span>
                        <span>·</span>
                        <span>{report.author}</span>
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-2">
                      <IconButton label="معاينة التقرير" tone="blue">
                        <FileText className="h-5 w-5" />
                      </IconButton>
                      <IconButton label="تنزيل التقرير" tone="gold">
                        <Download className="h-5 w-5" />
                      </IconButton>
                      <IconButton label="مشاركة التقرير" tone="neutral">
                        <UsersRound className="h-5 w-5" />
                      </IconButton>
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {visibleReports.length === 0 && <div className="mt-4"><EmptyState title="لا توجد تقارير" description="جرّب تغيير البحث أو الفلاتر الحالية." /></div>}
          </GlassCard>
        </div>

        <aside className="space-y-5">
          <GlassCard className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone={selectedReport.tone}>Report Preview</Badge>
                <h3 className="mt-3 text-xl font-black text-white">{selectedReport.title}</h3>
              </div>
              <FileText className="h-6 w-6 text-gold" />
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 bg-black/24 p-4">
              <p className="text-sm leading-7 text-ds-text/62">{selectedReport.preview}</p>
              <div className="mt-5 grid gap-3">
                <ContextRow label="التصنيف" value={selectedReport.category} />
                <ContextRow label="الحالة" value={selectedReport.status} />
                <ContextRow label="التاريخ" value={selectedReport.date} />
                <ContextRow label="الكاتب" value={selectedReport.author} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" icon={<Download className="h-4 w-4" />}>Download</Button>
              <Button variant="secondary" icon={<UsersRound className="h-4 w-4" />}>Share</Button>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-start gap-4">
              <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
              <div>
                <Badge tone="blue">VORA Insights</Badge>
                <h3 className="mt-3 text-xl font-black text-white">رؤية التقارير</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <ContextRow label="التقرير المقترح" value="Executive Brief" />
              <ContextRow label="تقرير ناقص" value="Risk Update" />
              <ContextRow label="ملخص المشروع" value={`${project.score}% تقدم`} />
              <ContextRow label="إجراء إداري" value="مراجعة التأخير" />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="gold">Quick Actions</Badge>
            <div className="mt-4 grid gap-3">
              <ActionLink href="/tools/document" icon={<Sparkles className="h-5 w-5" />} title="توليد تقرير" />
              <ActionLink href="/history" icon={<FileArchive className="h-5 w-5" />} title="مراجعة المخرجات" />
              <ActionLink href="/tools/document" icon={<CalendarDays className="h-5 w-5" />} title="جدولة تقرير" />
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function ReportsOverviewCard({ title, value, icon, tone }: { title: string; value: string; icon: React.ReactNode; tone: "gold" | "blue" | "warning" | "success" | "neutral" }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone={tone}>{title}</Badge>
          <p className="mt-4 text-3xl font-black text-white">{value}</p>
          <p className="mt-2 text-xs font-bold text-ds-text/46">جاهز للعرض والإدارة</p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D4AF37]/10 text-gold shadow-gold-glow">{icon}</span>
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function MiniBarChart({ points }: { points: AnalyticsChartPoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return (<AutoLocalizedContent>
    <div className="space-y-3">
      {points.slice(0, 7).map((point) => (
        <div key={point.label} className="grid gap-2">
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-ds-text/58">
            <span className="truncate">{point.label}</span>
            <span>{point.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={
                "h-full rounded-full shadow-[0_0_18px_currentColor] " +
                (point.tone === "success" ? "bg-[#16C784] text-[#16C784]" : point.tone === "warning" ? "bg-[#FFB020] text-[#FFB020]" : point.tone === "danger" ? "bg-[#EF4444] text-[#EF4444]" : point.tone === "blue" ? "bg-[#4F8CFF] text-[#4F8CFF]" : "bg-[#D4AF37] text-[#D4AF37]")
              }
              style={{ width: `${Math.max(4, Math.round((point.value / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </AutoLocalizedContent>);
}

function SettingsTab({ project }: { project: ProjectWorkspaceProject }) {
  const notificationItems = [
    "Task updates",
    "Timeline delays",
    "Budget alerts",
    "Document uploads",
    "Team activity",
    "VORA recommendations"
  ];

  const aiPreferences = [
    { label: "Default VORA tone", value: "Professional" },
    { label: "Default output language", value: "العربية" },
    { label: "Automatic project summaries", value: "Enabled" },
    { label: "Risk alerts", value: "High priority" },
    { label: "Weekly AI briefing", value: "Sunday morning" }
  ];

  return (<AutoLocalizedContent>
    <div className="space-y-5">
      <GlassCard className="sticky top-4 z-20 border-[#D4AF37]/18 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="warning">Unsaved changes</Badge>
            <p className="text-sm font-bold text-ds-text/60">كل التغييرات في هذا القسم واجهة فقط ولن يتم حفظها في قاعدة البيانات.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary">Reset changes</Button>
            <Button icon={<CheckCircle2 className="h-4 w-4" />}>Save changes</Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="relative overflow-hidden p-5">
        <BlueprintOverlay className="opacity-20" />
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Badge tone="gold">Project Settings</Badge>
            <h2 className="mt-2 text-2xl font-black text-white">إعدادات مساحة المشروع</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-ds-text/58">
              واجهة إعدادات متقدمة لـ {project.title}: البيانات العامة، التفضيلات، التنبيهات، الصلاحيات، VORA، والملفات. لا توجد إجراءات مدمرة أو حفظ فعلي في هذا السبرنت.
            </p>
          </div>
          <div className="grid min-w-[220px] gap-3">
            <MiniMetric label="Project Code" value={project.id} icon={<FolderKanban className="h-5 w-5" />} />
            <MiniMetric label="Status" value={project.status} icon={<Gauge className="h-5 w-5" />} />
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <SettingsSection title="General Settings" badge="عام" icon={<Settings className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-2">
              <SettingsInput label="Project name" value={project.title} />
              <SettingsInput label="Project code" value={project.id} />
              <SettingsInput label="Project type" value={project.type} />
              <SettingsInput label="Location" value="المغرب، أكادير" />
              <SettingsSelect label="Status" value={project.status} options={["Planning", "Active", "On hold", "Completed"]} />
              <SettingsInput label="Start date" value="2026-07-01" />
              <SettingsInput label="Expected completion date" value="2026-12-20" />
              <div className="md:col-span-2">
                <SettingsTextarea label="Description" value="مساحة مشروع معمارية لإدارة التخطيط، الوثائق، الفريق، التنفيذ، والتقارير بمساعدة VORA." />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection title="Workspace Preferences" badge="التفضيلات" icon={<Gauge className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SettingsSelect label="Default landing section" value="Overview" options={["Overview", "VORA AI", "Documents", "Timeline", "Reports"]} />
              <SettingsSelect label="Language" value="العربية" options={["العربية", "Français", "English"]} />
              <SettingsSelect label="Date format" value="YYYY-MM-DD" options={["YYYY-MM-DD", "DD/MM/YYYY", "MMM DD, YYYY"]} />
              <SettingsSelect label="Currency" value="MAD" options={["MAD", "USD", "EUR"]} />
              <SettingsSelect label="Time zone" value="Africa/Casablanca" options={["Africa/Casablanca", "UTC", "Europe/Paris"]} />
              <SettingsSelect label="Display density" value="Comfortable" options={["Comfortable", "Compact", "Spacious"]} />
            </div>
          </SettingsSection>

          <SettingsSection title="Notifications" badge="التنبيهات" icon={<Clock3 className="h-5 w-5" />}>
            <div className="grid gap-3 md:grid-cols-2">
              {notificationItems.map((item, index) => (
                <SettingsToggle key={item} label={item} enabled={index !== 2} />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="AI Preferences" badge="VORA" icon={<Bot className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-2">
              {aiPreferences.map((item) => (
                <SettingsSelect key={item.label} label={item.label} value={item.value} options={[item.value, "Disabled", "Manual", "Balanced"]} />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Data and Files" badge="البيانات" icon={<FileArchive className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-3">
              <ProgressPanel label="Storage usage" value={46} tone="blue" />
              <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                <Badge tone="gold">Export</Badge>
                <p className="mt-3 text-sm leading-6 text-ds-text/56">تصدير بيانات المشروع كواجهة فقط.</p>
                <Button className="mt-4 w-full" variant="secondary" icon={<Download className="h-4 w-4" />}>Export project data</Button>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                <Badge tone="blue">Archive</Badge>
                <p className="mt-3 text-sm leading-6 text-ds-text/56">تحضير أرشيف كامل دون تنفيذ التنزيل.</p>
                <Button className="mt-4 w-full" variant="secondary" icon={<FileArchive className="h-4 w-4" />}>Download archive</Button>
              </div>
            </div>
          </SettingsSection>

          <GlassCard className="border-[#EF4444]/24 p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <Badge tone="danger">Danger Zone</Badge>
                <h3 className="mt-2 text-2xl font-black text-white">إجراءات حساسة</h3>
                <p className="mt-2 text-sm leading-7 text-ds-text/54">كل الأزرار هنا UI فقط. لا يوجد أرشفة أو نقل ملكية أو حذف فعلي.</p>
              </div>
              <LockKeyhole className="h-6 w-6 text-[#EF4444]" />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <DangerAction title="Archive project" description="إخفاء المشروع من العمل اليومي." />
              <DangerAction title="Transfer ownership" description="تحضير نقل ملكية المشروع." />
              <DangerAction title="Delete project" description="إجراء خطير غير مفعل." />
            </div>
          </GlassCard>
        </div>

        <aside className="space-y-5">
          <GlassCard className="p-5">
            <Badge tone="gold">Permissions Summary</Badge>
            <h3 className="mt-3 text-xl font-black text-white">ملخص الصلاحيات</h3>
            <div className="mt-5 grid gap-3">
              <ContextRow label="Owner" value="سعيد الشرفي" />
              <ContextRow label="Admins" value="2" />
              <ContextRow label="Editors" value="4" />
              <ContextRow label="Viewers" value="8" />
              <ContextRow label="Access overview" value="Private workspace" />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-start gap-4">
              <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
              <div>
                <Badge tone="blue">VORA Settings</Badge>
                <h3 className="mt-3 text-xl font-black text-white">توصية الإعدادات</h3>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-ds-text/60">
              أنصح بتفعيل تنبيهات التأخير والمخاطر الأسبوعية خلال مرحلة التنفيذ، مع إبقاء ملخص VORA تلقائياً للفريق الإداري.
            </p>
          </GlassCard>

          <GlassCard className="p-5">
            <Badge tone="neutral">Access Overview</Badge>
            <div className="mt-5 space-y-4">
              <ProgressBar value={100} label="Owner access" tone="gold" />
              <ProgressBar value={72} label="Editor access" tone="blue" />
              <ProgressBar value={38} label="Viewer access" tone="success" />
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function SettingsSection({ title, badge, icon, children }: { title: string; badge: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#D4AF37]/10 text-gold shadow-gold-glow">{icon}</span>
        <div>
          <Badge tone="gold">{badge}</Badge>
          <h3 className="mt-2 text-2xl font-black text-white">{title}</h3>
        </div>
      </div>
      {children}
    </GlassCard>
  </AutoLocalizedContent>);
}

function SettingsInput({ label, value }: { label: string; value: string }) {
  return (<AutoLocalizedContent>
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-ds-text/42">{label}</span>
      <input defaultValue={value} className="h-12 w-full rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-bold text-ds-text outline-none transition focus:border-[#D4AF37]/44" />
    </label>
  </AutoLocalizedContent>);
}

function SettingsTextarea({ label, value }: { label: string; value: string }) {
  return (<AutoLocalizedContent>
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-ds-text/42">{label}</span>
      <textarea defaultValue={value} rows={4} className="w-full resize-none rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm font-bold leading-7 text-ds-text outline-none transition focus:border-[#D4AF37]/44" />
    </label>
  </AutoLocalizedContent>);
}

function SettingsSelect({ label, value, options }: { label: string; value: string; options: string[] }) {
  return (<AutoLocalizedContent>
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-ds-text/42">{label}</span>
      <select defaultValue={value} className="h-12 w-full rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-bold text-ds-text outline-none transition focus:border-[#D4AF37]/44">
        {Array.from(new Set(options)).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  </AutoLocalizedContent>);
}

function SettingsToggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (<AutoLocalizedContent>
    <button type="button" className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-right transition hover:-translate-y-1 hover:border-[#D4AF37]/28 hover:bg-white/[0.065]">
      <span>
        <span className="block font-black text-white">{label}</span>
        <span className="mt-1 block text-xs font-bold text-ds-text/42">{enabled ? "Enabled for this workspace" : "Disabled by default"}</span>
      </span>
      <span className={`relative h-7 w-12 rounded-full border transition ${enabled ? "border-[#16C784]/35 bg-[#16C784]/20" : "border-white/10 bg-black/30"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full transition ${enabled ? "right-6 bg-[#16C784] shadow-[0_0_18px_rgba(22,199,132,.55)]" : "right-1 bg-ds-text/45"}`} />
      </span>
    </button>
  </AutoLocalizedContent>);
}

function DangerAction({ title, description }: { title: string; description: string }) {
  return (<AutoLocalizedContent>
    <div className="rounded-3xl border border-[#EF4444]/18 bg-[#EF4444]/8 p-4">
      <Badge tone="danger">{title}</Badge>
      <p className="mt-3 min-h-12 text-sm leading-6 text-ds-text/54">{description}</p>
      <Button className="mt-4 w-full" variant="danger" icon={<LockKeyhole className="h-4 w-4" />}>UI only</Button>
    </div>
  </AutoLocalizedContent>);
}

function WorkspaceTabScaffold({ tab, project }: { tab: string; project: ProjectWorkspaceProject }) {
  const current = workspaceTabs.find((item) => item.value === tab);
  return (<AutoLocalizedContent>
    <GlassCard className="p-6">
      <EmptyState
        title={`${current?.label || "Workspace"} · ${project.title}`}
        description="تم تجهيز مساحة هذا القسم بصرياً فقط في Sprint 7.1. سيتم ربط المحتوى المتخصص من الوظائف الحالية بدون إضافة منطق خلفي جديد."
        action={
          <Link href={tab === "ai" ? "/tools/document" : tab === "knowledge" ? "/projects#knowledge" : "/projects"}>
            <Button variant="secondary" icon={<Plus className="h-4 w-4" />}>فتح المسار الحالي</Button>
          </Link>
        }
      />
    </GlassCard>
  </AutoLocalizedContent>);
}

function MiniMetric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (<AutoLocalizedContent>
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-center gap-2 text-gold">{icon}<span className="text-xs font-black text-ds-text/52">{label}</span></div>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  </AutoLocalizedContent>);
}

function BudgetMetricCard({ title, value, detail, icon, tone }: { title: string; value: string; detail: string; icon: React.ReactNode; tone: "gold" | "blue" | "success" }) {
  return (<AutoLocalizedContent>
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-ds-sm transition hover:-translate-y-1 hover:border-[#D4AF37]/28 hover:bg-white/[0.065]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone={tone}>{title}</Badge>
          <p className="mt-4 text-2xl font-black text-white">{value}</p>
          <p className="mt-2 text-xs font-bold leading-5 text-ds-text/48">{detail}</p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#D4AF37]/10 text-gold shadow-gold-glow">{icon}</span>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function BudgetActionContent({ action }: { action: { title: string; description: string; icon: React.ReactNode; tone: "gold" | "blue" | "success" | "neutral" } }) {
  return (<AutoLocalizedContent>
    <span className="flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#D4AF37]/12 text-gold transition group-hover:-rotate-6">{action.icon}</span>
      <span>
        <Badge tone={action.tone}>{action.title}</Badge>
        <span className="mt-2 block text-sm leading-6 text-ds-text/56">{action.description}</span>
      </span>
    </span>
  </AutoLocalizedContent>);
}

function ProgressPanel({ label, value, tone }: { label: string; value: number; tone: "gold" | "blue" | "success" }) {
  return (<AutoLocalizedContent>
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <p className="mb-4 text-sm font-black text-ds-text/70">{label}</p>
      <ProgressBar value={value} tone={tone} />
    </div>
  </AutoLocalizedContent>);
}

function ActionLink({ href, icon, title }: { href: string; icon: React.ReactNode; title: string }) {
  return (<AutoLocalizedContent>
    <Link href={href} className="group rounded-3xl border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-1 hover:border-[#D4AF37]/32 hover:bg-white/[0.07]">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#D4AF37]/12 text-gold transition group-hover:-rotate-6">{icon}</span>
      <span className="mt-4 block font-black text-white">{title}</span>
      <span className="mt-2 block text-xs leading-5 text-ds-text/46">متاح عبر الوظائف الحالية</span>
    </Link>
  </AutoLocalizedContent>);
}

