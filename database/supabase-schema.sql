-- Vorqa AI Supabase schema
-- Safe to run multiple times on a fresh or partially initialized Supabase project.
-- Ownership column is owner_id across private user-owned tables.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  plan text not null default 'starter',
  preferred_language text not null default 'ar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  type text not null default 'document',
  status text not null default 'draft',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  document_type text not null default 'document',
  language text not null default 'ar',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  tool_slug text not null,
  provider text not null default 'mock',
  input_payload jsonb not null default '{}',
  output_content text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  generation_id uuid not null references public.generation_history(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'system',
  default_provider text not null default 'mock',
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  original_name text not null,
  mime_type text not null,
  size bigint not null default 0,
  status text not null default 'uploaded',
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'knowledge',
  'knowledge',
  false,
  52428800,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Migration guard for older Vorqa drafts that used user_id.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'owner_id'
  ) then
    alter table public.projects rename column user_id to owner_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'documents' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'documents' and column_name = 'owner_id'
  ) then
    alter table public.documents rename column user_id to owner_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'generation_history' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'generation_history' and column_name = 'owner_id'
  ) then
    alter table public.generation_history rename column user_id to owner_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'favorites' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'favorites' and column_name = 'owner_id'
  ) then
    alter table public.favorites rename column user_id to owner_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_settings' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_settings' and column_name = 'owner_id'
  ) then
    alter table public.user_settings rename column user_id to owner_id;
  end if;
end $$;

-- Column guards for partially initialized projects.
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists plan text not null default 'starter';
alter table public.profiles add column if not exists preferred_language text not null default 'ar';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.projects add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.projects add column if not exists title text not null default 'Untitled project';
alter table public.projects add column if not exists type text not null default 'document';
alter table public.projects add column if not exists status text not null default 'draft';
alter table public.projects add column if not exists metadata jsonb not null default '{}';
alter table public.projects add column if not exists created_at timestamptz not null default now();
alter table public.projects add column if not exists updated_at timestamptz not null default now();

alter table public.documents add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.documents add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.documents add column if not exists title text not null default 'Untitled document';
alter table public.documents add column if not exists document_type text not null default 'document';
alter table public.documents add column if not exists language text not null default 'ar';
alter table public.documents add column if not exists content text not null default '';
alter table public.documents add column if not exists created_at timestamptz not null default now();
alter table public.documents add column if not exists updated_at timestamptz not null default now();

alter table public.generation_history add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.generation_history add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.generation_history add column if not exists tool_slug text not null default 'document';
alter table public.generation_history add column if not exists provider text not null default 'mock';
alter table public.generation_history add column if not exists input_payload jsonb not null default '{}';
alter table public.generation_history add column if not exists output_content text not null default '';
alter table public.generation_history add column if not exists created_at timestamptz not null default now();

alter table public.favorites add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.favorites add column if not exists generation_id uuid references public.generation_history(id) on delete cascade;
alter table public.favorites add column if not exists created_at timestamptz not null default now();

alter table public.user_settings add column if not exists theme text not null default 'system';
alter table public.user_settings add column if not exists default_provider text not null default 'mock';
alter table public.user_settings add column if not exists notifications_enabled boolean not null default true;
alter table public.user_settings add column if not exists created_at timestamptz not null default now();
alter table public.user_settings add column if not exists updated_at timestamptz not null default now();

alter table public.knowledge_files add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.knowledge_files add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.knowledge_files add column if not exists storage_path text;
alter table public.knowledge_files add column if not exists original_name text;
alter table public.knowledge_files add column if not exists mime_type text;
alter table public.knowledge_files add column if not exists size bigint not null default 0;
alter table public.knowledge_files add column if not exists status text not null default 'uploaded';
alter table public.knowledge_files add column if not exists created_at timestamptz not null default now();

-- Constraints are created only if missing.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_plan_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_plan_check
      check (plan in ('starter', 'pro', 'business'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_preferred_language_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_preferred_language_check
      check (preferred_language in ('ar', 'fr', 'en'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'projects_type_check'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects add constraint projects_type_check
      check (type in ('document', 'cv', 'landing_page', 'business_idea', 'marketing'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'projects_status_check'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects add constraint projects_status_check
      check (status in ('draft', 'saved', 'archived'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'documents_language_check'
      and conrelid = 'public.documents'::regclass
  ) then
    alter table public.documents add constraint documents_language_check
      check (language in ('ar', 'fr', 'en'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'generation_history_provider_check'
      and conrelid = 'public.generation_history'::regclass
  ) then
    alter table public.generation_history add constraint generation_history_provider_check
      check (provider in ('mock', 'openai', 'anthropic', 'gemini', 'openrouter'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'favorites_owner_id_generation_id_key'
      and conrelid = 'public.favorites'::regclass
  ) then
    alter table public.favorites add constraint favorites_owner_id_generation_id_key
      unique (owner_id, generation_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'user_settings_theme_check'
      and conrelid = 'public.user_settings'::regclass
  ) then
    alter table public.user_settings add constraint user_settings_theme_check
      check (theme in ('light', 'dark', 'system'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'user_settings_default_provider_check'
      and conrelid = 'public.user_settings'::regclass
  ) then
    alter table public.user_settings add constraint user_settings_default_provider_check
      check (default_provider in ('mock', 'openai', 'anthropic', 'gemini', 'openrouter'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'knowledge_files_status_check'
      and conrelid = 'public.knowledge_files'::regclass
  ) then
    alter table public.knowledge_files add constraint knowledge_files_status_check
      check (status in ('uploaded', 'processing', 'failed'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'knowledge_files_storage_path_key'
      and conrelid = 'public.knowledge_files'::regclass
  ) then
    alter table public.knowledge_files add constraint knowledge_files_storage_path_key
      unique (storage_path);
  end if;
end $$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.generation_history enable row level security;
alter table public.favorites enable row level security;
alter table public.user_settings enable row level security;
alter table public.knowledge_files enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
drop policy if exists "Profiles are insertable by owner" on public.profiles;
drop policy if exists "Profiles are editable by owner" on public.profiles;
drop policy if exists "Projects owned by user" on public.projects;
drop policy if exists "Documents owned by user" on public.documents;
drop policy if exists "History owned by user" on public.generation_history;
drop policy if exists "Favorites owned by user" on public.favorites;
drop policy if exists "Settings owned by user" on public.user_settings;
drop policy if exists "Projects owned by owner" on public.projects;
drop policy if exists "Documents owned by owner" on public.documents;
drop policy if exists "History owned by owner" on public.generation_history;
drop policy if exists "Favorites owned by owner" on public.favorites;
drop policy if exists "Settings owned by owner" on public.user_settings;
drop policy if exists "Knowledge files owned by owner" on public.knowledge_files;
drop policy if exists "Knowledge storage readable by owner" on storage.objects;
drop policy if exists "Knowledge storage insertable by owner" on storage.objects;
drop policy if exists "Knowledge storage editable by owner" on storage.objects;
drop policy if exists "Knowledge storage removable by owner" on storage.objects;

create policy "Profiles are readable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy "Profiles are insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Profiles are editable by owner" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Projects owned by owner" on public.projects
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Documents owned by owner" on public.documents
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "History owned by owner" on public.generation_history
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Favorites owned by owner" on public.favorites
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Settings owned by owner" on public.user_settings
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Knowledge files owned by owner" on public.knowledge_files
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Knowledge storage readable by owner" on storage.objects
  for select using (bucket_id = 'knowledge' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Knowledge storage insertable by owner" on storage.objects
  for insert with check (bucket_id = 'knowledge' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Knowledge storage editable by owner" on storage.objects
  for update using (bucket_id = 'knowledge' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'knowledge' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Knowledge storage removable by owner" on storage.objects
  for delete using (bucket_id = 'knowledge' and auth.uid()::text = (storage.foldername(name))[1]);

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists projects_owner_id_updated_at_idx on public.projects(owner_id, updated_at desc);
create index if not exists documents_owner_id_created_at_idx on public.documents(owner_id, created_at desc);
create index if not exists generation_history_owner_id_created_at_idx on public.generation_history(owner_id, created_at desc);
create index if not exists favorites_owner_id_created_at_idx on public.favorites(owner_id, created_at desc);
create index if not exists favorites_generation_id_idx on public.favorites(generation_id);
create index if not exists knowledge_files_owner_id_created_at_idx on public.knowledge_files(owner_id, created_at desc);
create index if not exists knowledge_files_project_id_created_at_idx on public.knowledge_files(project_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, preferred_language)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'ar'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    updated_at = now();

  insert into public.user_settings (owner_id)
  values (new.id)
  on conflict (owner_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
