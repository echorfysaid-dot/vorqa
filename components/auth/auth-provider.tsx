"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthSession, authFetch, clearSession, getValidSession, normalizeSession, storeSession } from "@/lib/auth-client";

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: { email: string; password: string; firstName: string; lastName: string; phone: string; country: string; preferredLanguage: string; accountType: string; primaryRole?: string; organizationType?: string }) => Promise<{ success: boolean; authenticated: boolean; message?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const publicRoutes = new Set(["/", "/login", "/register", "/pricing", "/onboarding"]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onboardingState, setOnboardingState] = useState<"unknown" | "complete" | "incomplete" | "unavailable">("unknown");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    getValidSession()
      .then(async (stored) => {
        if (!active) return;
        setSession(stored);
        if (!stored?.access_token) return;

        const response = await authFetch("/api/auth/me");
        if (!active) return;
        if (response.status === 401) {
          clearSession();
          setSession(null);
          return;
        }
        const data = await response.json().catch(() => ({}));
        if (data.user) {
          const nextSession = normalizeSession({ ...stored, user: data.user });
          if (nextSession) {
            storeSession(nextSession);
            setSession(nextSession);
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && !session && !publicRoutes.has(pathname)) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, pathname, router, session]);

  useEffect(() => {
    if (!session?.access_token) { setOnboardingState("unknown"); return; }
    let active = true;
    setOnboardingState("unknown");
    authFetch("/api/onboarding")
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) { setOnboardingState("unavailable"); return; }
        const data = await response.json().catch(() => ({}));
        if (!active) return;
        setOnboardingState(data.profile?.status === "completed" ? "complete" : "incomplete");
      })
      .catch(() => { if (active) setOnboardingState("unavailable"); });
    return () => { active = false; };
  }, [session?.access_token]);

  useEffect(() => {
    if (!session || onboardingState === "unknown" || onboardingState === "unavailable") return;
    if (onboardingState === "incomplete" && pathname !== "/onboarding") router.replace("/onboarding");
    if (onboardingState === "complete" && ["/onboarding", "/register", "/login"].includes(pathname)) router.replace("/dashboard");
  }, [onboardingState, pathname, router, session]);

  useEffect(() => {
    const completed = () => setOnboardingState("complete");
    window.addEventListener("vorqa-onboarding-completed", completed);
    return () => window.removeEventListener("vorqa-onboarding-completed", completed);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      error,
      login: async (email, password) => {
        setError("");
        setLoading(true);
        let response: Response;
        try {
          response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });
        } catch (error) {
          setLoading(false);
          setError(error instanceof Error ? error.message : "Login request failed.");
          return false;
        }
        const data = await response.json().catch(() => ({ error: "Login returned an invalid response." }));
        setLoading(false);
        const nextSession = normalizeSession(data.session);
        if (!response.ok || !nextSession) {
          setError(data.error || "Login failed.");
          return false;
        }
        storeSession(nextSession);
        setSession(nextSession);
        return true;
      },
      register: async (input) => {
        setError("");
        setLoading(true);
        let response: Response;
        try {
          response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...input, fullName: `${input.firstName} ${input.lastName}`.trim() })
          });
        } catch (error) {
          setLoading(false);
          setError(error instanceof Error ? error.message : "Registration request failed.");
          return { success: false, authenticated: false };
        }
        const data = await response.json().catch(() => ({ error: "Registration returned an invalid response." }));
        setLoading(false);
        if (!response.ok) {
          setError(data.error || "Registration failed.");
          return { success: false, authenticated: false };
        }
        const nextSession = normalizeSession(data.session);
        if (nextSession) {
          storeSession(nextSession);
          setSession(nextSession);
        }
        return {
          success: true,
          authenticated: Boolean(nextSession?.access_token),
          message: data.message
        };
      },
      logout: () => {
        clearSession();
        setSession(null);
        router.replace("/login");
      }
    }),
    [error, loading, router, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
