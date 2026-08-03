# Budget and Cost Control Production Foundation

Sprint 16.3 adds the production-ready budget and cost control foundation without applying migrations automatically and without changing authentication, OpenAI, marketplace, RFQ, contracts, or existing business logic.

## Database Migration

Migration:

- `database/migrations/20260718_budget_foundation.sql`

Tables:

- `public.budget_categories`
- `public.project_budget_items`

Relationships:

- `budget_categories.organization_id -> organizations.id`
- `project_budget_items.organization_id -> organizations.id`
- `project_budget_items.project_id -> projects.id`
- `project_budget_items.category_id -> budget_categories.id`
- `project_budget_items.department_id -> departments.id`

## Budget Categories

Fields:

- name
- description
- color
- created and updated timestamps

Category names are unique inside an organization.

## Project Budget Items

Fields:

- title
- description
- planned cost
- actual cost
- committed cost
- status
- priority
- start date
- end date
- metadata
- created and updated timestamps

Status values:

- `planned`
- `approved`
- `committed`
- `paid`
- `over_budget`
- `archived`

Priority values:

- `low`
- `medium`
- `high`
- `critical`

The migration includes non-negative cost constraints, status and priority constraints, indexes, and `updated_at` triggers.

## RLS Strategy

Anonymous users have no access.

Organization members can read budget categories and project budget items in their organization.

Organization owners and members with `manage_organization` can manage budget categories and project budget items.

## Repository Architecture

Files:

- `lib/repositories/budgetRepository.ts`
- `lib/repositories/budgetDemoAdapter.ts`
- `lib/repositories/budgetSupabaseAdapter.ts`
- `lib/repositories/budgetMapper.ts`
- `lib/repositories/budgetHooks.ts`

Methods:

- `getBudget(projectId)`
- `getCategories(organizationId)`
- `createCategory(input)`
- `updateCategory(categoryId, input)`
- `archiveCategory(categoryId)`
- `createBudgetItem(input)`
- `updateBudgetItem(itemId, input)`
- `archiveBudgetItem(itemId)`

The repository preserves demo, Supabase, and auto modes. Project pages use the repository/hook layer only and do not call Supabase directly.

## Demo Data

Demo budget records cover:

- Site preparation
- Excavation
- Concrete
- Steel
- Electrical
- Plumbing
- HVAC
- Finishes
- Inspection
- Contingency

Demo items include planned, actual, and committed costs for realistic construction cost control.

## Project Workspace UI

The Budget tab in `components/project-workspace.tsx` now renders:

- budget dashboard
- planned, actual, committed, remaining, and forecast totals
- budget progress
- category cards
- budget item table/list
- search
- category and status filters
- create/edit/archive category
- create/edit/archive budget item
- VORA budget insights panel
- loading, empty, and error states

## Remaining Dependencies

- Apply the migration manually in Supabase when ready.
- Add production approval workflows for cost changes in a future sprint.
- Add invoice/document linkage after financial document storage is approved.
- Connect dashboard budget widgets to real aggregate queries when backend aggregation is approved.
