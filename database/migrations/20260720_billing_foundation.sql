-- Sprint 19.1 - Billing & Subscription Platform
-- Generated only. Do not apply automatically from Codex.

create table if not exists public.billing_plans (
  id text primary key,
  name text not null,
  description text,
  price_monthly numeric not null default 0,
  price_yearly numeric not null default 0,
  currency text not null default 'MAD',
  limits jsonb not null default '{}',
  features text[] not null default array[]::text[],
  recommended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade,
  plan_id text references public.billing_plans(id) on delete restrict,
  status text not null default 'trialing',
  interval text not null default 'monthly',
  provider text not null default 'manual',
  current_period_start timestamptz,
  current_period_end timestamptz,
  renewal_date timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_status text not null default 'active',
  trial_ends_at timestamptz,
  provider_customer_id text,
  provider_subscription_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_usage_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade,
  subscription_id uuid references public.organization_subscriptions(id) on delete cascade,
  metric text not null,
  used numeric not null default 0,
  limit_value text not null default '0',
  unit text not null default 'count',
  period_start timestamptz not null,
  period_end timestamptz not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade,
  subscription_id uuid references public.organization_subscriptions(id) on delete set null,
  invoice_number text not null unique,
  status text not null default 'open',
  amount_subtotal numeric not null default 0,
  tax_amount numeric not null default 0,
  amount_total numeric not null default 0,
  currency text not null default 'MAD',
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  paid_at timestamptz,
  download_url text,
  provider text not null default 'manual',
  provider_invoice_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_payment_methods (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete cascade,
  provider text not null default 'manual',
  type text not null default 'manual_invoice',
  label text not null,
  last4 text,
  brand text,
  exp_month integer,
  exp_year integer,
  is_default boolean not null default false,
  provider_payment_method_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_subscriptions_org_idx on public.organization_subscriptions(organization_id);
create index if not exists organization_subscriptions_owner_idx on public.organization_subscriptions(owner_id);
create index if not exists billing_usage_records_org_metric_idx on public.billing_usage_records(organization_id, metric);
create index if not exists billing_invoices_org_issued_idx on public.billing_invoices(organization_id, issued_at desc);
create index if not exists billing_payment_methods_org_idx on public.billing_payment_methods(organization_id);

alter table public.billing_plans enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.billing_usage_records enable row level security;
alter table public.billing_invoices enable row level security;
alter table public.billing_payment_methods enable row level security;

drop policy if exists "billing_plans_read_authenticated" on public.billing_plans;
create policy "billing_plans_read_authenticated" on public.billing_plans for select to authenticated using (true);

drop policy if exists "organization_subscriptions_read_members" on public.organization_subscriptions;
create policy "organization_subscriptions_read_members" on public.organization_subscriptions for select to authenticated
  using (organization_id is not null and public.is_organization_member(organization_id, auth.uid()));

drop policy if exists "organization_subscriptions_manage_owner" on public.organization_subscriptions;
create policy "organization_subscriptions_manage_owner" on public.organization_subscriptions for all to authenticated
  using (organization_id is not null and (public.is_organization_owner(organization_id, auth.uid()) or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')))
  with check (organization_id is not null and (public.is_organization_owner(organization_id, auth.uid()) or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')));

drop policy if exists "billing_usage_read_members" on public.billing_usage_records;
create policy "billing_usage_read_members" on public.billing_usage_records for select to authenticated
  using (organization_id is not null and public.is_organization_member(organization_id, auth.uid()));

drop policy if exists "billing_invoices_read_members" on public.billing_invoices;
create policy "billing_invoices_read_members" on public.billing_invoices for select to authenticated
  using (organization_id is not null and public.is_organization_member(organization_id, auth.uid()));

drop policy if exists "billing_payment_methods_read_managers" on public.billing_payment_methods;
create policy "billing_payment_methods_read_managers" on public.billing_payment_methods for select to authenticated
  using (organization_id is not null and (public.is_organization_owner(organization_id, auth.uid()) or public.has_organization_permission(organization_id, auth.uid(), 'manage_organization')));
