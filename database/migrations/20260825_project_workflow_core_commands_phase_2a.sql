-- Phase 2A core workflow commands. Staging-only apply.
create or replace function public.workflow_actor_role(p_project uuid, p_user uuid)
returns text language plpgsql stable security definer set search_path = public, pg_temp as $$
declare r text;
begin
  if exists (select 1 from public.projects where id=p_project and owner_id=p_user) then return 'project_owner'; end if;
  select case lower(coalesce(pm.role,''))
    when 'owner' then 'project_owner' when 'manager' then 'project_owner' when 'engineer' then 'engineer'
    when 'architect' then 'architect' when 'contractor' then 'contractor' when 'reviewer' then 'control_office'
    when 'inspector' then 'control_office' when 'control_office' then 'control_office' when 'laboratory' then 'laboratory'
    when 'surveyor' then 'surveyor' else 'other_project_member' end
  into r from public.project_members pm join public.employees e on e.id=pm.employee_id
  where pm.project_id=p_project and pm.status='active' and e.status='active' and e.profile_id=p_user limit 1;
  return r;
end $$;

create or replace function public.workflow_command(
 p_command text,p_workflow uuid,p_lock integer,p_reason text,p_key text,p_project uuid default null,
 p_type text default null,p_subject_kind text default null,p_document uuid default null,p_task uuid default null,
 p_subject_key text default null,p_subject_version text default null,p_snapshot jsonb default null,p_assignee uuid default null,p_reviewer uuid default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare a uuid := (select auth.uid()); ar text; rr text; assr text; w public.project_workflows%rowtype; nw public.project_workflows%rowtype; e public.project_workflow_events%rowtype; submitter uuid;
begin
 if a is null then raise exception 'Authentication is required' using errcode='42501'; end if;
 if nullif(btrim(coalesce(p_key,'')),'') is null then raise exception 'An idempotency key is required' using errcode='22023'; end if;
 if p_command not in ('createWorkflow','submitWorkflow','startReview','requestCorrection','resubmitWorkflow','approveWorkflow','rejectWorkflow') then raise exception 'Unsupported workflow command' using errcode='22023'; end if;
 if p_command='createWorkflow' then
   if p_project is null or public.workflow_actor_role(p_project,a) is null then raise exception 'Project command access denied' using errcode='42501'; end if;
   select * into e from public.project_workflow_events where project_id=p_project and idempotency_key=p_key limit 1;
   if found then
     if e.payload->>'command'<>p_command then raise exception 'Idempotency key already used' using errcode='23505'; end if;
     select * into w from public.project_workflows where id=e.workflow_id; return jsonb_build_object('workflowId',w.id,'workflowGroupId',w.workflow_group_id,'revision',w.revision,'status',w.status,'lockVersion',w.lock_version,'idempotent',true);
   end if;
   if nullif(btrim(coalesce(p_type,'')),'') is null or p_assignee is null or p_reviewer is null then raise exception 'Workflow type, assignee, and reviewer are required' using errcode='22023'; end if;
   if p_subject_kind='document' and (p_document is null or p_task is not null or p_subject_key is not null or not exists(select 1 from public.documents d where d.id=p_document and d.project_id=p_project)) then raise exception 'Document subject must belong to the project' using errcode='23514'; end if;
   if p_subject_kind='task_evidence' and (p_task is null or p_document is not null or p_subject_key is not null or not exists(select 1 from public.tasks t where t.id=p_task and t.project_id=p_project)) then raise exception 'Task subject must belong to the project' using errcode='23514'; end if;
   if p_subject_kind in ('lifecycle_checkpoint','owner_decision','technical_submission') and (p_document is not null or p_task is not null or nullif(btrim(coalesce(p_subject_key,'')),'') is null) then raise exception 'Semantic subject key is required' using errcode='23514'; end if;
   if p_subject_kind not in ('document','task_evidence','lifecycle_checkpoint','owner_decision','technical_submission') then raise exception 'Unsupported workflow subject kind' using errcode='22023'; end if;
   ar:=public.workflow_actor_role(p_project,a); assr:=public.workflow_actor_role(p_project,p_assignee); rr:=public.workflow_actor_role(p_project,p_reviewer);
   if ar is null or assr is null or rr is null or a=p_reviewer then raise exception 'Creator, assignee, and reviewer must be distinct authorized project participants' using errcode='42501'; end if;
   insert into public.project_workflows(project_id,workflow_group_id,workflow_type,subject_kind,document_id,task_id,subject_key,subject_version,subject_snapshot,lifecycle_stage,status,assigned_role,assigned_user_id,reviewer_role,reviewer_user_id,created_by)
   values(p_project,gen_random_uuid(),btrim(p_type),p_subject_kind,p_document,p_task,nullif(btrim(coalesce(p_subject_key,'')),''),nullif(btrim(coalesce(p_subject_version,'')),''),coalesce(p_snapshot,'{}'),coalesce((select to_stage from public.project_lifecycle_transitions where project_id=p_project order by created_at desc,id desc limit 1),'project_preparation'),'draft',assr,p_assignee,rr,p_reviewer,a) returning * into w;
   insert into public.project_workflow_events(project_id,workflow_id,actor_id,actor_role,event_type,to_status,payload,idempotency_key) values(p_project,w.id,a,ar,'workflow_created','draft',jsonb_build_object('command',p_command,'revision',1),p_key);
   return jsonb_build_object('workflowId',w.id,'workflowGroupId',w.workflow_group_id,'revision',w.revision,'status',w.status,'lockVersion',w.lock_version,'idempotent',false);
 end if;
 select * into w from public.project_workflows where id=p_workflow for update;
 if not found or public.workflow_actor_role(w.project_id,a) is null then raise exception 'Project command access denied' using errcode='42501'; end if;
 select * into e from public.project_workflow_events where project_id=w.project_id and idempotency_key=p_key limit 1;
 if found then
   if e.payload->>'command'<>p_command then raise exception 'Idempotency key already used' using errcode='23505'; end if;
   select * into w from public.project_workflows where id=e.workflow_id; return jsonb_build_object('workflowId',w.id,'workflowGroupId',w.workflow_group_id,'revision',w.revision,'status',w.status,'lockVersion',w.lock_version,'idempotent',true);
 end if;
 if p_lock is null or p_lock<>w.lock_version then raise exception 'Workflow changed; refresh and retry' using errcode='40001'; end if;
 ar:=public.workflow_actor_role(w.project_id,a);
 if p_command='submitWorkflow' then
   if not w.is_current or w.status<>'draft' or (a<>w.created_by and a<>w.assigned_user_id) then raise exception 'Draft submission is not authorized' using errcode='42501'; end if;
   update public.project_workflows set status='submitted' where id=w.id returning * into w; insert into public.project_workflow_events(project_id,workflow_id,actor_id,actor_role,event_type,from_status,to_status,payload,idempotency_key) values(w.project_id,w.id,a,ar,'workflow_submitted','draft','submitted',jsonb_build_object('command',p_command,'revision',w.revision),p_key);
 elsif p_command='startReview' then
   if not w.is_current or w.status<>'submitted' or a<>w.reviewer_user_id then raise exception 'Review start is not authorized' using errcode='42501'; end if;
   update public.project_workflows set status='under_review' where id=w.id returning * into w; insert into public.project_workflow_events(project_id,workflow_id,actor_id,actor_role,event_type,from_status,to_status,payload,idempotency_key) values(w.project_id,w.id,a,ar,'workflow_review_started','submitted','under_review',jsonb_build_object('command',p_command,'revision',w.revision),p_key);
 elsif p_command='requestCorrection' then
   if not w.is_current or w.status<>'under_review' or a<>w.reviewer_user_id or nullif(btrim(coalesce(p_reason,'')),'') is null then raise exception 'Correction request is not authorized' using errcode='42501'; end if;
   update public.project_workflows set status='correction_required' where id=w.id returning * into w; insert into public.project_workflow_events(project_id,workflow_id,actor_id,actor_role,event_type,from_status,to_status,reason,payload,idempotency_key) values(w.project_id,w.id,a,ar,'workflow_correction_requested','under_review','correction_required',p_reason,jsonb_build_object('command',p_command,'revision',w.revision),p_key);
 elsif p_command='resubmitWorkflow' then
   if not w.is_current or w.status<>'correction_required' or (a<>w.created_by and a<>w.assigned_user_id) then raise exception 'Resubmission is not authorized' using errcode='42501'; end if;
   update public.project_workflows set is_current=false where id=w.id;
   insert into public.project_workflows(project_id,workflow_group_id,revision,previous_revision_id,workflow_type,subject_kind,document_id,task_id,subject_key,subject_version,subject_snapshot,lifecycle_stage,status,is_current,assigned_role,assigned_user_id,reviewer_role,reviewer_user_id,created_by)
   values(w.project_id,w.workflow_group_id,w.revision+1,w.id,w.workflow_type,w.subject_kind,w.document_id,w.task_id,w.subject_key,nullif(btrim(coalesce(p_subject_version,'')),''),coalesce(p_snapshot,w.subject_snapshot),coalesce((select to_stage from public.project_lifecycle_transitions where project_id=w.project_id order by created_at desc,id desc limit 1),'project_preparation'),'submitted',true,w.assigned_role,w.assigned_user_id,w.reviewer_role,w.reviewer_user_id,w.created_by) returning * into nw; w:=nw;
   insert into public.project_workflow_events(project_id,workflow_id,actor_id,actor_role,event_type,from_status,to_status,payload,idempotency_key) values(w.project_id,w.id,a,ar,'workflow_resubmitted','correction_required','submitted',jsonb_build_object('command',p_command,'revision',w.revision),p_key);
 elsif p_command in ('approveWorkflow','rejectWorkflow') then
   if not w.is_current or w.status<>'under_review' or a<>w.reviewer_user_id then raise exception 'Review decision is not authorized' using errcode='42501'; end if;
   select actor_id into submitter from public.project_workflow_events where workflow_id=w.id and event_type in ('workflow_submitted','workflow_resubmitted') order by created_at desc,id desc limit 1;
   if p_command='approveWorkflow' and (a=w.created_by or a=submitter) then raise exception 'Professional self-approval is not allowed' using errcode='42501'; end if;
   if p_command='rejectWorkflow' and nullif(btrim(coalesce(p_reason,'')),'') is null then raise exception 'A rejection reason is required' using errcode='22023'; end if;
   update public.project_workflows set status=case when p_command='approveWorkflow' then 'approved' else 'rejected' end where id=w.id returning * into w;
   insert into public.project_workflow_events(project_id,workflow_id,actor_id,actor_role,event_type,from_status,to_status,reason,payload,idempotency_key) values(w.project_id,w.id,a,ar,case when p_command='approveWorkflow' then 'workflow_approved' else 'workflow_rejected' end,'under_review',w.status,p_reason,jsonb_build_object('command',p_command,'revision',w.revision),p_key);
 else raise exception 'Unsupported workflow command' using errcode='22023'; end if;
 return jsonb_build_object('workflowId',w.id,'workflowGroupId',w.workflow_group_id,'revision',w.revision,'status',w.status,'lockVersion',w.lock_version,'idempotent',false);
end $$;

create or replace function public.create_project_workflow(p_project_id uuid,p_workflow_type text,p_subject_kind text,p_document_id uuid,p_task_id uuid,p_subject_key text,p_subject_version text,p_subject_snapshot jsonb,p_assigned_user_id uuid,p_reviewer_user_id uuid,p_idempotency_key text) returns jsonb language sql security definer set search_path=public,pg_temp as $$ select public.workflow_command('createWorkflow',null,null,null,p_idempotency_key,p_project_id,p_workflow_type,p_subject_kind,p_document_id,p_task_id,p_subject_key,p_subject_version,p_subject_snapshot,p_assigned_user_id,p_reviewer_user_id) $$;
create or replace function public.submit_project_workflow(p_workflow_id uuid,p_expected_lock_version integer,p_idempotency_key text) returns jsonb language sql security definer set search_path=public,pg_temp as $$ select public.workflow_command('submitWorkflow',p_workflow_id,p_expected_lock_version,null,p_idempotency_key) $$;
create or replace function public.start_project_workflow_review(p_workflow_id uuid,p_expected_lock_version integer,p_idempotency_key text) returns jsonb language sql security definer set search_path=public,pg_temp as $$ select public.workflow_command('startReview',p_workflow_id,p_expected_lock_version,null,p_idempotency_key) $$;
create or replace function public.request_project_workflow_correction(p_workflow_id uuid,p_expected_lock_version integer,p_reason text,p_idempotency_key text) returns jsonb language sql security definer set search_path=public,pg_temp as $$ select public.workflow_command('requestCorrection',p_workflow_id,p_expected_lock_version,p_reason,p_idempotency_key) $$;
create or replace function public.resubmit_project_workflow(p_workflow_id uuid,p_expected_lock_version integer,p_subject_version text,p_subject_snapshot jsonb,p_idempotency_key text) returns jsonb language sql security definer set search_path=public,pg_temp as $$ select public.workflow_command('resubmitWorkflow',p_workflow_id,p_expected_lock_version,null,p_idempotency_key,null,null,null,null,null,null,p_subject_version,p_subject_snapshot) $$;
create or replace function public.approve_project_workflow(p_workflow_id uuid,p_expected_lock_version integer,p_reason text,p_idempotency_key text) returns jsonb language sql security definer set search_path=public,pg_temp as $$ select public.workflow_command('approveWorkflow',p_workflow_id,p_expected_lock_version,p_reason,p_idempotency_key) $$;
create or replace function public.reject_project_workflow(p_workflow_id uuid,p_expected_lock_version integer,p_reason text,p_idempotency_key text) returns jsonb language sql security definer set search_path=public,pg_temp as $$ select public.workflow_command('rejectWorkflow',p_workflow_id,p_expected_lock_version,p_reason,p_idempotency_key) $$;

revoke all on function public.workflow_actor_role(uuid,uuid),public.workflow_command(text,uuid,integer,text,text,uuid,text,text,uuid,uuid,text,text,jsonb,uuid,uuid) from public,anon,authenticated;
revoke all on function public.create_project_workflow(uuid,text,text,uuid,uuid,text,text,jsonb,uuid,uuid,text),public.submit_project_workflow(uuid,integer,text),public.start_project_workflow_review(uuid,integer,text),public.request_project_workflow_correction(uuid,integer,text,text),public.resubmit_project_workflow(uuid,integer,text,jsonb,text),public.approve_project_workflow(uuid,integer,text,text),public.reject_project_workflow(uuid,integer,text,text) from public,anon;
grant execute on function public.create_project_workflow(uuid,text,text,uuid,uuid,text,text,jsonb,uuid,uuid,text),public.submit_project_workflow(uuid,integer,text),public.start_project_workflow_review(uuid,integer,text),public.request_project_workflow_correction(uuid,integer,text,text),public.resubmit_project_workflow(uuid,integer,text,jsonb,text),public.approve_project_workflow(uuid,integer,text,text),public.reject_project_workflow(uuid,integer,text,text) to authenticated;