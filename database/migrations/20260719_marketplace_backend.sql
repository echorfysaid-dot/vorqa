-- Vorqa AI Marketplace backend foundation
-- Additive and idempotent. Do not apply automatically from Codex.

create extension if not exists "pgcrypto";

create table if not exists public.marketplace_companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  primary_contact_profile_id uuid references public.profiles(id) on delete set null,
  slug text not null,
  name text not null,
  logo text,
  logo_url text,
  cover_image text,
  description text,
  about text,
  category text not null default 'Other',
  business_categories text[] not null default '{}',
  specialties text[] not null default '{}',
  country text,
  city text,
  address jsonb not null default '{}',
  website text,
  phone text,
  email text,
  years_of_experience integer not null default 0,
  employees integer not null default 0,
  active_projects integer not null default 0,
  completed_projects integer not null default 0,
  partners integer not null default 0,
  certifications text[] not null default '{}',
  languages text[] not null default '{}',
  services text[] not null default '{}',
  service_areas text[] not null default '{}',
  response_time text,
  response_rate text,
  verification_status text not null default 'pending',
  verified boolean not null default false,
  availability text not null default 'By request',
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  status text not null default 'draft',
  legal_status text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_company_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.marketplace_companies(id) on delete cascade,
  category text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_company_services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.marketplace_companies(id) on delete cascade,
  title text not null,
  description text,
  category text,
  delivery text,
  availability text not null default 'By request',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_company_locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.marketplace_companies(id) on delete cascade,
  country text not null,
  city text not null,
  address text,
  service_areas text[] not null default '{}',
  latitude numeric,
  longitude numeric,
  is_primary boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_portfolios (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.marketplace_companies(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  location text,
  project_type text,
  status text not null default 'published',
  budget text,
  completed_at date,
  gallery jsonb not null default '[]',
  documents jsonb not null default '[]',
  before_after jsonb not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.marketplace_companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  reviewer_name text,
  reviewer_company text,
  rating integer not null,
  review text not null,
  verified boolean not null default false,
  status text not null default 'published',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_connections (
  id uuid primary key default gen_random_uuid(),
  requester_organization_id uuid references public.organizations(id) on delete cascade,
  target_company_id uuid not null references public.marketplace_companies(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  status text not null default 'pending',
  intent text,
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_messages (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.marketplace_connections(id) on delete cascade,
  sender_profile_id uuid references public.profiles(id) on delete set null,
  sender_organization_id uuid references public.organizations(id) on delete set null,
  recipient_organization_id uuid references public.organizations(id) on delete set null,
  body text not null,
  read_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_favorites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  company_id uuid not null references public.marketplace_companies(id) on delete cascade,
  notes text,
  priority text not null default 'medium',
  intended_project_id uuid references public.projects(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_certifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.marketplace_companies(id) on delete cascade,
  title text not null,
  issuer text,
  issued_at date,
  expires_at date,
  document_id uuid references public.documents(id) on delete set null,
  document_url text,
  status text not null default 'Pending',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_companies_slug_key'
      and conrelid = 'public.marketplace_companies'::regclass
  ) then
    alter table public.marketplace_companies add constraint marketplace_companies_slug_key unique (slug);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_reviews_rating_check'
      and conrelid = 'public.marketplace_reviews'::regclass
  ) then
    alter table public.marketplace_reviews add constraint marketplace_reviews_rating_check check (rating between 1 and 5);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'marketplace_favorites_profile_company_key'
      and conrelid = 'public.marketplace_favorites'::regclass
  ) then
    alter table public.marketplace_favorites add constraint marketplace_favorites_profile_company_key unique (profile_id, company_id);
  end if;
end $$;

create or replace function public.can_manage_marketplace_company(target_company_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.marketplace_companies c
    where c.id = target_company_id
      and (
        c.owner_id = target_user_id
        or (
          c.organization_id is not null
          and (
            public.is_organization_owner(c.organization_id, target_user_id)
            or public.has_organization_permission(c.organization_id, target_user_id, 'manage_organization')
            or public.has_organization_permission(c.organization_id, target_user_id, 'manage_marketplace')
          )
        )
      )
  );
$$;

create or replace function public.can_read_marketplace_connection(target_connection_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.marketplace_connections cn
    left join public.marketplace_companies c on c.id = cn.target_company_id
    where cn.id = target_connection_id
      and (
        cn.requested_by = target_user_id
        or (
          cn.requester_organization_id is not null
          and public.is_organization_member(cn.requester_organization_id, target_user_id)
        )
        or (
          c.organization_id is not null
          and public.is_organization_member(c.organization_id, target_user_id)
        )
      )
  );
$$;

alter table public.marketplace_companies enable row level security;
alter table public.marketplace_company_categories enable row level security;
alter table public.marketplace_company_services enable row level security;
alter table public.marketplace_company_locations enable row level security;
alter table public.marketplace_portfolios enable row level security;
alter table public.marketplace_reviews enable row level security;
alter table public.marketplace_connections enable row level security;
alter table public.marketplace_messages enable row level security;
alter table public.marketplace_favorites enable row level security;
alter table public.marketplace_certifications enable row level security;

drop policy if exists "Marketplace companies public verified read" on public.marketplace_companies;
drop policy if exists "Marketplace companies members read own profiles" on public.marketplace_companies;
drop policy if exists "Marketplace companies insertable by organization managers" on public.marketplace_companies;
drop policy if exists "Marketplace companies manageable by owners" on public.marketplace_companies;

create policy "Marketplace companies public verified read" on public.marketplace_companies
  for select using (verified = true and status = 'published');

create policy "Marketplace companies members read own profiles" on public.marketplace_companies
  for select using (
    owner_id = auth.uid()
    or (
      organization_id is not null
      and public.is_organization_member(organization_id, auth.uid())
    )
  );

create policy "Marketplace companies insertable by organization managers" on public.marketplace_companies
  for insert with check (
    owner_id = auth.uid()
    or (
      organization_id is not null
      and (
        public.is_organization_owner(organization_id, auth.uid())
        or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')
        or public.has_organization_permission(organization_id, auth.uid(), 'manage_marketplace')
      )
    )
  );

create policy "Marketplace companies manageable by owners" on public.marketplace_companies
  for update using (public.can_manage_marketplace_company(id, auth.uid()))
  with check (public.can_manage_marketplace_company(id, auth.uid()));

drop policy if exists "Marketplace child public verified read" on public.marketplace_company_categories;
drop policy if exists "Marketplace services public verified read" on public.marketplace_company_services;
drop policy if exists "Marketplace locations public verified read" on public.marketplace_company_locations;
drop policy if exists "Marketplace portfolios public verified read" on public.marketplace_portfolios;
drop policy if exists "Marketplace reviews public read" on public.marketplace_reviews;
drop policy if exists "Marketplace certifications public verified read" on public.marketplace_certifications;

create policy "Marketplace child public verified read" on public.marketplace_company_categories
  for select using (exists (select 1 from public.marketplace_companies c where c.id = company_id and c.verified = true and c.status = 'published'));

create policy "Marketplace services public verified read" on public.marketplace_company_services
  for select using (exists (select 1 from public.marketplace_companies c where c.id = company_id and c.verified = true and c.status = 'published'));

create policy "Marketplace locations public verified read" on public.marketplace_company_locations
  for select using (exists (select 1 from public.marketplace_companies c where c.id = company_id and c.verified = true and c.status = 'published'));

create policy "Marketplace portfolios public verified read" on public.marketplace_portfolios
  for select using (exists (select 1 from public.marketplace_companies c where c.id = company_id and c.verified = true and c.status = 'published'));

create policy "Marketplace reviews public read" on public.marketplace_reviews
  for select using (
    status = 'published'
    and exists (select 1 from public.marketplace_companies c where c.id = company_id and c.verified = true and c.status = 'published')
  );

create policy "Marketplace certifications public verified read" on public.marketplace_certifications
  for select using (exists (select 1 from public.marketplace_companies c where c.id = company_id and c.verified = true and c.status = 'published'));

drop policy if exists "Marketplace child manageable by company owners" on public.marketplace_company_categories;
drop policy if exists "Marketplace services manageable by company owners" on public.marketplace_company_services;
drop policy if exists "Marketplace locations manageable by company owners" on public.marketplace_company_locations;
drop policy if exists "Marketplace portfolios manageable by company owners" on public.marketplace_portfolios;
drop policy if exists "Marketplace certifications manageable by company owners" on public.marketplace_certifications;

create policy "Marketplace child manageable by company owners" on public.marketplace_company_categories
  for all using (public.can_manage_marketplace_company(company_id, auth.uid()))
  with check (public.can_manage_marketplace_company(company_id, auth.uid()));

create policy "Marketplace services manageable by company owners" on public.marketplace_company_services
  for all using (public.can_manage_marketplace_company(company_id, auth.uid()))
  with check (public.can_manage_marketplace_company(company_id, auth.uid()));

create policy "Marketplace locations manageable by company owners" on public.marketplace_company_locations
  for all using (public.can_manage_marketplace_company(company_id, auth.uid()))
  with check (public.can_manage_marketplace_company(company_id, auth.uid()));

create policy "Marketplace portfolios manageable by company owners" on public.marketplace_portfolios
  for all using (public.can_manage_marketplace_company(company_id, auth.uid()))
  with check (public.can_manage_marketplace_company(company_id, auth.uid()));

create policy "Marketplace certifications manageable by company owners" on public.marketplace_certifications
  for all using (public.can_manage_marketplace_company(company_id, auth.uid()))
  with check (public.can_manage_marketplace_company(company_id, auth.uid()));

drop policy if exists "Marketplace reviews insertable by authenticated users" on public.marketplace_reviews;
drop policy if exists "Marketplace reviews manageable by authors or company owners" on public.marketplace_reviews;

create policy "Marketplace reviews insertable by authenticated users" on public.marketplace_reviews
  for insert with check (created_by = auth.uid());

create policy "Marketplace reviews manageable by authors or company owners" on public.marketplace_reviews
  for update using (
    created_by = auth.uid()
    or public.can_manage_marketplace_company(company_id, auth.uid())
  ) with check (
    created_by = auth.uid()
    or public.can_manage_marketplace_company(company_id, auth.uid())
  );

drop policy if exists "Marketplace connections visible to participants" on public.marketplace_connections;
drop policy if exists "Marketplace connections insertable by members" on public.marketplace_connections;
drop policy if exists "Marketplace connections manageable by participants" on public.marketplace_connections;

create policy "Marketplace connections visible to participants" on public.marketplace_connections
  for select using (public.can_read_marketplace_connection(id, auth.uid()));

create policy "Marketplace connections insertable by members" on public.marketplace_connections
  for insert with check (
    requested_by = auth.uid()
    and (
      requester_organization_id is null
      or public.is_organization_member(requester_organization_id, auth.uid())
    )
  );

create policy "Marketplace connections manageable by participants" on public.marketplace_connections
  for update using (public.can_read_marketplace_connection(id, auth.uid()))
  with check (public.can_read_marketplace_connection(id, auth.uid()));

drop policy if exists "Marketplace messages visible to connection participants" on public.marketplace_messages;
drop policy if exists "Marketplace messages insertable by connection participants" on public.marketplace_messages;
drop policy if exists "Marketplace messages read status manageable by participants" on public.marketplace_messages;

create policy "Marketplace messages visible to connection participants" on public.marketplace_messages
  for select using (public.can_read_marketplace_connection(connection_id, auth.uid()));

create policy "Marketplace messages insertable by connection participants" on public.marketplace_messages
  for insert with check (
    sender_profile_id = auth.uid()
    and public.can_read_marketplace_connection(connection_id, auth.uid())
  );

create policy "Marketplace messages read status manageable by participants" on public.marketplace_messages
  for update using (public.can_read_marketplace_connection(connection_id, auth.uid()))
  with check (public.can_read_marketplace_connection(connection_id, auth.uid()));

drop policy if exists "Marketplace favorites visible to owners" on public.marketplace_favorites;
drop policy if exists "Marketplace favorites manageable by owners" on public.marketplace_favorites;

create policy "Marketplace favorites visible to owners" on public.marketplace_favorites
  for select using (
    profile_id = auth.uid()
    or (
      organization_id is not null
      and public.is_organization_member(organization_id, auth.uid())
    )
  );

create policy "Marketplace favorites manageable by owners" on public.marketplace_favorites
  for all using (
    profile_id = auth.uid()
    or (
      organization_id is not null
      and public.is_organization_member(organization_id, auth.uid())
    )
  ) with check (
    profile_id = auth.uid()
    or (
      organization_id is not null
      and public.is_organization_member(organization_id, auth.uid())
    )
  );

create or replace function public.refresh_marketplace_company_rating(target_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.marketplace_companies c
  set
    rating = coalesce((
      select round(avg(r.rating)::numeric, 2)
      from public.marketplace_reviews r
      where r.company_id = target_company_id and r.status = 'published'
    ), 0),
    review_count = (
      select count(*)::integer
      from public.marketplace_reviews r
      where r.company_id = target_company_id and r.status = 'published'
    ),
    updated_at = now()
  where c.id = target_company_id;
end;
$$;

create or replace function public.handle_marketplace_review_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_marketplace_company_rating(coalesce(new.company_id, old.company_id));
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_review_rating_refresh_insert on public.marketplace_reviews;
create trigger marketplace_review_rating_refresh_insert
after insert or update or delete on public.marketplace_reviews
for each row execute function public.handle_marketplace_review_rating();

create index if not exists marketplace_companies_slug_idx on public.marketplace_companies(slug);
create index if not exists marketplace_companies_organization_id_idx on public.marketplace_companies(organization_id);
create index if not exists marketplace_companies_owner_id_idx on public.marketplace_companies(owner_id);
create index if not exists marketplace_companies_category_idx on public.marketplace_companies(category);
create index if not exists marketplace_companies_location_idx on public.marketplace_companies(country, city);
create index if not exists marketplace_companies_verified_status_idx on public.marketplace_companies(verified, status);
create index if not exists marketplace_companies_rating_idx on public.marketplace_companies(rating desc);
create index if not exists marketplace_company_categories_company_id_idx on public.marketplace_company_categories(company_id);
create index if not exists marketplace_company_services_company_id_idx on public.marketplace_company_services(company_id);
create index if not exists marketplace_company_locations_company_id_idx on public.marketplace_company_locations(company_id);
create index if not exists marketplace_portfolios_company_id_idx on public.marketplace_portfolios(company_id);
create index if not exists marketplace_reviews_company_id_idx on public.marketplace_reviews(company_id);
create index if not exists marketplace_connections_target_company_id_idx on public.marketplace_connections(target_company_id);
create index if not exists marketplace_connections_requester_organization_id_idx on public.marketplace_connections(requester_organization_id);
create index if not exists marketplace_messages_connection_id_created_at_idx on public.marketplace_messages(connection_id, created_at desc);
create index if not exists marketplace_favorites_profile_id_idx on public.marketplace_favorites(profile_id);
create index if not exists marketplace_favorites_company_id_idx on public.marketplace_favorites(company_id);
create index if not exists marketplace_certifications_company_id_idx on public.marketplace_certifications(company_id);
