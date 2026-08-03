# Vorqa AI RC1.1 Blocker Resolution

## Resolved Blockers

### Timeline Migration

`database/migrations/20260718_timeline_foundation.sql` was empty in RC1. It is required because timeline repositories expect:

- `public.milestones`
- `public.task_dependencies`

Resolution:

- Added idempotent schema for milestones and task dependencies.
- Added indexes.
- Added foreign keys to projects, organizations, and tasks.
- Added status/progress/dependency constraints.
- Added RLS policies.
- Added validation triggers for milestone project scope and task dependency scope.
- Preserved repository and UI behavior.

### Migration Execution Plan

Created:

- `docs/MIGRATION_EXECUTION_PLAN.md`

Includes execution order, dependencies, overlap notes, rollback notes, and verification queries.

### Supabase Verification Scripts

Created:

- `database/verification/rc1_1_schema_verification.sql`
- `database/verification/rc1_1_policy_verification.sql`
- `database/verification/rc1_1_access_test_template.sql`

### Storage Buckets

Created:

- `database/storage/knowledge_bucket.sql`
- `database/storage/project_documents_bucket.sql`

These scripts create private buckets and policies aligned with current upload paths.

### OpenAI Production Validation

Prepared through:

- `/api/health` safe configuration status
- `lib/production-env.ts` environment validation
- existing OpenAI server-only request handling and safe error mapping

No secrets are exposed.

### Monitoring Foundation

Prepared through:

- `lib/monitoring.ts`
- monitoring environment variables in `.env.example`
- `/api/health` monitoring readiness output

Sentry SDK is not installed because credentials and network package installation are unavailable in this environment. The integration points are gated and safe when disabled.

### Shared Rate Limiting

Updated:

- `lib/security/rate-limit.ts`

Supports:

- memory fallback
- Upstash-compatible REST adapter when environment variables are configured
- safe fallback to memory if the shared provider fails

Applied to:

- auth login
- auth register
- auth refresh
- AI generation
- uploads

Search, messaging, and default API buckets are supported by the abstraction for future routes.

## Deferred Blockers

- Sentry SDK installation and release wiring.
- OpenTelemetry SDK installation.
- Persistent audit-log database sink.
- Virus scanning provider.
- Enforced CSP after report-only observation.
- Distributed rate limiting requires live Upstash credentials.

## Manual Actions Before Staging

1. Apply migrations in the exact order listed in `MIGRATION_EXECUTION_PLAN.md`.
2. Run verification scripts.
3. Create Storage buckets using scripts in `database/storage`.
4. Configure Supabase auth redirect URLs.
5. Set staging environment variables.
6. Test OpenAI with valid key, no key, invalid key, and insufficient credit states.
7. Configure monitoring credentials if available.

## Staging Readiness Score

Staging readiness after RC1.1: **88 / 100**

The remaining gap is mostly external configuration and manual staging verification, not application build stability.

## Go / No-Go

Recommendation: **Go for staging deployment after manual Supabase migration and Storage verification.**

Recommendation for private beta: **Conditional Go after staging test plan passes with at least one owner, one member, one unauthorized member, and one anonymous test path.**
