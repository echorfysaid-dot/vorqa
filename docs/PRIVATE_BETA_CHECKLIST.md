# Vorqa AI v1.0 Private Beta Checklist

Date: 2026-07-26  
Scope: Sprint 40 release-candidate validation for a controlled private beta.

## Release Gate

Private beta may begin only when:

- `npm.cmd run test:ai` passes.
- `npm run build` passes.
- Production Supabase project is configured.
- Required migrations are applied in staging first.
- Storage buckets and policies are verified.
- OpenAI key and model access are verified, or mock fallback is explicitly accepted.
- Runtime health endpoint returns safe, non-secret status.
- Critical user journeys are manually smoke tested.
- Known limitations are accepted by the launch owner.

## Authentication

- Register renders and completes against the configured Supabase project.
- Login renders and returns a valid session.
- Logout clears the active session.
- Protected API routes reject anonymous requests.
- Supabase Auth redirect URLs match production and staging domains.
- No service-role secret is exposed to browser code.

## Projects

- Project list loads in demo, supabase, and auto modes.
- Project details load for a valid project ID.
- Missing project IDs show a safe empty or not-found state.
- Project workspace tabs render without crashing.
- Project ownership and organization context are respected.

## Document Parsing

- TXT parsing returns normalized text.
- Markdown parsing returns normalized text.
- PDF parsing returns extracted text when available and safe warnings otherwise.
- DOCX parsing returns extracted text when available and safe warnings otherwise.
- Unsupported files return a descriptive error.
- Corrupted or empty files never crash the request.

## Knowledge Indexing

- `knowledge_index` accepts normalized project document content.
- Chunk generation is deterministic.
- Vector storage fallback remains safe when embeddings are unavailable.
- `knowledge_search` returns source chunks, relevance, and confidence.
- Project knowledge remains isolated by `projectId` and `ownerId`.

## Copilot

- `copilot_chat` creates or resumes a project-scoped session.
- Answers use only retrieved project knowledge and provided context.
- Source documents are returned when relevant chunks exist.
- No relevant knowledge produces a clear grounded fallback.
- Conversation history remains isolated by project and owner.

## Construction Intelligence

- Contract Review runs through the VORA Intelligence Runtime.
- BOQ Review runs through the same runtime path.
- Risk Assessment runs through the same runtime path.
- Planning Review runs through the same runtime path.
- Site Report Review runs through the same runtime path.
- Executive Summary can use prior persisted analyses when available.
- Unsupported document parsing is reported clearly and does not block manual text input.

## PDF and DOCX Export

- Completed analyses can export to PDF.
- Completed analyses can export to DOCX.
- Exports include report metadata, health, confidence, findings, recommendations, risks, footer, and page numbering where supported.
- Export failure never deletes or mutates the source analysis.

## Collaboration

- Project member roles resolve through centralized permission helpers.
- Comments can be created, listed, and resolved through the collaboration layer.
- Review workflow supports draft, in review, approved, rejected, and archived states.
- Activity timeline records collaboration events.
- Audit log entries are immutable in the current runtime store.

## Permissions

- Anonymous requests are rejected for protected API modes.
- Unauthorized users receive safe permission-denied responses.
- Owner, manager, engineer, reviewer, and viewer permissions are verified in deterministic tests.
- Export, review, comment, and member-management checks use shared helpers.

## Performance

- Production build completes.
- Largest pages are acknowledged as acceptable for private beta.
- Request cache is used only for deterministic operations.
- Cache statistics and performance metrics are available through runtime helpers.
- No new performance warnings are introduced in Sprint 40.

## Health Checks

- `/api/health` returns environment and configuration readiness without secrets.
- `runtime_health` checks database, provider, knowledge, copilot, storage, and overall status.
- `performance_metrics` returns aggregate runtime metrics safely.
- Health responses distinguish healthy, degraded, and unavailable states.

## Provider Failover

- OpenAI availability is detected explicitly.
- Mock provider remains available for local and demo execution.
- Unavailable providers are rejected or bypassed according to execution policy.
- Failover returns provider status and normalized warnings.
- No provider payloads, headers, keys, or stack traces leak to the client.

## Manual Route Smoke Test

Verify these routes before inviting private beta users:

- `/`
- `/login`
- `/register`
- `/dashboard`
- `/projects`
- `/projects/PRJ-1048`
- `/tools`
- `/tools/construction-intelligence`
- `/tools/contract-review`
- `/tools/boq-review`
- `/tools/risk-assessment`
- `/tools/planning-review`
- `/tools/site-report-review`
- `/tools/executive-summary`
- `/organizations`
- `/marketplace`
- `/contracts`
- `/settings`

## Private Beta Decision

Recommended decision: Conditional Go after staging migration, storage, auth redirect, OpenAI, and monitoring checks are completed.
