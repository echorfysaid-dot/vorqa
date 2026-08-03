# VORQA Beta Acceptance Checklist

## Authentication

- Register works.
- Email confirmation flow works if enabled.
- Login works.
- Logout clears session.
- Protected APIs reject anonymous requests.

## Projects

- Projects page loads.
- Project details load.
- Project workspace tabs render.
- Project ownership and organization scoping are respected.

## Marketplace

- Marketplace loads.
- Company profile loads.
- Search/filter UI works.
- Verified/demo companies are visible.

## RFQ

- RFQ dashboard loads.
- RFQ detail loads.
- New RFQ flow renders.
- RFQ comparison/award UI routes load.

## Contracts

- Contracts dashboard loads.
- Contract detail loads.
- Contract timeline, parties, and insights render.

## AI

- VORA generates with OpenAI when configured.
- Mock fallback works when key is missing.
- 429/invalid key/timeout errors are user-safe.
- History persistence works for generated outputs.

## Notifications

- Notifications page loads.
- Dashboard notification widget loads.
- Filters/search render without crashes.

## Billing

- Billing dashboard loads.
- Plans, invoices, and usage pages load.
- Quotas are displayed but not enforced unless explicitly enabled later.

## Admin

- Admin dashboard loads.
- Users, organizations, subscriptions, audit, flags, system, and AI admin pages load.
- Admin real-data access is not enabled without platform-admin authorization.

## Performance

- Production build passes.
- Major routes return 200.
- No ChunkLoadError.
- Mobile smoke test passes.

## Security

- RLS verification scripts pass.
- Storage bucket policies pass.
- Secrets are server-only.
- `/api/health` exposes no secret values.

## Acceptance Decision

Private beta can begin only when all critical items above pass or are explicitly accepted by the launch owner.
