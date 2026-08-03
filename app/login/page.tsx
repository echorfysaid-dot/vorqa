"use client";

import { LockKeyhole, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { useI18n } from "@/components/i18n-provider";
import { GlassCard } from "@/components/ui";
import { FeatureDockOfficial, VillaBackdrop, VoraAssistantCard, VorqaLogo } from "@/components/vorqa-visuals";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function LoginPage() {
  const { dictionary: t } = useI18n();

  return (<AutoLocalizedContent>
    <div className="relative -m-6 min-h-[calc(100vh-5rem)] overflow-hidden rounded-[2rem] p-4 sm:p-6 lg:p-8">
      <VillaBackdrop />
      <div className="relative z-10 grid min-h-[calc(100vh-8rem)] gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-5">
          <VorqaLogo />
          <GlassCard className="overflow-hidden p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d7b45a]">Secure VORA Workspace</p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl">{t.pages.loginTitle}</h1>
            <p className="mt-5 leading-8 text-white/68">{t.pages.loginDescription}</p>
            <div className="mt-8 grid gap-3">
              {["Supabase Auth", "User profiles", "Saved generations", "Protected workspace"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-bold text-white/72">
                  <ShieldCheck className="h-5 w-5 text-[#f1cf72]" />
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>
          <VoraAssistantCard message="مرحباً، سأساعدك على العودة إلى مساحة مشروعك بأمان." state="success" />
        </div>

        <GlassCard className="mx-auto w-full max-w-xl p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D7B45A]/12 text-[#D7B45A]">
              <LockKeyhole className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-3xl font-black text-white">{t.pages.loginHeading}</h2>
              <p className="mt-1 text-sm text-white/50">{t.pages.loginHint}</p>
            </div>
          </div>
          <LoginForm />
        </GlassCard>
      </div>
      <div className="relative z-10 mt-6">
        <FeatureDockOfficial />
      </div>
    </div>
  </AutoLocalizedContent>);
}
