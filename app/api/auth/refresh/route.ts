import { NextResponse } from "next/server";
import { ensureProfile, isSupabaseServerConfigured, missingSupabaseResponse, supabaseAuth } from "@/lib/supabase-server";
import { auditEvent, checkRateLimitAsync, parseJsonObject, rateLimitResponse, sanitizeText } from "@/lib/security";

export async function POST(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();

  const limit = await checkRateLimitAsync(request, "auth");
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const parsed = await parseJsonObject(request, 16 * 1024);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, code: parsed.code }, { status: parsed.status });
  const refreshToken = sanitizeText(parsed.value.refresh_token, 4096);

  if (!refreshToken) {
    return NextResponse.json({ error: "Refresh token is required." }, { status: 401 });
  }

  const data = await supabaseAuth("/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  if ("error" in data) {
    auditEvent("session.refresh_failed", { status: data.status });
    return NextResponse.json({ error: data.error }, { status: data.status === 400 ? 401 : data.status });
  }

  const session = data as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: { id: string; email?: string; user_metadata?: Record<string, unknown> };
  };

  if (!session.access_token || !session.user?.id) {
    return NextResponse.json({ error: "Invalid refreshed session." }, { status: 401 });
  }

  await ensureProfile({
    token: session.access_token,
    userId: session.user.id,
    email: session.user.email,
    fullName: String(session.user.user_metadata?.full_name || "")
  });

  auditEvent("session.refresh_success", { userId: session.user.id, email: session.user.email });
  return NextResponse.json({ session });
}
