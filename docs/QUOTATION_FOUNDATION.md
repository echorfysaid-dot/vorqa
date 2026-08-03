# Quotation Management Foundation

Sprint 18.2 adds the frontend production foundation for quotation management and comparison.

## Scope

This sprint introduces quotation domain models, repository adapters, comparison logic, dashboard widgets, and top-level quotation routes.

No database migration, API change, authentication change, RFQ business logic change, or Marketplace business logic change was introduced.

## Repository Flow

- `quotationRepository` is the public data access layer.
- `quotationDemoAdapter` returns realistic construction quotation data derived from the existing RFQ quotation dataset.
- `quotationSupabaseAdapter` is table-ready for a future `quotations` table.
- `quotationMapper` maps demo and future Supabase records into domain objects and calculates totals, evaluations, comparisons, and recommendations.
- `quotationHooks` provide client-side loading, error, demo, Supabase, and auto-mode state.

The UI consumes repositories and hooks only. It does not call Supabase directly.

## Domain Model

The existing RFQ `Quotation` model remains backward-compatible and now supports richer production fields:

- RFQ, project, organization, and supplier references
- submission and expiration dates
- lead time, delivery terms, payment terms, and warranty
- commercial and technical notes
- attachment metadata
- itemized line items
- evaluation scores
- recommendation tags

Supporting models include:

- `QuotationItem`
- `QuotationSupplier`
- `QuotationDocument`
- `QuotationEvaluation`
- `QuotationScore`
- `QuotationComparison`
- `AwardRecommendation`

## Comparison Engine

The comparison engine produces:

- comparison matrix rows
- automatic line item totals
- technical score
- commercial score
- risk score
- overall weighted score
- lowest price recommendation
- best technical recommendation
- best value recommendation
- fastest delivery recommendation
- balanced award recommendation

VORA-style insights are generated from quotation data only. No OpenAI call is made in this sprint.

## UI Surfaces

New routes:

- `/quotations`
- `/quotations/[id]`
- `/quotations/compare`

Integrated surfaces:

- Dashboard quotation widget
- Global sidebar navigation
- Global search and command palette
- Quick actions
- RFQ detail quotation comparison action

## Supabase Readiness

The Supabase adapter expects a future `quotations` table with columns such as:

- `id`
- `owner_id`
- `organization_id`
- `project_id`
- `rfq_id`
- `supplier_id`
- `supplier_name`
- `supplier_slug`
- `currency`
- `total_price`
- `status`
- `submission_date`
- `expiration_date`
- `lead_time`
- `delivery_terms`
- `payment_terms`
- `warranty`
- `commercial_notes`
- `technical_notes`
- `attachments`
- `items`
- `evaluation`
- `metadata`
- `created_at`
- `updated_at`

Auto mode uses Supabase first and falls back to demo data if the future table is unavailable.

## Remaining Limitations

- No quotation database migration yet.
- No supplier portal submission workflow yet.
- No persisted reviewer notes yet.
- No real award persistence yet.
- No PDF, Excel, or contract export generation yet.
