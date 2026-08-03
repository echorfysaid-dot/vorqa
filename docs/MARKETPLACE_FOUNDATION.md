# Marketplace Production Foundation

Sprint 18.0 creates the production-ready frontend foundation for the Vorqa Construction Marketplace without changing authentication, Supabase schema, APIs, projects, VORA AI, reports, or dashboard business logic.

## Purpose

The Marketplace allows organizations to discover, evaluate, and connect with construction businesses:

- general contractors
- subcontractors
- suppliers
- engineering offices
- architects
- interior designers
- surveyors
- project management firms
- HVAC, electrical, mechanical, concrete, steel, roads, infrastructure, landscape, safety, equipment rental, logistics, and other service providers

## Architecture

The Marketplace follows the existing Repository -> Adapter -> Mapper -> Hook pattern.

Files:

- `lib/models/marketplace.ts`
- `lib/repositories/marketplaceRepository.ts`
- `lib/repositories/marketplaceDemoAdapter.ts`
- `lib/repositories/marketplaceSupabaseAdapter.ts`
- `lib/repositories/marketplaceMapper.ts`
- `lib/repositories/marketplaceHooks.ts`

The UI does not call Supabase directly. Pages consume the repository facade or hooks.

## Data Modes

Demo mode:

- Uses the existing realistic marketplace companies.
- Adds production domain fields through the mapper.
- Supports search, filtering, sorting, dashboard widgets, company pages, compare, and shortlist UI.

Supabase mode:

- Expects a future `marketplace_companies` table.
- Reads through the authenticated REST helper.
- Does not create tables or migrations in this sprint.

Auto mode:

- Attempts Supabase first.
- Falls back to demo marketplace data if Supabase is unavailable.

## Marketplace Domain

Production models now cover:

- `MarketplaceCompany`
- `MarketplaceCategory`
- `MarketplaceService`
- `MarketplaceLocation`
- `MarketplaceReview`
- `MarketplacePortfolio`
- `MarketplaceCertification`
- `MarketplaceProject`
- `MarketplaceFilters`
- `MarketplaceDashboardWidgets`

Company profile fields support:

- company logo and cover image
- description and about text
- specialties and business categories
- country, city, address, and service areas
- website, phone, email, and contact person
- years of experience
- employee count
- active and completed projects
- certifications
- languages
- response time and response rate
- verification status
- availability
- services
- portfolio
- reviews
- documents
- VORA fit and risk insights

## Search and Filters

The repository supports:

- text search
- country
- city
- category
- experience
- rating
- verified state
- availability
- languages
- services
- sorting

Sorting supports:

- recommended
- rating
- experience
- completed projects
- response time
- newest

## UI Integration

Updated areas:

- `/marketplace` now consumes `useMarketplaceCompanies`.
- Marketplace cards continue to support compare and shortlist UI state.
- Search and filters run through shared repository filtering.
- Dashboard includes marketplace widgets for recently added, top rated, verified, nearby, and recommended companies.
- Company profile routes continue to use the repository facade.

Existing compare and shortlist pages remain stable and continue to reuse marketplace repository data.

## Future Supabase Table Candidate

No migration was created in Sprint 18.0. A future production migration can add:

```sql
marketplace_companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  slug text unique not null,
  name text not null,
  logo text,
  logo_url text,
  cover_image text,
  description text,
  about text,
  category text,
  business_categories text[],
  specialties text[],
  country text,
  city text,
  address jsonb default '{}',
  website text,
  phone text,
  email text,
  years_of_experience integer default 0,
  employees integer default 0,
  active_projects integer default 0,
  completed_projects integer default 0,
  partners integer default 0,
  certifications text[],
  languages text[],
  services text[],
  service_areas text[],
  response_time text,
  response_rate text,
  verification_status text default 'unverified',
  verified boolean default false,
  availability text default 'by_request',
  rating numeric default 0,
  review_count integer default 0,
  status text default 'active',
  legal_status text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

Future related tables:

- `marketplace_services`
- `marketplace_reviews`
- `marketplace_portfolio`
- `marketplace_certifications`
- `marketplace_locations`
- `marketplace_saved_companies`
- `marketplace_connections`

## RLS Expectations

Future RLS should support:

- public read access only for approved and published marketplace profiles
- organization owners can manage their own company profile
- marketplace admins can verify or suspend companies
- private contact fields may require authenticated organization membership
- reviews should be readable when published and writable only by verified project participants

## Remaining Limitations

- No marketplace tables or RLS policies are created yet.
- No real messaging or connection requests are implemented.
- No real review writing is implemented.
- Compare and shortlist remain UI state only.
- VORA marketplace insights are demo-generated and do not call OpenAI.
- Supabase mode requires future marketplace tables before it can return live data.
