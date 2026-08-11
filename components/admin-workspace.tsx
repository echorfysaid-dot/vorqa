"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Bell,
  Bot,
  Building2,
  CreditCard,
  Database,
  FileSearch,
  Flag,
  Gauge,
  HardDrive,
  Landmark,
  Lock,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, Input, PageHeader, ProgressBar, Table } from "@/components/ui";
import type { AdminStatus, AuditEventType } from "@/lib/models";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { useI18n } from "@/components/i18n-provider";
import { formatDate as formatLocalizedDate, formatNumber as formatLocalizedNumber } from "@/lib/utils/format";
import {
  useAdminAudit,
  useAdminDashboard,
  useAdminFeatureFlags,
  useAdminOrganizations,
  useAdminSettings,
  useAdminSubscriptions,
  useAdminSystemHealth,
  useAdminUsers
} from "@/lib/repositories/adminHooks";

type AdminView = "dashboard" | "users" | "organizations" | "subscriptions" | "audit" | "feature-flags" | "system" | "ai";

const navItems: Array<{ href: string; label: string; view: AdminView; icon: React.ReactNode }> = [
  { href: "/admin", label: "لوحة التحكم", view: "dashboard", icon: <Gauge className="h-4 w-4" /> },
  { href: "/admin/users", label: "المستخدمون", view: "users", icon: <UsersRound className="h-4 w-4" /> },
  { href: "/admin/organizations", label: "المؤسسات", view: "organizations", icon: <Building2 className="h-4 w-4" /> },
  { href: "/admin/subscriptions", label: "الاشتراكات", view: "subscriptions", icon: <CreditCard className="h-4 w-4" /> },
  { href: "/admin/audit", label: "سجل التدقيق", view: "audit", icon: <FileSearch className="h-4 w-4" /> },
  { href: "/admin/feature-flags", label: "Feature Flags", view: "feature-flags", icon: <Flag className="h-4 w-4" /> },
  { href: "/admin/system", label: "النظام", view: "system", icon: <Database className="h-4 w-4" /> },
  { href: "/admin/ai", label: "VORA AI", view: "ai", icon: <Bot className="h-4 w-4" /> }
];

const auditTypes: Array<"all" | AuditEventType> = ["all", "auth", "project", "marketplace", "contract", "billing", "ai", "admin", "system"];

function statusTone(status: AdminStatus | "success" | "failed" | "warning") {
  if (status === "active" || status === "healthy" || status === "success") return "success";
  if (status === "trialing" || status === "invited" || status === "warning") return "warning";
  if (status === "suspended" || status === "past_due" || status === "critical" || status === "failed") return "danger";
  return "blue";
}

function formatNumber(value: number, locale: "ar" | "fr" | "en") {
  return formatLocalizedNumber(value, locale);
}

function formatDate(value: string | undefined, locale: "ar" | "fr" | "en") {
  if (!value) return "غير متوفر";
  return formatLocalizedDate(value, locale);
}

function AdminNavigation({ active }: { active: AdminView }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-3">
      <div className="flex gap-2 overflow-x-auto lg:grid lg:grid-cols-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`ds-focusable flex min-w-max items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
              active === item.view ? "bg-[#D4AF37] text-black shadow-gold-glow" : "text-ds-text/62 hover:bg-white/[0.06] hover:text-ds-text"
            }`}
            aria-current={active === item.view ? "page" : undefined}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function AdminShell({ view, children }: { view: AdminView; children: React.ReactNode }) {
  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <PageHeader
        eyebrow="VORQA ADMIN"
        title="مركز إدارة المنصة"
        description="لوحة تشغيل داخلية لإدارة المؤسسات، المستخدمين، الاشتراكات، الاستخدام، وسجل التدقيق بدون تغيير أي منطق إنتاجي قائم."
        action={<Badge tone="gold"><ShieldCheck className="h-4 w-4" /> Demo / Supabase / Auto</Badge>}
      />
      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <AdminNavigation active={view} />
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function MetricCard({ title, value, hint, icon, tone = "gold" }: { title: string; value: string; hint: string; icon: React.ReactNode; tone?: "gold" | "blue" | "success" | "warning" | "danger" }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-[#D4AF37]">{icon}</span>
        <Badge tone={tone}>{hint}</Badge>
      </div>
      <p className="mt-5 text-2xl font-black text-ds-text">{value}</p>
      <p className="mt-2 text-sm font-bold text-ds-text/56">{title}</p>
    </GlassCard>
  </AutoLocalizedContent>);
}

function AdminDashboardView() {
  const { locale } = useI18n();
  const state = useAdminDashboard();
  const metrics = state.data.metrics;
  return (<AutoLocalizedContent>
    <AdminShell view="dashboard">
      {state.error && state.isFallback && <GlassCard className="p-4 text-sm font-bold text-warning">يتم عرض لوحة الإدارة من بيانات demo fallback لأن عروض Supabase الإدارية غير متاحة بعد.</GlassCard>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total users" value={formatNumber(metrics.totalUsers, locale)} hint="Users" icon={<UsersRound className="h-5 w-5" />} />
        <MetricCard title="Active organizations" value={formatNumber(metrics.activeOrganizations, locale)} hint="Organizations" icon={<Building2 className="h-5 w-5" />} tone="success" />
        <MetricCard title="Revenue foundation" value={`${formatNumber(metrics.revenue, locale)} ${metrics.currency}`} hint="MRR" icon={<Landmark className="h-5 w-5" />} />
        <MetricCard title="AI usage" value={formatNumber(metrics.aiRequests, locale)} hint="Requests" icon={<Sparkles className="h-5 w-5" />} tone="blue" />
        <MetricCard title="Projects" value={formatNumber(metrics.projects, locale)} hint="Projects" icon={<Activity className="h-5 w-5" />} tone="blue" />
        <MetricCard title="Marketplace companies" value={formatNumber(metrics.marketplaceCompanies, locale)} hint="B2B" icon={<BadgeCheck className="h-5 w-5" />} tone="success" />
        <MetricCard title="RFQs" value={formatNumber(metrics.rfqs, locale)} hint="Procurement" icon={<FileSearch className="h-5 w-5" />} tone="warning" />
        <MetricCard title="Contracts" value={formatNumber(metrics.contracts, locale)} hint="Awards" icon={<Lock className="h-5 w-5" />} tone="gold" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="p-5">
          <h2 className="text-xl font-black text-ds-text">System health</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["API latency", `${state.data.health.apiLatencyMs}ms`, 82],
              ["Error rate", `${state.data.health.errorRate}%`, 96],
              ["Uptime", `${state.data.health.uptime}%`, 99],
              ["Storage", `${metrics.storageGb}GB`, 36]
            ].map(([label, value, progress]) => (
              <div key={label as string} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-3 flex items-center justify-between text-sm font-black text-ds-text"><span>{label}</span><span>{value}</span></div>
                <ProgressBar value={Number(progress)} tone="success" />
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <h2 className="text-xl font-black text-ds-text">Recent audit events</h2>
          <div className="mt-4 space-y-3">
            {state.data.audit.slice(0, 5).map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-ds-text">{event.action}</p>
                  <Badge tone={statusTone(event.status)}>{event.type}</Badge>
                </div>
                <p className="mt-1 text-sm text-ds-text/56">{event.actor} · {event.target}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </AdminShell>
  </AutoLocalizedContent>);
}

function AdminUsersView() {
  const { locale } = useI18n();
  const [query, setQuery] = useState("");
  const state = useAdminUsers(query);
  const rows = state.data.map((user) => [
    <div key="u" className="font-black text-ds-text">{user.name}<p className="text-xs text-ds-text/48">{user.email}</p></div>,
    <Badge key="r" tone="blue">{user.role}</Badge>,
    user.organization || "غير مرتبط",
    <Badge key="s" tone={statusTone(user.status)}>{user.status}</Badge>,
    formatNumber(user.aiRequests, locale),
    <div key="a" className="flex gap-2"><Button size="sm" variant="secondary">Suspend</Button><Button size="sm" variant="ghost">Restore</Button></div>
  ]);
  return (<AutoLocalizedContent>
    <AdminShell view="users">
      <Input label="Search users" value={query} onChange={(event) => setQuery(event.target.value)} icon={<Search className="h-4 w-4" />} placeholder="Search by name, email, role, organization..." />
      <GlassCard className="p-5">{rows.length ? <Table columns={["User", "Role", "Organization", "Status", "AI", "Actions"]} rows={rows} /> : <EmptyState title="No users found" description="Adjust your search or filters." />}</GlassCard>
    </AdminShell>
  </AutoLocalizedContent>);
}

function AdminOrganizationsView() {
  const [query, setQuery] = useState("");
  const state = useAdminOrganizations(query);
  return (<AutoLocalizedContent>
    <AdminShell view="organizations">
      <Input label="Search organizations" value={query} onChange={(event) => setQuery(event.target.value)} icon={<Search className="h-4 w-4" />} placeholder="Search organizations..." />
      <div className="grid gap-4 xl:grid-cols-2">
        {state.data.map((organization) => (
          <GlassCard key={organization.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-ds-text">{organization.name}</h2>
                <p className="mt-2 text-sm text-ds-text/56">Owner: {organization.owner}</p>
              </div>
              <Badge tone={statusTone(organization.status)}>{organization.status}</Badge>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <MiniStat label="Members" value={organization.members} />
              <MiniStat label="Projects" value={organization.projects} />
              <MiniStat label="Storage" value={`${organization.storageGb}GB`} />
              <MiniStat label="AI" value={organization.aiRequests} />
            </div>
          </GlassCard>
        ))}
      </div>
    </AdminShell>
  </AutoLocalizedContent>);
}

function AdminSubscriptionsView() {
  const { locale } = useI18n();
  const state = useAdminSubscriptions();
  return (<AutoLocalizedContent>
    <AdminShell view="subscriptions">
      <GlassCard className="p-5">
        <Table
          columns={["Organization", "Plan", "Status", "MRR", "Renewal", "Usage"]}
          rows={state.data.map((subscription) => [
            subscription.organizationName,
            subscription.plan,
            <Badge key="s" tone={statusTone(subscription.status)}>{subscription.status}</Badge>,
            `${subscription.mrr} ${subscription.currency}`,
            formatDate(subscription.renewalDate, locale),
            <div key="u" className="min-w-36"><ProgressBar value={subscription.usagePercent} tone={subscription.usagePercent > 80 ? "warning" : "success"} /></div>
          ])}
        />
      </GlassCard>
    </AdminShell>
  </AutoLocalizedContent>);
}

function AdminAuditView() {
  const { locale } = useI18n();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | AuditEventType>("all");
  const state = useAdminAudit(query, type);
  return (<AutoLocalizedContent>
    <AdminShell view="audit">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <Input label="Search audit" value={query} onChange={(event) => setQuery(event.target.value)} icon={<Search className="h-4 w-4" />} placeholder="Search actor, action, target..." />
        <div className="flex flex-wrap items-end gap-2">
          {auditTypes.map((item) => <Button key={item} size="sm" variant={type === item ? "primary" : "secondary"} onClick={() => setType(item)}>{item}</Button>)}
        </div>
      </div>
      <GlassCard className="p-5">
        <Table columns={["Type", "Actor", "Action", "Target", "Status", "Date"]} rows={state.data.map((event) => [event.type, event.actor, event.action, event.target, <Badge key="s" tone={statusTone(event.status)}>{event.status}</Badge>, formatDate(event.createdAt, locale)])} />
      </GlassCard>
    </AdminShell>
  </AutoLocalizedContent>);
}

function AdminFeatureFlagsView() {
  const state = useAdminFeatureFlags();
  return (<AutoLocalizedContent>
    <AdminShell view="feature-flags">
      <div className="grid gap-4 xl:grid-cols-2">
        {state.data.map((flag) => (
          <GlassCard key={flag.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-ds-text">{flag.name}</h2>
                <p className="mt-2 text-sm leading-6 text-ds-text/56">{flag.description}</p>
              </div>
              <Badge tone={flag.status === "enabled" ? "success" : flag.status === "beta" ? "warning" : "danger"}>{flag.status}</Badge>
            </div>
            <div className="mt-5"><ProgressBar value={flag.rollout} label={`Rollout · ${flag.owner}`} tone="gold" /></div>
          </GlassCard>
        ))}
      </div>
    </AdminShell>
  </AutoLocalizedContent>);
}

function AdminSystemView() {
  const health = useAdminSystemHealth();
  const settings = useAdminSettings();
  return (<AutoLocalizedContent>
    <AdminShell view="system">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Supabase" value={health.data.supabase} hint={health.data.status} icon={<Database className="h-5 w-5" />} tone={statusTone(health.data.supabase)} />
        <MetricCard title="OpenAI" value={health.data.openai} hint="AI" icon={<Bot className="h-5 w-5" />} tone={statusTone(health.data.openai)} />
        <MetricCard title="Storage" value={health.data.storage} hint="Files" icon={<HardDrive className="h-5 w-5" />} tone={statusTone(health.data.storage)} />
        <MetricCard title="Jobs" value={health.data.jobs} hint="Workers" icon={<Activity className="h-5 w-5" />} tone={statusTone(health.data.jobs)} />
      </div>
      <GlassCard className="p-5">
        <Table columns={["Setting", "Value", "Category", "Locked"]} rows={settings.data.map((setting) => [setting.label, setting.value, setting.category, setting.locked ? "Locked" : "Editable"])} />
      </GlassCard>
    </AdminShell>
  </AutoLocalizedContent>);
}

function AdminAiView() {
  const { locale } = useI18n();
  const dashboard = useAdminDashboard();
  const aiEvents = useMemo(() => dashboard.data.audit.filter((event) => event.type === "ai"), [dashboard.data.audit]);
  return (<AutoLocalizedContent>
    <AdminShell view="ai">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="AI requests" value={formatNumber(dashboard.data.metrics.aiRequests, locale)} hint="This period" icon={<Sparkles className="h-5 w-5" />} tone="blue" />
        <MetricCard title="Active AI users" value={formatNumber(dashboard.data.users.filter((user) => user.aiRequests > 0).length, locale)} hint="Users" icon={<UsersRound className="h-5 w-5" />} tone="success" />
        <MetricCard title="AI events" value={formatNumber(aiEvents.length, locale)} hint="Audit" icon={<Bot className="h-5 w-5" />} tone="gold" />
      </div>
      <GlassCard className="p-5">
        <h2 className="mb-4 text-xl font-black text-ds-text">VORA usage foundation</h2>
        <Table columns={["User", "Organization", "Requests", "Last active"]} rows={dashboard.data.users.map((user) => [user.name, user.organization || "-", formatNumber(user.aiRequests, locale), formatDate(user.lastActiveAt, locale)])} />
      </GlassCard>
    </AdminShell>
  </AutoLocalizedContent>);
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (<AutoLocalizedContent>
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <p className="text-xs font-bold text-ds-text/48">{label}</p>
      <p className="mt-1 font-black text-ds-text">{value}</p>
    </div>
  </AutoLocalizedContent>);
}

export function AdminWorkspace({ view }: { view: AdminView }) {
  if (view === "users") return (<AutoLocalizedContent><AdminUsersView /></AutoLocalizedContent>);
  if (view === "organizations") return (<AutoLocalizedContent><AdminOrganizationsView /></AutoLocalizedContent>);
  if (view === "subscriptions") return (<AutoLocalizedContent><AdminSubscriptionsView /></AutoLocalizedContent>);
  if (view === "audit") return (<AutoLocalizedContent><AdminAuditView /></AutoLocalizedContent>);
  if (view === "feature-flags") return (<AutoLocalizedContent><AdminFeatureFlagsView /></AutoLocalizedContent>);
  if (view === "system") return (<AutoLocalizedContent><AdminSystemView /></AutoLocalizedContent>);
  if (view === "ai") return (<AutoLocalizedContent><AdminAiView /></AutoLocalizedContent>);
  return (<AutoLocalizedContent><AdminDashboardView /></AutoLocalizedContent>);
}
