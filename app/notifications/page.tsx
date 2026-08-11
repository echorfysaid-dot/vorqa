"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  Bell,
  BellRing,
  CheckCheck,
  ChevronLeft,
  FileText,
  Filter,
  Inbox,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2
} from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, Input, ProgressBar, SkeletonCard } from "@/components/ui";
import { notificationRepository, useNotificationSummary, useNotifications } from "@/lib/repositories";
import type { Notification as VorqaNotification, NotificationFilters, NotificationPriority, NotificationStatus, NotificationType } from "@/lib/models";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { useI18n } from "@/components/i18n-provider";
import { formatDate } from "@/lib/utils/format";

const statuses: Array<"All" | NotificationStatus> = ["All", "Unread", "Read", "Archived"];
const priorities: Array<"All" | NotificationPriority> = ["All", "Critical", "High", "Medium", "Normal", "Low"];
const modules: Array<"All" | NotificationType | string> = ["All", "Project", "Task", "Milestone", "Budget", "Document", "Knowledge", "Marketplace", "RFQ", "Quotation", "Contract", "VORA AI", "System"];

const priorityTone: Record<NotificationPriority, "gold" | "blue" | "success" | "warning" | "danger" | "neutral"> = {
  Low: "neutral",
  Normal: "blue",
  Medium: "gold",
  High: "warning",
  Critical: "danger"
};

const statusTone: Record<NotificationStatus, "gold" | "blue" | "success" | "warning" | "danger" | "neutral"> = {
  Unread: "gold",
  Read: "success",
  Archived: "neutral",
  Deleted: "danger"
};

export default function NotificationsPage() {
  const { locale } = useI18n();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | NotificationStatus>("All");
  const [priority, setPriority] = useState<"All" | NotificationPriority>("All");
  const [module, setModule] = useState<"All" | string>("All");
  const [page, setPage] = useState(1);
  const [overrides, setOverrides] = useState<Record<string, NotificationStatus>>({});
  const pageSize = 8;
  const filters: NotificationFilters = useMemo(() => ({ query, status, priority, module, page, pageSize }), [query, status, priority, module, page]);
  const notificationsState = useNotifications(filters);
  const summaryState = useNotificationSummary();
  const notifications = notificationsState.data
    .map((item) => (overrides[item.id] ? { ...item, status: overrides[item.id], read: overrides[item.id] !== "Unread" } : item))
    .filter((item) => item.status !== "Deleted");

  async function action(id: string, nextStatus: NotificationStatus) {
    setOverrides((current) => ({ ...current, [id]: nextStatus }));
    if (nextStatus === "Read") await notificationRepository.markAsRead(id);
    if (nextStatus === "Archived") await notificationRepository.archiveNotification(id);
    if (nextStatus === "Deleted") await notificationRepository.deleteNotification(id);
  }

  async function markAllRead() {
    setOverrides((current) => {
      const next = { ...current };
      notifications.forEach((item) => {
        next[item.id] = "Read";
      });
      return next;
    });
    await notificationRepository.markAllAsRead();
  }

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <GlassCard className="relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_12%,rgba(81,216,255,.16),transparent_30%),radial-gradient(circle_at_15%_10%,rgba(215,180,90,.14),transparent_28%)]" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge tone="gold">Enterprise Notifications</Badge>
              <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">Notification Center</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-ds-text/62">
                Unified alerts across organizations, projects, tasks, budgets, RFQs, quotations, contracts, documents, and VORA AI intelligence.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" icon={<CheckCheck className="h-4 w-4" />} onClick={markAllRead}>
                Mark all as read
              </Button>
              <Link href="/dashboard">
                <Button variant="primary" icon={<ChevronLeft className="h-4 w-4" />}>Back to dashboard</Button>
              </Link>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <Badge tone="blue">VORA Signal</Badge>
            <Sparkles className="h-5 w-5 text-cyan-glow" />
          </div>
          <p className="mt-4 text-sm leading-7 text-ds-text/62">
            VORA prioritizes risk-heavy events first: budget overruns, delayed milestones, missing documents, and pending contract approvals.
          </p>
          <div className="mt-5">
            <ProgressBar value={summaryState.loading ? 34 : Math.min(100, summaryState.data.highPriority * 18)} label="Alert pressure" tone="warning" />
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric title="Unread" value={summaryState.loading ? "..." : summaryState.data.unread} icon={<BellRing className="h-5 w-5" />} tone="gold" />
        <Metric title="Critical" value={summaryState.loading ? "..." : summaryState.data.critical} icon={<ShieldAlert className="h-5 w-5" />} tone="danger" />
        <Metric title="Reminders" value={summaryState.loading ? "..." : summaryState.data.reminders} icon={<Inbox className="h-5 w-5" />} tone="warning" />
        <Metric title="AI alerts" value={summaryState.loading ? "..." : summaryState.data.aiAlerts} icon={<Sparkles className="h-5 w-5" />} tone="blue" />
        <Metric title="Total" value={summaryState.loading ? "..." : summaryState.data.total} icon={<Bell className="h-5 w-5" />} tone="neutral" />
      </section>

      <GlassCard className="p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_180px_180px_200px]">
          <Input label="Search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search notifications, context, modules..." icon={<Search className="h-4 w-4" />} />
          <FilterSelect label="Status" value={status} options={statuses} onChange={(value) => { setStatus(value as typeof status); setPage(1); }} />
          <FilterSelect label="Priority" value={priority} options={priorities} onChange={(value) => { setPriority(value as typeof priority); setPage(1); }} />
          <FilterSelect label="Module" value={module} options={modules} onChange={(value) => { setModule(value); setPage(1); }} />
        </div>
      </GlassCard>

      <section className="grid gap-4">
        {notificationsState.loading ? (
          Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)
        ) : notifications.length ? (
          notifications.map((item, index) => <NotificationCard key={item.id} item={item} index={index} locale={locale} onAction={action} />)
        ) : (
          <EmptyState
            title="No notifications found"
            description="Try adjusting the filters or return to all notifications."
            action={<Button variant="secondary" onClick={() => { setQuery(""); setStatus("All"); setPriority("All"); setModule("All"); }}>Clear filters</Button>}
          />
        )}
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ds-text/46">Pagination-ready view · page {page}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
          <Button variant="secondary" size="sm" disabled={notifications.length < pageSize} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      </div>

      {notificationsState.error && notificationsState.isFallback && (
        <GlassCard className="p-4">
          <p className="text-sm font-bold text-ds-text/58">Notifications are shown from demo fallback while production notifications are unavailable.</p>
        </GlassCard>
      )}
    </div>
  </AutoLocalizedContent>);
}

function Metric({ title, value, icon, tone }: { title: string; value: string | number; icon: React.ReactNode; tone: "gold" | "blue" | "success" | "warning" | "danger" | "neutral" }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.055] text-gold">{icon}</span>
        <Badge tone={tone}>{title}</Badge>
      </div>
      <p className="mt-5 text-3xl font-black text-white">{value}</p>
    </GlassCard>
  </AutoLocalizedContent>);
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (<AutoLocalizedContent>
    <label className="grid gap-2 text-sm font-black text-[#f8efd7]/82">
      <span className="text-xs uppercase tracking-[0.12em] text-[#f8efd7]/58">{label}</span>
      <span className="ds-focusable relative flex h-12 items-center rounded-2xl border border-white/10 bg-black/24 px-4 shadow-inner shadow-black/20 ds-transition focus-within:border-[#D4AF37]/44">
        <Filter className="h-4 w-4 text-gold" />
        <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none bg-transparent px-3 text-[#f8efd7] outline-none">
          {options.map((option) => (
            <option key={option} value={option} className="bg-[#111827] text-[#f8efd7]">
              {option}
            </option>
          ))}
        </select>
      </span>
    </label>
  </AutoLocalizedContent>);
}

function NotificationCard({ item, index, locale, onAction }: { item: VorqaNotification; index: number; locale: "ar" | "fr" | "en"; onAction: (id: string, status: NotificationStatus) => void }) {
  return (<AutoLocalizedContent>
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      className="rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-4 shadow-ds-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#D4AF37]/28"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/24 text-gold">
            {item.type === "VORA AI" ? <Sparkles className="h-5 w-5" /> : item.type === "Document" ? <FileText className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone[item.status]}>{item.status}</Badge>
              <Badge tone={priorityTone[item.priority]}>{item.priority}</Badge>
              <Badge tone="neutral">{item.module}</Badge>
            </div>
            <h2 className="mt-3 text-xl font-black text-white">{item.title}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-ds-text/62">{item.message}</p>
            <p className="mt-3 text-xs font-bold text-ds-text/42">{item.context} · {item.createdAt ? formatDate(item.createdAt, locale) : "Now"}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {item.href && (
            <Link href={item.href}>
              <Button variant="secondary" size="sm">Open</Button>
            </Link>
          )}
          {item.status === "Unread" && <Button variant="ghost" size="sm" icon={<CheckCheck className="h-4 w-4" />} onClick={() => onAction(item.id, "Read")}>Read</Button>}
          {item.status !== "Archived" && <Button variant="ghost" size="sm" icon={<Archive className="h-4 w-4" />} onClick={() => onAction(item.id, "Archived")}>Archive</Button>}
          <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => onAction(item.id, "Deleted")}>Delete</Button>
        </div>
      </div>
    </motion.article>
  </AutoLocalizedContent>);
}
