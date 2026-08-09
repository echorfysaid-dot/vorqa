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
  { href: "/tools", key: "tools", label: "AI Tools", icon: WandSparkles },
  { href: "/rfq", key: "rfq", label: "RFQs", icon: FileSearch },
  { href: "/quotations", key: "quotations", label: "Quotations", icon: ReceiptText },
  { href: "/contracts", key: "contracts", label: "Contracts", icon: FileSignature },
  { href: "/billing", key: "billing", label: "Billing", icon: CreditCard },
  { href: "/admin", key: "admin", label: "Admin", icon: ShieldCheck },
  { href: "/notifications", key: "notifications", label: "Notifications", icon: Bell },
  { href: "/projects#knowledge", key: "knowledge", label: "Knowledge", icon: CalendarDays },
  { href: "/saved#documents", key: "documents", label: "Documents", icon: UserRound },
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
  { title: "Nadia Benali", type: "Employee", context: "Engineering Â· Atlas", status: "Active", href: "/organizations/atlas", icon: UserRound },
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
  { id: 1, category: "Projects", title: "Milestone review due", message: "Luxury Villa Casablanca needs structural frame sign-off today.", timestamp: "8 min ago", priority: "High", unread: true, context: "Atlas Â· PRJ-1048", action: "Open project" },
  { id: 2, category: "Budget", title: "Budget variance detected", message: "Procurement variance increased by 6% on marble package.", timestamp: "24 min ago", priority: "High", unread: true, context: "Atlas Â· Finance", action: "Review budget" },
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
  } : null, [onboarding.profile?.accountType, onboarding.profile?.primaryRole, onboarding.prof÷z¶‰žËkºwµçeÑ”½lÀ¸ÀÍtÀ´ÌÑÉ…¹Í¥Ñ¥½¸¡½Ù•Èé‰½É‘•Èµ‘ÌµÑ½­•¸µ½±¼ÈÀ¡½Ù•Èé‰œµÝ¡¥Ñ”½lÀ¸ÀÔÕtˆø(€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰É¥ ´äÜ´äÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µ‘ÌµÍ´‰œµ‘ÌµÑ½­•¸µ½±¼ÄÈÑ•áÐµ‘ÌµÑ½­•¸µ½±ˆø(€€€€€€€€€€€€€€€€ñ%½¸±…ÍÍ9…µ”ô‰ ´ÐÜ´ÐÑÉ…¹Í¥Ñ¥½¸É½ÕÀµ¡½Ù•ÈèµÉ½Ñ…Ñ”´Øˆ€¼ø(€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰™½¹Ðµ‰±…¬ˆùíÑÉ…¹Í±…Ñ”¡…Ñ¥½¸¹Ñ¥Ñ±”¥ôð½ÍÁ…¸ø(€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€¤ì(€€€€€€€ô¥ô(€€€€€€ð½‘¥Øø(€€€€ð½±½…Ñ¥¹A…¹•°ø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()™Õ¹Ñ¥½¸½µµ…¹‘A…±•ÑÑ”¡ì½¹±½Í”°½¹=Á•¹9½Ñ¥™¥…Ñ¥½¹Ìôèì½¹±½Í”è€ ¤€ôøÙ½¥ì½¹=Á•¹9½Ñ¥™¥…Ñ¥½¹Ìè€ ¤€ôøÙ½¥ô¤ì(€½¹ÍÐÉ½ÕÑ•È€ôÕÍ•I½ÕÑ•È ¤ì(€½¹ÍÐìÑÉ…¹Í±…Ñ”ô€ôÕÍ•$Äá¸ ¤ì(€½¹ÍÐmÅÕ•Éä°Í•ÑEÕ•Éåt€ôÕÍ•MÑ…Ñ” ˆˆ¤ì(€½¹ÍÐmÍ•±•Ñ•‘%¹‘•à°Í•ÑM•±•Ñ•‘%¹‘•át€ôÕÍ•MÑ…Ñ” À¤ì(€½¹ÍÐ¹½Éµ…±¥é•‘EÕ•Éä€ôÅÕ•Éä¹Ñ½1½Ý•É…Í” ¤ì(€½¹ÍÐ™¥±Ñ•É•‘M•…É €ô±½‰…±M•…É¡%Ñ•µÌ¹™¥±Ñ•È ¡¥Ñ•´¤€ôø€‘í¥Ñ•´¹Ñ¥Ñ±•ô€‘í¥Ñ•´¹ÑåÁ•ô€‘í¥Ñ•´¹½¹Ñ•áÑô€‘í¥Ñ•´¹ÍÑ…ÑÕÍõ€¹Ñ½1½Ý•É…Í” ¤¹¥¹±Õ‘•Ì¡¹½Éµ…±¥é•‘EÕ•Éä¤¤ì(€½¹ÍÐ™¥±Ñ•É•‘½µµ…¹‘Ì€ô½µµ…¹‘%Ñ•µÌ¹™¥±Ñ•È ¡¥Ñ•´¤€ôø€‘í¥Ñ•´¹Ñ¥Ñ±•ô€‘í¥Ñ•´¹…Ñ•½Éåõ€¹Ñ½1½Ý•É…Í” ¤¹¥¹±Õ‘•Ì¡¹½Éµ…±¥é•‘EÕ•Éä¤¤ì(€½¹ÍÐÁ…±•ÑÑ•%Ñ•µÌ€ôl(€€€€¸¸¹™¥±Ñ•É•‘½µµ…¹‘Ì¹µ…À ¡¥Ñ•´¤€ôø€¡ì€¸¸¹¥Ñ•´°­¥¹è€‰½µµ…¹ˆ…Ì½¹ÍÐ°ÑåÁ”è¥Ñ•´¹…Ñ•½Éä°½¹Ñ•áÐè€‰½µµ…¹Á…±•ÑÑ”ˆ°ÍÑ…ÑÕÌè€‰I•…‘äˆô¤¤°(€€€€¸¸¹™¥±Ñ•É•‘M•…É ¹µ…À ¡¥Ñ•´¤€ôø€¡ì€¸¸¹¥Ñ•´°­¥¹è€‰Í•…É ˆ…Ì½¹ÍÐô¤¤(€tì(€½¹ÍÐÉ••¹Ñ½µµ…¹‘Ì€ô½µµ…¹‘%Ñ•µÌ¹Í±¥” À°€Ì¤ì(€½¹ÍÐÍÕ•ÍÑ•‘½µµ…¹‘Ì€ô½µµ…¹‘%Ñ•µÌ¹Í±¥” Ì°€Ü¤ì((€ÕÍ•™™•Ð  ¤€ôøì(€€€Í•ÑM•±•Ñ•‘%¹‘•à À¤ì(€ô°mÅÕ•Éåt¤ì((€™Õ¹Ñ¥½¸½Á•¹M•±•Ñ• ¤ì(€€€½¹ÍÐÍ•±•Ñ•€ôÁ…±•ÑÑ•%Ñ•µÍmÍ•±•Ñ•‘%¹‘•átì(€€€¥˜€ …Í•±•Ñ•¤É•ÑÕÉ¸ì(€€€¥˜€¡Í•±•Ñ•¹Ñ¥Ñ±”€ôôô€‰Y¥•Ü¹½Ñ¥™¥…Ñ¥½¹Ìˆ¤ì(€€€€€½¹=Á•¹9½Ñ¥™¥…Ñ¥½¹Ì ¤ì(€€€€€½¹±½Í” ¤ì(€€€€€É•ÑÕÉ¸ì(€€€ô(€€€É½ÕÑ•È¹ÁÕÍ ¡Í•±•Ñ•¹¡É•˜¤ì(€€€½¹±½Í” ¤ì(€ô((€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø(€€€€ñµ½Ñ¥½¸¹‘¥Ø±…ÍÍ9…µ”ô‰™¥á•¥¹Í•Ð´ÀèµlÄÈÁt‰œµ‰±…¬¼ÜÈÀ´Ì‰…­‘É½Àµ‰±ÕÈµá°Í´éÀ´Øˆ¥¹¥Ñ¥…°õíì½Á…¥Ñäè€Àõô…¹¥µ…Ñ”õíì½Á…¥Ñäè€Äõô•á¥Ðõíì½Á…¥Ñäè€Àõôø(€€€€€€ñµ½Ñ¥½¸¹‘¥Ø(€€€€€€€É½±”ô‰‘¥…±½œˆ(€€€€€€€…É¥„µµ½‘…°ô‰ÑÉÕ”ˆ(€€€€€€€…É¥„µ±…‰•°õíÑÉ…¹Í±…Ñ” ‰±½‰…°Í•…É …¹½µµ…¹Á…±•ÑÑ”ˆ¥ô(€€€€€€€…É¥„µ‘•ÍÉ¥‰•‘‰äô‰½µµ…¹µÁ…±•ÑÑ”µ¡•±Àˆ(€€€€€€€¥¹¥Ñ¥…°õíì½Á…¥Ñäè€À°äè€ÈÀ°Í…±”è€À¸äàõô(€€€€€€€…¹¥µ…Ñ”õíì½Á…¥Ñäè€Ä°äè€À°Í…±”è€Äõô(€€€€€€€•á¥Ðõíì½Á…¥Ñäè€À°äè€Äà°Í…±”è€À¸äàõô(€€€€€€€±…ÍÍ9…µ”ô‰µàµ…ÕÑ¼™±•à µmµ¥¸ ÜØÁÁà±…±Œ ÄÀÁÙ ´Ä¸ÕÉ•´¤¥tµ…àµÜ´Ñá°™±•àµ½°½Ù•É™±½Üµ¡¥‘‘•¸É½Õ¹‘•µ‘Ì´Éá°‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµ‘ÌµÑ½­•¸µÍ•½¹‘…Éä¼äàÍ¡…‘½Üµ‘Ìµ±œÉ¥¹œ´ÄÉ¥¹œµÝ¡¥Ñ”½lÀ¸ÀÈÕt‰…­‘É½Àµ‰±ÕÈµá°Í´é µmµ¥¸ ÜØÁÁà±…±Œ ÄÀÁÙ ´ÍÉ•´¤¥tˆ(€€€€€€€½¹-•å½Ý¸õì¡•Ù•¹Ð¤€ôøì(€€€€€€€€€¥˜€¡•Ù•¹Ð¹­•ä€ôôô€‰Í…Á”ˆ¤½¹±½Í” ¤ì(€€€€€€€€€¥˜€¡•Ù•¹Ð¹­•ä€ôôô€‰ÉÉ½Ý½Ý¸ˆ¤ì(€€€€€€€€€€€•Ù•¹Ð¹ÁÉ•Ù•¹Ñ•™…Õ±Ð ¤ì(€€€€€€€€€€€Í•ÑM•±•Ñ•‘%¹‘•à ¡Ù…±Õ”¤€ôø5…Ñ ¹µ¥¸¡Ù…±Õ”€¬€Ä°5…Ñ ¹µ…à À°Á…±•ÑÑ•%Ñ•µÌ¹±•¹Ñ €´€Ä¤¤¤ì(€€€€€€€€€ô(€€€€€€€€€¥˜€¡•Ù•¹Ð¹­•ä€ôôô€‰ÉÉ½ÝUÀˆ¤ì(€€€€€€€€€€€•Ù•¹Ð¹ÁÉ•Ù•¹Ñ•™…Õ±Ð ¤ì(€€€€€€€€€€€Í•ÑM•±•Ñ•‘%¹‘•à ¡Ù…±Õ”¤€ôø5…Ñ ¹µ…à¡Ù…±Õ”€´€Ä°€À¤¤ì(€€€€€€€€€ô(€€€€€€€€€¥˜€¡•Ù•¹Ð¹­•ä€ôôô€‰¹Ñ•Èˆ¤ì(€€€€€€€€€€€•Ù•¹Ð¹ÁÉ•Ù•¹Ñ•™…Õ±Ð ¤ì(€€€€€€€€€€€½Á•¹M•±•Ñ• ¤ì(€€€€€€€€€ô(€€€€€€€õô(€€€€€€ø(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‰½É‘•Èµˆ‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀÀ´Ðˆø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È…À´Ìˆø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•àµ¥¸µÜ´À™±•à´Ä¥Ñ•µÌµ•¹Ñ•È…À´ÌÉ½Õ¹‘•µ‘Ìµµ‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ½±¼ÈÈ‰œµ‰±…¬¼ÈàÁà´ÐÁä´ÌÍ¡…‘½Üµ¥¹¹•ÈÍ¡…‘½Üµ‰±…¬¼ÈÀˆø(€€€€€€€€€€€€€€ñM•…É ±…ÍÍ9…µ”ô‰ ´ÔÜ´ÔÍ¡É¥¹¬´ÀÑ•áÐµ½±ˆ€¼ø(€€€€€€€€€€€€€€ñ¥¹ÁÕÐ(€€€€€€€€€€€€€€€…ÕÑ½½ÕÌ(€€€€€€€€€€€€€€€Ù…±Õ”õíÅÕ•Éåô(€€€€€€€€€€€€€€€½¹¡…¹”õì¡•Ù•¹Ð¤€ôøÍ•ÑEÕ•Éä¡•Ù•¹Ð¹Ñ…É•Ð¹Ù…±Õ”¥ô(€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Üµ™Õ±°‰œµÑÉ…¹ÍÁ…É•¹ÐÑ•áÐµ‰…Í”™½¹Ðµ‰½±Ñ•áÐµ‘ÌµÑ•áÐ½ÕÑ±¥¹”µ¹½¹”Á±…•¡½±‘•ÈéÑ•áÐµ‘ÌµÑ•áÐ¼ÌØˆ(€€€€€€€€€€€€€€€Á±…•¡½±‘•ÈõíÑÉ…¹Í±…Ñ” ‰M•…É ÁÉ½©•ÑÌ°½É…¹¥é…Ñ¥½¹Ì°Á•½Á±”°É•Á½ÉÑÌ°Ñ½½±Ì¸¸¸ˆ¥ô(€€€€€€€€€€€€€€€…É¥„µ±…‰•°õíÑÉ…¹Í±…Ñ” ‰M•…É Y½ÉÅ„Ý½É­ÍÁ…”ˆ¥ô(€€€€€€€€€€€€€€€…É¥„µ½¹ÑÉ½±Ìô‰½µµ…¹µÁ…±•ÑÑ”µÉ•ÍÕ±ÑÌˆ(€€€€€€€€€€€€€€€…É¥„µ…Ñ¥Ù•‘•Í•¹‘…¹ÐõíÁ…±•ÑÑ•%Ñ•µÍmÍ•±•Ñ•‘%¹‘•át€ü½µµ…¹µÁ…±•ÑÑ”µÉ•ÍÕ±Ð´‘íÍ•±•Ñ•‘%¹‘•áõ€€èÕ¹‘•™¥¹•‘ô(€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€ñ-•å‰½…É‘!¥¹Ð­•åÌõíl‰ÍŒ‰uô±…ÍÍ9…µ”ô‰¡¥‘‘•¸‰œµÝ¡¥Ñ”½lÀ¸ÀÐÕtÍ´é¥¹±¥¹”µ™±•àˆ€¼ø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õí½¹±½Í•ô±…ÍÍ9…µ”ô‰‘Ìµ™½ÕÍ…‰±”É¥ ´ÄÈÜ´ÄÈÍ¡É¥¹¬´ÀÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•´Éá°‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀ‰œµÝ¡¥Ñ”½lÀ¸ÀÔÕtÑ•áÐµ‘ÌµÑ•áÐ¼ÔàÑÉ…¹Í¥Ñ¥½¸¡½Ù•ÈèµÑÉ…¹Í±…Ñ”µä´À¸Ô¡½Ù•Èé‰œµÝ¡¥Ñ”½lÀ¸ÀàÕt¡½Ù•ÈéÑ•áÐµ‘ÌµÑ•áÐˆ…É¥„µ±…‰•°õíÑÉ…¹Í±…Ñ” ‰±½Í”½µµ…¹Á…±•ÑÑ”ˆ¥ôø(€€€€€€€€€€€€€€ñ¡•ÙÉ½¹½Ý¸±…ÍÍ9…µ”ô‰ ´ÔÜ´ÔÉ½Ñ…Ñ”´ÄàÀˆ€¼ø(€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€ð½‘¥Øø((€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É¥µ¥¸µ ´À™±•à´Ä…À´À±œéÉ¥µ½±ÌµlÈØÁÁá}µ¥¹µ…à À°Å™È¥tˆø(€€€€€€€€€€ñ…Í¥‘”±…ÍÍ9…µ”ô‰¡¥‘‘•¸‰½É‘•Èµ”‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀ‰œµÝ¡¥Ñ”½lÀ¸ÀÄátÀ´Ð±œé‰±½¬ˆø(€€€€€€€€€€€€ñA…±•ÑÑ•M•Ñ¥½¸Ñ¥Ñ±”õíÑÉ…¹Í±…Ñ” ‰I••¹Ð½µµ…¹‘Ìˆ¥ô½µµ…¹‘ÌõíÉ••¹Ñ½µµ…¹‘Íô€¼ø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µÐ´Ôˆø(€€€€€€€€€€€€€€ñA…±•ÑÑ•M•Ñ¥½¸Ñ¥Ñ±”õíÑÉ…¹Í±…Ñ” ‰MÕ•ÍÑ•½µµ…¹‘Ìˆ¥ô½µµ…¹‘ÌõíÍÕ•ÍÑ•‘½µµ…¹‘Íô€¼ø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€ð½…Í¥‘”ø((€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ¥¸µ ´À½Ù•É™±½Üµäµ…ÕÑ¼À´Ðˆø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µˆ´Ì™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ‰•ÑÝ••¸…À´Ìˆø(€€€€€€€€€€€€€€ñ‘¥Ø¥ô‰½µµ…¹µÁ…±•ÑÑ”µ¡•±Àˆø(€€€€€€€€€€€€€€€€ñ	…‘”Ñ½¹”ô‰½±ˆùíÑÉ…¹Í±…Ñ” ‰±½‰…°‘¥Í½Ù•Éäˆ¥ôð½	…‘”ø(€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´ÈÑ•áÐµÍ´Ñ•áÐµ‘ÌµÑ•áÐ¼ÔÐˆùíÁ…±•ÑÑ•%Ñ•µÌ¹±•¹Ñ¡ôíÑÉ…¹Í±…Ñ” ‰É•ÍÕ±ÑÌ…É½ÍÌY½ÉÅ„ˆ¥ôð½Àø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰¡¥‘‘•¸…À´ÈÑ•áÐµlÄÁÁát™½¹Ðµ‰±…¬Ñ•áÐµ‘ÌµÑ•áÐ¼ÌàÍ´é™±•àˆø(€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰¥¹±¥¹”µ™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÄÉ½Õ¹‘•µ±œ‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀÁà´ÈÁä´Äˆøñ-•å‰½…É‘!¥¹Ð­•åÌõíl‹ŠDˆ°€‹ŠL‰uô±…ÍÍ9…µ”ô‰‰½É‘•È´ÀÀ´Àˆ€¼øíÑÉ…¹Í±…Ñ” ‰9…Ù¥…Ñ”ˆ¥ôð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰¥¹±¥¹”µ™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÄÉ½Õ¹‘•µ±œ‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀÁà´ÈÁä´Äˆøñ-•å‰½…É‘!¥¹Ð­•åÌõíl‰¹Ñ•È‰uô±…ÍÍ9…µ”ô‰‰½É‘•È´ÀÀ´Àˆ€¼øíÑÉ…¹Í±…Ñ” ‰=Á•¸ˆ¥ôð½ÍÁ…¸ø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€€íÁ…±•ÑÑ•%Ñ•µÌ¹±•¹Ñ €ü€ (€€€€€€€€€€€€€€ñ‘¥Ø¥ô‰½µµ…¹µÁ…±•ÑÑ”µÉ•ÍÕ±ÑÌˆÉ½±”ô‰±¥ÍÑ‰½àˆ…É¥„µ±…‰•°õíÑÉ…¹Í±…Ñ” ‰½µµ…¹Á…±•ÑÑ”É•ÍÕ±ÑÌˆ¥ô±…ÍÍ9…µ”ô‰É¥…À´Èˆø(€€€€€€€€€€€€€€€íÁ…±•ÑÑ•%Ñ•µÌ¹µ…À ¡¥Ñ•´°¥¹‘•à¤€ôøì(€€€€€€€€€€€€€€€€€½¹ÍÐ%½¸€ô¥Ñ•´¹¥½¸ì(€€€€€€€€€€€€€€€€€½¹ÍÐ…Ñ¥Ù”€ô¥¹‘•à€ôôôÍ•±•Ñ•‘%¹‘•àì(€€€€€€€€€€€€€€€€€É•ÑÕÉ¸€ (€€€€€€€€€€€€€€€€€€€€ñ1¥¹¬(€€€€€€€€€€€€€€€€€€€€€­•äõí€‘í¥Ñ•´¹­¥¹‘ô´‘í¥Ñ•´¹Ñ¥Ñ±•õô(€€€€€€€€€€€€€€€€€€€€€¥õí½µµ…¹µÁ…±•ÑÑ”µÉ•ÍÕ±Ð´‘í¥¹‘•áõô(€€€€€€€€€€€€€€€€€€€€€É½±”ô‰½ÁÑ¥½¸ˆ(€€€€€€€€€€€€€€€€€€€€€…É¥„µÍ•±•Ñ•õí…Ñ¥Ù•ô(€€€€€€€€€€€€€€€€€€€€€¡É•˜õí¥Ñ•´¹¡É•™ô(€€€€€€€€€€€€€€€€€€€€€½¹±¥¬õì¡•Ù•¹Ð¤€ôøì(€€€€€€€€€€€€€€€€€€€€€€€¥˜€¡¥Ñ•´¹Ñ¥Ñ±”€ôôô€‰Y¥•Ü¹½Ñ¥™¥…Ñ¥½¹Ìˆ¤ì(€€€€€€€€€€€€€€€€€€€€€€€€€•Ù•¹Ð¹ÁÉ•Ù•¹Ñ•™…Õ±Ð ¤ì(€€€€€€€€€€€€€€€€€€€€€€€€€½¹=Á•¹9½Ñ¥™¥…Ñ¥½¹Ì ¤ì(€€€€€€€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€€€€€€€½¹±½Í” ¤ì(€€€€€€€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€€€€€€€½¹5½ÕÍ•¹Ñ•Èõì ¤€ôøÍ•ÑM•±•Ñ•‘%¹‘•à¡¥¹‘•à¥ô(€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”õíÉ½ÕÀ™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÌÉ½Õ¹‘•µ‘Ìµµ‰½É‘•ÈÀ´ÌÑ•áÐµÍÑ…ÉÐÍ¡…‘½ÜµÍ´ÑÉ…¹Í¥Ñ¥½¸€‘ì(€€€€€€€€€€€€€€€€€€€€€€€…Ñ¥Ù”€ü€‰‰½É‘•Èµ‘ÌµÑ½­•¸µ½±¼Ìà‰œµ‘ÌµÑ½­•¸µ½±¼ÄÈˆ€è€‰‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµÝ¡¥Ñ”½lÀ¸ÀÍt¡½Ù•Èé‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•ÈµÍÑÉ½¹œ¡½Ù•Èé‰œµÝ¡¥Ñ”½lÀ¸ÀÔÕtˆ(€€€€€€€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”õíÉ¥ ´ÄÄÜ´ÄÄÍ¡É¥¹¬´ÀÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•´Éá°‰½É‘•ÈÑÉ…¹Í¥Ñ¥½¸€‘í…Ñ¥Ù”€ü€‰‰½É‘•Èµ½±¼Èà‰œµ½±¼ÄØÑ•áÐµ½±ˆ€è€‰‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀ‰œµÝ¡¥Ñ”½lÀ¸ÀÑtÑ•áÐµ½±‰õôø(€€€€€€€€€€€€€€€€€€€€€€€€ñ%½¸±…ÍÍ9…µ”ô‰ ´ÔÜ´ÔÑÉ…¹Í¥Ñ¥½¸É½ÕÀµ¡½Ù•ÈèµÉ½Ñ…Ñ”´Øˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µ¥¸µÜ´À™±•à´Äˆø(€€€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰‰±½¬ÑÉÕ¹…Ñ”™½¹Ðµ‰±…¬Ñ•áÐµÝ¡¥Ñ”ˆùíÑÉ…¹Í±…Ñ”¡¥Ñ•´¹Ñ¥Ñ±”¥ôð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µÐ´Ä‰±½¬ÑÉÕ¹…Ñ”Ñ•áÐµáÌÑ•áÐµ‘ÌµÑ•áÐ¼ÐØˆùíÑÉ…¹Í±…Ñ”¡¥Ñ•´¹ÑåÁ”¥ôƒ
ÜíÑÉ…¹Í±…Ñ”¡¥Ñ•´¹½¹Ñ•áÐ¥ôð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€ñ	…‘”Ñ½¹”õí¥Ñ•´¹­¥¹€ôôô€‰½µµ…¹ˆ€ü€‰‰±Õ”ˆ€è€‰¹•ÕÑÉ…°‰ôùíÑÉ…¹Í±…Ñ”¡¥Ñ•´¹ÍÑ…ÑÕÌ¥ôð½	…‘”ø(€€€€€€€€€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€€€€€€€€€¤ì(€€€€€€€€€€€€€€€ô¥ô(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É¥µ¥¸µ ´àÀÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µ‘Ìµá°‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµÝ¡¥Ñ”½lÀ¸ÀÍtÀ´àÑ•áÐµ•¹Ñ•Èˆø(€€€€€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€€€€€ñM•…É ±…ÍÍ9…µ”ô‰µàµ…ÕÑ¼ ´ÄÀÜ´ÄÀÑ•áÐµ½±ˆ€¼ø(€€€€€€€€€€€€€€€€€€ñ Ì±…ÍÍ9…µ”ô‰µÐ´ÐÑ•áÐµá°™½¹Ðµ‰±…¬Ñ•áÐµÝ¡¥Ñ”ˆùíÑÉ…¹Í±…Ñ” ‰9¼É•ÍÕ±ÑÌ™½Õ¹ˆ¥ôð½ Ìø(€€€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´ÈÑ•áÐµÍ´±•…‘¥¹œ´ØÑ•áÐµ‘ÌµÑ•áÐ¼ÔÐˆùíÑÉ…¹Í±…Ñ” ‰QÉäÍ•…É¡¥¹œ™½È„ÁÉ½©•Ð°•µÁ±½å•”°É•Á½ÉÐ°½É…¹¥é…Ñ¥½¸°½ÈY=IÑ½½°¸ˆ¥ôð½Àø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€¥ô(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€ð½‘¥Øø(€€€€€€ð½µ½Ñ¥½¸¹‘¥Øø(€€€€ð½µ½Ñ¥½¸¹‘¥Øø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()™Õ¹Ñ¥½¸A…±•ÑÑ•M•Ñ¥½¸¡ìÑ¥Ñ±”°½µµ…¹‘ÌôèìÑ¥Ñ±”èÍÑÉ¥¹œì½µµ…¹‘ÌèÑåÁ•½˜½µµ…¹‘%Ñ•µÌô¤ì(€½¹ÍÐìÑÉ…¹Í±…Ñ”ô€ôÕÍ•$Äá¸ ¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø(€€€€ñ‘¥Øø(€€€€€€ñÀ±…ÍÍ9…µ”ô‰µˆ´ÈÑ•áÐµáÌ™½¹Ðµ‰±…¬ÕÁÁ•É…Í”ÑÉ…­¥¹œµlÀ¸ÄÑ•µtÑ•áÐµ‘ÌµÑ•áÐ¼ÐÈˆùíÑ¥Ñ±•ôð½Àø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É¥…À´Èˆø(€€€€€€€í½µµ…¹‘Ì¹µ…À ¡½µµ…¹¤€ôøì(€€€€€€€€€½¹ÍÐ%½¸€ô½µµ…¹¹¥½¸ì(€€€€€€€€€É•ÑÕÉ¸€ (€€€€€€€€€€€€ñ1¥¹¬­•äõí½µµ…¹¹Ñ¥Ñ±•ô¡É•˜õí½µµ…¹¹¡É•™ô±…ÍÍ9…µ”ô‰É½ÕÀ™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÈÉ½Õ¹‘•µ‘Ìµµ‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµÝ¡¥Ñ”½lÀ¸ÀÍtÁà´ÌÁä´ÈÑ•áÐµÍ´™½¹Ðµ‰½±ÑÉ…¹Í¥Ñ¥½¸¡½Ù•Èé‰½É‘•Èµ‘ÌµÑ½­•¸µ½±¼ÈÀ¡½Ù•Èé‰œµÝ¡¥Ñ”½lÀ¸ÀÔÕtˆø(€€€€€€€€€€€€€€ñ%½¸±…ÍÍ9…µ”ô‰ ´ÐÜ´ÐÍ¡É¥¹¬´ÀÑ•áÐµ½±ÑÉ…¹Í¥Ñ¥½¸É½ÕÀµ¡½Ù•ÈèµÉ½Ñ…Ñ”´Øˆ€¼ø(€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰ÑÉÕ¹…Ñ”ˆùíÑÉ…¹Í±…Ñ”¡½µµ…¹¹Ñ¥Ñ±”¥ôð½ÍÁ…¸ø(€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€¤ì(€€€€€€€ô¥ô(€€€€€€ð½‘¥Øø(€€€€ð½‘¥Øø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()™Õ¹Ñ¥½¸9½Ñ¥™¥…Ñ¥½¹ÍA…¹•°¡ì(€É•…‘%‘Ì°(€½¹5…É­±±I•…°(€½¹Q½±•I•…)ôèì(€É•…‘%‘Ìè¹Õµ‰•Émtì(€½¹5…É­±±I•…è€ ¤€ôøÙ½¥ì(€½¹Q½±•I•…è€¡¥è¹Õµ‰•È¤€ôøÙ½¥ì)ô¤ì(€½¹ÍÐì‘¥Ñ¥½¹…ÉäèÐ°‘¥Èô€ôÕÍ•$Äá¸ ¤ì(€½¹ÍÐm™¥±Ñ•È°Í•Ñ¥±Ñ•Ét€ôÕÍ•MÑ…Ñ” ‰±°ˆ¤ì(€½¹ÍÐ¹½Ñ¥™¥…Ñ¥½¹Ì€ô‘•µ½9½Ñ¥™¥…Ñ¥½¹%Ñ•µÌ¹™¥±Ñ•È ¡¥Ñ•´¤€ôøì(€€€½¹ÍÐÕ¹É•…€ô¥Ñ•´¹Õ¹É•…€˜˜€…É•…‘%‘Ì¹¥¹±Õ‘•Ì¡¥Ñ•´¹¥¤ì(€€€¥˜€¡™¥±Ñ•È€ôôô€‰U¹É•…ˆ¤É•ÑÕÉ¸Õ¹É•…ì(€€€¥˜€¡™¥±Ñ•È€ôôô€‰!¥ ÁÉ¥½É¥Ñäˆ¤É•ÑÕÉ¸¥Ñ•´¹ÁÉ¥½É¥Ñä€ôôô€‰!¥ ˆì(€€€É•ÑÕÉ¸ÑÉÕ”ì(€ô¤ì(€½¹ÍÐÕ¹É•…‘½Õ¹Ð€ô‘•µ½9½Ñ¥™¥…Ñ¥½¹%Ñ•µÌ¹™¥±Ñ•È ¡¥Ñ•´¤€ôø¥Ñ•´¹Õ¹É•…€˜˜€…É•…‘%‘Ì¹¥¹±Õ‘•Ì¡¥Ñ•´¹¥¤¤¹±•¹Ñ ì((€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø(€€€€ñµ½Ñ¥½¸¹‘¥Ø(€€€€€¥¹¥Ñ¥…°õíì½Á…¥Ñäè€À°äè€ÄÀ°Í…±”è€À¸äàõô(€€€€€…¹¥µ…Ñ”õíì½Á…¥Ñäè€Ä°äè€À°Í…±”è€Äõô(€€€€€•á¥Ðõíì½Á…¥Ñäè€À°äè€ÄÀ°Í…±”è€À¸äàõô(€€€€€±…ÍÍ9…µ”õí…‰Í½±ÕÑ”Ñ½À´ÄÈè´ÔÀÜµmµ¥¸ ÐÈÁÁà±…±Œ ÄÀÁÙÜ´Ä¸ÕÉ•´¤¥t½Ù•É™±½Üµ¡¥‘‘•¸É½Õ¹‘•µ‘Ìµá°‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµ‘ÌµÑ½­•¸µÍ•½¹‘…Éä¼äàÑ•áÐµ‘ÌµÑ½­•¸µÑ•áÐÍ¡…‘½Üµ‘Ìµ±œ‰…­‘É½Àµ‰±ÕÈµá°€‘í‘¥È€ôôô€‰ÉÑ°ˆ€ü€‰±•™Ð´Àˆ€è€‰É¥¡Ð´À‰õô(€€€€ø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‰½É‘•Èµˆ‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀÀ´Ðˆø(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ‰•ÑÝ••¸…À´Ìˆø(€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€ñ È±…ÍÍ9…µ”ô‰™½¹Ðµ‰±…¬ˆùíÐ¹½µµ½¸¹¹½Ñ¥™¥…Ñ¥½¹Íôð½ Èø(€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´ÄÑ•áÐµáÌÑ•áÐµ‘ÌµÑ•áÐ¼ÐàˆùíÕ¹É•…‘½Õ¹ÑôÕ¹É•……É½ÍÌÁÉ½©•ÑÌ…¹½É…¹¥é…Ñ¥½¹Ìð½Àø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€ñ	…‘”Ñ½¹”ô‰½±ˆùíÕ¹É•…‘½Õ¹Ñôð½	…‘”ø(€€€€€€€€ð½‘¥Øø(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µÐ´Ð™±•à™±•àµÝÉ…À…À´Èˆø(€€€€€€€€€íl‰±°ˆ°€‰U¹É•…ˆ°€‰!¥ ÁÉ¥½É¥Ñä‰t¹µ…À ¡¥Ñ•´¤€ôø€ (€€€€€€€€€€€€ñ‰ÕÑÑ½¸­•äõí¥Ñ•µôÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ•Ñ¥±Ñ•È¡¥Ñ•´¥ô±…ÍÍ9…µ”õíÉ½Õ¹‘•µ™Õ±°‰½É‘•ÈÁà´ÌÁä´ÄÑ•áÐµáÌ™½¹Ðµ‰±…¬ÑÉ…¹Í¥Ñ¥½¸€‘í™¥±Ñ•È€ôôô¥Ñ•´€ü€‰‰½É‘•Èµ½±¼ÐÀ‰œµ½±¼ÄÐÑ•áÐµ½±ˆ€è€‰‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀ‰œµÝ¡¥Ñ”½lÀ¸ÀÑtÑ•áÐµ‘ÌµÑ•áÐ¼ÔÐ¡½Ù•Èé‰œµÝ¡¥Ñ”½lÀ¸ÀÝt‰õôø(€€€€€€€€€€€€€í¥Ñ•µô(€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€¤¥ô(€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õí½¹5…É­±±I•…‘ô±…ÍÍ9…µ”ô‰µÌµ…ÕÑ¼É½Õ¹‘•µ™Õ±°‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀ‰œµÝ¡¥Ñ”½lÀ¸ÀÑtÁà´ÌÁä´ÄÑ•áÐµáÌ™½¹Ðµ‰±…¬Ñ•áÐµ‘ÌµÑ•áÐ¼ÔÐÑÉ…¹Í¥Ñ¥½¸¡½Ù•Èé‰œµÝ¡¥Ñ”½lÀ¸ÀÝtˆø(€€€€€€€€€€€5…É¬…±°É•…(€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€ð½‘¥Øø(€€€€€€ð½‘¥Øø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ…àµ µlÜÁÙ¡t½Ù•É™±½Üµäµ…ÕÑ¼À´Ðˆø(€€€€€€€í¹½Ñ¥™¥…Ñ¥½¹Ì¹±•¹Ñ €ü€ (€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É¥…À´Èˆø(€€€€€€€€€€€í¹½Ñ¥™¥…Ñ¥½¹Ì¹µ…À ¡¥Ñ•´¤€ôøì(€€€€€€€€€€€€€½¹ÍÐÕ¹É•…€ô¥Ñ•´¹Õ¹É•…€˜˜€…É•…‘%‘Ì¹¥¹±Õ‘•Ì¡¥Ñ•´¹¥¤ì(€€€€€€€€€€€€€½¹ÍÐÑ½¹”€ô¥Ñ•´¹ÁÉ¥½É¥Ñä€ôôô€‰!¥ ˆ€ü€‰‘…¹•Èˆ€è¥Ñ•´¹ÁÉ¥½É¥Ñä€ôôô€‰5•‘¥Õ´ˆ€ü€‰Ý…É¹¥¹œˆ€è€‰¹•ÕÑÉ…°ˆì(€€€€€€€€€€€€€É•ÑÕÉ¸€ (€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸­•äõí¥Ñ•´¹¥‘ôÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôø½¹Q½±•I•…¡¥Ñ•´¹¥¥ô±…ÍÍ9…µ”õíÉ½Õ¹‘•µ‘Ìµµ‰½É‘•ÈÀ´ÌÑ•áÐµÍÑ…ÉÐÑÉ…¹Í¥Ñ¥½¸¡½Ù•Èé‰œµÝ¡¥Ñ”½lÀ¸ÀÔÕt€‘íÕ¹É•…€ü€‰‰½É‘•Èµ‘ÌµÑ½­•¸µ½±¼ÈÐ‰œµ‘ÌµÑ½­•¸µ½±¼ÄÀˆ€è€‰‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµÝ¡¥Ñ”½lÀ¸ÀÍt‰õôø(€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµÍÑ…ÉÐ…À´Ìˆø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”õíµÐ´Ä ´È¸ÔÜ´È¸ÔÍ¡É¥¹¬´ÀÉ½Õ¹‘•µ™Õ±°€‘íÕ¹É•…€ü€‰…¹¥µ…Ñ”µÁÕ±Í”‰œµ½±ˆ€è€‰‰œµÝ¡¥Ñ”¼Äà‰õô€¼ø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µ¥¸µÜ´À™±•à´Äˆø(€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰™±•à™±•àµÝÉ…À¥Ñ•µÌµ•¹Ñ•È…À´Èˆø(€€€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰™½¹Ðµ‰±…¬Ñ•áÐµÝ¡¥Ñ”ˆùí¥Ñ•´¹Ñ¥Ñ±•ôð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€€€ñ	…‘”Ñ½¹”õíÑ½¹•ôùí¥Ñ•´¹ÁÉ¥½É¥Ñåôð½	…‘”ø(€€€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µÐ´Ä‰±½¬Ñ•áÐµáÌ±•…‘¥¹œ´ÔÑ•áÐµ‘ÌµÑ•áÐ¼Ôàˆùí¥Ñ•´¹µ•ÍÍ…•ôð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µÐ´È™±•à™±•àµÝÉ…À¥Ñ•µÌµ•¹Ñ•È…À´ÈÑ•áÐµlÄÅÁát™½¹Ðµ‰½±Ñ•áÐµ‘ÌµÑ•áÐ¼ÐÈˆø(€€€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùí¥Ñ•´¹…Ñ•½Éåôð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸û
Üð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùí¥Ñ•´¹½¹Ñ•áÑôð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸û
Üð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùí¥Ñ•´¹Ñ¥µ•ÍÑ…µÁôð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµáÌ™½¹Ðµ‰±…¬Ñ•áÐµ½±ˆùí¥Ñ•´¹…Ñ¥½¹ôð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€¤ì(€€€€€€€€€€€ô¥ô(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€¤€è€ (€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É¥µ¥¸µ ´ÔØÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•´Éá°‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀ‰œµÝ¡¥Ñ”½lÀ¸ÀÑtÀ´ØÑ•áÐµ•¹Ñ•Èˆø(€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€ñ	•±°±…ÍÍ9…µ”ô‰µàµ…ÕÑ¼ ´äÜ´äÑ•áÐµ½±ˆ€¼ø(€€€€€€€€€€€€€€ñ Ì±…ÍÍ9…µ”ô‰µÐ´Ð™½¹Ðµ‰±…¬Ñ•áÐµÝ¡¥Ñ”ˆù9¼¹½Ñ¥™¥…Ñ¥½¹Ìð½ Ìø(€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´ÈÑ•áÐµÍ´±•…‘¥¹œ´ØÑ•áÐµ‘ÌµÑ•áÐ¼ÔÐˆùQ¡¥Ì™¥±Ñ•È¥Ì±•…È™½È¹½Ü¸ð½Àø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€¥ô(€€€€€€ð½‘¥Øø(€€€€ð½µ½Ñ¥½¸¹‘¥Øø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()™Õ¹Ñ¥½¸±½…Ñ¥¹A…¹•°¡ì¡¥±‘É•¸°±…ÍÍ9…µ”€ô€ˆˆôèì¡¥±‘É•¸èI•…Ð¹I•…Ñ9½‘”ì±…ÍÍ9…µ”üèÍÑÉ¥¹œô¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø(€€€€ñµ½Ñ¥½¸¹‘¥Ø¥¹¥Ñ¥…°õíì½Á…¥Ñäè€À°äè€ÄÀ°Í…±”è€À¸äàõô…¹¥µ…Ñ”õíì½Á…¥Ñäè€Ä°äè€À°Í…±”è€Äõô•á¥Ðõíì½Á…¥Ñäè€À°äè€ÄÀ°Í…±”è€À¸äàõô±…ÍÍ9…µ”õí…‰Í½±ÕÑ”Ñ½À´ÄÈè´ÔÀÜ´àÀÉ½Õ¹‘•µ‘Ìµá°‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµ‘ÌµÑ½­•¸µÍ•½¹‘…Éä¼äàÀ´ÐÑ•áÐµ‘ÌµÑ½­•¸µÑ•áÐÍ¡…‘½Üµ‘Ìµ±œ‰…­‘É½Àµ‰±ÕÈµá°€‘í±…ÍÍ9…µ•õôø(€€€€€í¡¥±‘É•¹ô(€€€€ð½µ½Ñ¥½¸¹‘¥Øø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô(4(4