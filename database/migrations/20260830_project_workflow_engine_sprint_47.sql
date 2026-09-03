-- Sprint 47: permission-backed review, explicit handoffs, and lifecycle moves.
-- Apply after 20260825_project_workflow_core_commands_phase_2a.sql.

create or replace function public.workflow_has_organization_permission(
  p_project uuid, p_user uuid, p_permission text
) returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project and p.organization_id is not null
      and (
        exists (
          select 1 from public.organizations o
          where o.id = p.organization_id and o.owner_id = p_user
            and o.status <> 'archived'
        )
        or exists (
          select 1
          from public.organization_members m
          join public.organization_roles r on r.id = m.role_id
          where m.organization_id = p.organization_id
            and m.user_id = p_user and m.status = 'active'
            and coalesce((r.permissions ->> p_permission)::boolean, false)
        )
      )
  );
$$;

create or replace function public.workflow_is_professional_reviewer(
  p_project uuid, p_user uuid, p_require_approval boolean default false
) returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.workflow_actor_role(p_project, p_user) in (
    'architect', 'engineer', 'control_office', 'laboratory', 'surveyor'
  ), false)
  and public.workflow_has_organization_permission(
    p_project, p_user, 'review_project_workflows'
  )
  and (
    not p_require_approval
    or public.workflow_has_organization_permission(
      p_project, p_user, 'approve_project_workflows'
    )
  );
$$;

-- Harden every existing Phase 2A command while preserving its public signature.
create or replace function public.enforce_project_workflow_authorization()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := (select auth.uid());
  actor_role text;
  latest_submitter uuid;
begin
  if actor is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if public.workflow_actor_role(new.project_id, new.assigned_user_id) is null
    or not public.workflow_is_professional_reviewer(
      new.project_id, new.reviewer_user_id, false
    )
    or new.reviewer_user_id = new.created_by
    or new.reviewer_user_id = new.assigned_user_id then
    raise exception 'Reviewer must be a distinct authorized professional participant'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status
    and new.status in ('under_review', 'correction_required', 'approved', 'rejected') then
    actor_role := public.workflow_actor_role(new.project_id, actor);
    if actor <> new.reviewer_user_id
      or actor_role <> new.reviewer_role
      or not public.workflow_is_professional_reviewer(
        new.project_id, actor, new.status in ('approved', 'rejected')
      ) then
      raise exception 'Professional review is not authorized' using errcode = '42501';
    end if;

    if new.status in ('approved', 'rejected') then
      select e.actor_id into latest_submitter
      from public.project_workflow_events e
      where e.workflow_id = new.id
        and e.event_type in ('workflow_submitted', 'workflow_resubmitted')
      order by e.created_at desc, e.id desc limit 1;
      if actor = new.created_by or actor = latest_submitter then
        raise exception 'Professional self-approval is not allowed'
          using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_project_workflow_authorization_trigger
  on public.project_workflows;
create trigger enforce_project_workflow_authorization_trigger
before insert or update on public.project_workflows
for each row execute function public.enforce_project_workflow_authorization();

create or replace function public.handoff_project_workflow(
  p_workflow_id uuid,
  p_expected_lock_version integer,
  p_target_kind text,
  p_target_user_id uuid,
  p_reason text,
  p_idempotency_key text
) returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := (select auth.uid());
  actor_role text;
  target_role text;
  previous_role text;
  previous_user uuid;
  submitter uuid;
  w public.project_workflows%rowtype;
  prior_event public.project_workflow_events%rowtype;
begin
  if actor is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if p_target_kind not in ('assignee', 'reviewer')
    or p_target_user_id is null
    or nullif(btrim(coalesce(p_idempotency_key, '')), '') is null then
    raise exception 'Target kind, target user, and idempotency key are required'
      using errcode = '22023';
  end if;

  select * into w from public.project_workflows
  where id = p_workflow_id for update;
  if not found or not w.is_current then
    raise exception 'Current workflow not found' using errcode = 'P0002';
  end if;

  actor_role := public.workflow_actor_role(w.project_id, actor);
  target_role := public.workflow_actor_role(w.project_id, p_target_user_id);
  if actor_role is null or target_role is null then
    raise exception 'Workflow handoff requires active project participants'
      using errcode = '42501';
  end if;

  select * into prior_event from public.project_workflow_events
  where project_id = w.project_id and idempotency_key = p_idempotency_key
  limit 1;
  if found then
    if prior_event.payload ->> 'command' <> 'handoffWorkflow' then
      raise exception 'Idempotency key already used' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'workflowId', w.id, 'status', w.status,
      'lockVersion', w.lock_version, 'idempotent', true
    );
  end if;
  if p_expected_lock_version is null or p_expected_lock_version <> w.lock_version then
    raise exception 'Workflow changed; refresh and retry' using errcode = '40001';
  end if;

  if p_target_kind = 'assignee' then
    previous_user := w.assigned_user_id;
    previous_role := w.assigned_role;
    if actor_role <> 'project_owner' and actor <> previous_user then
      raise exception 'Assignee handoff is not authorized' using errcode = '42501';
    end if;
    if p_target_user_id = w.reviewer_user_id then
      raise exception 'Assignee and reviewer must remain distinct' using errcode = '42501';
    end if;
    update public.project_workflows
    set assigned_user_id = p_target_user_id, assigned_role = target_role
    where id = w.id returning * into w;
  else
    previous_user := w.reviewer_user_id;
    previous_role := w.reviewer_role;
    if actor_role <> 'project_owner' and (
      actor <> previous_user
      or not public.workflow_is_professional_reviewer(w.project_id, actor, false)
    ) then
      raise exception 'Reviewer handoff is not authorized' using errcode = '42501';
    end if;
    select e.actor_id into submitter from public.project_workflow_events e
    where e.workflow_id = w.id
      and e.event_type in ('workflow_submitted', 'workflow_resubmitted')
    order by e.created_at desc, e.id desc limit 1;
    if p_target_user_id = w.created_by
      or p_target_user_id = w.assigned_user_id
      or p_target_user_id = submitter
      or not public.workflow_is_professional_reviewer(
        w.project_id, p_target_user_id, false
      ) then
      raise exception 'Reviewer target is not an independent authorized professional'
        using errcode = '42501';
    end if;
    update public.project_workflows
    set reviewer_user_id = p_target_user_id, reviewer_role = target_role
    where id = w.id returning * into w;
  end if;

  insert into public.project_workflow_events (
    project_id, workflow_id, actor_id, actor_role, event_type,
    from_status, to_status, from_role, to_role, reason, payload, idempotency_key
  ) values (
    w.project_id, w.id, actor, actor_role, 'workflow_handed_off',
    w.status, w.status, previous_role, target_role,
    nullif(btrim(coalesce(p_reason, '')), ''),
    jsonb_build_object(
      'command', 'handoffWorkflow', 'targetKind', p_target_kind,
      'fromUserId', previous_user, 'toUserId', p_target_user_id
    ), p_idempotency_key
  );
  return jsonb_build_object(
    'workflowId', w.id, 'status', w.status, 'lockVersion', w.lock_version,
    'targetKind', p_target_kind, 'targetUserId', p_target_user_id,
    'idempotent', false
  );
end;
$$;

create or replace function public.advance_project_lifecycle_stage(
  p_project_id uuid,
  p_expected_from_stage text,
  p_to_stage text,
  p_reason text,
  p_idempotency_key text
) returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := (select auth.uid());
  project_row public.projects%rowtype;
  prior_transition public.project_lifecycle_transitions%rowtype;
  current_stage text;
  expected_next text;
  gate_snapshot jsonb;
  blocking_count integer;
  checkpoint_count integer;
  stage_order constant text[] := array[
    'project_preparation', 'site_property_preparation', 'design_studies',
    'technical_studies', 'authorization_preparation', 'construction_authorization',
    'execution_preparation', 'site_opening', 'excavation_earthworks', 'foundations',
    'structural_works', 'secondary_works', 'technical_installations', 'finishing',
    'end_of_works', 'occupancy_administrative', 'project_completed'
  ];
  current_position integer;
begin
  if actor is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if nullif(btrim(coalesce(p_idempotency_key, '')), '') is null then
    raise exception 'An idempotency key is required' using errcode = '22023';
  end if;

  select * into project_row from public.projects
  where id = p_project_id for update;
  if not found or project_row.owner_id <> actor then
    raise exception 'Only the project owner can advance lifecycle stages'
      using errcode = '42501';
  end if;

  select * into prior_transition from public.project_lifecycle_transitions
  where project_id = p_project_id and idempotency_key = p_idempotency_key
  limit 1;
  if found then
    return jsonb_build_object(
      'projectId', p_project_id, 'fromStage', prior_transition.from_stage,
      'toStage', prior_transition.to_stage, 'idempotent', true
    );
  end if;

  select to_stage into current_stage from public.project_lifecycle_transitions
  where project_id = p_project_id order by created_at desc, id desc limit 1;
  current_stage := coalesce(current_stage, 'project_preparation');
  if p_expected_from_stage is null or p_expected_from_stage <> current_stage then
    raise exception 'Lifecycle stage changed; refresh and retry' using errcode = '40001';
  end if;
  current_position := array_position(stage_order, current_stage);
  if current_position is null or current_position >= array_length(stage_order, 1) then
    raise exception 'Current lifecycle stage cannot advance' using errcode = '23514';
  end if;
  expected_next := stage_order[current_position + 1];
  if p_to_stage is null or p_to_stage <> expected_next then
    raise exception 'Lifecycle stages must advance exactly one canonical step'
      using errcode = '23514';
  end if;

  select count(*) into blocking_count from public.project_workflows w
  where w.project_id = p_project_id and w.lifecycle_stage = current_stage
    and w.is_current and w.status <> 'approved';
  select count(*) into checkpoint_count from public.project_workflows w
  where w.project_id = p_project_id and w.lifecycle_stage = current_stage
    and w.subject_kind = 'lifecycle_checkpoint'
    and w.is_current and w.status = 'approved';

  select jsonb_build_object(
    'currentStage', current_stage, 'nextStage', expected_next,
    'blockingWorkflowCount', blocking_count,
    'approvedCheckpointCount', checkpoint_count,
    'evaluatedAt', now(),
    'blockingWorkflowIds', coalesce((
      select jsonb_agg(w.id order by w.created_at, w.id)
      from public.project_workflows w
      where w.project_id = p_project_id and w.lifecycle_stage = current_stage
        and w.is_current and w.status <> 'approved'
    ), '[]'::jsonb)
  ) into gate_snapshot;
  if blocking_count > 0 or checkpoint_count = 0 then
    raise exception 'Lifecycle stage gate is not ready' using errcode = '23514';
  end if;

  insert into public.project_lifecycle_transitions (
    project_id, from_stage, to_stage, gate_snapshot, actor_id,
    actor_role, reason, source, idempotency_key
  ) values (
    p_project_id, current_stage, expected_next, gate_snapshot, actor,
    'project_owner', nullif(btrim(coalesce(p_reason, '')), ''),
    'owner_command', p_idempotency_key
  );
  return jsonb_build_object(
    'projectId', p_project_id, 'fromStage', current_stage,
    'toStage', expected_next, 'gateSnapshot', gate_snapshot,
    'idempotent', false
  );
end;
$$;

revoke all on function public.workflow_has_organization_permission(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.workflow_is_professional_reviewer(uuid, uuid, boolean)
  from public, anon, authenticated;
revoke all on function public.enforce_project_workflow_authorization()
  from public, anon, authenticated;
revoke all on function public.handoff_project_workflow(uuid, integer, text, uuid, text, text)
  from public, anon;
revoke all on function public.advance_project_lifecycle_stage(uuid, text, text, text, text)
  from public, anon;
grant execute on function public.handoff_project_workflow(uuid, integer, text, uuid, text, text)
  to authenticated;
grant execute on function public.advance_project_lifecycle_stage(uuid, text, text, text, text)
  to authenticated;

-- Browser clients cannot bypass the command functions.
revoke insert, update, delete on table public.project_workflows from anon, authenticated;
revoke insert, update, delete on table public.project_workflow_events from anon, authenticated;
revoke insert, update, delete on table public.project_lifecycle_transitions from anon, authenticated;
