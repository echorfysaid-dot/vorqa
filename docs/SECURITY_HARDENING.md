# Enterprise Security Hardening

Sprint 18.8 hardens the current VORQA platform without changing business features or repository architecture.

## Threat Model

Primary risks covered in this sprint:

- malformed API requests
- brute-force authentication attempts
- oversized JSON and AI payloads
- prompt injection against VORA
- accidental logging of tokens or secrets
- unsafe file uploads
- browser embedding and content-type attacks
- overexposed database error details

Out of scope for this sprint:

- realtime security
- external WAF
- managed virus scanning
- production SIEM export
- billing fraud controls
- full RBAC enforcement beyond existing RLS/repository foundations

## Implemented Protections

### Central Validation

Added `lib/security/validation.ts` for:

- UUID validation
- safe entity IDs
- email validation
- URL validation
- phone validation
- pagination normalization
- search query limits
- JSON body size limits
- text sanitization
- filename normalization

### API Protection

Applied validation to sensitive routes:

- auth login
- auth register
- auth refresh
- VORA generation
- projects creation
- favorites creation
- settings updates
- knowledge list/upload/delete/download

API responses now reject malformed requests before they reach Supabase where practical.

### Rate Limiting

Added `lib/security/rate-limit.ts` with in-memory policy buckets:

- authentication
- AI generation
- uploads
- search
- default API traffic

Current limits are development-safe and production-ready in shape. For distributed production deployments, replace the in-memory store with Redis, Upstash, Supabase Edge KV, or platform-native rate limiting.

### AI Security

Added `lib/security/ai-safety.ts` for:

- prompt injection pattern detection
- secret redaction
- field and context size limits
- safe system guard instructions
- token budget configuration

VORA now treats user input and project memory as untrusted content and is instructed not to reveal prompts, secrets, provider details, or internal configuration.

OpenAI request logging no longer prints full prompts or context payloads. Logs include only model, endpoint, transport, and prompt length metadata.

### Upload Security

Added `lib/security/upload-security.ts` for:

- allowed MIME types
- allowed extensions
- maximum knowledge file size
- filename normalization
- future virus-scanning hook metadata

The existing Supabase Storage workflow remains unchanged.

### Browser Headers

Added production security headers in `next.config.mjs`:

- `Content-Security-Policy-Report-Only`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`

CSP is report-only for now to avoid breaking current styles, images, and Next.js runtime chunks before a full CSP tuning pass.

### Structured Logging

Added `lib/security/logger.ts`:

- structured JSON log lines
- audit event helper
- automatic redaction for tokens, API keys, passwords, service-role keys, and secrets

Prepared audit events:

- login success/failure
- registration success/failure
- session refresh
- project creation
- favorites creation
- settings updates
- AI generation start/completion/failure

## Secrets Review

Server-only secrets remain server-side:

- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Client-exposed variables remain limited to the existing public Supabase URL/anon key and data-source selection. Logging redacts sensitive key names recursively.

## Remaining Production Risks

Critical:

- Replace in-memory rate limits with a shared production store.
- Add managed virus scanning before making file uploads broadly available.

High:

- Move CSP from report-only to enforcing after testing all assets and scripts.
- Add server-side audit log persistence.
- Add per-user and per-organization AI spending limits.

Medium:

- Add schema-backed API request validation for every future Marketplace/RFQ/Contract mutation.
- Add event-level authorization checks for future notification producers.
- Add replay protection for sensitive mutation endpoints.

Low:

- Add security dashboard metrics.
- Add automated dependency vulnerability scanning.
- Add log sampling controls for noisy events.

## Production Checklist

- Apply finalized RLS migrations in Supabase.
- Confirm Storage buckets disallow public writes.
- Configure CDN/WAF rate limits.
- Configure CSP report endpoint.
- Enforce HTTPS and secure cookies in deployment.
- Configure SIEM or audit log sink.
- Add OpenAI usage monitoring and abuse alerts.
- Add file scanning provider.
- Run penetration testing before private beta.
