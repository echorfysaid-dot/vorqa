# VORQA Staging Deployment Checklist

## Environment

- `NEXT_PUBLIC_APP_ENV=staging`
- `NEXT_PUBLIC_DATA_SOURCE=auto`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `RATE_LIMIT_PROVIDER=memory` for first smoke test or `upstash` for shared staging
- `UPSTASH_REDIS_REST_URL` if using Upstash
- `UPSTASH_REDIS_REST_TOKEN` if using Upstash
- `NEXT_PUBLIC_SENTRY_DSN` if monitoring is enabled
- `SENTRY_DSN` if server monitoring is enabled
- `OTEL_EXPORTER_OTLP_ENDPOINT` if tracing is enabled

## Database

- Apply `database/supabase-schema.sql` on fresh staging.
- Apply migrations in `docs/MIGRATION_EXECUTION_PLAN.md` order.
- Confirm no migration errors.
- Run schema verification script.
- Run policy verification script.
- Run access-test template with staging users.

## Storage

- Run `database/storage/knowledge_bucket.sql`.
- Run `database/storage/project_documents_bucket.sql`.
- Confirm buckets are private.
- Confirm upload, download, and delete work for owner/member.
- Confirm cross-organization access is denied.

## Auth

- Configure redirect URLs.
- Register staging owner.
- Register staging member.
- Confirm email flow.
- Confirm login/logout.
- Confirm protected API calls send bearer token.

## OpenAI

- Confirm `/api/health` shows OpenAI configured.
- Generate one document.
- Confirm history persistence.
- Remove key in staging clone or use separate environment to verify mock fallback.
- Confirm invalid key and 429 errors remain user-safe.

## Monitoring

- Confirm monitoring disabled mode works.
- If Sentry is configured, trigger a controlled client/server test only in staging.
- Confirm logs redact secrets.

## Rollback

- Record deployment ID.
- Record database backup point.
- Confirm previous deployment can be restored.
- Confirm `NEXT_PUBLIC_DATA_SOURCE=demo` or `auto` fallback strategy is documented.
