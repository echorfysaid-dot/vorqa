"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  Cloud,
  FileText,
  FolderKanban,
  HardHat,
  Home,
  LineChart,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  UsersRound,
  WandSparkles
} from "lucide-react";
import { Badge, Button, ProgressBar } from "@/components/ui";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { useI18n } from "@/components/i18n-provider";

export const vorqaAssets = {
  heroBackground: "/vorqa/assets/backgrounds/hero-background.webp",
  dashboardBackground: "/vorqa/assets/backgrounds/dashboard-background.webp",
  workspaceBackground: "/vorqa/assets/backgrounds/workspace-background.webp",
  darkGradient: "/vorqa/assets/backgrounds/dark-gradient.webp",
  villa: "/vorqa/assets/villa/villa-hero.webp",
  villaDashboard: "/vorqa/assets/villa/villa-dashboard.webp",
  villaProject: "/vorqa/assets/villa/villa-project.webp",
  voraFull: "/vorqa/assets/vora/vora-full.webp",
  voraHalf: "/vorqa/assets/vora/vora-half.webp",
  voraAvatar: "/vorqa/assets/vora/vora-avatar.webp",
  voraThinking: "/vorqa/assets/vora/vora-thinking.webp",
  voraSuccess: "/vorqa/assets/vora/vora-success.webp",
  blueprintOverlay: "/vorqa/assets/blueprints/blueprint-overlay.svg",
  gridOverlay: "/vorqa/assets/blueprints/grid-overlay.svg",
  architectureLines: "/vorqa/assets/blueprints/architecture-lines.svg",
  constructionGrid: "/vorqa/assets/blueprints/construction-grid.svg",
  goldGlow: "/vorqa/assets/lighting/gold-glow.webp",
  cyanGlow: "/vorqa/assets/lighting/cyan-glow.webp",
  ambientLight: "/vorqa/assets/lighting/ambient-light.webp",
  dots: "/vorqa/assets/patterns/dots.svg",
  mesh: "/vorqa/assets/patterns/mesh.svg",
  noise: "/vorqa/assets/patterns/noise.png"
};

export function VorqaLogo({ compact = false }: { compact?: boolean }) {
  const { translate } = useI18n();

  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="relative grid h-12 w-12 place-items-center rounded-2xl border border-[#D7B45A]/25 bg-[#D7B45A]/10 shadow-[0_18px_60px_rgba(215,180,90,0.22)]">
        <span className="absolute inset-2 rounded-xl bg-gradient-to-br from-[#fff0a8] via-[#d7b45a] to-[#7c5617]" />
        <span className="relative text-3xl font-black italic text-black">V</span>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-2xl font-black tracking-[0.22em] text-white">VORQA</span>
          <span className="text-xs font-bold text-[#D7B45A]">{translate("Building the future together")}</span>
        </span>
      )}
    </Link>
  );
}

export function BlueprintOverlay({ className = "" }: { className?: string }) {
  return (<AutoLocalizedContent>
    <div className={`vorqa-blueprint ${className}`}>
      <Image src={vorqaAssets.blueprintOverlay} alt="" fill sizes="100vw" className="object-cover opacity-65 mix-blend-screen" aria-hidden />
    </div>
  </AutoLocalizedContent>);
}

export function VillaBackdrop({ src = vorqaAssets.villa, priority = false, overlay = true, blueprint = true }: { src?: string; priority?: boolean; overlay?: boolean; blueprint?: boolean }) {
  return (<AutoLocalizedContent>
    <div className="absolute inset-0 overflow-hidden">
      <Image src={src} alt="Vorqa AI architectural villa" fill priority={priority} sizes="100vw" className="object-cover" />
      {overlay && <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,4,8,0.92),rgba(5,7,11,0.48)_42%,rgba(5,7,11,0.34)_70%,rgba(2,4,8,0.86))]" />}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_77%_30%,rgba(81,216,255,0.16),transparent_30%),radial-gradient(circle_at_24%_28%,rgba(215,180,90,0.18),transparent_28%)]" />
      {blueprint && <BlueprintOverlay />}
    </div>
  </AutoLocalizedContent>);
}

export function VoraOrb({ size = "lg", state = "idle" }: { size?: "sm" | "md" | "lg"; state?: "idle" | "thinking" | "generating" | "success" | "warning" | "error" }) {
  const sizes = { sm: "h-12 w-12", md: "h-20 w-20", lg: "h-36 w-36" };
  const colors = {
    idle: "from-[#51D8FF] to-[#4F8CFF]",
    thinking: "from-[#F2D487] to-[#51D8FF]",
    generating: "from-[#51D8FF] to-[#22C783]",
    success: "from-[#22C783] to-[#51D8FF]",
    warning: "from-[#F5B942] to-[#D7B45A]",
    error: "from-[#EF5B5B] to-[#F5B942]"
  };
  return (<AutoLocalizedContent>
    <span className={`relative grid ${sizes[size]} shrink-0 place-items-center overflow-hidden rounded-full border border-[#D7B45A]/24 bg-[#07101A] shadow-[0_0_42px_rgba(81,216,255,.28)] vora-breathe`}>
      <span className={`absolute inset-2 rounded-full bg-gradient-to-br ${colors[state]} opacity-20 blur-md`} />
      <span className="absolute inset-[18%] rounded-full bg-black shadow-inner" />
      <span className="relative flex gap-2">
        <span className="h-3 w-3 rounded-full bg-[#51D8FF] shadow-[0_0_18px_rgba(81,216,255,.9)]" />
        <span className="h-3 w-3 rounded-full bg-[#51D8FF] shadow-[0_0_18px_rgba(81,216,255,.9)]" />
      </span>
    </span>
  </AutoLocalizedContent>);
}

export function VoraAssistantCard({ message = "مرحباً، سأساعدك على تحويل فكرتك إلى خطة قابلة للتنفيذ.", state = "idle" }: { message?: string; state?: "idle" | "thinking" | "generating" | "success" | "warning" | "error" }) {
  return (<AutoLocalizedContent>
    <div className="vorqa-glass-panel rounded-ds-xl p-5">
      <div className="flex items-center gap-4">
        <VoraOrb size="md" state={state} />
        <div>
          <p className="text-lg font-black text-white">VORA</p>
          <p className="mt-1 text-sm leading-6 text-[#A8B0C0]">{message}</p>
        </div>
      </div>
      <div className="mt-4 h-8 rounded-full bg-[linear-gradient(90deg,transparent,rgba(215,180,90,.55),rgba(81,216,255,.6),transparent)] opacity-60" />
    </div>
  </AutoLocalizedContent>);
}

export function FloatingInfoCard({ title, text, className = "", tone = "blue" }: { title: string; text: string; className?: string; tone?: "gold" | "blue" | "success" }) {
  const color = tone === "gold" ? "border-[#D7B45A]/35 text-[#F2D487]" : tone === "success" ? "border-[#22C783]/30 text-[#94F0C4]" : "border-[#51D8FF]/28 text-[#BDEFFF]";
  return (<AutoLocalizedContent>
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className={`vorqa-glass-panel rounded-ds-lg p-4 ${color} ${className}`}>
      <p className="font-black">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/68">{text}</p>
    </motion.div>
  </AutoLocalizedContent>);
}

export function FeatureDockOfficial() {
  const items = [
    { title: "أمان عالي", text: "حماية بياناتك", icon: ShieldCheck, color: "text-[#22C783]" },
    { title: "حفظ سحابي", text: "الوصول لمشاريعك", icon: Cloud, color: "text-[#51D8FF]" },
    { title: "ذكاء اصطناعي", text: "تحليل واقتراحات", icon: Bot, color: "text-[#B995FF]" },
    { title: "تعاون متكامل", text: "بين كل الأطراف", icon: UsersRound, color: "text-[#F2D487]" },
    { title: "تقارير احترافية", text: "قرارات أفضل", icon: LineChart, color: "text-[#22C783]" }
  ];
  return (<AutoLocalizedContent>
    <div className="vorqa-glass-panel grid gap-3 rounded-ds-xl p-3 md:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="flex items-center gap-3 rounded-2xl px-3 py-4">
            <Icon className={`h-8 w-8 ${item.color}`} />
            <div>
              <p className="font-black text-white">{item.title}</p>
              <p className="mt-1 text-xs text-[#A8B0C0]">{item.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  </AutoLocalizedContent>);
}

export function OfficialRoleCards() {
  const roles = [
    { title: "صاحب مشروع", text: "أريد بناء أو إدارة مشروعي بذكاء وسهولة", icon: Home, active: true },
    { title: "مهندس معماري", text: "أصمم المخططات وأدير مشاريع العملاء", icon: Building2 },
    { title: "مهندس مدني", text: "أشرف على التنفيذ وأتابع تقدم المشروع", icon: HardHat },
    { title: "مقاول", text: "أدير الأعمال والفرق والمشاريع من منصة واحدة", icon: FolderKanban },
    { title: "شركة", text: "أدير شركتي وفريقي عبر حلول متكاملة", icon: Building2 }
  ];
  return (<AutoLocalizedContent>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {roles.map((role) => {
        const Icon = role.icon;
        return (
          <div key={role.title} className={`relative rounded-ds-xl border p-5 text-center transition hover:-translate-y-0.5 ${role.active ? "border-ds-token-gold bg-ds-token-gold/10 shadow-gold-glow" : "border-ds-token-border bg-white/[0.035]"}`}>
            <span className="absolute left-4 top-4 h-5 w-5 rounded-full border border-white/28" />
            {role.active && <CheckCircle2 className="absolute left-3 top-3 h-7 w-7 fill-[#D7B45A] text-black" />}
            <Icon className="mx-auto h-12 w-12 text-[#D7B45A]" />
            <h3 className="mt-4 text-lg font-black text-white">{role.title}</h3>
            <p className="mt-2 text-sm leading-7 text-[#A8B0C0]">{role.text}</p>
          </div>
        );
      })}
    </div>
  </AutoLocalizedContent>);
}

export function ProjectSummaryPanel() {
  return (<AutoLocalizedContent>
    <div className="vorqa-glass-panel rounded-ds-xl p-4">
      <p className="text-center text-lg font-black text-[#F2D487]">ملخص مشروعك</p>
      <div className="relative mt-4 h-36 overflow-hidden rounded-2xl border border-[#D7B45A]/16">
        <Image src={vorqaAssets.villaProject} alt="Villa project preview" fill sizes="320px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      </div>
      <p className="mt-4 text-center text-xl font-black text-lime-300">فيلا سكنية</p>
      <div className="mt-4 grid gap-3 text-sm text-[#A8B0C0]">
        <span className="flex justify-between gap-3"><span>الموقع</span><b className="text-white">المغرب، أكادير</b></span>
        <span className="flex justify-between gap-3"><span>مساحة الأرض</span><b className="text-white">600 م²</b></span>
        <span className="flex justify-between gap-3"><span>الميزانية</span><b className="text-white">2,500,000 درهم</b></span>
      </div>
    </div>
  </AutoLocalizedContent>);
}

export function ArchitectureProjectCard({ title, location = "أكادير، المغرب", progress = 68 }: { title: string; location?: string; progress?: number }) {
  return (<AutoLocalizedContent>
    <div className="vorqa-glass-panel group overflow-hidden rounded-ds-xl p-4 transition hover:-translate-y-0.5">
      <div className="relative h-44 overflow-hidden rounded-2xl">
        <Image src={vorqaAssets.villaProject} alt={title} fill sizes="(max-width: 768px) 100vw, 360px" className="object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/78 to-transparent" />
        <BlueprintOverlay />
        <Badge className="absolute right-3 top-3">قيد التنفيذ</Badge>
      </div>
      <h3 className="mt-4 text-xl font-black text-white">{title}</h3>
      <p className="mt-2 flex items-center gap-2 text-sm text-[#A8B0C0]"><MapPin className="h-4 w-4 text-[#D7B45A]" />{location}</p>
      <div className="mt-4"><ProgressBar value={progress} label="تقدم المشروع" /></div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <span className="rounded-xl bg-white/[0.055] p-2 text-[#A8B0C0]"><b className="block text-white">12</b>وثيقة</span>
        <span className="rounded-xl bg-white/[0.055] p-2 text-[#A8B0C0]"><b className="block text-white">8</b>ملفات</span>
        <span className="rounded-xl bg-white/[0.055] p-2 text-[#A8B0C0]"><b className="block text-white">5</b>فريق</span>
      </div>
    </div>
  </AutoLocalizedContent>);
}

type VorqaIcon = React.ComponentType<{ className?: string }>;

export function BlueprintMetric({ icon: Icon = BarChart3, label, value }: { icon?: VorqaIcon; label: string; value: string }) {
  return (<AutoLocalizedContent>
    <div className="vorqa-glass-panel rounded-ds-lg p-4">
      <Icon className="h-6 w-6 text-[#51D8FF]" />
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm text-[#A8B0C0]">{label}</p>
    </div>
  </AutoLocalizedContent>);
}

export function UploadBlueprintPanel({ children }: { children: React.ReactNode }) {
  return (<AutoLocalizedContent>
    <div className="relative overflow-hidden rounded-ds-xl border border-dashed border-ds-token-gold/24 bg-black/24 p-6">
      <BlueprintOverlay />
      <div className="relative z-10">{children}</div>
    </div>
  </AutoLocalizedContent>);
}

export function VoraWorkspaceHero({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (<AutoLocalizedContent>
    <section className="relative min-h-[420px] overflow-hidden rounded-ds-2xl border border-ds-token-border shadow-ds-lg">
      <VillaBackdrop src={vorqaAssets.workspaceBackground} />
      <div className="relative z-10 grid min-h-[420px] gap-6 p-6 lg:grid-cols-[1.1fr_.9fr] lg:p-8">
        <div className="flex flex-col justify-end">
          <Badge tone="gold">VORA Project Manager</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-9 text-white/72">{description}</p>
          {action && <div className="mt-7">{action}</div>}
        </div>
        <div className="flex items-end">
          <VoraAssistantCard message="راجعت معلومات المشروع، والخطوة الأنسب الآن هي إعداد الجدول الزمني الأولي." state="thinking" />
        </div>
      </div>
    </section>
  </AutoLocalizedContent>);
}

export function VorqaHeroScene() {
  return (<AutoLocalizedContent>
    <div className="relative min-h-[560px] overflow-hidden rounded-ds-2xl border border-ds-token-border bg-ds-token-secondary/72 shadow-ds-lg backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_18%,rgba(81,216,255,.24),transparent_28%),radial-gradient(circle_at_26%_72%,rgba(215,180,90,.2),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.02))]" />
      <BlueprintOverlay className="opacity-55" />

      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-[5%] right-[9%] top-[12%] h-[48%] overflow-hidden rounded-[2rem] border border-[#D7B45A]/20 shadow-[0_30px_100px_rgba(0,0,0,.46)]"
      >
        <Image src={vorqaAssets.villa} alt="Luxury villa project visualization" fill priority sizes="(max-width: 1024px) 100vw, 760px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-transparent to-[#05111f]/18" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20, y: 12 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-[8%] left-[3%] h-[56%] w-[38%] max-w-[330px]"
      >
        <Image src={vorqaAssets.voraFull} alt="VORA assistant" fill priority sizes="320px" className="object-contain object-bottom drop-shadow-[0_0_46px_rgba(81,216,255,.28)]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.18 }}
        className="absolute bottom-[7%] right-[17%] h-[30%] w-[48%] overflow-hidden rounded-[1.75rem] border border-[#51D8FF]/24 bg-[#03111e]/68 p-3 shadow-[0_0_86px_rgba(81,216,255,.18)] backdrop-blur-xl"
      >
        <Image src={vorqaAssets.blueprintOverlay} alt="Blueprint project plan" fill sizes="420px" className="object-cover opacity-80 mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(81,216,255,.12),transparent_54%)]" />
      </motion.div>

      <FloatingInfoCard title="تخطيط مرن" text="مراحل واضحة وقرارات قابلة للتنفيذ" className="absolute right-[7%] top-[8%] w-44" tone="blue" />
      <FloatingInfoCard title="تنفيذ دقيق" text="متابعة تقدم المشروع لحظة بلحظة" className="absolute left-[7%] top-[18%] w-44" tone="gold" />

      <div className="vorqa-glass-panel absolute bottom-[19%] right-[6%] w-36 rounded-[1.5rem] p-4">
        <p className="text-xs text-white/58">تقدم المشروع</p>
        <p className="mt-2 text-4xl font-black text-white">68%</p>
        <ProgressBar value={68} />
      </div>

      <div className="vorqa-glass-panel absolute bottom-[5%] left-[30%] max-w-[330px] rounded-[1.5rem] p-4">
        <div className="flex items-center gap-3">
          <VoraOrb size="sm" state="idle" />
          <div>
            <p className="font-black text-white">VORA</p>
            <p className="mt-1 text-sm leading-6 text-white/68">أنا هنا لمساعدتك في كل خطوة من المشروع.</p>
          </div>
        </div>
      </div>
    </div>
  </AutoLocalizedContent>);
}
