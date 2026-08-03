-- Vorqa AI Employees foundation
-- Additive and idempotent. Depends on organizations and departments foundation.

create extension if not exists "pgcrypto";

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  manager_id uuid references public.employees(id) on delete set null,
  employee_number text,
  first_name text not null,
  last_name text not null,
  job_title text,
  phone text,
  employment_type text,
  status text not null default 'active',
  hire_date date,
  avatar_url text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employees add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.employees add column if not exists department_id uuid references public.departments(id) on delete set null;
alter table public.employees add column if not exists profile_id uuid references public.profiles(id) on delete set null;
alter table public.employees add column if not exists manager_id uuid references public.employees(id) on delete set null;
alter table public.employees add column if not exists employee_number text;
alter table public.employees add column if not exists first_name text;
alter table public.employees add column if not exists last_name text;
alter table public.employees add column if not exists job_title text;
alter table public.employees add column if not exists phone text;
alter table public.employees add column if not exists employment_type text;
alter table public.employees add column if not exists status text not null default 'active';
alter table public.employees add column if not exists hire_date date;
alter table public.employees add column if not exists avatar_url text;
alter table public.employees add column if not exists metadata jsonb not null default '{}';
alter table public.employees add column if not exists created_at timestamptz not null default now();
alter table public.employees add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'employees_organization_id_employee_number_key'
      and conrelid = 'public.employees'::regclass
  ) then
    alter table public.employees add constraint employees_organization_id_employee_number_key
      unique (organization_id, employee_number);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'employees_status_check'
      and conrelid = 'public.employees'::regclass
  ) then
    alter table public.employees add constraint employees_status_check
      check (status in ('active', 'away', 'pending', 'inactive', 'archived'));
  end if;
end $$;

alter table public.employees enable row level security;

drop policy if exists "Employees visible to organization members" on public.employees;
drop policy if exists "Employees insertable by organization managers" on public.employees;
drop policy if exists "Employees editable by organization managers" on public.employees;
drop policy if exists "Employees removable by organization managers" on public.employees;

create policy "Employees visible to organization members" on public.employees
  for select using (public.is_organization_member(organization_id, auth.uid()));

create policy "Employees insertable by organization managers" on public.employees
  for insert with check (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  );

create policy "Employees editable by organization managers" on public.employees
  for update using (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  ) with check (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  );

create policy "Employees removable by organization managers" on public.employees
  for delete using (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  );

create index if not exists employees_organization_id_idx on public.employees(organization_id);
create index if not exists employees_department_id_idx on public.employees(department_id);
create index if not exists employees_profile_id_idx on public.employees(profile_id);
create index if not exists employees_manager_id_idx on public.employees(manager_id);
create index if not exists employees_status_idx on public.employees(status);
