import { NextResponse } from "next/server";
import { getBearerToken, isApiError, isSupabaseServerConfigured, missingSupabaseResponse, supabaseAuth } from "@/lib/supabase-server";

export async function POST(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();
  const token = getBearerToken(request);
  if (!token) return NextResponse.json({ signedOut: true });

  const result = await supabaseAuth("/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (isApiError(result) && ![401, 403].includes(result.status)) {
    return NextResponse.json({ error: "Unable to reach the authentication service." }, { status: result.status });
  }

  return NextResponse.json({ signedOut: true });
}
