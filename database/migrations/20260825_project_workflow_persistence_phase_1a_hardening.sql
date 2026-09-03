-- Phase 1A additive hardening. Apply only after the Phase 1A and profile-reference migrations.
-- Covers new FKs and evaluates auth.uid() once per RLS query without broadening authorization.

-- Each index supports a new foreign-key reference without duplicating existing compound indexes.
create index if not exists project_lifecycle_transitions_actor_id_idx
  on public.project_lifecycle_transitions(actor_id);
create index if not exists project_workflows_created_by_idx
  on public.project_workflows(created_by);
create index if not exists project_workflows_document_id_idx
  on public.project_workflows(document_id);
create index if not exists project_workflows_previous_revision_id_idx
  on public.project_workflows(previous_revision_id);
create index if not exists project_workflows_task_id_idx
  on public.project_workflows(task_id);

-- Preserve the Phase 1A owner-or-organization-member read model while avoiding per-row auth initplans.
drop policy if exists "Project workflows readable by authorized project members" on public.project_workflows;
create policy "Project workflows readable by authorized project members" on public.project_workflows
  for select to authenticated using (
    exists (
      select 1
      from public.projects p
      where p.id = project_workflows.project_id
        and (
          p.owner_id = (select auth.uid())
          or (
            p.organization_id is not null
            and public.is_organization_member(p.organization_id, (select auth.uid()))
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
          p.owner_id = (select auth.uid())
          or (
            p.organization_id is not null
            and public.is_organization_member(p.organization_id, (select auth.uid()))
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
          p.owner_id = (select auth.uid())
          or (
            p.organization_id is not null
            and public.is_organization_member(p.organization_id, (select auth.uid()))
          )
        )
    )
  );