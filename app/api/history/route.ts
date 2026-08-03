import { NextResponse } from "next/server";
import { getBearerToken, isApiError, isSupabaseServerConfigured, missingSupabaseResponse, supabaseRest, verifySupabaseUser } from "@/lib/supabase-server";

export async function GET(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();
  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);
  if ("error" in user) return NextResponse.json({ error: user.error }, { status: user.status });

  const data = await supabaseRest(`/generation_history?owner_id=eq.${user.id}&order=created_at.desc`, { token });
  if (isApiError(data)) return NextResponse.json({ error: data.error }, { status: data.status });
  return NextResponse.json({ history: data });
}
