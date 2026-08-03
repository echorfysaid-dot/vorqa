-- Vorqa AI knowledge bucket setup
-- Run manually in Supabase SQL editor after reviewing existing Storage policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'knowledge',
  'knowledge',
  false,
  52428800,
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

drop policy if exists "Knowledge files readable by owners" on storage.objects;
drop policy if exists "Knowledge files uploadable by owners" on storage.objects;
drop policy if exists "Knowledge files updateable by owners" on storage.objects;
drop policy if exists "Knowledge files deletable by owners" on storage.objects;

create policy "Knowledge files readable by owners" on storage.objects
  for select using (
    bucket_id = 'knowledge'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Knowledge files uploadable by owners" on storage.objects
  for insert with check (
    bucket_id = 'knowledge'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Knowledge files updateable by owners" on storage.objects
  for update using (
    bucket_id = 'knowledge'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  ) with check (
    bucket_id = 'knowledge'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Knowledge files deletable by owners" on storage.objects
  for delete using (
    bucket_id = 'knowledge'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );
