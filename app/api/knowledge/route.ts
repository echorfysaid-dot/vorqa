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
import { checkRateLimitAsync, rateLimitResponse, validateEntityId, validateSearch, validateUploadFile } from "@/lib/security";

export const runtime = "nodejs";

const maxFileSize = 50 * 1024 * 1024;
const allowedExtensions = new Set(["pdf", "docx", "txt", "md", "markdown", "csv", "xlsx", "pptx", "png", "jpg", "jpeg", "webp"]);
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp"
]);

function encodeFilterValue(value: string) {
  return encodeURIComponent(value);
}

function encodeStoragePath(path: string) {
  return path.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function cleanFileName(name: string) {
  const fallback = "knowledge-file";
  const cleaned = name
    .replace(/[\\/:*?"<>|#%{}^~[\]`]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
  return cleaned || fallback;
}

function getExtension(name: string) {
  const match = /\.([^.]+)$/.exec(name.toLowerCase());
  return match?.[1] || "";
}

function fallbackMimeType(extension: string) {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    md: "text/markdown",
    markdown: "text/markdown",
    csv: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp"
  };

  return mimeTypes[extension] || "application/octet-stream";
}

async function verifyProject(token: string, ownerId: string, projectId: string) {
  const project = await supabaseRest<Array<{ id: string }>>(
    `/projects?id=eq.${encodeFilterValue(projectId)}&owner_id=eq.${encodeFilterValue(ownerId)}&select=id&limit=1`,
    { token }
  );

  if (isApiError(project)) return project;
  if (!Array.isArray(project) || !project[0]) {
    return { error: "لا يمكن العثور على المشروع أو لا تملك صلاحية الوصول إليه.", status: 404 };
  }

  return project[0];
}

export async function GET(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();

  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);
  if ("error" in user) return NextResponse.json({ error: user.error }, { status: user.status });

  const url = new URL(request.url);
  const projectParam = url.searchParams.get("project_id");
  const projectValidation = projectParam ? validateEntityId(projectParam, "project_id") : { ok: true as const, value: "" };
  if (!projectValidation.ok) return NextResponse.json({ error: projectValidation.error, code: projectValidation.code }, { status: projectValidation.status });
  const searchValidation = validateSearch(url.searchParams.get("search") || "");
  if (!searchValidation.ok) return NextResponse.json({ error: searchValidation.error, code: searchValidation.code }, { status: searchValidation.status });
  const projectId = projectValidation.value;
  const search = searchValidation.value;

  let query = `/knowledge_files?owner_id=eq.${encodeFilterValue(user.id)}&order=created_at.desc`;
  if (projectId) {
    query += `&project_id=eq.${encodeFilterValue(projectId)}`;
  }
  if (search) {
    query += `&original_name=ilike.*${encodeFilterValue(search)}*`;
  }

  const data = await supabaseRest<KnowledgeFile[]>(query, { token });
  if (isApiError(data)) return NextResponse.json({ error: data.error }, { status: data.status });

  return NextResponse.json({ files: data || [] });
}

export async function POST(request: Request) {
  if (!isSupabaseServerConfigured()) return missingSupabaseResponse();

  const limit = await checkRateLimitAsync(request, "upload");
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const token = getBearerToken(request);
  const user = await verifySupabaseUser(token);
  if ("error" in user) return NextResponse.json({ error: user.error }, { status: user.status });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const projectId = String(formData?.get("project_id") || "");

  if (!projectId) {
    return NextResponse.json({ error: "يرجى اختيار مشروع قبل رفع الملف." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "يرجى اختيار ملف صالح." }, { status: 400 });
  }

  const projectValidation = validateEntityId(projectId, "project_id");
  if (!projectValidation.ok) return NextResponse.json({ error: projectValidation.error, code: projectValidation.code }, { status: projectValidation.status });
  const fileValidation = validateUploadFile(file);
  if (!fileValidation.ok) return NextResponse.json({ error: fileValidation.error, code: fileValidation.code }, { status: fileValidation.status });

  const originalName = cleanFileName(file.name);
  const extension = getExtension(originalName);
  const reportedMimeType = file.type || "";
  const mimeType = reportedMimeType || fallbackMimeType(extension);
  const hasGenericMimeType = !reportedMimeType || reportedMimeType === "application/octet-stream";

  if (!allowedExtensions.has(extension) || (!allowedMimeTypes.has(mimeType) && !hasGenericMimeType)) {
    return NextResponse.json({ error: "نوع الملف غير مدعوم في مساحة المعرفة." }, { status: 400 });
  }

  if (file.size <= 0 || file.size > maxFileSize) {
    return NextResponse.json({ error: "حجم الملف يجب أن يكون أقل من 50MB." }, { status: 400 });
  }

  const project = await verifyProject(token, user.id, projectValidation.value);
  if ("error" in project) return NextResponse.json({ error: project.error }, { status: project.status });

  const objectId = crypto.randomUUID();
  const storagePath = `${user.id}/${projectValidation.value}/${objectId}-${originalName}`;
  const arrayBuffer = await file.arrayBuffer();
  const upload = await supabaseStorage(`/object/knowledge/${encodeStoragePath(storagePath)}`, {
    method: "POST",
    token,
    serviceRole: true,
    contentType: mimeType,
    headers: {
      "x-upsert": "false",
      "cache-control": "3600"
    },
    body: arrayBuffer
  });

  if (isApiError(upload)) return NextResponse.json({ error: upload.error }, { status: upload.status });
  if (!upload.ok) {
    const body = await upload.text().catch(() => "");
    return NextResponse.json({ error: body || "تعذر رفع الملف إلى مساحة التخزين." }, { status: upload.status });
  }

  const inserted = await supabaseRest<KnowledgeFile[]>("/knowledge_files", {
    method: "POST",
    token,
    body: JSON.stringify({
      owner_id: user.id,
      project_id: projectValidation.value,
      storage_path: storagePath,
      original_name: originalName,
      mime_type: mimeType,
      size: file.size,
      status: "uploaded"
    })
  });

  if (isApiError(inserted)) {
    await supabaseStorage(`/object/knowledge/${encodeStoragePath(storagePath)}`, {
      method: "DELETE",
      token,
      serviceRole: true
    });
    return NextResponse.json({ error: inserted.error }, { status: inserted.status });
  }

  return NextResponse.json({ file: Array.isArray(inserted) ? inserted[0] : inserted });
}
