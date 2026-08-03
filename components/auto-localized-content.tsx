"use client";

import { useI18n } from "@/components/i18n-provider";
import { LocalizedContent } from "@/components/localized-content";

export function AutoLocalizedContent({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  return <LocalizedContent locale={locale}>{children}</LocalizedContent>;
}
