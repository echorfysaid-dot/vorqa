# Reports & Analytics Production Foundation

Sprint 16.7 adds a production-ready frontend analytics architecture for Vorqa AI without changing authentication, RLS, OpenAI, marketplace, RFQ, contracts, or database schema.

## Architecture

Analytics follows the existing repository pattern:

`UI -> analyticsRepository -> demo/supabase adapter -> analyticsMapper -> domain models`

Files:

- `lib/models/analytics.ts`
- `lib/repositories/analyticsRepository.ts`
- `lib/repositories/analyticsDemoAdapter.ts`
- `lib/repositories/analyticsSupabaseAdapter.ts`
- `lib/repositories/analyticsMapper.ts`
- `lib/repositories/analyticsHooks.ts`

## Repository Methods

- `getOrganizationKPIs()`
- `getProjectKPIs()`
- `getBudgetKPIs()`
- `getTaskKPIs()`
- `getTimelineKPIs()`
- `getKnowledgeKPIs()`
- `getDashboardSummary()`

## KPI Engine

The KPI engine calculates:

- Project Health
- Budget Health
- Timeline Health
- Task Completion
- Milestone Completion
- Employee Workload
- Department Workload
- Knowledge Coverage
- Document Coverage
- Risk Score

All calculations use existing repositories for projects, employees, tasks, timeline, budget, documents, knowledge, and VORA AI memory.

## Dashboard Widgets

The dashboard now consumes analytics summary data for:

- Budget Health
- Risk Score
- Project Health
- Timeline Health
- Budget Health trend bars
- Recent AI insights

The existing dashboard layout is preserved.

## Project Reports

The Project Workspace Reports tab now includes:

- Executive, Daily, Weekly, Monthly, Budget, Timeline, Risk, and Progress report definitions
- Health cards
- Task distribution chart
- Department performance chart
- Knowledge activity chart
- KPI matrix
- VORA analytics insights
- Existing search, filters, preview, and export-placeholder actions

## Export Architecture

Export controls remain UI-only for:

- PDF
- Excel
- CSV

No backend export implementation was added in this sprint.

## Demo / Supabase / Auto

Demo mode generates realistic construction KPIs from repository-backed demo data.

Supabase mode uses the same repository calls and therefore inherits the existing Supabase adapters for projects, tasks, timeline, budget, documents, knowledge, and organization data.

Auto mode continues to prefer Supabase and fall back through repository behavior.

## Current Limits

- No new database table was introduced.
- Analytics are computed at read time in the frontend repository layer.
- Supabase aggregation is not optimized with database views yet.
- Export buttons are prepared visually but do not generate files.
- Permission denial depends on the underlying repositories and RLS from previous production modules.
