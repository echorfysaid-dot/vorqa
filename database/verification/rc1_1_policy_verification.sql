-- Vorqa AI RC1.1 RLS policy verification
-- Run after applying migrations in staging. This script is read-only.

select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
  and tablename in (
    'organizations',
    'organization_members',
    'organization_roles',
    'departments',
    'employees',
    'projects',
    'project_members',
    'tasks',
    'milestones',
    'task_dependencies',
    'budget_categories',
    'project_budget_items',
    'documents',
    'knowledge_files',
    'knowledge_articles',
    'marketplace_companies',
    'marketplace_reviews',
    'marketplace_connections',
    'marketplace_messages',
    'notifications',
    'notification_recipients',
    'notification_preferences',
    'organization_subscriptions',
    'billing_usage_records',
    'billing_invoices',
    'billing_payment_methods',
    'objects'
  )
order by schemaname, tablename, policyname;

select
  p.proname as helper_function,
  pg_get_function_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_organization_member', 'is_organization_owner', 'has_organization_permission')
order by p.proname;
