# VORQA Migration Execution Plan

## Purpose

This plan defines the staging execution order for VORQA production database foundations. Migrations must be applied manually in Supabase staging first. Do not execute production migrations automatically from the application.

## Pre-Flight

1. Create or reset a Supabase staging project.
2. Apply `database/supabase-schema.sql` if this is a fresh project.
3. Confirm extensions:
   - `pgcrypto`
4. Confirm base tables:
   - `profiles`
   - `projects`
   - `documents`
   - `generation_history`
   - `favorites`
   - `user_settings`
   - `knowledge_files`
5. Confirm helper functions:
   - `public.is_organization_member`
   - `public.is_organization_owner`
   - `public.has_organization_permission`

## Exact Execution Order

1. `database/migrations/20260718_organizations_foundation.sql`
   - Creates organizations, members, roles, and permission helpers.

2. `database/migrations/20260718_departments_foundation.sql`
   - Depends on organizations.

3. `database/migrations/20260718_employees_foundation.sql`
   - Depends on organizations, departments, profiles.

4. `database/migrations/20260718_project_foundation.sql`
   - Extends existing projects safely.
   - Depends on organizations, departments, employees.

5. `database/migrations/20260718_tasks_foundation.sql`
   - Depends on projects, organizations, departments, employees.

6. `database/migrations/20260718_timeline_foundation.sql`
   - Creates milestones and task dependencies.
   - Depends on projects, organizations, tasks.

7. `database/migrations/20260718_budget_foundation.sql`
   - Depends on organizations, projects, departments, tasks, timeline.

8. `database/migrations/20260718_documents_foundation.sql`
   - Extends documents metadata.
   - Depends on organizations, projects, departments, profiles.

9. `database/migrations/20260719_knowledge_foundation.sql`
   - Creates knowledge articles.
   - Depends on organizations, projects, documents, profiles.

10. `database/migrations/20260719_marketplace_backend.sql`
    - Creates marketplace persistence.
    - Depends on organizations, profiles, projects, documents, employees.

11. `database/migrations/20260719_notifications_foundation.sql`
    - Creates notification persistence.
    - Depends on organizations, projects, profiles.

12. `database/migrations/20260720_billing_foundation.sql`
    - Creates billing plans, subscriptions, usage, invoices, payment methods.
    - Depends on organizations and profiles.

## Storage Setup Order

Run after migrations:

1. `database/storage/knowledge_bucket.sql`
2. `database/storage/project_documents_bucket.sql`

## Duplicate or Overlapping Schema

- Base `projects`, `documents`, `knowledge_files`, `generation_history`, `favorites`, and `user_settings` are defined in `database/supabase-schema.sql`.
- Later migrations extend existing tables idempotently with `alter table ... add column if not exists`.
- `20260718_timeline_foundation.sql` is now an explicit schema migration, not an empty placeholder.
- Marketplace/RFQ/quotation/contract demo routes may exist before production backend is fully enabled; repository auto mode protects the UI with demo fallback.

## Pending Migrations

All migrations remain pending until manually executed in staging and production. The application does not apply migrations automatically.

## Rollback Notes

Preferred rollback is application-level rollback. Database rollback should be manual and conservative:

- Do not drop tables containing beta user data.
- Prefer disabling new UI access or switching `NEXT_PUBLIC_DATA_SOURCE=auto`.
- Use backups before destructive changes.
- If a migration fails midway, stop and inspect partial objects before re-running.

## Verification Scripts

Run after migrations:

- `database/verification/rc1_1_schema_verification.sql`
- `database/verification/rc1_1_policy_verification.sql`
- `database/verification/rc1_1_access_test_template.sql`

## Major Module Verification Queries

Table existence:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

RLS status:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Policies:

```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
```

Foreign keys:

```sql
select conrelid::regclass as table_name, conname
from pg_constraint
where contype = 'f'
  and connamespace = 'public'::regnamespace
order by table_name::text, conname;
```
