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
              </div>

              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="group ds-focusable ms-auto hidden h-11 w-[min(34vw,460px)] min-w-[260px] items-center gap-3 rounded-ds-sm border border-ds-token-border bg-black/20 px-3.5 text-start transition-colors duration-ds-base hover:border-ds-token-border-strong hover:bg-white/[0.035] 2xl:flex"
                aria-label={translate("Open global search and command palette")}
              >
                <Search className="h-5 w-5 text-gold transition-transform duration-ds-base group-focus-within:scale-110" />
                <span className="min-w-0 flex-1 text-sm text-ds-text/44">{t.common.searchWorkspace}</span>
                <KeyboardHint keys={["Ctrl", "K"]} />
              </button>

              <IconButton className="ms-auto 2xl:ms-0 2xl:hidden" onClick={() => setCommandOpen(true)} ariaLabel={translate("Open global search")}>
                <Search className="h-5 w-5" />
              </IconButton>

              <div className="shrink-0">
                <LanguageSelector compact />
              </div>

              <div className="relative hidden md:block">
                <IconButton onClick={() => setQuickActionsOpen((value) => !value)} ariaLabel={translate("Open quick actions")}>
                  <Rocket className="h-5 w-5" />
                </IconButton>
                <AnimatePresence>{quickActionsOpen && <QuickActionsMenu />}</AnimatePresence>
              </div>

              <div className="hidden md:block">
                <IconButton onClick={() => setTheme(theme === "dark" ? "light" : "dark")} ariaLabel={translate("Toggle theme")}>
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </IconButton>
              </div>

              <div className="relative hidden md:block">
                <IconButton onClick={() => setNotificationsOpen((value) => !value)} ariaLabel={t.common.notifications}>
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <span className="absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-black text-black ring-2 ring-[#0B1120]">{unreadCount}</span>}
                </IconButton>
                <AnimatePresence>
                  {notificationsOpen && (
                    <NotificationsPanel
                      readIds={notificationReadIds}
                      onMarkAllRead={() => setNotificationReadIds(demoNotificationItems.map((item) => item.id))}
                      onToggleRead={(id) => setNotificationReadIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <motion.button whileTap={{ scale: 0.985 }} className="ds-focusable flex items-center gap-2 rounded-ds-md border border-ds-token-border bg-white/[0.035] p-1.5 transition hover:border-ds-token-gold/24 hover:bg-white/[0.065] sm:gap-3" onClick={() => setProfileOpen((value) => !value)} aria-label={translate("Open user profile menu")} aria-expanded={profileOpen}>
                  <Avatar name={userLabel} size="sm" />
                  <span className="hidden max-w-44 text-start leading-tight 2xl:block">
                    <span className="block truncate text-sm font-black">{userLabel}</span>
                    <span className="text-xs text-ds-text/50">{session ? t.common.activeSession : t.common.guestMode}</span>
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-ds-text/58 2xl:block" />
                </motion.button>
                <AnimatePresence>
                  {profileOpen && (
                    <FloatingPanel className={profilePanelSide}>
                      <div className="mb-4 flex items-center gap-3">
                        <Avatar name={userLabel} />
                        <div className="min-w-0">
                          <p className="truncate font-black">{t.common.workspace}</p>
                          <p className="truncate text-xs text-ds-text/50">{session?.user?.email || "guest@vorqa.ai"}</p>
                        </div>
                      </div>
                      {workspaceLabel && <div className="mb-3 rounded-ds-sm border border-ds-token-border bg-white/[0.035] px-3 py-2"><p className="text-xs text-ds-token-muted">Active workspace</p><p className="mt-1 text-sm font-semibold text-ds-token-text">{translate(workspaceLabel)}</p></div>}
                      <Link href="/settings" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-white/10">
                        <UserRound className="h-4 w-4" />
                        {t.common.profileSettings}
                      </Link>
                      <button type="button" onClick={logout} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-gold hover:bg-gold/10">
                        <LogOut className="h-4 w-4" />
                        {t.common.logout}
                      </button>
                    </FloatingPanel>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <motion.main
            id="vorqa-workspace-content"
            key={pathname}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-ds-content px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
          >
            {children}
          </motion.main>
        </div>

        <AnimatePresence>
          {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} onOpenNotifications={() => setNotificationsOpen(true)} />}
        </AnimatePresence>

        <div className="fixed bottom-5 left-5 z-[70] grid w-[min(360px,calc(100vw-40px))] gap-3">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div key={toast.id} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} className="rounded-ds-lg border border-ds-token-gold/20 bg-ds-token-secondary/95 p-4 shadow-ds-lg backdrop-blur-xl">
                <p className="font-black text-ds-text">{toast.title}</p>
                <p className="mt-1 text-sm text-ds-text/58">{toast.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  </AutoLocalizedContent>);
}

function IconButton({ children, onClick, ariaLabel, className = "" }: { children: React.ReactNode; onClick: () => void; ariaLabel: string; className?: string }) {
  return (<AutoLocalizedContent>
    <motion.button whileTap={{ scale: 0.96 }} className={`group ds-focusable relative grid h-10 w-10 shrink-0 place-items-center rounded-ds-md border border-ds-token-border bg-white/[0.035] text-ds-token-gold shadow-sm transition hover:border-ds-token-gold/26 hover:bg-white/[0.065] ${className}`} onClick={onClick} aria-label={ariaLabel}>
      <span className="absolute inset-x-1 top-0 h-px bg-white/20" />
      <span className="transition-transform duration-ds-base group-hover:scale-105">{children}</span>
    </motion.button>
  </AutoLocalizedContent>);
}

function KeyboardHint({ keys, className = "" }: { keys: string[]; className?: string }) {
  return (
    <span aria-hidden="true" className={`rounded-lg border border-white/10 px-2 py-1 text-[10px] font-black text-ds-text/42 ${className}`}>
      {keys.join(" ")}
    </span>
  );
}

function SidebarContent({
  pathname,
  collapsed = false,
  activeOrganization,
  onOrganizationChange,
  onNavigate,
  onToggle,
  roleNavigation,
  workspaceLabel
}: {
  pathname: string;
  collapsed?: boolean;
  activeOrganization: DemoOrganization;
  onOrganizationChange: (organization: DemoOrganization) => void;
  onNavigate?: () => void;
  onToggle?: () => void;
  roleNavigation?: Array<{ label: string; href: string; available: boolean; icon: typeof LayoutDashboard }>;
  workspaceLabel?: string;
}) {
  const { dictionary: t, dir, translate } = useI18n();
  return (<AutoLocalizedContent>
    <div className="flex h-full flex-col">
      <div className={`mb-4 flex min-h-11 items-center ${collapsed ? "justify-center" : "justify-between gap-3"}`}>
        <div onClick={onNavigate} className={collapsed ? "scale-90" : ""}>
          <VorqaLogo compact={collapsed} />
        </div>
        {onToggle && (
          <IconButton onClick={onToggle} ariaLabel={translate("Toggle sidebar")}>
            {collapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
          </IconButton>
        )}
      </div>

      <nav aria-label={translate("Main workspace sections")} className="grid min-h-0 flex-1 content-start gap-1 overflow-y-auto pe-1">
        {workspaceLabel && !collapsed && <div className="mb-2 rounded-ds-sm border border-ds-token-border bg-white/[0.025] px-3 py-2"><p className="text-[10px] uppercase tracking-[0.12em] text-ds-token-muted">Active workspace</p><p className="mt-1 truncate text-sm font-semibold capitalize text-ds-token-text">{workspaceLabel}</p></div>}
        {(roleNavigation || primaryNavItems).map((item) => {
          const Icon = item.icon;
          const hrefPath = item.href.split("#")[0];
          const active = hrefPath === pathname || (hrefPath !== "/" && pathname.startsWith(hrefPath) && !item.href.includes("#"));
          const label = "label" in item && item.label ? translate(item.label) : ("key" in item ? t.nav[item.key as keyof typeof t.nav] : "");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={`group ds-focusable relative flex min-h-11 items-center gap-3 rounded-ds-sm px-3 py-2.5 text-sm font-semibold transition-colors duration-ds-base ${
                active ? "bg-ds-token-gold/10 text-ds-token-gold-bright" : `text-ds-token-muted hover:bg-white/[0.04] hover:text-ds-token-text`
              } ${collapsed ? "justify-center" : ""}`}
            >
              {active && !collapsed && <motion.span layoutId="shell-active-indicator" className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-ds-token-gold" />}
              <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
        {!roleNavigation && (collapsed ? (
          <Link
            href="/settings"
            onClick={onNavigate}
            title={t.nav.more}
            className="group ds-focusable relative flex min-h-10 items-center justify-center gap-3 rounded-ds-md px-3 py-2.5 text-sm font-bold text-ds-token-muted transition-all duration-ds-base hover:bg-white/[0.05] hover:text-ds-token-text"
          >
            <MoreHorizontal className="h-5 w-5 shrink-0 transition-transform duration-ds-base group-hover:-rotate-6" />
          </Link>
        ) : (
          <div className="mt-3 border-t border-ds-token-border pt-3">
            <div className="mb-1.5 flex items-center gap-2 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ds-token-muted-soft">
              <MoreHorizontal className="h-4 w-4" />
              {t.nav.more}
            </div>
            <div className="grid gap-1" role="list" aria-label={translate("Secondary workspace sections")}>
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const hrefPath = item.href.split("#")[0];
                const active = hrefPath === pathname || (hrefPath !== "/" && pathname.startsWith(hrefPath) && !item.href.includes("#"));
                const label = t.nav[item.key];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group ds-focusable relative flex min-h-10 items-center gap-3 rounded-ds-sm px-3 py-2 text-[13px] font-medium transition-colors duration-ds-base ${
                      active ? "bg-white/[0.07] text-ds-token-gold" : "text-ds-token-muted-soft hover:bg-white/[0.045] hover:text-ds-token-text"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="mt-3 rounded-ds-xl border border-ds-token-border bg-white/[0.025] p-3.5 shadow-inner shadow-black/20">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black text-gold">{t.shell.productivity}</p>
            <CalendarDays className="h-4 w-4 text-blue" />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-l from-gold to-blue shadow-[0_0_22px_rgba(212,175,55,0.35)]" initial={{ width: 0 }} animate={{ width: "72%" }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          <p className="mt-3 text-xs leading-6 text-ds-text/52">{t.shell.productivityText}</p>
        </div>
      )}

    </div>
  </AutoLocalizedContent>);
}

function OrganizationSwitcher({
  activeOrganization,
  onOrganizationChange,
  collapsed
}: {
  activeOrganization: DemoOrganization;
  onOrganizationChange: (organization: DemoOrganization) => void;
  collapsed?: boolean;
}) {
  const { translate } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filteredOrganizations = demoOrganizations.filter((organization) => `${organization.name} ${organization.industry} ${organization.location}`.toLowerCase().includes(query.toLowerCase()));
  const recentOrganizations = demoOrganizations.slice(0, 2);
  const panelSide = "right-0";

  if (collapsed) {
    return (<AutoLocalizedContent>
      <div className="relative mb-5 grid place-items-center">
        <button
          type="button"
          aria-label={translate("Switch organization")}
          onClick={() => setOpen((value) => !value)}
          className="grid h-11 w-11 place-items-center rounded-ds-md border border-ds-token-gold/24 bg-ds-token-gold/12 text-sm font-black text-ds-token-gold shadow-gold-glow transition hover:border-ds-token-gold/40"
        >
          {activeOrganization.logo.slice(0, 2)}
        </button>
        <AnimatePresence>
          {open && (
            <OrganizationSwitcherPanel
              className="right-0 top-14"
              query={query}
              setQuery={setQuery}
              activeOrganization={activeOrganization}
              recentOrganizations={recentOrganizations}
              organizations={filteredOrganizations}
              onSelect={(organization) => {
                onOrganizationChange(organization);
                setOpen(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </AutoLocalizedContent>);
  }

  return (<AutoLocalizedContent>
    <div className="relative mb-5">
      <button
        type="button"
        aria-expanded={open}
        aria-label={translate("Switch organization")}
        onClick={() => setOpen((value) => !value)}
        className="group flex w-full items-center gap-3 rounded-ds-xl border border-ds-token-border bg-white/[0.03] p-2.5 text-start shadow-inner shadow-black/20 transition hover:border-ds-token-gold/26 hover:bg-white/[0.055]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-ds-md border border-ds-token-gold/24 bg-ds-token-gold/12 text-sm font-black text-ds-token-gold shadow-gold-glow">
          {activeOrganization.logo}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-ds-text">{activeOrganization.name}</span>
          <span className="mt-1 block truncate text-xs font-bold text-ds-text/46">{activeOrganization.workspace}</span>
          <span className="mt-2 inline-flex">
            <Badge tone={activeOrganization.role === "Owner" ? "gold" : activeOrganization.role === "Admin" ? "blue" : activeOrganization.role === "Member" ? "success" : "neutral"}>{translate(activeOrganization.role)}</Badge>
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gold transition group-hover:rotate-180" />
      </button>
      <AnimatePresence>
        {open && (
          <OrganizationSwitcherPanel
            className={`${panelSide} top-[5.25rem]`}
            query={query}
            setQuery={setQuery}
            activeOrganization={activeOrganization}
            recentOrganizations={recentOrganizations}
            organizations={filteredOrganizations}
            onSelect={(organization) => {
              onOrganizationChange(organization);
              setOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  </AutoLocalizedContent>);
}

function OrganizationSwitcherPanel({
  className,
  query,
  setQuery,
  activeOrganization,
  recentOrganizations,
  organizations,
  onSelect
}: {
  className: string;
  query: string;
  setQuery: (value: string) => void;
  activeOrganization: DemoOrganization;
  recentOrganizations: DemoOrganization[];
  organizations: DemoOrganization[];
  onSelect: (organization: DemoOrganization) => void;
}) {
  const { translate } = useI18n();
  return (<AutoLocalizedContent>
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
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


