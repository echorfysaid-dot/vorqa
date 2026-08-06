import { NextResponse } from "next/server";
import { ensureProfile, friendlyAuthError, missingSupabaseResponse, supabaseAuth, isSupabaseServerConfigured } from "@/lib/supabase-server";
import { auditEvent, checkRateLimitAsync, parseJsonObject, rateLimitResponse, sanitizeText, validateEmail, validatePassword } from "@/lib/security";
import { normalizeAccountIdentity, workspaceTypeForIdentity } from "@/lib/onboarding";

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
  const fullName = sanitizeText(parsed.value.fullName, 120);
  const firstName = sanitizeText(parsed.value.firstName, 60);
  const lastName = sanitizeText(parsed.value.lastName, 60);
  const phone = sanitizeText(parsed.value.phone, 32);
  const country = sanitizeText(parsed.value.country, 80);
  const preferredLanguage = ["ar", "fr", "en"].includes(String(parsed.value.preferredLanguage)) ? String(parsed.value.preferredLanguage) : "en";
  if (!firstName || !lastName || !phone || !country) return NextResponse.json({ error: "Complete all required account fields." }, { status: 400 });
  const identity = normalizeAccountIdentity(parsed.value);
  if (!identity) return NextResponse.json({ error: "Select a valid account type and role or organization type." }, { status: 400 });
  const workspaceType = workspaceTypeForIdentity(identity);

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let siteUrl = "";
  if (configuredSiteUrl) {
    try {
      const parsedSiteUrl = new URL(configuredSiteUrl);
      if (["http:", "https:"].includes(parsedSiteUrl.protocol)) siteUrl = parsedSiteUrl.origin;
    } catch {
      siteUrl = "";
    }
  }
  const redirectTo = siteUrl ? `${siteUrl}/login?confirmed=1` : "";
  const signupPath = redirectTo ? `/signup?redirect_to=${encodeURIComponent(redirectTo)}` : "/signup";
  const data = await supabaseAuth(signupPath, {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      data: { full_name: fullName, first_name: firstName, last_name: lastName, phone, country, preferred_language: preferredLanguage, account_type: identity.accountType, primary_role: identity.primaryRole, organization_type: identity.organizationType, onboarding_status: "account_created", active_workspace_type: workspaceType }
    })
  });

  if ("error" in data) {
    auditEvent("register.failed", { email, status: data.status });
    return NextResponse.json({ error: friendlyAuthError(data.error, "register") }, { status: data.status });
  }

  const session = data as { access_token?: string; user?: { id: string; email?: string } };
  if (session.access_token && session.user?.id) {
    await ensureProfile({
      token: session.access_token,
      userId: session.user.id,
      email: session.user.email || email,
      fullName
    });
  }

  auditEvent("register.success", { userId: session.user?.id, email, confirmationRequired: !session.access_token });
  return NextResponse.json({
    session: session.access_token ? data : null,
    user: session.user,
    confirmationRequired: !session.access_token,
    message: session.access_token ? "Registered successfully." : "Account created. Confirm your email before signing in."
  });
}
