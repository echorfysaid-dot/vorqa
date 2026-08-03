
import { AutoLocalizedContent } from "@/components/auto-localized-content";import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  Construction,
  FileText,
  Globe2,
  ShieldCheck,
  UsersRound
} from "lucide-react";

export function VoraMark({ compact = false }: { compact?: boolean }) {
  return (<AutoLocalizedContent>
    <div className="flex items-center gap-3">
      <div className="relative grid h-14 w-14 place-items-center rounded-2xl border border-[#f1cf72]/25 bg-[#f1cf72]/10 shadow-[0_18px_60px_rgba(215,180,90,0.22)]">
        <span className="absolute inset-2 rounded-xl bg-gradient-to-br from-[#ffeaa0] via-[#c3912f] to-[#3a2708] opacity-80" />
        <span className="relative text-3xl font-black italic text-black">V</span>
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-3xl font-black tracking-[0.28em] text-[#f8efd7]">VORQA</p>
          <p className="mt-1 text-sm text-[#f8efd7]/52">نبني المستقبل، معا</p>
        </div>
      )}
    </div>
  </AutoLocalizedContent>);
}

export function LanguagePill() {
  return (<AutoLocalizedContent>
    <div className="inline-flex items-center gap-3 rounded-full border border-[#e6c46a]/18 bg-black/24 px-4 py-2 text-sm font-bold text-[#f8efd7] backdrop-blur-xl">
      <Globe2 className="h-4 w-4 text-[#f1cf72]" />
      العربية
      <span className="text-[#f8efd7]/38">⌄</span>
    </div>
  </AutoLocalizedContent>);
}

export function SecurityPill({ title = "آمن وموثوق", subtitle = "بياناتك محمية لدينا" }: { title?: string; subtitle?: string }) {
  return (<AutoLocalizedContent>
    <div className="inline-flex items-center gap-3 rounded-full border border-[#e6c46a]/20 bg-[#f1cf72]/8 px-4 py-2 text-sm font-bold text-[#f1cf72] backdrop-blur-xl">
      <ShieldCheck className="h-5 w-5" />
      <span className="leading-tight">
        <span className="block">{title}</span>
        {subtitle && <span className="block text-xs font-medium text-[#f8efd7]/46">{subtitle}</span>}
      </span>
    </div>
  </AutoLocalizedContent>);
}

export function VoraBot({ className = "" }: { className?: string }) {
  return (<AutoLocalizedContent>
    <div className={`relative mx-auto aspect-[0.78] w-full max-w-[280px] ${className}`}>
      <div className="absolute left-1/2 top-[4%] h-[32%] w-[70%] -translate-x-1/2 rounded-[42%] border border-[#f1cf72]/30 bg-gradient-to-b from-white/90 via-[#cbd7df] to-[#5a6470] shadow-[inset_0_0_28px_rgba(255,255,255,0.45),0_28px_70px_rgba(0,0,0,0.45)]" />
      <div className="absolute left-1/2 top-[10%] h-[20%] w-[52%] -translate-x-1/2 rounded-[40%] bg-[#06101a] shadow-[inset_0_0_26px_rgba(57,213,238,0.25)]">
        <span className="absolute left-[24%] top-[38%] h-5 w-5 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.9)]" />
        <span className="absolute right-[24%] top-[38%] h-5 w-5 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.9)]" />
        <span className="absolute bottom-[18%] left-1/2 h-3 w-10 -translate-x-1/2 rounded-b-full border-b-2 border-cyan-200" />
      </div>
      <div className="absolute left-1/2 top-[35%] h-[34%] w-[48%] -translate-x-1/2 rounded-[34%] border border-[#f1cf72]/28 bg-gradient-to-b from-[#dfe5ea] to-[#4b535e] shadow-[0_24px_60px_rgba(0,0,0,0.38)]">
        <div className="absolute left-1/2 top-[26%] grid h-16 w-16 -translate-x-1/2 place-items-center rounded-2xl border border-[#f1cf72]/30 bg-[#090d18] text-3xl font-black italic text-[#f1cf72]">V</div>
      </div>
      <div className="absolute left-[5%] top-[43%] h-[12%] w-[32%] rotate-[28deg] rounded-full border border-[#f1cf72]/20 bg-gradient-to-b from-[#cfd5dc] to-[#5b6570]" />
      <div className="absolute right-[4%] top-[39%] h-[12%] w-[35%] -rotate-[28deg] rounded-full border border-[#f1cf72]/20 bg-gradient-to-b from-[#dbe1e7] to-[#65707a]" />
      <div className="absolute right-0 top-[30%] h-12 w-12 rounded-full border border-[#f1cf72]/20 bg-gradient-to-b from-[#eef3f7] to-[#6f7882]" />
      <div className="absolute bottom-[10%] left-1/2 h-[20%] w-[62%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-2xl" />
    </div>
  </AutoLocalizedContent>);
}

export function VillaPreview() {
  return (<AutoLocalizedContent>
    <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-[#e6c46a]/16 bg-[#07101a] shadow-[0_40px_120px_rgba(0,0,0,0.5)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(241,207,114,0.22),transparent_22%),linear-gradient(180deg,rgba(7,16,26,0.1),rgba(4,8,14,0.92))]" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black to-transparent" />
      <div className="absolute left-[12%] top-[28%] h-52 w-[62%] rounded-lg border border-[#f1cf72]/18 bg-gradient-to-br from-[#d8d0bd]/18 to-[#101827]/80 shadow-[0_40px_90px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-x-5 top-5 h-16 rounded-md border border-[#f1cf72]/22 bg-black/35" />
        <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-3">
          <span className="h-24 rounded-md border border-[#f1cf72]/16 bg-[#f8efd7]/10" />
          <span className="h-24 rounded-md border border-[#f1cf72]/16 bg-[#f8efd7]/14" />
          <span className="h-24 rounded-md border border-[#f1cf72]/16 bg-[#f8efd7]/10" />
        </div>
        <div className="absolute -top-5 left-10 right-10 h-8 skew-x-[-18deg] border border-[#f1cf72]/20 bg-[#f1cf72]/18" />
      </div>
      <div className="absolute bottom-10 left-[16%] right-[18%] h-24 rounded-[50%] border border-cyan-300/20 bg-cyan-300/10 blur-[1px]" />
      <div className="absolute bottom-14 left-[20%] right-[24%] h-px bg-cyan-200/60 shadow-[0_0_18px_rgba(103,232,249,0.8)]" />
      <div className="absolute right-5 top-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-4 text-sm text-[#f8efd7]/78 backdrop-blur-xl">
        <p className="font-black text-[#f8efd7]">إدارة متكاملة</p>
        <p className="mt-1 text-xs leading-5">المهام، الميزانية، الموارد، والفريق</p>
      </div>
      <div className="absolute left-5 top-24 rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-4 text-sm text-[#f8efd7]/78 backdrop-blur-xl">
        <p className="font-black text-[#f8efd7]">تنفيذ دقيق</p>
        <p className="mt-1 text-xs leading-5">متابعة الأعمال بشكل لحظي</p>
      </div>
      <div className="absolute bottom-6 right-6 rounded-2xl border border-[#e6c46a]/18 bg-black/40 p-4 backdrop-blur-xl">
        <p className="text-sm text-[#f8efd7]/58">تقدم المشروع</p>
        <p className="mt-2 text-4xl font-black text-[#f8efd7]">68%</p>
        <div className="mt-3 h-2 w-36 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[68%] rounded-full bg-gradient-to-l from-cyan-300 to-[#f1cf72]" />
        </div>
      </div>
    </div>
  </AutoLocalizedContent>);
}

export function FeatureDock() {
  const items = [
    { title: "أمان عالي", text: "حماية بياناتك", icon: ShieldCheck },
    { title: "حفظ سحابي", text: "الوصول من أي مكان", icon: Cloud },
    { title: "ذكاء اصطناعي", text: "تحليل واقتراحات", icon: BrainCircuit },
    { title: "تعاون متكامل", text: "تواصل سلس", icon: UsersRound },
    { title: "تقارير احترافية", text: "قرارات أفضل", icon: BarChart3 }
  ];

  return (<AutoLocalizedContent>
    <div className="grid gap-3 rounded-[1.75rem] border border-[#e6c46a]/14 bg-white/[0.045] p-3 backdrop-blur-2xl md:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="flex items-center gap-3 rounded-2xl px-3 py-4">
            <Icon className="h-8 w-8 text-[#f1cf72]" />
            <div>
              <p className="font-black text-[#f8efd7]">{item.title}</p>
              <p className="mt-1 text-xs text-[#f8efd7]/48">{item.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  </AutoLocalizedContent>);
}

export function Stepper({ active = 1 }: { active?: number }) {
  const steps = ["نوع الحساب", "المعلومات", "التحقق", "إعداد الملف الشخصي"];
  return (<AutoLocalizedContent>
    <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
      {steps.map((step, index) => {
        const current = index + 1;
        const isActive = current <= active;
        return (
          <div key={step} className="flex min-w-fit items-center gap-2">
            <span className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-black ${isActive ? "border-[#f1cf72] bg-[#f1cf72] text-black" : "border-white/20 bg-white/5 text-[#f8efd7]"}`}>
              {current}
            </span>
            <span className={isActive ? "text-sm font-black text-[#f1cf72]" : "text-sm text-[#f8efd7]/54"}>{step}</span>
            {current < steps.length && <span className="h-px w-10 bg-[#e6c46a]/18" />}
          </div>
        );
      })}
    </div>
  </AutoLocalizedContent>);
}

export function ProjectSummaryCard() {
  return (<AutoLocalizedContent>
    <div className="rounded-[1.5rem] border border-[#e6c46a]/16 bg-white/[0.05] p-4 backdrop-blur-xl">
      <p className="text-center text-lg font-black text-[#f1cf72]">ملخص مشروعك</p>
      <div className="mt-4 h-32 rounded-2xl border border-[#e6c46a]/12 bg-gradient-to-br from-[#1a273c] to-[#0a0d16]" />
      <p className="mt-4 text-center text-xl font-black text-lime-300">فيلا سكنية</p>
      <div className="mt-4 grid gap-3 text-sm text-[#f8efd7]/66">
        <span className="flex justify-between"><span>الموقع</span><b className="text-[#f8efd7]">المغرب، أكادير</b></span>
        <span className="flex justify-between"><span>مساحة الأرض</span><b className="text-[#f8efd7]">600 م²</b></span>
        <span className="flex justify-between"><span>الميزانية</span><b className="text-[#f8efd7]">2,500,000 درهم</b></span>
      </div>
    </div>
  </AutoLocalizedContent>);
}

export function RoleCard({ title, text, active, icon: Icon }: { title: string; text: string; active?: boolean; icon: typeof Construction }) {
  return (<AutoLocalizedContent>
    <div className={`relative rounded-[1.5rem] border p-5 text-center transition ${active ? "border-[#f1cf72] bg-[#f1cf72]/10 shadow-[0_22px_70px_rgba(215,180,90,0.18)]" : "border-[#e6c46a]/12 bg-white/[0.045]"}`}>
      <span className="absolute left-4 top-4 h-5 w-5 rounded-full border border-[#f8efd7]/28" />
      {active && <CheckCircle2 className="absolute left-3 top-3 h-7 w-7 fill-[#f1cf72] text-black" />}
      <Icon className="mx-auto h-12 w-12 text-[#f1cf72]" />
      <h3 className="mt-4 text-lg font-black text-[#f8efd7]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#f8efd7]/54">{text}</p>
    </div>
  </AutoLocalizedContent>);
}
