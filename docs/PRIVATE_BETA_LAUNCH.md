# VORQA Private Beta Launch

## Launch Goal

Prepare VORQA AI for first real users while preserving existing demo, Supabase, and auto modes. This launch plan focuses on configuration, verification, operations, rollback, and known risks. It does not introduce new business workflows.

## Deployment Readiness

Current readiness:

- Production build passes.
- Global 404, runtime error, and loading states are present.
- `/api/health` exposes a safe readiness payload without secrets.
- Security headers are configured in `next.config.mjs`.
- API validation and in-memory rate limiting exist.
- OpenAI remains server-only and falls back to mock mode when `OPENAI_API_KEY` is absent.
- Supabase service-role credentials are not exposed to browser code.
- Demo, Supabase, and auto data-source modes are preserved.

## Required Production Environment

Required for real beta:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_DATA_SOURCE=auto` or `supabase`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `NEXT_PUBLIC_APP_ENV=production`

Prepared monitoring variables:

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `NEXT_PUBLIC_ANALYTICS_ID`

## Beta Accounts and Seed Data

Recommended first-user setup:

- Beta organization: `Atlas Construction Group`
- Demo organization: keep current demo organization data available for fallback
- Admin account: one verified platform operator with access to `/admin`
- Sample projects: Luxury Villa Casablanca, Residential Complex Rabat, Industrial Warehouse Tangier, Office Tower Marrakech
- Sample marketplace companies: Atlas Construction Group, NorthBuild Engineering, UrbanForm Architects, Maghreb Logistics, BetonPro Materials, CraneMax Equipment, GeoConsult Africa
- Sample RFQ: `RFQ-1001`
- Sample contract: `CON-1001`

Production note: create real beta records through Supabase and repository-backed flows. Do not seed secrets, real personal data, or payment data into demo files.

## Launch Blockers

Recommended blockers before inviting real users:

- Supabase migrations not applied or not verified on a clean project.
- Storage buckets missing or public write policies enabled.
- `NEXT_PUBLIC_DATA_SOURCE` accidentally left as `demo` for a production beta.
- OpenAI key missing when real AI output is expected.
- Auth redirect URLs not configured for the production domain.
- RLS policies not tested with owner, member, unauthorized member, and anonymous access.
- CSP violations not reviewed before changing from report-only to enforced mode.
- Rate limiting still in memory for multi-instance production.
- No rollback path to the previous stable deployment.

## Technical Checklist

- Run `npm.cmd run build`.
- Confirm `/api/health` returns `status: ok`.
- Verify all major routes return HTTP 200.
- Confirm `.env.local` or hosting environment contains all required variables.
- Confirm no secret is prefixed with `NEXT_PUBLIC_` except public Supabase anon key and public monitoring IDs.
- Confirm `OPENAI_MODEL` is available to the active API key.
- Confirm Supabase URL and anon key target the intended production project.
- Confirm repository data mode: `auto` for beta fallback, `supabase` only after all tables/views are ready.

## Security Checklist

- Verify RLS on profiles, organizations, projects, documents, knowledge, billing, marketplace, RFQ, quotations, contracts, notifications, and admin read models.
- Verify anonymous users cannot access private records.
- Verify owners and members have expected scopes.
- Verify file upload MIME type, extension, filename, and size limits.
- Confirm Storage buckets are private unless explicitly public-read.
- Confirm service-role key is server-only.
- Confirm OpenAI key is server-only.
- Review structured logs for accidental sensitive fields.

## Performance Checklist

- Review build output for unusually large routes.
- Exercise dashboard, project workspace, marketplace, RFQ, quotations, contracts, billing, admin, and tools.
- Monitor route latency after deployment.
- Use production monitoring to track client runtime errors.
- Validate mobile page load and no horizontal overflow.

## Operations Checklist

- Assign launch owner.
- Assign support owner.
- Prepare support inbox and escalation channel.
- Prepare Supabase dashboard access for operator.
- Prepare OpenAI usage dashboard access.
- Prepare deployment rollback access.
- Define daily beta review cadence.

## Rollback Checklist

- Keep the last stable deployment available.
- Record deployment ID and commit hash before launch.
- If auth, database access, or uploads fail for more than one beta user, roll back immediately.
- If OpenAI fails, keep app live in mock fallback mode and communicate degraded AI status.
- If Supabase policies block legitimate access, switch data mode to `auto` only if demo fallback is acceptable for that environment.

## Known Risks

- Some enterprise modules still have demo-only or UI-only actions.
- Admin production views are prepared but not implemented.
- Monitoring variables are prepared, but Sentry/OpenTelemetry SDKs are not installed in this sprint.
- In-memory rate limiting is not sufficient for multi-instance deployments.
- CSP is report-only and should be enforced after observing production reports.
