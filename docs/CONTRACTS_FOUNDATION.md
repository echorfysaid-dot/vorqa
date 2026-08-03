# Contract & Award Management Foundation

Sprint 18.3 adds the frontend production foundation for Contract & Award Management.

## Scope

This sprint completes the procurement lifecycle foundation from RFQ to quotation selection to awarded contract.

No database migration, API change, authentication change, RFQ workflow change, Quotation workflow change, Marketplace business logic change, or Billing change was introduced.

## Repository Flow

- `contractRepository` is the public data access layer.
- `contractDemoAdapter` serves realistic construction contracts.
- `contractSupabaseAdapter` is prepared for a future `contracts` table.
- `contractMapper` converts demo and future Supabase records into the shared Contract domain model.
- `contractHooks` provide client-safe loading, error, demo, Supabase, and auto-mode state.

The UI consumes repositories and hooks only. Pages do not call Supabase directly.

## Award Workflow

The contract model supports award metadata created from a winning quotation:

- winning quotation
- supplier
- award date
- award reason
- approval notes
- award value
- currency
- project reference
- organization reference

The demo data connects `CON-1001` to `RFQ-1001` and `QTN-1001`.

## Contract Lifecycle

Contracts support:

- contract number
- title and description
- project and organization
- supplier
- contract type
- start and end dates
- status
- value and currency
- retention
- warranty
- attachment metadata

Supported lifecycle statuses include:

- Draft
- Internal Review
- Approved
- Rejected
- Executed
- Active
- Expiring
- Completed
- Closed
- Archived

## Milestones and Deliverables

Milestones support:

- title
- description
- due date
- status
- completion percentage
- linked deliverables

Deliverables support:

- description
- owner
- due date
- status
- evidence metadata
- acceptance status

## Payment Model

Payment schedules support:

- advance payments
- milestone payments
- final payments
- retention
- taxes
- currency
- payment status

## Approval Model

Approvals support:

- draft
- internal review
- approved
- rejected
- executed
- closed
- reviewer notes
- approval history

## Amendments

The domain model prepares support for:

- scope changes
- budget changes
- duration extensions
- version history
- change logs

No amendment editing workflow was implemented in this sprint.

## VORA Contract Intelligence

VORA-style demo insights include:

- contract summary
- missing clauses
- delivery risks
- payment schedule review
- milestone review
- budget risks
- executive summary
- contract checklist

No legal advice is provided, and no OpenAI call is made in this sprint.

## UI Surfaces

Updated:

- `/contracts`
- `/contracts/[id]`
- `/dashboard`

Integrations:

- linked RFQ navigation
- winning quotation navigation
- dashboard contract widgets
- award flow entry point

## Supabase Readiness

The Supabase adapter expects a future `contracts` table with JSON-backed nested fields until dedicated relational tables are introduced.

Candidate columns:

- `id`
- `owner_id`
- `organization_id`
- `project_id`
- `rfq_id`
- `quotation_id`
- `supplier_id`
- `supplier_name`
- `supplier_slug`
- `contract_number`
- `title`
- `description`
- `contract_type`
- `status`
- `value_amount`
- `currency`
- `retention`
- `warranty`
- `start_date`
- `end_date`
- `milestones`
- `deliverables`
- `payments`
- `parties`
- `approvals`
- `amendments`
- `documents`
- `timeline`
- `activity`
- `insights`
- `metadata`
- `created_at`
- `updated_at`

Auto mode uses Supabase first and falls back to demo data if the future table is unavailable.

## Remaining Limitations

- No contract migration yet.
- No real award persistence yet.
- No real contract generation or signature workflow yet.
- No amendment editing workflow yet.
- No legal review automation.
- No PDF or DOCX contract export generation yet.
