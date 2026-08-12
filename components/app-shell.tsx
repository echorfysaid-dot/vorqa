"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  Bell,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Clock3,
  Crown,
  FileText,
  FileSignature,
  FileSearch,
  FolderKanban,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Moon,
  PackageCheck,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  ReceiptText,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Sun,
  Upload,
  UserPlus,
  UserRound,
  WandSparkles
} from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { Avatar, Badge } from "@/components/ui";
import { VorqaLogo, VoraOrb } from "@/components/vorqa-visuals";
import { getDataSourceMode } from "@/lib/data-source";
import { organizationRepository } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { LanguageSelector } from "@/components/language-selector";
import { useOnboardingProfile } from "@/lib/onboarding-client";
import { navigationForIdentity, organizationTypeDisplayNames, roleDisplayNames } from "@/lib/onboarding";

type Theme = "light" | "dark";
type Toast = { id: number; title: string; text: string };
type ToastContextValue = { pushToast: (title: string, text: string) => void };
type DemoOrganization = (typeof demoOrganizations)[number];

const ToastContext = createContext<ToastContextValue>({ pushToast: () => undefined });

export function useToast() {
  return useContext(ToastContext);
}

const primaryNavItems = [
  { href: "/dashboard", key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", key: "projects", icon: FolderKanban },
  { href: "/tools/document", key: "vora", label: "VORA", icon: BrainCircuit },
  { href: "/organizations", key: "organizations", label: "Organizations", icon: Building2 },
  { href: "/marketplace", key: "marketplace", label: "Marketplace", icon: Store }
] as const;

const secondaryNavItems = [
  { href: "/tools", key: "tools", icon: WandSparkles },
  { href: "/rfq", key: "rfq", icon: FileSearch },
  { href: "/quotations", key: "quotations", icon: ReceiptText },
  { href: "/contracts", key: "contracts", icon: FileSignature },
  { href: "/billing", key: "billing", icon: CreditCard },
  { href: "/admin", key: "admin", icon: ShieldCheck },
  { href: "/notifications", key: "notifications", icon: Bell },
  { href: "/projects#knowledge", key: "knowledge", icon: CalendarDays },
  { href: "/saved#documents", key: "documents", icon: UserRound },
  { href: "/history", key: "history", icon: Clock3 },
  { href: "/saved", key: "saved", icon: Sparkles },
  { href: "/favorites", key: "favorites", icon: Heart },
  { href: "/pricing", key: "pricing", icon: Crown },
  { href: "/settings", key: "settings", icon: Settings }
] as const;

const allNavItems = [...primaryNavItems, ...secondaryNavItems] as const;

const demoOrganizations = organizationRepository.list();

const globalSearchItems = [
  { title: "Luxury Villa Casablanca", type: "Project", context: "Atlas Construction Group", status: "Execution", href: "/projects/PRJ-1048", icon: FolderKanban },
  { title: "Atlas Construction Group", type: "Organization", context: "North Africa Construction Command Center", status: "Active", href: "/organizations/atlas", icon: Building2 },
  { title: "Nadia Benali", type: "Employee", context: "Engineering ¬∑ Atlas", status: "Active", href: "/organizations/atlas", icon: UserRound },
  { title: "Engineering", type: "Department", context: "Atlas Construction Group", status: "High workload", href: "/organizations/atlas", icon: Building2 },
  { title: "Weekly Executive Report", type: "Report", context: "Luxury Villa Casablanca", status: "Ready", href: "/history", icon: FileText },
  { title: "Supplier Comparison.xlsx", type: "Document", context: "Procurement", status: "Reviewed", href: "/saved", icon: FileText },
  { title: "VORA Procurement Risk Summary", type: "AI output", context: "Industrial Warehouse Tangier", status: "Generated", href: "/history", icon: BrainCircuit },
  { title: "Document Generator", type: "Tool", context: "VORA AI Workspace", status: "Available", href: "/tools/document", icon: WandSparkles },
  { title: "Construction Marketplace", type: "Marketplace", context: "Verified B2B network", status: "Demo", href: "/marketplace", icon: Store },
  { title: "RFQ-1001 Villa execution package", type: "RFQ", context: "Marketplace procurement", status: "Open", href: "/rfq/RFQ-1001", icon: FileSearch },
  { title: "QTN-1001 Atlas execution quotation", type: "Quotation", context: "RFQ-1001", status: "Shortlisted", href: "/quotations/QTN-1001", icon: ReceiptText },
  { title: "CON-1001 Atlas execution contract", type: "Contract", context: "Linked to RFQ-1001", status: "Active", href: "/contracts/CON-1001", icon: FileSignature },
  { title: "Billing Control Center", type: "Billing", context: "Plan, usage and invoices", status: "Trialing", href: "/billing", icon: CreditCard },
  { title: "Administration Panel", type: "Admin", context: "Platform metrics, users and system health", status: "Foundation", href: "/admin", icon: ShieldCheck },
  { title: "Notification Center", type: "Notifications", context: "Enterprise alerts", status: "Unread alerts", href: "/notifications", icon: Bell }
];

const commandItems = [
  { title: "Open dashboard", category: "Navigation", href: "/dashboard", icon: LayoutDashboard },
  { title: "Open projects", category: "Navigation", href: "/projects", icon: FolderKanban },
  { title: "Open organizations", category: "Navigation", href: "/organizations", icon: Building2 },
  { title: "Open marketplace", category: "Navigation", href: "/marketplace", icon: Store },
  { title: "Open RFQs", category: "Navigation", href: "/rfq", icon: FileSearch },
  { title: "Open quotations", category: "Navigation", href: "/quotations", icon: ReceiptText },
  { title: "Open contracts", category: "Navigation", href: "/contracts", icon: FileSignature },
  { title: "Open billing", category: "Navigation", href: "/billing", icon: CreditCard },
  { title: "Open administration", category: "Navigation", href: "/admin", icon: ShieldCheck },
  { title: "Open notification center", category: "Navigation", href: "/notifications", icon: Bell },
  { title: "Open VORA AI", category: "AI", href: "/tools/document", icon: BrainCircuit },
  { title: "Create project", category: "Placeholder", href: "/projects", icon: Plus },
  { title: "Generate report", category: "AI", href: "/tools/document", icon: FileText },
  { title: "Generate BOQ", category: "AI", href: "/tools/document", icon: PackageCheck },
  { title: "Open settings", category: "Navigation", href: "/settings", icon: Settings },
  { title: "Switch organization", category: "Workspace", href: "/organizations", icon: Building2 },
  { title: "View notifications", category: "Workspace", href: "/dashboard", icon: Bell }
];

const demoNotificationItems = [
  { id: 1, category: "Projects", title: "Milestone review due", message: "Luxury Villa Casablanca needs structural frame sign-off today.", timestamp: "8 min ago", priority: "High", unread: true, context: "Atlas ¬∑ PRJ-1048", action: "Open project" },
  { id: 2, category: "Budget", title: "Budget variance detected", message: "Procurement variance increased by 6% on marble package.", timestamp: "24 min ago", priority: "High", unread: true, context: "Atlas ¬∑ Finance", action: "Review budget" },
  { id: 3, category: "AI", title: "VORA report ready", message: "Executive weekly report was generated and saved to history.", timestamp: "42 min ago", priority: "Medium", unread: false, context: "VORA AI", action: "Open report" },
  { id: 4, category: "Documents", title: "New document uploaded", message: "Supplier Comparison.xlsx was added to procurement documents.", timestamp: "Today", priority: "Medium", unread: true, context: "Procurement", action: "View document" },
  { id: 5, category: "Approvals", title: "Approval missing", message: "Steel supplier award needs Finance and Procurement approval.", timestamp: "Today", priority: "High", unread: true, context: "Tangier Warehouse", action: "Open approval" },
  { id: 6, category: "Security", title: "Admin role review", message: "HR Manager admin role is flagged for periodic access review.", timestamp: "Yesterday", priority: "Low", unread: false, context: "Organization security", action: "Review access" },
  { id: 7, category: "Tasks", title: "Task workload alert", message: "Omar Haddad is above 80% workload this week.", timestamp: "Yesterday", priority: "Medium", unread: true, context: "Engineering", action: "Balance tasks" },
  { id: 8, category: "Organization", title: "Invitation pending", message: "Maghreb Logistics is waiting for workspace invitation acceptance.", timestamp: "2 days ago", priority: "Low", unread: false, context: "Organizations", action: "View invite" }
];

const quickActions = [
  { title: "New project", href: "/projects", icon: Plus },
  { title: "Upload document", href: "/projects#knowledge", icon: Upload },
  { title: "Ask VORA", href: "/tools/document", icon: BrainCircuit },
  { title: "Generate report", href: "/tools/document", icon: FileText },
  { title: "Invite employee", href: "/organizations/atlas", icon: UserPlus },
  { title: "Open organization", href: "/organizations/atlas", icon: Building2 },
  { title: "Browse marketplace", href: "/marketplace", icon: Store },
  { title: "Create RFQ", href: "/rfq/new", icon: FileSearch },
  { title: "Compare quotations", href: "/quotations/compare", icon: ReceiptText },
  { title: "Open contracts", href: "/contracts", icon: FileSignature },
  { title: "Open billing", href: "/billing", icon: CreditCard },
  { title: "Open admin", href: "/admin", icon: ShieldCheck }
];

function iconForRoleNavigation(label: string) {
  if (/VORA/i.test(label)) return BrainCircuit;
  if (/Project|Task|Today|Schedule|Timeline/i.test(label)) return FolderKanban;
  if (/Organization|Team|Department|Customer/i.test(label)) return Building2;
  if (/RFQ|Bid|Drawing|Document|Design/i.test(label)) return FileText;
  if (/Contract|Approval|Inspection|Issue|Safety/i.test(label)) return ShieldCheck;
  if (/Budget|Finance|Invoice|Quotation|Order/i.test(label)) return CreditCard;
  if (/Report/i.test(label)) return ReceiptText;
  if (/Setting|Profile/i.test(label)) return Settings;
  if (/Market|Opportunity|Product|Deliver/i.test(label)) return Store;
  return LayoutDashboard;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, logout } = useAuth();
  const onboarding = useOnboardingProfile(Boolean(session));
  const { dictionary: t, dir, translate } = useI18n();
  const [theme, setTheme] = useState<Theme>("dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [notificationReadIds, setNotificationReadIds] = useState<number[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<DemoOrganization>(demoOrganizations[0]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const stored = window.localStorage.getItem("vorqa-theme") as Theme | null;
    setTheme(stored || "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("vorqa-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
        setQuickActionsOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const overlayOpen = commandOpen || sidebarOpen;
    document.body.style.overflow = overlayOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [commandOpen, sidebarOpen]);

  const toastValue = useMemo(
    () => ({
      pushToast: (title: string, text: string) => {
        const id = Date.now();
        setToasts((current) => [...current, { id, title, text }]);
        window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3600);
      }
    }),
    []
  );

  const currentPageKey = allNavItems.find((item) => {
    const hrefPath = item.href.split("#")[0];
    return hrefPath === pathname || (hrefPath !== "/" && pathname.startsWith(hrefPath) && !item.href.includes("#"));
  })?.key;
  const currentPageItem = allNavItems.find((item) => item.key === currentPageKey);
  const currentPageLabel = currentPageItem && "label" in currentPageItem ? currentPageItem.label : undefined;
  const currentPage = currentPageLabel ? translate(currentPageLabel) : (currentPageKey && currentPageKey in t.nav ? t.nav[currentPageKey as keyof typeof t.nav] : "Vorqa AI");
  const userLabel = session?.user?.email || "Vorqa Founder";
  const shellSide = dir === "rtl" ? "right-0 border-l" : "left-0 border-r";
  const mobileSide = dir === "rtl" ? "right-0 border-l" : "left-0 border-r";
  const contentMargin = dir === "rtl" ? (sidebarCollapsed ? "lg:mr-20" : "lg:mr-[17.5rem]") : sidebarCollapsed ? "lg:ml-20" : "lg:ml-[17.5rem]";
  const drawerOffset = dir === "rtl" ? 320 : -320;
  const profilePanelSide = dir === "rtl" ? "left-0" : "right-0";
  const unreadCount = demoNotificationItems.filter((item) => item.unread && !notificationReadIds.includes(item.id)).length;
  const dataSourceMode = getDataSourceMode();
  const dataSourceLabel = translate(dataSourceMode === "supabase" ? "Production data" : dataSourceMode === "auto" ? "Auto data mode" : "Demo mode");
  const identity = useMemo(() => onboarding.profile?.accountType ? {
    accountType: onboarding.profile.accountType,
    primaryRole: onboarding.profile.primaryRole,
    organizationType: onboarding.profile.organizationType
  } : null, [onboarding.profile?.accountType, onboarding.profile?.primaryRole, onboarding.profile?.organizationType]);
  const workspaceLabel = identity?.accountType === "organization" && identity.organizationType
    ? organizationTypeDisplayNames[identity.organizat˜ç<∂âûÀk∫wµÁQîΩl¿∏¿ÕtÅ¿¥ÃÅ—…ÖπÕ•—•Ω∏Å°ΩŸï»ÈâΩ…ëï»µëÃµ—Ω≠ï∏µùΩ±êº»¿Å°ΩŸï»Èâúµ›°•—îΩl¿∏¿‘’tà¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙâù…•êÅ†¥‰Å‹¥‰Å¡±Öçîµ•—ïµÃµçïπ—ï»Å…Ω’πëïêµëÃµÕ¥ÅâúµëÃµ—Ω≠ï∏µùΩ±êºƒ»Å—ï·–µëÃµ—Ω≠ï∏µùΩ±êà¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ%çΩ∏Åç±ÖÕÕ9ÖµîÙâ†¥–Å‹¥–Å—…ÖπÕ•—•Ω∏Åù…Ω’¿µ°ΩŸï»Ëµ…Ω—Ö—î¥ÿàÄº¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙâôΩπ–µâ±Öç¨à˘Ì—…ÖπÕ±Ö—î°Öç—•Ω∏π—•—±î•ÙΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄΩ1•π¨¯(ÄÄÄÄÄÄÄÄÄÄ§Ï(ÄÄÄÄÄÄÄÅÙ•Ù(ÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄΩ±ΩÖ—•πùAÖπï∞¯(ÄÄΩ’—Ω1ΩçÖ±•ÈïëΩπ—ïπ–¯§Ï)Ù()ô’πç—•Ω∏ÅΩµµÖπëAÖ±ï——î°ÏÅΩπ±ΩÕî∞ÅΩπ=¡ïπ9Ω—•ô•çÖ—•ΩπÃÅÙËÅÏÅΩπ±ΩÕîËÄ†§ÄÙ¯ÅŸΩ•êÏÅΩπ=¡ïπ9Ω—•ô•çÖ—•ΩπÃËÄ†§ÄÙ¯ÅŸΩ•êÅÙ§ÅÏ(ÄÅçΩπÕ–Å…Ω’—ï»ÄÙÅ’ÕïIΩ’—ï»†§Ï(ÄÅçΩπÕ–ÅÏÅ—…ÖπÕ±Ö—îÅÙÄÙÅ’Õï$ƒ·∏†§Ï(ÄÅçΩπÕ–Åm≈’ï…‰∞ÅÕï—E’ï…ÂtÄÙÅ’ÕïM—Ö—î†àà§Ï(ÄÅçΩπÕ–ÅmÕï±ïç—ïë%πëï‡∞ÅÕï—Mï±ïç—ïë%πëï·tÄÙÅ’ÕïM—Ö—î†¿§Ï(ÄÅçΩπÕ–ÅπΩ…µÖ±•ÈïëE’ï…‰ÄÙÅ≈’ï…‰π—Ω1Ω›ï…ÖÕî†§Ï(ÄÅçΩπÕ–Åô•±—ï…ïëMïÖ…ç†ÄÙÅù±ΩâÖ±MïÖ…ç°%—ïµÃπô•±—ï»†°•—ï¥§ÄÙ¯ÅÄëÌ•—ï¥π—•—±ïÙÄëÌ•—ï¥π—Â¡ïÙÄëÌ•—ï¥πçΩπ—ï·—ÙÄëÌ•—ï¥πÕ—Ö—’ÕıÄπ—Ω1Ω›ï…ÖÕî†§π•πç±’ëïÃ°πΩ…µÖ±•ÈïëE’ï…‰§§Ï(ÄÅçΩπÕ–Åô•±—ï…ïëΩµµÖπëÃÄÙÅçΩµµÖπë%—ïµÃπô•±—ï»†°•—ï¥§ÄÙ¯ÅÄëÌ•—ï¥π—•—±ïÙÄëÌ•—ï¥πçÖ—ïùΩ…ÂıÄπ—Ω1Ω›ï…ÖÕî†§π•πç±’ëïÃ°πΩ…µÖ±•ÈïëE’ï…‰§§Ï(ÄÅçΩπÕ–Å¡Ö±ï——ï%—ïµÃÄÙÅl(ÄÄÄÄ∏∏πô•±—ï…ïëΩµµÖπëÃπµÖ¿†°•—ï¥§ÄÙ¯Ä°ÏÄ∏∏π•—ï¥∞Å≠•πêËÄâçΩµµÖπêàÅÖÃÅçΩπÕ–∞Å—Â¡îËÅ•—ï¥πçÖ—ïùΩ…‰∞ÅçΩπ—ï·–ËÄâΩµµÖπêÅ¡Ö±ï——îà∞ÅÕ—Ö—’ÃËÄâIïÖë‰àÅÙ§§∞(ÄÄÄÄ∏∏πô•±—ï…ïëMïÖ…ç†πµÖ¿†°•—ï¥§ÄÙ¯Ä°ÏÄ∏∏π•—ï¥∞Å≠•πêËÄâÕïÖ…ç†àÅÖÃÅçΩπÕ–ÅÙ§§(ÄÅtÏ(ÄÅçΩπÕ–Å…ïçïπ—ΩµµÖπëÃÄÙÅçΩµµÖπë%—ïµÃπÕ±•çî†¿∞ÄÃ§Ï(ÄÅçΩπÕ–ÅÕ’ùùïÕ—ïëΩµµÖπëÃÄÙÅçΩµµÖπë%—ïµÃπÕ±•çî†Ã∞Ä‹§Ï((ÄÅ’Õïôôïç–††§ÄÙ¯ÅÏ(ÄÄÄÅÕï—Mï±ïç—ïë%πëï‡†¿§Ï(ÄÅÙ∞Åm≈’ï…Ât§Ï((ÄÅô’πç—•Ω∏ÅΩ¡ïπMï±ïç—ïê†§ÅÏ(ÄÄÄÅçΩπÕ–ÅÕï±ïç—ïêÄÙÅ¡Ö±ï——ï%—ïµÕmÕï±ïç—ïë%πëï·tÏ(ÄÄÄÅ•òÄ†ÖÕï±ïç—ïê§Å…ï—’…∏Ï(ÄÄÄÅ•òÄ°Õï±ïç—ïêπ—•—±îÄÙÙÙÄâY•ï‹ÅπΩ—•ô•çÖ—•ΩπÃà§ÅÏ(ÄÄÄÄÄÅΩπ=¡ïπ9Ω—•ô•çÖ—•ΩπÃ†§Ï(ÄÄÄÄÄÅΩπ±ΩÕî†§Ï(ÄÄÄÄÄÅ…ï—’…∏Ï(ÄÄÄÅÙ(ÄÄÄÅ…Ω’—ï»π¡’Õ†°Õï±ïç—ïêπ°…ïò§Ï(ÄÄÄÅΩπ±ΩÕî†§Ï(ÄÅÙ((ÄÅ…ï—’…∏Ä†Ò’—Ω1ΩçÖ±•ÈïëΩπ—ïπ–¯(ÄÄÄÄÒµΩ—•Ω∏πë•ÿÅç±ÖÕÕ9ÖµîÙâô•·ïêÅ•πÕï–¥¿ÅËµlƒ»¡tÅâúµâ±Öç¨º‹»Å¿¥ÃÅâÖç≠ë…Ω¿µâ±’»µ·∞ÅÕ¥È¿¥ÿàÅ•π•—•Ö∞ıÌÏÅΩ¡Öç•—‰ËÄ¿ÅıÙÅÖπ•µÖ—îıÌÏÅΩ¡Öç•—‰ËÄƒÅıÙÅï·•–ıÌÏÅΩ¡Öç•—‰ËÄ¿ÅıÙ¯(ÄÄÄÄÄÄÒµΩ—•Ω∏πë•ÿ(ÄÄÄÄÄÄÄÅ…Ω±îÙâë•Ö±Ωúà(ÄÄÄÄÄÄÄÅÖ…•ÑµµΩëÖ∞Ùâ—…’îà(ÄÄÄÄÄÄÄÅÖ…•Ñµ±Öâï∞ıÌ—…ÖπÕ±Ö—î†â±ΩâÖ∞ÅÕïÖ…ç†ÅÖπêÅçΩµµÖπêÅ¡Ö±ï——îà•Ù(ÄÄÄÄÄÄÄÅÖ…•ÑµëïÕç…•âïëâ‰ÙâçΩµµÖπêµ¡Ö±ï——îµ°ï±¿à(ÄÄÄÄÄÄÄÅ•π•—•Ö∞ıÌÏÅΩ¡Öç•—‰ËÄ¿∞Å‰ËÄ»¿∞ÅÕçÖ±îËÄ¿∏‰‡ÅıÙ(ÄÄÄÄÄÄÄÅÖπ•µÖ—îıÌÏÅΩ¡Öç•—‰ËÄƒ∞Å‰ËÄ¿∞ÅÕçÖ±îËÄƒÅıÙ(ÄÄÄÄÄÄÄÅï·•–ıÌÏÅΩ¡Öç•—‰ËÄ¿∞Å‰ËÄƒ‡∞ÅÕçÖ±îËÄ¿∏‰‡ÅıÙ(ÄÄÄÄÄÄÄÅç±ÖÕÕ9ÖµîÙâµ‡µÖ’—ºÅô±ï‡Å†µmµ•∏†‹ÿ¡¡‡±çÖ±å†ƒ¿¡Ÿ†¥ƒ∏’…ï¥§•tÅµÖ‡µ‹¥—·∞Åô±ï‡µçΩ∞ÅΩŸï…ô±Ω‹µ°•ëëï∏Å…Ω’πëïêµëÃ¥…·∞ÅâΩ…ëï»ÅâΩ…ëï»µëÃµ—Ω≠ï∏µâΩ…ëï»ÅâúµëÃµ—Ω≠ï∏µÕïçΩπëÖ…‰º‰‡ÅÕ°ÖëΩ‹µëÃµ±úÅ…•πú¥ƒÅ…•πúµ›°•—îΩl¿∏¿»’tÅâÖç≠ë…Ω¿µâ±’»µ·∞ÅÕ¥È†µmµ•∏†‹ÿ¡¡‡±çÖ±å†ƒ¿¡Ÿ†¥Õ…ï¥§•tà(ÄÄÄÄÄÄÄÅΩπ-ïÂΩ›∏ıÏ°ïŸïπ–§ÄÙ¯ÅÏ(ÄÄÄÄÄÄÄÄÄÅ•òÄ°ïŸïπ–π≠ï‰ÄÙÙÙÄâÕçÖ¡îà§ÅΩπ±ΩÕî†§Ï(ÄÄÄÄÄÄÄÄÄÅ•òÄ°ïŸïπ–π≠ï‰ÄÙÙÙÄâ……Ω›Ω›∏à§ÅÏ(ÄÄÄÄÄÄÄÄÄÄÄÅïŸïπ–π¡…ïŸïπ—ïôÖ’±–†§Ï(ÄÄÄÄÄÄÄÄÄÄÄÅÕï—Mï±ïç—ïë%πëï‡†°ŸÖ±’î§ÄÙ¯Å5Ö—†πµ•∏°ŸÖ±’îÄ¨Äƒ∞Å5Ö—†πµÖ‡†¿∞Å¡Ö±ï——ï%—ïµÃπ±ïπù—†Ä¥Äƒ§§§Ï(ÄÄÄÄÄÄÄÄÄÅÙ(ÄÄÄÄÄÄÄÄÄÅ•òÄ°ïŸïπ–π≠ï‰ÄÙÙÙÄâ……Ω›U¿à§ÅÏ(ÄÄÄÄÄÄÄÄÄÄÄÅïŸïπ–π¡…ïŸïπ—ïôÖ’±–†§Ï(ÄÄÄÄÄÄÄÄÄÄÄÅÕï—Mï±ïç—ïë%πëï‡†°ŸÖ±’î§ÄÙ¯Å5Ö—†πµÖ‡°ŸÖ±’îÄ¥Äƒ∞Ä¿§§Ï(ÄÄÄÄÄÄÄÄÄÅÙ(ÄÄÄÄÄÄÄÄÄÅ•òÄ°ïŸïπ–π≠ï‰ÄÙÙÙÄâπ—ï»à§ÅÏ(ÄÄÄÄÄÄÄÄÄÄÄÅïŸïπ–π¡…ïŸïπ—ïôÖ’±–†§Ï(ÄÄÄÄÄÄÄÄÄÄÄÅΩ¡ïπMï±ïç—ïê†§Ï(ÄÄÄÄÄÄÄÄÄÅÙ(ÄÄÄÄÄÄÄÅıÙ(ÄÄÄÄÄÄ¯(ÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙââΩ…ëï»µàÅâΩ…ëï»µ›°•—îºƒ¿Å¿¥–à¯(ÄÄÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâô±ï‡Å•—ïµÃµçïπ—ï»ÅùÖ¿¥Ãà¯(ÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâô±ï‡Åµ•∏µ‹¥¿Åô±ï‡¥ƒÅ•—ïµÃµçïπ—ï»ÅùÖ¿¥ÃÅ…Ω’πëïêµëÃµµêÅâΩ…ëï»ÅâΩ…ëï»µëÃµ—Ω≠ï∏µùΩ±êº»»Åâúµâ±Öç¨º»‡Å¡‡¥–Å¡‰¥ÃÅÕ°ÖëΩ‹µ•ππï»ÅÕ°ÖëΩ‹µâ±Öç¨º»¿à¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒMïÖ…ç†Åç±ÖÕÕ9ÖµîÙâ†¥‘Å‹¥‘ÅÕ°…•π¨¥¿Å—ï·–µùΩ±êàÄº¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ•π¡’–(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅÖ’—ΩΩç’Ã(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅŸÖ±’îıÌ≈’ï…ÂÙ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅΩπ°ÖπùîıÏ°ïŸïπ–§ÄÙ¯ÅÕï—E’ï…‰°ïŸïπ–π—Ö…ùï–πŸÖ±’î•Ù(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅç±ÖÕÕ9ÖµîÙâ‹µô’±∞Åâúµ—…ÖπÕ¡Ö…ïπ–Å—ï·–µâÖÕîÅôΩπ–µâΩ±êÅ—ï·–µëÃµ—ï·–ÅΩ’—±•πîµπΩπîÅ¡±Öçï°Ω±ëï»È—ï·–µëÃµ—ï·–ºÃÿà(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅ¡±Öçï°Ω±ëï»ıÌ—…ÖπÕ±Ö—î†âMïÖ…ç†Å¡…Ω©ïç—Ã∞ÅΩ…ùÖπ•ÈÖ—•ΩπÃ∞Å¡ïΩ¡±î∞Å…ï¡Ω…—Ã∞Å—ΩΩ±Ã∏∏∏à•Ù(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅÖ…•Ñµ±Öâï∞ıÌ—…ÖπÕ±Ö—î†âMïÖ…ç†ÅYΩ…≈ÑÅ›Ω…≠Õ¡Öçîà•Ù(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅÖ…•ÑµçΩπ—…Ω±ÃÙâçΩµµÖπêµ¡Ö±ï——îµ…ïÕ’±—Ãà(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅÖ…•ÑµÖç—•ŸïëïÕçïπëÖπ–ıÌ¡Ö±ï——ï%—ïµÕmÕï±ïç—ïë%πëï·tÄ¸ÅÅçΩµµÖπêµ¡Ö±ï——îµ…ïÕ’±–¥ëÌÕï±ïç—ïë%πëï·ıÄÄËÅ’πëïô•πïëÙ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄº¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ-ïÂâΩÖ…ë!•π–Å≠ïÂÃıÌlâÕåâuÙÅç±ÖÕÕ9ÖµîÙâ°•ëëï∏Åâúµ›°•—îΩl¿∏¿–’tÅÕ¥È•π±•πîµô±ï‡àÄº¯(ÄÄÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÌΩπ±ΩÕïÙÅç±ÖÕÕ9ÖµîÙâëÃµôΩç’ÕÖâ±îÅù…•êÅ†¥ƒ»Å‹¥ƒ»ÅÕ°…•π¨¥¿Å¡±Öçîµ•—ïµÃµçïπ—ï»Å…Ω’πëïê¥…·∞ÅâΩ…ëï»ÅâΩ…ëï»µ›°•—îºƒ¿Åâúµ›°•—îΩl¿∏¿‘’tÅ—ï·–µëÃµ—ï·–º‘‡Å—…ÖπÕ•—•Ω∏Å°ΩŸï»Ëµ—…ÖπÕ±Ö—îµ‰¥¿∏‘Å°ΩŸï»Èâúµ›°•—îΩl¿∏¿‡’tÅ°ΩŸï»È—ï·–µëÃµ—ï·–àÅÖ…•Ñµ±Öâï∞ıÌ—…ÖπÕ±Ö—î†â±ΩÕîÅçΩµµÖπêÅ¡Ö±ï——îà•Ù¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ°ïŸ…ΩπΩ›∏Åç±ÖÕÕ9ÖµîÙâ†¥‘Å‹¥‘Å…Ω—Ö—î¥ƒ‡¿àÄº¯(ÄÄÄÄÄÄÄÄÄÄÄÄΩâ’——Ω∏¯(ÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄΩë•ÿ¯((ÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâù…•êÅµ•∏µ†¥¿Åô±ï‡¥ƒÅùÖ¿¥¿Å±úÈù…•êµçΩ±Ãµl»ÿ¡¡·}µ•πµÖ‡†¿∞≈ô»•tà¯(ÄÄÄÄÄÄÄÄÄÄÒÖÕ•ëîÅç±ÖÕÕ9ÖµîÙâ°•ëëï∏ÅâΩ…ëï»µîÅâΩ…ëï»µ›°•—îºƒ¿Åâúµ›°•—îΩl¿∏¿ƒ·tÅ¿¥–Å±úÈâ±Ωç¨à¯(ÄÄÄÄÄÄÄÄÄÄÄÄÒAÖ±ï——ïMïç—•Ω∏Å—•—±îıÌ—…ÖπÕ±Ö—î†âIïçïπ–ÅçΩµµÖπëÃà•ÙÅçΩµµÖπëÃıÌ…ïçïπ—ΩµµÖπëÕÙÄº¯(ÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâµ–¥‘à¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒAÖ±ï——ïMïç—•Ω∏Å—•—±îıÌ—…ÖπÕ±Ö—î†âM’ùùïÕ—ïêÅçΩµµÖπëÃà•ÙÅçΩµµÖπëÃıÌÕ’ùùïÕ—ïëΩµµÖπëÕÙÄº¯(ÄÄÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄÄÄΩÖÕ•ëî¯((ÄÄÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâµ•∏µ†¥¿ÅΩŸï…ô±Ω‹µ‰µÖ’—ºÅ¿¥–à¯(ÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâµà¥ÃÅô±ï‡Å•—ïµÃµçïπ—ï»Å©’Õ—•ô‰µâï—›ïï∏ÅùÖ¿¥Ãà¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅ•êÙâçΩµµÖπêµ¡Ö±ï——îµ°ï±¿à¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ	ÖëùîÅ—ΩπîÙâùΩ±êà˘Ì—…ÖπÕ±Ö—î†â±ΩâÖ∞Åë•ÕçΩŸï…‰à•ÙΩ	Öëùî¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ¿Åç±ÖÕÕ9ÖµîÙâµ–¥»Å—ï·–µÕ¥Å—ï·–µëÃµ—ï·–º‘–à˘Ì¡Ö±ï——ï%—ïµÃπ±ïπù—°ÙÅÌ—…ÖπÕ±Ö—î†â…ïÕ’±—ÃÅÖç…ΩÕÃÅYΩ…≈Ñà•ÙΩ¿¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâ°•ëëï∏ÅùÖ¿¥»Å—ï·–µlƒ¡¡·tÅôΩπ–µâ±Öç¨Å—ï·–µëÃµ—ï·–ºÃ‡ÅÕ¥Èô±ï‡à¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙâ•π±•πîµô±ï‡Å•—ïµÃµçïπ—ï»ÅùÖ¿¥ƒÅ…Ω’πëïêµ±úÅâΩ…ëï»ÅâΩ…ëï»µ›°•—îºƒ¿Å¡‡¥»Å¡‰¥ƒà¯Ò-ïÂâΩÖ…ë!•π–Å≠ïÂÃıÌlãäDà∞ÄãäLâuÙÅç±ÖÕÕ9ÖµîÙââΩ…ëï»¥¿Å¿¥¿àÄº¯ÅÌ—…ÖπÕ±Ö—î†â9ÖŸ•ùÖ—îà•ÙΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙâ•π±•πîµô±ï‡Å•—ïµÃµçïπ—ï»ÅùÖ¿¥ƒÅ…Ω’πëïêµ±úÅâΩ…ëï»ÅâΩ…ëï»µ›°•—îºƒ¿Å¡‡¥»Å¡‰¥ƒà¯Ò-ïÂâΩÖ…ë!•π–Å≠ïÂÃıÌlâπ—ï»âuÙÅç±ÖÕÕ9ÖµîÙââΩ…ëï»¥¿Å¿¥¿àÄº¯ÅÌ—…ÖπÕ±Ö—î†â=¡ï∏à•ÙΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯((ÄÄÄÄÄÄÄÄÄÄÄÅÌ¡Ö±ï——ï%—ïµÃπ±ïπù—†Ä¸Ä†(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅ•êÙâçΩµµÖπêµ¡Ö±ï——îµ…ïÕ’±—ÃàÅ…Ω±îÙâ±•Õ—âΩ‡àÅÖ…•Ñµ±Öâï∞ıÌ—…ÖπÕ±Ö—î†âΩµµÖπêÅ¡Ö±ï——îÅ…ïÕ’±—Ãà•ÙÅç±ÖÕÕ9ÖµîÙâù…•êÅùÖ¿¥»à¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅÌ¡Ö±ï——ï%—ïµÃπµÖ¿†°•—ï¥∞Å•πëï‡§ÄÙ¯ÅÏ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅçΩπÕ–Å%çΩ∏ÄÙÅ•—ï¥π•çΩ∏Ï(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅçΩπÕ–ÅÖç—•ŸîÄÙÅ•πëï‡ÄÙÙÙÅÕï±ïç—ïë%πëï‡Ï(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅ…ï—’…∏Ä†(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ1•π¨(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅ≠ï‰ıÌÄëÌ•—ï¥π≠•πëÙ¥ëÌ•—ï¥π—•—±ïıÅÙ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅ•êıÌÅçΩµµÖπêµ¡Ö±ï——îµ…ïÕ’±–¥ëÌ•πëï·ıÅÙ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅ…Ω±îÙâΩ¡—•Ω∏à(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅÖ…•ÑµÕï±ïç—ïêıÌÖç—•ŸïÙ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅ°…ïòıÌ•—ï¥π°…ïôÙ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅΩπ±•ç¨ıÏ°ïŸïπ–§ÄÙ¯ÅÏ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅ•òÄ°•—ï¥π—•—±îÄÙÙÙÄâY•ï‹ÅπΩ—•ô•çÖ—•ΩπÃà§ÅÏ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅïŸïπ–π¡…ïŸïπ—ïôÖ’±–†§Ï(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅΩπ=¡ïπ9Ω—•ô•çÖ—•ΩπÃ†§Ï(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅÙ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅΩπ±ΩÕî†§Ï(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅıÙ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅΩπ5Ω’Õïπ—ï»ıÏ†§ÄÙ¯ÅÕï—Mï±ïç—ïë%πëï‡°•πëï‡•Ù(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅç±ÖÕÕ9ÖµîıÌÅù…Ω’¿Åô±ï‡Å•—ïµÃµçïπ—ï»ÅùÖ¿¥ÃÅ…Ω’πëïêµëÃµµêÅâΩ…ëï»Å¿¥ÃÅ—ï·–µÕ—Ö…–ÅÕ°ÖëΩ‹µÕ¥Å—…ÖπÕ•—•Ω∏ÄëÏ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅÖç—•ŸîÄ¸ÄââΩ…ëï»µëÃµ—Ω≠ï∏µùΩ±êºÃ‡ÅâúµëÃµ—Ω≠ï∏µùΩ±êºƒ»àÄËÄââΩ…ëï»µëÃµ—Ω≠ï∏µâΩ…ëï»Åâúµ›°•—îΩl¿∏¿ÕtÅ°ΩŸï»ÈâΩ…ëï»µëÃµ—Ω≠ï∏µâΩ…ëï»µÕ—…ΩπúÅ°ΩŸï»Èâúµ›°•—îΩl¿∏¿‘’tà(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅıÅÙ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîıÌÅù…•êÅ†¥ƒƒÅ‹¥ƒƒÅÕ°…•π¨¥¿Å¡±Öçîµ•—ïµÃµçïπ—ï»Å…Ω’πëïê¥…·∞ÅâΩ…ëï»Å—…ÖπÕ•—•Ω∏ÄëÌÖç—•ŸîÄ¸ÄââΩ…ëï»µùΩ±êº»‡ÅâúµùΩ±êºƒÿÅ—ï·–µùΩ±êàÄËÄââΩ…ëï»µ›°•—îºƒ¿Åâúµ›°•—îΩl¿∏¿—tÅ—ï·–µùΩ±êâıÅÙ¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ%çΩ∏Åç±ÖÕÕ9ÖµîÙâ†¥‘Å‹¥‘Å—…ÖπÕ•—•Ω∏Åù…Ω’¿µ°ΩŸï»Ëµ…Ω—Ö—î¥ÿàÄº¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙâµ•∏µ‹¥¿Åô±ï‡¥ƒà¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙââ±Ωç¨Å—…’πçÖ—îÅôΩπ–µâ±Öç¨Å—ï·–µ›°•—îà˘Ì—…ÖπÕ±Ö—î°•—ï¥π—•—±î•ÙΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙâµ–¥ƒÅâ±Ωç¨Å—…’πçÖ—îÅ—ï·–µ·ÃÅ—ï·–µëÃµ—ï·–º–ÿà˘Ì—…ÖπÕ±Ö—î°•—ï¥π—Â¡î•ÙÉ
‹ÅÌ—…ÖπÕ±Ö—î°•—ï¥πçΩπ—ï·–•ÙΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ	ÖëùîÅ—ΩπîıÌ•—ï¥π≠•πêÄÙÙÙÄâçΩµµÖπêàÄ¸Äââ±’îàÄËÄâπï’—…Ö∞âÙ˘Ì—…ÖπÕ±Ö—î°•—ï¥πÕ—Ö—’Ã•ÙΩ	Öëùî¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩ1•π¨¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ§Ï(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÅÙ•Ù(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄÄÄÄÄ§ÄËÄ†(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâù…•êÅµ•∏µ†¥‡¿Å¡±Öçîµ•—ïµÃµçïπ—ï»Å…Ω’πëïêµëÃµ·∞ÅâΩ…ëï»ÅâΩ…ëï»µëÃµ—Ω≠ï∏µâΩ…ëï»Åâúµ›°•—îΩl¿∏¿ÕtÅ¿¥‡Å—ï·–µçïπ—ï»à¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿ¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒMïÖ…ç†Åç±ÖÕÕ9ÖµîÙâµ‡µÖ’—ºÅ†¥ƒ¿Å‹¥ƒ¿Å—ï·–µùΩ±êàÄº¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ†ÃÅç±ÖÕÕ9ÖµîÙâµ–¥–Å—ï·–µ·∞ÅôΩπ–µâ±Öç¨Å—ï·–µ›°•—îà˘Ì—…ÖπÕ±Ö—î†â9ºÅ…ïÕ’±—ÃÅôΩ’πêà•ÙΩ†Ã¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ¿Åç±ÖÕÕ9ÖµîÙâµ–¥»Å—ï·–µÕ¥Å±ïÖë•πú¥ÿÅ—ï·–µëÃµ—ï·–º‘–à˘Ì—…ÖπÕ±Ö—î†âQ…‰ÅÕïÖ…ç°•πúÅôΩ»ÅÑÅ¡…Ω©ïç–∞Åïµ¡±ΩÂïî∞Å…ï¡Ω…–∞ÅΩ…ùÖπ•ÈÖ—•Ω∏∞ÅΩ»ÅY=IÅ—ΩΩ∞∏à•ÙΩ¿¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄÄÄÄÄ•Ù(ÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄΩµΩ—•Ω∏πë•ÿ¯(ÄÄÄÄΩµΩ—•Ω∏πë•ÿ¯(ÄÄΩ’—Ω1ΩçÖ±•ÈïëΩπ—ïπ–¯§Ï)Ù()ô’πç—•Ω∏ÅAÖ±ï——ïMïç—•Ω∏°ÏÅ—•—±î∞ÅçΩµµÖπëÃÅÙËÅÏÅ—•—±îËÅÕ—…•πúÏÅçΩµµÖπëÃËÅ—Â¡ïΩòÅçΩµµÖπë%—ïµÃÅÙ§ÅÏ(ÄÅçΩπÕ–ÅÏÅ—…ÖπÕ±Ö—îÅÙÄÙÅ’Õï$ƒ·∏†§Ï(ÄÅ…ï—’…∏Ä†Ò’—Ω1ΩçÖ±•ÈïëΩπ—ïπ–¯(ÄÄÄÄÒë•ÿ¯(ÄÄÄÄÄÄÒ¿Åç±ÖÕÕ9ÖµîÙâµà¥»Å—ï·–µ·ÃÅôΩπ–µâ±Öç¨Å’¡¡ï…çÖÕîÅ—…Öç≠•πúµl¿∏ƒ—ïµtÅ—ï·–µëÃµ—ï·–º–»à˘Ì—•—±ïÙΩ¿¯(ÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâù…•êÅùÖ¿¥»à¯(ÄÄÄÄÄÄÄÅÌçΩµµÖπëÃπµÖ¿†°çΩµµÖπê§ÄÙ¯ÅÏ(ÄÄÄÄÄÄÄÄÄÅçΩπÕ–Å%çΩ∏ÄÙÅçΩµµÖπêπ•çΩ∏Ï(ÄÄÄÄÄÄÄÄÄÅ…ï—’…∏Ä†(ÄÄÄÄÄÄÄÄÄÄÄÄÒ1•π¨Å≠ï‰ıÌçΩµµÖπêπ—•—±ïÙÅ°…ïòıÌçΩµµÖπêπ°…ïôÙÅç±ÖÕÕ9ÖµîÙâù…Ω’¿Åô±ï‡Å•—ïµÃµçïπ—ï»ÅùÖ¿¥»Å…Ω’πëïêµëÃµµêÅâΩ…ëï»ÅâΩ…ëï»µëÃµ—Ω≠ï∏µâΩ…ëï»Åâúµ›°•—îΩl¿∏¿ÕtÅ¡‡¥ÃÅ¡‰¥»Å—ï·–µÕ¥ÅôΩπ–µâΩ±êÅ—…ÖπÕ•—•Ω∏Å°ΩŸï»ÈâΩ…ëï»µëÃµ—Ω≠ï∏µùΩ±êº»¿Å°ΩŸï»Èâúµ›°•—îΩl¿∏¿‘’tà¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ%çΩ∏Åç±ÖÕÕ9ÖµîÙâ†¥–Å‹¥–ÅÕ°…•π¨¥¿Å—ï·–µùΩ±êÅ—…ÖπÕ•—•Ω∏Åù…Ω’¿µ°ΩŸï»Ëµ…Ω—Ö—î¥ÿàÄº¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙâ—…’πçÖ—îà˘Ì—…ÖπÕ±Ö—î°çΩµµÖπêπ—•—±î•ÙΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄΩ1•π¨¯(ÄÄÄÄÄÄÄÄÄÄ§Ï(ÄÄÄÄÄÄÄÅÙ•Ù(ÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄΩë•ÿ¯(ÄÄΩ’—Ω1ΩçÖ±•ÈïëΩπ—ïπ–¯§Ï)Ù()ô’πç—•Ω∏Å9Ω—•ô•çÖ—•ΩπÕAÖπï∞°Ï(ÄÅ…ïÖë%ëÃ∞(ÄÅΩπ5Ö…≠±±IïÖê∞(ÄÅΩπQΩùù±ïIïÖê)ÙËÅÏ(ÄÅ…ïÖë%ëÃËÅπ’µâï…mtÏ(ÄÅΩπ5Ö…≠±±IïÖêËÄ†§ÄÙ¯ÅŸΩ•êÏ(ÄÅΩπQΩùù±ïIïÖêËÄ°•êËÅπ’µâï»§ÄÙ¯ÅŸΩ•êÏ)Ù§ÅÏ(ÄÅçΩπÕ–ÅÏÅë•ç—•ΩπÖ…‰ËÅ–∞Åë•»ÅÙÄÙÅ’Õï$ƒ·∏†§Ï(ÄÅçΩπÕ–Åmô•±—ï»∞ÅÕï—•±—ï…tÄÙÅ’ÕïM—Ö—î†â±∞à§Ï(ÄÅçΩπÕ–ÅπΩ—•ô•çÖ—•ΩπÃÄÙÅëïµΩ9Ω—•ô•çÖ—•Ωπ%—ïµÃπô•±—ï»†°•—ï¥§ÄÙ¯ÅÏ(ÄÄÄÅçΩπÕ–Å’π…ïÖêÄÙÅ•—ï¥π’π…ïÖêÄòòÄÖ…ïÖë%ëÃπ•πç±’ëïÃ°•—ï¥π•ê§Ï(ÄÄÄÅ•òÄ°ô•±—ï»ÄÙÙÙÄâUπ…ïÖêà§Å…ï—’…∏Å’π…ïÖêÏ(ÄÄÄÅ•òÄ°ô•±—ï»ÄÙÙÙÄâ!•ù†Å¡…•Ω…•—‰à§Å…ï—’…∏Å•—ï¥π¡…•Ω…•—‰ÄÙÙÙÄâ!•ù†àÏ(ÄÄÄÅ…ï—’…∏Å—…’îÏ(ÄÅÙ§Ï(ÄÅçΩπÕ–Å’π…ïÖëΩ’π–ÄÙÅëïµΩ9Ω—•ô•çÖ—•Ωπ%—ïµÃπô•±—ï»†°•—ï¥§ÄÙ¯Å•—ï¥π’π…ïÖêÄòòÄÖ…ïÖë%ëÃπ•πç±’ëïÃ°•—ï¥π•ê§§π±ïπù—†Ï((ÄÅ…ï—’…∏Ä†Ò’—Ω1ΩçÖ±•ÈïëΩπ—ïπ–¯(ÄÄÄÄÒµΩ—•Ω∏πë•ÿ(ÄÄÄÄÄÅ•π•—•Ö∞ıÌÏÅΩ¡Öç•—‰ËÄ¿∞Å‰ËÄƒ¿∞ÅÕçÖ±îËÄ¿∏‰‡ÅıÙ(ÄÄÄÄÄÅÖπ•µÖ—îıÌÏÅΩ¡Öç•—‰ËÄƒ∞Å‰ËÄ¿∞ÅÕçÖ±îËÄƒÅıÙ(ÄÄÄÄÄÅï·•–ıÌÏÅΩ¡Öç•—‰ËÄ¿∞Å‰ËÄƒ¿∞ÅÕçÖ±îËÄ¿∏‰‡ÅıÙ(ÄÄÄÄÄÅç±ÖÕÕ9ÖµîıÌÅÖâÕΩ±’—îÅ—Ω¿¥ƒ»ÅË¥‘¿Å‹µmµ•∏†–»¡¡‡±çÖ±å†ƒ¿¡Ÿ‹¥ƒ∏’…ï¥§•tÅΩŸï…ô±Ω‹µ°•ëëï∏Å…Ω’πëïêµëÃµ·∞ÅâΩ…ëï»ÅâΩ…ëï»µëÃµ—Ω≠ï∏µâΩ…ëï»ÅâúµëÃµ—Ω≠ï∏µÕïçΩπëÖ…‰º‰‡Å—ï·–µëÃµ—Ω≠ï∏µ—ï·–ÅÕ°ÖëΩ‹µëÃµ±úÅâÖç≠ë…Ω¿µâ±’»µ·∞ÄëÌë•»ÄÙÙÙÄâ…—∞àÄ¸Äâ±ïô–¥¿àÄËÄâ…•ù°–¥¿âıÅÙ(ÄÄÄÄ¯(ÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙââΩ…ëï»µàÅâΩ…ëï»µ›°•—îºƒ¿Å¿¥–à¯(ÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâô±ï‡Å•—ïµÃµçïπ—ï»Å©’Õ—•ô‰µâï—›ïï∏ÅùÖ¿¥Ãà¯(ÄÄÄÄÄÄÄÄÄÄÒë•ÿ¯(ÄÄÄÄÄÄÄÄÄÄÄÄÒ†»Åç±ÖÕÕ9ÖµîÙâôΩπ–µâ±Öç¨à˘Ì–πçΩµµΩ∏ππΩ—•ô•çÖ—•ΩπÕÙΩ†»¯(ÄÄÄÄÄÄÄÄÄÄÄÄÒ¿Åç±ÖÕÕ9ÖµîÙâµ–¥ƒÅ—ï·–µ·ÃÅ—ï·–µëÃµ—ï·–º–‡à˘Ì’π…ïÖëΩ’π—ÙÅ’π…ïÖêÅÖç…ΩÕÃÅ¡…Ω©ïç—ÃÅÖπêÅΩ…ùÖπ•ÈÖ—•ΩπÃΩ¿¯(ÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄÄÄÒ	ÖëùîÅ—ΩπîÙâùΩ±êà˘Ì’π…ïÖëΩ’π—ÙΩ	Öëùî¯(ÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâµ–¥–Åô±ï‡Åô±ï‡µ›…Ö¿ÅùÖ¿¥»à¯(ÄÄÄÄÄÄÄÄÄÅÌlâ±∞à∞ÄâUπ…ïÖêà∞Äâ!•ù†Å¡…•Ω…•—‰âtπµÖ¿†°•—ï¥§ÄÙ¯Ä†(ÄÄÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å≠ï‰ıÌ•—ïµÙÅ—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÏ†§ÄÙ¯ÅÕï—•±—ï»°•—ï¥•ÙÅç±ÖÕÕ9ÖµîıÌÅ…Ω’πëïêµô’±∞ÅâΩ…ëï»Å¡‡¥ÃÅ¡‰¥ƒÅ—ï·–µ·ÃÅôΩπ–µâ±Öç¨Å—…ÖπÕ•—•Ω∏ÄëÌô•±—ï»ÄÙÙÙÅ•—ï¥Ä¸ÄââΩ…ëï»µùΩ±êº–¿ÅâúµùΩ±êºƒ–Å—ï·–µùΩ±êàÄËÄââΩ…ëï»µ›°•—îºƒ¿Åâúµ›°•—îΩl¿∏¿—tÅ—ï·–µëÃµ—ï·–º‘–Å°ΩŸï»Èâúµ›°•—îΩl¿∏¿›tâıÅÙ¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÅÌ•—ïµÙ(ÄÄÄÄÄÄÄÄÄÄÄÄΩâ’——Ω∏¯(ÄÄÄÄÄÄÄÄÄÄ§•Ù(ÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÌΩπ5Ö…≠±±IïÖëÙÅç±ÖÕÕ9ÖµîÙâµÃµÖ’—ºÅ…Ω’πëïêµô’±∞ÅâΩ…ëï»ÅâΩ…ëï»µ›°•—îºƒ¿Åâúµ›°•—îΩl¿∏¿—tÅ¡‡¥ÃÅ¡‰¥ƒÅ—ï·–µ·ÃÅôΩπ–µâ±Öç¨Å—ï·–µëÃµ—ï·–º‘–Å—…ÖπÕ•—•Ω∏Å°ΩŸï»Èâúµ›°•—îΩl¿∏¿›tà¯(ÄÄÄÄÄÄÄÄÄÄÄÅ5Ö…¨ÅÖ±∞Å…ïÖê(ÄÄÄÄÄÄÄÄÄÄΩâ’——Ω∏¯(ÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâµÖ‡µ†µl‹¡Ÿ°tÅΩŸï…ô±Ω‹µ‰µÖ’—ºÅ¿¥–à¯(ÄÄÄÄÄÄÄÅÌπΩ—•ô•çÖ—•ΩπÃπ±ïπù—†Ä¸Ä†(ÄÄÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâù…•êÅùÖ¿¥»à¯(ÄÄÄÄÄÄÄÄÄÄÄÅÌπΩ—•ô•çÖ—•ΩπÃπµÖ¿†°•—ï¥§ÄÙ¯ÅÏ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÅçΩπÕ–Å’π…ïÖêÄÙÅ•—ï¥π’π…ïÖêÄòòÄÖ…ïÖë%ëÃπ•πç±’ëïÃ°•—ï¥π•ê§Ï(ÄÄÄÄÄÄÄÄÄÄÄÄÄÅçΩπÕ–Å—ΩπîÄÙÅ•—ï¥π¡…•Ω…•—‰ÄÙÙÙÄâ!•ù†àÄ¸ÄâëÖπùï»àÄËÅ•—ï¥π¡…•Ω…•—‰ÄÙÙÙÄâ5ïë•’¥àÄ¸Äâ›Ö…π•πúàÄËÄâπï’—…Ö∞àÏ(ÄÄÄÄÄÄÄÄÄÄÄÄÄÅ…ï—’…∏Ä†(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å≠ï‰ıÌ•—ï¥π•ëÙÅ—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÏ†§ÄÙ¯ÅΩπQΩùù±ïIïÖê°•—ï¥π•ê•ÙÅç±ÖÕÕ9ÖµîıÌÅ…Ω’πëïêµëÃµµêÅâΩ…ëï»Å¿¥ÃÅ—ï·–µÕ—Ö…–Å—…ÖπÕ•—•Ω∏Å°ΩŸï»Èâúµ›°•—îΩl¿∏¿‘’tÄëÌ’π…ïÖêÄ¸ÄââΩ…ëï»µëÃµ—Ω≠ï∏µùΩ±êº»–ÅâúµëÃµ—Ω≠ï∏µùΩ±êºƒ¿àÄËÄââΩ…ëï»µëÃµ—Ω≠ï∏µâΩ…ëï»Åâúµ›°•—îΩl¿∏¿ÕtâıÅÙ¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâô±ï‡Å•—ïµÃµÕ—Ö…–ÅùÖ¿¥Ãà¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîıÌÅµ–¥ƒÅ†¥»∏‘Å‹¥»∏‘ÅÕ°…•π¨¥¿Å…Ω’πëïêµô’±∞ÄëÌ’π…ïÖêÄ¸ÄâÖπ•µÖ—îµ¡’±ÕîÅâúµùΩ±êàÄËÄââúµ›°•—îºƒ‡âıÅÙÄº¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙâµ•∏µ‹¥¿Åô±ï‡¥ƒà¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙâô±ï‡Åô±ï‡µ›…Ö¿Å•—ïµÃµçïπ—ï»ÅùÖ¿¥»à¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙâôΩπ–µâ±Öç¨Å—ï·–µ›°•—îà˘Ì•—ï¥π—•—±ïÙΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ	ÖëùîÅ—ΩπîıÌ—ΩπïÙ˘Ì•—ï¥π¡…•Ω…•—ÂÙΩ	Öëùî¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙâµ–¥ƒÅâ±Ωç¨Å—ï·–µ·ÃÅ±ïÖë•πú¥‘Å—ï·–µëÃµ—ï·–º‘‡à˘Ì•—ï¥πµïÕÕÖùïÙΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙâµ–¥»Åô±ï‡Åô±ï‡µ›…Ö¿Å•—ïµÃµçïπ—ï»ÅùÖ¿¥»Å—ï·–µlƒ≈¡·tÅôΩπ–µâΩ±êÅ—ï·–µëÃµ—ï·–º–»à¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏˘Ì•—ï¥πçÖ—ïùΩ…ÂÙΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏˚
‹ΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏˘Ì•—ï¥πçΩπ—ï·—ÙΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏˚
‹ΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏˘Ì•—ï¥π—•µïÕ—Öµ¡ÙΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒÕ¡Ö∏Åç±ÖÕÕ9ÖµîÙâ—ï·–µ·ÃÅôΩπ–µâ±Öç¨Å—ï·–µùΩ±êà˘Ì•—ï¥πÖç—•ΩπÙΩÕ¡Ö∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄΩâ’——Ω∏¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄ§Ï(ÄÄÄÄÄÄÄÄÄÄÄÅÙ•Ù(ÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄ§ÄËÄ†(ÄÄÄÄÄÄÄÄÄÄÒë•ÿÅç±ÖÕÕ9ÖµîÙâù…•êÅµ•∏µ†¥‘ÿÅ¡±Öçîµ•—ïµÃµçïπ—ï»Å…Ω’πëïê¥…·∞ÅâΩ…ëï»ÅâΩ…ëï»µ›°•—îºƒ¿Åâúµ›°•—îΩl¿∏¿—tÅ¿¥ÿÅ—ï·–µçïπ—ï»à¯(ÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿ¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ	ï±∞Åç±ÖÕÕ9ÖµîÙâµ‡µÖ’—ºÅ†¥‰Å‹¥‰Å—ï·–µùΩ±êàÄº¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ†ÃÅç±ÖÕÕ9ÖµîÙâµ–¥–ÅôΩπ–µâ±Öç¨Å—ï·–µ›°•—îà˘9ºÅπΩ—•ô•çÖ—•ΩπÃΩ†Ã¯(ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÒ¿Åç±ÖÕÕ9ÖµîÙâµ–¥»Å—ï·–µÕ¥Å±ïÖë•πú¥ÿÅ—ï·–µëÃµ—ï·–º‘–à˘Q°•ÃÅô•±—ï»Å•ÃÅç±ïÖ»ÅôΩ»ÅπΩ‹∏Ω¿¯(ÄÄÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄÄÄÄÄ•Ù(ÄÄÄÄÄÄΩë•ÿ¯(ÄÄÄÄΩµΩ—•Ω∏πë•ÿ¯(ÄÄΩ’—Ω1ΩçÖ±•ÈïëΩπ—ïπ–¯§Ï)Ù()ô’πç—•Ω∏Å±ΩÖ—•πùAÖπï∞°ÏÅç°•±ë…ï∏∞Åç±ÖÕÕ9ÖµîÄÙÄààÅÙËÅÏÅç°•±ë…ï∏ËÅIïÖç–πIïÖç—9ΩëîÏÅç±ÖÕÕ9Öµî¸ËÅÕ—…•πúÅÙ§ÅÏ(ÄÅ…ï—’…∏Ä†Ò’—Ω1ΩçÖ±•ÈïëΩπ—ïπ–¯(ÄÄÄÄÒµΩ—•Ω∏πë•ÿÅ•π•—•Ö∞ıÌÏÅΩ¡Öç•—‰ËÄ¿∞Å‰ËÄƒ¿∞ÅÕçÖ±îËÄ¿∏‰‡ÅıÙÅÖπ•µÖ—îıÌÏÅΩ¡Öç•—‰ËÄƒ∞Å‰ËÄ¿∞ÅÕçÖ±îËÄƒÅıÙÅï·•–ıÌÏÅΩ¡Öç•—‰ËÄ¿∞Å‰ËÄƒ¿∞ÅÕçÖ±îËÄ¿∏‰‡ÅıÙÅç±ÖÕÕ9ÖµîıÌÅÖâÕΩ±’—îÅ—Ω¿¥ƒ»ÅË¥‘¿Å‹¥‡¿Å…Ω’πëïêµëÃµ·∞ÅâΩ…ëï»ÅâΩ…ëï»µëÃµ—Ω≠ï∏µâΩ…ëï»ÅâúµëÃµ—Ω≠ï∏µÕïçΩπëÖ…‰º‰‡Å¿¥–Å—ï·–µëÃµ—Ω≠ï∏µ—ï·–ÅÕ°ÖëΩ‹µëÃµ±úÅâÖç≠ë…Ω¿µâ±’»µ·∞ÄëÌç±ÖÕÕ9ÖµïıÅÙ¯(ÄÄÄÄÄÅÌç°•±ë…ïπÙ(ÄÄÄÄΩµΩ—•Ω∏πë•ÿ¯(ÄÄΩ’—Ω1ΩçÖ±•ÈïëΩπ—ïπ–¯§Ï)Ù(4(4(