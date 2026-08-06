"use client";

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type AuthSession = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user: AuthUser;
};

const storageKey = "vorqa-auth-session";
export const authSessionChangedEvent = "vorqa-auth-session-changed";
const refreshSkewMs = 60_000;

function normalizeExpiresAt(value?: number) {
  if (!value) return undefined;
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

function withExpiry(session: AuthSession): AuthSession {
  const expiresAt = normalizeExpiresAt(session.expires_at);
  if (expiresAt) return { ...session, expires_at: expiresAt };
  if (!session.expires_in) return session;
  return {
    ...session,
    expires_at: Date.now() + session.expires_in * 1000
  };
}

export function normalizeSession(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const session = value as Partial<AuthSession>;
  if (!session.access_token || !session.user?.id) return null;
  return withExpiry(session as AuthSession);
}

export function getStoredSession() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const session = normalizeSession(JSON.parse(raw));
    if (!session) {
      window.localStorage.removeItem(storageKey);
      return null;
    }
    return session;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function storeSession(session: AuthSession) {
  window.localStorage.setItem(storageKey, JSON.stringify(withExpiry(session)));
  window.dispatchEvent(new Event(authSessionChangedEvent));
}

export function clearSession() {
  window.localStorage.removeItem(storageKey);
  window.dispatchEvent(new Event(authSessionChangedEvent));
}

export function safeAuthRedirect(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, "https://vorqa.local");
    if (url.origin !== "https://vorqa.local") return fallback;
    if (["/login", "/register"].includes(url.pathname)) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

function shouldRefresh(session: AuthSession) {
  if (!session.refresh_token || !session.expires_at) return false;
  return session.expires_at - Date.now() <= refreshSkewMs;
}

export async function refreshStoredSession() {
  const session = getStoredSession();
  if (!session?.refresh_token) return null;

  let response: Response;
  try {
    response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
  } catch {
    return session;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.session?.access_token) {
    if (response.status === 400 || response.status === 401) {
      clearSession();
      return null;
    }
    return session;
  }

  const nextSession = normalizeSession({
    ...data.session,
    refresh_token: data.session.refresh_token || session.refresh_token,
    user: data.session.user || session.user
  });

  if (!nextSession) {
    clearSession();
    return null;
  }

  storeSession(nextSession);
  return nextSession;
}

export async function getValidSession() {
  const session = getStoredSession();
  if (!session) return null;
  if (!shouldRefresh(session)) return session;
  return refreshStoredSession();
}

export async function authFetch(path: string, init: RequestInit = {}) {
  const session = await getValidSession();
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(path, {
    ...init,
    headers
  });

  if (response.status !== 401) return response;

  const refreshed = await refreshStoredSession();
  if (!refreshed?.access_token) {
    clearSession();
    return response;
  }

  if (refreshed.access_token === session?.access_token) {
    return new Response(JSON.stringify({ error: "Authentication service is temporarily unavailable." }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }

  headers.set("Authorization", `Bearer ${refreshed.access_token}`);
  return fetch(path, {
    ...init,
    headers
  });
}
