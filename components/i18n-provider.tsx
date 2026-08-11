"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LocalizedContent } from "@/components/localized-content";
import { defaultLocale, dictionaries, localeMeta, translateUiText, type Dictionary, type Locale } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  dictionary: Dictionary;
  dir: "rtl" | "ltr";
  setLocale: (locale: Locale) => void;
  translate: (value: string) => string;
};

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  dictionary: dictionaries[defaultLocale],
  dir: localeMeta[defaultLocale].dir,
  setLocale: () => undefined,
  translate: (value) => value
});

function syncLocaleStorage(locale: Locale) {
  try {
    window.localStorage.setItem("vorqa-locale", locale);
  } catch {
    // The cookie remains canonical when storage is unavailable or blocked.
  }
}

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const dir = localeMeta[locale].dir;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.cookie = `vorqa-locale=${locale}; path=/; max-age=31536000; samesite=lax`;
    syncLocaleStorage(locale);
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (nextLocale === locale) return;
    const dir = localeMeta[nextLocale].dir;
    syncLocaleStorage(nextLocale);
    document.cookie = `vorqa-locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = dir;
    setLocaleState(nextLocale);
    router.refresh();
  }, [locale, router]);

  const translate = useCallback((value: string) => translateUiText(value, locale), [locale]);

  const value = useMemo(
    () => ({
      locale,
      dictionary: dictionaries[locale] as Dictionary,
      dir: localeMeta[locale].dir,
      setLocale,
      translate
    }),
    [locale, setLocale, translate]
  );

  return <I18nContext.Provider value={value}><LocalizedContent key={locale} locale={locale}>{children}</LocalizedContent></I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
