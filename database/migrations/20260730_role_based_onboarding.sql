-- Additive role-based onboarding foundation. Generate and review before applying.
alter table public.profiles add column if not exists primary_role text;
alter table public.profiles add column if not exists onboarding_status text;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists active_workspace_type text;
alter table public.profiles add column if not exists workspace_configuration jsonb not null default '{}';
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists country text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_primary_role_check') then
    alter table public.profiles add constraint profiles_primary_role_check check (primary_role is null or primary_role in ('project_owner','contractor','engineer','architect','supplier','worker','inspector','company','other'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_onboarding_status_check') then
    alter table public.profiles add constraint profiles_onboarding_status_check check (onboarding_status is null or onboarding_status in ('role_selected','account_created','workspace_setup','completed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_workspace_type_check') then
    alter table public.profiles add constraint profiles_workspace_type_check check (active_workspace_type is null or active_workspace_type in ('project_owner','contractor','engineer','architect','supplier','worker','inspector','company','other'));
  end if;
end $$;

create index if not exists profiles_primary_role_idx on public.profiles(primary_role);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, preferred_language, phone, country, primary_role, onboarding_status, active_workspace_type)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.raw_user_meta_data ->> 'preferred_language', 'en'), new.raw_user_meta_data ->> 'phone', new.raw_user_meta_data ->> 'country', new.raw_user_meta_data ->> 'primary_role', coalesce(new.raw_user_meta_data ->> 'onboarding_status', 'account_created'), new.raw_user_meta_data ->> 'active_workspace_type')
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    country = coalesce(excluded.country, public.profiles.country),
    primary_role = coalesce(excluded.primary_role, public.profiles.primary_role),
    onboarding_status = coalesce(excluded.onboarding_status, public.profiles.onboarding_status),
    active_workspace_type = coalesce(excluded.active_workspace_type, public.profiles.active_workspace_type),
    updated_at = now();
  insert into public.user_settings (owner_id) values (new.id) on conflict (owner_id) do nothing;
  return new;
end;
$$;
