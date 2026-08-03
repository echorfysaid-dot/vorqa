# Supabase Integration

Sprint 14.1 connects the frontend repository layer to the existing Supabase project data without changing schema, RLS, authentication behavior, OpenAI integration, API routes, or business logic.

## Data Source Modes

Set `NEXT_PUBLIC_DATA_SOURCE`:

- `demo`: always use local demo repositories.
- `supabase`: use Supabase-backed repositories only. If data is unavailable, return safe empty or missing-record states. Do not substitute demo records.
- `auto`: use Supabase when configured and an authenticated session is available. Fall back to demo data only when Supabase is unavailable, not configured, or no usable client session exists.

Default is `demo`.

## Existing Supabase Tables Discovered

The existing schema includes:

- `profiles`: `id`, `email`, `full_name`, `avatar_url`, `plan`, `preferred_language`, `created_at`, `updated_at`
- `projects`: `id`, `owner_id`, `title`, `type`, `status`, `metadata`, `created_at`, `updated_at`
- `documents`: `id`, `owner_id`, `project_id`, `title`, `content`, `language`, `document_type`, `created_at`, `updated_at`
- `generation_history`: `id`, `owner_id`, `project_id`, `tool_slug`, `provider`, `input_payload`, `output_content`, `created_at`
- `favorites`: `id`, `owner_id`, `generation_id`, `created_at`
- `user_settings`: `owner_id`, `theme`, `default_provider`, `notifications_enabled`, `updated_at`
- `knowledge_files`: `id`, `owner_id`, `project_id`, `storage_path`, `original_name`, `mime_type`, `size`, `status`, `created_at`
- `tasks`: available after applying `database/migrations/20260718_tasks_foundation.sql`
- `milestones` and `task_dependencies`: available after applying `database/migrations/20260718_timeline_foundation.sql`
- `budget_categories` and `project_budget_items`: available after applying `database/migrations/20260718_budget_foundation.sql`
- extended `documents` metadata and `vorqa-project-documents` Storage bucket support: available after applying `database/migrations/20260718_documents_foundation.sql` and manually creating the bucket

No compatible `organizations` table exists in the current schema.

## Projects Integration

The project repository uses the existing protected `/api/projects` endpoint. Pages do not call Supabase directly.

The API route verifies the Supabase bearer token, verifies the authenticated user, queries `projects?owner_id=eq.{user.id}`, and relies on existing RLS plus `owner_id` policies.

## Project Field Mapping

| Supabase field | Frontend field |
| --- | --- |
| `id` | `id` |
| `title` | `title` |
| `type` | `type`, unless `metadata.projectType` exists |
| `status` | `status`, unless `metadata.statusLabel` exists |
| `updated_at` | `updatedAt` |
| `metadata.score` | `score`, default `0` |
| `metadata.budget` | `budget`, default `Not set` |
| `metadata.timeline` | `timeline`, default `Not scheduled` |
| `metadata.team` | `team`, default `0` |
| `metadata.documents` | `documents`, default `0` |
| `metadata.knowledgeFiles` | `knowledgeFiles`, default `0` |
| `metadata.phase` | `phase`, default `status` |

Missing optional UI fields use safe display defaults rather than fabricated production metrics.

## Organizations Integration Status

Organizations remain demo-backed because no compatible production table or relationship exists.

Future backend requirements include an `organizations` table, organization membership or ownership relationships, optional departments/employees/roles tables, and RLS policies scoped by authenticated membership.

## Authentication and RLS Assumptions

- Supabase mode requires an authenticated client session.
- Repository calls use the existing authenticated fetch flow and send `Authorization: Bearer <access_token>`.
- `owner_id` is the authoritative ownership column for private user-owned tables.
- Client code does not manually trust `owner_id` input.
- No service-role key is used client-side.
- No RLS policy is changed in this sprint.

## Demo Fallback Behavior

- `demo`: demo only.
- `supabase`: no demo fallback.
- `auto`: fallback to demo only when Supabase/config/session/data access is unavailable.

Invalid project IDs no longer silently return `PRJ-1048`; the project workspace shows a safe missing-record state.

## Recommended Next Steps

1. Add compatible organizations schema and RLS in a dedicated backend sprint.
2. Add project detail API support for `GET /api/projects/[id]`.
3. Migrate project workspace detail metadata from demo-only `projectDetails` into Supabase.
4. Connect dashboards to real aggregates after production data shape is complete.

## Sprint 16.1 Tasks Foundation

Migration file:

- `database/migrations/20260718_tasks_foundation.sql`

Repository files:

- `taskRepository.ts`
- `taskDemoAdapter.ts`
- `taskSupabaseAdapter.ts`
- `taskMapper.ts`
- `taskHooks.ts`

The task repository supports demo, Supabase, and auto data modes. Project pages use `useTasksRepository(projectId)` and repository write methods for create, update, archive, move, progress update, and assignment.

RLS depends on organization helper functions created by the Organizations foundation:

- `public.is_organization_member`
- `public.is_organization_owner`
- `public.has_organization_permission`

The migration is not executed automatically.

## Sprint 16.4 Documents and Storage Foundation

Migration file:

- `database/migrations/20260718_documents_foundation.sql`

Expected Storage bucket:

- `vorqa-project-documents`

Repository files:

- `documentRepository.ts`
- `documentDemoAdapter.ts`
- `documentSupabaseAdapter.ts`
- `documentMapper.ts`
- `documentHooks.ts`

The document repository supports demo, Supabase, and auto data modes. Project pages use `useDocumentsRepository(projectId)` and repository write methods for upload, metadata update, archive, delete, and download.

The migration is not executed automatically, and the Storage bucket is not created automatically.

## Sprint 16.3 Budget Foundation

Migration file:

- `database/migrations/20260718_budget_foundation.sql`

Repository files:

- `budgetRepository.ts`
- `budgetDemoAdapter.ts`
- `budgetSupabaseAdapter.ts`
- `budgetMapper.ts`
- `budgetHooks.ts`

The budget repository supports demo, Supabase, and auto data modes. Project pages use `useBudgetRepository(projectId)` and repository write methods for budget category CRUD and budget item CRUD.

RLS depends on the Organizations, Projects, and Departments foundations.

The migration is not executed automatically.

## Sprint 16.2 Timeline Foundation

Migration file:

- `database/migrations/20260718_timeline_foundation.sql`

Repository files:

- `timelineRepository.ts`
- `timelineDemoAdapter.ts`
- `timelineSupabaseAdapter.ts`
- `timelineMapper.ts`
- `timelineHooks.ts`

The timeline repository supports demo, Supabase, and auto data modes. Project pages use `useTimelineRepository(projectId)` and repository write methods for milestone CRUD and dependency CRUD.

RLS depends on the Organizations and Tasks foundations. Dependency visibility and management are resolved from the related task rows and their shared organization.

The migration is not executed automatically.

## Sprint 15.1 Organizations Foundation

Migration file:

- `database/migrations/20260718_organizations_foundation.sql`

Tables added:

- `organizations`
- `organization_roles`
- `organization_members`

RLS helper functions added:

- `public.is_organization_owner`
- `public.is_organization_member`
- `public.has_organization_permission`

RLS behavior:

- anonymous users have no organization access
- users can select organizations where they are the owner or an active member
- organization owners can insert, update, and delete their organizations
- role permissions can allow members to manage organizations, roles, and members through `manage_organization`, `manage_roles`, and `manage_members`

Repository behavior:

- `organizationSupabaseAdapter` now reads organizations using authenticated Supabase REST calls
- it uses `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the current bearer token
- it does not use service-role credentials client-side
- `demo`, `supabase`, and `auto` modes remain available

## Sprint 15.2 Organization Management

Organizations now support repository-level CRUD without bypassing RLS:

- `GET` list/detail through authenticated Supabase REST
- `POST` create organization with `owner_id` set from the authenticated Supabase user
- `PATCH` update owner/admin-managed organization fields
- soft delete through status update to `Archived`
- duplicate slug checks through the repository

The Supabase adapter sends the current user bearer token and relies on database RLS for ownership and membership enforcement. It never uses `SUPABASE_SERVICE_ROLE_KEY` in browser code.

Supported fields in the mapper include:

- `name`
- `slug`
- `legal_name`
- `registration_number`
- `tax_number`
- `website`
- `logo_url`
- `industry`
- `company_size`
- `address`
- `city`
- `country`
- `timezone`
- `currency`
- `contact_email`
- `contact_phone`
- `owner_id`
- `status`

Current limitations:

- organization member counts are not aggregated from Supabase yet
- organization project counts are placeholders until project scoping is connected
- role permissions are enforced by RLS, but the frontend owner/admin check remains a UI affordance only
- `/organizations/atlas` remains the legacy demo Atlas workspace for continuity

## Sprint 15.3 Organization Members and Roles

Membership and role management now use the same authenticated repository architecture as organizations.

Supabase tables used:

- `organization_roles`
- `organization_members`
- `profiles`

Role operations:

- list roles by `organization_id`
- load a role by `id`
- insert role records
- patch role records
- delete unused non-built-in roles

Member operations:

- list members by `organization_id`
- load a member by `id`
- add an existing `profiles.id` to an organization
- update `role_id` and `status`
- soft-remove members by setting status to `removed`

Supported permission keys:

- `manage_organization`
- `manage_roles`
- `manage_members`

Security behavior:

- every Supabase request uses the public anon key plus the authenticated bearer token
- no service-role credential is used in browser code
- RLS remains the source of truth for owner, permitted member, ordinary member, anonymous, and archived-organization access
- raw policy errors are translated into friendlier UI messages

Current limitation:

- there is no email invitation system in the schema, so member addition is limited to existing profile/user IDs

## Sprint 15.4 Departments

Departments are now prepared for production Supabase usage.

Migration file:

- `database/migrations/20260718_departments_foundation.sql`

Supabase table:

- `departments`

Relationships:

- `departments.organization_id -> organizations.id`
- `departments.lead_user_id -> profiles.id`

RLS:

- owners and active organization members can read departments
- owners and members with `manage_organization` can insert, update, and delete
- anonymous access is not permitted

Frontend access:

- `departmentSupabaseAdapter` uses the public anon key plus authenticated bearer token
- no service-role key is exposed client-side
- pages use `departmentRepository` and `useDepartmentsRepository`

Application behavior:

- department archive uses a soft status update to `archived`
- duplicate department slugs are checked per organization
- no employee table is assumed; lead selection is limited to existing profile/user IDs

## Sprint 15.5 Employees

Employees are now prepared for production Supabase usage.

Migration file:

- `database/migrations/20260718_employees_foundation.sql`

Supabase table:

- `employees`

Relationships:

- `employees.organization_id -> organizations.id`
- `employees.department_id -> departments.id`
- `employees.profile_id -> profiles.id`
- `employees.manager_id -> employees.id`

RLS:

- organization owners and active members can read employees
- owners and members with `manage_organization` can insert, update, and delete
- anonymous access is not permitted

Frontend access:

- `employeeSupabaseAdapter` uses the public anon key plus authenticated bearer token
- pages use `employeeRepository` and `useEmployeesRepository`
- no service-role key is exposed client-side

Application behavior:

- archive uses a soft status update to `archived`
- duplicate employee numbers are checked per organization
- department selection is validated against the current organization

## Sprint 16.0 Projects

Projects are now prepared for organization-aware production usage.

Migration file:

- `database/migrations/20260718_project_foundation.sql`

Extended table:

- `projects`

New table:

- `project_members`

Relationships:

- `projects.organization_id -> organizations.id`
- `projects.department_id -> departments.id`
- `projects.project_manager_id -> employees.id`
- `project_members.project_id -> projects.id`
- `project_members.employee_id -> employees.id`

RLS:

- project owners and organization members can read projects
- owners and members with `manage_organization` can manage projects
- project members are visible through project/organization access

Frontend access:

- `projectSupabaseAdapter` uses the public anon key plus authenticated bearer token
- pages use `projectRepository` and project hooks
- no service-role key is exposed client-side

Application behavior:

- archive uses a soft status update
- project slug uniqueness is checked per organization
- department and manager selection are validated against the organization

## Sprint 16.5 Knowledge Base

Knowledge articles are now prepared for production Supabase usage.

Migration file:

- `database/migrations/20260719_knowledge_foundation.sql`

Supabase table:

- `knowledge_articles`

Relationships:

- `knowledge_articles.organization_id -> organizations.id`
- `knowledge_articles.project_id -> projects.id`
- `knowledge_articles.document_id -> documents.id`
- `knowledge_articles.created_by -> profiles.id`

RLS:

- active organization members can read articles
- organization owners and members with `manage_organization` can create, update, and archive
- anonymous access is not permitted

Frontend access:

- `knowledgeSupabaseAdapter` uses the public anon key plus authenticated bearer token through the shared REST helper
- pages use `knowledgeRepository` and `useKnowledgeRepository`
- no service-role key is exposed client-side

Application behavior:

- archive is soft via `status = archived`
- project and related document scope are validated before writes
- demo mode and auto fallback remain available
- no embeddings, OCR, RAG, or OpenAI calls are introduced in this sprint

## Sprint 16.6 VORA AI Intelligence

VORA now builds a project intelligence context before generation.

Context flow:

- `aiContextRepository` gathers context through repositories.
- `vora-prompt-composer` converts context and user input into a prompt snapshot.
- `/api/generate` keeps the same authenticated OpenAI and persistence flow.
- `saveGeneration` stores memory metadata in the existing payload/metadata structure.

Supabase behavior:

- no service-role secret is exposed
- no RLS policy is weakened
- no new table is required
- demo / Supabase / auto modes remain available through the repositories

Future integration:

- promote memory metadata into first-class `generation_history` columns
- add conversation threads when chat persistence is ready
- add context snapshot audit rows for enterprise compliance

## Sprint 16.7 Reports & Analytics

Reports and analytics now use a dedicated repository layer.

Flow:

- `analyticsRepository` exposes dashboard and KPI methods.
- `analyticsDemoAdapter` creates realistic construction KPIs from existing repository data.
- `analyticsSupabaseAdapter` preserves the same repository-backed source path for production mode.
- `analyticsMapper` calculates health, risk, coverage, trend, and chart data.

Supabase behavior:

- no service-role key is exposed
- no direct UI Supabase calls are introduced
- no RLS policy is changed
- no database migration is required
- demo / Supabase / auto modes remain available

Future production optimization:

- add materialized analytics views when datasets become large
- add scheduled report runs
- add generated report export storage

## Sprint 18.0 Marketplace Production Foundation

Marketplace now follows the same repository architecture as the core production modules.

Flow:

- `marketplaceRepository` exposes category, company, search, featured, and dashboard widget methods.
- `marketplaceDemoAdapter` serves the existing realistic construction marketplace data.
- `marketplaceSupabaseAdapter` is prepared for a future `marketplace_companies` table.
- `marketplaceMapper` normalizes demo and future Supabase records into the shared domain model.
- `marketplaceHooks` provide client-safe loading, error, demo, Supabase, and auto-mode state.

Supabase behavior:

- no service-role key is exposed
- no direct UI Supabase calls are introduced
- no RLS policy is changed in this sprint
- no database migration is required
- auto mode falls back to demo data if the future marketplace table is unavailable

Future setup:

- create `marketplace_companies` and related service/review/portfolio/certification tables
- add RLS for organization-managed company profiles
- decide which company fields are public, authenticated-only, or owner-only
- connect RFQ supplier selection to marketplace company IDs

## Sprint 18.1 RFQ Management Production Foundation

RFQ management now follows the same repository architecture as the production modules.

Flow:

- `rfqRepository` exposes RFQ list, detail, create, update, summary, quotation, wizard step, and award step methods.
- `rfqDemoAdapter` serves realistic construction RFQs.
- `rfqSupabaseAdapter` is prepared for a future `rfqs` table.
- `rfqMapper` normalizes demo and future Supabase records into the shared RFQ domain model.
- `rfqHooks` provide client-safe loading, error, demo, Supabase, and auto-mode state.

Supabase behavior:

- no service-role key is exposed
- no direct UI Supabase calls are introduced
- no RLS policy is changed in this sprint
- no database migration is required
- auto mode falls back to demo data if the future RFQ table is unavailable

Future setup:

- create RFQ tables and RLS policies
- connect RFQ suppliers to marketplace company IDs
- connect RFQ attachments to documents
- connect supplier responses and quotation comparison to persisted RFQ response records
- allow VORA to call the existing AI context engine for RFQ scope and supplier analysis

## Sprint 18.2 Quotation Management Production Foundation

No database migration was introduced in Sprint 18.2.

Quotation management now has repository, adapter, mapper, hooks, comparison, recommendation, dashboard, and top-level route foundations.

Flow:

- `quotationRepository` exposes quotation list, detail, RFQ-scoped quotation, comparison, and dashboard summary methods.
- `quotationDemoAdapter` serves realistic construction supplier quotations.
- `quotationSupabaseAdapter` is prepared for a future `quotations` table.
- `quotationMapper` normalizes quotation records, calculates line-item totals, builds comparison matrices, and creates recommendation outputs.
- `quotationHooks` provide client-safe loading, error, demo, Supabase, and auto-mode state.

Supabase behavior:

- no service-role key is exposed
- no direct UI Supabase calls are introduced
- no RLS policy is changed in this sprint
- no database migration is required
- auto mode falls back to demo data if the future quotation table is unavailable

Future setup:

- create `quotations`, `quotation_items`, `quotation_documents`, and `quotation_evaluations`
- connect quotations to `rfqs`, `marketplace_companies`, `projects`, and `documents`
- add organization and invited-supplier RLS
- persist reviewer notes, award recommendations, and comparison snapshots
- connect winning quotations to contract creation

## Sprint 18.3 Contract & Award Management Foundation

No database migration was introduced in Sprint 18.3.

Contract management now has repository, adapter, mapper, hooks, award metadata, approval lifecycle, payment schedule, milestone, deliverable, dashboard, and route foundations.

Flow:

- `contractRepository` exposes contract list, detail, and summary methods.
- `contractDemoAdapter` serves realistic construction contract data.
- `contractSupabaseAdapter` is prepared for a future `contracts` table.
- `contractMapper` normalizes contract records, connects demo awards to quotation and RFQ references, and builds contract dashboard summaries.
- `contractHooks` provide client-safe loading, error, demo, Supabase, and auto-mode state.

Supabase behavior:

- no service-role key is exposed
- no direct UI Supabase calls are introduced
- no RLS policy is changed in this sprint
- no database migration is required
- auto mode falls back to demo data if the future contract table is unavailable

Future setup:

- create `contracts`, `contract_awards`, `contract_parties`, `contract_milestones`, `contract_deliverables`, `contract_payments`, `contract_approvals`, `contract_amendments`, and `contract_documents`
- connect contracts to RFQs, quotations, projects, organizations, marketplace suppliers, and documents
- add RLS for organization members, project members, procurement managers, finance reviewers, and supplier-side contract access
- persist amendment history and approval decisions
- connect contract creation to the quotation award workflow

## Sprint 18.4 Marketplace Backend Production Foundation

Sprint 18.4 introduces the real Marketplace backend schema and repository methods, but does not apply the migration automatically.

Migration:

- `database/migrations/20260719_marketplace_backend.sql`

Tables:

- `marketplace_companies`
- `marketplace_company_categories`
- `marketplace_company_services`
- `marketplace_company_locations`
- `marketplace_portfolios`
- `marketplace_reviews`
- `marketplace_connections`
- `marketplace_messages`
- `marketplace_favorites`
- `marketplace_certifications`

Repository flow:

- `marketplaceRepository` remains the public interface.
- `marketplaceSupabaseAdapter` now supports CRUD, pagination, filtering, sorting, favorites, connections, messages, reviews, and portfolio persistence.
- `marketplaceDemoAdapter` mirrors the production method surface so demo mode stays intact.
- `marketplaceMapper` maps Supabase rows and input payloads.

RLS summary:

- verified published companies are publicly readable
- company owners and organization managers can manage company profiles and child records
- authenticated users can create reviews
- connection participants can read and write connection messages
- favorites are private to the profile or organization context

No service-role key is exposed. All Supabase calls continue through the authenticated REST helper.

## Sprint 18.5 Notifications Foundation

Sprint 18.5 prepares production notifications while keeping demo and auto fallback behavior intact.

Migration:

- `database/migrations/20260719_notifications_foundation.sql`

Repository flow:

- `notificationRepository` is the public interface.
- `notificationDemoAdapter` serves realistic construction, RFQ, quotation, contract, document, and VORA AI notifications.
- `notificationSupabaseAdapter` uses the existing authenticated REST helper and never exposes service-role secrets.
- `notificationMapper` normalizes Supabase rows into the `Notification` domain model and builds summary KPIs.
- `notificationHooks` provide client-safe loading, error, source, and fallback state.

Supabase behavior:

- no migration is executed automatically
- auto mode falls back to demo data when the notification tables are unavailable
- notification actions are prepared for mark-read, mark-all-read, archive, and soft delete
- preferences are prepared for in-app, email, push, SMS, muted modules, and priority thresholds

RLS summary:

- anonymous users have no access
- recipients and owners can read their own notifications
- organization members can read organization-scoped notifications
- organization owners and members with `manage_organization` can manage organization notifications
- users can manage their own notification preferences

Future setup:

- apply the migration manually
- emit notifications from project, RFQ, quotation, contract, document, and VORA AI services
- add realtime subscriptions
- connect email, push, and SMS providers
- add audit logging for notification lifecycle actions

## Sprint 19.1 Billing Foundation

Sprint 19.1 prepares SaaS billing while preserving demo/Supabase/auto modes and avoiding live payment provider integration.

Migration:

- `database/migrations/20260720_billing_foundation.sql`

Tables:

- `billing_plans`
- `organization_subscriptions`
- `billing_usage_records`
- `billing_invoices`
- `billing_payment_methods`

Repository flow:

- `billingRepository` is the public interface.
- `billingDemoAdapter` serves Atlas demo plan, usage, invoices, and trial data.
- `billingSupabaseAdapter` reads future Supabase billing tables through the authenticated REST helper.
- `billingMapper` maps database rows into domain models and calculates remaining quota.
- `billingHooks` provide client-safe loading, source, and fallback state.

RLS summary:

- authenticated users can read plan definitions
- organization members can read organization billing summaries
- organization owners and `manage_organization` members can manage subscription records
- payment methods are restricted to organization managers

Future setup:

- apply the migration manually
- seed `billing_plans`
- connect Stripe, Lemon Squeezy, or manual invoice providers
- add webhook handlers
- increment usage from production module events
- enforce quotas after private beta validation

## Sprint 19.2 Administration Foundation

The Administration Panel follows the same repository pattern as the rest of VORQA:

- Demo mode uses local operational demo records.
- Auto mode attempts future Supabase admin views first, then safely falls back to demo data.
- Supabase mode expects platform-admin-only views or RPC endpoints and returns safe empty states until those are implemented.

No service-role key is used by the frontend admin repository. Production admin access must be enforced by dedicated server-side APIs, database roles, or RLS-protected views before platform-wide data is connected.
