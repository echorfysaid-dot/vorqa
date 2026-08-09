"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileText,
  Heart,
  Info,
  Lightbulb,
  LoaderCircle,
  Megaphone,
  MonitorSmartphone,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  UserRound,
  X
} from "lucide-react";
import type { ToolDefinition } from "@/lib/tools";
import { useI18n } from "@/components/i18n-provider";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

type Tone = "gold" | "blue" | "success" | "warning" | "danger" | "neutral";
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";
type EnterpriseSize = "sm" | "md" | "lg";

export type StatusTone = Tone;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const toneStyles: Record<Tone, { text: string; bg: string; border: string; icon: string }> = {
  gold: { text: "text-ds-token-gold-bright", bg: "bg-ds-token-gold/10", border: "border-ds-token-gold/22", icon: "text-ds-token-gold" },
  blue: { text: "text-[#9EC0FF]", bg: "bg-ds-token-blue/10", border: "border-ds-token-blue/22", icon: "text-ds-token-blue" },
  success: { text: "text-[#8DEAC4]", bg: "bg-ds-token-success/10", border: "border-ds-token-success/22", icon: "text-ds-token-success" },
  warning: { text: "text-[#FFD28A]", bg: "bg-ds-token-warning/10", border: "border-ds-token-warning/22", icon: "text-ds-token-warning" },
  danger: { text: "text-[#FFB4B4]", bg: "bg-ds-token-danger/10", border: "border-ds-token-danger/22", icon: "text-ds-token-danger" },
  neutral: { text: "text-ds-token-text/70", bg: "bg-white/[0.055]", border: "border-ds-token-border", icon: "text-ds-token-text/58" }
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-ds-sm px-3.5 text-xs",
  md: "h-11 rounded-ds-md px-5 text-sm",
  lg: "h-12 rounded-ds-lg px-6 text-base"
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  return (<AutoLocalizedContent>
    <button
      className={cn(
        "group ds-focusable relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors duration-ds-base ease-ds-standard active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
        buttonSizes[size],
        variant === "primary" && "border border-ds-token-gold-bright/20 bg-ds-token-gold text-black shadow-ds-sm hover:bg-ds-token-gold-bright",
        variant === "secondary" && "border border-ds-token-border bg-ds-token-surface-raised text-ds-token-text shadow-ds-sm hover:border-ds-token-gold/30 hover:bg-white/[0.075]",
        variant === "ghost" && "text-ds-token-text/70 hover:bg-white/[0.055] hover:text-ds-token-text",
        variant === "danger" && "border border-ds-token-danger/24 bg-ds-token-danger/10 text-[#FFB4B4] hover:bg-ds-token-danger/16",
        className
      )}
      {...props}
      disabled={loading || props.disabled}
    >
      {loading ? <LoaderCircle className="relative z-10 h-4 w-4 animate-spin" aria-hidden="true" /> : icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  </AutoLocalizedContent>);
}

export function IconButton({
  children,
  label,
  tone = "gold",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: Tone;
  size?: EnterpriseSize;
}) {
  const sizes: Record<EnterpriseSize, string> = {
    sm: "h-9 w-9 rounded-ds-sm",
    md: "h-10 w-10 rounded-ds-md",
    lg: "h-11 w-11 rounded-ds-lg"
  };
  const toneClass = toneStyles[tone];

  return (<AutoLocalizedContent>
    <button
      aria-label={label}
      title={label}
      className={cn(
        "group ds-focusable relative inline-grid shrink-0 place-items-center border bg-ds-token-surface-raised shadow-sm transition-colors duration-ds-base ease-ds-standard hover:border-ds-token-border-strong hover:bg-white/[0.075] active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
        sizes[size],
        toneClass.border,
        toneClass.icon,
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  </AutoLocalizedContent>);
}

export function Input({
  label,
  icon,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}) {
  return (<AutoLocalizedContent>
    <label className="grid gap-2 text-sm font-black text-ds-token-text/82">
      {label && <span className="text-xs uppercase tracking-[0.12em] text-ds-token-text/58">{label}</span>}
      <span className={cn("flex h-11 items-center gap-3 rounded-ds-sm border border-ds-token-border bg-black/20 px-3.5 transition-colors duration-ds-base focus-within:border-ds-token-gold/52 focus-within:bg-white/[0.045] focus-within:shadow-[var(--ds-focus)]", error && "border-ds-token-danger/44", className)}>
        {icon && <span className="text-ds-token-gold">{icon}</span>}
        <input className="w-full bg-transparent text-ds-token-text outline-none placeholder:text-ds-token-text/32" {...props} />
      </span>
      {error && <span className="text-xs font-bold text-[#FFB4B4]">{error}</span>}
    </label>
  </AutoLocalizedContent>);
}

export function Textarea({
  label,
  error,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (<AutoLocalizedContent>
    <label className="grid gap-2 text-sm font-black text-ds-token-text/82">
      {label && <span className="text-xs uppercase tracking-[0.12em] text-ds-token-text/58">{label}</span>}
      <textarea
        className={cn("min-h-32 rounded-ds-sm border border-ds-token-border bg-black/20 px-3.5 py-3 leading-7 text-ds-token-text outline-none transition-colors duration-ds-base placeholder:text-ds-token-text/32 focus:border-ds-token-gold/52 focus:bg-white/[0.045] focus:shadow-[var(--ds-focus)]", error && "border-ds-token-danger/44", className)}
        {...props}
      />
      {error && <span className="text-xs font-bold text-[#FFB4B4]">{error}</span>}
    </label>
  </AutoLocalizedContent>);
}

export function Dropdown({
  label,
  options,
  value,
  onChange,
  className = ""
}: {
  label?: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (<AutoLocalizedContent>
    <label className="grid gap-2 text-sm font-black text-ds-token-text/82">
      {label && <span className="text-xs uppercase tracking-[0.12em] text-ds-token-text/58">{label}</span>}
      <span className={cn("relative flex h-11 items-center rounded-ds-sm border border-ds-token-border bg-black/20 px-3.5 transition-colors duration-ds-base focus-within:border-ds-token-gold/44 focus-within:shadow-[var(--ds-focus)]", className)}>
        <select value={value} onChange={(event) => onChange?.(event.target.value)} className="w-full appearance-none bg-transparent text-ds-token-text outline-none">
          {options.map((option) => (
            <option key={option} value={option} className="bg-[#111827] text-ds-token-text">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-4 h-4 w-4 text-ds-token-gold" />
      </span>
    </label>
  </AutoLocalizedContent>);
}

export const Select = Dropdown;

export function Checkbox({ label, description, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  const id = useId();
  return (<AutoLocalizedContent><label htmlFor={props.id || id} className={cn("flex min-h-10 cursor-pointer items-start gap-3 text-sm text-ds-token-text", className)}>
    <input id={props.id || id} type="checkbox" className="mt-1 h-4 w-4 shrink-0 rounded border-ds-token-border accent-ds-token-gold" {...props} />
    <span><span className="font-semibold">{label}</span>{description && <span className="mt-0.5 block text-xs leading-5 text-ds-token-muted">{description}</span>}</span>
  </label></AutoLocalizedContent>);
}

export function Radio({ label, description, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  const id = useId();
  return (<AutoLocalizedContent><label htmlFor={props.id || id} className={cn("flex min-h-10 cursor-pointer items-start gap-3 text-sm text-ds-token-text", className)}>
    <input id={props.id || id} type="radio" className="mt-1 h-4 w-4 shrink-0 border-ds-token-border accent-ds-token-gold" {...props} />
    <span><span className="font-semibold">{label}</span>{description && <span className="mt-0.5 block text-xs leading-5 text-ds-token-muted">{description}</span>}</span>
  </label></AutoLocalizedContent>);
}

export function Switch({ label, description, checked, onChange, disabled, className = "" }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; className?: string }) {
  return (<AutoLocalizedContent><label className={cn("flex min-h-11 cursor-pointer items-center justify-between gap-4", disabled && "cursor-not-allowed opacity-45", className)}>
    <span><span className="block text-sm font-semibold text-ds-token-text">{label}</span>{description && <span className="mt-0.5 block text-xs leading-5 text-ds-token-muted">{description}</span>}</span>
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={cn("ds-focusable relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-ds-base", checked ? "border-ds-token-gold bg-ds-token-gold" : "border-ds-token-border bg-white/10")}>
      <span className={cn("absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-[inset-inline-start] duration-ds-base", checked ? "start-[1.25rem]" : "start-0.5")} />
    </button>
  </label></AutoLocalizedContent>);
}

export function Panel({
  children,
  title,
  description,
  action,
  tone = "neutral",
  className = ""
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const toneClass = toneStyles[tone];
  return (<AutoLocalizedContent>
    <section className={cn("ds-surface rounded-ds-xl p-5 sm:p-6", tone !== "neutral" && toneClass.border, className)}>
      {(title || description || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="text-xl font-black leading-tight text-[#f8efd7]">{title}</h2>}
            {description && <p className="mt-2 text-sm leading-7 text-[#f8efd7]/58">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  </AutoLocalizedContent>);
}

export function Card({
  children,
  className = "",
  interactive = false
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (<AutoLocalizedContent>
    <motion.div
      className={cn("ds-surface-static rounded-ds-md", interactive && "ds-surface-interactive", className)}
    >
      {children}
    </motion.div>
  </AutoLocalizedContent>);
}

export function GlassCard({
  children,
  className = "",
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (<AutoLocalizedContent>
    <motion.div
      initial={delay > 0 ? { opacity: 0 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.18, ease: "easeOut" }}
      className={cn("ds-surface rounded-ds-md", className)}
    >
      {children}
    </motion.div>
  </AutoLocalizedContent>);
}

export function Badge({ children, tone = "gold", className = "" }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  const toneClass = toneStyles[tone];
  return (<AutoLocalizedContent><span className={cn("inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold leading-none shadow-sm", toneClass.bg, toneClass.border, toneClass.text, className)}>{children}</span></AutoLocalizedContent>);
}

export function Avatar({ name, src, size = "md" }: { name: string; src?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-14 w-14 text-base" };
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (<AutoLocalizedContent>
    <span className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-ds-md bg-gradient-to-br from-[#F3D584] to-[#A77A2D] font-black text-black shadow-gold-glow ring-1 ring-white/15", sizes[size])}>
      {src ? <Image src={src} alt={name} fill sizes={size === "lg" ? "56px" : size === "sm" ? "32px" : "40px"} unoptimized className="object-cover" /> : initials || "V"}
    </span>
  </AutoLocalizedContent>);
}

export function Alert({ title, children, tone = "blue" }: { title: string; children?: React.ReactNode; tone?: Tone }) {
  const toneClass = toneStyles[tone];
  const Icon = tone === "danger" ? AlertCircle : tone === "success" ? CheckCircle2 : Info;
  return (<AutoLocalizedContent>
    <div className={cn("flex gap-3 rounded-ds-lg border p-4 shadow-sm", toneClass.bg, toneClass.border)}>
      <Icon className={cn("mt-0.5 h-5 w-5", toneClass.icon)} />
      <div>
        <p className={cn("font-black", toneClass.text)}>{title}</p>
        {children && <div className="mt-1 text-sm leading-6 text-[#f8efd7]/62">{children}</div>}
      </div>
    </div>
  </AutoLocalizedContent>);
}

export function Modal({
  open,
  title,
  children,
  onClose
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  return (<AutoLocalizedContent>
    <AnimatePresence>
      {open && (
        <>
          <motion.button className="fixed inset-0 z-[90] bg-black/72 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-label="إغلاق النافذة" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed left-1/2 top-1/2 z-[100] w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-ds-xl border border-ds-token-border bg-ds-token-overlay p-5 shadow-ds-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-[#f8efd7]">{title}</h2>
              <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.06] text-[#f8efd7]/70 hover:text-[#f8efd7]" aria-label="إغلاق">
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </AutoLocalizedContent>);
}

export function Tooltip({
  children,
  content,
  side = "top"
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "bottom";
}) {
  return (<AutoLocalizedContent>
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-[120] w-max max-w-64 rounded-ds-sm border border-ds-token-border bg-ds-token-secondary/96 px-3 py-2 text-xs font-bold leading-5 text-ds-token-text opacity-0 shadow-ds-md backdrop-blur-xl transition duration-ds-base group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          side === "top" ? "bottom-full left-1/2 mb-2 -translate-x-1/2" : "left-1/2 top-full mt-2 -translate-x-1/2"
        )}
      >
        {content}
      </span>
    </span>
  </AutoLocalizedContent>);
}

export function Notification({
  title,
  description,
  tone = "blue",
  icon,
  action,
  onClose
}: {
  title: string;
  description?: string;
  tone?: Tone;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
}) {
  const toneClass = toneStyles[tone];
  return (<AutoLocalizedContent>
    <div className={cn("flex gap-3 rounded-ds-lg border p-4 shadow-ds-md backdrop-blur-xl", toneClass.bg, toneClass.border)}>
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-ds-md bg-black/18", toneClass.icon)}>{icon || <Info className="h-5 w-5" />}</span>
      <div className="min-w-0 flex-1">
        <p className={cn("font-black", toneClass.text)}>{title}</p>
        {description && <p className="mt-1 text-sm leading-6 text-[#f8efd7]/62">{description}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl text-[#f8efd7]/48 transition hover:bg-white/10 hover:text-[#f8efd7]" aria-label="Dismiss notification">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  </AutoLocalizedContent>);
}

export function Tabs({
  tabs,
  active,
  onChange
}: {
  tabs: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  active: string;
  onChange: (value: string) => void;
}) {
  return (<AutoLocalizedContent>
    <div role="tablist" className="inline-flex max-w-full gap-1 overflow-x-auto border-b border-ds-token-border">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn("ds-focusable relative inline-flex h-10 shrink-0 items-center gap-2 px-3 text-sm font-semibold transition-colors duration-ds-base", active === tab.value ? "text-ds-token-gold" : "text-ds-token-muted hover:text-ds-token-text")}
        >
          {active === tab.value && <motion.span layoutId="ds-tab-active" className="absolute inset-x-0 bottom-0 h-0.5 bg-ds-token-gold" />}
          <span className="relative z-10">{tab.icon}</span>
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  </AutoLocalizedContent>);
}

export function ProgressBar({ value, tone = "gold", label }: { value: number; tone?: Tone; label?: string }) {
  const toneClass = toneStyles[tone];
  return (<AutoLocalizedContent>
    <div>
      {label && <div className="mb-2 flex items-center justify-between text-xs font-black text-[#f8efd7]/58"><span>{label}</span><span>{Math.round(value)}%</span></div>}
      <div className="h-2.5 overflow-hidden rounded-full border border-white/5 bg-white/10 shadow-inner shadow-black/20">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className={cn("h-full rounded-full shadow-[0_0_22px_currentColor]", toneClass.bg, tone === "gold" && "bg-gradient-to-l from-[#F9E7A0] to-[#D4AF37]", tone === "blue" && "bg-[#4F8CFF]", tone === "success" && "bg-[#16C784]", tone === "warning" && "bg-[#FFB020]", tone === "danger" && "bg-[#EF4444]")}
        />
      </div>
    </div>
  </AutoLocalizedContent>);
}

export const Progress = ProgressBar;

export function Table({
  columns,
  rows,
  caption,
  selectedRows = [],
  onRowSelect,
  onSort,
  sortColumn,
  sortDirection,
  bulkActions,
  filters
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
  caption?: string;
  selectedRows?: number[];
  onRowSelect?: (rowIndex: number, selected: boolean) => void;
  onSort?: (column: string, columnIndex: number) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  bulkActions?: React.ReactNode;
  filters?: React.ReactNode;
}) {
  return (<AutoLocalizedContent>
    <div className="overflow-hidden rounded-ds-md border border-ds-token-border bg-ds-token-surface">
      {(filters || (selectedRows.length > 0 && bulkActions)) && <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-ds-token-border px-4 py-2">{filters}<div>{selectedRows.length > 0 && bulkActions}</div></div>}
      <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-[13px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-white/[0.035] text-ds-token-muted">
          <tr>
            {onRowSelect && <th className="w-12 px-4 py-3"><span className="sr-only">{caption}</span></th>}
            {columns.map((column) => (
              <th key={column} scope="col" aria-sort={sortColumn === column ? (sortDirection === "desc" ? "descending" : "ascending") : undefined} className="h-10 px-4 text-start font-semibold">
                {onSort ? <button type="button" onClick={() => onSort(column, columns.indexOf(column))} className="ds-focusable inline-flex min-h-9 items-center gap-1 rounded-ds-sm text-start hover:text-ds-token-text">{column}{sortColumn === column && <span aria-hidden="true">{sortDirection === "desc" ? "↓" : "↑"}</span>}</button> : column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={cn("h-12 border-t border-ds-token-border text-ds-token-text/72 transition-colors hover:bg-white/[0.035]", selectedRows.includes(rowIndex) && "bg-ds-token-gold/7")}>
              {onRowSelect && <td className="w-12 px-4"><input type="checkbox" checked={selectedRows.includes(rowIndex)} onChange={(event) => onRowSelect(rowIndex, event.target.checked)} className="h-4 w-4 accent-ds-token-gold" aria-label={`${caption || "row"} ${rowIndex + 1}`} /></td>}
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2.5">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  </AutoLocalizedContent>);
}

export function ChartContainer({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (<AutoLocalizedContent>
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="font-black text-[#f8efd7]">{title}</h3>
        {action}
      </div>
      <div className="min-h-48 rounded-ds-lg border border-ds-token-border bg-black/18 p-4 shadow-inner shadow-black/20">{children}</div>
    </Card>
  </AutoLocalizedContent>);
}

export function TimelineCard({ index, title, text, icon }: { index: number; title: string; text: string; icon?: React.ReactNode }) {
  return (<AutoLocalizedContent>
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-4"
    >
      <div className="flex flex-col items-center">
        <span className="grid h-10 w-10 place-items-center rounded-ds-md bg-ds-token-gold text-sm font-black text-black shadow-gold-glow">{icon || index}</span>
        <span className="mt-2 h-full w-px bg-gradient-to-b from-[#D4AF37]/60 to-transparent" />
      </div>
      <Card interactive className="flex-1 p-4">
        <p className="font-black text-[#f8efd7]">{title}</p>
        <p className="mt-2 text-sm leading-6 text-[#f8efd7]/58">{text}</p>
      </Card>
    </motion.div>
  </AutoLocalizedContent>);
}

export function SidebarItem({ active, icon, label, href }: { active?: boolean; icon: React.ReactNode; label: string; href: string }) {
  return (<AutoLocalizedContent>
    <Link href={href} className={cn("group ds-focusable flex items-center gap-3 rounded-ds-md px-3 py-2.5 text-sm font-bold ds-transition", active ? "border border-ds-token-gold/24 bg-ds-token-gold/14 text-ds-token-gold-bright" : "text-ds-token-text/58 hover:bg-white/[0.05] hover:text-ds-token-text")}>
      <span className="transition-transform duration-ds-base group-hover:-rotate-6">{icon}</span>
      {label}
    </Link>
  </AutoLocalizedContent>);
}

export function NavbarItem({
  href,
  label,
  active,
  icon
}: {
  href: string;
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
}) {
  return (<AutoLocalizedContent>
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group inline-flex h-9 items-center gap-2 rounded-ds-md px-4 text-sm font-bold transition-all duration-ds-base ease-ds-out",
        active ? "bg-[#D4AF37]/12 text-[#F5D878] shadow-[inset_0_0_0_1px_rgba(215,180,90,.22)]" : "text-[#f8efd7]/58 hover:bg-white/[0.06] hover:text-[#f8efd7]"
      )}
    >
      {icon && <span className="transition-transform duration-ds-base group-hover:-rotate-6">{icon}</span>}
      {label}
    </Link>
  </AutoLocalizedContent>);
}

export function Navbar({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (<AutoLocalizedContent><header className={cn("sticky top-0 z-40 border-b border-ds-token-border bg-ds-token-bg/88 backdrop-blur-xl", className)}>{children}</header></AutoLocalizedContent>);
}

export function ChatBubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  const assistant = role === "assistant";
  return (<AutoLocalizedContent>
    <div className={cn("flex", assistant ? "justify-start" : "justify-end")}>
      <div className={cn("max-w-[82%] rounded-ds-lg px-4 py-3 text-sm leading-7 shadow-ds-sm", assistant ? "border border-ds-token-gold/18 bg-ds-token-gold/10 text-ds-token-text" : "border border-ds-token-blue/18 bg-ds-token-blue/12 text-[#dce8ff]")}>
        {children}
      </div>
    </div>
  </AutoLocalizedContent>);
}

export function ProjectCard({
  title,
  description,
  meta,
  progress = 0
}: {
  title: string;
  description: string;
  meta?: string;
  progress?: number;
}) {
  return (<AutoLocalizedContent>
    <Card interactive className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone="blue">{meta || "مشروع"}</Badge>
          <h3 className="mt-4 text-xl font-black text-[#f8efd7]">{title}</h3>
          <p className="mt-3 text-sm leading-7 text-[#f8efd7]/58">{description}</p>
        </div>
        <Avatar name={title} size="sm" />
      </div>
      <div className="mt-5">
        <ProgressBar value={progress} label="التقدم" />
      </div>
    </Card>
  </AutoLocalizedContent>);
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (<AutoLocalizedContent>
    <div className="mb-6 flex flex-col gap-4 border-b border-ds-token-border pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ds-token-gold">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold leading-8 text-ds-token-text sm:text-[28px]">{title}</h1>
        {description && <p className="mt-2 text-sm leading-6 text-ds-token-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  </AutoLocalizedContent>);
}

type SerializableTool = Omit<ToolDefinition, "icon">;

const toolIcons = {
  document: FileText,
  "contract-review": Scale,
  "boq-review": Calculator,
  "risk-assessment": ShieldAlert,
  "planning-review": CalendarDays,
  "site-report-review": ClipboardList,
  "executive-summary": FileText,
  cv: UserRound,
  "landing-page": MonitorSmartphone,
  "business-idea": Lightbulb,
  marketing: Megaphone
};

export function ToolCard({ tool, index = 0 }: { tool: SerializableTool; index?: number }) {
  const Icon = toolIcons[tool.slug];
  const { dictionary: t } = useI18n();
  const localizedTool = t.tools.definitions[tool.slug];

  return (<AutoLocalizedContent>
    <GlassCard delay={index * 0.04} className="group overflow-hidden p-5">
      <div className="mb-5 flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-ds-lg bg-gradient-to-br ${tool.accent} text-black shadow-gold-glow ds-transition group-hover:-translate-y-0.5`}>
          <Icon className="h-7 w-7" />
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#f8efd7]/52 ds-transition hover:-translate-y-0.5 hover:border-[#D4AF37]/24 hover:text-[#D4AF37]" aria-label="إضافة للمفضلة">
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <Badge>{localizedTool.category}</Badge>
      <h3 className="mt-4 text-xl font-black text-[#f8efd7]">{localizedTool.title}</h3>
      <p className="mt-3 min-h-20 text-sm leading-7 text-[#f8efd7]/56">{localizedTool.description}</p>
      <Link href={`/tools/${tool.slug}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-ds-md bg-gold-linear px-4 py-3 text-sm font-black text-black shadow-gold-glow ds-transition hover:brightness-105">
        {localizedTool.cta}
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </GlassCard>
  </AutoLocalizedContent>);
}

export function SearchBar({ placeholder = "ابحث..." }: { placeholder?: string }) {
  return (<AutoLocalizedContent>
    <div className="group ds-focusable flex items-center gap-3 rounded-ds-md border border-ds-token-border bg-black/20 px-4 py-2.5 shadow-inner shadow-black/20 ds-transition focus-within:border-ds-token-gold/40 focus-within:bg-white/[0.055]">
      <Search className="h-5 w-5 text-ds-token-gold transition-transform duration-ds-base group-focus-within:scale-110" />
      <input className="w-full bg-transparent text-sm text-ds-token-text outline-none placeholder:text-ds-token-text/38" placeholder={placeholder} aria-label={placeholder} />
    </div>
  </AutoLocalizedContent>);
}

export function SkeletonCard() {
  return (<AutoLocalizedContent>
    <div aria-busy="true" className="rounded-ds-md border border-ds-token-border bg-white/[0.025] p-5">
      <div className="ds-skeleton h-12 w-12 rounded-2xl" />
      <div className="ds-skeleton mt-5 h-4 w-3/5 rounded" />
      <div className="ds-skeleton mt-3 h-3 w-full rounded" />
      <div className="ds-skeleton mt-2 h-3 w-4/5 rounded" />
      <div className="ds-skeleton mt-5 h-10 rounded-2xl" />
    </div>
  </AutoLocalizedContent>);
}

export function EmptyState({
  title,
  description,
  action,
  icon
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (<AutoLocalizedContent>
    <Card className="grid place-items-center p-8 text-center sm:p-10">
      <div className="grid h-12 w-12 place-items-center rounded-ds-md border border-ds-token-border bg-white/[0.035] text-ds-token-muted">
        {icon || <Sparkles className="h-7 w-7" />}
      </div>
      <h3 className="mt-4 text-base font-semibold text-ds-token-text">{title}</h3>
      {description && <p className="mt-3 max-w-md text-sm leading-7 text-ds-token-text/58">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </Card>
  </AutoLocalizedContent>);
}

export const StatusChip = Badge;
export const Dialog = Modal;
export const Toast = Notification;

export function Drawer({ open, title, children, onClose, side = "end" }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void; side?: "start" | "end" }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  return (<AutoLocalizedContent><AnimatePresence>{open && <>
    <motion.button type="button" aria-label={title} className="fixed inset-0 z-[60] bg-black/72" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.aside role="dialog" aria-modal="true" aria-label={title} initial={{ x: side === "end" ? "100%" : "-100%" }} animate={{ x: 0 }} exit={{ x: side === "end" ? "100%" : "-100%" }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }} className={cn("fixed inset-y-0 z-[61] flex w-[min(400px,calc(100vw-1rem))] flex-col border-ds-token-border bg-ds-token-overlay shadow-ds-lg", side === "end" ? "end-0 border-s" : "start-0 border-e")}>
      <div className="flex min-h-16 items-center justify-between gap-4 border-b border-ds-token-border px-5"><h2 className="text-lg font-semibold text-ds-token-text">{title}</h2><IconButton label={title} tone="neutral" onClick={onClose}><X className="h-4 w-4" /></IconButton></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
    </motion.aside>
  </>}</AnimatePresence></AutoLocalizedContent>);
}

export function SearchField({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (<AutoLocalizedContent><label className={cn("flex h-11 items-center gap-3 rounded-ds-sm border border-ds-token-border bg-black/20 px-3.5 transition-colors duration-ds-base focus-within:border-ds-token-gold/44 focus-within:shadow-[var(--ds-focus)]", className)}>
    <Search className="h-4 w-4 shrink-0 text-ds-token-muted" aria-hidden="true" />
    <input type="search" aria-label={label} placeholder={props.placeholder || label} className="min-w-0 flex-1 bg-transparent text-sm text-ds-token-text outline-none placeholder:text-ds-token-muted-soft" {...props} />
  </label></AutoLocalizedContent>);
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={cn("ds-skeleton block rounded-ds-sm", className)} />;
}

export function LoadingState({ title, description }: { title: string; description?: string }) {
  return (<AutoLocalizedContent><div role="status" aria-live="polite" className="grid min-h-48 place-items-center rounded-ds-md border border-ds-token-border bg-white/[0.02] p-8 text-center">
    <div><LoaderCircle className="mx-auto h-6 w-6 animate-spin text-ds-token-gold" /><p className="mt-4 text-sm font-semibold text-ds-token-text">{title}</p>{description && <p className="mt-1 text-xs leading-5 text-ds-token-muted">{description}</p>}</div>
  </div></AutoLocalizedContent>);
}

export function ErrorState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (<AutoLocalizedContent><div role="alert" className="grid min-h-48 place-items-center rounded-ds-md border border-ds-token-danger/24 bg-ds-token-danger/5 p-8 text-center">
    <div><CircleAlert className="mx-auto h-7 w-7 text-ds-token-danger" /><h3 className="mt-4 text-base font-semibold text-ds-token-text">{title}</h3>{description && <p className="mt-2 max-w-md text-sm leading-6 text-ds-token-muted">{description}</p>}{action && <div className="mt-5">{action}</div>}</div>
  </div></AutoLocalizedContent>);
}

export function Pagination({ page, pageCount, onPageChange, previousLabel, nextLabel }: { page: number; pageCount: number; onPageChange: (page: number) => void; previousLabel: string; nextLabel: string }) {
  const safePage = Math.min(Math.max(1, page), Math.max(1, pageCount));
  return (<AutoLocalizedContent><nav aria-label={`${safePage} / ${pageCount}`} className="flex items-center justify-between gap-3">
    <Button variant="secondary" size="sm" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)} icon={<ChevronLeft className="h-4 w-4 rtl:rotate-180" />}>{previousLabel}</Button>
    <span className="text-xs font-semibold tabular-nums text-ds-token-muted">{safePage} / {Math.max(1, pageCount)}</span>
    <Button variant="secondary" size="sm" disabled={safePage >= pageCount} onClick={() => onPageChange(safePage + 1)} icon={<ChevronRight className="h-4 w-4 rtl:rotate-180" />}>{nextLabel}</Button>
  </nav></AutoLocalizedContent>);
}

export function Breadcrumb({ items, label }: { items: Array<{ label: string; href?: string }>; label: string }) {
  return (<AutoLocalizedContent><nav aria-label={label}><ol className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-ds-token-muted">{items.map((item, index) => <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">{index > 0 && <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rtl:rotate-180" />}{item.href ? <Link href={item.href} className="ds-focusable truncate rounded hover:text-ds-token-text">{item.label}</Link> : <span aria-current="page" className="truncate font-semibold text-ds-token-text">{item.label}</span>}</li>)}</ol></nav></AutoLocalizedContent>);
}

export function FormSection({ title, description, children, className = "" }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (<AutoLocalizedContent><fieldset className={cn("grid gap-5 border-0 p-0", className)}><legend className="w-full border-b border-ds-token-border pb-3 text-base font-semibold text-ds-token-text">{title}</legend>{description && <p className="-mt-3 text-sm leading-6 text-ds-token-muted">{description}</p>}<div className="grid gap-4">{children}</div></fieldset></AutoLocalizedContent>);
}

export function FormActions({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col-reverse gap-2 border-t border-ds-token-border pt-5 sm:flex-row sm:justify-end", className)}>{children}</div>;
}
