import type { Document, DocumentUploadInput, ProjectDocumentInput } from "@/lib/models";
import type { Department as SupabaseDepartment, Document as SupabaseDocument, Profile } from "@/lib/supabase";

export type SupabaseDocumentRecord = SupabaseDocument & {
  departments?: Pick<SupabaseDepartment, "id" | "name"> | null;
  uploader?: Pick<Profile, "id" | "email" | "full_name" | "avatar_url"> | null;
};

export const documentCategories = [
  "Architectural Drawings",
  "Structural Drawings",
  "BOQ",
  "Specifications",
  "Contracts",
  "Permits",
  "Inspection Reports",
  "Invoices",
  "Safety Documents",
  "QA Reports",
  "Other"
] as const;

export const projectDocumentsBucket = "vorqa-project-documents";

export function cleanDocumentFileName(name: string) {
  const cleaned = name
    .replace(/[\\/:*?"<>|#%{}^~[\]`]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
  return cleaned || "project-document";
}

export function encodeStoragePath(path: string) {
  return path.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

export function mapSupabaseDocumentToDomain(record: SupabaseDocumentRecord): Document {
  return {
    id: record.id,
    ownerId: record.owner_id,
    projectId: record.project_id || undefined,
    organizationId: record.organization_id || undefined,
    departmentId: record.department_id || undefined,
    departmentName: record.departments?.name,
    uploaderId: record.uploader_id || undefined,
    uploaderName: record.uploader?.full_name || record.uploader?.email,
    title: record.title,
    type: record.document_type,
    status: record.archived ? "Archived" : record.storage_path ? "Saved" : "Generated",
    content: record.content || undefined,
    category: record.category || undefined,
    version: record.version || undefined,
    filename: record.filename || undefined,
    storagePath: record.storage_path || undefined,
    fileSize: record.file_size ?? undefined,
    mimeType: record.mime_type || undefined,
    tags: record.tags || [],
    archived: Boolean(record.archived),
    metadata: record.metadata || {},
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function mapDocumentInputToSupabase(input: Partial<ProjectDocumentInput>, ownerId?: string) {
  return {
    ...(ownerId !== undefined ? { owner_id: ownerId } : {}),
    ...(input.projectId !== undefined ? { project_id: input.projectId || null } : {}),
    ...(input.organizationId !== undefined ? { organization_id: input.organizationId || null } : {}),
    ...(input.departmentId !== undefined ? { department_id: input.departmentId || null } : {}),
    ...(input.uploaderId !== undefined ? { uploader_id: input.uploaderId || null } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.type !== undefined ? { document_type: input.type || "document" } : {}),
    ...(input.content !== undefined ? { content: input.content || "" } : {}),
    ...(input.category !== undefined ? { category: input.category || null } : {}),
    ...(input.version !== undefined ? { version: input.version || "v1" } : {}),
    ...(input.filename !== undefined ? { filename: input.filename || null } : {}),
    ...(input.storagePath !== undefined ? { storage_path: input.storagePath || null } : {}),
    ...(input.fileSize !== undefined ? { file_size: input.fileSize ?? null } : {}),
    ...(input.mimeType !== undefined ? { mime_type: input.mimeType || null } : {}),
    ...(input.tags !== undefined ? { tags: input.tags || [] } : {}),
    ...(input.archived !== undefined ? { archived: input.archived } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata || {} } : {})
  };
}

export function uploadInputToDocumentInput(input: DocumentUploadInput, storagePath: string): ProjectDocumentInput {
  return {
    projectId: input.projectId,
    organizationId: input.organizationId,
    departmentId: input.departmentId,
    title: cleanDocumentFileName(input.file.name).replace(/\.[^.]+$/, ""),
    type: "project_file",
    content: "",
    category: input.category || "Other",
    version: input.version || "v1",
    filename: cleanDocumentFileName(input.file.name),
    storagePath,
    fileSize: input.file.size,
    mimeType: input.file.type || "application/octet-stream",
    tags: input.tags || [],
    metadata: {
      uploaded_via: "project_documents",
      original_name: input.file.name
    }
  };
}
