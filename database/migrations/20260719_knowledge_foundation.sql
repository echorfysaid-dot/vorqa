create extension if not exists pgcrypto;

create table if not exists public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid null references public.projects(id) on delete set null,
  document_id uuid null references public.documents(id) on delete set null,
  title text not null,
  summary text,
  content text,
  category text,
  tags text[] default '{}',
  status text not null default 'published',
  metadata jsonb not null default '{}',
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.knowledge_articles
  add column if not exists organization_id uuid,
  add column if not exists project_id uuid,
  add column if not exists document_id uuid,
  add column if not exists title text,
  add column if not exists summary text,
  add column if not exists content text,
  add column if not exists category text,
  add column if not exists tags text[] default '{}',
  add column if not exists status text not null default 'published',
  add column if not exists metadata jsonb not null default '{}',
  add column if not exists created_by uuid,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'knowledge_articles_status_check'
      and conrelid = 'public.knowledge_articles'::regclass
  ) then
    alter table public.knowledge_articles
      add constraint knowledge_articles_status_check
      check (status in ('draft', 'published', 'archived'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'knowledge_articles_organization_id_fkey'
      and conrelid = 'public.knowledge_articles'::regclass
  ) then
    alter table public.knowledge_articles
      add constraint knowledge_articles_organization_id_fkey
      foreign key (organization_id) references public.organizations(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'knowledge_articles_project_id_fkey'
      and conrelid = 'public.knowledge_articles'::regclass
  ) then
    alter table public.knowledge_articles
      add constraint knowledge_articles_project_id_fkey
      foreign key (project_id) references public.projects(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'knowledge_articles_document_id_fkey'
      and conrelid = 'public.knowledge_articles'::regclass
  ) then
    alter table public.knowledge_articles
      add constraint knowledge_articles_document_id_fkey
      foreign key (document_id) references public.documents(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'knowledge_articles_created_by_fkey'
      and conrelid = 'public.knowledge_articles'::regclass
  ) then
    alter table public.knowledge_articles
      add constraint knowledge_articles_created_by_fkey
      foreign key (created_by) references public.profiles(id) on delete set null;
  end if;
end $$;

create index if not exists idx_knowledge_articles_organization_id on public.knowledge_articles(organization_id);
create index if not exists idx_knowledge_articles_project_id on public.knowledge_articles(project_id);
create index if not exists idx_knowledge_articles_document_id on public.knowledge_articles(document_id);
create index if not exists idx_knowledge_articles_status on public.knowledge_articles(status);
create index if not exists idx_knowledge_articles_category on public.knowledge_articles(category);
create index if not exists idx_knowledge_articles_tags on public.knowledge_articles using gin(tags);
create index if not exists idx_knowledge_articles_updated_at on public.knowledge_articles(updated_at desc);

create or replace function public.set_knowledge_articles_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_knowledge_articles_updated_at on public.knowledge_articles;
create trigger set_knowledge_articles_updated_at
before update on public.knowledge_articles
for each row
execute function public.set_knowledge_articles_updated_at();

alter table public.knowledge_articles enable row level security;

drop policy if exists "knowledge articles are visible to organization members" on public.knowledge_articles;
create policy "knowledge articles are visible to organization members"
on public.knowledge_articles
for select
to authenticated
using (public.is_organization_member(organization_id, auth.uid()));

drop policy if exists "knowledge articles are manageable by organization owners and managers" on public.knowledge_articles;
create policy "knowledge articles are manageable by organization owners and managers"
on public.knowledge_articles
for all
to authenticated
using (
  public.is_organization_owner(organization_id, auth.uid())
  or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
)
with check (
  public.is_organization_owner(organization_id, auth.uid())
  or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
);
