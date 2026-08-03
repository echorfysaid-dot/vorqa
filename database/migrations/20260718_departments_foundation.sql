-- Vorqa AI Departments foundation
-- Additive and idempotent. Depends on organizations foundation helper functions.

create extension if not exists "pgcrypto";

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  lead_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'active',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.departments add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.departments add column if not exists name text;
alter table public.departments add column if not exists slug text;
alter table public.departments add column if not exists description text;
alter table public.departments add column if not exists lead_user_id uuid references public.profiles(id) on delete set null;
alter table public.departments add column if not exists status text not null default 'active';
alter table public.departments add column if not exists metadata jsonb not null default '{}';
alter table public.departments add column if not exists created_at timestamptz not null default now();
alter table public.departments add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'departments_organization_id_slug_key'
      and conrelid = 'public.departments'::regclass
  ) then
    alter table public.departments add constraint departments_organization_id_slug_key
      unique (organization_id, slug);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'departments_status_check'
      and conrelid = 'public.departments'::regclass
  ) then
    alter table public.departments add constraint departments_status_check
      check (status in ('active', 'suspended', 'archived'));
  end if;
end $$;

alter table public.departments enable row level security;

drop policy if exists "Departments visible to organization members" on public.departments;
drop policy if exists "Departments insertable by organization managers" on public.departments;
drop policy if exists "Departments editable by organization managers" on public.departments;
drop policy if exists "Departments removable by organization managers" on public.departments;

create policy "Departments visible to organization members" on public.departments
  for select using (public.is_organization_member(organization_id, auth.uid()));

create policy "Departments insertable by organization managers" on public.departments
  for insert with check (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  );

create policy "Departments editable by organization managers" on public.departments
  for update using (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  ) with check (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  );

create policy "Departments removable by organization managers" on public.departments
  for delete using (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  );

create index if not exists departments_organization_id_idx on public.departments(organization_id);
create index if not exists departments_slug_idx on public.departments(slug);
create index if not exists departments_status_idx on public.departments(status);
create index if not exists departments_lead_user_id_idx on public.departments(lead_user_id);
