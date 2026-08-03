# VORQA Operations Runbook

## Daily Beta Checks

Run every business day during private beta:

- Confirm `/api/health` returns `status: ok`.
- Review Supabase auth activity.
- Review Supabase database and Storage errors.
- Review OpenAI usage and errors.
- Review application logs for `[VORQA ERROR]`, `[VORQA WARN]`, and OpenAI provider errors.
- Review new registrations and organization creation.
- Review failed uploads.
- Review RFQ, quotation, contract, billing, and admin pages for route health.

## Incident Levels

Critical:

- Login/register unavailable.
- Private data exposure.
- Supabase RLS failure.
- File download exposes another user or organization file.
- Build deployment fails globally.

High:

- OpenAI generation unavailable without mock fallback.
- Project, document, or knowledge workspace unavailable.
- Marketplace or billing pages crash.
- Admin pages expose incorrect production data.

Medium:

- Slow dashboard or project workspace.
- Missing non-critical demo fallback.
- Broken placeholder action.

Low:

- Copy issue.
- Minor layout overflow.
- Non-blocking visual inconsistency.

## Response Process

1. Confirm scope: affected route, user, organization, and timestamp.
2. Check `/api/health`.
3. Check deployment status.
4. Check Supabase status and logs.
5. Check OpenAI status and usage.
6. Reproduce in a private browser session.
7. Decide: fix-forward, temporary fallback, or rollback.
8. Record incident notes and follow-up action.

## Monitoring Hooks

Current hooks:

- structured logger in `lib/security/logger.ts`
- audit-event helper for protected API activity
- `/api/health` endpoint
- monitoring environment variables in `.env.example`

Future hooks:

- Sentry client/server SDK
- OpenTelemetry tracing
- product analytics events
- persistent audit-log sink
- usage-based billing events

## Beta Support Playbook

Common user issue: cannot log in.

- Confirm email confirmation setting.
- Confirm production redirect URL.
- Confirm Supabase auth logs.
- Ask user to retry password reset only after verifying account status.

Common user issue: AI generation fails.

- Confirm `OPENAI_API_KEY`.
- Confirm OpenAI account credits and model access.
- Confirm `/api/generate` returns a friendly error.
- Confirm mock fallback works if key is intentionally absent.

Common user issue: upload fails.

- Confirm bucket exists.
- Confirm bucket policy.
- Confirm file type and file size.
- Confirm project ownership and bearer token.

Common user issue: dashboard data looks like demo.

- Confirm `NEXT_PUBLIC_DATA_SOURCE`.
- Confirm repository adapter support for the module.
- Confirm Supabase table/view exists.
- Confirm RLS allows the signed-in user to read the records.

## Rollback Runbook

1. Identify last stable deployment.
2. Roll back application deployment first.
3. Do not roll back database migrations without a specific migration plan.
4. Keep Supabase Storage unchanged unless data corruption is confirmed.
5. If an integration is unstable, use `NEXT_PUBLIC_DATA_SOURCE=auto` or module-level fallback where available.
6. Notify beta users only with the affected scope and expected restoration window.

## Pre-Launch Sign-Off

Required sign-offs:

- Product owner
- Engineering owner
- Security/RLS reviewer
- Supabase operator
- AI/OpenAI operator
- Support owner

Launch is approved only when all critical blockers in `PRIVATE_BETA_LAUNCH.md` are cleared or explicitly accepted.
