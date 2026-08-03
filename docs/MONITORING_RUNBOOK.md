# VORQA Monitoring Runbook

## Health Endpoint

Endpoint:

- `/api/health`

Expected status:

- `ok`: environment validation passed
- `degraded`: application is reachable but configuration warnings or blockers exist

The endpoint does not expose secrets.

## Monitoring

Prepared integration points:

- Sentry DSN variables
- OpenTelemetry endpoint variable
- analytics ID variable
- structured security logger
- audit event helper

Monitoring disabled mode must continue to work.

## Alerts

Recommended alert rules:

- `/api/health` not reachable
- 5xx rate above threshold
- auth failures spike
- upload failures spike
- OpenAI 429 or 5xx spike
- Supabase RLS/policy errors spike
- build/deployment failure

## Log Review

Review:

- Vercel application logs
- Supabase API/Auth/Storage logs
- OpenAI dashboard usage and request errors
- structured `[VORQA ...]` logs

Never log:

- access tokens
- refresh tokens
- API keys
- service-role keys
- payment secrets
- raw sensitive customer files

## Performance Metrics

Track:

- route latency
- client runtime errors
- API duration
- OpenAI generation latency
- upload latency
- dashboard load time
- largest route bundle sizes

## Error Response Procedures

For AI errors:

- confirm key/model/credits
- confirm fallback behavior
- check rate limit status

For Supabase errors:

- check environment variables
- check RLS policies
- check table/view existence
- check auth token transmission

For upload errors:

- check bucket existence
- check bucket policies
- check file type and size
- check path scoping
