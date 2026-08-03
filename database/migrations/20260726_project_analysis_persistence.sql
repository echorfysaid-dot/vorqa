-- Vorqa AI Project Analysis Persistence
-- Additive and idempotent. Supports Sprint 32 durable Construction Intelligence history.

create extension if not exists "pgcrypto";

create table if not exists public.project_analysis_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_analyses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.project_analysis_sessions(id) on delete cascade,
  project_id text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  tool_type text not null,
  status text not null default 'completed',
  version integer not null,
  analysis_result jsonb not null default '{}',
  health text not null default 'Needs Review',
  confidence numeric,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_analysis_sessions add column if not exists project_id text;
alter table public.project_analysis_sessions add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.project_analysis_sessions add column if not exists status text not null default 'active';
alter table public.project_analysis_sessions add column if not exists metadata jsonb not null default '{}';
alter table public.project_analysis_sessions add column if not exists created_at timestamptz not null default now();
alter table public.project_analysis_sessions add column if not exists updated_at timestamptz not null default now();

alter table public.project_analyses add column if not exists session_id uuid references public.project_analysis_sessions(id) on delete cascade;
alter table public.project_analyses add column if not exists project_id text;
alter table public.project_analyses add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.project_analyses add column if not exists tool_type text;
alter table public.project_analyses add column if not exists status text not null default 'completed';
alter table public.project_analyses add column if not exists version integer;
alter table public.project_analyses add column if not exists analysis_result jsonb not null default '{}';
alter table public.project_analyses add column if not exists health text not null default 'Needs Review';
alter table public.project_analyses add column if not exists confidence numeric;
alter table public.project_analyses add column if not exists metadata jsonb not null default '{}';
alter table public.project_analyses add column if not exists created_at timestamptz not null default now();
alter table public.project_analyses add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'project_analysis_sessions_status_check'
      and conrelid = 'public.project_analysis_sessions'::regclass
  ) then
    alter table public.project_analysis_sessions add constraint project_analysis_sessions_status_check
      check (status in ('active', 'archived'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_analyses_status_check'
      and conrelid = 'public.project_analyses'::regclass
  ) then
    alter table public.project_analyses add constraint project_analyses_status_check
      check (status in ('completed', 'failed', 'pending'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_analyses_tool_type_check'
      and conrelid = 'public.project_analyses'::regclass
  ) then
    alter table public.project_analyses add constraint project_analyses_tool_type_check
      check (tool_type in ('contract_review', 'boq_review', 'risk_assessment', 'planning_review', 'site_report_review', 'executive_summary'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_analyses_version_check'
      and conrelid = 'public.project_analyses'::regclass
  ) then
    alter table public.project_analyses add constraint project_analyses_version_check
      check (version >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_analyses_project_owner_tool_version_key'
      and conrelid = 'public.project_analyses'::regclass
  ) then
    alter table public.project_analyses add constraint project_analyses_project_owner_tool_version_key
      unique (project_id, owner_id, tool_type, version);
  end if;
end $$;

alter table public.project_analysis_sessions enable row level security;
alter table public.project_analyses enable row level security;

drop policy if exists "project analysis sessions readable by owner" on public.project_analysis_sessions;
drop policy if exists "project analysis sessions manageable by owner" on public.project_analysis_sessions;
drop policy if exists "project analyses readable by owner" on public.project_analyses;
drop policy if exists "project analyses manageable by owner" on public.project_analyses;

create policy "project analysis sessions readable by owner" on public.project_analysis_sessions
  for select using (owner_id = auth.uid());

create policy "project analysis sessions manageable by owner" on public.project_analysis_sessions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "project analyses readable by owner" on public.project_analyses
  for select using (owner_id = auth.uid());

create policy "project analyses manageable by owner" on public.project_analyses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create index if not exists project_analysis_sessions_project_owner_idx
  on public.project_analysis_sessions(project_id, owner_id, status);

create index if not exists project_analyses_project_tool_version_idx
  on public.project_analyses(project_id, tool_type, version desc);

create index if not exists project_analyses_owner_project_idx
  on public.project_analyses(owner_id, project_id, updated_at desc);

