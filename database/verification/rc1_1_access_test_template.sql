-- Vorqa AI RC1.1 access test template
-- Run manually with staged test users through the Supabase SQL editor or API clients.
-- Replace IDs before use. This script intentionally avoids writes by default.

-- 1. Owner should see their organizations.
-- set role authenticated;
-- select * from public.organizations where id = '<owner_org_id>';

-- 2. Active member should read organization projects.
-- select * from public.projects where organization_id = '<member_org_id>';

-- 3. Unauthorized member should receive zero rows for another organization.
-- select * from public.projects where organization_id = '<other_org_id>';

-- 4. Anonymous access should receive zero private rows.
-- reset role;
-- select * from public.organizations;

-- 5. Storage path contract checks.
-- knowledge bucket path: <auth.uid>/<project_id>/<filename>
-- vorqa-project-documents bucket path: <organization_id>/<project_id>/<filename>

-- 6. Authenticated CRUD smoke tests should be performed from the application using:
-- organizations, projects, tasks, milestones, budgets, documents, knowledge, marketplace, notifications, billing.
