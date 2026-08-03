-- Sprint 18.5 - Enterprise Notifications Center
-- Generated only. Do not apply automatically from Codex.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'System',
  module text not null default 'System',
  priority text not null default 'Normal',
  status text not null default 'Unread',
  context text,
  href text,
  related_entity_id text,
  related_entity_type text,
  scheduled_for timestamptz,
  expires_at timestamptz,
  source text not null default 'system',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_priority_check check (priority in ('Low', 'Normal', 'Medium', 'High', 'Critical')),
  constraint notifications_status_check check (status in ('Unread', 'Read', 'Archived', 'Deleted')),
  constraint notifications_type_check check (type in (
    'Project',
    'Task',
    'Milestone',
    'Budget',
    'Document',
    'Knowledge',
    'Marketplace',
    'Connection',
    'Message',
    'RFQ',
    'Quotation',
    'Award',
    'Contract',
    'Approval',
    'Payment',
    'VORA AI',
    'System'
  ))
);

create table if not exists public.notification_recipients (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  status text not null default 'Unread',
  delivery_channels text[] not null default array['in_app']::text[],
  read_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_recipients_status_check check (status in ('Unread', 'Read', 'Archived', 'Deleted')),
  constraint notification_recipients_target_check check (profile_id is not null or organization_id is not null)
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  push_enabled boolean not null default false,
  sms_enabled boolean not null default false,
  muted_modules text[] not null default array[]::text[],
  minimum_priority text not null default 'Low',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_priority_check check (minimum_priority in ('Low', 'Normal', 'Medium', 'High', 'Critical')),
  constraint notification_preferences_target_check check (profile_id is not null or organization_id is not null)
);

create unique index if not exists notification_recipients_unique_profile
  on public.notification_recipients(notification_id, profile_id)
  where profile_id is not null;

create unique index if not exists notification_preferences_unique_profile_org
  on public.notification_preferences(profile_id, coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where profile_id is not null;

create index if not exists notifications_owner_id_idx on public.notifications(owner_id);
create index if not exists notifications_organization_id_idx on public.notifications(organization_id);
create index if not exists notifications_project_id_idx on public.notifications(project_id);
create index if not exists notifications_recipient_id_idx on public.notifications(recipient_id);
create index if not exists notifications_status_idx on public.notifications(status);
create index if not exists notifications_priority_idx on public.notifications(priority);
create index if not exists notifications_type_idx on public.notifications(type);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);
create index if not exists notification_recipients_profile_id_idx on public.notification_recipients(profile_id);
create index if not exists notification_recipients_organization_id_idx on public.notification_recipients(organization_id);
create index if not exists notification_preferences_profile_id_idx on public.notification_preferences(profile_id);

drop trigger if exists set_notifications_updated_at on public.notifications;
create trigger set_notifications_updated_at
  before update on public.notifications
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_notification_recipients_updated_at on public.notification_recipients;
create trigger set_notification_recipients_updated_at
  before update on public.notification_recipients
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.set_updated_at();

alter table public.notifications enable row level security;
alter table public.notification_recipients enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "notifications_read_own_or_org" on public.notifications;
create policy "notifications_read_own_or_org"
  on public.notifications
  for select
  to authenticated
  using (
    owner_id = auth.uid()
    or recipient_id = auth.uid()
    or exists (
      select 1 from public.notification_recipients nr
      where nr.notification_id = notifications.id
        and nr.profile_id = auth.uid()
        and nr.status <> 'Deleted'
    )
    or (
      organization_id is not null
      and public.is_organization_member(organization_id, auth.uid())
    )
  );

drop policy if exists "notifications_insert_owner_or_org_manager" on public.notifications;
create policy "notifications_insert_owner_or_org_manager"
  on public.notifications
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    or recipient_id = auth.uid()
    or (
      organization_id is not null
      and (
        public.is_organization_owner(organization_id, auth.uid())
        or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
      )
    )
  );

drop policy if exists "notifications_update_owner_or_org_manager" on public.notifications;
create policy "notifications_update_owner_or_org_manager"
  on public.notifications
  for update
  to authenticated
  using (
    owner_id = auth.uid()
    or recipient_id = auth.uid()
    or (
      organization_id is not null
      and (
        public.is_organization_owner(organization_id, auth.uid())
        or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
      )
    )
  )
  with check (
    owner_id = auth.uid()
    or recipient_id = auth.uid()
    or (
      organization_id is not null
      and (
        public.is_organization_owner(organization_id, auth.uid())
        or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
      )
    )
  );

drop policy if exists "notification_recipients_read_own_or_org" on public.notification_recipients;
create policy "notification_recipients_read_own_or_org"
  on public.notification_recipients
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    or (
      organization_id is not null
      and public.is_organization_member(organization_id, auth.uid())
    )
  );

drop policy if exists "notification_recipients_manage_own_or_org_manager" on public.notification_recipients;
create policy "notification_recipients_manage_own_or_org_manager"
  on public.notification_recipients
  for all
  to authenticated
  using (
    profile_id = auth.uid()
    or (
      organization_id is not null
      and (
        public.is_organization_owner(organization_id, auth.uid())
        or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
      )
    )
  )
  with check (
    profile_id = auth.uid()
    or (
      organization_id is not null
      and (
        public.is_organization_owner(organization_id, auth.uid())
        or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
      )
    )
  );

drop policy if exists "notification_preferences_read_own" on public.notification_preferences;
create policy "notification_preferences_read_own"
  on public.notification_preferences
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    or (
      organization_id is not null
      and public.is_organization_member(organization_id, auth.uid())
    )
  );

drop policy if exists "notification_preferences_manage_own" on public.notification_preferences;
create policy "notification_preferences_manage_own"
  on public.notification_preferences
  for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
