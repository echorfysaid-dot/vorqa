# Employees Production Foundation

Sprint 15.5 introduces the production-ready Employees module inside Organizations and Departments without changing authentication, OpenAI, marketplace, RFQ, contracts, or existing route behavior.

## Migration

Migration file:

- `database/migrations/20260718_employees_foundation.sql`

The migration is additive and idempotent. It is not applied automatically.

## Table

`public.employees`

Columns:

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references public.organizations(id) on delete cascade`
- `department_id uuid references public.departments(id) on delete set null`
- `profile_id uuid references public.profiles(id) on delete set null`
- `manager_id uuid references public.employees(id) on delete set null`
- `employee_number text`
- `first_name text not null`
- `last_name text not null`
- `job_title text`
- `phone text`
- `employment_type text`
- `status text not null default 'active'`
- `hire_date date`
- `avatar_url text`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- unique `(organization_id, employee_number)`
- status check: `active`, `away`, `pending`, `inactive`, `archived`

## RLS

RLS is enabled on `public.employees`.

Policies:

- Read: organization owner or active organization member
- Insert: organization owner or member with `manage_organization`
- Update: organization owner or member with `manage_organization`
- Delete: organization owner or member with `manage_organization`

Application behavior uses soft archive by setting status to `archived`. Anonymous users have no access.

## Repository Flow

Files:

- `employeeRepository.ts`
- `employeeDemoAdapter.ts`
- `employeeSupabaseAdapter.ts`
- `employeeMapper.ts`
- `employeeHooks.ts`

Methods:

- `getEmployees(organizationId)`
- `getEmployee(organizationId, employeeId)`
- `createEmployee(input)`
- `updateEmployee(employeeId, input)`
- `archiveEmployee(employeeId)`
- `employeeNumberExists(organizationId, employeeNumber)`
- `getOrganizationEmployeeStats(organizationId)`

Existing synchronous demo methods remain available:

- `list()`
- `listByDepartment(department)`
- `getByName(name)`

## UI

`/organizations/[id]` now includes an Employees tab with:

- employee cards
- search
- department filter
- status filter
- job title filter
- create employee
- edit employee
- soft archive
- loading, empty, and error states

## Validation Rules

The UI and repository path validate:

- first name required
- last name required
- employee number uniqueness per organization
- organization scope
- selected department belongs to the current organization

RLS remains the security authority.

## Current Limitations

- HR is represented through `manage_organization` until dedicated HR permissions exist.
- Email is displayed through linked `profiles.email`; raw email invitations or profile creation are not implemented.
- Employee aggregates are limited to repository-safe counts.
- Project assignment is not connected yet.
- No hard delete is exposed.
