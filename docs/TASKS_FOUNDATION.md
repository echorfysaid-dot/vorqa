# Tasks Production Foundation

Sprint 16.1 adds the production-ready frontend and database foundation for project tasks without applying migrations automatically and without changing authentication, OpenAI, marketplace, RFQ, contracts, or existing business logic.

## Database Migration

Migration:

- `database/migrations/20260718_tasks_foundation.sql`

Table:

- `public.tasks`

Key relationships:

- `project_id -> public.projects(id)`
- `organization_id -> public.organizations(id)`
- `department_id -> public.departments(id)`
- `assignee_employee_id -> public.employees(id)`
- `parent_task_id -> public.tasks(id)`

Task status values:

- `todo`
- `in_progress`
- `review`
- `blocked`
- `done`
- `archived`

Priority values:

- `low`
- `medium`
- `high`
- `critical`

The migration is additive and idempotent. It creates indexes for project, organization, department, assignee, parent task, status, priority, and due date lookups. It also adds an idempotent `updated_at` trigger.

## RLS Strategy

Anonymous users have no task access.

Organization members can read tasks inside their organization.

Organization owners and members with `manage_organization` can manage tasks.

Assigned active employees may update their assigned task rows. Supabase RLS cannot restrict individual columns by policy alone, so stricter status/progress-only enforcement should move into dedicated RPC functions before production write access is expanded.

## Repository Architecture

Files:

- `lib/repositories/taskRepository.ts`
- `lib/repositories/taskDemoAdapter.ts`
- `lib/repositories/taskSupabaseAdapter.ts`
- `lib/repositories/taskMapper.ts`
- `lib/repositories/taskHooks.ts`

Methods:

- `getTasks(projectId)`
- `getTask(taskId)`
- `createTask(input)`
- `updateTask(taskId, input)`
- `archiveTask(taskId)`
- `moveTask(taskId, status)`
- `updateTaskProgress(taskId, progress)`
- `assignTask(taskId, assigneeEmployeeId)`

The repository preserves `demo`, `supabase`, and `auto` modes. Pages use the repository/hook layer only and never call Supabase directly.

## Demo Data

Demo task records cover:

- Site preparation
- Excavation
- Foundations
- Concrete works
- Steel reinforcement
- Electrical rough-in
- Plumbing rough-in
- Interior finishes
- QA review
- Final inspection

Demo tasks are project-scoped and reuse the existing demo departments and employees.

## Project Workspace UI

The Tasks tab in `components/project-workspace.tsx` now renders:

- task overview metrics
- Kanban columns
- list view
- search
- status and priority filters
- create task form
- edit controls
- drag/drop status movement
- soft archive action
- VORA task insights panel

The UI is a production foundation only. It does not introduce new backend API routes and does not change existing task/business workflows.

## Validation Notes

Create task validation checks:

- title is required
- selected department belongs to the current organization data set
- selected assignee belongs to the current organization data set

Supabase adapter validation checks:

- project exists
- organization exists
- selected department belongs to organization
- selected assignee belongs to organization

## Remaining Dependencies

- Apply the migration manually in Supabase when ready.
- Add RPC-based restricted employee task updates for stricter column-level workflow enforcement.
- Add production task assignment notifications in a future sprint.
- Connect dashboard aggregate widgets to real task queries when backend aggregation is approved.
