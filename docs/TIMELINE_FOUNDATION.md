# Timeline and Milestones Production Foundation

Sprint 16.2 adds the production-ready timeline and milestones foundation without applying migrations automatically and without changing authentication, OpenAI, marketplace, RFQ, contracts, or existing business logic.

## Database Migration

Migration:

- `database/migrations/20260718_timeline_foundation.sql`

Tables:

- `public.milestones`
- `public.task_dependencies`

Milestone relationships:

- `project_id -> public.projects(id)`
- `organization_id -> public.organizations(id)`

Task dependency relationships:

- `predecessor_task_id -> public.tasks(id)`
- `successor_task_id -> public.tasks(id)`

## Milestones

Fields:

- title
- description
- status
- progress
- start date
- due date
- completed timestamp
- metadata
- created and updated timestamps

Status values:

- `planned`
- `in_progress`
- `completed`
- `delayed`
- `archived`

The migration includes progress constraints, status constraints, indexes, and an `updated_at` trigger.

## Task Dependencies

Dependency types:

- Finish-to-Start
- Start-to-Start
- Finish-to-Finish
- Start-to-Finish

The database prevents:

- duplicate dependency rows for the same predecessor, successor, and type
- self-dependencies

The repository and UI also perform practical circular-dependency checks before creating dependencies.

## RLS Strategy

Anonymous users have no access.

Organization members can read milestones and dependencies in their organization.

Organization owners and members with `manage_organization` can manage milestones and dependencies.

Dependency RLS resolves organization access through the related predecessor/successor tasks and requires both tasks to belong to the same organization.

## Repository Architecture

Files:

- `lib/repositories/timelineRepository.ts`
- `lib/repositories/timelineDemoAdapter.ts`
- `lib/repositories/timelineSupabaseAdapter.ts`
- `lib/repositories/timelineMapper.ts`
- `lib/repositories/timelineHooks.ts`

Methods:

- `getTimeline(projectId)`
- `getMilestones(projectId)`
- `createMilestone(input)`
- `updateMilestone(milestoneId, input)`
- `archiveMilestone(milestoneId)`
- `getDependencies(projectId)`
- `createDependency(input)`
- `removeDependency(dependencyId)`

The repository preserves demo, Supabase, and auto modes. Project pages use the repository/hook layer only and do not call Supabase directly.

## Demo Data

Demo timeline milestones cover:

- Planning
- Permits
- Excavation
- Foundation
- Structure
- MEP
- Finishes
- Inspection
- Handover

Demo dependencies reuse existing demo task data from the task repository.

## Project Workspace UI

The Timeline tab in `components/project-workspace.tsx` now renders:

- timeline overview metrics
- timeline and calendar views
- milestone list
- milestone progress bars
- upcoming and overdue indicators
- search and status filters
- create milestone form
- edit milestone controls
- archive milestone action
- task dependency list
- add and remove dependency actions
- VORA timeline insights panel
- loading, empty, and error states

## Remaining Dependencies

- Apply the migration manually in Supabase when ready.
- Add backend RPCs if stricter workflow/permission transitions are required.
- Add real notification/event generation for delayed milestones in a future sprint.
- Connect dashboard widgets to real timeline aggregate queries when backend aggregation is approved.
