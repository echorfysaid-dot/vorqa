-- Vorqa AI Tasks foundation
-- Additive and idempotent. Depends on projects, organizations, departments, and employees foundations.

create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  assignee_employee_id uuid references public.employees(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete set null,
  title text not null,
  slug text,
  description text,
  status text not null default 'todo',
  priority text not null default 'medium',
  estimated_hours numeric,
  actual_hours numeric,
  progress integer not null default 0,
  start_date date,
  due_date date,
  completed_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.tasks add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.tasks add column if not exists department_id uuid references public.departments(id) on delete set null;
alter table public.tasks add column if not exists assignee_employee_id uuid references public.employees(id) on delete set null;
alter table public.tasks add column if not exists parent_task_id uuid references public.tasks(id) on delete set null;
alter table public.tasks add column if not exists title text;
alter table public.tasks add column if not exists slug text;
alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists status text not null default 'todo';
alter table public.tasks add column if not exists priority text not null default 'medium';
alter table public.tasks add column if not exists estimated_hours numeric;
alter table public.tasks add column if not exists actual_hours numeric;
alter table public.tasks add column if not exists progress integer not null default 0;
alter table public.tasks add column if not exists start_date date;
alter table public.tasks add column if not exists due_date date;
alter table public.tasks add column if not exists completed_at timestamptz;
alter table public.tasks add column if not exists metadata jsonb not null default '{}';
alter table public.tasks add column if not exists created_at timestamptz not null default now();
alter table public.tasks add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_status_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks add constraint tasks_status_check
      check (status in ('todo', 'in_progress', 'review', 'blocked', 'done', 'archived'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_priority_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks add constraint tasks_priority_check
      check (priority in ('low', 'medium', 'high', 'critical'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_progress_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks add constraint tasks_progress_check
      check (progress >= 0 and progress <= 100);
  end if;
end $$;

alter table public.tasks enable row level security;

drop policy if exists "Tasks visible to organization members" on public.tasks;
drop policy if exists "Tasks manageable by organization managers" on public.tasks;
drop policy if exists "Assigned employees can update task progress" on public.tasks;

create policy "Tasks visible to organization members" on public.tasks
  for select using (public.is_organization_member(organization_id, auth.uid()));

create policy "Tasks manageable by organization managers" on public.tasks
  for all using (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  ) with check (
    public.is_organization_owner(organization_id, auth.uid())
    or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
  );

create policy "Assigned employees can update task progress" on public.tasks
  for update using (
    exists (
      select 1
      from public.employees e
      where e.id = tasks.assignee_employee_id
        and e.profile_id = auth.uid()
        and e.organization_id = tasks.organization_id
        and e.status = 'active'
    )
  ) with check (
    exists (
      select 1
      from public.employees e
      where e.id = tasks.assignee_employee_id
        and e.profile_id = auth.uid()
        and e.organization_id = tasks.organization_id
        and e.status = 'active'
    )
  );

create or replace function public.set_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_tasks_updated_at();

create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists tasks_organization_id_idx on public.tasks(organization_id);
create index if not exists tasks_department_id_idx on public.tasks(department_id);
create index if not exists tasks_assignee_employee_id_idx on public.tasks(assignee_employee_id);
create index if not exists tasks_parent_task_id_idx on public.tasks(parent_task_id);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_priority_idx on public.tasks(priority);
create index if not exists tasks_due_date_idx on public.tasks(due_date);
