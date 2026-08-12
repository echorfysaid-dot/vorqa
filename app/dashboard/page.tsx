"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useI18n } from "@/components/i18n-provider";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  FileSignature,
  FileText,
  FileSearch,
  FolderKanban,
  Gauge,
  MessageSquareText,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Star,
  Store,
  UploadCloud,
  UserPlus,
  UsersRound,
  WandSparkles
} from "lucide-react";
import { Alert, Badge, Button, Card, EmptyState, GlassCard, PageHeader, ProgressBar, SkeletonCard, StatusChip, TimelineCard } from "@/components/ui";
import { BlueprintOverlay, VillaVisual, VoraVisual } from "@/components/vorqa-official-visuals";
import { ActionInbox, MissionBrief, ProjectPulse, VoraBrief, type MissionActionItem, type ProjectPulseItem } from "@/components/mission-control";
import { organizationRepository, employeeRepository, projectRepository, taskRepository } from "@/lib/repositories";
import { useAnalyticsSummary } from "@/lib/repositories/analyticsHooks";
import { useMarketplaceDashboard } from "@/lib/repositories/marketplaceHooks";
import { useProjectsRepository } from "@/lib/repositories/projectHooks";
import { useKnowledgeRepository } from "@/lib/repositories/knowledgeHooks";
import { useRfqSummary } from "@/lib/repositories/rfqHooks";
import { useQuotationDashboard } from "@/lib/repositories/quotationHooks";
import { useContractSummary } from "@/lib/repositories/contractHooks";
import { useNotificationSummary } from "@/lib/repositories/notificationHooks";
import { localizeDemoDate } from "@/lib/demo-localization";
import { useBillingSummary } from "@/lib/repositories/billingHooks";
import { useAdminDashboard } from "@/lib/repositories/adminHooks";
import { useTasksRepository } from "@/lib/repositories/taskHooks";
import { useDocumentsRepository } from "@/lib/repositories/documentHooks";
import { useOnboardingProfile } from "@/lib/onboarding-client";
import { useAuth } from "@/components/auth/auth-provider";
import { normalizeAccountIdentity } from "@/lib/onboarding";

const demoCompany = organizationRepository.getCurrent();
const demoUsers = employeeRepository.list();
const recentActivity = projectRepository.listRecentActivity();
const savedGenerations = projectRepository.listSavedGenerations();
const workspaceStats = projectRepository.listWorkspaceStats();
const notifications = projectRepository.listNotifications();

const quickActions = [
  { label: "New Project", text: "Create an Atlas workspace", href: "/projects", icon: Plus },
  { label: "Generate Document", text: "Prepare a board-ready report", href: "/tools/document", icon: FileText },
  { label: "Open AI", text: "Ask VORA with project context", href: "/tools", icon: MessageSquareText },
  { label: "Upload Files", text: "Add drawings and knowledge", href: "/projects#knowledge", icon: UploadCloud },
  { label: "Invite Team", text: "Prepare team access", href: "/settings", icon: UserPlus }
];

const kpiIcons = [FolderKanban, CheckCircle2, CircleDollarSign, UsersRound, BookOpen, WandSparkles];
const milestones = [
  { title: "Luxury Villa structural inspection", date: "18 July", status: "Upcoming" },
  { title: "Rabat permit package review", date: "21 July", status: "Critical" },
  { title: "Tangier steel supplier award", date: "25 July", status: "Scheduled" }
];

export default function DashboardPage() {
  const { locale, translate } = useI18n();
  const { session, loading: authLoading } = useAuth();
  const today = new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const { data: projects, loading: projectsLoading, error: projectsError, source, isFallback } = useProjectsRepository();
  const onboarding = useOnboardingProfile(Boolean(session?.access_token));
  const knowledgeState = useKnowledgeRepository({ organizationId: "atlas" });
  const analyticsState = useAnalyticsSummary("atlas", projects[0]?.id || "PRJ-1048");
  const marketplaceState = useMarketplaceDashboard();
  const rfqSummaryState = useRfqSummary();
  const quotationState = useQuotationDashboard();
  const contractState = useContractSummary();
  const notificationState = useNotificationSummary();
  const billingState = useBillingSummary();
  const adminState = useAdminDashboard();
  const tasksState = useTasksRepository(projects[0]?.id || "PRJ-1048");
  const documentsState = useDocumentsRepository(projects[0]?.id || "PRJ-1048");
  const activeProjectsValue = projectsLoading ? "..." : String(projects.length);
  const knowledgeCategoriesCount = new Set(knowledgeState.data.map((article) => article.category).filter(Boolean)).size;
  const projectSourceBadge = source === "supabase" ? "Supabase" : isFallback ? "Demo fallback" : "Demo";
  const kpis = [
    { label: "Active Projects", value: activeProjectsValue, delta: projectSourceBadge, tone: source === "supabase" ? "success" as const : "gold" as const },
    { label: "Pending Tasks", value: "44", delta: "11 urgent", tone: "warning" as const },
    { label: "Budget Health", value: analyticsState.loading || !analyticsState.data ? "..." : analyticsState.data.budgetHealth.displayValue, delta: "Forecast", tone: analyticsState.data?.budgetHealth.tone || "success" as const },
    { label: "Team Members", value: String(demoUsers.length), delta: "6 active", tone: "blue" as const },
    { label: "Knowledge", value: knowledgeState.loading ? "..." : String(knowledgeState.data.length), delta: `${knowledgeCategoriesCount} ${translate("categories")}`, tone: "neutral" as const },
    { label: "Risk Score", value: analyticsState.loading || !analyticsState.data ? "..." : `${analyticsState.data.riskScore}%`, delta: "VORA live", tone: analyticsState.data && analyticsState.data.riskScore > 55 ? "warning" as const : "gold" as const }
  ];
  const primaryProject = projects[0];
  const metadataIdentity = normalizeAccountIdentity({
    accountType: session?.user.user_metadata?.account_type ?? session?.user.user_metadata?.accountType,
    primaryRole: session?.user.user_metadata?.primary_role ?? session?.user.user_metadata?.primaryRole,
    organizationType: session?.user.user_metadata?.organization_type ?? session?.user.user_metadata?.organizationType
  });
  const activeIdentity = onboarding.profile?.accountType
    ? normalizeAccountIdentity(onboarding.profile)
    : metadataIdentity;
  const isContractor = activeIdentity?.accountType === "individual" && activeIdentity.primaryRole === "contractor";
  const isEngineer = activeIdentity?.accountType === "individual" && activeIdentity.primaryRole === "engineer";
  const taskStats = taskRepository.getProjectTaskStats(tasksState.data);
  const drawingDocuments = documentsState.data.filter((document) => ["Architectural Drawings", "Structural Drawings"].includes(String(document.category)) && !document.archived);
  const inspectionDocuments = documentsState.data.filter((document) => document.category === "Inspection Reports" && !document.archived);
  const ownerCriticalActions = notificationState.data.unread + contractState.data.awaitingApproval + (analyticsState.data && analyticsState.data.riskScore > 55 ? 1 : 0);
  const ownerActions: MissionActionItem[] = [
    ...(analyticsState.data && analyticsState.data.riskScore > 55 ? [{ id: "risk", type: translate("Risk"), priority: "critical" as const, project: primaryProject?.title || translate("Portfolio"), title: translate("Project risk requires review"), description: translate("The current risk score is above the preferred operating threshold."), primaryAction: { label: translate("Review risk"), href: primaryProject ? `/projects/${primaryProject.id}` : "/projects" } }] : []),
    ...(contractState.data.awaitingApproval > 0 ? [{ id: "approvals", type: translate("Approval"), priority: "high" as const, project: primaryProject?.title || translate("Portfolio"), title: translate("Approvals are waiting for a decision"), description: `${contractState.data.awaitingApproval} ${translate("items awaiting approval")}`, primaryAction: { label: translate("Open approvals"), href: "/contracts" } }] : []),
    ...(notificationState.data.unread > 0 ? [{ id: "notifications", type: translate("Alert"), priority: "medium" as const, project: translate("Organization"), title: translate("Unread operational alerts"), description: `${notificationState.data.unread} ${translate("unread alerts require review")}`, primaryAction: { label: translate("Open notifications"), href: "/notifications" } }] : [])
  ];
  const nextRfq = rfqSummaryState.data.upcomingDeadlines[0];
  const contractorActions: MissionActionItem[] = [
    ...(taskStats.blocked > 0 ? [{ id: "blocked-tasks", type: translate("Blocked task"), priority: "critical" as const, project: primaryProject?.title || translate("No active project"), title: translate("Execution tasks are blocked"), description: `${taskStats.blocked} ${translate("blocked tasks require intervention")}`, primaryAction: { label: translate("Open tasks"), href: primaryProject ? `/projects/${primaryProject.id}` : "/projects" } }] : []),
    ...(taskStats.overdue > 0 ? [{ id: "overdue-tasks", type: translate("Overdue task"), priority: "high" as const, project: primaryProject?.title || translate("No active project"), title: translate("Tasks have passed their due date"), description: `${taskStats.overdue} ${translate("overdue tasks require rescheduling or completion")}`, primaryAction: { label: translate("Review execution"), href: primaryProject ? `/projects/${primaryProject.id}` : "/projects" } }] : []),
    ...(nextRfq ? [{ id: `rfq-${nextRfq.id}`, type: translate("RFQ deadline"), priority: nextRfq.priority === "Critical" ? "critical" as const : "high" as const, project: nextRfq.project || primaryProject?.title || translate("Unavailable"), title: nextRfq.title, description: translate("A supplier response requires attention before the submission deadline."), dueDate: nextRfq.submissionDeadline, dueDateLabel: translate("Due date"), primaryAction: { label: translate("Open RFQ"), href: `/rfq/${nextRfq.id}` } }] : []),
    ...(contractState.data.riskIndicators[0] ? [{ id: `contract-${contractState.data.riskIndicators[0].id}`, type: translate("Contract issue"), priority: contractState.data.riskIndicators[0].level === "High" ? "high" as const : "medium" as const, project: primaryProject?.title || translate("Portfolio"), title: contractState.data.riskIndicators[0].title, description: translate("A contract risk requires contractor review."), primaryAction: { label: translate("Open contracts"), href: contractState.data.riskIndicators[0].contractId ? `/contracts/${contractState.data.riskIndicators[0].contractId}` : "/contracts" } }] : [])
  ];
  const engineerActions: MissionActionItem[] = [
    ...(taskStats.blocked > 0 ? [{ id: "engineering-blocked", type: translate("Blocked engineering task"), priority: "critical" as const, project: primaryProject?.title || translate("No active project"), title: translate("Engineering work is blocked"), description: `${taskStats.blocked} ${translate("blocked tasks require technical review")}`, primaryAction: { label: translate("Review technical issue"), href: primaryProject ? `/projects/${primaryProject.id}` : "/projects" } }] : []),
    ...(drawingDocuments[0] ? [{ id: `drawing-${drawingDocuments[0].id}`, type: translate("Drawing review"), priority: "high" as const, project: primaryProject?.title || translate("No active project"), title: drawingDocuments[0].title, description: translate("A current drawing package is available for engineering review. Review status is unavailable."), primaryAction: { label: translate("Open drawings"), href: primaryProject ? `/projects/${primaryProject.id}` : "/saved" } }] : []),
    ...(contractState.data.awaitingApproval > 0 ? [{ id: "engineering-approvals", type: translate("Document approval"), priority: "medium" as const, project: primaryProject?.title || translate("Portfolio"), title: translate("Approvals are waiting for engineering review"), description: `${contractState.data.awaitingApproval} ${translate("approvals are available; engineering ownership is unavailable")}`, primaryAction: { label: translate("Open approvals"), href: "/notifications" } }] : [])
  ];
  const missionActions = isEngineer ? engineerActions : isContractor ? contractorActions : ownerActions;
  const contractorCriticalActions = taskStats.blocked + taskStats.overdue + rfqSummaryState.data.upcomingDeadlines.length + contractState.data.riskIndicators.filter((item) => item.level === "High").length;
  const engineerCriticalActions = taskStats.blocked + contractState.data.awaitingApproval;
  const criticalActions = isEngineer ? engineerCriticalActions : isContractor ? contractorCriticalActions : ownerCriticalActions;
  const estimatedWorkload = tasksState.data.filter((task) => task.status !== "Done").reduce((total, task) => total + (task.estimatedHours || 0), 0);
  const pulseProjects: ProjectPulseItem[] = projects.filter((project) => !["Completed", "Archived"].includes(String(project.status))).map((project) => ({
    id: project.id,
    name: project.title,
    health: project.score,
    progress: project.score,
    budget: project.budget,
    timeline: translate(project.timeline || project.phase),
    risk: translate(project.score < 55 ? "High" : project.score < 75 ? "Medium" : "Low"),
    milestone: translate(project.phase),
    href: `/projects/${project.id}`,
    operational: isEngineer ? [
      { label: translate("Drawings"), value: drawingDocuments.length ? `${drawingDocuments.length} ${translate("available")}` : translate("Unavailable") },
      { label: translate("Inspections"), value: inspectionDocuments.length ? `${inspectionDocuments.length} ${translate("reports")}` : translate("Unavailable") },
      { label: translate("Approvals"), value: translate("Unavailable") }
    ] : isContractor ? [
      { label: translate("Workforce"), value: translate("Unavailable") },
      { label: translate("Equipment"), value: translate("Unavailable") },
      { label: translate("Materials"), value: translate("Unavailable") }
    ] : undefined
  }));

  if (authLoading || onboarding.loading) {
    return (
      <div className="space-y-6" aria-label={translate("Loading")} aria-busy="true">
        <SkeletonCard />
        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <MissionBrief
        greeting={translate("Good morning")}
        workspace={demoCompany.name}
        missionTitle={translate(isEngineer ? "Engineer mission today" : isContractor ? "Contractor mission today" : "Today's mission")}
        missionSummary={translate(isEngineer ? "Review technical priorities, drawings, inspections, and decisions affecting delivery." : isContractor ? "Execute priority work, remove site blockers, and protect upcoming commitments." : "Review project priorities, clear urgent decisions, and protect the next milestone.")}
        role={isEngineer ? "engineer" : isContractor ? "contractor" : "project_owner"}
        workloadLabel={translate("Today's workload")}
        workload={projectsLoading || tasksState.loading ? "..." : isEngineer || isContractor ? (estimatedWorkload > 0 ? `${estimatedWorkload}h` : translate("Unavailable")) : `${missionActions.length} ${translate("priority actions")}`}
        urgencyLabel={translate("Urgency")}
        urgency={translate(criticalActions > 0 ? "High" : "Normal")}
        criticalActionsLabel={translate("Critical actions")}
        criticalActions={criticalActions}
        currentFocusLabel={translate(isEngineer || isContractor ? "Highest priority project" : "Current focus")}
        currentFocus={primaryProject?.title || translate("No active project")}
        nextMilestoneLabel={translate("Next milestone")}
        nextMilestone={primaryProject ? translate(primaryProject.phase) : translate("No milestone available")}
        primaryAction={(isEngineer || isContractor) && primaryProject ? { label: translate("Start work"), href: `/projects/${primaryProject.id}` } : undefined}
        supplementary={isEngineer ? [
          { label: translate("Pending drawing reviews"), value: translate("Unavailable") },
          { label: translate("Scheduled site visits"), value: translate("Unavailable") },
          { label: translate("Inspection workload"), value: inspectionDocuments.length ? `${inspectionDocuments.length} ${translate("reports available")}` : translate("Unavailable") },
          { label: translate("Pending approvals"), value: String(contractState.data.awaitingApproval) }
        ] : undefined}
      />

      {projectsError && isFallback && (
        <Alert title={translate("Demo fallback is active because production project data is unavailable.")} tone="warning">
          {translate("Project data is shown from the demo fallback while production data is unavailable.")}
        </Alert>
      )}

      <ActionInbox title={translate(isEngineer ? "Engineer Action Inbox" : isContractor ? "Contractor Action Inbox" : "Action Inbox")} description={translate(isEngineer ? "Technical reviews, engineering blockers, and approvals ordered by urgency." : isContractor ? "Execution blockers, deadlines, and commitments ordered by urgency." : "Decisions and issues ordered by urgency.")} items={missionActions} emptyLabel={translate(isEngineer ? "No engineering actions require attention." : isContractor ? "No contractor actions require attention." : "No urgent actions require attention.")} />

      <ProjectPulse
        title={translate(isEngineer ? "Engineer Project Pulse" : isContractor ? "Contractor Project Pulse" : "Project Pulse")}
        description={translate(isEngineer ? "Engineering health and available technical signals for active projects." : isContractor ? "Execution health and available operating signals for active projects." : "A compact operating view of active projects.")}
        projects={pulseProjects}
        labels={{ project: translate("Project"), health: translate("Health"), progress: translate("Progress"), budget: translate("Budget"), timeline: translate("Timeline"), risk: translate("Risk"), milestone: translate("Next milestone"), open: translate("Open"), empty: translate("No active projects") }}
      />

      <VoraBrief
        title={translate(isEngineer ? "VORA Engineer Brief" : isContractor ? "VORA Contractor Brief" : "VORA Daily Brief")}
        summary={isEngineer ? translate(taskStats.blocked > 0 ? "Blocked tasks are the highest available engineering risk. Drawing review and inspection workflow statuses are unavailable." : drawingDocuments.length ? "Current drawing packages are available. Review ownership and inspection scheduling are unavailable." : "No engineering risk is available from current repositories. Drawing and site visit workflow statuses are unavailable.") : isContractor ? translate(taskStats.blocked > 0 ? "Blocked execution tasks are the highest current risk. Workforce, equipment, and material signals are unavailable." : nextRfq ? "The nearest RFQ deadline is the highest available contractor commitment. Workforce, equipment, and material signals are unavailable." : "No critical execution blocker is available from current repositories. Workforce, equipment, and material signals are unavailable.") : analyticsState.loading ? translate("Preparing the current project brief.") : translate(analyticsState.data && analyticsState.data.riskScore > 55 ? "Your highest priority today is reducing project risk before the next milestone." : "Project health is stable. Focus on pending approvals and the next milestone.")}
        suggestedActionLabel={translate("Suggested next action")}
        suggestedAction={translate(isEngineer ? taskStats.blocked > 0 ? "Review the blocked technical task" : drawingDocuments.length ? "Open the latest drawing package" : "Review the active technical plan" : isContractor ? taskStats.blocked > 0 ? "Open blocked tasks and assign the next execution action" : nextRfq ? "Review the nearest RFQ deadline" : "Review the active execution plan" : contractState.data.awaitingApproval > 0 ? "Review pending approvals" : "Review the active project plan")}
        buttonLabel={translate("Ask VORA")}
        href="/tools/document"
        secondaryAction={(isEngineer || isContractor) && primaryProject ? { label: translate("Open related project"), href: `/projects/${primaryProject.id}` } : undefined}
        metadata={[{ label: translate("Context"), value: primaryProject?.title || translate("Portfolio") }, { label: translate("Updated"), value: today }]}
      />

      <details className="group border-t border-ds-token-border pt-6">
        <summary className="ds-focusable min-h-11 cursor-pointer list-none rounded-ds-sm px-2 py-3 text-sm font-medium text-ds-token-muted hover:text-ds-token-text">{translate("Recent operations")}</summary>
        <section className="mt-5 grid gap-6 xl:grid-cols-2"><TodayTimeline /><WorkspaceFeed /></section>
      </details>

      {isEngineer ? <EngineerSecondaryOperations /> : isContractor ? <ContractorSecondaryOperations /> : <details className="group border-t border-ds-token-border pt-6">
        <summary className="ds-focusable flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-ds-sm px-2 text-start">
          <span><span className="block text-xs font-semibold uppercase tracking-[0.14em] text-ds-token-muted">{translate("Secondary workspace sections")}</span><span className="mt-1 block text-lg font-semibold text-ds-token-text">{translate("More")}</span></span>
        </summary>
        <div className="mt-6 space-y-6">
          <RfqDashboardWidget state={rfqSummaryState} />
          <QuotationDashboardWidget state={quotationState} />
          <ContractDashboardWidget state={contractState} />
          <BillingDashboardWidget state={billingState} />
          <AdminDashboardWidget state={adminState} />
          <NotificationDashboardWidget state={notificationState} />
          <MarketplaceDashboardWidgets state={marketplaceState} />
        </div>
      </details>}
    </div>
  );
}

function ContractorSecondaryOperations() {
  const { translate } = useI18n();
  const modules = [
    ["Projects", "/projects"], ["Tasks", "/projects"], ["RFQs and Bids", "/rfq"], ["Contracts", "/contracts"],
    ["Documents", "/saved"], ["Team", "/organizations"], ["Equipment", "/coming-soon?capability=equipment"],
    ["Finance", "/billing"], ["Reports", "/history"], ["Recent Activity", "/history"]
  ];
  return (
    <details className="group border-t border-ds-token-border pt-6">
      <summary className="ds-focusable min-h-11 cursor-pointer list-none rounded-ds-sm px-2 py-3 text-sm font-medium text-ds-token-muted hover:text-ds-token-text">{translate("Contractor operations")}</summary>
      <nav aria-label={translate("Contractor operations")} className="mt-4 grid gap-px overflow-hidden rounded-ds-md border border-ds-token-border bg-ds-token-border sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(([label, href]) => <Link key={label} href={href} className="ds-focusable flex min-h-12 items-center justify-between bg-ds-token-surface px-4 text-sm font-medium text-ds-token-text transition-colors hover:bg-ds-token-secondary"><span>{translate(label)}</span><ArrowLeft className="h-4 w-4 text-ds-token-muted rtl:rotate-180" /></Link>)}
      </nav>
    </details>
  );
}

function EngineerSecondaryOperations() {
  const { translate } = useI18n();
  const modules = [
    ["Drawings", "/saved"], ["Inspections", "/tools/construction-intelligence"],
    ["Issues", "/notifications"], ["Reports", "/history"],
    ["Documents", "/saved"], ["Recent Activity", "/history"]
  ];
  return (
    <details className="group border-t border-ds-token-border pt-6">
      <summary className="ds-focusable min-h-11 cursor-pointer list-none rounded-ds-sm px-2 py-3 text-sm font-medium text-ds-token-muted hover:text-ds-token-text">{translate("Engineer operations")}</summary>
      <nav aria-label={translate("Engineer operations")} className="mt-4 grid gap-px overflow-hidden rounded-ds-md border border-ds-token-border bg-ds-token-border sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(([label, href]) => <Link key={label} href={href} className="ds-focusable flex min-h-12 items-center justify-between bg-ds-token-surface px-4 text-sm font-medium text-ds-token-text transition-colors hover:bg-ds-token-secondary"><span>{translate(label)}</span><ArrowLeft className="h-4 w-4 text-ds-token-muted rtl:rotate-180" /></Link>)}
      </nav>
    </details>
  );
}

function OwnerWelcome({ today, projects, loading }: { today: string; projects: ReturnType<typeof projectRepository.list>; loading: boolean }) {
  const { translate } = useI18n();
  const primaryProject = projects[0];
  return (
    <section className="border-b border-ds-token-border pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ds-token-gold">{translate("Good morning")}</p>
          <h1 className="mt-2 text-2xl font-semibold text-ds-token-text sm:text-3xl">{translate("Project Owner Workspace")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ds-token-muted">{translate("Review priorities, active projects, and the next decisions for your organization.")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-ds-token-muted">
          <StatusChip tone="success">{translate(demoCompany.status)}</StatusChip>
          <span>{demoCompany.name}</span><span aria-hidden="true">·</span><span>{today}</span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link href="/projects"><Button icon={<FolderKanban className="h-4 w-4" />}>{translate("Open projects")}</Button></Link>
        {!loading && primaryProject && <Link href={`/projects/${primaryProject.id}`} className="ds-focusable rounded-ds-xs text-sm font-medium text-ds-token-muted hover:text-ds-token-text">{translate("Continue")} {primaryProject.title}</Link>}
      </div>
    </section>
  );
}

function AskVora() {
  const { translate } = useI18n();
  const prompts = ["Review project risks", "Check the next deadline", "Summarize budget health"];
  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <VoraVisual variant="avatar" className="h-11 w-11 shrink-0 rounded-ds-md" sizes="44px" />
        <div><p className="font-semibold text-ds-token-text">{translate("What would you like to review today?")}</p><p className="mt-1 text-sm text-ds-token-muted">{translate("VORA uses the current workspace context.")}</p></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => <Link key={prompt} href="/tools/document" className="ds-focusable rounded-ds-sm border border-ds-token-border px-3 py-2 text-xs font-medium text-ds-token-muted transition-colors hover:border-ds-token-gold/30 hover:text-ds-token-text">{translate(prompt)}</Link>)}
      </div>
    </Card>
  );
}

function TodayTimeline() {
  const { translate } = useI18n();
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-ds-token-gold">{translate("Today")}</p><h2 className="mt-1 text-lg font-semibold text-ds-token-text">{translate("Timeline")}</h2></div><CalendarClock className="h-5 w-5 text-ds-token-muted" /></div>
      <div className="divide-y divide-ds-token-border">
        {milestones.map((item, index) => <div key={item.title} className="flex items-start gap-3 py-3"><span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ds-token-border text-xs text-ds-token-muted">{index + 1}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-ds-token-text">{translate(item.title)}</p><p className="mt-1 text-xs text-ds-token-muted">{translate(item.date)}</p></div><StatusChip tone={item.status === "Critical" ? "warning" : "neutral"}>{translate(item.status)}</StatusChip></div>)}
      </div>
    </Card>
  );
}

function AttentionOverview({ projects, loading, riskScore, unread, approvals }: { projects: number; loading: boolean; riskScore?: number; unread: number; approvals: number }) {
  const { translate } = useI18n();
  const items = [
    { label: "Active Projects", value: projects, detail: "Open projects", href: "/projects", tone: "blue" as const },
    { label: "Risk Score", value: riskScore === undefined ? "—" : `${riskScore}%`, detail: riskScore !== undefined && riskScore > 55 ? "Attention Required" : "Active", href: "/projects", tone: riskScore !== undefined && riskScore > 55 ? "warning" as const : "success" as const },
    { label: "Approvals", value: approvals, detail: "Awaiting approval", href: "/contracts", tone: approvals > 0 ? "warning" as const : "neutral" as const },
    { label: "Unread alerts", value: unread, detail: "Open Notifications", href: "/notifications", tone: unread > 0 ? "gold" as const : "neutral" as const }
  ];
  return <Card className="divide-y divide-ds-token-border md:grid md:grid-cols-2 md:divide-x md:divide-y-0 rtl:md:divide-x-reverse xl:grid-cols-4">
    {items.map((item) => <Link key={item.label} href={item.href} className="ds-focusable flex min-h-24 items-center justify-between gap-4 p-4 transition-colors hover:bg-white/[0.025]">
      <div><p className="text-xs font-medium text-ds-token-muted">{translate(item.label)}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-ds-token-text">{loading ? "…" : item.value}</p></div>
      <StatusChip tone={item.tone}>{translate(item.detail)}</StatusChip>
    </Link>)}
  </Card>;
}

function WelcomeHeader({ today, projects, loading }: { today: string; projects: ReturnType<typeof projectRepository.list>; loading: boolean }) {
  const { translate } = useI18n();
  const primaryProject = projects[0];
  return (
    <GlassCard className="relative overflow-hidden p-4 sm:p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ds-token-gold/55 to-transparent" />
      <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(430px,.82fr)]">
        <div className="flex flex-col justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gold">{translate("Enterprise Demo")}</Badge>
              <Badge tone="success">{translate("Workspace Active")}</Badge>
            </div>
            <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight text-ds-token-text sm:text-4xl">
              {translate("Atlas Construction Group Command Center")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-ds-text/62">
              {translate("A live-feeling enterprise account for engineering, architecture, procurement, logistics, and finance teams managing construction delivery with VORA.")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HeaderMeta icon={<UsersRound className="h-4 w-4" />} label="Current role" value={demoCompany.role} />
            <HeaderMeta icon={<ShieldCheck className="h-4 w-4" />} label="Company" value={demoCompany.name} />
            <HeaderMeta icon={<Gauge className="h-4 w-4" />} label="Status" value={demoCompany.status} />
            <HeaderMeta icon={<CalendarDays className="h-4 w-4" />} label="Today" value={today} />
          </div>
        </div>

        <div className="relative min-h-[360px] overflow-hidden rounded-ds-xl border border-ds-token-border bg-black/24">
          <VillaVisual variant="dashboard" className="absolute inset-0 h-full w-full rounded-none" imageClassName="object-cover" priority sizes="420px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/18 to-black/5" />
          <div className="absolute inset-x-4 bottom-4 rounded-ds-lg border border-ds-token-gold/22 bg-black/68 p-4 backdrop-blur-md">
            {loading ? (
              <SkeletonCard />
            ) : primaryProject ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-ds-token-gold">{translate("Primary Workspace")}</p>
                    <p className="mt-1 text-2xl font-black text-white">{primaryProject.title}</p>
                    <p className="mt-1 text-xs text-white/58">{translate(primaryProject.type)} · {primaryProject.id}</p>
                  </div>
                  <Badge tone="blue">{primaryProject.score}%</Badge>
                </div>
                <div className="mt-4"><ProgressBar value={primaryProject.score} label={translate("Project progress")} /></div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <ProjectHeroMeta label={translate("Owner")} value={demoCompany.name} />
                  <ProjectHeroMeta label={translate("Team")} value={`${demoUsers.length}`} />
                  <ProjectHeroMeta label={translate("Budget")} value={primaryProject.budget} />
                  <ProjectHeroMeta label={translate("Timeline")} value={translate(primaryProject.phase)} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/projects/${primaryProject.id}`}><Button size="sm">{translate("Open Workspace")}</Button></Link>
                  <Link href="/tools"><Button size="sm" variant="secondary">{translate("Ask VORA")}</Button></Link>
                </div>
              </>
            ) : (
              <p className="text-sm font-bold text-ds-text/62">{translate("No production projects available yet.")}</p>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function ProjectHeroMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-ds-sm border border-white/10 bg-white/[0.045] px-3 py-2">
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-white/42">{label}</p>
      <p className="mt-1 truncate font-bold text-white/88">{value}</p>
    </div>
  );
}

function KpiCard({ item }: { item: { label: string; value: string; delta: string; tone: "gold" | "blue" | "success" | "warning" | "danger" | "neutral"; icon: React.ComponentType<{ className?: string }> } }) {
  const Icon = item.icon;
  const { translate } = useI18n();
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
      <GlassCard className="group p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-ds-md border border-ds-token-gold/18 bg-ds-token-gold/10 text-ds-token-gold transition-transform duration-ds-base group-hover:scale-105">
            <Icon className="h-5 w-5" />
          </span>
          <Badge tone={item.tone}>{translate(item.delta)}</Badge>
        </div>
        <p className="mt-4 text-3xl font-black text-ds-token-text">{item.value}</p>
        <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-ds-text/46">{translate(item.label)}</p>
      </GlassCard>
    </motion.div>
  );
}

function QuickActions() {
  const { translate } = useI18n();
  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge tone="blue">{translate("Quick Actions")}</Badge>
          <h2 className="mt-2 text-2xl font-black text-white">{translate("Command shortcuts")}</h2>
        </div>
        <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-black/24 px-4 py-3 md:flex">
          <Search className="h-4 w-4 text-gold" />
          <span className="text-sm font-bold text-ds-text/44">{translate("Search Atlas workspace...")}</span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href} className="group rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37]/28 hover:bg-white/[0.07] hover:shadow-ds-md">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#D4AF37]/16 bg-[#D4AF37]/12 text-gold transition group-hover:-rotate-6">
                <Icon className="h-5 w-5" />
              </span>
              <span className="mt-4 block font-black text-white">{translate(action.label)}</span>
              <span className="mt-1 block text-xs leading-5 text-ds-text/46">{translate(action.text)}</span>
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}

function RfqDashboardWidget({ state }: { state: ReturnType<typeof useRfqSummary> }) {
  const { locale, translate } = useI18n();
  const summaryCards = [
    { label: "Draft", value: state.data.draft, tone: "warning" as const },
    { label: "Open", value: state.data.published, tone: "success" as const },
    { label: "Pending", value: state.data.pendingResponses, tone: "blue" as const },
    { label: "Review", value: state.data.underReview, tone: "gold" as const },
    { label: "Awarded", value: state.data.awarded, tone: "success" as const },
    { label: "Closed", value: state.data.closed, tone: "neutral" as const }
  ];

  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge tone="gold">{translate("RFQ Management")}</Badge>
          <h2 className="mt-2 text-2xl font-black text-white">{translate("Procurement quotation center")}</h2>
          <p className="mt-2 text-sm leading-6 text-ds-text/52">{translate("Track supplier quotation workflows connected to projects and the Marketplace.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={state.source === "supabase" ? "success" : state.isFallback ? "warning" : "neutral"}>{translate(state.source === "supabase" ? "Supabase" : state.isFallback ? "Demo fallback" : "Demo")}</Badge>
          <Link href="/rfq"><Button variant="secondary" icon={<FileSearch className="h-4 w-4" />}>{translate("Open RFQs")}</Button></Link>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
            <Badge tone={card.tone}>{translate(card.label)}</Badge>
            <p className="mt-3 text-2xl font-black text-white">{state.loading ? "..." : card.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {(state.data.upcomingDeadlines.length ? state.data.upcomingDeadlines : []).slice(0, 2).map((rfq) => (
          <Link key={rfq.id} href={`/rfq/${rfq.id}`} className="rounded-2xl border border-white/10 bg-black/18 p-4 transition hover:border-[#D4AF37]/30">
            <p className="font-black text-white">{rfq.title}</p>
            <p className="mt-1 text-sm text-ds-text/48">{rfq.id} · {translate("due")} {localizeDemoDate(rfq.dueDate, locale, translate)}</p>
          </Link>
        ))}
      </div>
      {state.error && state.isFallback && <p className="mt-4 text-sm font-bold text-warning">{translate("RFQ production data is unavailable, so dashboard widgets are using demo fallback data.")}</p>}
    </GlassCard>
  );
}

function QuotationDashboardWidget({ state }: { state: ReturnType<typeof useQuotationDashboard> }) {
  const { translate } = useI18n();
  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge tone="blue">{translate("Quotation Intelligence")}</Badge>
          <h2 className="mt-2 text-2xl font-black text-white">{translate("Supplier offer comparison")}</h2>
          <p className="mt-2 text-sm leading-6 text-ds-text/52">{translate("Review pending quotations, best offers, and VORA award recommendations.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={state.source === "supabase" ? "success" : state.isFallback ? "warning" : "neutral"}>{translate(state.source === "supabase" ? "Supabase" : state.isFallback ? "Demo fallback" : "Demo")}</Badge>
          <Link href="/quotations/compare"><Button variant="secondary" icon={<ReceiptText className="h-4 w-4" />}>{translate("Compare")}</Button></Link>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
          <Badge tone="warning">{translate("Pending")}</Badge>
          <p className="mt-3 text-2xl font-black text-white">{state.loading ? "..." : state.data.pending}</p>
        </div>
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
          <Badge tone="success">{translate("Compared")}</Badge>
          <p className="mt-3 text-2xl font-black text-white">{state.loading ? "..." : state.data.compared}</p>
        </div>
        {state.data.awardRecommendations.slice(0, 2).map((recommendation) => (
          <Link key={recommendation.type} href={`/quotations/${recommendation.quotationId}`} className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4 transition hover:border-[#D4AF37]/30">
            <Badge tone="gold">{translate(recommendation.type)}</Badge>
            <p className="mt-3 truncate text-lg font-black text-white">{recommendation.supplierName}</p>
            <p className="mt-1 text-xs text-ds-text/46">{translate("Score")} {recommendation.score}</p>
          </Link>
        ))}
      </div>
      {state.error && state.isFallback && <p className="mt-4 text-sm font-bold text-warning">{translate("Quotation production data is unavailable, so dashboard widgets are using demo fallback data.")}</p>}
    </GlassCard>
  );
}

function ContractDashboardWidget({ state }: { state: ReturnType<typeof useContractSummary> }) {
  const { locale, translate } = useI18n();
  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge tone="gold">{translate("Contract & Award Management")}</Badge>
          <h2 className="mt-2 text-2xl font-black text-white">{translate("Post-award controls")}</h2>
          <p className="mt-2 text-sm leading-6 text-ds-text/52">{translate("Track active contracts, approvals, milestone obligations, payment events, and VORA risk indicators.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={state.source === "supabase" ? "success" : state.isFallback ? "warning" : "neutral"}>{translate(state.source === "supabase" ? "Supabase" : state.isFallback ? "Demo fallback" : "Demo")}</Badge>
          <Link href="/contracts"><Button variant="secondary" icon={<FileSignature className="h-4 w-4" />}>{translate("Open Contracts")}</Button></Link>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
          <Badge tone="success">{translate("Active")}</Badge>
          <p className="mt-3 text-2xl font-black text-white">{state.loading ? "..." : state.data.active}</p>
        </div>
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
          <Badge tone="warning">{translate("Approvals")}</Badge>
          <p className="mt-3 text-2xl font-black text-white">{state.loading ? "..." : state.data.awaitingApproval}</p>
        </div>
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
          <Badge tone="blue">{translate("Milestones")}</Badge>
          <p className="mt-3 text-2xl font-black text-white">{state.loading ? "..." : state.data.upcomingMilestones.length}</p>
        </div>
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
          <Badge tone="gold">{translate("Payments")}</Badge>
          <p className="mt-3 text-2xl font-black text-white">{state.loading ? "..." : state.data.upcomingPayments.length}</p>
        </div>
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
          <Badge tone="danger">{translate("Risks")}</Badge>
          <p className="mt-3 text-2xl font-black text-white">{state.loading ? "..." : state.data.riskIndicators.length}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {state.data.recentAwards.slice(0, 2).map((award) => (
          <Link key={award.id} href={`/contracts/${award.contractId}`} className="rounded-2xl border border-white/10 bg-black/18 p-4 transition hover:border-[#D4AF37]/30">
            <p className="font-black text-white">{award.supplierName}</p>
            <p className="mt-1 text-sm text-ds-text/48">{award.rfqId} · {new Intl.NumberFormat(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-US", { style: "currency", currency: award.currency, maximumFractionDigits: 0 }).format(award.awardValue)}</p>
          </Link>
        ))}
      </div>
      {state.error && state.isFallback && <p className="mt-4 text-sm font-bold text-warning">{translate("Contract production data is unavailable, so dashboard widgets are using demo fallback data.")}</p>}
    </GlassCard>
  );
}

function NotificationDashboardWidget({ state }: { state: ReturnType<typeof useNotificationSummary> }) {
  const { translate } = useI18n();
  const cards = [
    { label: "Unread", value: state.data.unread, tone: "gold" as const },
    { label: "Critical", value: state.data.critical, tone: "danger" as const },
    { label: "Reminders", value: state.data.reminders, tone: "warning" as const },
    { label: "AI Alerts", value: state.data.aiAlerts, tone: "blue" as const }
  ];

  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge tone="gold">{translate("Notification Center")}</Badge>
          <h2 className="mt-2 text-2xl font-black text-white">{translate("Enterprise alerts")}</h2>
          <p className="mt-2 text-sm leading-6 text-ds-text/52">{translate("Unified risk, deadline, approval, document, marketplace, and VORA intelligence signals.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={state.source === "supabase" ? "success" : state.isFallback ? "warning" : "neutral"}>{translate(state.source === "supabase" ? "Supabase" : state.isFallback ? "Demo fallback" : "Demo")}</Badge>
          <Link href="/notifications"><Button variant="secondary" icon={<Bell className="h-4 w-4" />}>{translate("Open Notifications")}</Button></Link>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
            <Badge tone={card.tone}>{translate(card.label)}</Badge>
            <p className="mt-3 text-2xl font-black text-white">{state.loading ? "..." : card.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {state.data.recent.slice(0, 2).map((item) => (
          <Link key={item.id} href={item.href || item.actionHref || "/notifications"} className="rounded-2xl border border-white/10 bg-black/18 p-4 transition hover:border-[#D4AF37]/30">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-black text-white">{translate(item.title)}</p>
              <Badge tone={item.priority === "Critical" ? "danger" : item.priority === "High" ? "warning" : "neutral"}>{translate(item.priority)}</Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-ds-text/52">{translate(item.message)}</p>
          </Link>
        ))}
      </div>
      {state.error && state.isFallback && <p className="mt-4 text-sm font-bold text-warning">{translate("Notification production data is unavailable, so dashboard widgets are using demo fallback data.")}</p>}
    </GlassCard>
  );
}

function BillingDashboardWidget({ state }: { state: ReturnType<typeof useBillingSummary> }) {
  const { locale, translate } = useI18n();
  const aiUsage = state.data.usage.find((item) => item.metric === "ai_requests");
  const storageUsage = state.data.usage.find((item) => item.metric === "storage");
  const aiPercent = aiUsage && aiUsage.limit !== "unlimited" ? Math.round((aiUsage.used / Number(aiUsage.limit)) * 100) : 0;
  const storagePercent = storageUsage && storageUsage.limit !== "unlimited" ? Math.round((storageUsage.used / Number(storageUsage.limit)) * 100) : 0;

  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge tone="gold">{translate("Billing")}</Badge>
          <h2 className="mt-2 text-2xl font-black text-white">{translate("Subscription health")}</h2>
          <p className="mt-2 text-sm leading-6 text-ds-text/52">{translate("Plan limits, trial status, AI usage, storage, and renewal readiness.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={state.source === "supabase" ? "success" : state.isFallback ? "warning" : "neutral"}>{translate(state.source === "supabase" ? "Supabase" : state.isFallback ? "Demo fallback" : "Demo")}</Badge>
          <Link href="/billing"><Button variant="secondary" icon={<CreditCard className="h-4 w-4" />}>{translate("Open Billing")}</Button></Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[.75fr_1fr_1fr]">
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
          <Badge tone="success">{translate(state.data.subscription.status)}</Badge>
          <p className="mt-3 text-2xl font-black text-white">{state.loading ? "..." : translate(state.data.plan.name)}</p>
          <p className="mt-1 text-xs font-bold text-ds-text/46">{translate("Trial")} {translate(state.data.trialStatus)}</p>
        </div>
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
          <ProgressBar value={aiPercent} label={translate("AI request usage")} tone="blue" />
          <p className="mt-3 text-xs font-bold text-ds-text/46">{aiUsage ? `${aiUsage.used} ${translate("of")} ${aiUsage.limit}` : translate("No AI usage")}</p>
        </div>
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
          <ProgressBar value={storagePercent} label={translate("Storage usage")} tone="gold" />
          <p className="mt-3 text-xs font-bold text-ds-text/46">{translate("Renewal")} {state.data.renewalDate ? new Date(state.data.renewalDate).toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-FR" : "en-GB") : translate("manual")}</p>
        </div>
      </div>
    </GlassCard>
  );
}

function AdminDashboardWidget({ state }: { state: ReturnType<typeof useAdminDashboard> }) {
  const { translate } = useI18n();
  const metrics = state.data.metrics;
  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge tone="gold">{translate("Administration")}</Badge>
          <h2 className="mt-2 text-2xl font-black text-white">{translate("Platform operations")}</h2>
          <p className="mt-2 text-sm leading-6 text-ds-text/52">{translate("Admin foundation for users, organizations, subscriptions, audit logs, AI usage, and system configuration.")}</p>
        </div>
        <Link href="/admin"><Button variant="secondary" icon={<ShieldCheck className="h-4 w-4" />}>{translate("Open Admin")}</Button></Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Users", metrics.totalUsers],
          ["Organizations", metrics.activeOrganizations],
          ["Revenue", `${metrics.revenue} ${metrics.currency}`],
          ["Health", state.data.health.status]
        ].map(([label, value]) => (
          <div key={label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-ds-text/40">{translate(String(label))}</p>
            <p className="mt-2 text-xl font-black text-white">{state.loading ? "..." : translate(String(value))}</p>
          </div>
        ))}
      </div>
      {state.error && state.isFallback && <p className="mt-4 text-sm font-bold text-warning">{translate("Admin production views are unavailable, so the widget is using demo fallback data.")}</p>}
    </GlassCard>
  );
}

function MarketplaceDashboardWidgets({ state }: { state: ReturnType<typeof useMarketplaceDashboard> }) {
  const { translate } = useI18n();
  const widgets = [
    { label: "Recently Added", items: state.data.recentlyAdded, tone: "blue" as const },
    { label: "Top Rated", items: state.data.topRated, tone: "gold" as const },
    { label: "Verified Companies", items: state.data.verifiedCompanies, tone: "success" as const },
    { label: "Nearby Companies", items: state.data.nearbyCompanies, tone: "neutral" as const },
    { label: "Recommended Partners", items: state.data.recommendedPartners, tone: "warning" as const }
  ];

  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge tone="gold">{translate("Marketplace")}</Badge>
          <h2 className="mt-2 text-2xl font-black text-white">{translate("Construction partner network")}</h2>
          <p className="mt-2 text-sm leading-6 text-ds-text/52">{translate("Discover suppliers, contractors, consultants, and engineering offices for Atlas projects.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={state.source === "supabase" ? "success" : state.isFallback ? "warning" : "neutral"}>
            {translate(state.source === "supabase" ? "Supabase" : state.isFallback ? "Demo fallback" : "Demo")}
          </Badge>
          <Link href="/marketplace">
            <Button variant="secondary" icon={<Store className="h-4 w-4" />}>{translate("Open Marketplace")}</Button>
          </Link>
        </div>
      </div>
      {state.loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : (
        <div className="space-y-4">
          {state.data.kpis && (
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {[
                ["Companies", state.data.kpis.companies],
                ["Connections", state.data.kpis.connections],
                ["Favorites", state.data.kpis.favorites],
                ["Messages", state.data.kpis.messages],
                ["Reviews", state.data.kpis.reviews],
                ["Verified", state.data.kpis.verifiedCompanies]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/18 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{translate(String(label))}</p>
                  <p className="mt-2 text-xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {widgets.map((widget) => {
            const company = widget.items[0];
            return (
              <Link key={widget.label} href={company ? `/marketplace/${company.slug}` : "/marketplace"} className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-1 hover:border-[#D4AF37]/30 hover:bg-white/[0.07]">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone={widget.tone}>{translate(widget.label)}</Badge>
                  <Store className="h-5 w-5 text-gold" />
                </div>
                {company ? (
                  <>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#D4AF37]/12 text-xs font-black text-gold shadow-gold-glow">{company.logo}</span>
                      <div className="min-w-0">
                        <p className="truncate font-black text-white">{company.name}</p>
                        <p className="truncate text-xs text-ds-text/44">{translate(company.category)} · {company.city}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-1 font-black text-gold"><Star className="h-4 w-4 fill-current" />{company.rating}</span>
                      <span className="font-bold text-ds-text/46">{translate(company.responseTime)}</span>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-ds-text/50">{translate("No companies available yet.")}</p>
                )}
              </Link>
            );
          })}
          </div>
        </div>
      )}
      {state.error && state.isFallback && <p className="mt-4 text-sm font-bold text-warning">{translate("Marketplace production data is unavailable, so dashboard widgets are using demo fallback data.")}</p>}
    </GlassCard>
  );
}

function RecentProjects({ projects, loading }: { projects: ReturnType<typeof projectRepository.list>; loading: boolean }) {
  const { translate } = useI18n();
  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <Badge tone="gold">{translate("Recent Projects")}</Badge>
          <h2 className="mt-2 text-2xl font-black text-white">{translate("Atlas project portfolio")}</h2>
        </div>
        <Link href="/projects" className="text-sm font-black text-gold">{translate("View all")}</Link>
      </div>
      <div className="grid gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : projects.length ? projects.slice(0, 3).map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className="group rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-1 hover:border-[#D4AF37]/28 hover:bg-white/[0.065]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="blue">{translate(project.type)}</Badge>
                  <Badge tone={project.score > 60 ? "success" : project.score > 40 ? "warning" : "neutral"}>{translate(project.phase)}</Badge>
                </div>
                <h3 className="mt-3 text-xl font-black text-white">{project.title}</h3>
                <p className="mt-1 text-sm font-bold text-ds-text/46">{project.id} · {translate(project.status)} · {project.budget}</p>
              </div>
              <div className="w-full md:w-52">
                <ProgressBar value={project.score} label={translate("Progress")} />
              </div>
            </div>
          </Link>
        )) : (
          <EmptyState title={translate("No projects yet")} description={translate("Production projects will appear here when they are available for your account.")} />
        )}
      </div>
    </GlassCard>
  );
}

function WorkspaceFeed() {
  const { translate } = useI18n();
  return (
    <div className="grid gap-6">
      <GlassCard className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">{translate("Recent Documents")}</h2>
          <FileText className="h-6 w-6 text-gold" />
        </div>
        <div className="grid gap-3">
          {["Weekly Executive Report.pdf", "Procurement Matrix.xlsx", "Permit Readiness Memo.docx"].map((doc) => (
            <div key={doc} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/18 p-3">
              <FileText className="h-5 w-5 text-gold" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-white">{doc}</p>
                <p className="text-xs font-bold text-ds-text/42">{translate("Atlas document · updated today")}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">{translate("Upcoming Milestones")}</h2>
          <CalendarClock className="h-6 w-6 text-blue" />
        </div>
        <div className="grid gap-3">
          {milestones.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-white">{translate(item.title)}</p>
                <Badge tone={item.status === "Critical" ? "warning" : "neutral"}>{translate(item.status)}</Badge>
              </div>
              <p className="mt-2 text-sm text-ds-text/46">{translate(item.date)}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function RightCommandSidebar() {
  const { translate } = useI18n();
  return (
    <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
      <GlassCard className="p-5">
        <div className="flex items-start gap-4">
          <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
          <div>
            <Badge tone="blue">{translate("VORA Recommendations")}</Badge>
            <h2 className="mt-3 text-xl font-black text-white">{translate("Portfolio action")}</h2>
          </div>
        </div>
        <p className="mt-5 text-sm leading-7 text-ds-text/62">
          {translate("Prioritize Rabat permit blockers and Tangier steel award before generating the weekly CEO briefing.")}
        </p>
        <Link href="/tools/document" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#F9E7A0] via-[#D4AF37] to-[#916B14] px-4 py-3 font-black text-black shadow-gold-glow">
          {translate("Generate briefing")}
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </GlassCard>

      <GlassCard className="p-5">
        <Badge tone="gold">{translate("Today's Agenda")}</Badge>
        <div className="mt-5 grid gap-4">
          <TimelineCard index={1} title={translate("09:30 · Villa site inspection")} text={translate("Structural progress and waterproofing review.")} icon={<CalendarDays className="h-4 w-4" />} />
          <TimelineCard index={2} title={translate("12:00 · Finance review")} text={translate("Portfolio budget health and variance check.")} icon={<CircleDollarSign className="h-4 w-4" />} />
          <TimelineCard index={3} title={translate("16:00 · VORA briefing")} text={translate("Generate executive update for Atlas leadership.")} icon={<Bot className="h-4 w-4" />} />
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <Badge tone="warning">{translate("AI Alerts")}</Badge>
          <Bell className="h-5 w-5 text-warning" />
        </div>
        <div className="grid gap-3">
          {notifications.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
              <Badge tone={item.unread ? "warning" : "neutral"}>{translate(item.title)}</Badge>
              <p className="mt-2 text-sm leading-6 text-ds-text/58">{translate(item.text)}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </aside>
  );
}

function BottomPerformance({ analytics, loading }: { analytics?: NonNullable<ReturnType<typeof useAnalyticsSummary>["data"]>; loading: boolean }) {
  const { translate } = useI18n();
  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
      <GlassCard className="p-5">
        <Badge tone="gold">{translate("Performance Overview")}</Badge>
        <h2 className="mt-3 text-2xl font-black text-white">{translate("Atlas delivery health")}</h2>
        <div className="mt-5 space-y-4">
          {loading || !analytics ? (
            <SkeletonCard />
          ) : (
            <>
              <ProgressBar value={analytics.projectHealth.value} label={translate("Project health")} />
              <ProgressBar value={analytics.timelineHealth.value} label={translate("Timeline health")} tone="blue" />
              <ProgressBar value={analytics.budgetHealth.value} label={translate("Budget health")} tone="success" />
            </>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <Badge tone="success">{translate("Recent Activity")}</Badge>
        <div className="mt-5 grid gap-3">
          {recentActivity.slice(0, 3).map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-gold" />
                  <div>
                    <p className="font-black text-white">{translate(item.title)}</p>
                    <p className="mt-1 text-xs text-ds-text/46">{translate(item.detail)} · {translate(item.time)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <Badge tone="neutral">{translate("Recent AI Insights")}</Badge>
        <div className="mt-5 grid gap-3">
          {(analytics?.recentAiInsights || savedGenerations.map((item) => `${item.title} · ${item.tool}`)).slice(0, 3).map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
              <p className="font-black text-white">{item}</p>
              <p className="mt-1 text-xs text-ds-text/46">{translate("VORA analytics")}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <EmptyState title={translate("Knowledge ready")} description={translate("Atlas demo files and AI outputs are prepared for investor walkthroughs.")} />
        </div>
      </GlassCard>
    </section>
  );
}

function HeaderMeta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { translate } = useI18n();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-center gap-2 text-gold">{icon}<span className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/44">{translate(label)}</span></div>
      <p className="mt-2 truncate font-black text-white">{translate(value)}</p>
    </div>
  );
}
