# Vorqa AI Production Database Architecture

Sprint 15.0 is design-only. This document does not create migrations, tables, policies, triggers, APIs, repositories, UI, or authentication changes.

## Current Schema Analysis

The current Supabase schema is user-owned and MVP-oriented. Private tables use `owner_id` as the ownership column.

Sprint 15.1 added the first multi-tenant organization foundation. Sprint 15.3 now consumes the membership and role tables from the frontend repository layer without adding new schema.
Sprint 16.1 adds the planned `tasks` production foundation as a standalone migration, connected through the repository layer but not applied automatically.
Sprint 16.2 adds the planned `milestones` and `task_dependencies` production foundation as a standalone migration, connected through the repository layer but not applied automatically.
Sprint 16.3 adds the planned `budget_categories` and `project_budget_items` production foundation as a standalone migration, connected through the repository layer but not applied automatically.
Sprint 16.4 adds the planned project document metadata and Supabase Storage foundation as a standalone migration, connected through the repository layer but not applied automatically.

### Current Tables

#### `profiles`

- Primary key: `id uuid`
- Relationship: `id` references `auth.users(id)` with cascade delete
- Columns:
  - `email text unique not null`
  - `full_name text`
  - `avatar_url text`
  - `plan text default starter`
  - `preferred_language text default ar`
  - `created_at timestamptz`
  - `updated_at timestamptz`
- RLS: users can select, insert, and update only their own profile using `auth.uid() = id`.

#### `projects`

- Primary key: `id uuid`
- Ownership: `owner_id uuid not null references profiles(id)`
- Columns:
  - `title text`
  - `type text`
  - `status text`
  - `metadata jsonb`
  - `created_at timestamptz`
  - `updated_at timestamptz`
- RLS: users can access rows where `auth.uid() = owner_id`.
- Current limitation: project data is user-owned, not organization-owned.

#### `documents`

- Primary key: `id uuid`
- Ownership: `owner_id uuid not null references profiles(id)`
- Relationship: `project_id uuid references projects(id) on delete set null`
- Columns:
  - `title text`
  - `document_type text`
  - `language text`
  - `content text`
  - `created_at timestamptz`
  - `updated_at timestamptz`
- RLS: owner-only access.

#### `generation_history`

- Primary key: `id uuid`
- Ownership: `owner_id uuid not null references profiles(id)`
- Relationship: `project_id uuid references projects(id) on delete set null`
- Columns:
  - `tool_slug text`
  - `provider text`
  - `input_payload jsonb`
  - `output_content text`
  - `created_at timestamptz`
- RLS: owner-only access.

#### `tasks` (Sprint 16.1 migration)

- Primary key: `id uuid`
- Relationships:
  - `project_id references projects(id)`
  - `organization_id references organizations(id)`
  - `department_id references departments(id)`
  - `assignee_employee_id references employees(id)`
  - `parent_task_id references tasks(id)`
- Workflow fields:
  - `status`: `todo`, `in_progress`, `review`, `blocked`, `done`, `archived`
  - `priority`: `low`, `medium`, `high`, `critical`
  - `progress integer`
  - `estimated_hours numeric`
  - `actual_hours numeric`
  - `start_date`, `due_date`, `completed_at`
- RLS: organization members can read, organization owners/managers can manage, assigned active employees can update their task rows.

#### `milestones` (Sprint 16.2 migration)

- Primary key: `id uuid`
- Relationships:
  - `project_id references projects(id)`
  - `organization_id references organizations(id)`
- Timeline fields:
  - `title text`
  - `description text`
  - `status`: `planned`, `in_progress`, `completed`, `delayed`, `archived`
  - `progress integer`
  - `start_date`, `due_date`, `completed_at`
  - `metadata jsonb`
- RLS: organization members can read, organization owners/managers can manage.

#### `task_dependencies` (Sprint 16.2 migration)

- Primary key: `id uuid`
- Relationships:
  - `predecessor_task_id references tasks(id)`
  - `successor_task_id references tasks(id)`
- Dependency type:
  - `finish_to_start`
  - `start_to_start`
  - `finish_to_finish`
  - `start_to_finish`
- Constraints: no self-dependency and no duplicate predecessor/successor/type rows.
- RLS: access is resolved through related task organization membership and manager permissions.

#### `budget_categories` (Sprint 16.3 migration)

- Primary key: `id uuid`
- Relationship: `organization_id references organizations(id)`
- Fields:
  - `name text`
  - `description text`
  - `color text`
- Constraint: unique `(organization_id, name)`
- RLS: organization members can read, organization owners/managers can manage.

#### `project_budget_items` (Sprint 16.3 migration)

- Primary key: `id uuid`
- Relationships:
  - `project_id references projects(id)`
  - `organization_id references organizations(id)`
  - `category_id references budget_categories(id)`
  - `department_id references departments(id)`
- Cost fields:
  - `planned_cost numeric`
  - `actual_cost numeric`
  - `committed_cost numeric`
- Workflow fields:
  - `status`: `planned`, `approved`, `committed`, `paid`, `over_budget`, `archived`
  - `priority`: `low`, `medium`, `high`, `critical`
  - `start_date`, `end_date`
  - `metadata jsonb`
- RLS: organization members can read, organization owners/managers can manage.

#### `documents` extensions (Sprint 16.4 migration)

- Existing table remains backward compatible with generated documents.
- New metadata fields:
  - `organization_id references organizations(id)`
  - `department_id references departments(id)`
  - `uploader_id references profiles(id)`
  - `category text`
  - `version text`
  - `filename text`
  - `storage_path text`
  - `file_size bigint`
  - `mime_type text`
  - `tags text[]`
  - `archived boolean`
  - `metadata jsonb`
- Storage bucket expected: `vorqa-project-documents`
- RLS: owner access is preserved; organization members can read organization documents; owners/managers can manage.

#### `favorites`

- Primary key: `id uuid`
- Ownership: `owner_id uuid not null references profiles(id)`
- Relationship: `generation_id uuid references generation_history(id)`
- Constraint: unique `(owner_id, generation_id)`
- RLS: owner-only access.

#### `user_settings`

- Primary key: `owner_id uuid references profiles(id)`
- Ownership: `owner_id`
- Columns:
  - `theme text`
  - `default_provider text`
  - `notifications_enabled boolean`
  - `created_at timestamptz`
  - `updated_at timestamptz`
- RLS: owner-only access.

#### `knowledge_files`

- Primary key: `id uuid`
- Ownership: `owner_id uuid not null references profiles(id)`
- Relationship: `project_id uuid not null references projects(id)`
- Columns:
  - `storage_path text unique`
  - `original_name text`
  - `mime_type text`
  - `size bigint`
  - `status text`
  - `created_at timestamptz`
- RLS: owner-only access.
- Storage: `knowledge` bucket paths are scoped by first folder segment matching `auth.uid()`.

### Missing Production Entities

The current schema does not include:

- organizations
- memberships
- organization roles and permissions
- departments
- employees
- tasks
- milestones
- budgets
- timelines
- reports
- marketplace companies and services
- RFQs and quotations
- contracts and contract milestones
- notifications
- activity logs
- audit logs

### Implemented Organization Foundation Tables

#### `organizations`

- Primary key: `id uuid`
- Ownership: `owner_id uuid references profiles(id)`
- Tenant identifier: `slug text unique`
- Status values: `active`, `invited`, `suspended`, `archived`
- RLS: visible to organization owners and active members.

#### `organization_roles`

- Primary key: `id uuid`
- Relationship: `organization_id uuid references organizations(id)`
- Columns:
  - `name text`
  - `description text`
  - `permissions jsonb`
  - `created_at timestamptz`
- Constraint: unique `(organization_id, name)`
- Permission keys currently used by RLS:
  - `manage_organization`
  - `manage_roles`
  - `manage_members`

#### `organization_members`

- Primary key: `id uuid`
- Relationships:
  - `organization_id uuid references organizations(id)`
  - `user_id uuid references profiles(id)`
  - `role_id uuid references organization_roles(id) on delete set null`
- Columns:
  - `joined_at timestamptz`
  - `status text`
- Status values: `active`, `invited`, `suspended`, `removed`
- Constraint: unique `(organization_id, user_id)`

#### Current Organization Limitations

- no invitation token table
- no invited-by or invitation expiration fields
- no employee production table yet
- projects are not yet organization-scoped
- member addition requires an existing `profiles.id`

### Implemented Departments Foundation

Sprint 15.4 adds `departments`.

Columns:

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `name text`
- `slug text`
- `description text`
- `lead_user_id uuid references profiles(id)`
- `status text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

Constraints:

- unique `(organization_id, slug)`
- status values: `active`, `suspended`, `archived`

RLS:

- read for organization owners and active members
- write for owners and members with `manage_organization`

Current limitation:

- department leads are profile/user references until the production `employees` table exists

### Implemented Employees Foundation

Sprint 15.5 adds `employees`.

Columns:

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `department_id uuid references departments(id)`
- `profile_id uuid references profiles(id)`
- `manager_id uuid references employees(id)`
- `employee_number text`
- `first_name text`
- `last_name text`
- `job_title text`
- `phone text`
- `employment_type text`
- `status text`
- `hire_date date`
- `avatar_url text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

Constraints:

- unique `(organization_id, employee_number)`
- status values: `active`, `away`, `pending`, `inactive`, `archived`

RLS:

- read for organization owners and active members
- write for owners and members with `manage_organization`

Current limitation:

- dedicated HR permission keys are not yet implemented
- project assignment and workforce planning tables are future modules

### Implemented Projects Foundation

Sprint 16.0 extends `projects` and adds `project_members`.

Added `projects` columns:

- `organization_id uuid references organizations(id)`
- `department_id uuid references departments(id)`
- `project_manager_id uuid references employees(id)`
- `slug text`
- `description text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

New `project_members` table:

- `id uuid primary key`
- `project_id uuid references projects(id)`
- `employee_id uuid references employees(id)`
- `role text`
- `joined_at timestamptz`
- `status text`

RLS:

- project owner access remains supported through `owner_id`
- organization member visibility is supported through `organization_id`
- organization owners and members with `manage_organization` can manage projects and project members

## Complete Future Production Schema

The future architecture should move Vorqa from a user-owned workspace into a multi-tenant construction operating system.

### Identity and Tenancy

#### `profiles`

Keep the current table and extend carefully if needed.

Recommended additional future fields:

- `phone`
- `job_title`
- `default_organization_id`
- `last_seen_at`

#### `organizations`

Purpose: tenant boundary for companies, investors, contractors, suppliers, and design offices.

Recommended columns:

- `id uuid primary key`
- `owner_id uuid references profiles(id)`
- `name text not null`
- `legal_name text`
- `registration_number text`
- `tax_number text`
- `logo_url text`
- `website text`
- `industry text`
- `company_size text`
- `address jsonb`
- `city text`
- `country text`
- `timezone text`
- `currency text`
- `contact_email text`
- `contact_phone text`
- `status text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `organization_members`

Purpose: membership and tenant access.

Recommended columns:

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `profile_id uuid references profiles(id)`
- `role_id uuid references organization_roles(id)`
- `status text`
- `invited_by uuid references profiles(id)`
- `invited_at timestamptz`
- `accepted_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Unique constraint:

- `(organization_id, profile_id)`

#### `organization_roles`

Purpose: role templates and custom roles per organization.

Recommended columns:

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `name text not null`
- `scope text`
- `permissions jsonb not null default '{}'`
- `is_system boolean default false`
- `created_at timestamptz`
- `updated_at timestamptz`

### Workforce

#### `departments`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `lead_employee_id uuid references employees(id)`
- `name text`
- `description text`
- `status text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `employees`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `profile_id uuid references profiles(id)`
- `department_id uuid references departments(id)`
- `manager_employee_id uuid references employees(id)`
- `full_name text`
- `role_title text`
- `email text`
- `phone text`
- `status text`
- `availability text`
- `workload numeric`
- `skills jsonb`
- `certifications jsonb`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

### Projects and Delivery

#### `projects`

Future projects should become organization-scoped while preserving `owner_id`.

Recommended future columns:

- `organization_id uuid references organizations(id)`
- `owner_id uuid references profiles(id)`
- `code text`
- `title text`
- `type text`
- `status text`
- `phase text`
- `location text`
- `country text`
- `city text`
- `start_date date`
- `expected_completion_date date`
- `progress numeric`
- `budget_planned numeric`
- `currency text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `tasks`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `project_id uuid references projects(id)`
- `assignee_employee_id uuid references employees(id)`
- `created_by uuid references profiles(id)`
- `title text`
- `description text`
- `status text`
- `priority text`
- `start_date date`
- `due_date date`
- `progress numeric`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `milestones`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `project_id uuid references projects(id)`
- `title text`
- `phase text`
- `status text`
- `start_date date`
- `end_date date`
- `progress numeric`
- `dependencies jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `budgets`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `project_id uuid references projects(id)`
- `planned_amount numeric`
- `actual_amount numeric`
- `remaining_amount numeric`
- `currency text`
- `status text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `timelines`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `project_id uuid references projects(id)`
- `name text`
- `baseline_start date`
- `baseline_end date`
- `current_start date`
- `current_end date`
- `status text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

### Documents and Knowledge

#### `documents`

Future documents should be organization-scoped.

Recommended additional columns:

- `organization_id uuid references organizations(id)`
- `created_by uuid references profiles(id)`
- `source_generation_id uuid references generation_history(id)`
- `status text`
- `version integer`
- `metadata jsonb`

#### `knowledge_files`

Recommended additional columns:

- `organization_id uuid references organizations(id)`
- `uploaded_by uuid references profiles(id)`
- `category text`
- `processing_status text`
- `metadata jsonb`

#### `reports`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `project_id uuid references projects(id)`
- `created_by uuid references profiles(id)`
- `title text`
- `report_type text`
- `status text`
- `summary text`
- `content jsonb`
- `generated_from_generation_id uuid references generation_history(id)`
- `created_at timestamptz`
- `updated_at timestamptz`

### Marketplace

#### `marketplace_companies`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `name text`
- `slug text unique`
- `category text`
- `verified boolean`
- `rating numeric`
- `country text`
- `city text`
- `description text`
- `about text`
- `contact jsonb`
- `certifications jsonb`
- `service_areas jsonb`
- `status text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `marketplace_services`

- `id uuid primary key`
- `marketplace_company_id uuid references marketplace_companies(id)`
- `category text`
- `title text`
- `description text`
- `availability text`
- `typical_delivery_time text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

### RFQ and Procurement

#### `rfqs`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `project_id uuid references projects(id)`
- `created_by uuid references profiles(id)`
- `title text`
- `description text`
- `status text`
- `category text`
- `budget_min numeric`
- `budget_max numeric`
- `currency text`
- `due_date date`
- `timeline text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `quotations`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `rfq_id uuid references rfqs(id)`
- `marketplace_company_id uuid references marketplace_companies(id)`
- `submitted_by uuid references profiles(id)`
- `status text`
- `total_price numeric`
- `taxes numeric`
- `delivery_cost numeric`
- `currency text`
- `estimated_duration text`
- `payment_terms text`
- `technical_score numeric`
- `commercial_score numeric`
- `risk_level text`
- `vora_fit_score numeric`
- `content jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

### Contracts

#### `contracts`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `project_id uuid references projects(id)`
- `rfq_id uuid references rfqs(id)`
- `quotation_id uuid references quotations(id)`
- `marketplace_company_id uuid references marketplace_companies(id)`
- `created_by uuid references profiles(id)`
- `contract_number text`
- `title text`
- `status text`
- `value numeric`
- `currency text`
- `start_date date`
- `end_date date`
- `summary text`
- `terms jsonb`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `contract_milestones`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `contract_id uuid references contracts(id)`
- `title text`
- `status text`
- `due_date date`
- `amount numeric`
- `currency text`
- `metadata jsonb`
- `created_at timestamptz`
- `updated_at timestamptz`

### Platform Activity

#### `notifications`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `profile_id uuid references profiles(id)`
- `project_id uuid references projects(id)`
- `category text`
- `priority text`
- `title text`
- `message text`
- `read_at timestamptz`
- `action_href text`
- `metadata jsonb`
- `created_at timestamptz`

#### `activity_logs`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `profile_id uuid references profiles(id)`
- `project_id uuid references projects(id)`
- `entity_type text`
- `entity_id uuid`
- `action text`
- `description text`
- `metadata jsonb`
- `created_at timestamptz`

#### `audit_logs`

- `id uuid primary key`
- `organization_id uuid references organizations(id)`
- `actor_profile_id uuid references profiles(id)`
- `target_profile_id uuid references profiles(id)`
- `entity_type text`
- `entity_id uuid`
- `action text`
- `ip_address text`
- `user_agent text`
- `before_state jsonb`
- `after_state jsonb`
- `created_at timestamptz`

## ER-Style Relationship Description

```text
profiles
  -> organization_members
  -> organizations
      -> organization_roles
      -> departments
          -> employees
      -> projects
          -> tasks
          -> milestones
          -> timelines
          -> budgets
          -> documents
          -> knowledge_files
          -> reports
          -> rfqs
              -> quotations
                  -> contracts
                      -> contract_milestones
      -> notifications
      -> activity_logs
      -> audit_logs

organizations
  -> marketplace_companies
      -> marketplace_services
      -> quotations
      -> contracts
```

Business flow:

```text
Organization
  -> Members
  -> Projects
  -> Tasks
  -> Documents
  -> Knowledge
  -> RFQ
  -> Quotation
  -> Contracts
  -> Reports
```

Marketplace relationship:

- An organization can publish a marketplace company profile.
- Marketplace companies can submit quotations to RFQs.
- Awarded quotations can become contracts.
- Contracts link back to project, RFQ, quotation, organization, and marketplace company.

## Multi-Tenant Strategy

### Ownership Columns

- `owner_id`: personal owner or creator, useful for profiles, early MVP compatibility, and direct user-owned records.
- `organization_id`: tenant boundary for production enterprise records.
- `created_by`: user who created a record.
- `profile_id`: member/user relation.

### Recommended Rule

Production domain tables should include `organization_id` whenever they belong to a company workspace. Keep `owner_id` only where personal ownership is required or for backward compatibility.

### Membership Model

- A user belongs to an organization through `organization_members`.
- A member has a role through `organization_roles`.
- Role permissions are stored in `permissions jsonb`.
- Invitations are represented by membership rows with `status = invited` or by a future `organization_invitations` table if richer invitation tracking is needed.

### Future Enterprise Scaling

- Use organization-scoped indexes on every major table.
- Keep project data partition-ready through `organization_id`.
- Keep audit logs append-only.
- Use role permissions for enterprise controls instead of hardcoding roles in frontend logic.

## Future RLS Strategy

Do not implement in this sprint.

Recommended policy principles:

- Organization isolation: users can only read records for organizations where they have active membership.
- Project isolation: users can only read projects in organizations they belong to.
- Owner access: `organizations.owner_id = auth.uid()` grants full organization control.
- Admin access: active organization members with admin/manage permissions can manage relevant records.
- Member access: active members can read records allowed by role permissions.
- Marketplace public access: verified marketplace company summaries can be public or semi-public, but sensitive commercial details remain organization-scoped.
- Audit logs: organization owners/admins can read; writes are system/server controlled.

Example future helper concept:

```text
is_org_member(organization_id, auth.uid())
has_org_permission(organization_id, auth.uid(), permission_key)
```

## Future API Architecture

Recommended route groups:

- `/api/organizations`
- `/api/organizations/[id]`
- `/api/organizations/[id]/members`
- `/api/organizations/[id]/departments`
- `/api/organizations/[id]/employees`
- `/api/projects`
- `/api/projects/[id]`
- `/api/projects/[id]/tasks`
- `/api/projects/[id]/timeline`
- `/api/projects/[id]/budget`
- `/api/projects/[id]/documents`
- `/api/projects/[id]/knowledge`
- `/api/contracts`
- `/api/contracts/[id]`
- `/api/rfq`
- `/api/rfq/[id]`
- `/api/rfq/[id]/quotations`
- `/api/marketplace`
- `/api/marketplace/[slug]`
- `/api/search`
- `/api/notifications`
- `/api/activity`

API rules:

- Repositories call APIs, pages do not call Supabase directly.
- API routes verify the authenticated user.
- API routes rely on RLS and explicit permission checks.
- Service-role operations remain server-only.

## Repository Mapping

| Repository | Future tables |
| --- | --- |
| `organizationRepository` | `organizations`, `organization_members`, `organization_roles` |
| `projectRepository` | `projects`, `tasks`, `milestones`, `budgets`, `timelines`, `reports` |
| `employeeRepository` | `employees`, `departments`, `organization_members` |
| `marketplaceRepository` | `marketplace_companies`, `marketplace_services`, `organizations` |
| `rfqRepository` | `rfqs`, `quotations`, `marketplace_companies`, `projects` |
| `contractRepository` | `contracts`, `contract_milestones`, `rfqs`, `quotations`, `projects` |
| future `notificationRepository` | `notifications` |
| future `activityRepository` | `activity_logs`, `audit_logs` |
| future `documentRepository` | `documents`, `generation_history`, `favorites` |
| future `knowledgeRepository` | `knowledge_files`, Supabase Storage objects |

## Future Indexes

Recommended indexes:

- `organizations_owner_id_idx`
- `organization_members_organization_id_profile_id_idx`
- `organization_members_profile_id_idx`
- `departments_organization_id_idx`
- `employees_organization_id_department_id_idx`
- `projects_organization_id_updated_at_idx`
- `projects_owner_id_updated_at_idx`
- `tasks_project_id_status_due_date_idx`
- `milestones_project_id_start_date_idx`
- `budgets_project_id_idx`
- `documents_project_id_created_at_idx`
- `knowledge_files_project_id_created_at_idx`
- `reports_project_id_created_at_idx`
- `marketplace_companies_slug_idx`
- `marketplace_companies_category_city_idx`
- `rfqs_project_id_status_idx`
- `quotations_rfq_id_status_idx`
- `contracts_project_id_status_idx`
- `notifications_profile_id_read_at_idx`
- `activity_logs_organization_id_created_at_idx`
- `audit_logs_organization_id_created_at_idx`

## Migration Roadmap

### Phase 1: Tenant Foundation

- `organizations`
- `organization_roles`
- `organization_members`
- membership helper functions
- organization RLS

### Phase 2: Workforce Foundation

- `departments`
- `employees`
- employee/department RLS
- organization switcher backed by real membership

### Phase 3: Project Operating System

- extend `projects` with `organization_id`
- `tasks`
- `milestones`
- `budgets`
- `timelines`
- project-scoped RLS

### Phase 4: Documents and Knowledge

- extend `documents` with `organization_id`
- extend `knowledge_files` with `organization_id`
- add report model
- update storage path strategy to support organization/project scoping

### Phase 5: Marketplace and Procurement

- `marketplace_companies`
- `marketplace_services`
- `rfqs`
- `quotations`
- procurement RLS

### Phase 6: Contracts

- `contracts`
- `contract_milestones`
- contract RLS
- link awarded quotation to contract

### Phase 7: Platform Intelligence

- `notifications`
- `activity_logs`
- `audit_logs`
- global search indexes
- analytics rollups

## Design Principles

- Preserve current MVP tables until migrations are explicit and tested.
- Keep `owner_id` compatibility while introducing `organization_id`.
- Add RLS incrementally with helper functions.
- Keep demo data available until each repository has production parity.
- Avoid frontend assumptions about permissions; derive access from membership and role policies.

## Sprint 15.1 Migration Status

Implemented as an additive migration:

- `database/migrations/20260718_organizations_foundation.sql`

Created production foundation tables:

- `organizations`
- `organization_roles`
- `organization_members`

This migration intentionally does not modify the existing `projects` table. Organization-scoped projects remain planned for a later phase.

## Sprint 16.5 Knowledge Articles

Implemented as an additive migration blueprint:

- `database/migrations/20260719_knowledge_foundation.sql`

Created production foundation table:

- `knowledge_articles`

Relationships:

- `knowledge_articles.organization_id -> organizations.id`
- `knowledge_articles.project_id -> projects.id`
- `knowledge_articles.document_id -> documents.id`
- `knowledge_articles.created_by -> profiles.id`

Ownership and access:

- `organization_id` is the tenant boundary.
- Organization members can read knowledge articles.
- Organization owners and members with `manage_organization` can create, update, and archive articles.
- Anonymous users have no access.

Future expansion:

- article version history
- review and approval workflow
- embeddings and RAG after file parsing is introduced
- stale, duplicate, and missing knowledge analytics

## Sprint 16.6 VORA AI Intelligence

No new database migration was introduced.

The existing `generation_history` table remains the memory store for VORA outputs. Sprint 16.6 stores future-ready memory fields inside the existing metadata/prompt payloads:

- conversation title
- organization reference
- project reference
- prompt type
- saved flag
- favorite flag
- timestamp

Future schema candidates:

- add first-class `conversation_title`, `organization_id`, `prompt_type`, `saved`, and `favorite` columns to `generation_history`
- add `ai_conversations` for threaded chat
- add `ai_context_snapshots` for auditable context provenance
- add `ai_actions` for future task/document/budget actions generated by VORA

## Sprint 16.7 Reports & Analytics

No new database migration was introduced.

Analytics are computed from existing production foundations:

- organizations
- projects
- employees
- tasks
- milestones
- budget categories and items
- documents
- knowledge articles
- generation history

Future schema candidates:

- `analytics_snapshots` for periodic KPI snapshots
- `report_runs` for generated report history
- `report_templates` for organization-specific report formats
- materialized views for project health, budget health, timeline health, and risk scoring

## Sprint 18.0 Marketplace Production Foundation

No database migration was introduced in Sprint 18.0.

The frontend Marketplace now has production domain models, repository adapters, mapping, hooks, search, filtering, sorting, profile support, and dashboard widgets. Supabase mode is table-ready but intentionally does not require a schema change yet.

Future candidate tables:

- `marketplace_companies`
- `marketplace_services`
- `marketplace_locations`
- `marketplace_reviews`
- `marketplace_portfolio`
- `marketplace_certifications`
- `marketplace_saved_companies`
- `marketplace_connections`

Future primary relationship:

- marketplace company profiles may optionally reference `organizations.id`
- organization owners manage their company marketplace profile
- reviews should eventually connect marketplace companies to completed project relationships
- RFQ and quotation workflows can reference selected marketplace companies

Future RLS strategy:

- published and verified company profile data can be readable by authenticated marketplace users
- private contact fields should require authenticated access
- profile management should be restricted to organization owners, admins, or marketplace admins
- review creation should require verified project participation

## Sprint 18.1 RFQ Management Production Foundation

No database migration was introduced in Sprint 18.1.

The RFQ module now has production domain models, repository adapters, mapping, hooks, top-level routes, supplier selection from Marketplace, dashboard widgets, and VORA-style procurement intelligence.

Future candidate tables:

- `rfqs`
- `rfq_items`
- `rfq_documents`
- `rfq_suppliers`
- `rfq_responses`
- `rfq_activity`
- `rfq_evaluations`

Future primary relationships:

- `rfqs.organization_id -> organizations.id`
- `rfqs.project_id -> projects.id`
- `rfq_suppliers.marketplace_company_id -> marketplace_companies.id`
- `rfq_documents.document_id -> documents.id`
- `rfq_responses.rfq_id -> rfqs.id`
- `rfq_activity.rfq_id -> rfqs.id`

Future RLS strategy:

- organization members can read organization RFQs
- project members can read RFQs for assigned projects
- procurement managers and organization managers can create and update RFQs
- invited suppliers can read only RFQs where they are explicitly invited
- anonymous users have no access

## Sprint 18.2 Quotation Management Production Foundation

No database migration was introduced in Sprint 18.2.

The frontend Quotation module now has production domain models, repository adapters, mapping, hooks, comparison logic, recommendation logic, dashboard widgets, and routes.

Future candidate tables:

- `quotations`
- `quotation_items`
- `quotation_documents`
- `quotation_evaluations`
- `quotation_comparisons`
- `award_recommendations`

Future primary relationships:

- `quotations.organization_id -> organizations.id`
- `quotations.project_id -> projects.id`
- `quotations.rfq_id -> rfqs.id`
- `quotations.supplier_id -> marketplace_companies.id`
- `quotation_items.quotation_id -> quotations.id`
- `quotation_documents.quotation_id -> quotations.id`
- `quotation_documents.document_id -> documents.id`
- `quotation_evaluations.quotation_id -> quotations.id`
- `award_recommendations.rfq_id -> rfqs.id`
- `award_recommendations.quotation_id -> quotations.id`

Future RLS strategy:

- organization members can read quotations attached to their organization
- project members can read quotations for assigned projects
- procurement managers and organization managers can evaluate quotations
- invited supplier users can read and update only their own submitted quotation
- anonymous users have no access

Future index candidates:

- `quotations(organization_id, updated_at)`
- `quotations(rfq_id, status)`
- `quotations(project_id, supplier_id)`
- `quotation_items(quotation_id)`
- `quotation_evaluations(quotation_id)`

## Sprint 18.3 Contract & Award Management Foundation

No database migration was introduced in Sprint 18.3.

The frontend Contract & Award module now has production domain models, repository adapters, mapping, hooks, award metadata, approval lifecycle support, payment schedule support, dashboard widgets, and upgraded contract routes.

Future candidate tables:

- `contracts`
- `contract_awards`
- `contract_parties`
- `contract_milestones`
- `contract_deliverables`
- `contract_payments`
- `contract_approvals`
- `contract_amendments`
- `contract_documents`

Future primary relationships:

- `contracts.organization_id -> organizations.id`
- `contracts.project_id -> projects.id`
- `contracts.rfq_id -> rfqs.id`
- `contracts.quotation_id -> quotations.id`
- `contracts.supplier_id -> marketplace_companies.id`
- `contract_awards.contract_id -> contracts.id`
- `contract_awards.quotation_id -> quotations.id`
- `contract_parties.contract_id -> contracts.id`
- `contract_milestones.contract_id -> contracts.id`
- `contract_deliverables.contract_id -> contracts.id`
- `contract_payments.contract_id -> contracts.id`
- `contract_approvals.contract_id -> contracts.id`
- `contract_amendments.contract_id -> contracts.id`
- `contract_documents.contract_id -> contracts.id`
- `contract_documents.document_id -> documents.id`

Future RLS strategy:

- organization members can read contracts in their organization
- project members can read contracts for assigned projects
- procurement managers can manage award metadata and supplier linkage
- finance reviewers can manage payment approval fields
- organization owners and admins can manage full contract lifecycle
- invited suppliers can read only contracts where their marketplace company is a party
- anonymous users have no access

Future index candidates:

- `contracts(organization_id, status)`
- `contracts(project_id, updated_at)`
- `contracts(rfq_id, quotation_id)`
- `contracts(supplier_id, status)`
- `contract_milestones(contract_id, due_date)`
- `contract_payments(contract_id, due_date, status)`
- `contract_approvals(contract_id, status)`

## Sprint 18.4 Marketplace Backend Production Foundation

Sprint 18.4 adds the production Marketplace database blueprint as an idempotent migration.

Migration:

- `database/migrations/20260719_marketplace_backend.sql`

Production tables:

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

Primary relationships:

- `marketplace_companies.organization_id -> organizations.id`
- `marketplace_companies.owner_id -> profiles.id`
- `marketplace_companies.primary_contact_profile_id -> profiles.id`
- `marketplace_portfolios.company_id -> marketplace_companies.id`
- `marketplace_portfolios.project_id -> projects.id`
- `marketplace_reviews.company_id -> marketplace_companies.id`
- `marketplace_reviews.project_id -> projects.id`
- `marketplace_reviews.created_by -> profiles.id`
- `marketplace_connections.requester_organization_id -> organizations.id`
- `marketplace_connections.target_company_id -> marketplace_companies.id`
- `marketplace_connections.project_id -> projects.id`
- `marketplace_messages.connection_id -> marketplace_connections.id`
- `marketplace_favorites.profile_id -> profiles.id`
- `marketplace_favorites.company_id -> marketplace_companies.id`
- `marketplace_certifications.company_id -> marketplace_companies.id`
- `marketplace_certifications.document_id -> documents.id`

RLS strategy:

- verified published companies and public child records are browseable
- company owners and organization managers can manage company profiles
- authenticated users can create reviews as themselves
- connection participants can access connection threads
- favorites are private to the owning profile or organization context

Index candidates implemented in the migration:

- slug, organization, owner, category, location, verified status, rating
- child table company indexes
- connection participant indexes
- message thread ordering
- favorite profile and company lookups

## Sprint 18.5 Notifications Production Foundation

Sprint 18.5 adds the production Notification Center schema blueprint as an idempotent migration.

Migration:

- `database/migrations/20260719_notifications_foundation.sql`

Production tables:

- `notifications`
- `notification_recipients`
- `notification_preferences`

Primary relationships:

- `notifications.owner_id -> profiles.id`
- `notifications.organization_id -> organizations.id`
- `notifications.project_id -> projects.id`
- `notifications.recipient_id -> profiles.id`
- `notification_recipients.notification_id -> notifications.id`
- `notification_recipients.profile_id -> profiles.id`
- `notification_recipients.organization_id -> organizations.id`
- `notification_preferences.profile_id -> profiles.id`
- `notification_preferences.organization_id -> organizations.id`

Notification types cover projects, tasks, milestones, budgets, documents, knowledge, marketplace, RFQ, quotations, awards, contracts, approvals, payments, VORA AI, and system events.

RLS strategy:

- anonymous users have no notification access
- direct recipients and owners can read their notifications
- organization members can read organization-scoped notifications
- organization owners and `manage_organization` members can manage organization notifications
- users manage their own preferences

Future indexes are included for organization, project, recipient, status, priority, type, and recent activity ordering.

## Sprint 19.1 Billing Foundation

Sprint 19.1 adds the production billing schema blueprint as a generated migration.

Migration:

- `database/migrations/20260720_billing_foundation.sql`

Production tables:

- `billing_plans`
- `organization_subscriptions`
- `billing_usage_records`
- `billing_invoices`
- `billing_payment_methods`

Primary relationships:

- `organization_subscriptions.organization_id -> organizations.id`
- `organization_subscriptions.owner_id -> profiles.id`
- `organization_subscriptions.plan_id -> billing_plans.id`
- `billing_usage_records.subscription_id -> organization_subscriptions.id`
- `billing_usage_records.organization_id -> organizations.id`
- `billing_invoices.subscription_id -> organization_subscriptions.id`
- `billing_invoices.organization_id -> organizations.id`
- `billing_payment_methods.organization_id -> organizations.id`

Billing tracks plan limits, trials, invoices, usage, payment methods, and future payment-provider identifiers without enforcing quotas yet.

## Sprint 19.2 Administration Foundation

Sprint 19.2 adds frontend domain models for platform administration: admin dashboard metrics, admin users, organization summaries, subscription summaries, audit summaries, feature flags, platform settings, and system health.

No production admin migration is added in this sprint. Future production implementation should expose admin read models through protected views or RPCs:

- `admin_dashboard`
- `admin_users`
- `admin_organizations`
- `admin_subscriptions`
- `admin_audit`
- `admin_feature_flags`
- `admin_system_health`
- `admin_platform_settings`

These read models must be restricted to platform administrators and must never be readable by ordinary organization members.
