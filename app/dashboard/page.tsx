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
        missionSummary={translate(isEngineer ? "Review technical priorities, drawings, inspections, and decisions affecting deli×nüêÚ$z{-®éÜj×FRæÆöF–ærò"âââ"¢G&ç6ÆFR…7G&–ær‡fÇVR’—ÓÂ÷à¢ÂöF—cà¢’—Ð¢ÂöF—cà¢·7FFRæW'&÷"bb7FFRæ—4fÆÆ&6²bbÇ6Æ74æÖSÒ&×BÓBFW‡B×6ÒföçBÖ&öÆBFW‡B×v&æ–ær#ç·G&ç6ÆFR‚$FÖ–â&öGV7F–öâf–Ww2&RVæf–Æ&ÆRÂ6òF†Rv–FvWB—2W6–ærFVÖòfÆÆ&6²FFâ"—ÓÂ÷çÐ¢ÂôvÆ746&Cà¢“°§Ð ¦gVæ7F–öâÖ&¶WGÆ6TF6†&ö&Ev–FvWG2‡²7FFRÓ¢²7FFS¢&WGW&åG—SÇG—VöbW6TÖ&¶WGÆ6TF6†&ö&CâÒ’°¢6öç7B²G&ç6ÆFRÒÒW6T“†â‚“°¢6öç7Bv–FvWG2Ò°¢²Æ&VÃ¢%&V6VçFÇ’FFVB"Â—FV×3¢7FFRæFFç&V6VçFÇ”FFVBÂFöæS¢&&ÇVR"26öç7BÒÀ¢²Æ&VÃ¢%F÷&FVB"Â—FV×3¢7FFRæFFçF÷&FVBÂFöæS¢&vöÆB"26öç7BÒÀ¢²Æ&VÃ¢%fW&–f–VB6ö×æ–W2"Â—FV×3¢7FFRæFFçfW&–f–VD6ö×æ–W2ÂFöæS¢'7V66W72"26öç7BÒÀ¢²Æ&VÃ¢$æV&'’6ö×æ–W2"Â—FV×3¢7FFRæFFææV&'”6ö×æ–W2ÂFöæS¢&æWWG&Â"26öç7BÒÀ¢²Æ&VÃ¢%&V6öÖÖVæFVB'FæW'2"Â—FV×3¢7FFRæFFç&V6öÖÖVæFVE'FæW'2ÂFöæS¢'v&æ–ær"26öç7BÐ¢Ó° ¢&WGW&â€¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢ÆF—b6Æ74æÖSÒ&Ö"ÓRfÆW‚fÆW‚Ö6öÂvÓ26Ó¦fÆW‚×&÷r6Ó¦—FV×2Ö6VçFW"6Ó¦§W7F–g’Ö&WGvVVâ#à¢ÆF—cà¢Ä&FvRFöæSÒ&vöÆB#ç·G&ç6ÆFR‚$Ö&¶WGÆ6R"—ÓÂô&FvSà¢Æƒ"6Æ74æÖSÒ&×BÓ"FW‡BÓ'†ÂföçBÖ&Æ6²FW‡B×v†—FR#ç·G&ç6ÆFR‚$6öç7G'V7F–öâ'FæW"æWGv÷&²"—ÓÂöƒ#à¢Ç6Æ74æÖSÒ&×BÓ"FW‡B×6ÒÆVF–ærÓbFW‡BÖG2×FW‡BóS"#ç·G&ç6ÆFR‚$F—66÷fW"7WÆ–W'2Â6öçG&7F÷'2Â6öç7VÇFçG2ÂæBVæv–æVW&–æröff–6W2f÷"FÆ2&ö¦V7G2â"—ÓÂ÷à¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ&fÆW‚fÆW‚×w&vÓ"#à¢Ä&FvRFöæS×·7FFRç6÷W&6RÓÓÒ'7W&6R"ò'7V66W72"¢7FFRæ—4fÆÆ&6²ò'v&æ–ær"¢&æWWG&Â'Óà¢·G&ç6ÆFR‡7FFRç6÷W&6RÓÓÒ'7W&6R"ò%7W&6R"¢7FFRæ—4fÆÆ&6²ò$FVÖòfÆÆ&6²"¢$FVÖò"—Ð¢Âô&FvSà¢ÄÆ–æ²‡&VcÒ"öÖ&¶WGÆ6R#à¢Ä'WGFöâf&–çCÒ'6V6öæF'’"–6öã×³Å7F÷&R6Æ74æÖSÒ&‚ÓBrÓB"óçÓç·G&ç6ÆFR‚$÷VâÖ&¶WGÆ6R"—ÓÂô'WGFöãà¢ÂôÆ–æ³à¢ÂöF—cà¢ÂöF—cà¢·7FFRæÆöF–ærò€¢ÆF—b6Æ74æÖSÒ&w&–BvÓ2ÖC¦w&–BÖ6öÇ2Ó"†Ã¦w&–BÖ6öÇ2ÓR#à¢´'&’æg&öÒ‡²ÆVæwFƒ¢RÒ’æÖ‚…òÂ–æFW‚’ÓâÅ6¶VÆWFöä6&B¶W“×¶–æFW‡Òóâ—Ð¢ÂöF—cà¢’¢€¢ÆF—b6Æ74æÖSÒ'76R×’ÓB#à¢·7FFRæFFæ·—2bb€¢ÆF—b6Æ74æÖSÒ&w&–BvÓ2ÖC¦w&–BÖ6öÇ2Ó2†Ã¦w&–BÖ6öÇ2Ób#à¢µ°¢²$6ö×æ–W2"Â7FFRæFFæ·—2æ6ö×æ–W5ÒÀ¢²$6öææV7F–öç2"Â7FFRæFFæ·—2æ6öææV7F–öç5ÒÀ¢²$ff÷&—FW2"Â7FFRæFFæ·—2æff÷&—FW5ÒÀ¢²$ÖW76vW2"Â7FFRæFFæ·—2æÖW76vW5ÒÀ¢²%&Wf–Ww2"Â7FFRæFFæ·—2ç&Wf–Ww5ÒÀ¢²%fW&–f–VB"Â7FFRæFFæ·—2çfW&–f–VD6ö×æ–W5Ð¢ÒæÖ‚…¶Æ&VÂÂfÇVUÒ’Óâ€¢ÆF—b¶W“×¶Æ&VÇÒ6Æ74æÖSÒ'&÷VæFVBÓ'†Â&÷&FW"&÷&FW"×v†—FRó&rÖ&Æ6²ó‚Ó2#à¢Ç6Æ74æÖSÒ'FW‡B×‡2föçBÖ&Æ6²WW&66RG&6¶–ærÕ³ãVÕÒFW‡BÖG2×FW‡BóC"#ç·G&ç6ÆFR…7G&–ær†Æ&VÂ’—ÓÂ÷à¢Ç6Æ74æÖSÒ&×BÓ"FW‡B×†ÂföçBÖ&Æ6²FW‡B×v†—FR#ç·fÇVWÓÂ÷à¢ÂöF—cà¢’—Ð¢ÂöF—cà¢—Ð¢ÆF—b6Æ74æÖSÒ&w&–BvÓ2ÖC¦w&–BÖ6öÇ2Ó"†Ã¦w&–BÖ6öÇ2ÓR#à¢·v–FvWG2æÖ‚‡v–FvWB’Óâ°¢6öç7B6ö×ç’Òv–FvWBæ—FV×5³Ó°¢&WGW&â€¢ÄÆ–æ²¶W“×·v–FvWBæÆ&VÇÒ‡&Vc×¶6ö×ç’òöÖ&¶WGÆ6RòG¶6ö×ç’ç6ÇVwÖ¢"öÖ&¶WGÆ6R'Ò6Æ74æÖSÒ'&÷VæFVBÕ³ãW&VÕÒ&÷&FW"&÷&FW"×v†—FRó&r×v†—FRõ³ãCUÒÓBG&ç6—F–öâ†÷fW#¢×G&ç6ÆFR×’Ó†÷fW#¦&÷&FW"Õ²4CDc3uÒó3†÷fW#¦&r×v†—FRõ³ãuÒ#à¢ÆF—b6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"§W7F–g’Ö&WGvVVâvÓ2#à¢Ä&FvRFöæS×·v–FvWBçFöæWÓç·G&ç6ÆFR‡v–FvWBæÆ&VÂ—ÓÂô&FvSà¢Å7F÷&R6Æ74æÖSÒ&‚ÓRrÓRFW‡BÖvöÆB"óà¢ÂöF—cà¢¶6ö×ç’ò€¢Ãà¢ÆF—b6Æ74æÖSÒ&×BÓBfÆW‚—FV×2Ö6VçFW"vÓ2#à¢Ç7â6Æ74æÖSÒ&w&–B‚ÓrÓ6‡&–æ²ÓÆ6RÖ—FV×2Ö6VçFW"&÷VæFVBÓ'†Â&rÕ²4CDc3uÒó"FW‡B×‡2föçBÖ&Æ6²FW‡BÖvöÆB6†F÷rÖvöÆBÖvÆ÷r#ç¶6ö×ç’æÆöv÷ÓÂ÷7ãà¢ÆF—b6Æ74æÖSÒ&Ö–â×rÓ#à¢Ç6Æ74æÖSÒ'G'Væ6FRföçBÖ&Æ6²FW‡B×v†—FR#ç¶6ö×ç’ææÖWÓÂ÷à¢Ç6Æ74æÖSÒ'G'Væ6FRFW‡B×‡2FW‡BÖG2×FW‡BóCB#ç·G&ç6ÆFR†6ö×ç’æ6FVv÷'’—Ò+r¶6ö×ç’æ6—G—ÓÂ÷à¢ÂöF—cà¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ&×BÓBfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö&WGvVVâFW‡B×6Ò#à¢Ç7â6Æ74æÖSÒ&–æÆ–æRÖfÆW‚—FV×2Ö6VçFW"vÓföçBÖ&Æ6²FW‡BÖvöÆB#ãÅ7F"6Æ74æÖSÒ&‚ÓBrÓBf–ÆÂÖ7W'&VçB"óç¶6ö×ç’ç&F–æwÓÂ÷7ãà¢Ç7â6Æ74æÖSÒ&föçBÖ&öÆBFW‡BÖG2×FW‡BóCb#ç·G&ç6ÆFR†6ö×ç’ç&W7öç6UF–ÖR—ÓÂ÷7ãà¢ÂöF—cà¢Âóà¢’¢€¢Ç6Æ74æÖSÒ&×BÓBFW‡B×6ÒÆVF–ærÓbFW‡BÖG2×FW‡BóS#ç·G&ç6ÆFR‚$æò6ö×æ–W2f–Æ&ÆR–WBâ"—ÓÂ÷à¢—Ð¢ÂôÆ–æ³à¢“°¢Ò—Ð¢ÂöF—cà¢ÂöF—cà¢—Ð¢·7FFRæW'&÷"bb7FFRæ—4fÆÆ&6²bbÇ6Æ74æÖSÒ&×BÓBFW‡B×6ÒföçBÖ&öÆBFW‡B×v&æ–ær#ç·G&ç6ÆFR‚$Ö&¶WGÆ6R&öGV7F–öâFF—2Væf–Æ&ÆRÂ6òF6†&ö&Bv–FvWG2&RW6–ærFVÖòfÆÆ&6²FFâ"—ÓÂ÷çÐ¢ÂôvÆ746&Cà¢“°§Ð ¦gVæ7F–öâ&V6VçE&ö¦V7G2‡²&ö¦V7G2ÂÆöF–ærÓ¢²&ö¦V7G3¢&WGW&åG—SÇG—Vöb&ö¦V7E&W÷6—F÷'’æÆ—7Cã²ÆöF–æs¢&ööÆVâÒ’°¢6öç7B²G&ç6ÆFRÒÒW6T“†â‚“°¢&WGW&â€¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢ÆF—b6Æ74æÖSÒ&Ö"ÓRfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö&WGvVVâvÓ2#à¢ÆF—cà¢Ä&FvRFöæSÒ&vöÆB#ç·G&ç6ÆFR‚%&V6VçB&ö¦V7G2"—ÓÂô&FvSà¢Æƒ"6Æ74æÖSÒ&×BÓ"FW‡BÓ'†ÂföçBÖ&Æ6²FW‡B×v†—FR#ç·G&ç6ÆFR‚$FÆ2&ö¦V7B÷'FföÆ–ò"—ÓÂöƒ#à¢ÂöF—cà¢ÄÆ–æ²‡&VcÒ"÷&ö¦V7G2"6Æ74æÖSÒ'FW‡B×6ÒföçBÖ&Æ6²FW‡BÖvöÆB#ç·G&ç6ÆFR‚%f–WrÆÂ"—ÓÂôÆ–æ³à¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ&w&–BvÓB#à¢¶ÆöF–ærò€¢Ãà¢Å6¶VÆWFöä6&Bóà¢Å6¶VÆWFöä6&Bóà¢Âóà¢’¢&ö¦V7G2æÆVæwF‚ò&ö¦V7G2ç6Æ–6RƒÂ2’æÖ‚‡&ö¦V7B’Óâ€¢ÄÆ–æ²¶W“×·&ö¦V7Bæ–GÒ‡&Vc×¶÷&ö¦V7G2òG·&ö¦V7Bæ–GÖÒ6Æ74æÖSÒ&w&÷W&÷VæFVBÕ³ãsW&VÕÒ&÷&FW"&÷&FW"×v†—FRó&r×v†—FRõ³ãCUÒÓBG&ç6—F–öâ†÷fW#¢×G&ç6ÆFR×’Ó†÷fW#¦&÷&FW"Õ²4CDc3uÒó#‚†÷fW#¦&r×v†—FRõ³ãcUÒ#à¢ÆF—b6Æ74æÖSÒ&fÆW‚fÆW‚Ö6öÂvÓBÖC¦fÆW‚×&÷rÖC¦—FV×2Ö6VçFW"ÖC¦§W7F–g’Ö&WGvVVâ#à¢ÆF—b6Æ74æÖSÒ&Ö–â×rÓ#à¢ÆF—b6Æ74æÖSÒ&fÆW‚fÆW‚×w&vÓ"#à¢Ä&FvRFöæSÒ&&ÇVR#ç·G&ç6ÆFR‡&ö¦V7BçG—R—ÓÂô&FvSà¢Ä&FvRFöæS×·&ö¦V7Bç66÷&Râcò'7V66W72"¢&ö¦V7Bç66÷&RâCò'v&æ–ær"¢&æWWG&Â'Óç·G&ç6ÆFR‡&ö¦V7Bç†6R—ÓÂô&FvSà¢ÂöF—cà¢Æƒ26Æ74æÖSÒ&×BÓ2FW‡B×†ÂföçBÖ&Æ6²FW‡B×v†—FR#ç·&ö¦V7BçF—FÆWÓÂöƒ3à¢Ç6Æ74æÖSÒ&×BÓFW‡B×6ÒföçBÖ&öÆBFW‡BÖG2×FW‡BóCb#ç·&ö¦V7Bæ–GÒ+r·G&ç6ÆFR‡&ö¦V7Bç7FGW2—Ò+r·&ö¦V7Bæ'VFvWGÓÂ÷à¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ'rÖgVÆÂÖC§rÓS"#à¢Å&öw&W74&"fÇVS×·&ö¦V7Bç66÷&WÒÆ&VÃ×·G&ç6ÆFR‚%&öw&W72"—Òóà¢ÂöF—cà¢ÂöF—cà¢ÂôÆ–æ³à¢’’¢€¢ÄV×G•7FFRF—FÆS×·G&ç6ÆFR‚$æò&ö¦V7G2–WB"—ÒFW67&—F–öã×·G&ç6ÆFR‚%&öGV7F–öâ&ö¦V7G2v–ÆÂV"†W&Rv†VâF†W’&Rf–Æ&ÆRf÷"–÷W"66÷VçBâ"—Òóà¢—Ð¢ÂöF—cà¢ÂôvÆ746&Cà¢“°§Ð ¦gVæ7F–öâv÷&·76TfVVB‚’°¢6öç7B²G&ç6ÆFRÒÒW6T“†â‚“°¢&WGW&â€¢ÆF—b6Æ74æÖSÒ&w&–BvÓb#à¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢ÆF—b6Æ74æÖSÒ&Ö"ÓRfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö&WGvVVâ#à¢Æƒ"6Æ74æÖSÒ'FW‡BÓ'†ÂföçBÖ&Æ6²FW‡B×v†—FR#ç·G&ç6ÆFR‚%&V6VçBFö7VÖVçG2"—ÓÂöƒ#à¢Äf–ÆUFW‡B6Æ74æÖSÒ&‚ÓbrÓbFW‡BÖvöÆB"óà¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ&w&–BvÓ2#à¢µ²%vVV¶Ç’W†V7WF—fR&W÷'BçFb"Â%&ö7W&VÖVçBÖG&—‚ç†Ç7‚"Â%W&Ö—B&VF–æW72ÖVÖòæFö7‚%ÒæÖ‚†Fö2’Óâ€¢ÆF—b¶W“×¶Fö7Ò6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"vÓ2&÷VæFVBÓ'†Â&÷&FW"&÷&FW"×v†—FRó&rÖ&Æ6²ó‚Ó2#à¢Äf–ÆUFW‡B6Æ74æÖSÒ&‚ÓRrÓRFW‡BÖvöÆB"óà¢ÆF—b6Æ74æÖSÒ&Ö–â×rÓfÆW‚Ó#à¢Ç6Æ74æÖSÒ'G'Væ6FRföçBÖ&Æ6²FW‡B×v†—FR#ç¶Fö7ÓÂ÷à¢Ç6Æ74æÖSÒ'FW‡B×‡2föçBÖ&öÆBFW‡BÖG2×FW‡BóC"#ç·G&ç6ÆFR‚$FÆ2Fö7VÖVçB+rWFFVBFöF’"—ÓÂ÷à¢ÂöF—cà¢ÂöF—cà¢’—Ð¢ÂöF—cà¢ÂôvÆ746&Cà ¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢ÆF—b6Æ74æÖSÒ&Ö"ÓRfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö&WGvVVâ#à¢Æƒ"6Æ74æÖSÒ'FW‡BÓ'†ÂföçBÖ&Æ6²FW‡B×v†—FR#ç·G&ç6ÆFR‚%W6öÖ–ærÖ–ÆW7FöæW2"—ÓÂöƒ#à¢Ä6ÆVæF$6Æö6²6Æ74æÖSÒ&‚ÓbrÓbFW‡BÖ&ÇVR"óà¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ&w&–BvÓ2#à¢¶Ö–ÆW7FöæW2æÖ‚†—FVÒ’Óâ€¢ÆF—b¶W“×¶—FVÒçF—FÆWÒ6Æ74æÖSÒ'&÷VæFVBÓ'†Â&÷&FW"&÷&FW"×v†—FRó&r×v†—FRõ³ãCUÒÓB#à¢ÆF—b6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"§W7F–g’Ö&WGvVVâvÓ2#à¢Ç6Æ74æÖSÒ&föçBÖ&Æ6²FW‡B×v†—FR#ç·G&ç6ÆFR†—FVÒçF—FÆR—ÓÂ÷à¢Ä&FvRFöæS×¶—FVÒç7FGW2ÓÓÒ$7&—F–6Â"ò'v&æ–ær"¢&æWWG&Â'Óç·G&ç6ÆFR†—FVÒç7FGW2—ÓÂô&FvSà¢ÂöF—cà¢Ç6Æ74æÖSÒ&×BÓ"FW‡B×6ÒFW‡BÖG2×FW‡BóCb#ç·G&ç6ÆFR†—FVÒæFFR—ÓÂ÷à¢ÂöF—cà¢’—Ð¢ÂöF—cà¢ÂôvÆ746&Cà¢ÂöF—cà¢“°§Ð ¦gVæ7F–öâ&–v‡D6öÖÖæE6–FV&"‚’°¢6öç7B²G&ç6ÆFRÒÒW6T“†â‚“°¢&WGW&â€¢Æ6–FR6Æ74æÖSÒ'76R×’Ób†Ã§7F–6·’†Ã§F÷Ó#‚†Ã§6VÆb×7F'B#à¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢ÆF—b6Æ74æÖSÒ&fÆW‚—FV×2×7F'BvÓB#à¢Åf÷&f—7VÂf&–çCÒ&fF""6Æ74æÖSÒ&‚ÓbrÓb&÷VæFVBÓ'†Â"6—¦W3Ò#cG‚"óà¢ÆF—cà¢Ä&FvRFöæSÒ&&ÇVR#ç·G&ç6ÆFR‚%dõ$&V6öÖÖVæFF–öç2"—ÓÂô&FvSà¢Æƒ"6Æ74æÖSÒ&×BÓ2FW‡B×†ÂföçBÖ&Æ6²FW‡B×v†—FR#ç·G&ç6ÆFR‚%÷'FföÆ–ò7F–öâ"—ÓÂöƒ#à¢ÂöF—cà¢ÂöF—cà¢Ç6Æ74æÖSÒ&×BÓRFW‡B×6ÒÆVF–ærÓrFW‡BÖG2×FW‡Bóc"#à¢·G&ç6ÆFR‚%&–÷&—F—¦R&&BW&Ö—B&Æö6¶W'2æBFæv–W"7FVVÂv&B&Vf÷&RvVæW&F–ærF†RvVV¶Ç’4Tò'&–Vf–ærâ"—Ð¢Â÷à¢ÄÆ–æ²‡&VcÒ"÷FööÇ2öFö7VÖVçB"6Æ74æÖSÒ&×BÓR–æÆ–æRÖfÆW‚rÖgVÆÂ—FV×2Ö6VçFW"§W7F–g’Ö6VçFW"vÓ"&÷VæFVBÓ'†Â&rÖw&F–VçB×FòÖÂg&öÒÕ²4c”StÒf–Õ²4CDc3uÒFòÕ²3“d#EÒ‚ÓB’Ó2föçBÖ&Æ6²FW‡BÖ&Æ6²6†F÷rÖvöÆBÖvÆ÷r#à¢·G&ç6ÆFR‚$vVæW&FR'&–Vf–ær"—Ð¢Ä'&÷tÆVgB6Æ74æÖSÒ&‚ÓBrÓB"óà¢ÂôÆ–æ³à¢ÂôvÆ746&Cà ¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢Ä&FvRFöæSÒ&vöÆB#ç·G&ç6ÆFR‚%FöF’w2vVæF"—ÓÂô&FvSà¢ÆF—b6Æ74æÖSÒ&×BÓRw&–BvÓB#à¢ÅF–ÖVÆ–æT6&B–æFWƒ×³ÒF—FÆS×·G&ç6ÆFR‚#“£3+rf–ÆÆ6—FR–ç7V7F–öâ"—ÒFW‡C×·G&ç6ÆFR‚%7G'V7GW&Â&öw&W72æBvFW'&ööf–ær&Wf–Wrâ"—Ò–6öã×³Ä6ÆVæF$F—26Æ74æÖSÒ&‚ÓBrÓB"óçÒóà¢ÅF–ÖVÆ–æT6&B–æFWƒ×³'ÒF—FÆS×·G&ç6ÆFR‚##£+rf–ææ6R&Wf–Wr"—ÒFW‡C×·G&ç6ÆFR‚%÷'FföÆ–ò'VFvWB†VÇF‚æBf&–æ6R6†V6²â"—Ò–6öã×³Ä6—&6ÆTFöÆÆ%6–vâ6Æ74æÖSÒ&‚ÓBrÓB"óçÒóà¢ÅF–ÖVÆ–æT6&B–æFWƒ×³7ÒF—FÆS×·G&ç6ÆFR‚#c£+rdõ$'&–Vf–ær"—ÒFW‡C×·G&ç6ÆFR‚$vVæW&FRW†V7WF—fRWFFRf÷"FÆ2ÆVFW'6†—â"—Ò–6öã×³Ä&÷B6Æ74æÖSÒ&‚ÓBrÓB"óçÒóà¢ÂöF—cà¢ÂôvÆ746&Cà ¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢ÆF—b6Æ74æÖSÒ&Ö"ÓBfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö&WGvVVâ#à¢Ä&FvRFöæSÒ'v&æ–ær#ç·G&ç6ÆFR‚$’ÆW'G2"—ÓÂô&FvSà¢Ä&VÆÂ6Æ74æÖSÒ&‚ÓRrÓRFW‡B×v&æ–ær"óà¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ&w&–BvÓ2#à¢¶æ÷F–f–6F–öç2æÖ‚†—FVÒ’Óâ€¢ÆF—b¶W“×¶—FVÒçF—FÆWÒ6Æ74æÖSÒ'&÷VæFVBÓ'†Â&÷&FW"&÷&FW"×v†—FRó&r×v†—FRõ³ãCUÒÓ2#à¢Ä&FvRFöæS×¶—FVÒçVç&VBò'v&æ–ær"¢&æWWG&Â'Óç·G&ç6ÆFR†—FVÒçF—FÆR—ÓÂô&FvSà¢Ç6Æ74æÖSÒ&×BÓ"FW‡B×6ÒÆVF–ærÓbFW‡BÖG2×FW‡BóS‚#ç·G&ç6ÆFR†—FVÒçFW‡B—ÓÂ÷à¢ÂöF—cà¢’—Ð¢ÂöF—cà¢ÂôvÆ746&Cà¢Âö6–FSà¢“°§Ð ¦gVæ7F–öâ&÷GFöÕW&f÷&Öæ6R‡²æÇ—F–72ÂÆöF–ærÓ¢²æÇ—F–73ó¢æöäçVÆÆ&ÆSÅ&WGW&åG—SÇG—VöbW6TæÇ—F–757VÖÖ'“å²&FF%Óã²ÆöF–æs¢&ööÆVâÒ’°¢6öç7B²G&ç6ÆFRÒÒW6T“†â‚“°¢&WGW&â€¢Ç6V7F–öâ6Æ74æÖSÒ&w&–BvÓb†Ã¦w&–BÖ6öÇ2Õ³g%óg%óg%Ò#à¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢Ä&FvRFöæSÒ&vöÆB#ç·G&ç6ÆFR‚%W&f÷&Öæ6R÷fW'f–Wr"—ÓÂô&FvSà¢Æƒ"6Æ74æÖSÒ&×BÓ2FW‡BÓ'†ÂföçBÖ&Æ6²FW‡B×v†—FR#ç·G&ç6ÆFR‚$FÆ2FVÆ—fW'’†VÇF‚"—ÓÂöƒ#à¢ÆF—b6Æ74æÖSÒ&×BÓR76R×’ÓB#à¢¶ÆöF–ærÇÂæÇ—F–72ò€¢Å6¶VÆWFöä6&Bóà¢’¢€¢Ãà¢Å&öw&W74&"fÇVS×¶æÇ—F–72ç&ö¦V7D†VÇF‚çfÇVWÒÆ&VÃ×·G&ç6ÆFR‚%&ö¦V7B†VÇF‚"—Òóà¢Å&öw&W74&"fÇVS×¶æÇ—F–72çF–ÖVÆ–æT†VÇF‚çfÇVWÒÆ&VÃ×·G&ç6ÆFR‚%F–ÖVÆ–æR†VÇF‚"—ÒFöæSÒ&&ÇVR"óà¢Å&öw&W74&"fÇVS×¶æÇ—F–72æ'VFvWD†VÇF‚çfÇVWÒÆ&VÃ×·G&ç6ÆFR‚$'VFvWB†VÇF‚"—ÒFöæSÒ'7V66W72"óà¢Âóà¢—Ð¢ÂöF—cà¢ÂôvÆ746&Cà ¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢Ä&FvRFöæSÒ'7V66W72#ç·G&ç6ÆFR‚%&V6VçB7F—f—G’"—ÓÂô&FvSà¢ÆF—b6Æ74æÖSÒ&×BÓRw&–BvÓ2#à¢·&V6VçD7F—f—G’ç6Æ–6RƒÂ2’æÖ‚†—FVÒ’Óâ°¢6öç7B–6öâÒ—FVÒæ–6öã°¢&WGW&â€¢ÆF—b¶W“×¶—FVÒçF—FÆWÒ6Æ74æÖSÒ'&÷VæFVBÓ'†Â&÷&FW"&÷&FW"×v†—FRó&r×v†—FRõ³ãCUÒÓ2#à¢ÆF—b6Æ74æÖSÒ&fÆW‚—FV×2×7F'BvÓ2#à¢Ä–6öâ6Æ74æÖSÒ&‚ÓRrÓRFW‡BÖvöÆB"óà¢ÆF—cà¢Ç6Æ74æÖSÒ&föçBÖ&Æ6²FW‡B×v†—FR#ç·G&ç6ÆFR†—FVÒçF—FÆR—ÓÂ÷à¢Ç6Æ74æÖSÒ&×BÓFW‡B×‡2FW‡BÖG2×FW‡BóCb#ç·G&ç6ÆFR†—FVÒæFWF–Â—Ò+r·G&ç6ÆFR†—FVÒçF–ÖR—ÓÂ÷à¢ÂöF—cà¢ÂöF—cà¢ÂöF—cà¢“°¢Ò—Ð¢ÂöF—cà¢ÂôvÆ746&Cà ¢ÄvÆ746&B6Æ74æÖSÒ'ÓR#à¢Ä&FvRFöæSÒ&æWWG&Â#ç·G&ç6ÆFR‚%&V6VçB’–ç6–v‡G2"—ÓÂô&FvSà¢ÆF—b6Æ74æÖSÒ&×BÓRw&–BvÓ2#à¢²†æÇ—F–73òç&V6VçD”–ç6–v‡G2ÇÂ6fVDvVæW&F–öç2æÖ‚†—FVÒ’ÓâG¶—FVÒçF—FÆWÒ+rG¶—FVÒçFööÇÖ’’ç6Æ–6RƒÂ2’æÖ‚†—FVÒ’Óâ€¢ÆF—b¶W“×¶—FV×Ò6Æ74æÖSÒ'&÷VæFVBÓ'†Â&÷&FW"&÷&FW"×v†—FRó&r×v†—FRõ³ãCUÒÓ2#à¢Ç6Æ74æÖSÒ&föçBÖ&Æ6²FW‡B×v†—FR#ç¶—FV×ÓÂ÷à¢Ç6Æ74æÖSÒ&×BÓFW‡B×‡2FW‡BÖG2×FW‡BóCb#ç·G&ç6ÆFR‚%dõ$æÇ—F–72"—ÓÂ÷à¢ÂöF—cà¢’—Ð¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ&×BÓB#à¢ÄV×G•7FFRF—FÆS×·G&ç6ÆFR‚$¶æ÷vÆVFvR&VG’"—ÒFW67&—F–öã×·G&ç6ÆFR‚$FÆ2FVÖòf–ÆW2æB’÷WGWG2&R&W&VBf÷"–çfW7F÷"vÆ·F‡&÷Vv‡2â"—Òóà¢ÂöF—cà¢ÂôvÆ746&Cà¢Â÷6V7F–öãà¢“°§Ð ¦gVæ7F–öâ†VFW$ÖWF‡²–6öâÂÆ&VÂÂfÇVRÓ¢²–6öã¢&V7Bå&V7DæöFS²Æ&VÃ¢7G&–æs²fÇVS¢7G&–ærÒ’°¢6öç7B²G&ç6ÆFRÒÒW6T“†â‚“°¢&WGW&â€¢ÆF—b6Æ74æÖSÒ'&÷VæFVBÓ'†Â&÷&FW"&÷&FW"×v†—FRó&r×v†—FRõ³ãCUÒÓ2#à¢ÆF—b6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"vÓ"FW‡BÖvöÆB#ç¶–6öçÓÇ7â6Æ74æÖSÒ'FW‡B×‡2föçBÖ&Æ6²WW&66RG&6¶–ærÕ³ãVÕÒFW‡BÖG2×FW‡BóCB#ç·G&ç6ÆFR†Æ&VÂ—ÓÂ÷7ããÂöF—cà¢Ç6Æ74æÖSÒ&×BÓ"G'Væ6FRföçBÖ&Æ6²FW‡B×v†—FR#ç·G&ç6ÆFR‡fÇVR—ÓÂ÷à¢ÂöF—cà¢“°§Ð