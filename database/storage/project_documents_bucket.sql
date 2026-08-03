-- Vorqa AI project documents bucket setup
-- Run manually in Supabase SQL editor after applying organization/project migrations.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vorqa-project-documents',
  'vorqa-project-documents',
  false,
  104857600,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Project documents readable by project organization members" on storage.objects;
drop policy if exists "Project documents uploadable by project organization managers" on storage.objects;
drop policy if exists "Project documents updateable by project organization managers" on storage.objects;
drop policy if exists "Project documents deletable by project organization managers" on storage.objects;

create policy "Project documents readable by project organization members" on storage.objects
  for select using (
    bucket_id = 'vorqa-project-documents'
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from public.projects p
      where p.id::text = split_part(name, '/', 2)
        and public.is_organization_member(p.organization_id, auth.uid())
    )
  );

create policy "Project documents uploadable by project organization managers" on storage.objects
  for insert with check (
    bucket_id = 'vorqa-project-documents'
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from public.projects p
      where p.id::text = split_part(name, '/', 2)
        and (
          public.is_organization_owner(p.organization_id, auth.uid())
          or public.has_organization_permission(p.organization_id, auth.uid(), 'manage_organization')
        )
    )
  );

create policy "Project documents updateable by project organization managers" on storage.objects
  for update using (
    bucket_id = 'vorqa-project-documents'
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from public.projects p
      where p.id::text = split_part(name, '/', 2)
        and (
          public.is_organization_owner(p.organization_id, auth.uid())
          or public.has_organization_permission(p.organization_id, auth.uid(), 'manage_organization')
        )
    )
  ) with check (
    bucket_id = 'vorqa-project-documents'
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from public.projects p
      where p.id::text = split_part(name, '/', 2)
        and (
          public.is_organization_owner(p.organization_id, auth.uid())
          or public.has_organization_permission(p.organization_id, auth.uid(), 'manage_organization')
        )
    )
  );

create policy "Project documents deletable by project organization managers" on storage.objects
  for delete using (
    bucket_id = 'vorqa-project-documents'
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from public.projects p
      where p.id::text = split_part(name, '/', 2)
        and (
          public.is_organization_owner(p.organization_id, auth.uid())
          or public.has_organization_permission(p.organization_id, auth.uid(), 'manage_organization')
        )
    )
  );
