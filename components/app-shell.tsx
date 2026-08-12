Exit code: 0
Wall time: 1.2 seconds
Total output lines: 1058
Output:
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
  { title: "Nadia Benali", type: "Employee", context: "Engineering · Atlas", status: "Active", href: "/organizations/atlas", icon: UserRound },
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
  { id: 1, category: "Projects", title: "Milestone review due", message: "Luxury Villa Casablanca needs structural frame sign-off today.", timestamp: "8 min ago", priority: "High", unread: true, context: "Atlas · PRJ-1048", action: "Open project" },
  { id: 2, category: "Budget", title: "Budget variance detected", message: "Procurement variance increased by 6% on marble package.", timestamp: "24 min ago", priority: "High", unread: true, context: "Atlas · Finance", action: "Review budget" },
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
    ? organizationTypeDisplayNames[identity.organizationType]
    : identity?.primaryRole ? roleDisplayNames[identity.primaryRole] : undefined;
  const roleNavigation = useMemo(() => identity ? navigationForIdentity(identity).map((item) => ({ ...item, icon: iconForRoleNavigation(item.label) })) : [], [identity]);

  const isPublicAuthExperience = pathname === "/login" || pathname === "/register" || pathname === "/pricing" || (pathname === "/onboarding" && !session);

  if (pathname === "/" || isPublicAuthExperience) {
    return (<AutoLocalizedContent>
      <ToastContext.Provider value={toastValue}>
        <div className="min-h-screen overflow-x-hidden bg-[#0A0A0A] text-[#f8efd7] transition dark:bg-[#0A0A0A] dark:text-[#f8efd7]">
          {pathname !== "/" && <div className="fixed end-4 top-4 z-[120] sm:end-6 sm:top-6"><LanguageSelector compact /></div>}
          {children}
        </div>
      </ToastContext.Provider>
    </AutoLocalizedContent>);
  }

  return (<AutoLocalizedContent>
    <ToastContext.Provider value={toastValue}>
      <div className="min-h-screen overflow-x-hidden bg-ds-token-bg text-ds-token-text">
        <div className="pointer-events-none fixed inset-0 bg-ds-token-bg" />

        <a href="#vorqa-workspace-content" className="ds-focusable fixed start-4 top-4 z-[130] -translate-y-24 rounded-ds-md border border-ds-token-gold/30 bg-ds-token-secondary/96 px-4 py-2 text-sm font-bold text-ds-token-gold shadow-ds-lg backdrop-blur-xl transition focus:translate-y-0">
          {translate("Skip to workspace")}
        </a>

        <aside aria-label={translate("Primary workspace navigation")} className={`fixed inset-y-0 ${shellSide} z-50 hidden overflow-visible border-ds-token-border bg-ds-token-secondary p-4 transition-[width] duration-ds-slow lg:block ${sidebarCollapsed ? "w-20" : "w-[17.5rem]"}`}>
          <SidebarContent pathname={pathname} collapsed={sidebarCollapsed} activeOrganization={activeOrganization} onOrganizationChange={setActiveOrganization} onToggle={() => setSidebarCollapsed((value) => !value)} roleNavigation={identity ? roleNavigation : undefined} workspaceLabel={workspaceLabel ? translate(workspaceLabel) : undefined} />
        </aside>

        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.button className="fixed inset-0 z-50 bg-black/78 backdrop-blur-sm lg:hidden" aria-label={translate("Close menu")} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} />
              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label={translate("Primary workspace navigation")}
                className={`fixed inset-y-0 ${mobileSide} z-50 w-[min(300px,calc(100vw-1rem))] border-ds-token-border bg-ds-token-overlay p-4 shadow-ds-lg lg:hidden`}
                initial={{ x: drawerOffset }}
                animate={{ x: 0 }}
                exit={{ x: drawerOffset }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
              >
                <SidebarContent pathname={pathname} activeOrganization={activeOrganization} onOrganizationChange={setActiveOrganization} onNavigate={() => setSidebarOpen(false)} roleNavigation={identity ? roleNavigation : undefined} workspaceLabel={workspaceLabel ? translate(workspaceLabel) : undefined} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className={`relative transition-all duration-ds-slow ${contentMargin}`}>
          <header className="sticky top-0 z-40 border-b border-ds-token-border bg-ds-token-bg/90 backdrop-blur-xl">
            <div className="mx-auto flex min-h-16 max-w-ds-content items-center gap-2 px-4 sm:gap-2.5 sm:px-6 lg:px-8">
              <IconButton className="lg:hidden" onClick={() => setSidebarOpen(true)} ariaLabel={translate("Open menu")}>
                <Menu className="h-5 w-5" />
              </IconButton>

              <div className="hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ds-token-gold">{translate("VORA Project Workspace")}</p>
                  <Badge tone="blue" className="hidden 2xl:inline-flex">{t.shell.workspaceBadge}</Badge>
                  <Badge tone={dataSourceMode === "supabase" ? "success" : dataSourceMode === "auto" ? "blue" : "warning"} className="hidden 2xl:inline-flex">{dataSourceLabel}</Badge>
                  <Badge tone={activeOrganization.status === "Active" ? "success" : activeOrganization.status === "Pending invitation" ? "warning" : "danger"} className="hidden 2xl:inline-flex">{translate(activeOrganization.status)}</Badge>
                </div>
                <h1 className="mt-1 truncate text-lg font-black sm:text-xl">{currentPage}</h1>
                <p className="mt-1 hidden truncate text-xs font-bold text-ds-text/46 sm:block">{activeOrganization.name} · {activeOrganization.workspace}</p>
      …4556 tokens truncated…acity: 0, y: 10, scale: 0.98 }}
      className={`absolute z-[90] w-[min(360px,calc(100vw-2rem))] rounded-ds-xl border border-ds-token-border bg-ds-token-secondary/98 p-4 text-ds-token-text shadow-ds-lg backdrop-blur-xl ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">{translate("Organizations")}</p>
          <h3 className="mt-1 font-black">{translate("Switch workspace")}</h3>
        </div>
        <Badge tone="blue">{translate("UI state")}</Badge>
      </div>

      <label className="mt-4 flex h-10 items-center gap-3 rounded-ds-md border border-ds-token-border bg-black/24 px-3 shadow-inner shadow-black/20 transition focus-within:border-ds-token-gold/40">
        <Search className="h-4 w-4 text-gold" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-ds-text/36" placeholder={translate("Search organizations")} />
      </label>

      <div className="mt-4 grid gap-4">
        <OrganizationGroup title={translate("Recent organizations")} organizations={recentOrganizations} activeOrganization={activeOrganization} onSelect={onSelect} />
        <OrganizationGroup title={translate("All organizations")} organizations={organizations} activeOrganization={activeOrganization} onSelect={onSelect} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
        <button type="button" className="flex items-center justify-center gap-2 rounded-ds-md border border-ds-token-border bg-white/[0.035] px-3 py-2 text-xs font-bold text-ds-token-muted transition hover:bg-white/[0.06]">
          <Plus className="h-4 w-4 text-gold" />
          {translate("Create organization")}
        </button>
        <button type="button" className="flex items-center justify-center gap-2 rounded-ds-md border border-ds-token-border bg-white/[0.035] px-3 py-2 text-xs font-bold text-ds-token-muted transition hover:bg-white/[0.06]">
          <UserPlus className="h-4 w-4 text-gold" />
          {translate("Join organization")}
        </button>
      </div>
    </motion.div>
  </AutoLocalizedContent>);
}

function OrganizationGroup({
  title,
  organizations,
  activeOrganization,
  onSelect
}: {
  title: string;
  organizations: DemoOrganization[];
  activeOrganization: DemoOrganization;
  onSelect: (organization: DemoOrganization) => void;
}) {
  const { translate } = useI18n();
  return (<AutoLocalizedContent>
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-ds-text/42">{title}</p>
      <div className="grid gap-2">
        {organizations.length ? (
          organizations.map((organization) => {
            const active = organization.id === activeOrganization.id;
            return (
              <button
                type="button"
                key={`${title}-${organization.id}`}
                onClick={() => onSelect(organization)}
                className={`flex items-center gap-3 rounded-ds-md border p-3 text-start transition ${
                  active ? "border-ds-token-gold/36 bg-ds-token-gold/12" : "border-ds-token-border bg-white/[0.03] hover:bg-white/[0.055]"
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/12 text-xs font-black text-gold">{organization.logo}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">{organization.name}</span>
                  <span className="mt-1 block truncate text-xs text-ds-text/46">{translate(organization.role)} · {translate(organization.status)}</span>
                </span>
                {active && <span className="h-2.5 w-2.5 rounded-full bg-gold shadow-gold-glow" />}
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-ds-text/50">{translate("No organizations found.")}</div>
        )}
      </div>
    </div>
  </AutoLocalizedContent>);
}

function QuickActionsMenu() {
  const { dir, translate } = useI18n();
  return (<AutoLocalizedContent>
    <FloatingPanel className={dir === "rtl" ? "left-0" : "right-0"}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-gold">{translate("Quick actions")}</p>
          <h2 className="mt-1 font-black">{translate("Move faster")}</h2>
        </div>
        <Rocket className="h-5 w-5 text-gold" />
      </div>
      <div className="grid gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} href={action.href} className="group flex items-center gap-3 rounded-ds-md border border-ds-token-border bg-white/[0.03] p-3 transition hover:border-ds-token-gold/20 hover:bg-white/[0.055]">
              <span className="grid h-9 w-9 place-items-center rounded-ds-sm bg-ds-token-gold/12 text-ds-token-gold">
                <Icon className="h-4 w-4 transition group-hover:-rotate-6" />
              </span>
              <span className="font-black">{translate(action.title)}</span>
            </Link>
          );
        })}
      </div>
    </FloatingPanel>
  </AutoLocalizedContent>);
}

function CommandPalette({ onClose, onOpenNotifications }: { onClose: () => void; onOpenNotifications: () => void }) {
  const router = useRouter();
  const { translate } = useI18n();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const normalizedQuery = query.toLowerCase();
  const filteredSearch = globalSearchItems.filter((item) => `${item.title} ${item.type} ${item.context} ${item.status}`.toLowerCase().includes(normalizedQuery));
  const filteredCommands = commandItems.filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(normalizedQuery));
  const paletteItems = [
    ...filteredCommands.map((item) => ({ ...item, kind: "command" as const, type: item.category, context: "Command palette", status: "Ready" })),
    ...filteredSearch.map((item) => ({ ...item, kind: "search" as const }))
  ];
  const recentCommands = commandItems.slice(0, 3);
  const suggestedCommands = commandItems.slice(3, 7);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function openSelected() {
    const selected = paletteItems[selectedIndex];
    if (!selected) return;
    if (selected.title === "View notifications") {
      onOpenNotifications();
      onClose();
      return;
    }
    router.push(selected.href);
    onClose();
  }

  return (<AutoLocalizedContent>
    <motion.div className="fixed inset-0 z-[120] bg-black/72 p-3 backdrop-blur-xl sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={translate("Global search and command palette")}
        aria-describedby="command-palette-help"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        className="mx-auto flex h-[min(760px,calc(100vh-1.5rem))] max-w-4xl flex-col overflow-hidden rounded-ds-2xl border border-ds-token-border bg-ds-token-secondary/98 shadow-ds-lg ring-1 ring-white/[0.025] backdrop-blur-xl sm:h-[min(760px,calc(100vh-3rem))]"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedIndex((value) => Math.min(value + 1, Math.max(0, paletteItems.length - 1)));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedIndex((value) => Math.max(value - 1, 0));
          }
          if (event.key === "Enter") {
            event.preventDefault();
            openSelected();
          }
        }}
      >
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-ds-md border border-ds-token-gold/22 bg-black/28 px-4 py-3 shadow-inner shadow-black/20">
              <Search className="h-5 w-5 shrink-0 text-gold" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-base font-bold text-ds-text outline-none placeholder:text-ds-text/36"
                placeholder={translate("Search projects, organizations, people, reports, tools...")}
                aria-label={translate("Search Vorqa workspace")}
                aria-controls="command-palette-results"
                aria-activedescendant={paletteItems[selectedIndex] ? `command-palette-result-${selectedIndex}` : undefined}
              />
              <KeyboardHint keys={["Esc"]} className="hidden bg-white/[0.045] sm:inline-flex" />
            </div>
            <button type="button" onClick={onClose} className="ds-focusable grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.055] text-ds-text/58 transition hover:-translate-y-0.5 hover:bg-white/[0.085] hover:text-ds-text" aria-label={translate("Close command palette")}>
              <ChevronDown className="h-5 w-5 rotate-180" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden border-e border-white/10 bg-white/[0.018] p-4 lg:block">
            <PaletteSection title={translate("Recent commands")} commands={recentCommands} />
            <div className="mt-5">
              <PaletteSection title={translate("Suggested commands")} commands={suggestedCommands} />
            </div>
          </aside>

          <div className="min-h-0 overflow-y-auto p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div id="command-palette-help">
                <Badge tone="gold">{translate("Global discovery")}</Badge>
                <p className="mt-2 text-sm text-ds-text/54">{paletteItems.length} {translate("results across Vorqa")}</p>
              </div>
              <div className="hidden gap-2 text-[10px] font-black text-ds-text/38 sm:flex">
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1"><KeyboardHint keys={["↑", "↓"]} className="border-0 p-0" /> {translate("Navigate")}</span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1"><KeyboardHint keys={["Enter"]} className="border-0 p-0" /> {translate("Open")}</span>
              </div>
            </div>

            {paletteItems.length ? (
              <div id="command-palette-results" role="listbox" aria-label={translate("Command palette results")} className="grid gap-2">
                {paletteItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = index === selectedIndex;
                  return (
                    <Link
                      key={`${item.kind}-${item.title}`}
                      id={`command-palette-result-${index}`}
                      role="option"
                      aria-selected={active}
                      href={item.href}
                      onClick={(event) => {
                        if (item.title === "View notifications") {
                          event.preventDefault();
                          onOpenNotifications();
                        }
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`group flex items-center gap-3 rounded-ds-md border p-3 text-start shadow-sm transition ${
                        active ? "border-ds-token-gold/38 bg-ds-token-gold/12" : "border-ds-token-border bg-white/[0.03] hover:border-ds-token-border-strong hover:bg-white/[0.055]"
                      }`}
                    >
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition ${active ? "border-gold/28 bg-gold/16 text-gold" : "border-white/10 bg-white/[0.04] text-gold"}`}>
                        <Icon className="h-5 w-5 transition group-hover:-rotate-6" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-black text-white">{translate(item.title)}</span>
                        <span className="mt-1 block truncate text-xs text-ds-text/46">{translate(item.type)} · {translate(item.context)}</span>
                      </span>
                      <Badge tone={item.kind === "command" ? "blue" : "neutral"}>{translate(item.status)}</Badge>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="grid min-h-80 place-items-center rounded-ds-xl border border-ds-token-border bg-white/[0.03] p-8 text-center">
                <div>
                  <Search className="mx-auto h-10 w-10 text-gold" />
                  <h3 className="mt-4 text-xl font-black text-white">{translate("No results found")}</h3>
                  <p className="mt-2 text-sm leading-6 text-ds-text/54">{translate("Try searching for a project, employee, report, organization, or VORA tool.")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  </AutoLocalizedContent>);
}

function PaletteSection({ title, commands }: { title: string; commands: typeof commandItems }) {
  const { translate } = useI18n();
  return (<AutoLocalizedContent>
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-ds-text/42">{title}</p>
      <div className="grid gap-2">
        {commands.map((command) => {
          const Icon = command.icon;
          return (
            <Link key={command.title} href={command.href} className="group flex items-center gap-2 rounded-ds-md border border-ds-token-border bg-white/[0.03] px-3 py-2 text-sm font-bold transition hover:border-ds-token-gold/20 hover:bg-white/[0.055]">
              <Icon className="h-4 w-4 shrink-0 text-gold transition group-hover:-rotate-6" />
              <span className="truncate">{translate(command.title)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  </AutoLocalizedContent>);
}

function NotificationsPanel({
  readIds,
  onMarkAllRead,
  onToggleRead
}: {
  readIds: number[];
  onMarkAllRead: () => void;
  onToggleRead: (id: number) => void;
}) {
  const { dictionary: t, dir } = useI18n();
  const [filter, setFilter] = useState("All");
  const notifications = demoNotificationItems.filter((item) => {
    const unread = item.unread && !readIds.includes(item.id);
    if (filter === "Unread") return unread;
    if (filter === "High priority") return item.priority === "High";
    return true;
  });
  const unreadCount = demoNotificationItems.filter((item) => item.unread && !readIds.includes(item.id)).length;

  return (<AutoLocalizedContent>
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      className={`absolute top-12 z-50 w-[min(420px,calc(100vw-1.5rem))] overflow-hidden rounded-ds-xl border border-ds-token-border bg-ds-token-secondary/98 text-ds-token-text shadow-ds-lg backdrop-blur-xl ${dir === "rtl" ? "left-0" : "right-0"}`}
    >
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-black">{t.common.notifications}</h2>
            <p className="mt-1 text-xs text-ds-text/48">{unreadCount} unread across projects and organizations</p>
          </div>
          <Badge tone="gold">{unreadCount}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["All", "Unread", "High priority"].map((item) => (
            <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1 text-xs font-black transition ${filter === item ? "border-gold/40 bg-gold/14 text-gold" : "border-white/10 bg-white/[0.04] text-ds-text/54 hover:bg-white/[0.07]"}`}>
              {item}
            </button>
          ))}
          <button type="button" onClick={onMarkAllRead} className="ms-auto rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-ds-text/54 transition hover:bg-white/[0.07]">
            Mark all read
          </button>
        </div>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-4">
        {notifications.length ? (
          <div className="grid gap-2">
            {notifications.map((item) => {
              const unread = item.unread && !readIds.includes(item.id);
              const tone = item.priority === "High" ? "danger" : item.priority === "Medium" ? "warning" : "neutral";
              return (
                <button key={item.id} type="button" onClick={() => onToggleRead(item.id)} className={`rounded-ds-md border p-3 text-start transition hover:bg-white/[0.055] ${unread ? "border-ds-token-gold/24 bg-ds-token-gold/10" : "border-ds-token-border bg-white/[0.03]"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? "animate-pulse bg-gold" : "bg-white/18"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-white">{item.title}</span>
                        <Badge tone={tone}>{item.priority}</Badge>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-ds-text/58">{item.message}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-ds-text/42">
                        <span>{item.category}</span>
                        <span>·</span>
                        <span>{item.context}</span>
                        <span>·</span>
                        <span>{item.timestamp}</span>
                      </span>
                    </span>
                    <span className="text-xs font-black text-gold">{item.action}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-56 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
            <div>
              <Bell className="mx-auto h-9 w-9 text-gold" />
              <h3 className="mt-4 font-black text-white">No notifications</h3>
              <p className="mt-2 text-sm leading-6 text-ds-text/54">This filter is clear for now.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  </AutoLocalizedContent>);
}

function FloatingPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (<AutoLocalizedContent>
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} className={`absolute top-12 z-50 w-80 rounded-ds-xl border border-ds-token-border bg-ds-token-secondary/98 p-4 text-ds-token-text shadow-ds-lg backdrop-blur-xl ${className}`}>
      {children}
    </motion.div>
  </AutoLocalizedContent>);
}



