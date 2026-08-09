import { NextResponse } from "next/server";

export type SupabaseSession = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
};

export type ApiError = {
  error: string;
  status: number;
  code?: string;
};

export function isApiError(value: unknown): value is ApiError {
  return Boolean(
    value &&
      typeof value === "object" &&
      "error" in value &&
      "status" in value &&
      typeof (value as ApiError).error === "string" &&
      typeof (value as ApiError).status === "number"
  );
}

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function normalizeSupabaseUrl(value?: string) {
  if (!value) return "";
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" || parsed.pathname !== "/" || parsed.search || parsed.hash) return "";
    return parsed.origin;
  } catch {
    return "";
  }
}

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);

export function friendlyAuthError(error: string, operation: "login" | "register" | "refresh") {
  const normalized = error.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "Incorrect email or password.";
  if (normalized.includes("email not confirmed")) return "Confirm your email before signing in.";
  if (normalized.includes("user already registered") || normalized.includes("already been registered")) {
    return "An account already exists for this email.";
  }
  if (normalized.includes("password") && normalized.includes("weak")) return "Choose a stronger password and try again.";
  if (normalized.includes("rate") || normalized.includes("too many")) return "Too many attempts. Wait a moment and try again.";
  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "Authentication is temporarily unavailable. Try again shortly.";
  }
  if (operation === "refresh") return "Your session could not be renewed. Sign in again.";
  return operation === "register"
    ? "Unable to create the account. Check the details and try again."
    : "Unable to sign in. Check the details and try again.";
}

export function friendlyDataError(status: number) {
  if (status === 401) return "Your session has expired. Sign in again.";
  if (status === 403) return "You do not have permission to complete this action.";
  if (status === 404) return "The requested information could not be found.";
  if (status === 409) return "This information already exists.";
  return "We could not load your account information. Try again shortly.";
}

function logSupabaseFailure(operation: string, status: number, detail: unknown, code?: unknown) {
  console.error("[supabase] request failed", {
    operation,
    status,
    code: typeof code === "string" ? code : undefined,
    detail: typeof detail === "string" ? detail.slice(0, 500) : "Unknown Supabase error"
  });
}

export function isSupabaseServerConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function missingSupabaseResponse() {
  return NextResponse.json(
    {
      error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      code: "SUPABASE_NOT_CONFIGURED"
    },
    { status: 503 }
  );
}

function authHeaders(token?: string, preferServiceRole = false) {
  const apiKey = preferServiceRole && supabaseServiceKey ? supabaseServiceKey : supabaseAnonKey;
  return {
    apikey: apiKey || "",
    Authorization: `Bearer ${token || apiKey || ""}`,
    "Content-Type": "application/json"
  };
}

function storageHeaders({
  token,
  serviceRole,
  contentType
}: {
  token?: string;
  serviceRole?: boolean;
  contentType?: string;
} = {}) {
  const apiKey = serviceRole && supabaseServiceKey ? supabaseServiceKey : supabaseAnonKey;
  const headers: Record<string, string> = {
    apikey: apiKey || "",
    Authorization: `Bearer ${serviceRole && supabaseServiceKey ? supabaseServiceKey : token || apiKey || ""}`
  };

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  return headers;
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

export async function supabaseAuth(path: string, init: RequestInit = {}) {
  if (!isSupabaseServerConfigured()) {
    return { error: "Supabase is not configured.", status: 503 } as ApiError;
  }

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/auth/v1${path}`, {
      ...init,
      headers: {
        ...authHeaders(),
        ...(init.headers || {})
      },
      cache: "no-store"
    });
  } catch (error) {
    return {
      error: error instanceof Error ? `Supabase Auth network error: ${error.message}` : "Supabase Auth network error.",
      status: 502
    } as ApiError;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { error: data.msg || data.error_description || data.error || "Supabase Auth request failed.", status: response.status } as ApiError;
  }

  return data;
}

export async function verifySupabaseUser(token: string) {
  if (!token) return { error: "Missing access token.", status: 401 } as ApiError;
  const data = await supabaseAuth("/user", {
    method: "GET",
    headers: {
      ...authHeaders(token)
    }
  });

  if ("error" in data) return data;
  return data as SupabaseSession["user"];
}

export async function supabaseRest<T>(path: string, init: RequestInit & { token?: string; serviceRole?: boolean } = {}) {
  if (!isSupabaseServerConfigured()) {
    return { error: "Supabase is not configured.", status: 503 } as ApiError;
  }

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/rest/v1${path}`, {
      ...init,
      headers: {
        ...authHeaders(init.token, init.serviceRole),
        Prefer: "return=representation",
        ...(init.headers || {})
      },
      cache: "no-store"
    });
  } catch (error) {
    return {
      error: error instanceof Error ? `Supabase database network error: ${error.message}` : "Supabase database network error.",
      status: 502
    } as ApiError;
  }

  if (response.status === 204) return null as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    logSupabaseFailure("database", response.status, data?.message, data?.code);
    return {
      error: friendlyDataError(response.status),
      status: response.status,
      code: typeof data?.code === "string" ? data.code : undefined
    } as ApiError;
  }

  return data as T;
}

export async function supabaseStorage(
  path: string,
  init: RequestInit & { token?: string; serviceRole?: boolean; contentType?: string } = {}
) {
  if (!isSupabaseServerConfigured()) {
    return { error: "Supabase is not configured.", status: 503 } as ApiError;
  }

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/storage/v1${path}`, {
      ...init,
      headers: {
        ...storageHeaders({
          token: init.token,
          serviceRole: init.serviceRole,
          contentType: init.contentType
        }),
        ...(init.headers || {})
      },
      cache: "no-store"
    });
  } catch (error) {
    return {
      error: error instanceof Error ? `Supabase Storage network error: ${error.message}` : "Supabase Storage network error.",
      status: 502
    } as ApiError;
  }

  return response;
}

export async function ensureProfile({
  token,
  userId,
  email,
  fullName,
  preferredLanguage,
  accountType,
  primaryRole,
  organizationType,
  onboardingStatus,
  activeWorkspaceType
}: {
  token: string;
  userId: string;
  email?: string;
  fullName?: string;
  preferredLanguage?: string;
  accountType?: string;
  primaryRole?: string | null;
  organizationType?: string | null;
  onboardingStatus?: string;
  activeWorkspaceType?: string;
}) {
  return supabaseRest("/profiles?on_conflict=id", {
    method: "POST",
    token,
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      id: userId,
      email,
      full_name: fullName || null,
      preferred_language: preferredLanguage || "en",
      account_type: accountType || undefined,
      primary_role: primaryRole ?? undefined,
      organization_type: organizationType ?? undefined,
      onboarding_status: onboardingStatus || undefined,
      active_workspace_type: activeWorkspaceType || undefined,
      plan: "starter"
    })
  });
}

export async function saveGeneration({
  token,
  userId,
  projectId,
  tool,
  payload,
  output,
  provider,
  model,
  timestamp,
  usage,
  prompt,
  exports,
  context
}: {
  token: string;
  userId: string;
  projectId?: string;
  tool: string;
  payload: Record<string, string>;
  output: string;
  provider: string;
  model?: string;
  timestamp?: string;
  usage?: Record<string, unknown>;
  prompt?: unknown;
  exports?: unknown;
  context?: unknown;
}) {
  const title =
    payload.topic ||
    payload.productName ||
    payload.fullName ||
    payload.industry ||
    payload.brand ||
    "VORA generation";
  const typeMap: Record<string, string> = {
    document: "document",
    cv: "cv",
    "landing-page": "landing_page",
    "business-idea": "business_idea",
    marketing: "marketing"
  };
  const metadata = {
    conversation_title: title,
    organization_reference:
      context && typeof context === "object" && "references" in context && Array.isArray((context as { references?: unknown }).references)
        ? (context as { references: string[] }).references.find((reference) => reference.startsWith("organization:")) || null
        : null,
    project_reference: projectId || null,
    prompt_type:
      prompt && typeof prompt === "object" && "input" in prompt && typeof (prompt as { input?: unknown }).input === "string"
        ? ((prompt as { input: string }).input.match(/Prompt type: ([^\n]+)/)?.[1] || null)
        : null,
    saved: true,
    favorite: false,
    timestamp: timestamp || new Date().toISOString(),
    tool,
    provider,
    model: model || null,
    generated_at: timestamp || new Date().toISOString(),
    prompt,
    context,
    exports,
    usage: usage
      ? {
          input_tokens: typeof usage.input_tokens === "number" ? usage.input_tokens : null,
          output_tokens: typeof usage.output_tokens === "number" ? usage.output_tokens : null,
          total_tokens: typeof usage.total_tokens === "number" ? usage.total_tokens : null
        }
      : null
  };

  const project = projectId
    ? await supabaseRest<Array<{ id: string }>>(`/projects?id=eq.${encodeURIComponent(projectId)}&owner_id=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          status: "saved",
          metadata,
          updated_at: new Date().toISOString()
        })
      })
    : await supabaseRest<Array<{ id: string }>>("/projects", {
        method: "POST",
        token,
        body: JSON.stringify({
          owner_id: userId,
          title,
          type: typeMap[tool] || "document",
          status: "saved",
          metadata
        })
      });

  if (isApiError(project)) return project;
  const savedProjectId = Array.isArray(project) ? project[0]?.id : null;
  const generationInput = {
    ...payload,
    _vora: {
      prompt,
      context,
      exports,
      model: model || null,
      provider,
      timestamp: timestamp || new Date().toISOString()
    }
  };

  const history = await supabaseRest("/generation_history", {
    method: "POST",
    token,
    body: JSON.stringify({
      owner_id: userId,
      project_id: savedProjectId,
      tool_slug: tool,
      provider,
      input_payload: generationInput,
      output_content: output
    })
  });

  const languageValue = (payload.language || "").toLowerCase();
  const language = languageValue.includes("english") ? "en" : languageValue.includes("fran") ? "fr" : "ar";
  const document = await supabaseRest("/documents", {
    method: "POST",
    token,
    body: JSON.stringify({
      owner_id: userId,
      project_id: savedProjectId,
      title,
      document_type: tool,
      language,
      content: output
    })
  });

  return { project, history, document };
}
