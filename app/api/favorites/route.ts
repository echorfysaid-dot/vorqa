import { NextResponse } from "next/server";
import { getBearerToken, isApiError, isSupabaseServerConfigured, missingSupabaseResponse, supabaseRest, verifySupabaseUser } from "@/lib/supabase-server";
import { auditEvent, parseJsonObject, validateEntityId } from "@/lib/security";

export async function GET(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();
  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);
  if ("error" in user) return NextResponse.json({ error: user.error }, { status: user.status });

  const data = await supabaseRest(`/favorites?owner_id=eq.${user.id}&select=*,generation_history(*)&order=created_at.desc`, { token });
  if (isApiError(data)) return NextResponse.json({ error: data.error }, { status: data.status });
  return NextResponse.json({ favorites: data });
}

export async function POST(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();
  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);
  if ("error" in user) return NextResponse.json({ error: user.error }, { status: user.status });
  const parsed = await parseJsonObject(request, 16 * 1024);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, code: parsed.code }, { status: parsed.status });
  const generationId = validateEntityId(parsed.value.generationId, "generationId");
  if (!generationId.ok) return NextResponse.json({ error: generationId.error, code: generationId.code }, { status: generationId.status });

  const data = await supabaseRest("/favorites", {
    method: "POST",
    token,
    body: JSON.stringify({ owner_id: user.id, generation_id: generationId.value })
  });
  if (isApiError(data)) return NextResponse.json({ error: data.error }, { status: data.status });
  auditEvent("favorite.create", { userId: user.id, generationId: generationId.value });
  return NextResponse.json({ favorite: Array.isArray(data) ? data[0] : data });
}
