export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string; status: number; code: string };

const controlCharacters = /[\u0000-\u001F\u007F]/g;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const safeIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,95}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d\s.-]{6,32}$/;

export function sanitizeText(value: unknown, maxLength = 2000) {
  if (typeof value !== "string") return "";
  return value.replace(controlCharacters, "").trim().slice(0, maxLength);
}

export function validateRequiredText(value: unknown, field: string, maxLength = 2000): ValidationResult<string> {
  const text = sanitizeText(value, maxLength);
  if (!text) return { ok: false, error: `${field} is required.`, status: 400, code: "REQUIRED_FIELD" };
  if (typeof value === "string" && value.replace(controlCharacters, "").trim().length > maxLength) {
    return { ok: false, error: `${field} is too long.`, status: 413, code: "FIELD_TOO_LONG" };
  }
  return { ok: true, value: text };
}

export function validateEmail(value: unknown, required = true): ValidationResult<string> {
  const email = sanitizeText(value, 254).toLowerCase();
  if (!email && !required) return { ok: true, value: "" };
  if (!email || !emailPattern.test(email)) return { ok: false, error: "A valid email is required.", status: 400, code: "INVALID_EMAIL" };
  return { ok: true, value: email };
}

export function validatePassword(value: unknown): ValidationResult<string> {
  if (typeof value !== "string") return { ok: false, error: "Password is required.", status: 400, code: "INVALID_PASSWORD" };
  if (value.length < 8) return { ok: false, error: "Password must contain at least 8 characters.", status: 400, code: "WEAK_PASSWORD" };
  if (value.length > 256) return { ok: false, error: "Password is too long.", status: 413, code: "PASSWORD_TOO_LONG" };
  return { ok: true, value };
}

export function validateUuid(value: unknown, field = "id"): ValidationResult<string> {
  const text = sanitizeText(value, 96);
  if (!uuidPattern.test(text)) return { ok: false, error: `${field} must be a valid UUID.`, status: 400, code: "INVALID_UUID" };
  return { ok: true, value: text };
}

export function validateEntityId(value: unknown, field = "id"): ValidationResult<string> {
  const text = sanitizeText(value, 96);
  if (!safeIdPattern.test(text) && !uuidPattern.test(text)) return { ok: false, error: `${field} is invalid.`, status: 400, code: "INVALID_ID" };
  return { ok: true, value: text };
}

export function validateUrl(value: unknown, required = false): ValidationResult<string> {
  const text = sanitizeText(value, 2048);
  if (!text && !required) return { ok: true, value: "" };
  try {
    const url = new URL(text);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid protocol");
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, error: "URL is invalid.", status: 400, code: "INVALID_URL" };
  }
}

export function validatePhone(value: unknown, required = false): ValidationResult<string> {
  const text = sanitizeText(value, 32);
  if (!text && !required) return { ok: true, value: "" };
  if (!phonePattern.test(text)) return { ok: false, error: "Phone number is invalid.", status: 400, code: "INVALID_PHONE" };
  return { ok: true, value: text };
}

export function validateSearch(value: unknown, maxLength = 120): ValidationResult<string> {
  const text = sanitizeText(value, maxLength);
  if (typeof value === "string" && value.trim().length > maxLength) return { ok: false, error: "Search query is too long.", status: 413, code: "SEARCH_TOO_LONG" };
  return { ok: true, value: text };
}

export function validatePagination(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || searchParams.get("limit") || 25);
  return {
    page: Number.isFinite(page) ? Math.min(500, Math.max(1, Math.floor(page))) : 1,
    pageSize: Number.isFinite(pageSize) ? Math.min(100, Math.max(1, Math.floor(pageSize))) : 25
  };
}

export async function parseJsonObject(request: Request, maxBytes = 64 * 1024): Promise<ValidationResult<Record<string, unknown>>> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes) return { ok: false, error: "Request body is too large.", status: 413, code: "BODY_TOO_LARGE" };
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "Invalid JSON body.", status: 400, code: "INVALID_JSON" };
  return { ok: true, value: body as Record<string, unknown> };
}

export function normalizeFilename(name: string) {
  return sanitizeText(name, 180)
    .replace(/[\\/:*?"<>|#%{}^~[\]`]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140) || "vorqa-file";
}

export function getFileExtension(name: string) {
  return /\.([^.]+)$/.exec(name.toLowerCase())?.[1] || "";
}
