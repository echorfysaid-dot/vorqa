-- Vorqa AI Workflow Persistence - Phase 1A
-- Additive, idempotent migration preparation only.
-- Review and apply through the normal staged Supabase process; never from the application.
-- Depends on the existing profiles, organizations, projects, documents, tasks, and authorization helper migrations.

create extension if not exists "pgcrypto";

create table if not exists public.project_workflows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  workflow_group_id uuid not null,
  revision integer not null default 1,
  previous_revision_id uuid references public.project_workflows(id) on delete restrict,
  workflow_type text not null,
  subject_kind text not null,
  document_id uuid references public.documents(id) on delete restrict,
  task_id uuid references public.tasks(id) on delete restrict,
  subject_key text,
  subject_version text,
  subject_snapshot jsonb not null default '{}'::jsonb,
  lifecycle_stage text not null,
  status text not null default 'draft',
  is_current boolean not null default true,
  assigned_role text,
  assigned_user_id uuid references public.profiles(id) on delete set null,
  reviewer_role text,
  reviewer_user_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lock_version integer not null default 1
);

create table if not exists public.project_workflow_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  workflow_id uuid not null references public.project_workflows(id) on delete restrict,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  event_type text not null,
  from_status text,
  to_status text,
  from_role text,
  to_role text,
  reason text,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text,
  created_at timestamptz not null default now()
);

create table if not exists public.project_lifecycle_transitions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  from_stage text,
  to_stage text not null,
  gate_snapshot jsonb not null default '{}'::jsonb,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  reason text,
  source text not null,
  idempotency_key text,
  created_at timestamptz not null default now()
);

-- Column guards keep the migration safe if an interrupted non-production run created a table first.
alter table public.project_workflows add column if not exists project_id uuid references public.projects(id) on delete restrict;
alter table public.project_workflows add column if not exists workflow_group_id uuid;
alter table public.project_workflows add column if not exists revision integer not null default 1;
alter table public.project_workflows add column if not exists previous_revision_id uuid references public.project_workflows(id) on delete restrict;
alter table public.project_workflows add column if not exists workflow_type text;
alter table public.project_workflows add column if not exists subject_kind text;
alter table public.project_workflows add column if not exists document_id uuid references public.documents(id) on delete restrict;
alter table public.project_workflows add column if not exists task_id uuid references public.tasks(id) on delete restrict;
alter table public.project_workflows add column if not exists subject_key text;
alter table public.project_workflows add column if not exists subject_version text;
alter table public.project_workflows add column if not exists subject_snapshot jsonb not null default '{}'::jsonb;
alter table public.project_workflows add column if not exists lifecycle_stage text;
alter table public.project_workflows add column if not exists status text not null default 'draft';
alter table public.project_workflows add column if not exists is_current boolean not null default true;
alter table public.project_workflows add column if not exists assigned_role text;
alter table public.project_workflows add column if not exists assigned_user_id uuid references public.profiles(id) on delete set null;
alter table public.project_workflows add column if not exists reviewer_role text;
alter table public.project_workflows add column if not exists reviewer_user_id uuid references public.profiles(id) on delete set null;
alter table public.project_workflows add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.project_workflows add column if not exists created_at timestamptz not null default now();
alter table public.project_workflows add column if not exists updated_at timestamptz not null default now();
alter table public.project_workflows add column if not exists lock_version integer not null default 1;

alter table public.project_workflow_events add column if not exists project_id uuid references public.projects(id) on delete restrict;
alter table public.project_workflow_events add column if not exists workflow_id uuid references public.project_workflows(id) on delete restrict;
alter table public.project_workflow_events add column if not exists actor_id uuid references public.profiles(id) on delete set null;
alter table public.project_workflow_events add column if not exists actor_role text;
alter table public.project_workflow_events add column if not exists event_type text;
alter table public.project_workflow_events add column if not exists from_status text;
alter table public.project_workflow_events add column if not exists to_status text;
alter table public.project_workflow_events add column if not exists from_role text;
alter table public.project_workflow_events add column if not exists to_role text;
alter table public.project_workflow_events add column if not exists reason text;
alter table public.project_workflow_events add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.project_workflow_events add column if not exists idempotency_key text;
alter table public.project_workflow_events add column if not exists created_at timestamptz not null default now();

alter table public.project_lifecycle_transitions add column if not exists project_id uuid references public.projects(id) on delete restrict;
alter table public.project_lifecycle_transitions add column if not exists from_stage text;
alter table public.project_lifecycle_transitions add column if not exists to_stage text;
alter table public.project_lifecycle_transitions add column if not exists gate_snapshot jsonb not null default '{}'::jsonb;
alter table public.project_lifecycle_transitions add column if not exists actor_id uuid references public.profiles(id) on delete set null;
alter table public.project_lifecycle_transitions add column if not exists actor_role text;
alter table public.project_lifecycle_transitions add column if not exists reason text;
alter table public.project_lifecycle_transitions add column if not exists source text;
alter table public.project_lifecycle_transitions add column if not exists idempotency_key text;
alter table public.project_lifecycle_transitions add column if not exists created_at timestamptz not null default now();

-- The frozen lifecycle remains text plus a CHECK rather than a competing database enum.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'project_workflows_revision_check'
      and conrelid = 'public.project_workflows'::regclass
  ) then
    alter table public.project_workflows add constraint project_workflows_revision_check
      check (revision >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_workflows_lock_version_check'
      and conrelid = 'public.project_workflows'::regclass
  ) then
    alter table public.project_workflows add constraint project_workflows_lock_version_check
      check (lock_version >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_workflows_status_check'
      and conrelid = 'public.project_workflows'::regclass
  ) then
    alter table public.project_workflows add constraint project_workflows_status_check
      check (status in ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'correction_required', 'cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_workflows_subject_kind_check'
      and conrelid = 'public.project_workflows'::regclass
  ) then
    alter table public.project_workflows add constraint project_workflows_subject_kind_check
      check (subject_kind in ('document', 'task_evidence', 'lifecycle_checkpoint', 'owner_decision', 'technical_submission'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_workflows_subject_integrity_check'
      and conrelid = 'public.project_workflows'::regclass
  ) then
    alter table public.project_workflows add constraint project_workflows_subject_integrity_check
      check (
        (document_id is not null and task_id is null and subject_key is null and subject_kind = 'document')
        or (document_id is null and task_id is not null and subject_key is null and subject_kind = 'task_evidence')
        or (document_id is null and task_id is null and nullif(btrim(subject_key), '') is not null
            and subject_kind in ('lifecycle_checkpoint', 'owner_decision', 'technical_submission'))
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_workflows_lifecycle_stage_check'
      and conrelid = 'public.project_workflows'::regclass
  ) then
    alter table public.project_workflows add constraint project_workflows_lifecycle_stage_check
      check (lifecycle_stage in (
        'project_preparation', 'site_property_preparation', 'design_studies', 'technical_studies',
        'authorization_preparation', 'construction_authorization', 'execution_preparation', 'site_opening',
        'excavation_earthworks', 'foundations', 'structural_works', 'secondary_works',
        'technical_installations', 'finishing', 'end_of_works', 'occupancy_administrative',
        'project_completed'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_workflows_assigned_role_check'
      and conrelid = 'public.project_workflows'::regclass
  ) then
    alter table public.project_workflows add constraint project_workflows_assigned_role_check
      check (assigned_role is null or assigned_role in (
        'project_owner', 'contractor', 'architect', 'engineer', 'control_office',
        'laboratory', 'surveyor', 'other_project_member'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_workflows_reviewer_role_check'
      and conrelid = 'public.project_workflows'::regclass
  ) then
    alter table public.project_workflows add constraint project_workflows_reviewer_role_check
      check (reviewer_role is null or reviewer_role in (
        'project_owner', 'contractor', 'architect', 'engineer', 'control_office',
        'laboratory', 'surveyor', 'other_project_member'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_workflow_events_status_check'
      and conrelid = 'public.project_workflow_events'::regclass
  ) then
    alter table public.project_workflow_events add constraint project_workflow_events_status_check
      check (
        (from_status is null or from_status in ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'correction_required', 'cancelled'))
        and (to_status is null or to_status in ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'correction_required', 'cancelled'))
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_workflow_events_role_check'
      and conrelid = 'public.project_workflow_events'::regclass
  ) then
    alter table public.project_workflow_events add constraint project_workflow_events_role_check
      check (
        (from_role is null or from_role in ('project_owner', 'contractor', 'architect', 'engineer', 'control_office', 'laboratory', 'surveyor', 'other_project_member'))
        and (to_role is null or to_role in ('project_owner', 'contractor', 'architect', 'engineer', 'control_office', 'laboratory', 'surveyor', 'other_project_member'))
      );
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'project_workflow_events_actor_role_check'
      and conrelid = 'public.project_workflow_events'::regclass
  ) then
    alter table public.project_workflow_events add constraint project_workflow_events_actor_role_check
      check (actor_role is null or actor_role in (
        'project_owner', 'contractor', 'architect', 'engineer', 'control_office',
        'laboratory', 'surveyor', 'other_project_member'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_lifecycle_transitions_stage_change_check'
      and conrelid = 'public.project_lifecycle_transitions'::regclass
  ) then
    alter table public.project_lifecycle_transitions add constraint project_lifecycle_transitions_stage_change_check
      check (from_stage is null or from_stage <> to_stage);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_lifecycle_transitions_from_stage_check'
      and conrelid = 'public.project_lifecycle_transitions'::regclass
  ) then
    alter table public.project_lifecycle_transitions add constraint project_lifecycle_transitions_from_stage_check
      check (from_stage is null or from_stage in (
        'project_preparation', 'site_property_preparation', 'design_studies', 'technical_studies',
        'authorization_preparation', 'construction_authorization', 'execution_preparation', 'site_opening',
        'excavation_earthworks', 'foundations', 'structural_works', 'secondary_works',
        'technical_installations', 'finishing', 'end_of_works', 'occupancy_administrative',
        'project_completed'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_lifecycle_transitions_to_stage_check'
      and conrelid = 'public.project_lifecycle_transitions'::regclass
  ) then
    alter table public.project_lifecycle_transitions add constraint project_lifecycle_transitions_to_stage_check
      check (to_stage in (
        'project_preparation', 'site_property_preparation', 'design_studies', 'technical_studies',
        'authorization_preparation', 'construction_authorization', 'execution_preparation', 'site_opening',
        'excavation_earthworks', 'foundations', 'structural_works', 'secondary_works',
        'technical_installations', 'finishing', 'end_of_works', 'occupancy_administrative',
        'project_completed'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'project_lifecycle_transitions_actor_role_check'
      and conrelid = 'public.project_lifecycle_transitions'::regclass
  ) then
    alter table public.project_lifecycle_transitions add constraint project_lifecycle_transitions_actor_role_check
      check (actor_role is null or actor_role in (
        'project_owner', 'contractor', 'architect', 'engineer', 'control_office',
        'laboratory', 'surveyor', 'other_project_member'
      ));
  end if;
end $$;

-- Append-only revision history and one active review flow for each concrete subject.
create unique index if not exists project_workflows_group_revision_key
  on public.project_workflows(workflow_group_id, revision);

create unique index if not exists project_workflows_one_current_revision_key
  on public.project_workflows(workflow_group_id)
  where is_current;

create unique index if not exists project_workflows_active_document_subject_key
  on public.project_workflows(project_id, workflow_type, document_id)
  where is_current
    and status in ('draft', 'submitted', 'under_review', 'correction_required')
    and document_id is not null;

create unique index if not exists project_workflows_active_task_subject_key
  on public.project_workflows(project_id, workflow_type, task_id)
  where is_current
    and status in ('draft', 'submitted', 'under_review', 'correction_required')
    and task_id is not null;

create unique index if not exists project_workflows_active_semantic_subject_key
  on public.project_workflows(project_id, workflow_type, subject_key)
  where is_current
    and status in ('draft', 'submitted', 'under_review', 'correction_required')
    and subject_key is not null;

create unique index if not exists project_workflow_events_project_idempotency_key
  on public.project_workflow_events(project_id, idempotency_key)
  where idempotency_key is not null;

create unique index if not exists project_lifecycle_transitions_project_idempotency_key
  on public.project_lifecycle_transitions(project_id, idempotency_key)
  where idempotency_key is not null;

-- Minimal query indexes for future authorized commands and project-scoped timelines.
create index if not exists project_workflows_project_stage_status_idx
  on public.project_workflows(project_id, lifecycle_stage, status);
create index if not exists project_workflows_current_active_idx
  on public.project_workflows(project_id, updated_at desc)
  where is_current and status in ('draft', 'submitted', 'under_review', 'correction_required');
create index if not exists project_workflows_assigned_status_idx
  on public.project_workflows(assigned_user_id, status)
  where assigned_user_id is not null and is_current;
create index if not exists project_workflows_reviewer_status_idx
  on public.project_workflows(reviewer_user_id, status)
  where reviewer_user_id is not null and is_current;
create index if not exists project_workflow_events_project_created_idx
  on public.project_workflow_events(project_id, created_at desc);
create index if not exists project_workflow_events_workflow_created_idx
  on public.project_workflow_events(workflow_id, created_at desc);
create index if not exists project_workflow_events_actor_created_idx
  on public.project_workflow_events(actor_id, created_at desc)
  where actor_id is not null;
create index if not exists project_lifecycle_transitions_project_created_idx
  on public.project_lifecycle_transitions(project_id, created_at desc);

-- Revision and event relationships are validated server-side to prevent cross-project history links.
create or replace function public.validate_project_workflow_revision_chain()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  previous_workflow public.project_workflows%rowtype;
begin
  if new.previous_revision_id is null then
    if new.revision <> 1 then
      raise exception 'Initial workflow revisions must start at 1';
    end if;
    return new;
  end if;

  select * into previous_workflow
  from public.project_workflows
  where id = new.previous_revision_id;

  if not found
    or previous_workflow.project_id <> new.project_id
    or previous_workflow.workflow_group_id <> new.workflow_group_id
    or new.revision <> previous_workflow.revision + 1 then
    raise exception 'Workflow revisions must extend the prior revision in the same project and workflow group';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_project_workflow_revision_chain_trigger on public.project_workflows;
create trigger validate_project_workflow_revision_chain_trigger
before insert or update of project_id, workflow_group_id, revision, previous_revision_id on public.project_workflows
for each row execute function public.validate_project_workflow_revision_chain();

create or replace function public.validate_project_workflow_event_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.project_workflows w
    where w.id = new.workflow_id
      and w.project_id = new.project_id
  ) then
    raise exception 'Workflow event project must match its workflow project';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_project_workflow_event_scope_trigger on public.project_workflow_events;
create trigger validate_project_workflow_event_scope_trigger
before insert or update of project_id, workflow_id on public.project_workflow_events
for each row execute function public.validate_project_workflow_event_scope();

-- Workflow aggregates are mutable only through future authorized server commands.
create or replace function public.set_project_workflows_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  new.lock_version = old.lock_version + 1;
  return new;
end;
$$;

drop trigger if exists set_project_workflows_updated_at on public.project_workflows;
create trigger set_project_workflows_updated_at
before update on public.project_workflows
for each row execute function public.set_project_workflows_updated_at();

-- Governance history is immutable even if a future server integration has elevated database access.
create or replace function public.prevent_project_workflow_history_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Workflow governance history is append-only';
end;
$$;

drop trigger if exists prevent_project_workflow_events_mutation on public.project_workflow_events;
create trigger prevent_project_workflow_events_mutation
before update or delete on public.project_workflow_events
for each row execute function public.prevent_project_workflow_history_mutation();

drop trigger if exists prevent_project_lifecycle_transitions_mutation on public.project_lifecycle_transitions;
create trigger prevent_project_lifecycle_transitions_mutation
before update or delete on public.project_lifecycle_transitions
for each row execute function public.prevent_project_workflow_history_mutation();

alter table public.project_workflows enable row level security;
alter table public.project_workflow_events enable row level security;
alter table public.project_lifecycle_transitions enable row level security;

-- Read access exactly mirrors the existing protected projects policy. No role value supplied by the client is trusted.
drop policy if exists "Project workflows readable by authorized project members" on public.project_workflows;
create policy "Project workflows readable by authorized project members" on public.project_workflows
  for select to authenticated using (
    exists (
      select 1
      from public.projects p
      where p.id = project_workflows.project_id
        and (
          p.owner_id = auth.uid()
          or (
            p.organization_id is not null
            and public.is_organization_member(p.organization_id, auth.uid())
          )
        )
    )
  );

drop policy if exists "Project workflow events readable by authorized project members" on public.project_workflow_events;
create policy "Project workflow events readable by authorized project members" on public.project_workflow_events
  for select to authenticated using (
    exists (
      select 1
      from public.projects p
      where p.id = project_workflow_events.project_id
        and (
          p.owner_id = auth.uid()
          or (
            p.organization_id is not null
            and public.is_organization_member(p.organization_id, auth.uid())
          )
        )
    )
  );

drop policy if exists "Project lifecycle transitions readable by authorized project members" on public.project_lifecycle_transitions;
create policy "Project lifecycle transitions readable by authorized project members" on public.project_lifecycle_transitions
  for select to authenticated using (
    exists (
      select 1
      from public.projects p
      where p.id = project_lifecycle_transitions.project_id
        and (
          p.owner_id = auth.uid()
          or (
            p.organization_id is not null
            and public.is_organization_member(p.organization_id, auth.uid())
          )
        )
    )
  );

-- No browser client writes are part of Phase 1A. Future commands must use authorized server transactions.
revoke insert, update, delete on table public.project_workflows from anon, authenticated;
revoke insert, update, delete on table public.project_workflow_events from anon, authenticated;
revoke insert, update, delete on table public.project_lifecycle_transitions from anon, authenticated;
