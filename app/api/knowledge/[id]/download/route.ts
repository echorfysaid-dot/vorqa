import { NextResponse } from "next/server";
import {
  getBearerToken,
  isApiError,
  isSupabaseServerConfigured,
  missingSupabaseResponse,
  supabaseRest,
  supabaseStorage,
  verifySupabaseUser
} from "@/lib/supabase-server";
import type { KnowledgeFile } from "@/lib/supabase";
import { validateEntityId } from "@/lib/security";

export const runtime = "nodejs";

function encodeFilterValue(value: string) {
  return encodeURIComponent(value);
}

function encodeStoragePath(path: string) {
  return path.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function attachmentName(name: string) {
  return encodeURIComponent(name).replace(/['()]/g, escape).replace(/\*/g, "%2A");
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();

  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);
  if ("error" in user) return NextResponse.json({ error: user.error }, { status: user.status });
  const fileId = validateEntityId(params.id, "file_id");
  if (!fileId.ok) return NextResponse.json({ error: fileId.error, code: fileId.code }, { status: fileId.status });

  const data = await supabaseRest<KnowledgeFile[]>(
    `/knowledge_files?id=eq.${encodeFilterValue(fileId.value)}&owner_id=eq.${encodeFilterValue(user.id)}&limit=1`,
    { token }
  );

  if (isApiError(data)) return NextResponse.json({ error: data.error }, { status: data.status });
  const file = Array.isArray(data) ? data[0] : null;
  if (!file) return NextResponse.json({ error: "لا يمكن العثور على الملف أو لا تملك صلاحية الوصول إليه." }, { status: 404 });

  const object = await supabaseStorage(`/object/knowledge/${encodeStoragePath(file.storage_path)}`, {
    method: "GET",
    token,
    serviceRole: true
  });

  if (isApiError(object)) return NextResponse.json({ error: object.error }, { status: object.status });
  if (!object.ok || !object.body) {
    const body = await object.text().catch(() => "");
    return NextResponse.json({ error: body || "تعذر تحميل الملف." }, { status: object.status });
  }

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": file.mime_type,
      "Content-Length": String(file.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${attachmentName(file.original_name)}`
    }
  });
}
