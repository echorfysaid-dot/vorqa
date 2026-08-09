-- Production compatibility for account-aware onboarding.
-- Additive and idempotent; safe to apply after any earlier onboarding migration.

alter table public.profiles add column if not exists account_type text;
alter table public.profiles add column if not exists organization_type text;
alter table public.profiles add column if not exists primary_role text;
alter table public.profiles add column if not exists onboarding_status text;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists active_workspace_type text;
alter table public.profiles add column if not exists workspace_configuration jsonb not null default '{}';
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists country text;

update public.profiles
set account_type = case
  when primary_role = 'company' then 'organization'
  when account_type is null and primary_role is not null then 'individual'
  else account_type
end,
organization_type = case
  when primary_role = 'company' and organization_type is null then 'construction_company'
  else organization_type
end,
primary_role = case when primary_role = 'company' then null else primary_role end
where account_type is null or primary_role = 'company';

alter table public.profiles drop constraint if exists profiles_account_type_check;
alter table public.profiles drop constraint if exists profiles_organization_type_check;
alter table public.profiles drop constraint if exists profiles_primary_role_check;
alter table public.profiles drop constraint if exists profiles_workspace_type_check;

alter table public.profiles add constraint profiles_account_type_check
  check (account_type is null or account_type in ('individual', 'organization'));
alter table public.profiles add constraint profiles_organization_type_check
  check (organization_type is null or organization_type in (
    'construction_company', 'engineering_office', 'architecture_studio',
    'supplier_company', 'real_estate_developer'
  ));
alter table public.profiles add constraint profiles_primary_role_check
  check (primary_role is null or primary_role in (
    'project_owner', 'contractor', 'engineer', 'architect',
    'supplier', 'worker', 'inspector', 'other'
  ));
alter table public.profiles add constraint profiles_workspace_type_check
  check (active_workspace_type is null or active_workspace_type in (
    'individual_project_owner', 'individual_contractor', 'individual_engineer',
    'individual_architect', 'individual_supplier', 'individual_worker',
    'individual_inspector', 'individual_other',
    'organization_construction_company', 'organization_engineering_office',
    'organization_architecture_studio', 'organization_supplier_company',
    'organization_real_estate_developer'
  ));

create index if not exists profiles_account_type_idx on public.profiles(account_type);
create index if not exists profiles_organization_type_idx on public.profiles(organization_type);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, preferred_language, phone, country,
    account_type, primary_role, organization_type, onboarding_status,
    active_workspace_type
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'preferred_language', 'en'),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'country',
    new.raw_user_meta_data ->> 'account_type',
    new.raw_user_meta_data ->> 'primary_role',
    new.raw_user_meta_data ->> 'organization_type',
    coalesce(new.raw_user_meta_data ->> 'onboarding_status', 'account_created'),
    new.raw_user_meta_data ->> 'active_workspace_type'
  ) on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    country = coalesce(excluded.country, public.profiles.country),
    account_type = coalesce(excluded.account_type, public.profiles.account_type),
    primary_role = coalesce(excluded.primary_role, public.profiles.primary_role),
    organization_type = coalesce(excluded.organization_type, public.profiles.organization_type),
    onboarding_status = coalesce(excluded.onboarding_status, public.profiles.onboarding_status),
    active_workspace_type = coalesce(excluded.active_workspace_type, public.profiles.active_workspace_type),
    updated_at = now();

  insert into public.user_settings (owner_id)
  values (new.id)
  on conflict (owner_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of raw_user_meta_data, email on auth.users
  for each row execute function public.handle_new_user();
