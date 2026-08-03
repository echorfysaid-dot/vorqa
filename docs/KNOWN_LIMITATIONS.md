# Vorqa AI v1.0 Known Limitations

Date: 2026-07-26  
Scope: Accepted limitations for the private beta release candidate.

## Release Positioning

Vorqa AI v1.0 is ready for a controlled private beta, not a public self-serve launch. The platform includes production-ready foundations and several durable flows, but some infrastructure adapters remain intentionally staged for future hardening.

## Database and Supabase

- Migrations are generated but must be applied manually.
- RLS must be verified in staging before production.
- Supabase Storage buckets are documented but not automatically created.
- Some modules still support demo or in-memory fallback for resilience.
- Admin-wide production data access requires server-side platform-admin enforcement before unrestricted use.

## Persistence

- Project analysis persistence has a Supabase adapter and fallback behavior.
- Some runtime-support data remains in memory, including selected metrics, provider health, request cache, rate-limit state when Upstash is not configured, copilot sessions, collaboration timeline, comments, and audit events.
- In-memory runtime state does not survive server restarts or multi-instance deployment.

## Document Parsing

- TXT and Markdown parsing are the most reliable paths.
- PDF and DOCX parsing depend on available extraction quality and may return partial content with warnings.
- OCR is adapter-based but no live OCR provider is configured.
- CAD, BIM, and rich spreadsheet intelligence are placeholders for future parsing passes.

## Knowledge and Retrieval

- The vector storage abstraction currently supports an in-memory adapter.
- Embedding provider availability must be configured before production-grade semantic retrieval.
- Supabase pgvector or another durable vector store should replace memory storage before broad beta usage.
- Search confidence is a deterministic foundation and should be calibrated with real customer documents.

## AI Providers

- OpenAI and Mock are the practical beta execution paths.
- Anthropic, Gemini, and OpenRouter are represented in orchestration metadata but require provider adapters before live execution.
- Provider failover is deterministic but not a substitute for production monitoring and provider SLAs.
- Streaming, retries, circuit breakers, and billing-aware routing are intentionally deferred.

## Exports

- PDF and DOCX export are implemented for normalized reports.
- Complex page-perfect corporate templates are not yet supported.
- Exported files are generated from available structured analysis only; missing analysis data is not invented.

## Collaboration

- Roles, permissions, comments, review workflow, timeline, and audit log are implemented as foundations.
- Durable collaboration persistence should be completed before large multi-team usage.
- Notifications are not automatically emitted from every collaboration event yet.

## Security

- CSP is configured for production readiness but may remain permissive/report-first depending on deployment configuration.
- Shared distributed rate limiting requires `RATE_LIMIT_PROVIDER=upstash` and valid Upstash credentials.
- Virus scanning for uploads is documented as a future hook.
- Penetration testing and dependency audit require a network-enabled environment before launch.

## Performance

- Large enterprise pages are acceptable for private beta but should be monitored.
- Further route-level code splitting may be useful after real usage metrics are available.
- React Server Component and dynamic import optimization should remain incremental to avoid regressions.

## Operational Limitations

- Monitoring integrations are prepared but require deployment-time configuration.
- Rollback procedures depend on the hosting provider and applied database migration state.
- Private beta should begin with a small number of known users and a clear support workflow.

## Not Included in v1.0 Private Beta

- Public self-serve onboarding at scale.
- Payment provider execution.
- Live OCR provider.
- Durable vector database.
- Voice interface.
- Multi-agent orchestration.
- Realtime collaborative editing.
- Full SIEM integration.
