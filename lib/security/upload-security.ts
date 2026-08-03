import { getFileExtension, normalizeFilename } from "./validation";

export const uploadSecurityPolicy = {
  maxKnowledgeFileSize: 50 * 1024 * 1024,
  allowedExtensions: new Set(["pdf", "docx", "txt", "md", "markdown", "csv", "xlsx", "pptx", "png", "jpg", "jpeg", "webp"]),
  allowedMimeTypes: new Set([
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
  ])
};

export function fallbackMimeType(extension: string) {
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

export function validateUploadFile(file: File) {
  const originalName = normalizeFilename(file.name);
  const extension = getFileExtension(originalName);
  const reportedMimeType = file.type || "";
  const mimeType = reportedMimeType || fallbackMimeType(extension);
  const hasGenericMimeType = !reportedMimeType || reportedMimeType === "application/octet-stream";

  if (!uploadSecurityPolicy.allowedExtensions.has(extension) || (!uploadSecurityPolicy.allowedMimeTypes.has(mimeType) && !hasGenericMimeType)) {
    return { ok: false as const, error: "Unsupported file type.", status: 400, code: "UNSUPPORTED_FILE_TYPE" };
  }

  if (file.size <= 0 || file.size > uploadSecurityPolicy.maxKnowledgeFileSize) {
    return { ok: false as const, error: "File size must be under 50MB.", status: 400, code: "FILE_SIZE_INVALID" };
  }

  return {
    ok: true as const,
    originalName,
    extension,
    mimeType,
    virusScan: {
      status: "pending_integration",
      provider: null
    }
  };
}
