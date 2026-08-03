"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  Building2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  FolderKanban,
  LockKeyhole,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  Zap
} from "lucide-react";
import { useState } from "react";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/components/i18n-provider";
import { Badge, Button, ChatBubble, GlassCard } from "@/components/ui";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import {
  ArchitectureProjectCard,
  BlueprintMetric,
  FeatureDockOfficial,
  OfficialRoleCards,
  ProjectSummaryPanel,
  VoraAssistantCard,
  VorqaHeroScene,
  VorqaLogo,
  VoraOrb
} from "@/components/vorqa-visuals";

const capabilities = [
  ["تخطيط المشاريع", "حوّل الفكرة الأولى إلى مراحل قابلة للتنفيذ ومؤشرات متابعة واضحة.", FolderKanban],
  ["وثائق وتقارير", "أنشئ تقارير تنفيذية ومقترحات ومستندات منظمة بمساعدة VORA.", FileText],
  ["تنسيق الفرق", "اربط المالك، المهندس، المقاول، المكتب، والمستثمر في مساحة واحدة.", UsersRound],
  ["متابعة التنفيذ", "راقب التقدم، المخاطر، الملفات، والقرارات طوال دورة حياة المشروع.", BarChart3]
] as const;

const workflow = ["الفكرة", "التخطيط", "الوثائق", "التنسيق", "التنفيذ", "التسليم"];
const faqs = [
  ["هل Vorqa AI مخصصة للمشاريع المعمارية؟", "نعم. التجربة مبنية حول إدارة المشاريع من الفكرة إلى التسليم، مع دعم VORA للوثائق، المعرفة، والمتابعة."],
  ["هل تغيرت وظائف الذكاء الاصطناعي؟", "لا. تم الحفاظ على منطق OpenAI وذاكرة المشروع، مع ترقية الواجهة والتجربة فقط."],
  ["هل لغة الواجهة تتحكم في لغة المخرجات؟", "لا. لغة مخرجات الذكاء تبقى مستقلة داخل كل أداة."]
];

export function LandingPage() {
  const router = useRouter();
  const { dictionary: t } = useI18n();
  const [openFaq, setOpenFaq] = useState(0);

  return (<AutoLocalizedContent>
    <div className="min-h-screen overflow-x-hidden bg-[#05070B] text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#05070B]/62 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <VorqaLogo />
          <nav className="hidden items-center gap-7 lg:flex">
            {[
              ["#roles", "الأدوار"],
              ["#capabilities", "القدرات"],
              ["#workflow", "طريقة العمل"],
              ["#knowledge", "المعرفة"],
              ["#pricing", "الأسعار"]
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-bold text-white/58 transition hover:text-[#F2D487]">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSelector compact />
            <Link href="/login" className="hidden rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-3 text-sm font-black text-white/72 transition hover:bg-white/[0.075] sm:inline-flex">
              {t.common.login}
            </Link>
            <Link href="/register" className="vorqa-gold-button rounded-2xl px-5 py-3 text-sm font-black transition hover:-translate-y-0.5">
              {t.common.getStarted}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_78%_20%,rgba(81,216,255,.14),transparent_28%),radial-gradient(circle_at_22%_24%,rgba(215,180,90,.14),transparent_26%),linear-gradient(135deg,#05070B,#07101C_52%,#020305)] px-4 pb-8 pt-24 sm:px-6 lg:px-8">
          <div className="vorqa-blueprint pointer-events-none absolute inset-0 opacity-45" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.34),transparent_42%,rgba(0,0,0,.28))]" />
          <div className="relative z-10 mx-auto grid min-h-[calc(100vh-7rem)] max-w-[1500px] items-center gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }} className="max-w-3xl">
              <div className="mb-7 flex flex-wrap items-center gap-3">
                <Badge tone="gold">
                  <ShieldCheck className="h-4 w-4" /> آمن · موثوق · ذكي
                </Badge>
                <Badge tone="blue">
                  <BrainCircuit className="h-4 w-4" /> VORA Project Manager
                </Badge>
              </div>
              <h1 className="text-5xl font-black leading-[1.08] text-white sm:text-7xl">
                من الفكرة إلى مشروع
                <span className="block bg-gradient-to-l from-[#FFF2B8] via-[#D7B45A] to-[#51D8FF] bg-clip-text text-transparent">جاهز للتنفيذ</span>
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-10 text-white/78">
                خطّط مشروعك، أنشئ وثائقك، نظّم فريقك، وتابع التنفيذ مع VORA في مساحة عمل ذكية واحدة.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => router.push("/register")} icon={<ArrowLeft className="h-5 w-5" />}>
                  ابدأ رحلتك
                </Button>
                <Button size="lg" variant="secondary" onClick={() => document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" })} icon={<Sparkles className="h-5 w-5" />}>
                  شاهد كيف تعمل
                </Button>
              </div>
              <div className="mt-8 max-w-4xl">
                <FeatureDockOfficial />
              </div>
            </motion.div>

            <VorqaHeroScene />
          </div>
        </section>

        <Section id="roles" eyebrow="الأدوار" title="منصة واحدة لكل أطراف المشروع" text="Vorqa AI تربط المالك، المهندس، المقاول، المستثمر، مكتب الدراسات، والعميل في تجربة واحدة واضحة.">
          <OfficialRoleCards />
        </Section>

        <Section id="capabilities" eyebrow="القدرات الرئيسية" title="VORA تدير الرحلة من التخطيط إلى التسليم" text="ليست مجرد أداة توليد. إنها مساحة عمل ذكية للمشاريع والوثائق والمعرفة والمتابعة.">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {capabilities.map(([title, text, Icon]) => (
              <GlassCard key={title} className="p-6">
                <Icon className="h-10 w-10 text-[#D7B45A]" />
                <h3 className="mt-5 text-2xl font-black text-white">{title}</h3>
                <p className="mt-3 leading-7 text-[#A8B0C0]">{text}</p>
              </GlassCard>
            ))}
          </div>
        </Section>

        <Section id="workflow" eyebrow="من الفكرة إلى التنفيذ" title="خط سير معماري واضح ومترابط" text="كل مرحلة لها وثائقها، ملفاتها، قراراتها، ومؤشرات تقدمها داخل Vorqa.">
          <div className="grid gap-4 lg:grid-cols-6">
            {workflow.map((step, index) => (
              <GlassCard key={step} className="p-5 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#D7B45A] text-lg font-black text-black">{index + 1}</span>
                <p className="mt-4 font-black text-white">{step}</p>
              </GlassCard>
            ))}
          </div>
        </Section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[.9fr_1.1fr]">
            <div className="space-y-5">
              <SectionHeader eyebrow="VORA" title="مساعد مشروع ذكي وهادئ" text="VORA يراجع السياق، يقترح الخطوة التالية، ويحافظ على تنظيم المشروع طوال التنفيذ." align="right" />
              <VoraAssistantCard message="راجعت معلومات المشروع، والخطوة الأنسب الآن هي إعداد الجدول الزمني الأولي." state="thinking" />
            </div>
            <GlassCard className="p-5">
              <div className="mb-5 flex items-center gap-3">
                <VoraOrb size="md" state="generating" />
                <div>
                  <p className="font-black text-white">جلسة VORA</p>
                  <p className="text-sm text-[#A8B0C0]">سياق المشروع والذاكرة الحديثة</p>
                </div>
              </div>
              <div className="grid gap-3">
                <ChatBubble role="user">أريد إعداد خطة تنفيذ أولية لفيلا سكنية في أكادير.</ChatBubble>
                <ChatBubble role="assistant">سأبدأ بتقسيم المشروع إلى مراحل: التصميم، التراخيص، الميزانية، التنفيذ، المراقبة، والتسليم النهائي.</ChatBubble>
              </div>
            </GlassCard>
          </div>
        </section>

        <Section id="knowledge" eyebrow="Knowledge Workspace" title="ملفات المشروع ومعرفته في مكان واحد" text="ارفع وثائق المشروع، الجداول، المخططات، العروض، والصور داخل مساحة معرفة المشروع دون تغيير أي منطق تخزين.">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <ArchitectureProjectCard title="فيلا سكنية - أكادير" progress={68} />
            <ProjectSummaryPanel />
          </div>
        </Section>

        <Section id="pricing" eyebrow="الأثر" title="مساحة عمل جاهزة لفريق جاد" text="تجربة بصرية ووظيفية تعطي إحساس منتج استثماري حقيقي.">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <BlueprintMetric label="مستخدم نشط" value="+12K" icon={UsersRound} />
            <BlueprintMetric label="مشروع تم إنجازه" value="+8K" icon={Building2} />
            <BlueprintMetric label="مخطط تم تحليله" value="+25K" icon={ClipboardCheck} />
            <BlueprintMetric label="رضا المستخدمين" value="+98%" icon={BarChart3} />
          </div>
        </Section>

        <Section eyebrow="آراء مبكرة" title="تجربة فاخرة مبنية للعمل الحقيقي" text="واجهات واضحة، مخرجات منظمة، وإحساس مشروع قابل للتنفيذ منذ الجلسة الأولى.">
          <div className="grid gap-5 lg:grid-cols-3">
            {["صاحب مشروع", "مهندس معماري", "مكتب دراسات"].map((name) => (
              <GlassCard key={name} className="p-6">
                <Quote className="h-7 w-7 text-[#D7B45A]" />
                <p className="mt-5 leading-8 text-white/70">Vorqa AI جعلت المشروع يبدو منظماً وقابلاً للتنفيذ من أول جلسة.</p>
                <div className="mt-5 flex gap-1 text-[#D7B45A]">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}</div>
                <p className="mt-5 font-black text-white">{name}</p>
              </GlassCard>
            ))}
          </div>
        </Section>

        <Section id="faq" eyebrow="FAQ" title="أسئلة قبل البدء" text="إجابات مختصرة حول هوية Vorqa الجديدة ووظائفها.">
          <div className="mx-auto max-w-4xl space-y-3">
            {faqs.map(([question, answer], index) => (
              <GlassCard key={question} className="overflow-hidden">
                <button className="flex w-full items-center justify-between gap-4 p-5 text-start" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                  <span className="text-lg font-black text-white">{question}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-[#D7B45A] transition ${openFaq === index ? "rotate-180" : ""}`} />
                </button>
                {openFaq === index && <p className="px-5 pb-5 leading-8 text-white/62">{answer}</p>}
              </GlassCard>
            ))}
          </div>
        </Section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <GlassCard className="mx-auto max-w-5xl overflow-hidden p-8 text-center sm:p-12">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#F2D487] to-[#9D7833] text-black shadow-[0_0_70px_rgba(215,180,90,.32)]">
              <Zap className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-black leading-tight text-white sm:text-5xl">ابدأ مشروعك القادم مع VORA</h2>
            <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/62">حوّل الفكرة إلى خطة ووثائق ومساحة عمل قابلة للتنفيذ.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={() => router.push("/register")} icon={<ArrowLeft className="h-5 w-5" />}>ابدأ رحلتك</Button>
              <Button size="lg" variant="secondary" onClick={() => router.push("/login")} icon={<LockKeyhole className="h-5 w-5" />}>تسجيل الدخول</Button>
            </div>
          </GlassCard>
        </section>
      </main>
    </div>
  </AutoLocalizedContent>);
}

function Section({ id, eyebrow, title, text, children }: { id?: string; eyebrow: string; title: string; text: string; children: React.ReactNode }) {
  return (<AutoLocalizedContent>
    <section id={id} className="px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeader eyebrow={eyebrow} title={title} text={text} />
      <div className="mx-auto mt-12 max-w-[1400px]">{children}</div>
    </section>
  </AutoLocalizedContent>);
}

function SectionHeader({ eyebrow, title, text, align = "center" }: { eyebrow: string; title: string; text: string; align?: "center" | "right" }) {
  return (<AutoLocalizedContent>
    <div className={`mx-auto max-w-3xl ${align === "center" ? "text-center" : "text-right"}`}>
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D7B45A]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">{title}</h2>
      <p className="mt-5 text-lg leading-9 text-[#A8B0C0]">{text}</p>
    </div>
  </AutoLocalizedContent>);
}
