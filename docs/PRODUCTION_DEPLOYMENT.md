# VORQA Production Deployment

## Build

Use the standard production build:

```powershell
npm.cmd run build
```

Start locally for verification:

```powershell
npm.cmd run start -- -p 3001
```

## Environment Validation

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_DATA_SOURCE`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Recommended:

- `NEXT_PUBLIC_APP_ENV=production`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `NEXT_PUBLIC_ANALYTICS_ID`

Do not expose:

- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- user access tokens
- refresh tokens
- payment provider secrets

## Data Source Mode

- `demo`: local demos and non-production review.
- `auto`: recommended for early beta when Supabase integration is partially enabled.
- `supabase`: use only when all required tables, policies, buckets, and read models are verified.

## Supabase Deployment

Before production:

- Apply migrations manually in a controlled environment.
- Verify every migration is idempotent where designed.
- Confirm RLS policies with owner, member, unauthorized member, and anonymous users.
- Create required Storage buckets manually:
  - `knowledge`
  - `vorqa-project-documents`
- Confirm bucket policies match owner and organization/project scoping.
- Configure auth redirect URLs for the production domain.

## OpenAI Deployment

- Set `OPENAI_API_KEY` only on the server.
- Set `OPENAI_MODEL` to a model available to the account.
- Confirm mock fallback works when the key is absent.
- Confirm 429, insufficient-credit, timeout, and invalid-key errors return safe Arabic messages.

## Security Headers

Configured in `next.config.mjs`:

- Content Security Policy report-only
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- Strict-Transport-Security
- X-Content-Type-Options

Launch recommendation: keep CSP report-only for the first beta deployment, collect violations, then enforce after tuning.

## Monitoring Integration Points

Prepared:

- `/api/health` for uptime checks
- Sentry DSN variables
- OpenTelemetry endpoint variable
- Analytics public ID variable
- structured security logger
- audit-event helper

Not yet implemented:

- Sentry SDK initialization
- OpenTelemetry SDK initialization
- analytics event dispatch
- persistent audit-log database sink

## Route Verification

Minimum production smoke test:

- `/`
- `/login`
- `/register`
- `/onboarding`
- `/dashboard`
- `/projects`
- `/projects/PRJ-1048`
- `/tools`
- `/tools/document`
- `/organizations`
- `/organizations/atlas`
- `/marketplace`
- `/rfq`
- `/quotations`
- `/contracts`
- `/billing`
- `/admin`
- `/notifications`
- `/settings`
- `/api/health`

## Rollback

Rollback immediately when:

- users cannot register or log in
- private routes expose incorrect data
- file uploads expose or corrupt files
- OpenAI errors break page rendering instead of degrading gracefully
- production build chunks fail to load

Rollback path:

1. Re-deploy last stable build.
2. Preserve Supabase data.
3. Disable risky feature via data-source mode or feature flag when possible.
4. Review logs and health payload.
5. Re-release only after reproducing and fixing the issue.
