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

async function getOwnedFile(token: string, ownerId: string, fileId: string) {
  const data = await supabaseRest<KnowledgeFile[]>(
    `/knowledge_files?id=eq.${encodeFilterValue(fileId)}&owner_id=eq.${encodeFilterValue(ownerId)}&limit=1`,
    { token }
  );

  if (isApiError(data)) return data;
  const file = Array.isArray(data) ? data[0] : null;
  if (!file) return { error: "لا يمكن العثور على الملف أو لا تملك صلاحية الوصول إليه.", status: 404 };
  return file;
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();

  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);
  if ("error" in user) return NextResponse.json({ error: user.error }, { status: user.status });
  const fileId = validateEntityId(params.id, "file_id");
  if (!fileId.ok) return NextResponse.json({ error: fileId.error, code: fileId.code }, { status: fileId.status });

  const file = await getOwnedFile(token, user.id, fileId.value);
  if ("error" in file) return NextResponse.json({ error: file.error }, { status: file.status });

  const removedObject = await supabaseStorage(`/object/knowledge/${encodeStoragePath(file.storage_path)}`, {
    method: "DELETE",
    token,
    serviceRole: true
  });

  if (isApiError(removedObject)) return NextResponse.json({ error: removedObject.error }, { status: removedObject.status });
  if (!removedObject.ok && removedObject.status !== 404) {
    const body = await removedObject.text().catch(() => "");
    return NextResponse.json({ error: body || "تعذر حذف الملف من مساحة التخزين." }, { status: removedObject.status });
  }

  const deleted = await supabaseRest(`/knowledge_files?id=eq.${encodeFilterValue(file.id)}&owner_id=eq.${encodeFilterValue(user.id)}`, {
    method: "DELETE",
    token
  });

  if (isApiError(deleted)) return NextResponse.json({ error: deleted.error }, { status: deleted.status });
  return NextResponse.json({ ok: true });
}
