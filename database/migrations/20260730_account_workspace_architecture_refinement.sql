-- Account, organization, workspace, and team hierarchy refinement.
-- Additive and idempotent. Review and apply through the normal Supabase process.

alter table public.profiles add column if not exists account_type text;
alter table public.profiles add column if not exists organization_type text;
alter table public.organizations add column if not exists organization_type text;

-- Convert the legacy company role into an organization identity without deleting data.
update public.profiles
set account_type = 'organization',
    organization_type = coalesce(organization_type, 'construction_company'),
    primary_role = null,
    active_workspace_type = 'organization_construction_company',
    workspace_configuration = coalesce(workspace_configuration, '{}'::jsonb)
      || jsonb_build_object('accountType', 'organization', 'role', null, 'organizationType', 'construction_company', 'workspaceType', 'organization_construction_company')
where primary_role = 'company';

update public.profiles
set account_type = coalesce(account_type, 'individual'),
    active_workspace_type = case
      when active_workspace_type in ('project_owner','contractor','engineer','architect','supplier','worker','inspector','other')
        then 'individual_' || active_workspace_type
      when active_workspace_type is null and primary_role is not null
        then 'individual_' || primary_role
      else active_workspace_type
    end
where primary_role in ('project_owner','contractor','engineer','architect','supplier','worker','inspector','other');

update public.organizations
set organization_type = case
  when lower(coalesce(industry, '')) like '%engineer%' then 'engineering_office'
  when lower(coalesce(industry, '')) like '%architect%' then 'architecture_studio'
  when lower(coalesce(industry, '')) like '%supplier%' then 'supplier_company'
  when lower(coalesce(industry, '')) like '%real estate%' or lower(coalesce(industry, '')) like '%developer%' then 'real_estate_developer'
  else 'construction_company'
end
where organization_type is null;

alter table public.profiles drop constraint if exists profiles_primary_role_check;
alter table public.profiles drop constraint if exists profiles_workspace_type_check;
alter table public.profiles drop constraint if exists profiles_account_type_check;
alter table public.profiles drop constraint if exists profiles_organization_type_check;
alter table public.organizations drop constraint if exists organizations_organization_type_check;

alter table public.profiles add constraint profiles_account_type_check
  check (account_type is null or account_type in ('individual','organization'));
alter table public.profiles add constraint profiles_primary_role_check
  check (primary_role is null or primary_role in ('project_owner','contractor','engineer','architect','supplier','worker','inspector','other'));
alter table public.profiles add constraint profiles_organization_type_check
  check (organization_type is null or organization_type in ('construction_company','engineering_office','architecture_studio','supplier_company','real_estate_developer'));
alter table public.profiles add constraint profiles_workspace_type_check
  check (active_workspace_type is null or active_workspace_type in (
    'individual_project_owner','individual_contractor','individual_engineer','individual_architect',
    'individual_supplier','individual_worker','individual_inspector','individual_other',
    'organization_construction_company','organization_engineering_office','organization_architecture_studio',
    'organization_supplier_company','organization_real_estate_developer'
  ));
alter table public.organizations add constraint organizations_organization_type_check
  check (organization_type is null or organization_type in ('construction_company','engineering_office','architecture_studio','supplier_company','real_estate_developer'));

create index if not exists profiles_account_type_idx on public.profiles(account_type);
create index if not exists profiles_organization_type_idx on public.profiles(organization_type);
create index if not exists organizations_organization_type_idx on public.organizations(organization_type);

create table if not exists public.organization_teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name),
  check (status in ('active','inactive','archived'))
);

create table if not exists public.organization_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.organization_teams(id) on delete cascade,
  organization_member_id uuid not null references public.organization_members(id) on delete cascade,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  unique (team_id, organization_member_id),
  check (status in ('active','inactive','removed'))
);

alter table public.projects add column if not exists team_id uuid references public.organization_teams(id) on delete set null;

create index if not exists organization_teams_organization_id_idx on public.organization_teams(organization_id);
create index if not exists organization_teams_department_id_idx on public.organization_teams(department_id);
create index if not exists organization_team_members_team_id_idx on public.organization_team_members(team_id);
create index if not exists organization_team_members_member_id_idx on public.organization_team_members(organization_member_id);
create index if not exists projects_team_id_idx on public.projects(team_id);

alter table public.organization_teams enable row level security;
alter table public.organization_team_members enable row level security;

drop policy if exists "Organization teams visible to members" on public.organization_teams;
create policy "Organization teams visible to members" on public.organization_teams
  for select using (public.is_organization_member(organization_id, auth.uid()));

drop policy if exists "Organization teams manageable by managers" on public.organization_teams;
create policy "Organization teams manageable by managers" on public.organization_teams
  for all using (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  ) with check (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  );

drop policy if exists "Team members visible to organization members" on public.organization_team_members;
create policy "Team members visible to organization members" on public.organization_team_members
  for select using (exists (
    select 1 from public.organization_teams t
    where t.id = organization_team_members.team_id
      and public.is_organization_member(t.organization_id, auth.uid())
  ));

drop policy if exists "Team members manageable by organization managers" on public.organization_team_members;
create policy "Team members manageable by organization managers" on public.organization_team_members
  for all using (exists (
    select 1 from public.organization_teams t
    where t.id = organization_team_members.team_id
      and (public.is_organization_owner(t.organization_id, auth.uid()) or public.has_organization_permission(t.organization_id, auth.uid(), 'manage_organization'))
  )) with check (exists (
    select 1 from public.organization_teams t
    where t.id = organization_team_members.team_id
      and (public.is_organization_owner(t.organization_id, auth.uid()) or public.has_organization_permission(t.organization_id, auth.uid(), 'manage_organization'))
  ));

create or replace function public.validate_project_team_scope()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.team_id is not null and not exists (
    select 1 from public.organization_teams t
    where t.id = new.team_id and t.organization_id = new.organization_id
  ) then
    raise exception 'Project team must belong to the project organization';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_project_team_scope_trigger on public.projects;
create trigger validate_project_team_scope_trigger
before insert or update of team_id, organization_id on public.projects
for each row execute function public.validate_project_team_scope();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, preferred_language, phone, country, account_type, primary_role, organization_type, onboarding_status, active_workspace_type)
  values (
    new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'preferred_language', 'en'), new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'country', new.raw_user_meta_data ->> 'account_type',
    new.raw_user_meta_data ->> 'primary_role', new.raw_user_meta_data ->> 'organization_type',
    coalesce(new.raw_user_meta_data ->> 'onboarding_status', 'account_created'),
    new.raw_user_meta_data ->> 'active_workspace_type'
  ) on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    country = coalesce(excluded.country, public.profiles.country),
    account_type = coalesce(excluded.account_type, public.profiles.account_type),
    primary_role = excluded.primary_role,
    organization_type = excluded.organization_type,
    onboarding_status = coalesce(excluded.onboarding_status, public.profiles.onboarding_status),
    active_workspace_type = coalesce(excluded.active_workspace_type, public.profiles.active_workspace_type),
    updated_at = now();
  insert into public.user_settings (owner_id) values (new.id) on conflict (owner_id) do nothing;
  return new;
end;
$$;
