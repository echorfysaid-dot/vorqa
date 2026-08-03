import { getValidSession } from "@/lib/auth-client";
import { isSupabaseConfigured } from "@/lib/supabase";

const unavailable = "Organizations are unavailable for the current Supabase session.";

export function organizationRestUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1${path}`;
}

export async function organizationRest<T>(path: string, init: RequestInit = {}): Promise<{ data: T | null; error?: string; status?: number }> {
  if (!isSupabaseConfigured()) return { data: null, error: "Supabase is not configured." };
  const session = await getValidSession();
  if (!session?.access_token) return { data: null, error: "Authentication is required to load organizations." };

  const response = await fetch(organizationRestUrl(path), {
    ...init,
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      Authorization: `Bearer ${session.access_token}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json", Prefer: "return=representation" } : {}),
      ...(init.headers || {})
    }
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text };
  }

  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
      ? payload.message
      : unavailable;
    return { data: null, error: message, status: response.status };
  }

  return { data: payload as T };
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
