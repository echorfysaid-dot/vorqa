"use client";

import Link from "next/link";
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
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-ds-md bg-gradient-to-br from-[#F3D584] to-[#A77A2D] font-black text-black shadow-gold-glow ring-1 ring-white/15", sizes[size])}>
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials || "V"}
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
          <motion.button className="fixed inset-0 z-[90] bg-black/72 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-label="Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù†Ø§ÙØ°Ø©" />
          <motion.div
            role="dialog"
           ÛÝ4¶‰žËkºwµçU¹Ðø(€€€€ñµ½Ñ¥½¸¹‘¥Ø(€€€€€¥¹¥Ñ¥…°õíì½Á…¥Ñäè€À°äè€ÄÈõô(€€€€€Ý¡¥±•%¹Y¥•Üõíì½Á…¥Ñäè€Ä°äè€Àõô(€€€€€Ù¥•ÝÁ½ÉÐõíì½¹”èÑÉÕ”°µ…É¥¸è€ˆ´ÐÁÁàˆõô(€€€€€ÑÉ…¹Í¥Ñ¥½¸õíì‘ÕÉ…Ñ¥½¸è€À¸ÌÐ°•…Í”èlÀ¸ÈÈ°€Ä°€À¸ÌØ°€Åtõô(€€€€€±…ÍÍ9…µ”ô‰É•±…Ñ¥Ù”™±•à…À´Ðˆ(€€€€ø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°¥Ñ•µÌµ•¹Ñ•Èˆø(€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰É¥ ´ÄÀÜ´ÄÀÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µ‘Ìµµ‰œµ‘ÌµÑ½­•¸µ½±Ñ•áÐµÍ´™½¹Ðµ‰±…¬Ñ•áÐµ‰±…¬Í¡…‘½Üµ½±µ±½Üˆùí¥½¸ñð¥¹‘•áôð½ÍÁ…¸ø(€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µÐ´È µ™Õ±°ÜµÁà‰œµÉ…‘¥•¹ÐµÑ¼µˆ™É½´µlÑÌÝt¼ØÀÑ¼µÑÉ…¹ÍÁ…É•¹Ðˆ€¼ø(€€€€€€ð½‘¥Øø(€€€€€€ñ…É¥¹Ñ•É…Ñ¥Ù”±…ÍÍ9…µ”ô‰™±•à´ÄÀ´Ðˆø(€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰™½¹Ðµ‰±…¬Ñ•áÐµl˜á•™ÝtˆùíÑ¥Ñ±•ôð½Àø(€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´ÈÑ•áÐµÍ´±•…‘¥¹œ´ØÑ•áÐµl˜á•™Ýt¼ÔàˆùíÑ•áÑôð½Àø(€€€€€€ð½…Éø(€€€€ð½µ½Ñ¥½¸¹‘¥Øø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸M¥‘•‰…É%Ñ•´¡ì…Ñ¥Ù”°¥½¸°±…‰•°°¡É•˜ôèì…Ñ¥Ù”üè‰½½±•…¸ì¥½¸èI•…Ð¹I•…Ñ9½‘”ì±…‰•°èÍÑÉ¥¹œì¡É•˜èÍÑÉ¥¹œô¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø(€€€€ñ1¥¹¬¡É•˜õí¡É•™ô±…ÍÍ9…µ”õí¸ ‰É½ÕÀ‘Ìµ™½ÕÍ…‰±”™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÌÉ½Õ¹‘•µ‘ÌµµÁà´ÌÁä´È¸ÔÑ•áÐµÍ´™½¹Ðµ‰½±‘ÌµÑÉ…¹Í¥Ñ¥½¸ˆ°…Ñ¥Ù”€ü€‰‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ½±¼ÈÐ‰œµ‘ÌµÑ½­•¸µ½±¼ÄÐÑ•áÐµ‘ÌµÑ½­•¸µ½±µ‰É¥¡Ðˆ€è€‰Ñ•áÐµ‘ÌµÑ½­•¸µÑ•áÐ¼Ôà¡½Ù•Èé‰œµÝ¡¥Ñ”½lÀ¸ÀÕt¡½Ù•ÈéÑ•áÐµ‘ÌµÑ½­•¸µÑ•áÐˆ¥ôø(€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰ÑÉ…¹Í¥Ñ¥½¸µÑÉ…¹Í™½É´‘ÕÉ…Ñ¥½¸µ‘Ìµ‰…Í”É½ÕÀµ¡½Ù•ÈèµÉ½Ñ…Ñ”´Øˆùí¥½¹ôð½ÍÁ…¸ø(€€€€€í±…‰•±ô(€€€€ð½1¥¹¬ø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸9…Ù‰…É%Ñ•´¡ì(€¡É•˜°(€±…‰•°°(€…Ñ¥Ù”°(€¥½¸)ôèì(€¡É•˜èÍÑÉ¥¹œì(€±…‰•°èÍÑÉ¥¹œì(€…Ñ¥Ù”üè‰½½±•…¸ì(€¥½¸üèI•…Ð¹I•…Ñ9½‘”ì)ô¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø(€€€€ñ1¥¹¬(€€€€€¡É•˜õí¡É•™ô(€€€€€…É¥„µÕÉÉ•¹Ðõí…Ñ¥Ù”€ü€‰Á…”ˆ€èÕ¹‘•™¥¹•‘ô(€€€€€±…ÍÍ9…µ”õí¸ (€€€€€€€€‰É½ÕÀ¥¹±¥¹”µ™±•à ´ä¥Ñ•µÌµ•¹Ñ•È…À´ÈÉ½Õ¹‘•µ‘ÌµµÁà´ÐÑ•áÐµÍ´™½¹Ðµ‰½±ÑÉ…¹Í¥Ñ¥½¸µ…±°‘ÕÉ…Ñ¥½¸µ‘Ìµ‰…Í”•…Í”µ‘Ìµ½ÕÐˆ°(€€€€€€€…Ñ¥Ù”€ü€‰‰œµlÑÌÝt¼ÄÈÑ•áÐµlÕàÜátÍ¡…‘½Üµm¥¹Í•Ñ|Á|Á|Á|ÅÁá}É‰„ ÈÄÔ°ÄàÀ°äÀ°¸ÈÈ¥tˆ€è€‰Ñ•áÐµl˜á•™Ýt¼Ôà¡½Ù•Èé‰œµÝ¡¥Ñ”½lÀ¸ÀÙt¡½Ù•ÈéÑ•áÐµl˜á•™Ýtˆ(€€€€€€¥ô(€€€€ø(€€€€€í¥½¸€˜˜€ñÍÁ…¸±…ÍÍ9…µ”ô‰ÑÉ…¹Í¥Ñ¥½¸µÑÉ…¹Í™½É´‘ÕÉ…Ñ¥½¸µ‘Ìµ‰…Í”É½ÕÀµ¡½Ù•ÈèµÉ½Ñ…Ñ”´Øˆùí¥½¹ôð½ÍÁ…¸ùô(€€€€€í±…‰•±ô(€€€€ð½1¥¹¬ø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸9…Ù‰…È¡ì¡¥±‘É•¸°±…ÍÍ9…µ”€ô€ˆˆôèì¡¥±‘É•¸èI•…Ð¹I•…Ñ9½‘”ì±…ÍÍ9…µ”üèÍÑÉ¥¹œô¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðøñ¡•…‘•È±…ÍÍ9…µ”õí¸ ‰ÍÑ¥­äÑ½À´Àè´ÐÀ‰½É‘•Èµˆ‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµ‘ÌµÑ½­•¸µ‰œ¼àà‰…­‘É½Àµ‰±ÕÈµá°ˆ°±…ÍÍ9…µ”¥ôùí¡¥±‘É•¹ôð½¡•…‘•Èøð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸¡…Ñ	Õ‰‰±”¡ìÉ½±”°¡¥±‘É•¸ôèìÉ½±”è€‰ÕÍ•Èˆð€‰…ÍÍ¥ÍÑ…¹Ðˆì¡¥±‘É•¸èI•…Ð¹I•…Ñ9½‘”ô¤ì(€½¹ÍÐ…ÍÍ¥ÍÑ…¹Ð€ôÉ½±”€ôôô€‰…ÍÍ¥ÍÑ…¹Ðˆì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø(€€€€ñ‘¥Ø±…ÍÍ9…µ”õí¸ ‰™±•àˆ°…ÍÍ¥ÍÑ…¹Ð€ü€‰©ÕÍÑ¥™äµÍÑ…ÉÐˆ€è€‰©ÕÍÑ¥™äµ•¹ˆ¥ôø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õí¸ ‰µ…àµÜµlàÈ•tÉ½Õ¹‘•µ‘Ìµ±œÁà´ÐÁä´ÌÑ•áÐµÍ´±•…‘¥¹œ´ÜÍ¡…‘½Üµ‘ÌµÍ´ˆ°…ÍÍ¥ÍÑ…¹Ð€ü€‰‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ½±¼Äà‰œµ‘ÌµÑ½­•¸µ½±¼ÄÀÑ•áÐµ‘ÌµÑ½­•¸µÑ•áÐˆ€è€‰‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ‰±Õ”¼Äà‰œµ‘ÌµÑ½­•¸µ‰±Õ”¼ÄÈÑ•áÐµl‘”á™™tˆ¥ôø(€€€€€€€í¡¥±‘É•¹ô(€€€€€€ð½‘¥Øø(€€€€ð½‘¥Øø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸AÉ½©•Ñ…É¡ì(€Ñ¥Ñ±”°(€‘•ÍÉ¥ÁÑ¥½¸°(€µ•Ñ„°(€ÁÉ½É•ÍÌ€ô€À)ôèì(€Ñ¥Ñ±”èÍÑÉ¥¹œì(€‘•ÍÉ¥ÁÑ¥½¸èÍÑÉ¥¹œì(€µ•Ñ„üèÍÑÉ¥¹œì(€ÁÉ½É•ÍÌüè¹Õµ‰•Èì)ô¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø(€€€€ñ…É¥¹Ñ•É…Ñ¥Ù”±…ÍÍ9…µ”ô‰À´Ôˆø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµÍÑ…ÉÐ©ÕÍÑ¥™äµ‰•ÑÝ••¸…À´Ìˆø(€€€€€€€€ñ‘¥Øø(€€€€€€€€€€ñ	…‘”Ñ½¹”ô‰‰±Õ”ˆùíµ•Ñ„ñð€‹fbÓbÇf#bä‰ôð½	…‘”ø(€€€€€€€€€€ñ Ì±…ÍÍ9…µ”ô‰µÐ´ÐÑ•áÐµá°™½¹Ðµ‰±…¬Ñ•áÐµl˜á•™ÝtˆùíÑ¥Ñ±•ôð½ Ìø(€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´ÌÑ•áÐµÍ´±•…‘¥¹œ´ÜÑ•áÐµl˜á•™Ýt¼Ôàˆùí‘•ÍÉ¥ÁÑ¥½¹ôð½Àø(€€€€€€€€ð½‘¥Øø(€€€€€€€€ñÙ…Ñ…È¹…µ”õíÑ¥Ñ±•ôÍ¥é”ô‰Í´ˆ€¼ø(€€€€€€ð½‘¥Øø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µÐ´Ôˆø(€€€€€€€€ñAÉ½É•ÍÍ	…ÈÙ…±Õ”õíÁÉ½É•ÍÍô±…‰•°ô‹bŸfb«fb¿fˆ€¼ø(€€€€€€ð½‘¥Øø(€€€€ð½…Éø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸A…•!•…‘•È¡ì(€•å•‰É½Ü°(€Ñ¥Ñ±”°(€‘•ÍÉ¥ÁÑ¥½¸°(€…Ñ¥½¸)ôèì(€•å•‰É½ÜèÍÑÉ¥¹œì(€Ñ¥Ñ±”èÍÑÉ¥¹œì(€‘•ÍÉ¥ÁÑ¥½¸üèÍÑÉ¥¹œì(€…Ñ¥½¸üèI•…Ð¹I•…Ñ9½‘”ì)ô¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø(€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µˆ´Ø™±•à™±•àµ½°…À´Ð‰½É‘•Èµˆ‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•ÈÁˆ´Ô±œé™±•àµÉ½Ü±œé¥Ñ•µÌµ•¹±œé©ÕÍÑ¥™äµ‰•ÑÝ••¸ˆø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ…àµÜ´Íá°ˆø(€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµáÌ™½¹ÐµÍ•µ¥‰½±ÕÁÁ•É…Í”ÑÉ…­¥¹œµlÀ¸ÄÑ•µtÑ•áÐµ‘ÌµÑ½­•¸µ½±ˆùí•å•‰É½Ýôð½Àø(€€€€€€€€ñ Ä±…ÍÍ9…µ”ô‰µÐ´ÈÑ•áÐ´Éá°™½¹ÐµÍ•µ¥‰½±±•…‘¥¹œ´àÑ•áÐµ‘ÌµÑ½­•¸µÑ•áÐÍ´éÑ•áÐµlÈáÁátˆùíÑ¥Ñ±•ôð½ Äø(€€€€€€€í‘•ÍÉ¥ÁÑ¥½¸€˜˜€ñÀ±…ÍÍ9…µ”ô‰µÐ´ÈÑ•áÐµÍ´±•…‘¥¹œ´ØÑ•áÐµ‘ÌµÑ½­•¸µµÕÑ•ˆùí‘•ÍÉ¥ÁÑ¥½¹ôð½Àùô(€€€€€€ð½‘¥Øø(€€€€€í…Ñ¥½¸€˜˜€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•àÍ¡É¥¹¬´À™±•àµÝÉ…À¥Ñ•µÌµ•¹Ñ•È…À´Èˆùí…Ñ¥½¹ôð½‘¥Øùô(€€€€ð½‘¥Øø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()ÑåÁ”M•É¥…±¥é…‰±•Q½½°€ô=µ¥ÐñQ½½±•™¥¹¥Ñ¥½¸°€‰¥½¸ˆøì()½¹ÍÐÑ½½±%½¹Ì€ôì(€‘½Õµ•¹Ðè¥±•Q•áÐ°(€€‰½¹ÑÉ…ÐµÉ•Ù¥•ÜˆèM…±”°(€€‰‰½ÄµÉ•Ù¥•Üˆè…±Õ±…Ñ½È°(€€‰É¥Í¬µ…ÍÍ•ÍÍµ•¹ÐˆèM¡¥•±‘±•ÉÐ°(€€‰Á±…¹¹¥¹œµÉ•Ù¥•Üˆè…±•¹‘…É…åÌ°(€€‰Í¥Ñ”µÉ•Á½ÉÐµÉ•Ù¥•Üˆè±¥Á‰½…É‘1¥ÍÐ°(€€‰•á•ÕÑ¥Ù”µÍÕµµ…Éäˆè¥±•Q•áÐ°(€ØèUÍ•ÉI½Õ¹°(€€‰±…¹‘¥¹œµÁ…”ˆè5½¹¥Ñ½ÉMµ…ÉÑÁ¡½¹”°(€€‰‰ÕÍ¥¹•ÍÌµ¥‘•„ˆè1¥¡Ñ‰Õ±ˆ°(€µ…É­•Ñ¥¹œè5•…Á¡½¹”)ôì()•áÁ½ÉÐ™Õ¹Ñ¥½¸Q½½±…É¡ìÑ½½°°¥¹‘•à€ô€ÀôèìÑ½½°èM•É¥…±¥é…‰±•Q½½°ì¥¹‘•àüè¹Õµ‰•Èô¤ì(€½¹ÍÐ%½¸€ôÑ½½±%½¹ÍmÑ½½°¹Í±Õtì(€½¹ÍÐì‘¥Ñ¥½¹…ÉäèÐô€ôÕÍ•$Äá¸ ¤ì(€½¹ÍÐ±½…±¥é•‘Q½½°€ôÐ¹Ñ½½±Ì¹‘•™¥¹¥Ñ¥½¹ÍmÑ½½°¹Í±Õtì((€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø(€€€€ñ±…ÍÍ…É‘•±…äõí¥¹‘•à€¨€À¸ÀÑô±…ÍÍ9…µ”ô‰É½ÕÀ½Ù•É™±½Üµ¡¥‘‘•¸À´Ôˆø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µˆ´Ô™±•à¥Ñ•µÌµÍÑ…ÉÐ©ÕÍÑ¥™äµ‰•ÑÝ••¸ˆø(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”õí™±•à ´ÄÈÜ´ÄÈ¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÉ½Õ¹‘•µ‘Ìµ±œ‰œµÉ…‘¥•¹ÐµÑ¼µ‰È€‘íÑ½½°¹…•¹ÑôÑ•áÐµ‰±…¬Í¡…‘½Üµ½±µ±½Ü‘ÌµÑÉ…¹Í¥Ñ¥½¸É½ÕÀµ¡½Ù•ÈèµÑÉ…¹Í±…Ñ”µä´À¸Õôø(€€€€€€€€€€ñ%½¸±…ÍÍ9…µ”ô‰ ´ÜÜ´Üˆ€¼ø(€€€€€€€€ð½‘¥Øø(€€€€€€€€ñ‰ÕÑÑ½¸±…ÍÍ9…µ”ô‰É¥ ´ÄÀÜ´ÄÀÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•´Éá°‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀ‰œµÝ¡¥Ñ”½lÀ¸ÀÕtÑ•áÐµl˜á•™Ýt¼ÔÈ‘ÌµÑÉ…¹Í¥Ñ¥½¸¡½Ù•ÈèµÑÉ…¹Í±…Ñ”µä´À¸Ô¡½Ù•Èé‰½É‘•ÈµlÑÌÝt¼ÈÐ¡½Ù•ÈéÑ•áÐµlÑÌÝtˆ…É¥„µ±…‰•°ô‹b—bÛbŸfb¤ƒffffbÛfb¤ˆø(€€€€€€€€€€ñ!•…ÉÐ±…ÍÍ9…µ”ô‰ ´ÐÜ´Ðˆ€¼ø(€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€ð½‘¥Øø(€€€€€€ñ	…‘”ùí±½…±¥é•‘Q½½°¹…Ñ•½Éåôð½	…‘”ø(€€€€€€ñ Ì±…ÍÍ9…µ”ô‰µÐ´ÐÑ•áÐµá°™½¹Ðµ‰±…¬Ñ•áÐµl˜á•™Ýtˆùí±½…±¥é•‘Q½½°¹Ñ¥Ñ±•ôð½ Ìø(€€€€€€ñÀ±…ÍÍ9…µ”ô‰µÐ´Ìµ¥¸µ ´ÈÀÑ•áÐµÍ´±•…‘¥¹œ´ÜÑ•áÐµl˜á•™Ýt¼ÔØˆùí±½…±¥é•‘Q½½°¹‘•ÍÉ¥ÁÑ¥½¹ôð½Àø(€€€€€€ñ1¥¹¬¡É•˜õí€½Ñ½½±Ì¼‘íÑ½½°¹Í±Õõô±…ÍÍ9…µ”ô‰µÐ´Ô¥¹±¥¹”µ™±•àÜµ™Õ±°¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•È…À´ÈÉ½Õ¹‘•µ‘Ìµµ‰œµ½±µ±¥¹•…ÈÁà´ÐÁä´ÌÑ•áÐµÍ´™½¹Ðµ‰±…¬Ñ•áÐµ‰±…¬Í¡…‘½Üµ½±µ±½Ü‘ÌµÑÉ…¹Í¥Ñ¥½¸¡½Ù•Èé‰É¥¡Ñ¹•ÍÌ´ÄÀÔˆø(€€€€€€€í±½…±¥é•‘Q½½°¹Ñ…ô(€€€€€€€€ñÉÉ½Ý1•™Ð±…ÍÍ9…µ”ô‰ ´ÐÜ´Ðˆ€¼ø(€€€€€€ð½1¥¹¬ø(€€€€ð½±…ÍÍ…Éø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸M•…É¡	…È¡ìÁ±…•¡½±‘•È€ô€‹bŸb£b·b¬¸¸¸ˆôèìÁ±…•¡½±‘•ÈüèÍÑÉ¥¹œô¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø(€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É½ÕÀ‘Ìµ™½ÕÍ…‰±”™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÌÉ½Õ¹‘•µ‘Ìµµ‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµ‰±…¬¼ÈÀÁà´ÐÁä´È¸ÔÍ¡…‘½Üµ¥¹¹•ÈÍ¡…‘½Üµ‰±…¬¼ÈÀ‘ÌµÑÉ…¹Í¥Ñ¥½¸™½ÕÌµÝ¥Ñ¡¥¸é‰½É‘•Èµ‘ÌµÑ½­•¸µ½±¼ÐÀ™½ÕÌµÝ¥Ñ¡¥¸é‰œµÝ¡¥Ñ”½lÀ¸ÀÔÕtˆø(€€€€€€ñM•…É ±…ÍÍ9…µ”ô‰ ´ÔÜ´ÔÑ•áÐµ‘ÌµÑ½­•¸µ½±ÑÉ…¹Í¥Ñ¥½¸µÑÉ…¹Í™½É´‘ÕÉ…Ñ¥½¸µ‘Ìµ‰…Í”É½ÕÀµ™½ÕÌµÝ¥Ñ¡¥¸éÍ…±”´ÄÄÀˆ€¼ø(€€€€€€ñ¥¹ÁÕÐ±…ÍÍ9…µ”ô‰Üµ™Õ±°‰œµÑÉ…¹ÍÁ…É•¹ÐÑ•áÐµÍ´Ñ•áÐµ‘ÌµÑ½­•¸µÑ•áÐ½ÕÑ±¥¹”µ¹½¹”Á±…•¡½±‘•ÈéÑ•áÐµ‘ÌµÑ½­•¸µÑ•áÐ¼ÌàˆÁ±…•¡½±‘•ÈõíÁ±…•¡½±‘•Éô…É¥„µ±…‰•°õíÁ±…•¡½±‘•Éô€¼ø(€€€€ð½‘¥Øø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸M­•±•Ñ½¹…É ¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø(€€€€ñ‘¥Ø…É¥„µ‰ÕÍäô‰ÑÉÕ”ˆ±…ÍÍ9…µ”ô‰É½Õ¹‘•µ‘Ìµµ‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµÝ¡¥Ñ”½lÀ¸ÀÈÕtÀ´Ôˆø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‘ÌµÍ­•±•Ñ½¸ ´ÄÈÜ´ÄÈÉ½Õ¹‘•´Éá°ˆ€¼ø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‘ÌµÍ­•±•Ñ½¸µÐ´Ô ´ÐÜ´Ì¼ÔÉ½Õ¹‘•ˆ€¼ø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‘ÌµÍ­•±•Ñ½¸µÐ´Ì ´ÌÜµ™Õ±°É½Õ¹‘•ˆ€¼ø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‘ÌµÍ­•±•Ñ½¸µÐ´È ´ÌÜ´Ð¼ÔÉ½Õ¹‘•ˆ€¼ø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰‘ÌµÍ­•±•Ñ½¸µÐ´Ô ´ÄÀÉ½Õ¹‘•´Éá°ˆ€¼ø(€€€€ð½‘¥Øø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸µÁÑåMÑ…Ñ”¡ì(€Ñ¥Ñ±”°(€‘•ÍÉ¥ÁÑ¥½¸°(€…Ñ¥½¸°(€¥½¸)ôèì(€Ñ¥Ñ±”èÍÑÉ¥¹œì(€‘•ÍÉ¥ÁÑ¥½¸üèÍÑÉ¥¹œì(€…Ñ¥½¸üèI•…Ð¹I•…Ñ9½‘”ì(€¥½¸üèI•…Ð¹I•…Ñ9½‘”ì)ô¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø(€€€€ñ…É±…ÍÍ9…µ”ô‰É¥Á±…”µ¥Ñ•µÌµ•¹Ñ•ÈÀ´àÑ•áÐµ•¹Ñ•ÈÍ´éÀ´ÄÀˆø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É¥ ´ÄÈÜ´ÄÈÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µ‘Ìµµ‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµÝ¡¥Ñ”½lÀ¸ÀÌÕtÑ•áÐµ‘ÌµÑ½­•¸µµÕÑ•ˆø(€€€€€€€í¥½¸ñð€ñMÁ…É­±•Ì±…ÍÍ9…µ”ô‰ ´ÜÜ´Üˆ€¼ùô(€€€€€€ð½‘¥Øø(€€€€€€ñ Ì±…ÍÍ9…µ”ô‰µÐ´ÐÑ•áÐµ‰…Í”™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ‘ÌµÑ½­•¸µÑ•áÐˆùíÑ¥Ñ±•ôð½ Ìø(€€€€€í‘•ÍÉ¥ÁÑ¥½¸€˜˜€ñÀ±…ÍÍ9…µ”ô‰µÐ´Ìµ…àµÜµµÑ•áÐµÍ´±•…‘¥¹œ´ÜÑ•áÐµ‘ÌµÑ½­•¸µÑ•áÐ¼Ôàˆùí‘•ÍÉ¥ÁÑ¥½¹ôð½Àùô(€€€€€í…Ñ¥½¸€˜˜€ñ‘¥Ø±…ÍÍ9…µ”ô‰µÐ´Øˆùí…Ñ¥½¹ôð½‘¥Øùô(€€€€ð½…Éø(€€ð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ½¹ÍÐMÑ…ÑÕÍ¡¥À€ô	…‘”ì)•áÁ½ÉÐ½¹ÍÐ¥…±½œ€ô5½‘…°ì)•áÁ½ÉÐ½¹ÍÐQ½…ÍÐ€ô9½Ñ¥™¥…Ñ¥½¸ì()•áÁ½ÉÐ™Õ¹Ñ¥½¸É…Ý•È¡ì½Á•¸°Ñ¥Ñ±”°¡¥±‘É•¸°½¹±½Í”°Í¥‘”€ô€‰•¹ˆôèì½Á•¸è‰½½±•…¸ìÑ¥Ñ±”èÍÑÉ¥¹œì¡¥±‘É•¸èI•…Ð¹I•…Ñ9½‘”ì½¹±½Í”è€ ¤€ôøÙ½¥ìÍ¥‘”üè€‰ÍÑ…ÉÐˆð€‰•¹ˆô¤ì(€ÕÍ•™™•Ð  ¤€ôøì(€€€¥˜€ …½Á•¸¤É•ÑÕÉ¸ì(€€€½¹ÍÐ½¹-•å½Ý¸€ô€¡•Ù•¹Ðè-•å‰½…É‘Ù•¹Ð¤€ôø•Ù•¹Ð¹­•ä€ôôô€‰Í…Á”ˆ€˜˜½¹±½Í” ¤ì(€€€‘½Õµ•¹Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰­•å‘½Ý¸ˆ°½¹-•å½Ý¸¤ì(€€€É•ÑÕÉ¸€ ¤€ôø‘½Õµ•¹Ð¹É•µ½Ù•Ù•¹Ñ1¥ÍÑ•¹•È ‰­•å‘½Ý¸ˆ°½¹-•å½Ý¸¤ì(€ô°m½¹±½Í”°½Á•¹t¤ì((€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðøñ¹¥µ…Ñ•AÉ•Í•¹”ùí½Á•¸€˜˜€ðø(€€€€ñµ½Ñ¥½¸¹‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ…É¥„µ±…‰•°õíÑ¥Ñ±•ô±…ÍÍ9…µ”ô‰™¥á•¥¹Í•Ð´ÀèµlØÁt‰œµ‰±…¬¼ÜÈˆ¥¹¥Ñ¥…°õíì½Á…¥Ñäè€Àõô…¹¥µ…Ñ”õíì½Á…¥Ñäè€Äõô•á¥Ðõíì½Á…¥Ñäè€Àõô½¹±¥¬õí½¹±½Í•ô€¼ø(€€€€ñµ½Ñ¥½¸¹…Í¥‘”É½±”ô‰‘¥…±½œˆ…É¥„µµ½‘…°ô‰ÑÉÕ”ˆ…É¥„µ±…‰•°õíÑ¥Ñ±•ô¥¹¥Ñ¥…°õíìàèÍ¥‘”€ôôô€‰•¹ˆ€ü€ˆÄÀÀ”ˆ€è€ˆ´ÄÀÀ”ˆõô…¹¥µ…Ñ”õíìàè€Àõô•á¥ÐõíìàèÍ¥‘”€ôôô€‰•¹ˆ€ü€ˆÄÀÀ”ˆ€è€ˆ´ÄÀÀ”ˆõôÑÉ…¹Í¥Ñ¥½¸õíì‘ÕÉ…Ñ¥½¸è€À¸ÈÐ°•…Í”èlÀ¸ÈÈ°€Ä°€À¸ÌØ°€Åtõô±…ÍÍ9…µ”õí¸ ‰™¥á•¥¹Í•Ðµä´ÀèµlØÅt™±•àÜµmµ¥¸ ÐÀÁÁà±…±Œ ÄÀÁÙÜ´ÅÉ•´¤¥t™±•àµ½°‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµ‘ÌµÑ½­•¸µ½Ù•É±…äÍ¡…‘½Üµ‘Ìµ±œˆ°Í¥‘”€ôôô€‰•¹ˆ€ü€‰•¹´À‰½É‘•ÈµÌˆ€è€‰ÍÑ…ÉÐ´À‰½É‘•Èµ”ˆ¥ôø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•àµ¥¸µ ´ÄØ¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ‰•ÑÝ••¸…À´Ð‰½É‘•Èµˆ‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•ÈÁà´Ôˆøñ È±…ÍÍ9…µ”ô‰Ñ•áÐµ±œ™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ‘ÌµÑ½­•¸µÑ•áÐˆùíÑ¥Ñ±•ôð½ Èøñ%½¹	ÕÑÑ½¸±…‰•°õíÑ¥Ñ±•ôÑ½¹”ô‰¹•ÕÑÉ…°ˆ½¹±¥¬õí½¹±½Í•ôøñ`±…ÍÍ9…µ”ô‰ ´ÐÜ´Ðˆ€¼øð½%½¹	ÕÑÑ½¸øð½‘¥Øø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ¥¸µ ´À™±•à´Ä½Ù•É™±½Üµäµ…ÕÑ¼À´Ôˆùí¡¥±‘É•¹ôð½‘¥Øø(€€€€ð½µ½Ñ¥½¸¹…Í¥‘”ø(€€ð¼ùôð½¹¥µ…Ñ•AÉ•Í•¹”øð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸M•…É¡¥•±¡ì±…‰•°°±…ÍÍ9…µ”€ô€ˆˆ°€¸¸¹ÁÉ½ÁÌôèI•…Ð¹%¹ÁÕÑ!Q51ÑÑÉ¥‰ÕÑ•Ìñ!Q51%¹ÁÕÑ±•µ•¹Ðø€˜ì±…‰•°èÍÑÉ¥¹œô¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðøñ±…‰•°±…ÍÍ9…µ”õí¸ ‰™±•à ´ÄÄ¥Ñ•µÌµ•¹Ñ•È…À´ÌÉ½Õ¹‘•µ‘ÌµÍ´‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµ‰±…¬¼ÈÀÁà´Ì¸ÔÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌ‘ÕÉ…Ñ¥½¸µ‘Ìµ‰…Í”™½ÕÌµÝ¥Ñ¡¥¸é‰½É‘•Èµ‘ÌµÑ½­•¸µ½±¼ÐÐ™½ÕÌµÝ¥Ñ¡¥¸éÍ¡…‘½ÜµmÙ…È ´µ‘Ìµ™½ÕÌ¥tˆ°±…ÍÍ9…µ”¥ôø(€€€€ñM•…É ±…ÍÍ9…µ”ô‰ ´ÐÜ´ÐÍ¡É¥¹¬´ÀÑ•áÐµ‘ÌµÑ½­•¸µµÕÑ•ˆ…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ€¼ø(€€€€ñ¥¹ÁÕÐÑåÁ”ô‰Í•…É ˆ…É¥„µ±…‰•°õí±…‰•±ôÁ±…•¡½±‘•ÈõíÁÉ½ÁÌ¹Á±…•¡½±‘•Èñð±…‰•±ô±…ÍÍ9…µ”ô‰µ¥¸µÜ´À™±•à´Ä‰œµÑÉ…¹ÍÁ…É•¹ÐÑ•áÐµÍ´Ñ•áÐµ‘ÌµÑ½­•¸µÑ•áÐ½ÕÑ±¥¹”µ¹½¹”Á±…•¡½±‘•ÈéÑ•áÐµ‘ÌµÑ½­•¸µµÕÑ•µÍ½™Ðˆì¸¸¹ÁÉ½ÁÍô€¼ø(€€ð½±…‰•°øð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸M­•±•Ñ½¸¡ì±…ÍÍ9…µ”€ô€ˆˆôèì±…ÍÍ9…µ”üèÍÑÉ¥¹œô¤ì(€É•ÑÕÉ¸€ñÍÁ…¸…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ±…ÍÍ9…µ”õí¸ ‰‘ÌµÍ­•±•Ñ½¸‰±½¬É½Õ¹‘•µ‘ÌµÍ´ˆ°±…ÍÍ9…µ”¥ô€¼øì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸1½…‘¥¹MÑ…Ñ”¡ìÑ¥Ñ±”°‘•ÍÉ¥ÁÑ¥½¸ôèìÑ¥Ñ±”èÍÑÉ¥¹œì‘•ÍÉ¥ÁÑ¥½¸üèÍÑÉ¥¹œô¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðøñ‘¥ØÉ½±”ô‰ÍÑ…ÑÕÌˆ…É¥„µ±¥Ù”ô‰Á½±¥Ñ”ˆ±…ÍÍ9…µ”ô‰É¥µ¥¸µ ´ÐàÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µ‘Ìµµ‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•È‰œµÝ¡¥Ñ”½lÀ¸ÀÉtÀ´àÑ•áÐµ•¹Ñ•Èˆø(€€€€ñ‘¥Øøñ1½…‘•É¥É±”±…ÍÍ9…µ”ô‰µàµ…ÕÑ¼ ´ØÜ´Ø…¹¥µ…Ñ”µÍÁ¥¸Ñ•áÐµ‘ÌµÑ½­•¸µ½±ˆ€¼øñÀ±…ÍÍ9…µ”ô‰µÐ´ÐÑ•áÐµÍ´™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ‘ÌµÑ½­•¸µÑ•áÐˆùíÑ¥Ñ±•ôð½Àùí‘•ÍÉ¥ÁÑ¥½¸€˜˜€ñÀ±…ÍÍ9…µ”ô‰µÐ´ÄÑ•áÐµáÌ±•…‘¥¹œ´ÔÑ•áÐµ‘ÌµÑ½­•¸µµÕÑ•ˆùí‘•ÍÉ¥ÁÑ¥½¹ôð½Àùôð½‘¥Øø(€€ð½‘¥Øøð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸ÉÉ½ÉMÑ…Ñ”¡ìÑ¥Ñ±”°‘•ÍÉ¥ÁÑ¥½¸°…Ñ¥½¸ôèìÑ¥Ñ±”èÍÑÉ¥¹œì‘•ÍÉ¥ÁÑ¥½¸üèÍÑÉ¥¹œì…Ñ¥½¸üèI•…Ð¹I•…Ñ9½‘”ô¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðøñ‘¥ØÉ½±”ô‰…±•ÉÐˆ±…ÍÍ9…µ”ô‰É¥µ¥¸µ ´ÐàÁ±…”µ¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µ‘Ìµµ‰½É‘•È‰½É‘•Èµ‘ÌµÑ½­•¸µ‘…¹•È¼ÈÐ‰œµ‘ÌµÑ½­•¸µ‘…¹•È¼ÔÀ´àÑ•áÐµ•¹Ñ•Èˆø(€€€€ñ‘¥Øøñ¥É±•±•ÉÐ±…ÍÍ9…µ”ô‰µàµ…ÕÑ¼ ´ÜÜ´ÜÑ•áÐµ‘ÌµÑ½­•¸µ‘…¹•Èˆ€¼øñ Ì±…ÍÍ9…µ”ô‰µÐ´ÐÑ•áÐµ‰…Í”™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ‘ÌµÑ½­•¸µÑ•áÐˆùíÑ¥Ñ±•ôð½ Ìùí‘•ÍÉ¥ÁÑ¥½¸€˜˜€ñÀ±…ÍÍ9…µ”ô‰µÐ´Èµ…àµÜµµÑ•áÐµÍ´±•…‘¥¹œ´ØÑ•áÐµ‘ÌµÑ½­•¸µµÕÑ•ˆùí‘•ÍÉ¥ÁÑ¥½¹ôð½Àùõí…Ñ¥½¸€˜˜€ñ‘¥Ø±…ÍÍ9…µ”ô‰µÐ´Ôˆùí…Ñ¥½¹ôð½‘¥Øùôð½‘¥Øø(€€ð½‘¥Øøð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸A…¥¹…Ñ¥½¸¡ìÁ…”°Á…•½Õ¹Ð°½¹A…•¡…¹”°ÁÉ•Ù¥½ÕÍ1…‰•°°¹•áÑ1…‰•°ôèìÁ…”è¹Õµ‰•ÈìÁ…•½Õ¹Ðè¹Õµ‰•Èì½¹A…•¡…¹”è€¡Á…”è¹Õµ‰•È¤€ôøÙ½¥ìÁÉ•Ù¥½ÕÍ1…‰•°èÍÑÉ¥¹œì¹•áÑ1…‰•°èÍÑÉ¥¹œô¤ì(€½¹ÍÐÍ…™•A…”€ô5…Ñ ¹µ¥¸¡5…Ñ ¹µ…à Ä°Á…”¤°5…Ñ ¹µ…à Ä°Á…•½Õ¹Ð¤¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðøñ¹…Ø…É¥„µ±…‰•°õí€‘íÍ…™•A…•ô€¼€‘íÁ…•½Õ¹Ñõô±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ‰•ÑÝ••¸…À´Ìˆø(€€€€ñ	ÕÑÑ½¸Ù…É¥…¹Ðô‰Í•½¹‘…ÉäˆÍ¥é”ô‰Í´ˆ‘¥Í…‰±•õíÍ…™•A…”€ðô€Åô½¹±¥¬õì ¤€ôø½¹A…•¡…¹”¡Í…™•A…”€´€Ä¥ô¥½¸õìñ¡•ÙÉ½¹1•™Ð±…ÍÍ9…µ”ô‰ ´ÐÜ´ÐÉÑ°éÉ½Ñ…Ñ”´ÄàÀˆ€¼ùôùíÁÉ•Ù¥½ÕÍ1…‰•±ôð½	ÕÑÑ½¸ø(€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµáÌ™½¹ÐµÍ•µ¥‰½±Ñ…‰Õ±…Èµ¹ÕµÌÑ•áÐµ‘ÌµÑ½­•¸µµÕÑ•ˆùíÍ…™•A…•ô€¼í5…Ñ ¹µ…à Ä°Á…•½Õ¹Ð¥ôð½ÍÁ…¸ø(€€€€ñ	ÕÑÑ½¸Ù…É¥…¹Ðô‰Í•½¹‘…ÉäˆÍ¥é”ô‰Í´ˆ‘¥Í…‰±•õíÍ…™•A…”€øôÁ…•½Õ¹Ñô½¹±¥¬õì ¤€ôø½¹A…•¡…¹”¡Í…™•A…”€¬€Ä¥ô¥½¸õìñ¡•ÙÉ½¹I¥¡Ð±…ÍÍ9…µ”ô‰ ´ÐÜ´ÐÉÑ°éÉ½Ñ…Ñ”´ÄàÀˆ€¼ùôùí¹•áÑ1…‰•±ôð½	ÕÑÑ½¸ø(€€ð½¹…Øøð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸	É•…‘ÉÕµˆ¡ì¥Ñ•µÌ°±…‰•°ôèì¥Ñ•µÌèÉÉ…äñì±…‰•°èÍÑÉ¥¹œì¡É•˜üèÍÑÉ¥¹œôøì±…‰•°èÍÑÉ¥¹œô¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðøñ¹…Ø…É¥„µ±…‰•°õí±…‰•±ôøñ½°±…ÍÍ9…µ”ô‰™±•àµ¥¸µÜ´À™±•àµÝÉ…À¥Ñ•µÌµ•¹Ñ•È…À´ÈÑ•áÐµáÌÑ•áÐµ‘ÌµÑ½­•¸µµÕÑ•ˆùí¥Ñ•µÌ¹µ…À ¡¥Ñ•´°¥¹‘•à¤€ôø€ñ±¤­•äõí€‘í¥Ñ•´¹±…‰•±ô´‘í¥¹‘•áõô±…ÍÍ9…µ”ô‰™±•àµ¥¸µÜ´À¥Ñ•µÌµ•¹Ñ•È…À´Èˆùí¥¹‘•à€ø€À€˜˜€ñ¡•ÙÉ½¹I¥¡Ð…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ±…ÍÍ9…µ”ô‰ ´Ì¸ÔÜ´Ì¸ÔÍ¡É¥¹¬´ÀÉÑ°éÉ½Ñ…Ñ”´ÄàÀˆ€¼ùõí¥Ñ•´¹¡É•˜€ü€ñ1¥¹¬¡É•˜õí¥Ñ•´¹¡É•™ô±…ÍÍ9…µ”ô‰‘Ìµ™½ÕÍ…‰±”ÑÉÕ¹…Ñ”É½Õ¹‘•¡½Ù•ÈéÑ•áÐµ‘ÌµÑ½­•¸µÑ•áÐˆùí¥Ñ•´¹±…‰•±ôð½1¥¹¬ø€è€ñÍÁ…¸…É¥„µÕÉÉ•¹Ðô‰Á…”ˆ±…ÍÍ9…µ”ô‰ÑÉÕ¹…Ñ”™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ‘ÌµÑ½­•¸µÑ•áÐˆùí¥Ñ•´¹±…‰•±ôð½ÍÁ…¸ùôð½±¤ø¥ôð½½°øð½¹…Øøð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸½ÉµM•Ñ¥½¸¡ìÑ¥Ñ±”°‘•ÍÉ¥ÁÑ¥½¸°¡¥±‘É•¸°±…ÍÍ9…µ”€ô€ˆˆôèìÑ¥Ñ±”èÍÑÉ¥¹œì‘•ÍÉ¥ÁÑ¥½¸üèÍÑÉ¥¹œì¡¥±‘É•¸èI•…Ð¹I•…Ñ9½‘”ì±…ÍÍ9…µ”üèÍÑÉ¥¹œô¤ì(€É•ÑÕÉ¸€ ñÕÑ½1½…±¥é•‘½¹Ñ•¹Ðøñ™¥•±‘Í•Ð±…ÍÍ9…µ”õí¸ ‰É¥…À´Ô‰½É‘•È´ÀÀ´Àˆ°±…ÍÍ9…µ”¥ôøñ±••¹±…ÍÍ9…µ”ô‰Üµ™Õ±°‰½É‘•Èµˆ‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•ÈÁˆ´ÌÑ•áÐµ‰…Í”™½¹ÐµÍ•µ¥‰½±Ñ•áÐµ‘ÌµÑ½­•¸µÑ•áÐˆùíÑ¥Ñ±•ôð½±••¹ùí‘•ÍÉ¥ÁÑ¥½¸€˜˜€ñÀ±…ÍÍ9…µ”ôˆµµÐ´ÌÑ•áÐµÍ´±•…‘¥¹œ´ØÑ•áÐµ‘ÌµÑ½­•¸µµÕÑ•ˆùí‘•ÍÉ¥ÁÑ¥½¹ôð½Àùôñ‘¥Ø±…ÍÍ9…µ”ô‰É¥…À´Ðˆùí¡¥±‘É•¹ôð½‘¥Øøð½™¥•±‘Í•Ðøð½ÕÑ½1½…±¥é•‘½¹Ñ•¹Ðø¤ì)ô()•áÁ½ÉÐ™Õ¹Ñ¥½¸½ÉµÑ¥½¹Ì¡ì¡¥±‘É•¸°±…ÍÍ9…µ”€ô€ˆˆôèì¡¥±‘É•¸èI•…Ð¹I•…Ñ9½‘”ì±…ÍÍ9…µ”üèÍÑÉ¥¹œô¤ì(€É•ÑÕÉ¸€ñ‘¥Ø±…ÍÍ9…µ”õí¸ ‰™±•à™±•àµ½°µÉ•Ù•ÉÍ”…À´È‰½É‘•ÈµÐ‰½É‘•Èµ‘ÌµÑ½­•¸µ‰½É‘•ÈÁÐ´ÔÍ´é™±•àµÉ½ÜÍ´é©ÕÍÑ¥™äµ•¹ˆ°±…ÍÍ9…µ”¥ôùí¡¥±‘É•¹ôð½‘¥Øøì)ô