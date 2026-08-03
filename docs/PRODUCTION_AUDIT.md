# Vorqa AI Production Audit

Sprint 17.0 audit date: 2026-07-19

This audit reviews the current Vorqa frontend and production foundation before Marketplace, RFQ, Contracts, Notifications, Billing, and Private Beta work continues. It is intentionally non-destructive: no schema, API, authentication, OpenAI, repository, or business behavior changes were made.

## Scope

Reviewed areas:

- Landing, authentication pages, onboarding, dashboard, projects, project workspace, VORA tools, organizations, marketplace demo pages, RFQ demo pages, contracts demo pages, settings, history, saved, and favorites.
- Repository, adapter, mapper, hook, model, utility, and service layers.
- Current Supabase schema and production migration files.
- Protected API routes and server Supabase helpers.
- VORA context engine, prompt composer, AI skills, generation API, and persistence path.
- Performance, security, accessibility, responsive behavior, loading states, empty states, and error handling.

## Executive Summary

Vorqa has a strong alpha foundation: the repository architecture is broadly in place, production models exist for the major construction operating-system modules, demo/supabase/auto modes are preserved, and the app can still run without removing mock fallbacks.

The main production gap is consistency. Newer modules use the repository-adapter-mapper architecture, while some legacy API routes still call Supabase tables directly. The database model is moving toward organizations, departments, employees, projects, tasks, timeline, budget, documents, and knowledge, but several compatibility layers still preserve owner-only legacy paths. This is the right kind of transitional architecture, but it should be resolved before private beta.

## Architecture Findings

### Strengths

- `lib/models/` contains domain models for organizations, departments, employees, projects, tasks, timeline, budget, documents, knowledge, marketplace, RFQ, contracts, notifications, analytics, and user profile concepts.
- `lib/repositories/` consistently uses demo, supabase, mapper, and hook files for the newest production modules.
- `lib/data-source.ts` centralizes demo/supabase/auto mode selection.
- Project Workspace, Dashboard, Documents, Knowledge, VORA AI, and Reports now consume repositories in the primary UI paths.
- `lib/ai-context-repository.ts` builds VORA project context from repositories rather than directly querying the UI layer.

### Risks

- `components/project-workspace.tsx` is about 184 KB and contains many workspace sections in one client component. This increases bundle cost, review difficulty, and regression risk.
- `app/organizations/[id]/page.tsx` and `app/organizations/atlas/page.tsx` still carry large page-specific implementations. They should eventually share organization workspace sections.
- `analyticsSupabaseAdapter` currently delegates to demo analytics while marking the source as `supabase`. This preserves UI stability, but it is not true production analytics.
- `organizationRest` and several Supabase adapters import `getValidSession` from a client-marked auth module. This works for client-driven repository calls, but future server-side repository use needs a server-safe adapter boundary.
- Some legacy lists and fallback helpers remain in `lib/data` and `lib/platform-data.ts`. They are useful for demo mode, but should be kept out of production source paths.

## Database Findings

Reviewed current production tables and migrations:

- Existing baseline tables: `profiles`, `projects`, `documents`, `generation_history`, `favorites`, `user_settings`, `knowledge_files`.
- Production foundations: `organizations`, `organization_members`, `organization_roles`, `departments`, `employees`, `project_members`, `tasks`, `timeline_milestones`, `timeline_dependencies`, `budget_categories`, `project_budget_items`, `documents`, `knowledge_articles`.

### Strengths

- Migrations use idempotent patterns such as `create table if not exists`, `create index if not exists`, and guarded constraint creation.
- Organization helper functions such as `is_organization_member` and permission checks are reused by newer RLS policies.
- Most new production modules include organization-scoped indexes and RLS policies.
- Foreign keys generally use appropriate cascade behavior for organization-owned records and `set null` for optional relationships such as document links and managers.

### Risks

- Some migration paths create columns as `not null` in `create table`, but add them nullable in `alter table add column if not exists`. A partially initialized database can therefore retain weaker nullability than a fresh database.
- The legacy `knowledge_files` table and new `knowledge_articles` table coexist. File upload still uses `knowledge_files`, while the production knowledge repository uses `knowledge_articles`.
- `projects.organization_id` remains nullable for backward compatibility. This is useful during migration, but it limits full organization isolation guarantees until all project data is migrated.
- Some RLS rules assume organization membership helper functions exist before dependent migrations run. Migration order must be preserved.
- Storage bucket policies are documented expectations, not automatically created. Buckets such as `knowledge` and `vorqa-project-documents` need manual Supabase setup.

## API Findings

Reviewed API routes:

- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/refresh`
- `/api/auth/me`
- `/api/generate`
- `/api/history`
- `/api/favorites`
- `/api/knowledge`
- `/api/knowledge/[id]`
- `/api/knowledge/[id]/download`
- `/api/projects`
- `/api/settings`

### Strengths

- Protected routes verify Bearer tokens with Supabase before returning user data.
- `authFetch` centralizes client authenticated requests and refreshes expired sessions.
- `/api/generate` validates tool type, payload shape, field length, total request size, authenticated user, and project context before calling VORA.
- Service-role keys are kept server-side in `lib/supabase-server.ts`.
- OpenAI API keys are server-only and the mock fallback remains intact.

### Risks

- Several API routes use direct REST calls and legacy `owner_id` filters instead of repositories. This includes `/api/projects`, `/api/history`, `/api/favorites`, `/api/settings`, and legacy knowledge file routes.
- `/api/favorites` inserts a favorite for a `generation_id` without first verifying that the generation belongs to the authenticated user. RLS may still protect it, but explicit ownership validation should be added.
- `/api/knowledge` uses service-role storage operations after checking project ownership. The service role is server-only, but production should keep this route narrowly scoped and tested against storage policy expectations.
- Auth routes return raw Supabase error messages. These should be normalized before beta for consistency and localization.
- There is no rate limiting for auth, generation, upload, or write endpoints.
- Some Arabic API error strings are mojibake-encoded and should be repaired before user-facing beta.

## AI Findings

### Strengths

- VORA uses a context engine that pulls project, organization, members, employees, tasks, timeline, budget, documents, knowledge, and memory from repositories.
- Prompt composition separates instructions, user input, and context summary.
- Prompt guidance supports project summary, task review, budget analysis, timeline analysis, risk analysis, document summary, knowledge search, meetings, daily reports, weekly reports, and executive summaries.
- `/api/generate` saves generated output and metadata to generation history and documents when Supabase is configured.

### Risks

- Context size is currently summarized by compact JSON stringification with simple limits. Larger real projects will need token budgeting, ranked context selection, and summarization.
- Prompt injection boundaries are not yet explicit for uploaded knowledge, documents, or user-provided project metadata.
- VORA memory currently uses saved generation demo data in the context repository path. Production memory should read scoped `generation_history`.
- `saveGeneration` preserves legacy document persistence and does not yet fully attach organization-aware document metadata.
- Streaming is not active, which is acceptable for stability, but future streaming should preserve persistence and cancellation behavior.

## Performance Findings

### Strengths

- Next.js production build uses App Router and static prerendering for public/demo pages where possible.
- Heavy images are routed through visual components and `Next/Image` where appropriate.
- The project uses a small dependency set: Next, React, Framer Motion, Lucide, and OpenAI.

### Risks

- `components/project-workspace.tsx` is the largest file and likely the main client bundle hotspot for project pages.
- Organization workspace pages are also large and contain multiple tab experiences in one route component.
- Analytics aggregation currently calls several repositories and may repeat work. Real Supabase mode should eventually aggregate server-side or through efficient API endpoints.
- `next.config.mjs` disables webpack cache. That can slow local and CI builds; revisit once chunk stability issues are fully resolved.
- Large demo datasets should stay centralized and tree-shaken away from production-only flows where possible.

## Security Findings

### Strengths

- Supabase service-role usage is server-side only.
- Client API calls send `Authorization: Bearer <access_token>` through `authFetch`.
- RLS is enabled across newer production tables.
- Storage paths include owner or organization/project segments.
- Input payloads for VORA generation have size limits and control-character sanitization.

### Risks

- Client auth stores sessions in `localStorage`. This is acceptable for alpha, but private beta should consider httpOnly cookie-backed sessions or stronger XSS controls.
- No global CSP, rate limiting, abuse detection, or request throttling is present.
- Upload validation checks file extension and MIME type, but not file signatures or malware scanning.
- Legacy owner-only endpoints need explicit organization-aware authorization before enterprise rollout.
- Future cookie auth would need CSRF protection.

## UI / UX Findings

### Strengths

- The platform has a consistent premium dark enterprise visual direction.
- Major app areas include loading, empty, and error state foundations.
- RTL layout support is broadly present.
- App shell includes global navigation, organization switcher, search, command palette, notifications, and profile controls.

### Risks

- Permission-denied states are not equally mature across all repository-backed views.
- Some routes use demo placeholders for Marketplace, RFQ, and Contracts; these should remain clearly demo-only until production modules begin.
- Long comparison and workspace tables need recurring mobile overflow QA after every sprint.
- Arabic copy should be audited globally for encoding issues and natural tone.

## Code Quality Findings

### Strengths

- TypeScript strict mode is enabled.
- Domain models and repository result types are in place.
- Demo data has been progressively centralized.
- Newer modules avoid direct Supabase calls from page components.

### Risks

- Avoidable `any` remains in mapper and analytics code where dynamic Supabase rows are being normalized.
- Some large files should be split before the next feature-heavy phase.
- API error response shapes are inconsistent across routes.
- Demo and production semantics are sometimes mixed in naming, especially where a Supabase adapter still returns demo-derived data.

## Priority Roadmap

### Critical

- No critical build-blocking issue was found during this audit.

### High

- Move legacy `/api/projects`, `/api/history`, `/api/favorites`, `/api/settings`, and legacy knowledge file endpoints toward the same repository/authorization architecture used by production modules.
- Add explicit ownership validation before creating favorites.
- Repair mojibake Arabic strings in API and AI helper files.
- Add rate limiting for auth, generation, upload, and write routes.
- Add token budgeting and prompt-injection hardening to VORA context composition.

### Medium

- Split `components/project-workspace.tsx` into per-section components and lazy-load heavy tabs.
- Replace `analyticsSupabaseAdapter` demo delegation with real aggregate reads.
- Add a server-safe repository/auth adapter boundary for future server components and API use.
- Finish migration hardening for partially initialized databases with nullable production columns.
- Normalize API error response shapes and localization.
- Add a storage setup validator/checklist for Supabase buckets.

### Low

- Revisit disabled webpack cache in `next.config.mjs`.
- Add more semantic labels and ARIA attributes to dense dashboard controls.
- Keep demo-only modules visually labelled until production backend work starts.
- Add visual regression screenshots for desktop, tablet, and mobile.

## Deferred Issues

No application code was changed in this audit sprint. The issues above are intentionally deferred because the sprint scope is audit, documentation, build validation, and route verification only.

## Validation Checklist

Required validation for this sprint:

- `npm.cmd run build`
- Route smoke tests:
  - `/`
  - `/dashboard`
  - `/organizations`
  - `/organizations/atlas`
  - `/projects`
  - `/projects/PRJ-1048`
  - `/tools`
  - `/history`
  - `/saved`
  - `/favorites`
  - `/settings`

Project Workspace module coverage is represented by `/projects/PRJ-1048`, which contains Overview, VORA AI, Tasks, Timeline, Budget, Documents, Knowledge, Reports, and Settings sections inside the existing client workspace shell.

## Remaining Production Gaps

- Full organization-aware backend alignment for all legacy APIs.
- Real production analytics aggregation.
- Supabase bucket policy verification in an actual hosted project.
- RLS execution testing against owner, member, HR, unauthorized member, and anonymous personas.
- VORA token budgeting, retrieval ranking, and future RAG ingestion.
- Private beta security controls: rate limiting, audit logging, CSP, upload scanning, and operational monitoring.
