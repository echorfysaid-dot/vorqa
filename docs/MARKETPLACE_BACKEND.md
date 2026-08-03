# Marketplace Backend Production Foundation

Sprint 18.4 transforms the Marketplace from demo-ready to production-ready backend architecture.

## Scope

This sprint adds:

- Supabase migration blueprint
- production RLS policies
- marketplace company persistence
- categories, services, locations, portfolios, reviews, certifications
- connections and messaging foundation
- favorites persistence
- repository CRUD methods
- dashboard Marketplace KPIs

No migration was applied automatically.

## Schema

Migration:

- `database/migrations/20260719_marketplace_backend.sql`

Tables:

- `marketplace_companies`
- `marketplace_company_categories`
- `marketplace_company_services`
- `marketplace_company_locations`
- `marketplace_portfolios`
- `marketplace_reviews`
- `marketplace_connections`
- `marketplace_messages`
- `marketplace_favorites`
- `marketplace_certifications`

## Relationships

Marketplace companies can link to:

- `organizations.id`
- `profiles.id`
- `projects.id`
- `documents.id`
- organization employees indirectly through organization membership and future employee assignment

Portfolio records can reference projects.

Reviews can reference projects and profiles.

Certifications can reference documents.

Connections can reference requester organizations, target companies, projects, and requester profiles.

Messages belong to marketplace connections.

Favorites belong to profiles and optionally organizations.

## RLS

Public verified marketplace profile read:

- verified companies with `status = 'published'`
- public child records for verified published companies

Company owner management:

- company `owner_id`
- organization owner
- organization members with `manage_organization`
- organization members with `manage_marketplace`

Connections and messages:

- requester profile
- requester organization members
- target company organization members

Favorites:

- favorite owner profile
- related organization members

Reviews:

- authenticated users create reviews as themselves
- authors and company owners can update review state

Anonymous users can only read verified public company profiles and their public profile data.

## Repository Flow

The UI continues to use:

- `marketplaceRepository`
- `marketplaceHooks`

Production methods added:

- `createCompany`
- `updateCompany`
- `createConnection`
- `getConnections`
- `getMessages`
- `sendMessage`
- `addFavorite`
- `getFavorites`
- `createReview`
- `createPortfolio`

Adapters:

- `marketplaceDemoAdapter`
- `marketplaceSupabaseAdapter`

Auto mode:

- attempts Supabase first
- falls back to demo data if Supabase is unavailable or tables are not applied yet

## Messaging

Messaging foundation supports:

- conversation list through `marketplace_connections`
- thread messages through `marketplace_messages`
- read status through `read_at`
- last-message metadata on connections
- message metadata for future attachments and system events

Realtime was not implemented in this sprint.

## Connections

Connections support:

- requester organization
- target marketplace company
- requester profile
- related project
- intent
- notes
- status
- metadata

Statuses:

- `pending`
- `accepted`
- `declined`
- `archived`

## Reviews

Reviews persist:

- rating
- review text
- created by profile
- reviewer name/company
- created date
- verification flag

The migration includes a trigger to refresh company average rating and review count.

## Portfolio

Portfolio persistence supports:

- title
- description
- location
- project type
- status
- budget
- completed date
- gallery metadata
- documents metadata
- before/after metadata

No file upload was added in this sprint.

## Dashboard KPIs

Marketplace dashboard widgets now include optional backend KPIs:

- companies
- connections
- favorites
- messages
- reviews
- verified companies

## Remaining Limitations

- Migration is generated but not applied.
- No realtime messaging.
- No real media upload for logo, cover, gallery, certificates, or documents.
- No dedicated company onboarding UI was added in this backend sprint.
- No marketplace admin moderation UI yet.
