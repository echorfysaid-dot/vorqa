# RFQ Management Production Foundation

Sprint 18.1 introduces a production-ready frontend foundation for Request for Quotation management without changing authentication, Supabase schema, Marketplace business logic, Contracts, Billing, Projects, Documents, or VORA generation behavior.

## Purpose

RFQ Management lets organizations create, track, evaluate, and prepare supplier quotation workflows connected to:

- organizations
- projects
- marketplace suppliers
- document metadata
- VORA AI procurement intelligence

## Architecture

RFQ follows the existing Vorqa repository architecture:

- `lib/models/rfq.ts`
- `lib/repositories/rfqRepository.ts`
- `lib/repositories/rfqDemoAdapter.ts`
- `lib/repositories/rfqSupabaseAdapter.ts`
- `lib/repositories/rfqMapper.ts`
- `lib/repositories/rfqHooks.ts`

Pages consume repository methods and hooks. They do not call Supabase directly.

## Data Modes

Demo mode:

- Uses realistic construction RFQs from the existing demo dataset.
- Enriches them with production RFQ shape through the mapper.
- Supports dashboard, details, creation wizard, supplier selection, timeline, attachments metadata, and VORA-style insights.

Supabase mode:

- Prepared for a future `rfqs` table.
- Uses authenticated REST through the existing shared Supabase helper.
- Does not create migrations in this sprint.

Auto mode:

- Attempts Supabase first.
- Falls back to demo data when the future table is unavailable.

## Domain Models

RFQ models now cover:

- `RFQ`
- `RFQItem`
- `RFQDocument`
- `RFQSupplier`
- `RFQStatus`
- `RFQResponse`
- `RFQTimeline`
- `RFQSummary`
- `RFQInput`
- `RFQFilters`

Supported RFQ creation metadata:

- title
- description
- project
- organization
- category
- scope of work
- technical requirements
- budget range
- currency
- submission deadline
- delivery date
- priority
- visibility
- attachments metadata
- selected suppliers
- RFQ line items

## Workflow Statuses

Supported statuses:

- Draft
- Published
- Pending Responses
- Under Review
- Awarded
- Cancelled
- Closed

The legacy `Open` demo status is still supported for backward compatibility.

## Marketplace Supplier Selection

The new `/rfq/new` wizard lets users select one or multiple suppliers from the existing Marketplace demo data.

Supported UI filters:

- search
- category
- location
- verified status display
- rating display

No supplier invitations are persisted yet.

## VORA AI Integration

RFQ details include VORA-style intelligence panels for:

- RFQ summary
- scope review
- missing information detection
- supplier suggestions
- project risk highlights
- executive summary

No OpenAI call is introduced in this sprint. Future VORA integration can call the existing AI context/prompt architecture.

## UI Routes

New routes:

- `/rfq`
- `/rfq/new`
- `/rfq/[id]`

Existing Marketplace RFQ demo routes remain stable:

- `/marketplace/rfq`
- `/marketplace/rfq/new`
- `/marketplace/rfq/[id]`

Dashboard integration:

- RFQ summary widget
- status counts
- upcoming deadlines
- fallback mode badge

App shell integration:

- RFQ navigation item
- global search item
- command palette item
- quick action

## Future Supabase Table Candidate

No migration was created in Sprint 18.1. A future migration can introduce:

```sql
rfqs (
  id text primary key,
  owner_id uuid references profiles(id),
  organization_id uuid references organizations(id),
  project_id uuid references projects(id),
  title text not null,
  description text,
  project_name text,
  category text,
  scope_of_work text,
  technical_requirements text[],
  budget_range text,
  currency text default 'MAD',
  submission_deadline date,
  delivery_date date,
  priority text default 'Medium',
  visibility text default 'Invited Suppliers',
  status text default 'draft',
  attachments jsonb default '[]',
  suppliers jsonb default '[]',
  items jsonb default '[]',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

Future related tables:

- `rfq_items`
- `rfq_documents`
- `rfq_suppliers`
- `rfq_responses`
- `rfq_activity`
- `rfq_evaluations`

## Future RLS Expectations

Future RLS should ensure:

- organization members can read RFQs inside their organization
- project members can read RFQs for assigned projects
- owners, procurement managers, and members with `manage_organization` can create and update RFQs
- invited marketplace suppliers can read only RFQs where they are invited
- anonymous users have no RFQ access

## Remaining Limitations

- No database migration was created.
- No real supplier invitations are sent.
- No real document upload or attachment linking is implemented.
- No real supplier response submission is implemented.
- VORA RFQ insights are demo-generated.
- Supabase mode requires a future `rfqs` schema before returning live data.
