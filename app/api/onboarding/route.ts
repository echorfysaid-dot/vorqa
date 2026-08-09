import { NextResponse } from "next/server";
import { friendlyAuthError, friendlyDataError, getBearerToken, isApiError, isSupabaseServerConfigured, missingSupabaseResponse, supabaseRest, verifySupabaseUser } from "@/lib/supabase-server";
import { normalizeAccountIdentity, workspaceTypeForIdentity } from "@/lib/onboarding";
import { parseJsonObject, sanitizeText } from "@/lib/security";

type ProfileRow = { account_type: string | null; primary_role: string | null; organization_type: string | null; onboarding_status: string | null; onboarding_completed_at: string | null; active_workspace_type: string | null; workspace_configuration: Record<string, unknown> | null };

export async function GET(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();
  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);
  if (isApiError(user)) return NextResponse.json({ error: friendlyAuthError(user.error, "refresh") }, { status: user.status });
  const rows = await supabaseRest<ProfileRow[]>(`/profiles?id=eq.${encodeURIComponent(user.id)}&select=account_type,primary_role,organization_type,onboarding_status,onboarding_completed_at,active_workspace_type,workspace_configuration`, { token });
  if (isApiError(rows)) return NextResponse.json({ error: friendlyDataError(rows.status) }, { status: rows.status });
  const profile = rows[0];
  const identity = profile ? normalizeAccountIdentity({ accountType: profile.account_type, primaryRole: profile.primary_role, organizationType: profile.organization_type }) : null;
  return NextResponse.json({ profile: profile ? { accountType: identity?.accountType || null, primaryRole: identity?.primaryRole || null, organizationType: identity?.organizationType || null, status: profile.onboarding_status, completedAt: profile.onboarding_completed_at, activeWorkspaceType: identity ? workspaceTypeForIdentity(identity) : profile.active_workspace_type, configuration: profile.workspace_configuration } : null });
}

export async function PATCH(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();
  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);
  if (isApiError(user)) return NextResponse.json({ error: friendlyAuthError(user.error, "refresh") }, { status: user.status });
  const parsed = await parseJsonObject(request, 32 * 1024);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const identity = normalizeAccountIdentity(parsed.value);
  if (!identity) return NextResponse.json({ error: "Select a valid account type and role or organization type." }, { status: 400 });
  const values = parsed.value.values && typeof parsed.value.values === "object" && !Array.isArray(parsed.value.values)
    ? Object.fromEntries(Object.entries(parsed.value.values).slice(0, 24).map(([key, value]) => [sanitizeText(key, 64), sanitizeText(value, 240)])) : {};
  const completedAt = new Date().toISOString();
  const workspaceType = workspaceTypeForIdentity(identity);
  const configuration = { accountType: identity.accountType, role: identity.primaryRole, organizationType: identity.organizationType, workspaceType, values };
  const rows = await supabaseRest<ProfileRow[]>(`/profiles?id=eq.${encodeURIComponent(user.id)}`, { method: "PATCH", token, body: JSON.stringify({ account_type: identity.accountType, primary_role: identity.primaryRole, organization_type: identity.organizationType, onboarding_status: "completed", onboarding_completed_at: completedAt, active_workspace_type: workspaceType, workspace_configuration: configuration, updated_at: completedAt }) });
  if (isApiError(rows)) return NextResponse.json({ error: friendlyDataError(rows.status) }, { status: rows.status });
  return NextResponse.json({ profile: { ...identity, status: "completed", completedAt, activeWorkspaceType: workspaceType, configuration } });
}
