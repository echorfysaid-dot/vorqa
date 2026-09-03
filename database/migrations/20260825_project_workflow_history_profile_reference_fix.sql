-- Preserve Phase 1A append-only governance history when a referenced profile is deleted.
-- Apply after 20260825_project_workflow_persistence_phase_1a.sql and before hardening.

create or replace function public.prevent_project_workflow_history_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Allow only the internal ON DELETE SET NULL update caused by a profile deletion.
  if tg_op = 'UPDATE'
    and old.actor_id is not null
    and new.actor_id is null
    and (to_jsonb(new) - 'actor_id') = (to_jsonb(old) - 'actor_id') then
    return new;
  end if;

  raise exception 'Workflow governance history is append-only';
end;
$$;
