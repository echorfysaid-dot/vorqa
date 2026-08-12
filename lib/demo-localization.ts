import type { Locale } from "@/lib/i18n";
import { formatDate } from "@/lib/utils/format";
import { translateDemoKey } from "@/lib/locales/demo";

export type DemoLocalizedValue = {
  value: string;
  key?: string;
  date?: string;
};

export function localizeDemoValue(
  entry: DemoLocalizedValue,
  locale: Locale,
  translate: (value: string) => string
): string {
  if (entry.date) return formatDate(entry.date, locale, { month: "long" });
  return translateDemoKey(entry.key, locale) || translate(entry.value);
}

export function localizeDemoDate(
  value: string | undefined,
  locale: Locale,
  translate: (value: string) => string
): string {
  if (!value) return translate("Not scheduled");
  if (value === "Closed") return translate(value);
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? translate(value) : formatDate(value, locale, { month: "long" });
}
