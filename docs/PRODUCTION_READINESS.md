# Vorqa AI Production Readiness

This document captures the current frontend foundation, the demo-only surfaces, and the safest path for future production integration. Sprint 13.1 intentionally does not change authentication, Supabase, OpenAI, API routes, database schema, RLS, or business logic.

## Current Frontend Architecture

- Next.js App Router is used for all public, authenticated, marketplace, RFQ, organization, project, and contract routes.
- Shared layout and authenticated navigation live in `components/app-shell.tsx`.
- Shared UI primitives live in `components/ui.tsx` and design-system styling is centralized through global Tailwind tokens and reusable classes.
- Demo data that is already centralized lives in:
  - `lib/platform-data.ts` for organizations, projects, users, dashboard context, and activity.
  - `lib/marketplace-data.ts` for marketplace categories and company profiles.
  - `lib/rfq-data.ts` for RFQs, quotations, wizard steps, and award steps.
  - `lib/contracts-data.ts` for contract dashboard and contract detail data.
- Page-local arrays still exist where they only describe local presentation, such as comparison rows, role matrices, settings sections, and UI-only insight cards.

## Existing Real Integrations

- Supabase authentication and protected sessions are part of the working application and should remain the authority for logged-in access.
- Supabase database and storage integrations are used for real user-owned data and knowledge-file actions.
- Project lists can now be read through the repository layer using the existing protected `/api/projects` route.
- OpenAI generation is server-side and uses environment-based configuration with mock fallback behavior.
- Protected API requests should continue using the existing authenticated token flow and must never expose service-role keys or OpenAI secrets to the browser.

## Demo-Only Areas

These surfaces currently use frontend demo data and should not be mistaken for production persistence:

- Organizations and organization workspaces.
- Organizations remain demo-backed because no compatible `organizations` table exists in the current schema.
- Marketplace company directory, profiles, compare, shortlist, RFQ, quotation comparison, and award preview.
- Contracts dashboard and contract details.
- Project workspace sections that were explicitly delivered as UI foundations, including tasks, timeline, team, reports, budget, and project settings.
- Global search, command palette, notifications, quick actions, and organization switcher state.
- Demo dashboard KPIs, activity, documents, agenda, recommendations, and alerts.

## Backend Integration Boundaries

- Keep ownership checks based on authenticated users and `owner_id` semantics.
- Convert demo data module by module instead of replacing broad page structures.
- Keep page components consuming typed entities from a stable interface so Supabase/API loaders can replace demo arrays later with minimal UI churn.
- Do not move secrets, service-role operations, or privileged writes into client components.
- Preserve current route paths while replacing data sources behind them.

## Recommended Migration Order

1. User profile and settings preferences.
2. Organizations, departments, employees, roles, and membership.
3. Projects and project workspace summary data.
4. Documents, generated outputs, saved items, favorites, and history.
5. Knowledge workspace metadata and storage-backed file lists.
6. Marketplace companies, categories, profiles, reviews, and certifications.
7. RFQs, quotations, evaluation workflows, and award decisions.
8. Contracts, milestones, payments, deliverables, parties, and activity.
9. Notifications, global search indexing, and command actions.
10. Analytics, KPI rollups, and reporting exports.

## Known Limitations

- Several enterprise modules are UI-only and use demo content by design.
- `NEXT_PUBLIC_DATA_SOURCE=supabase` intentionally does not fall back to demo data when projects are unavailable.
- Compare, shortlist, command palette, notifications, and switcher state are not persisted.
- RFQ award flow does not notify suppliers, create contracts, or save decisions.
- Contract pages are static demo workspaces and do not enforce contract-level permissions yet.
- Marketplace contact, RFQ, quote, download, share, and save actions are placeholders unless connected to a real backend later.
- Production monitoring, analytics, and error reporting are not documented as configured in this frontend audit.

## Pre-Production Checklist

- Confirm all production environment variables are set and never exposed client-side.
- Run Supabase migrations from a clean project and a partially initialized project.
- Re-test RLS policies for profiles, projects, documents, history, favorites, settings, and knowledge files.
- Verify Supabase Storage bucket policies for upload, download, and delete.
- Add production API validation, rate limiting, logging, and observability around write operations.
- Confirm OpenAI error handling, model fallback behavior, and usage metadata storage.
- Replace demo data modules with typed API/Supabase loaders in the recommended order.
- Add route-level not-found and empty-state handling for every dynamic production entity.
- Complete keyboard, focus, screen-reader, RTL, LTR, mobile, tablet, and desktop QA.
- Smoke-test production builds for route chunks, global CSS, authentication redirects, and protected pages.
