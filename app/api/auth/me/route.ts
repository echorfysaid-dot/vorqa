import { NextResponse } from "next/server";
import { friendlyAuthError, getBearerToken, isSupabaseServerConfigured, missingSupabaseResponse, verifySupabaseUser } from "@/lib/supabase-server";

export async function GET(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();

  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);

  if ("error" in user) {
    return NextResponse.json({ error: friendlyAuthError(user.error, "refresh") }, { status: user.status });
  }

  return NextResponse.json({ user });
}
