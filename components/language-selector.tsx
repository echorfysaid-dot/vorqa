"use client";

import { Globe2 } from "lucide-react";
import { localeMeta, locales } from "@/lib/i18n";
import { useI18n } from "@/components/i18n-provider";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, dictionary } = useI18n();
  return (
    <div role="group" aria-label={dictionary.common.language} className={`inline-flex items-center gap-1 rounded-ds-md border border-white/10 bg-[#111315]/95 p-1 text-sm font-black text-ds-text shadow-lg backdrop-blur-xl ${compact ? "h-11" : ""}`}>
      <Globe2 className="h-4 w-4 text-gold" />
      {locales.map((item) => <button
        key={item}
        type="button"
        onClick={() => setLocale(item)}
        aria-pressed={locale === item}
        title={localeMeta[item].nativeName}
        className={`min-h-8 rounded-ds-sm px-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-token-gold ${locale === item ? "bg-ds-token-gold text-black" : "text-ds-token-muted hover:bg-white/10 hover:text-ds-token-text"}`}
      >{item.toUpperCase()}</button>)}
    </div>
  );
}
