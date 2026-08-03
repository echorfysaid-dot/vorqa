import { NextResponse } from "next/server";
import { ensureProfile, isSupabaseServerConfigured, missingSupabaseResponse, supabaseAuth } from "@/lib/supabase-server";
import { auditEvent, checkRateLimitAsync, parseJsonObject, rateLimitResponse, validateEmail, validatePassword } from "@/lib/security";

export async function POST(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();

  const limit = await checkRateLimitAsync(request, "auth");
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const parsed = await parseJsonObject(request, 16 * 1024);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, code: parsed.code }, { status: parsed.status });
  const emailResult = validateEmail(parsed.value.email);
  if (!emailResult.ok) return NextResponse.json({ error: emailResult.error, code: emailResult.code }, { status: emailResult.status });
  const passwordResult = validatePassword(parsed.value.password);
  if (!passwordResult.ok) return NextResponse.json({ error: passwordResult.error, code: passwordResult.code }, { status: passwordResult.status });
  const email = emailResult.value;
  const password = passwordResult.value;

  const data = await supabaseAuth("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  if ("error" in data) {
    auditEvent("login.failed", { email, status: data.status });
    return NextResponse.json({ error: data.error }, { status: data.status });
  }

  const session = data as { access_token: string; user: { id: string; email?: string; user_metadata?: Record<string, unknown> } };
  await ensureProfile({
    token: session.access_token,
    userId: session.user.id,
    email: session.user.email || email,
    fullName: String(session.user.user_metadata?.full_name || "")
  });

  auditEvent("login.success", { userId: session.user.id, email });
  return NextResponse.json({ session });
}
