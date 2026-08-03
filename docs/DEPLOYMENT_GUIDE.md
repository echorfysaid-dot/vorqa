# VORQA Deployment Guide

## Scope

This guide prepares VORQA AI for staging, production, and the v1.0 private beta release candidate. It does not change product workflows or repository architecture.

## Vercel Deployment

Recommended project settings:

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm.cmd run build` locally, `npm run build` on Linux/Vercel
- Output: Next.js default
- Node.js: use the Vercel default compatible with Next.js 14
- Production branch: protected release branch
- Preview deployments: enabled for pull requests or staging branch

## Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_DATA_SOURCE`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `NEXT_PUBLIC_APP_ENV`

Recommended:

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `NEXT_PUBLIC_ANALYTICS_ID`
- `RATE_LIMIT_PROVIDER`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Production values:

- `NEXT_PUBLIC_APP_ENV=production`
- `NEXT_PUBLIC_DATA_SOURCE=auto` for first private beta
- `RATE_LIMIT_PROVIDER=upstash` when shared rate limiting is configured

Never expose:

- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_TOKEN`
- user access tokens
- payment provider secrets

## Production Domains

Recommended domains:

- `vorqa.ai` for production
- `www.vorqa.ai` redirecting to `vorqa.ai`
- `staging.vorqa.ai` for staging

Configure these domains in:

- Vercel project domains
- Supabase Auth redirect URLs
- Supabase allowed site URL
- Monitoring environment filters

## DNS

Typical DNS setup:

- Apex `vorqa.ai`: Vercel A record or recommended Vercel apex configuration
- `www`: CNAME to Vercel
- `staging`: CNAME to Vercel preview/staging target

After DNS changes:

- verify propagation
- verify HTTPS certificate issuance
- verify canonical redirects
- verify Supabase email links target the correct domain

## SSL

Use Vercel-managed SSL. Before beta:

- verify certificate is active
- verify `https://vorqa.ai`
- verify `https://staging.vorqa.ai`
- verify mixed-content warnings are absent

## Build Settings

Pre-deployment checks:

```powershell
npm.cmd run test:ai
npm.cmd run build
```

Production smoke checks:

- `/`
- `/login`
- `/register`
- `/dashboard`
- `/projects`
- `/projects/PRJ-1048`
- `/tools`
- `/organizations`
- `/marketplace`
- `/rfq`
- `/quotations`
- `/contracts`
- `/billing`
- `/admin`
- `/notifications`
- `/settings`
- `/api/health`

Runtime API smoke modes for `/api/generate`:

- `document_parse`
- `knowledge_index`
- `knowledge_search`
- `copilot_chat`
- `ai_orchestrator`
- `vora_intelligence`
- `report_export`
- `project_comment`
- `project_review`
- `project_activity`
- `runtime_health`
- `performance_metrics`

Production runtime modules to verify:

- Construction Intelligence
- Project Intelligence
- Knowledge Layer
- VORA Copilot
- AI Orchestrator
- Document Engine
- Project analysis persistence
- Collaboration
- Request cache
- Rate limiting
- Runtime logging
- Health checks
- Performance metrics

## Rollback Procedure

Rollback immediately when:

- login/register is unavailable
- protected data leaks across users or organizations
- route chunks fail to load
- uploads expose or corrupt files
- OpenAI errors crash pages instead of degrading safely

Steps:

1. Identify the last stable deployment.
2. Roll back application deployment in Vercel.
3. Do not roll back database migrations unless a database rollback plan exists.
4. Keep Supabase data intact.
5. Use `NEXT_PUBLIC_DATA_SOURCE=auto` or `demo` only as an emergency fallback for non-production or controlled staging.
6. Record incident, root cause, and corrective action.

## Private Beta Deployment Decision

Private beta is a conditional go only after:

- all automated tests pass
- production build passes
- migrations are validated in staging
- Storage buckets and policies are verified
- OpenAI production access is confirmed or mock fallback is explicitly accepted
- rate limiting is configured for the target deployment topology
- monitoring and incident response owners are assigned
