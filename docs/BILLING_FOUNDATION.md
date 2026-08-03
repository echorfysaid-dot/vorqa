# Billing Foundation

Sprint 19.1 introduces the VORQA billing and subscription foundation without connecting live payment providers or changing existing business workflows.

## Scope

Billing supports:

- Free, Starter, Professional, and Enterprise plans
- organization subscriptions
- trials
- usage records
- invoices
- payment methods
- future payment provider abstraction
- dashboard billing visibility

## Repository Flow

The module follows the existing architecture:

UI -> billingHooks -> billingRepository -> demo/supabase adapter -> mapper -> domain models

Modes:

- `demo`: realistic Atlas billing data.
- `supabase`: reads future billing tables.
- `auto`: tries Supabase first and falls back to demo data when billing tables are unavailable.

## Models

Created in `lib/models/billing.ts`:

- `Plan`
- `Subscription`
- `OrganizationSubscription`
- `UsageRecord`
- `Invoice`
- `PaymentMethod`
- `BillingSummary`
- `TrialStatus`
- `BillingProviderAdapter`

## Plans

Plans:

- Free
- Starter
- Professional
- Enterprise

Each plan defines limits for:

- organizations
- members
- projects
- storage
- AI requests
- marketplace actions
- RFQs
- contracts
- notifications
- documents

## Payment Provider Abstraction

Prepared provider interface for:

- Stripe
- Lemon Squeezy
- Manual invoices

No live checkout, webhook, or payment provider secret is connected in this sprint.

## Database Foundation

Generated migration:

- `database/migrations/20260720_billing_foundation.sql`

Tables:

- `billing_plans`
- `organization_subscriptions`
- `billing_usage_records`
- `billing_invoices`
- `billing_payment_methods`

The migration is generated only and must be reviewed before manual Supabase execution.

## RLS Strategy

- Authenticated users can read plan definitions.
- Organization members can read subscriptions, invoices, and usage for their organization.
- Organization owners and `manage_organization` members can manage subscription records.
- Payment methods are visible only to organization owners/managers.

## UI

Created:

- `/billing`
- `/billing/plans`
- `/billing/invoices`
- `/billing/usage`

Compatibility redirects:

- `/plans -> /billing/plans`
- `/invoices -> /billing/invoices`
- `/usage -> /billing/usage`

## Usage Tracking

Quota tracking is prepared for:

- AI generations
- projects
- documents
- storage
- marketplace actions
- RFQs
- contracts
- notifications

Quota enforcement is intentionally not active yet.

## Remaining Work

- Apply billing migration manually.
- Connect Stripe or Lemon Squeezy checkout.
- Add webhook handling.
- Persist usage increments from production modules.
- Add invoice PDF generation/download.
- Add payment failure notifications.
- Add org-level quota enforcement after beta validation.
