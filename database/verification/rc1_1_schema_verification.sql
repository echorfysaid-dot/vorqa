-- Vorqa AI RC1.1 staging schema verification
-- Run after applying migrations in staging. This script is read-only.

with expected_tables(table_name) as (
  values
    ('profiles'),
    ('organizations'),
    ('organization_members'),
    ('organization_roles'),
    ('departments'),
    ('employees'),
    ('projects'),
    ('project_members'),
    ('tasks'),
    ('milestones'),
    ('task_dependencies'),
    ('budget_categories'),
    ('project_budget_items'),
    ('documents'),
    ('knowledge_files'),
    ('knowledge_articles'),
    ('marketplace_companies'),
    ('marketplace_reviews'),
    ('marketplace_connections'),
    ('marketplace_messages'),
    ('notifications'),
    ('notification_recipients'),
    ('notification_preferences'),
    ('billing_plans'),
    ('organization_subscriptions'),
    ('billing_usage_records'),
    ('billing_invoices'),
    ('billing_payment_methods')
)
select
  e.table_name,
  case when t.table_name is null then 'missing' else 'present' end as status
from expected_tables e
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = e.table_name
order by e.table_name;

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
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
    'notifications',
    'organization_subscriptions'
  )
order by tablename;

select
  conrelid::regclass as table_name,
  conname as constraint_name,
  contype as constraint_type
from pg_constraint
where connamespace = 'public'::regnamespace
order by table_name::text, constraint_name;

select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
