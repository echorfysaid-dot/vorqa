# Projects Production Foundation

Sprint 16.0 transforms Projects into an organization-aware project operating system foundation while preserving the existing repository architecture, demo mode, and routes.

## Migration

Migration file:

- `database/migrations/20260718_project_foundation.sql`

The migration is additive and does not replace the existing `projects` table.

## Extended Projects Table

Added columns:

- `organization_id uuid references organizations(id) on delete set null`
- `project_manager_id uuid references employees(id) on delete set null`
- `department_id uuid references departments(id) on delete set null`
- `slug text`
- `description text`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraint:

- unique `(organization_id, slug)`

## Project Members

New table:

- `project_members`

Columns:

- `id uuid primary key default gen_random_uuid()`
- `project_id uuid references projects(id) on delete cascade`
- `employee_id uuid references employees(id) on delete cascade`
- `role text`
- `joined_at timestamptz not null default now()`
- `status text not null default 'active'`

Constraints:

- unique `(project_id, employee_id)`
- status check: `active`, `inactive`, `removed`

## RLS

Project visibility:

- project owner
- active organization members when `organization_id` is present

Project management:

- project owner
- organization owner
- organization member with `manage_organization`

Project members use the same organization/project visibility model. Anonymous users have no access.

## Repository Flow

Files:

- `projectRepository.ts`
- `projectDemoAdapter.ts`
- `projectSupabaseAdapter.ts`
- `projectMapper.ts`
- `projectHooks.ts`

Methods:

- `getProjects()`
- `getProject(id)`
- `createProject(input)`
- `updateProject(id, input)`
- `archiveProject(id)`
- `slugExists(organizationId, slug)`
- `getProjectMembers(projectId)`
- `assignProjectMember(input)`
- `removeProjectMember(memberId)`
- `updateProjectManager(projectId, projectManagerId)`

Existing helper methods remain for dashboard/workspace compatibility.

## UI

`/projects` now displays organization, department, manager, team size, status, progress, search, filters, create project, and archive actions.

`/projects/[id]` now shows an enterprise project context strip with organization, department, manager, and team count before the existing project workspace.

## Validation

Create project validation:

- organization required
- title required
- valid slug
- unique slug inside organization
- selected department belongs to organization
- selected manager belongs to organization

## Current Limitations

- project team assignment UI is not fully expanded yet
- dashboard status groupings still depend on the repository data available in the current data-source mode
- timeline/tasks/budget remain existing workspace placeholders until their production tables are connected
- migration is created but not applied automatically
