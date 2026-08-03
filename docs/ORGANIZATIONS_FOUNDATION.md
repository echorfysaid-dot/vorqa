# Organizations Production Foundation

Sprint 14.2 prepares Organizations for production integration without creating tables, migrations, RLS policies, APIs, route changes, or UI redesigns.

## Current Dependency Map

### Routes

- `/organizations`
  - Reads `organizationRepository.list()`.
  - Uses demo organization IDs: `atlas`, `northbuild`, `maghreb-logistics`, `urbanform`.
  - Links only Atlas to `/organizations/atlas`; other organization cards intentionally remain directory/demo entries.

- `/organizations/atlas`
  - Reads departments, current company, employees, projects, recent activity, and saved generations through repositories.
  - Treats Atlas as the default organization workspace.
  - Contains demo-only departments, employees, role permissions, organization chart, and insights.

- `/dashboard`
  - Reads current company through `organizationRepository.getCurrent()`.
  - Uses Atlas organization copy for command-center context.
  - Project data is already production-source aware through `projectRepository`.

- `/projects` and `/projects/[id]`
  - Projects are not organization-scoped yet.
  - Future relationship should attach projects to an organization through `organization_id` or a membership-aware join.

- `/marketplace` and `/marketplace/[slug]`
  - Marketplace company profiles are separate demo company records.
  - `marketplaceRepository.getLinkedOrganization()` now provides a small bridge from marketplace company slugs to matching demo organizations where available.

- `/contracts` and RFQ routes
  - Contracts/RFQs reference organization names as demo text, primarily Atlas Construction Group.
  - No production organization relationship exists yet.

### Components

- `components/app-shell.tsx`
  - Organization switcher uses `organizationRepository.list()`.
  - Active organization is UI state only and not persisted.

- `components/project-workspace.tsx`
  - Uses Atlas-oriented demo context in some project workspace panels.
  - No organization-scoped production loading yet.

### Data Relationships Today

```text
Demo Organization
  -> Demo Projects
  -> Demo Employees
  -> Demo Contracts/RFQs by text reference
  -> Demo Marketplace companies by slug/name match
```

There is no production database relationship yet.

## Organization Domain Model

The Organization model now includes optional production fields:

- `legalName`
- `registrationNumber`
- `taxNumber`
- `logo`
- `website`
- `address`
- `city`
- `country`
- `timezone`
- `currency`
- `contactEmail`
- `contactPhone`
- `industry`
- `companySize`
- `createdAt`
- `updatedAt`
- `ownerId`

All additions are optional to avoid breaking existing demo objects.

## Repository API

`organizationRepository` now prepares:

- `getOrganizations()`
- `getOrganization(id)`
- `getOrganizationById(id)`
- `getOrganizationProjects(id)`
- `getOrganizationEmployees(id)`
- `getOrganizationStats(id)`
- `list()`
- `getById(id)`
- `getCurrent()`
- `listDepartments()`

The existing synchronous methods remain for current UI compatibility.

## Adapters

Current adapters:

- `organizationDemoAdapter.ts`
  - Maps demo organizations to the Organization domain model.
  - Returns demo projects, employees, and stats.

- `organizationSupabaseAdapter.ts`
  - Intentionally empty.
  - Returns typed missing-dependency results because no compatible organizations table exists.

- `organizationMapper.ts`
  - Maps demo organization records to domain organizations.
  - Includes placeholder mapping for future Supabase organization records.

## Future Schema Expectations

A future backend sprint should define tables such as:

- `organizations`
- `organization_members`
- `departments`
- `employees`
- `organization_roles`
- optional `organization_projects` or `projects.organization_id`

Recommended `organizations` fields:

- `id`
- `owner_id`
- `name`
- `legal_name`
- `registration_number`
- `tax_number`
- `logo`
- `website`
- `industry`
- `location`
- `address`
- `city`
- `country`
- `timezone`
- `currency`
- `contact_email`
- `contact_phone`
- `company_size`
- `status`
- `created_at`
- `updated_at`

## Future RLS Expectations

Future policies should ensure:

- organization owners can manage their organizations
- members can read organizations they belong to
- roles determine access to departments, employees, projects, RFQs, and contracts
- users cannot infer or access organizations by URL ID without membership
- service-role operations remain server-only

## Future API Layer

Recommended future endpoints:

- `GET /api/organizations`
- `GET /api/organizations/[id]`
- `GET /api/organizations/[id]/projects`
- `GET /api/organizations/[id]/employees`
- `GET /api/organizations/[id]/stats`

Pages should continue consuming repositories, not direct API calls.

## Migration Plan

1. Add schema and RLS in a backend sprint.
2. Implement `organizationSupabaseAdapter`.
3. Switch `organizationRepository` async methods to real Supabase data in `supabase` and `auto` modes.
4. Keep demo fallback available for `demo` and `auto`.
5. Gradually replace Atlas page-local demo arrays with repository data.
6. Add organization scoping to projects, contracts, RFQs, and marketplace relationships.

## Sprint 15.1 Implementation

Sprint 15.1 implements the first production database foundation:

- `organizations`
- `organization_roles`
- `organization_members`

The Supabase adapter is no longer empty. It reads organizations through authenticated REST requests and maps database rows into the Organization domain model.

Current limitations:

- departments and employees are still demo-backed
- projects are not yet organization-scoped
- organization invitations are represented by member status only; no dedicated invitation table exists yet
- organization details still use `/organizations/atlas` as the demo workspace route

## Sprint 15.2 Organization Management

Sprint 15.2 adds a production-ready organization management foundation on top of the repository architecture while preserving demo mode and existing routes.

### CRUD Surface

The repository now exposes:

- `slugExists(slug, excludeId?)`
- `createOrganization(input)`
- `updateOrganization(id, input)`
- `deleteOrganization(id)`

The public API remains repository-only. Pages do not call Supabase directly.

### Organization Dashboard

`/organizations` now loads organizations through `useOrganizationsRepository()` and supports:

- loading state
- safe empty state
- error/fallback messaging
- demo mode
- Supabase mode
- auto mode
- organization logo, name, status, member count, project count, owner/member badge, and created date

### Create Organization

`/organizations/new` creates organizations through `organizationRepository.createOrganization()`.

Validation includes:

- required name
- required slug
- slug format validation
- country and city requirements
- duplicate slug protection through `organizationRepository.slugExists()`

In demo mode, creation is a non-persistent preview. In Supabase mode, creation relies on authenticated RLS and the current user as `owner_id`.

### Organization Details and Editing

`/organizations/[id]` loads organization details through `organizationRepository.getOrganization(id)` and handles loading, not found, error, demo, Supabase, and fallback states.

Owners and admins can update management fields:

- logo
- website
- contact email
- phone
- address
- timezone
- currency
- status

The current delete action is implemented as a soft archive by updating status to `Archived`. Hard delete is intentionally not exposed.

### Atlas Route Compatibility

The existing `/organizations/atlas` route remains the rich demo Atlas workspace from earlier sprints. The production-ready dynamic details route is available for other organization IDs and slugs. This preserves the current demo workspace while allowing the new repository-backed management flow to evolve safely.

### Adapter Flow

`organizationDemoAdapter` implements non-persistent CRUD previews from demo data.

`organizationSupabaseAdapter` implements authenticated REST operations using:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- current Supabase bearer token from `getValidSession()`

No service-role secrets are used client-side.

`auto` mode attempts Supabase first and falls back to demo responses when Supabase is unavailable or returns an access/configuration error.

## Sprint 15.3 Members and Roles

Sprint 15.3 implements organization membership and role management on the existing `organizations`, `organization_roles`, `organization_members`, and `profiles` schema. No new tables, migrations, APIs, or authentication changes were introduced.

### Confirmed Schema

`organization_roles` columns:

- `id uuid primary key`
- `organization_id uuid references organizations(id) on delete cascade`
- `name text not null`
- `description text`
- `permissions jsonb not null default '{}'`
- `created_at timestamptz not null default now()`

Constraints:

- unique `(organization_id, name)`

`organization_members` columns:

- `id uuid primary key`
- `organization_id uuid references organizations(id) on delete cascade`
- `user_id uuid references profiles(id) on delete cascade`
- `role_id uuid references organization_roles(id) on delete set null`
- `joined_at timestamptz not null default now()`
- `status text not null default 'active'`

Constraints:

- unique `(organization_id, user_id)`
- status check: `active`, `invited`, `suspended`, `removed`

`profiles` fields used for member display:

- `id`
- `email`
- `full_name`
- `avatar_url`

### Role Repository Flow

New repository:

- `organizationRoleRepository`

Methods:

- `getOrganizationRoles(organizationId)`
- `getOrganizationRole(roleId)`
- `createOrganizationRole(input)`
- `updateOrganizationRole(roleId, input)`
- `deleteOrganizationRole(roleId)`

Adapters:

- `organizationRoleDemoAdapter`
- `organizationRoleSupabaseAdapter`

Mapper:

- `organizationRoleMapper`

Supported RLS permission keys:

- `manage_organization`
- `manage_roles`
- `manage_members`

The permission shape is intentionally extensible with `jsonb` for future product areas.

### Member Repository Flow

New repository:

- `organizationMemberRepository`

Methods:

- `getOrganizationMembers(organizationId)`
- `getOrganizationMember(memberId)`
- `addOrganizationMember(input)`
- `updateOrganizationMember(memberId, input)`
- `removeOrganizationMember(memberId)`

Adapters:

- `organizationMemberDemoAdapter`
- `organizationMemberSupabaseAdapter`

Mapper:

- `organizationMemberMapper`

Member display joins profile and role data where Supabase RLS allows it.

### UI Integration

`/organizations/[id]` now includes:

- Overview
- Members
- Roles
- Settings

The existing `/organizations/atlas` demo workspace remains unchanged for continuity.

Members UI includes:

- member list
- profile name/email when available
- role assignment
- membership status
- joined date
- search
- status filter
- role filter
- loading, empty, and error states

Roles UI includes:

- role cards
- permission picker
- assigned member count
- create, edit, and delete actions
- loading, empty, and error states

### Authorization UX

Supabase RLS remains the security authority. Client checks only hide or disable controls based on known role context.

Owner protection rules:

- owner membership cannot be removed from the UI
- owner role cannot be renamed
- built-in roles cannot be deleted
- roles assigned to members cannot be deleted

### Invitation Limitation

The current schema does not include an invitation table, invitation tokens, invited-by metadata, or an email-based lookup flow. The UI therefore says "Add existing user" and requires an existing profile/user ID. Email invitations are a future dependency.

### Mode Behavior

- `demo`: non-persistent demo members and roles
- `supabase`: strict production data through authenticated REST and RLS
- `auto`: Supabase first, then documented demo fallback on configuration/session/access failure

## Sprint 15.4 Departments

Sprint 15.4 adds the first production-ready organization department module.

Migration:

- `database/migrations/20260718_departments_foundation.sql`

New table:

- `departments`

Repository files:

- `departmentRepository`
- `departmentDemoAdapter`
- `departmentSupabaseAdapter`
- `departmentMapper`
- `departmentHooks`

`/organizations/[id]` now includes a repository-backed Departments tab. The existing `/organizations/atlas` rich demo workspace remains unchanged.

Departments are scoped by `organization_id`, and write access relies on the existing organization helper functions:

- `public.is_organization_owner`
- `public.is_organization_member`
- `public.has_organization_permission`

Application archive behavior is soft: department status is updated to `Archived` rather than hard-deleted.

Current limitation:

- department leads reference existing `profiles.id`; production employees do not exist yet
- employee and project aggregates remain optional or demo-backed until future modules connect them

## Sprint 15.5 Employees

Sprint 15.5 adds the production Employees foundation.

Migration:

- `database/migrations/20260718_employees_foundation.sql`

New table:

- `employees`

Repository files:

- `employeeRepository`
- `employeeDemoAdapter`
- `employeeSupabaseAdapter`
- `employeeMapper`
- `employeeHooks`

`/organizations/[id]` now includes a repository-backed Employees tab. The existing `/organizations/atlas` rich demo workspace remains unchanged.

Employees are scoped by `organization_id`, optionally assigned to `department_id`, optionally linked to `profile_id`, and optionally managed through `manager_id`.

Application archive behavior is soft: employee status is updated to `Archived` rather than hard-deleted.

Current limitation:

- HR management uses `manage_organization` until a future `manage_hr` permission exists
- employee email comes from linked profiles; employee invitation/profile creation is future work
- project assignments are not connected yet
