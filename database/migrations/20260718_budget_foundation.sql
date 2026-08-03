-- Vorqa AI Budget and Cost Control foundation
-- Additive and idempotent. Depends on organizations, projects, departments, tasks, and timeline foundations.

create extension if not exists "pgcrypto";

create table if not exists public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.budget_categories add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.budget_categories add column if not exists name text;
alter table public.budget_categories add column if not exists description text;
alter table public.budget_categories add column if not exists color text;
alter table public.budget_categories add column if not exists created_at timestamptz not null default now();
alter table public.budget_categories add column if not exists updated_at timestamptz not null default now();

create table if not exists public.project_budget_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.budget_categories(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  title text not null,
  description text,
  planned_cost numeric not null default 0,
  actual_cost numeric not null default 0,
  committed_cost numeric not null default 0,
  status text not null default 'planned',
  priority text not null default 'medium',
  start_date date,
  end_date date,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_budget_items add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.project_budget_items add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.project_budget_items add column if not exists category_id uuid references public.budget_categories(id) on delete set null;
alter table public.project_budget_items add column if not exists department_id uuid references public.departments(id) on delete set null;
alter table public.project_budget_items add column if not exists title text;
alter table public.project_budget_items add column if not exists description text;
alter table public.project_budget_items add column if not exists planned_cost numeric not null default 0;
alter table public.project_budget_items add column if not exists actual_cost numeric not null default 0;
alter table public.project_budget_items add column if not exists committed_cost numeric not null default 0;
alter table public.project_budget_items add column if not exists status text not null default 'planned';
alter table public.project_budget_items add column if not exists priority text not null default 'medium';
alter table public.project_budget_items add column if not exists start_date date;
alter table public.project_budget_items add column if not exists end_date date;
alter table public.project_budget_items add column if not exists metadata jsonb not null default '{}';
alter table public.project_budget_items add column if not exists created_at timestamptz not null default now();
alter table public.project_budget_items add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'budget_categories_org_name_unique'
      and conrelid = 'public.budget_categories'::regclass
  ) then
    alter table public.budget_categories add constraint budget_categories_org_name_unique
      unique (organization_id, name);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_budget_items_status_check'
      and conrelid = 'public.project_budget_items'::regclass
  ) then
    alter table public.project_budget_items add constraint project_budget_items_status_check
      check (status in ('planned', 'approved', 'committed', 'paid', 'over_budget', 'archived'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_budget_items_priority_check'
      and conrelid = 'public.project_budget_items'::regclass
  ) then
    alter table public.project_budget_items add constraint project_budget_items_priority_check
      check (priority in ('low', 'medium', 'high', 'critical'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_budget_items_costs_check'
      and conrelid = 'public.project_budget_items'::regclass
  ) then
    alter table public.project_budget_items add constraint project_budget_items_costs_check
      check (planned_cost >= 0 and actual_cost >= 0 and committed_cost >= 0);
  end if;
end $$;

alter table public.budget_categories enable row level security;
alter table public.project_budget_items enable row level security;

drop policy if exists "Budget categories visible to organization members" on public.budget_categories;
drop policy if exists "Budget categories manageable by organization managers" on public.budget_categories;
drop policy if exists "Budget items visible to organization members" on public.project_budget_items;
drop policy if exists "Budget items manageable by organization managers" on public.project_budget_items;

create policy "Budget categories visible to organization members" on public.budget_categories
  for select using (public.is_organization_member(organization_id, auth.uid()));

create policy "Budget categories manageable by organization managers" on public.budget_categories
  for all using (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  ) with check (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  );

create policy "Budget items visible to organization members" on public.project_budget_items
  for select using (public.is_organization_member(organization_id, auth.uid()));

create policy "Budget items manageable by organization managers" on public.project_budget_items
  for all using (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  ) with check (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  );

create or replace function public.set_budget_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_budget_categories_updated_at on public.budget_categories;
create trigger set_budget_categories_updated_at
  before update on public.budget_categories
  for each row execute function public.set_budget_updated_at();

drop trigger if exists set_project_budget_items_updated_at on public.project_budget_items;
create trigger set_project_budget_items_updated_at
  before update on public.project_budget_items
  for each row execute function public.set_budget_updated_at();

create index if not exists budget_categories_organization_id_idx on public.budget_categories(organization_id);
create index if not exists project_budget_items_project_id_idx on public.project_budget_items(project_id);
create index if not exists project_budget_items_organization_id_idx on public.project_budget_items(organization_id);
create index if not exists project_budget_items_category_id_idx on public.project_budget_items(category_id);
create index if not exists project_budget_items_department_id_idx on public.project_budget_items(department_id);
create index if not exists project_budget_items_status_idx on public.project_budget_items(status);
create index if not exists project_budget_items_priority_idx on public.project_budget_items(priority);
create index if not exists project_budget_items_end_date_idx on public.project_budget_items(end_date);
