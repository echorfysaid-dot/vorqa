import type { Document, DocumentUploadInput, ProjectDocumentInput } from "@/lib/models";
import { getValidSession } from "@/lib/auth-client";
import { isSupabaseConfigured } from "@/lib/supabase";
import { departmentSupabaseAdapter } from "./departmentSupabaseAdapter";
import { organizationSupabaseAdapter } from "./organizationSupabaseAdapter";
import { isUuid, organizationRest } from "./organizationSupabaseRest";
import { projectSupabaseAdapter } from "./projectSupabaseAdapter";
import {
  cleanDocumentFileName,
  encodeStoragePath,
  mapDocumentInputToSupabase,
  mapSupabaseDocumentToDomain,
  projectDocumentsBucket,
  uploadInputToDocumentInput,
  type SupabaseDocumentRecord
} from "./documentMapper";

function storageUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "").replace(/\/(?:rest|auth)\/v1$/i, "");
  return `${base}/storage/v1${path}`;
}

async function storageFetch(path: string, init: RequestInit = {}) {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured.", status: 503 } as const;
  const session = await getValidSession();
  if (!session?.access_token) return { error: "Authentication is required to access project documents.", status: 401 } as const;
  return fetch(storageUrl(path), {
    ...init,
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      Authorization: `Bearer ${session.access_token}`,
      ...(init.headers || {})
    }
  });
}

async function resolveOrganizationId(organizationId?: string) {
  if (!organizationId) return undefined;
  if (isUuid(organizationId)) return organizationId;
  const organization = await organizationSupabaseAdapter.getOrganization(organizationId);
  return organization.data?.id;
}

async function validateDocumentScope(input: Partial<ProjectDocumentInput>) {
  const project = input.projectId ? await projectSupabaseAdapter.getProject(input.projectId) : undefined;
  if (input.projectId && !project?.data) return { error: "Project not found." };
  const organizationId = await resolveOrganizationId(input.organizationId || project?.data?.organizationId);
  if (input.organizationId && !organizationId) return { error: "Organization not found." };
  if (project?.data?.organizationId && organizationId && isUuid(project.data.organizationId) && project.data.organizationId !== organizationId) {
    return { error: "Project does not belong to this organization." };
  }
  if (input.departmentId && organizationId) {
    const department = await departmentSupabaseAdapter.getDepartmentById(organizationId, input.departmentId);
    if (!department.data) return { error: "Department does not belong to this organization." };
  }
  return { organizationId };
}

const documentSelect = "*,departments(id,name),uploader:profiles!documents_uploader_id_fkey(id,email,full_name,avatar_url)";

export const documentSupabaseAdapter = {
  async getDocuments(projectId: string) {
    const result = await organizationRest<SupabaseDocumentRecord[]>(
      `/documents?project_id=eq.${encodeURIComponent(projectId)}&archived=eq.false&select=${encodeURIComponent(documentSelect)}&order=updated_at.desc`
    );
    if (result.error) return { data: [] as Document[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseDocumentToDomain), source: "supabase" as const, isFallback: false };
  },

  async getDocument(documentId: string) {
    const result = await organizationRest<SupabaseDocumentRecord[]>(
      `/documents?id=eq.${encodeURIComponent(documentId)}&select=${encodeURIComponent(documentSelect)}&limit=1`
    );
    if (result.error) return { data: undefined as Document | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseDocumentToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async uploadDocument(input: DocumentUploadInput) {
    const session = await getValidSession();
    if (!session?.user?.id || !session.access_token) return { data: undefined as Document | undefined, source: "supabase" as const, isFallback: false, error: "Authentication is required to upload documents." };
    const scope = await validateDocumentScope(input);
    if (scope.error) return { data: undefined as Document | undefined, source: "supabase" as const, isFallback: false, error: scope.error };

    const filename = cleanDocumentFileName(input.file.name);
    const objectId = crypto.randomUUID();
    const organizationSegment = scope.organizationId || "personal";
    const storagePath = `${organizationSegment}/${input.projectId}/${objectId}-${filename}`;
    const upload = await storageFetch(`/object/${projectDocumentsBucket}/${encodeStoragePath(storagePath)}`, {
      method: "POST",
      headers: {
        "Content-Type": input.file.type || "application/octet-stream",
        "x-upsert": "false",
        "cache-control": "3600"
      },
      body: input.file
    });

    if ("error" in upload) return { data: undefined as Document | undefined, source: "supabase" as const, isFallback: false, error: upload.error };
    if (!upload.ok) {
      const body = await upload.text().catch(() => "");
      return { data: undefined as Document | undefined, source: "supabase" as const, isFallback: false, error: body || "Document upload failed. Confirm the vorqa-project-documents bucket exists and has policies configured." };
    }

    const documentInput = uploadInputToDocumentInput({ ...input, organizationId: scope.organizationId }, storagePath);
    const result = await organizationRest<SupabaseDocumentRecord[]>("/documents", {
      method: "POST",
      body: JSON.stringify(mapDocumentInputToSupabase({ ...documentInput, uploaderId: session.user.id }, session.user.id))
    });
    if (result.error) {
      await storageFetch(`/object/${projectDocumentsBucket}/${encodeStoragePath(storagePath)}`, { method: "DELETE" });
      return { data: undefined as Document | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    }
    const record = result.data?.[0];
    return { data: record ? mapSupabaseDocumentToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateDocument(documentId: string, input: Partial<ProjectDocumentInput>) {
    const scope = input.projectId || input.organizationId || input.departmentId ? await validateDocumentScope(input) : {};
    if ("error" in scope && typeof scope.error === "string") return { data: undefined as Document | undefined, source: "supabase" as const, isFallback: false, error: scope.error };
    const organizationId = "organizationId" in scope && typeof scope.organizationId === "string" ? scope.organizationId : input.organizationId;
    const result = await organizationRest<SupabaseDocumentRecord[]>(`/documents?id=eq.${encodeURIComponent(documentId)}`, {
      method: "PATCH",
      body: JSON.stringify(mapDocumentInputToSupabase({ ...input, organizationId }))
    });
    if (result.error) return { data: undefined as Document | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseDocumentToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async archiveDocument(documentId: string) {
    const result = await this.updateDocument(documentId, { archived: true });
    return { data: Boolean(result.data), source: "supabase" as const, isFallback: false, error: result.error };
  },

  async deleteDocument(documentId: string) {
    const document = await this.getDocument(documentId);
    if (!document.data) return { data: false, source: "supabase" as const, isFallback: false, error: document.error || "Document not found." };
    if (document.data.storagePath) {
      const removed = await storageFetch(`/object/${projectDocumentsBucket}/${encodeStoragePath(document.data.storagePath)}`, { method: "DELETE" });
      if (!("error" in removed) && !removed.ok && removed.status !== 404) {
        return { data: false, source: "supabase" as const, isFallback: false, error: await removed.text().catch(() => "Failed to delete document file.") };
      }
      if ("error" in removed) return { data: false, source: "supabase" as const, isFallback: false, error: removed.error };
    }
    const result = await organizationRest<SupabaseDocumentRecord[]>(`/documents?id=eq.${encodeURIComponent(documentId)}`, { method: "DELETE" });
    if (result.error) return { data: false, source: "supabase" as const, isFallback: false, error: result.error };
    return { data: true, source: "supabase" as const, isFallback: false };
  },

  async downloadDocument(document: Document) {
    if (!document.storagePath) return { data: new Blob([document.content || ""], { type: "text/plain;charset=utf-8" }), source: "supabase" as const, isFallback: false };
    const object = await storageFetch(`/object/${projectDocumentsBucket}/${encodeStoragePath(document.storagePath)}`, { method: "GET" });
    if ("error" in object) return { data: undefined as Blob | undefined, source: "supabase" as const, isFallback: false, error: object.error };
    if (!object.ok) return { data: undefined as Blob | undefined, source: "supabase" as const, isFallback: false, error: await object.text().catch(() => "Document download failed.") };
    return { data: await object.blob(), source: "supabase" as const, isFallback: false };
  }
};
