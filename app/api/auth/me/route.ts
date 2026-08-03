import { NextResponse } from "next/server";
import { getBearerToken, isSupabaseServerConfigured, missingSupabaseResponse, verifySupabaseUser } from "@/lib/supabase-server";

export async function GET(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();

  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);

  if ("error" in user) {
    return NextResponse.json({ error: user.error }, { status: user.status });
  }

  return NextResponse.json({ user });
}
