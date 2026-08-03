# VORQA Supabase Production Guide

## Migration Order

On a fresh project, apply:

1. `database/supabase-schema.sql`
2. `database/migrations/20260718_organizations_foundation.sql`
3. `database/migrations/20260718_departments_foundation.sql`
4. `database/migrations/20260718_employees_foundation.sql`
5. `database/migrations/20260718_project_foundation.sql`
6. `database/migrations/20260718_tasks_foundation.sql`
7. `database/migrations/20260718_timeline_foundation.sql`
8. `database/migrations/20260718_budget_foundation.sql`
9. `database/migrations/20260718_documents_foundation.sql`
10. `database/migrations/20260719_knowledge_foundation.sql`
11. `database/migrations/20260719_marketplace_backend.sql`
12. `database/migrations/20260719_notifications_foundation.sql`
13. `database/migrations/20260720_billing_foundation.sql`

Detailed dependencies are documented in `docs/MIGRATION_EXECUTION_PLAN.md`.

## Storage Buckets

Create manually:

- `knowledge`
- `vorqa-project-documents`

Use:

- `database/storage/knowledge_bucket.sql`
- `database/storage/project_documents_bucket.sql`

Bucket requirements:

- private buckets
- authenticated upload only
- scoped paths
- safe download policies
- delete permissions restricted to owners/managers

## RLS Verification

Run:

- `database/verification/rc1_1_schema_verification.sql`
- `database/verification/rc1_1_policy_verification.sql`
- `database/verification/rc1_1_access_test_template.sql`

Required access outcomes:

- anonymous users cannot read private records
- owners can manage their organizations
- members can read allowed organization/project records
- unauthorized members cannot read another organization's records
- storage access follows project/organization scoping

## Policies

Policy families to verify:

- profiles ownership
- organization membership
- organization owner/admin management
- project membership visibility
- document and knowledge ownership
- marketplace public verified browsing
- marketplace owner management
- notification recipient visibility
- billing organization management

## Backup Recommendations

Staging:

- daily logical backup during active testing
- backup before every migration test

Production beta:

- daily database backup
- point-in-time recovery if available
- weekly restore drill
- storage object inventory export

## Recovery Plan

1. Freeze user writes if data integrity is at risk.
2. Identify affected tables and time window.
3. Restore to staging first.
4. Validate restored auth, organizations, projects, documents, knowledge, and billing.
5. Restore production only after sign-off.
6. Document incident and corrective action.

## Production Notes

- Do not run migrations from the application.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
- Verify auth redirect URLs before inviting beta users.
- Keep `NEXT_PUBLIC_DATA_SOURCE=auto` for early beta unless full Supabase coverage is confirmed.
