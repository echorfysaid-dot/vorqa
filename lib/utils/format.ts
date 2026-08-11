import type { Locale } from "@/lib/i18n";

export const intlLocale: Record<Locale, string> = {
  ar: "ar-MA",
  fr: "fr-FR",
  en: "en-GB"
};

export function resolveIntlLocale(locale: Locale | string = "en"): string {
  return locale in intlLocale ? intlLocale[locale as Locale] : locale;
}

export function formatNumber(value: number, locale: Locale | string = "en"): string {
  return new Intl.NumberFormat(resolveIntlLocale(locale)).format(value);
}

export function formatCurrency(amount: number, currency = "MAD", locale: Locale | string = "en"): string {
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(value: string | Date, locale: Locale | string = "en"): string {
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date, locale: Locale | string = "en"): string {
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatPercent(value: number, locale: Locale | string = "en"): string {
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    style: "percent",
    maximumFractionDigits: 0
  }).format(value / 100);
}
