"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthSession, authFetch, authSessionChangedEvent, clearSession, getValidSession, normalizeSession, storeSession } from "@/lib/auth-client";

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: { email: string; password: string; firstName: string; lastName: string; phone: string; country: string; preferredLanguage: string; accountType: string; primaryRole?: string; organizationType?: string }) => Promise<{ success: boolean; authenticated: boolean; message?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const publicRoutes = new Set(["/", "/login", "/register", "/pricing", "/onboarding"]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [initialized, setInitialized] = useState(false);
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
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setInitialized(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (initialized && !session && !publicRoutes.has(pathname)) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [initialized, pathname, router, session]);

  useEffect(() => {
    if (initialized && session && ["/login", "/register"].includes(pathname)) router.replace("/dashboard");
  }, [initialized, pathname, router, session]);

  useEffect(() => {
    const syncSession = () => { void getValidSession().then(setSession).catch(() => undefined); };
    window.addEventListener("storage", syncSession);
    window.addEventListener("pageshow", syncSession);
    window.addEventListener(authSessionChangedEvent, syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("pageshow", syncSession);
      window.removeEventListener(authSessionChangedEvent, syncSession);
    };
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
      logout: async () => {
        try {
          await authFetch("/api/auth/logout", { method: "POST" });
        } finally {
          clearSession();
          setSession(null);
          router.replace("/login");
          router.refresh();
        }
      }
    }),
    [error, loading, router, session]
  );

  const redirectingToLogin = initialized && !session && !publicRoutes.has(pathname);
  const redirectingToDashboard = initialized && Boolean(session) && ["/login", "/register"].includes(pathname);

  return (
    <AuthContext.Provider value={value}>
      {initialized && !redirectingToLogin && !redirectingToDashboard ? children : <AuthInitializing />}
    </AuthContext.Provider>
  );
}

function AuthInitializing() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#08090A] text-[#D6B36A]" role="status" aria-live="polite">
      <span className="h-9 w-9 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
