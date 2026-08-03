"use client";

import { Bell, Database, KeyRound, Languages, Palette, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Badge, GlassCard } from "@/components/ui";
import { LanguageSelector } from "@/components/language-selector";
import { VoraWorkspaceHero } from "@/components/vorqa-visuals";
import { projectRepository } from "@/lib/repositories";
import { supabaseEnv } from "@/lib/supabase";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

const providerStatus = projectRepository.listProviderStatus();

export default function SettingsPage() {
  const { dictionary: t } = useI18n();
  const settings = [
    { title: t.common.language, value: t.landing.heroLanguage, icon: Languages, action: <LanguageSelector /> },
    { title: "Theme", value: "Dark luxury default with light mode prepared", icon: Palette },
    { title: t.common.notifications, value: "In-app notification center prepared", icon: Bell },
    { title: "Authentication", value: "Supabase Auth environment prepared", icon: ShieldCheck }
  ];

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <VoraWorkspaceHero title={t.pages.settingsTitle} description={t.pages.settingsDescription} />

      <div className="grid gap-5 md:grid-cols-2">
        {settings.map((setting, index) => {
          const Icon = setting.icon;
          return (
            <GlassCard key={setting.title} delay={index * 0.04} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D4AF37]/10 text-[#f1cf72] shadow-gold-glow">
                  <Icon className="h-6 w-6" />
                </span>
                <Badge tone="neutral">Workspace</Badge>
              </div>
              <h2 className="mt-5 text-xl font-black text-[#f8efd7]">{setting.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#f8efd7]/54">{setting.value}</p>
              {setting.action && <div className="mt-4">{setting.action}</div>}
            </GlassCard>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <GlassCard className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <KeyRound className="h-6 w-6 text-[#f1cf72]" />
            <h2 className="text-2xl font-black text-[#f8efd7]">AI Providers</h2>
          </div>
          <div className="grid gap-3">
            {providerStatus.map((provider) => (
              <div key={provider.name} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e6c46a]/10 bg-white/[0.04] p-4">
                <div>
                  <p className="font-black text-[#f8efd7]">{provider.name}</p>
                  <p className="mt-1 text-xs text-[#f8efd7]/44">{provider.status}</p>
                </div>
                <Badge tone={provider.active ? "gold" : "neutral"}>{provider.active ? t.common.primary : t.common.prepared}</Badge>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <Database className="h-6 w-6 text-[#f1cf72]" />
            <h2 className="text-2xl font-black text-[#f8efd7]">Supabase Integration</h2>
          </div>
          <div className="grid gap-3">
            {Object.entries(supabaseEnv).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-[#e6c46a]/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f8efd7]/44">{key}</p>
                <p className="mt-2 font-mono text-sm font-bold text-[#f1cf72]">{value}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  </AutoLocalizedContent>);
}
