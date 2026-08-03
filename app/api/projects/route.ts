import { NextResponse } from "next/server";
import { getBearerToken, isApiError, isSupabaseServerConfigured, missingSupabaseResponse, supabaseRest, verifySupabaseUser } from "@/lib/supabase-server";
import { auditEvent, parseJsonObject, sanitizeText } from "@/lib/security";

export async function GET(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();
  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);
  if ("error" in user) return NextResponse.json({ error: user.error }, { status: user.status });

  const data = await supabaseRest(`/projects?owner_id=eq.${user.id}&order=updated_at.desc`, { token });
  if (isApiError(data)) return NextResponse.json({ error: data.error }, { status: data.status });
  return NextResponse.json({ projects: data });
}

export async function POST(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();
  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);
  if ("error" in user) return NextResponse.json({ error: user.error }, { status: user.status });
  const parsed = await parseJsonObject(request, 64 * 1024);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, code: parsed.code }, { status: parsed.status });
  const body = parsed.value;

  const data = await supabaseRest("/projects", {
    method: "POST",
    token,
    body: JSON.stringify({
      owner_id: user.id,
      title: sanitizeText(body.title, 160) || "Untitled project",
      type: sanitizeText(body.type, 64) || "document",
      status: sanitizeText(body.status, 64) || "draft",
      metadata: body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata : {}
    })
  });

  if (isApiError(data)) return NextResponse.json({ error: data.error }, { status: data.status });
  auditEvent("project.create", { userId: user.id });
  return NextResponse.json({ project: Array.isArray(data) ? data[0] : data });
}
