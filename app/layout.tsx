import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { AiContextProvider } from "@/components/ai-context-provider";
import { AiMemoryProvider } from "@/components/ai-memory-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { dictionaries, localeMeta, resolveLocale } from "@/lib/i18n";

export function generateMetadata(): Metadata {
  const cookieLocale = cookies().get("vorqa-locale")?.value;
  const locale = resolveLocale(cookieLocale);
  return {
    title: dictionaries[locale].meta.title,
    description: dictionaries[locale].meta.description,
    metadataBase: new URL("https://vorqa.ai"),
    alternates: {
      canonical: "/",
      languages: { ar: "/", fr: "/?lang=fr", en: "/?lang=en" }
    }
  };
}

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieLocale = cookies().get("vorqa-locale")?.value;
  const locale = resolveLocale(cookieLocale);
  const dir = localeMeta[locale].dir;

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <I18nProvider initialLocale={locale}>
          <AuthProvider>
            <AiContextProvider>
              <AiMemoryProvider>
                <AppShell>{children}</AppShell>
              </AiMemoryProvider>
            </AiContextProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
