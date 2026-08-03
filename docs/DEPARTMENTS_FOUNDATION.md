# Departments Production Foundation

Sprint 15.4 introduces production-ready Departments inside Organizations without changing authentication, OpenAI, marketplace, RFQ, contracts, or existing organization behavior.

## Migration

Migration file:

- `database/migrations/20260718_departments_foundation.sql`

The migration is additive and idempotent.

## Table

`public.departments`

Columns:

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references public.organizations(id) on delete cascade`
- `name text not null`
- `slug text not null`
- `description text`
- `lead_user_id uuid references public.profiles(id) on delete set null`
- `status text not null default 'active'`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- unique `(organization_id, slug)`
- status check: `active`, `suspended`, `archived`

Indexes:

- `departments_organization_id_idx`
- `departments_slug_idx`
- `departments_status_idx`
- `departments_lead_user_id_idx`

## RLS

RLS is enabled on `public.departments`.

Policies:

- Read: organization owner or active organization member
- Insert: organization owner or member with `manage_organization`
- Update: organization owner or member with `manage_organization`
- Delete: organization owner or member with `manage_organization`

Application behavior prefers soft archive by setting status to `archived`.

Anonymous users receive no access unless future policies explicitly add it.

## Repository Flow

New files:

- `departmentRepository.ts`
- `departmentDemoAdapter.ts`
- `departmentSupabaseAdapter.ts`
- `departmentMapper.ts`
- `departmentHooks.ts`

Repository methods:

- `getDepartments(organizationId)`
- `getDepartmentById(organizationId, departmentId)`
- `createDepartment(input)`
- `updateDepartment(departmentId, input)`
- `archiveDepartment(departmentId)`
- `slugExists(organizationId, slug)`
- `getOrganizationDepartmentStats(organizationId)`

Pages consume repositories only. They do not call Supabase directly.

## Data Source Modes

`demo`:

- returns Engineering, Architecture, Procurement, Logistics, and Finance
- mutations are non-persistent previews

`supabase`:

- strict production data
- no silent demo substitution
- relies on authenticated bearer token and RLS

`auto`:

- attempts Supabase first
- falls back to demo only when Supabase/config/session/access is unavailable

## Lead User Limitation

Departments can reference `profiles.id` through `lead_user_id`.

There is no production `employees` table yet, so the lead relationship is currently user/profile-based. Future employee integration should introduce `lead_employee_id` or map employees to profiles.

## UI

`/organizations/[id]` includes a Departments tab with:

- list
- search
- status filter
- create department
- edit department
- archive department
- loading, empty, and error states
- safe permission-denied messaging

`/organizations/atlas` remains the rich demo workspace and is not replaced.

## Future Work

- connect departments to future employees
- connect projects to organization departments
- add department-level activity logs
- add department-level analytics from real aggregates
- add server API routes if needed for SSR or stricter boundary enforcement
