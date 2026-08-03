-- Vorqa AI Projects foundation
-- Additive and idempotent. Extends existing projects without replacing it.

create extension if not exists "pgcrypto";

alter table public.projects add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.projects add column if not exists project_manager_id uuid references public.employees(id) on delete set null;
alter table public.projects add column if not exists department_id uuid references public.departments(id) on delete set null;
alter table public.projects add column if not exists slug text;
alter table public.projects add column if not exists description text;
alter table public.projects add column if not exists metadata jsonb not null default '{}';
alter table public.projects add column if not exists created_at timestamptz not null default now();
alter table public.projects add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'projects_organization_id_slug_key'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects add constraint projects_organization_id_slug_key
      unique (organization_id, slug);
  end if;
end $$;

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  role text,
  joined_at timestamptz not null default now(),
  status text not null default 'active'
);

alter table public.project_members add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.project_members add column if not exists employee_id uuid references public.employees(id) on delete cascade;
alter table public.project_members add column if not exists role text;
alter table public.project_members add column if not exists joined_at timestamptz not null default now();
alter table public.project_members add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'project_members_project_id_employee_id_key'
      and conrelid = 'public.project_members'::regclass
  ) then
    alter table public.project_members add constraint project_members_project_id_employee_id_key
      unique (project_id, employee_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_members_status_check'
      and conrelid = 'public.project_members'::regclass
  ) then
    alter table public.project_members add constraint project_members_status_check
      check (status in ('active', 'inactive', 'removed'));
  end if;
end $$;

alter table public.project_members enable row level security;

drop policy if exists "Project members visible to organization members" on public.project_members;
drop policy if exists "Project members manageable by organization managers" on public.project_members;

create policy "Project members visible to organization members" on public.project_members
  for select using (
    exists (
      select 1
      from public.projects p
      where p.id = project_members.project_id
        and (
          (p.organization_id is not null and public.is_organization_member(p.organization_id, auth.uid()))
          or p.owner_id = auth.uid()
        )
    )
  );

create policy "Project members manageable by organization managers" on public.project_members
  for all using (
    exists (
      select 1
      from public.projects p
      where p.id = project_members.project_id
        and (
          (p.organization_id is not null and (
            public.is_organization_owner(p.organization_id, auth.uid())
            or public.has_organization_permission(p.organization_id, auth.uid(), 'manage_organization')
          ))
          or p.owner_id = auth.uid()
        )
    )
  ) with check (
    exists (
      select 1
      from public.projects p
      where p.id = project_members.project_id
        and (
          (p.organization_id is not null and (
            public.is_organization_owner(p.organization_id, auth.uid())
            or public.has_organization_permission(p.organization_id, auth.uid(), 'manage_organization')
          ))
          or p.owner_id = auth.uid()
        )
    )
  );

drop policy if exists "Projects visible to organization members" on public.projects;
drop policy if exists "Projects manageable by organization managers" on public.projects;

create policy "Projects visible to organization members" on public.projects
  for select using (
    auth.uid() = owner_id
    or (
      organization_id is not null
      and public.is_organization_member(organization_id, auth.uid())
    )
  );

create policy "Projects manageable by organization managers" on public.projects
  for all using (
    auth.uid() = owner_id
    or (
      organization_id is not null
      and (
        public.is_organization_owner(organization_id, auth.uid())
        or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
      )
    )
  ) with check (
    auth.uid() = owner_id
    or (
      organization_id is not null
      and (
        public.is_organization_owner(organization_id, auth.uid())
        or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
      )
    )
  );

create index if not exists projects_organization_id_idx on public.projects(organization_id);
create index if not exists projects_department_id_idx on public.projects(department_id);
create index if not exists projects_project_manager_id_idx on public.projects(project_manager_id);
create index if not exists projects_slug_idx on public.projects(slug);
create index if not exists project_members_project_id_idx on public.project_members(project_id);
create index if not exists project_members_employee_id_idx on public.project_members(employee_id);
create index if not exists project_members_status_idx on public.project_members(status);
