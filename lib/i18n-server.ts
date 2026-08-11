import "server-only";

import { cookies } from "next/headers";
import { resolveLocale, type Locale } from "@/lib/i18n";

export function getRequestLocale(): Locale {
  return resolveLocale(cookies().get("vorqa-locale")?.value);
}
