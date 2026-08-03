-- Vorqa AI Documents and Storage foundation
-- Additive and idempotent. Supports Supabase Storage bucket: vorqa-project-documents.
-- This migration does not create the storage bucket automatically.

alter table public.documents add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.documents add column if not exists department_id uuid references public.departments(id) on delete set null;
alter table public.documents add column if not exists uploader_id uuid references public.profiles(id) on delete set null;
alter table public.documents add column if not exists category text;
alter table public.documents add column if not exists version text default 'v1';
alter table public.documents add column if not exists filename text;
alter table public.documents add column if not exists storage_path text;
alter table public.documents add column if not exists file_size bigint;
alter table public.documents add column if not exists mime_type text;
alter table public.documents add column if not exists tags text[] not null default '{}';
alter table public.documents add column if not exists archived boolean not null default false;
alter table public.documents add column if not exists metadata jsonb not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'documents_file_size_check'
      and conrelid = 'public.documents'::regclass
  ) then
    alter table public.documents add constraint documents_file_size_check
      check (file_size is null or file_size >= 0);
  end if;
end $$;

drop policy if exists "Documents visible to organization members" on public.documents;
drop policy if exists "Documents manageable by organization managers" on public.documents;

create policy "Documents visible to organization members" on public.documents
  for select using (
    auth.uid() = owner_id
    or (
      organization_id is not null
      and public.is_organization_member(organization_id, auth.uid())
    )
  );

create policy "Documents manageable by organization managers" on public.documents
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

create index if not exists documents_project_id_created_at_idx on public.documents(project_id, created_at desc);
create index if not exists documents_organization_id_created_at_idx on public.documents(organization_id, created_at desc);
create index if not exists documents_department_id_idx on public.documents(department_id);
create index if not exists documents_category_idx on public.documents(category);
create index if not exists documents_archived_idx on public.documents(archived);
create index if not exists documents_tags_idx on public.documents using gin(tags);
