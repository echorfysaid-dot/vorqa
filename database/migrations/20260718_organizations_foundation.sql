-- Vorqa AI Organizations foundation
-- Additive and idempotent. Does not modify existing project/auth/OpenAI behavior.

create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  legal_name text,
  registration_number text,
  tax_number text,
  website text,
  logo_url text,
  industry text,
  company_size text,
  address jsonb not null default '{}',
  city text,
  country text,
  timezone text not null default 'Africa/Casablanca',
  currency text not null default 'MAD',
  contact_email text,
  contact_phone text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  permissions jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid references public.organization_roles(id) on delete set null,
  joined_at timestamptz not null default now(),
  status text not null default 'active'
);

alter table public.organizations add column if not exists name text;
alter table public.organizations add column if not exists slug text;
alter table public.organizations add column if not exists legal_name text;
alter table public.organizations add column if not exists registration_number text;
alter table public.organizations add column if not exists tax_number text;
alter table public.organizations add column if not exists website text;
alter table public.organizations add column if not exists logo_url text;
alter table public.organizations add column if not exists industry text;
alter table public.organizations add column if not exists company_size text;
alter table public.organizations add column if not exists address jsonb not null default '{}';
alter table public.organizations add column if not exists city text;
alter table public.organizations add column if not exists country text;
alter table public.organizations add column if not exists timezone text not null default 'Africa/Casablanca';
alter table public.organizations add column if not exists currency text not null default 'MAD';
alter table public.organizations add column if not exists contact_email text;
alter table public.organizations add column if not exists contact_phone text;
alter table public.organizations add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.organizations add column if not exists status text not null default 'active';
alter table public.organizations add column if not exists created_at timestamptz not null default now();
alter table public.organizations add column if not exists updated_at timestamptz not null default now();

alter table public.organization_roles add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.organization_roles add column if not exists name text;
alter table public.organization_roles add column if not exists description text;
alter table public.organization_roles add column if not exists permissions jsonb not null default '{}';
alter table public.organization_roles add column if not exists created_at timestamptz not null default now();

alter table public.organization_members add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.organization_members add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.organization_members add column if not exists role_id uuid references public.organization_roles(id) on delete set null;
alter table public.organization_members add column if not exists joined_at timestamptz not null default now();
alter table public.organization_members add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_slug_key'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations add constraint organizations_slug_key unique (slug);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_status_check'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations add constraint organizations_status_check
      check (status in ('active', 'invited', 'suspended', 'archived'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'organization_roles_organization_id_name_key'
      and conrelid = 'public.organization_roles'::regclass
  ) then
    alter table public.organization_roles add constraint organization_roles_organization_id_name_key
      unique (organization_id, name);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'organization_members_organization_id_user_id_key'
      and conrelid = 'public.organization_members'::regclass
  ) then
    alter table public.organization_members add constraint organization_members_organization_id_user_id_key
      unique (organization_id, user_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'organization_members_status_check'
      and conrelid = 'public.organization_members'::regclass
  ) then
    alter table public.organization_members add constraint organization_members_status_check
      check (status in ('active', 'invited', 'suspended', 'removed'));
  end if;
end $$;

create or replace function public.is_organization_owner(target_organization_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = target_organization_id
      and o.owner_id = target_user_id
      and o.status <> 'archived'
  );
$$;

create or replace function public.is_organization_member(target_organization_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_organization_owner(target_organization_id, target_user_id)
    or exists (
      select 1
      from public.organization_members m
      where m.organization_id = target_organization_id
        and m.user_id = target_user_id
        and m.status = 'active'
    );
$$;

create or replace function public.has_organization_permission(target_organization_id uuid, target_user_id uuid, permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_organization_owner(target_organization_id, target_user_id)
    or exists (
      select 1
      from public.organization_members m
      join public.organization_roles r on r.id = m.role_id
      where m.organization_id = target_organization_id
        and m.user_id = target_user_id
        and m.status = 'active'
        and coalesce((r.permissions ->> permission_key)::boolean, false)
    );
$$;

alter table public.organizations enable row level security;
alter table public.organization_roles enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists "Organizations visible to members" on public.organizations;
drop policy if exists "Organizations insertable by owner" on public.organizations;
drop policy if exists "Organizations manageable by owner or admins" on public.organizations;
drop policy if exists "Organizations removable by owner" on public.organizations;
drop policy if exists "Organization roles visible to members" on public.organization_roles;
drop policy if exists "Organization roles manageable by owners or admins" on public.organization_roles;
drop policy if exists "Organization members visible to members" on public.organization_members;
drop policy if exists "Organization members manageable by owners or admins" on public.organization_members;

create policy "Organizations visible to members" on public.organizations
  for select using (public.is_organization_member(id, auth.uid()));

create policy "Organizations insertable by owner" on public.organizations
  for insert with check (owner_id = auth.uid());

create policy "Organizations manageable by owner or admins" on public.organizations
  for update using (
    public.is_organization_owner(id, auth.uid())
    or public.has_organization_permission(id, auth.uid(), 'manage_organization')
  ) with check (
    public.is_organization_owner(id, auth.uid())
    or public.has_organization_permission(id, auth.uid(), 'manage_organization')
  );

create policy "Organizations removable by owner" on public.organizations
  for delete using (public.is_organization_owner(id, auth.uid()));

create policy "Organization roles visible to members" on public.organization_roles
  for select using (public.is_organization_member(organization_id, auth.uid()));

create policy "Organization roles manageable by owners or admins" on public.organization_roles
  for all using (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_roles')
  ) with check (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_roles')
  );

create policy "Organization members visible to members" on public.organization_members
  for select using (public.is_organization_member(organization_id, auth.uid()));

create policy "Organization members manageable by owners or admins" on public.organization_members
  for all using (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_members')
  ) with check (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_members')
  );

create index if not exists organizations_owner_id_idx on public.organizations(owner_id);
create index if not exists organizations_slug_idx on public.organizations(slug);
create index if not exists organizations_status_idx on public.organizations(status);
create index if not exists organization_roles_organization_id_idx on public.organization_roles(organization_id);
create index if not exists organization_members_organization_id_idx on public.organization_members(organization_id);
create index if not exists organization_members_user_id_idx on public.organization_members(user_id);
create index if not exists organization_members_role_id_idx on public.organization_members(role_id);
