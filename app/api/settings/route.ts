import { NextResponse } from "next/server";
import { getBearerToken, isApiError, isSupabaseServerConfigured, missingSupabaseResponse, supabaseRest, verifySupabaseUser } from "@/lib/supabase-server";
import { auditEvent, parseJsonObject, sanitizeText } from "@/lib/security";

export async function GET(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();
  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);
  if ("error" in user) return NextResponse.json({ error: user.error }, { status: user.status });

  const data = await supabaseRest(`/user_settings?owner_id=eq.${user.id}&limit=1`, { token });
  if (isApiError(data)) return NextResponse.json({ error: data.error }, { status: data.status });
  return NextResponse.json({ settings: Array.isArray(data) ? data[0] || null : data });
}

export async function PUT(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();
  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);
  if ("error" in user) return NextResponse.json({ error: user.error }, { status: user.status });
  const parsed = await parseJsonObject(request, 32 * 1024);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, code: parsed.code }, { status: parsed.status });
  const body = parsed.value;

  const data = await supabaseRest("/user_settings?on_conflict=owner_id", {
    method: "POST",
    token,
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      owner_id: user.id,
      theme: sanitizeText(body.theme, 32) || "system",
      default_provider: sanitizeText(body.default_provider, 32) || "mock",
      notifications_enabled: body.notifications_enabled ?? true
    })
  });
  if (isApiError(data)) return NextResponse.json({ error: data.error }, { status: data.status });
  auditEvent("settings.update", { userId: user.id });
  return NextResponse.json({ settings: Array.isArray(data) ? data[0] : data });
}
