-- Vorqa AI Timeline and Milestones foundation
-- Additive and idempotent. Depends on organizations, projects, employees, and tasks foundations.

create extension if not exists "pgcrypto";

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'planned',
  progress integer not null default 0,
  start_date date,
  due_date date,
  completed_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.milestones add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.milestones add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.milestones add column if not exists title text;
alter table public.milestones add column if not exists description text;
alter table public.milestones add column if not exists status text not null default 'planned';
alter table public.milestones add column if not exists progress integer not null default 0;
alter table public.milestones add column if not exists start_date date;
alter table public.milestones add column if not exists due_date date;
alter table public.milestones add column if not exists completed_at timestamptz;
alter table public.milestones add column if not exists metadata jsonb not null default '{}';
alter table public.milestones add column if not exists created_at timestamptz not null default now();
alter table public.milestones add column if not exists updated_at timestamptz not null default now();

create table if not exists public.task_dependencies (
  id uuid primary key default gen_random_uuid(),
  predecessor_task_id uuid not null references public.tasks(id) on delete cascade,
  successor_task_id uuid not null references public.tasks(id) on delete cascade,
  dependency_type text not null default 'finish_to_start',
  created_at timestamptz not null default now()
);

alter table public.task_dependencies add column if not exists predecessor_task_id uuid references public.tasks(id) on delete cascade;
alter table public.task_dependencies add column if not exists successor_task_id uuid references public.tasks(id) on delete cascade;
alter table public.task_dependencies add column if not exists dependency_type text not null default 'finish_to_start';
alter table public.task_dependencies add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'milestones_status_check'
      and conrelid = 'public.milestones'::regclass
  ) then
    alter table public.milestones add constraint milestones_status_check
      check (status in ('planned', 'in_progress', 'completed', 'delayed', 'archived'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'milestones_progress_check'
      and conrelid = 'public.milestones'::regclass
  ) then
    alter table public.milestones add constraint milestones_progress_check
      check (progress >= 0 and progress <= 100);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'task_dependencies_type_check'
      and conrelid = 'public.task_dependencies'::regclass
  ) then
    alter table public.task_dependencies add constraint task_dependencies_type_check
      check (dependency_type in ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'task_dependencies_no_self_reference'
      and conrelid = 'public.task_dependencies'::regclass
  ) then
    alter table public.task_dependencies add constraint task_dependencies_no_self_reference
      check (predecessor_task_id <> successor_task_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'task_dependencies_unique_pair'
      and conrelid = 'public.task_dependencies'::regclass
  ) then
    alter table public.task_dependencies add constraint task_dependencies_unique_pair
      unique (predecessor_task_id, successor_task_id);
  end if;
end $$;

create or replace function public.validate_milestone_project_scope()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.projects p
    where p.id = new.project_id
      and p.organization_id = new.organization_id
  ) then
    raise exception 'Milestone project must belong to the same organization.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_milestone_project_scope on public.milestones;
create trigger validate_milestone_project_scope
  before insert or update of project_id, organization_id on public.milestones
  for each row execute function public.validate_milestone_project_scope();

create or replace function public.validate_task_dependency_scope()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.tasks predecessor
    join public.tasks successor on successor.id = new.successor_task_id
    where predecessor.id = new.predecessor_task_id
      and predecessor.organization_id = successor.organization_id
      and predecessor.project_id = successor.project_id
  ) then
    raise exception 'Task dependency tasks must belong to the same project and organization.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_task_dependency_scope on public.task_dependencies;
create trigger validate_task_dependency_scope
  before insert or update of predecessor_task_id, successor_task_id on public.task_dependencies
  for each row execute function public.validate_task_dependency_scope();

alter table public.milestones enable row level security;
alter table public.task_dependencies enable row level security;

drop policy if exists "Milestones visible to organization members" on public.milestones;
drop policy if exists "Milestones manageable by organization managers" on public.milestones;
drop policy if exists "Task dependencies visible to organization members" on public.task_dependencies;
drop policy if exists "Task dependencies manageable by organization managers" on public.task_dependencies;

create policy "Milestones visible to organization members" on public.milestones
  for select using (public.is_organization_member(organization_id, auth.uid()));

create policy "Milestones manageable by organization managers" on public.milestones
  for all using (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  ) with check (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  );

create policy "Task dependencies visible to organization members" on public.task_dependencies
  for select using (
    exists (
      select 1
      from public.tasks t
      where t.id = task_dependencies.predecessor_task_id
        and public.is_organization_member(t.organization_id, auth.uid())
    )
  );

create policy "Task dependencies manageable by organization managers" on public.task_dependencies
  for all using (
    exists (
      select 1
      from public.tasks predecessor
      join public.tasks successor on successor.id = task_dependencies.successor_task_id
      where predecessor.id = task_dependencies.predecessor_task_id
        and predecessor.organization_id = successor.organization_id
        and (
          public.is_organization_owner(predecessor.organization_id, auth.uid())
          or public.has_organization_permission(predecessor.organization_id, auth.uid(), 'manage_organization')
        )
    )
  ) with check (
    exists (
      select 1
      from public.tasks predecessor
      join public.tasks successor on successor.id = task_dependencies.successor_task_id
      where predecessor.id = task_dependencies.predecessor_task_id
        and predecessor.organization_id = successor.organization_id
        and (
          public.is_organization_owner(predecessor.organization_id, auth.uid())
          or public.has_organization_permission(predecessor.organization_id, auth.uid(), 'manage_organization')
        )
    )
  );

create or replace function public.set_milestones_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_milestones_updated_at on public.milestones;
create trigger set_milestones_updated_at
  before update on public.milestones
  for each row execute function public.set_milestones_updated_at();

create index if not exists milestones_project_id_idx on public.milestones(project_id);
create index if not exists milestones_organization_id_idx on public.milestones(organization_id);
create index if not exists milestones_status_idx on public.milestones(status);
create index if not exists milestones_due_date_idx on public.milestones(due_date);
create index if not exists milestones_project_due_date_idx on public.milestones(project_id, due_date);
create index if not exists task_dependencies_predecessor_task_id_idx on public.task_dependencies(predecessor_task_id);
create index if not exists task_dependencies_successor_task_id_idx on public.task_dependencies(successor_task_id);
create index if not exists task_dependencies_dependency_type_idx on public.task_dependencies(dependency_type);
