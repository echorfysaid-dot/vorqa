"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { createAiApplicationContext, type AiApplicationContext, type AiTheme } from "@/lib/ai-context";
import { useOnboardingProfile } from "@/lib/onboarding-client";

const AiApplicationContextValue = createContext<AiApplicationContext | null>(null);

function readTheme(): AiTheme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem("vorqa-theme");
  if (stored === "dark" || stored === "light") return stored;
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.classList.contains("light")) return "light";
  return "system";
}

export function AiContextProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const onboarding = useOnboardingProfile(Boolean(session));
  const { locale, dir } = useI18n();
  const [theme, setTheme] = useState<AiTheme>("system");

  useEffect(() => {
    setTheme(readTheme());

    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "vorqa-theme") setTheme(readTheme());
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const context = useMemo(
    () =>
      createAiApplicationContext({
        pathname,
        searchParams: new URLSearchParams(searchParams.toString()),
        language: locale,
        direction: dir,
        theme,
        isAuthenticated: Boolean(session?.user),
        accountType: onboarding.profile?.accountType || undefined,
        primaryRole: onboarding.profile?.primaryRole || undefined,
        organizationType: onboarding.profile?.organizationType || undefined,
        activeWorkspaceType: onboarding.profile?.activeWorkspaceType || undefined
      }),
    [pathname, searchParams, locale, dir, theme, session?.user, onboarding.profile?.accountType, onboarding.profile?.primaryRole, onboarding.profile?.organizationType, onboarding.profile?.activeWorkspaceType]
  );

  return <AiApplicationContextValue.Provider value={context}>{children}</AiApplicationContextValue.Provider>;
}

export function useAiApplicationContext() {
  const context = useContext(AiApplicationContextValue);
  if (!context) {
    throw new Error("useAiApplicationContext must be used inside AiContextProvider");
  }
  return context;
}
