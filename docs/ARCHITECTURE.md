# Vorqa AI Frontend Architecture

Sprint 14.0 introduces a frontend data architecture that separates UI rendering from data source selection. It does not change authentication, Supabase, OpenAI, API routes, database schema, RLS, business logic, routes, or visual design.

## Application Layers

Vorqa now has a clear frontend layering model:

1. **App routes** in `app/`
   - Own route composition, page layout, and route-level state.
   - Should not directly import large demo datasets.

2. **Components** in `components/`
   - Own reusable visual and interaction primitives.
   - Should receive domain data through props or repository-backed page composition.

3. **Repositories** in `lib/repositories/`
   - Provide the frontend data access boundary.
   - Currently return demo data.
   - Later can be replaced with Supabase/API calls while preserving UI contracts.

4. **Data adapters** in `lib/data/`
   - Collect reusable demo datasets behind a stable import path.
   - Keep demo data isolated from page components.

5. **Domain models** in `lib/models/`
   - Define shared TypeScript contracts for business entities.
   - Include IDs, timestamps, ownership fields, status fields, enums, and reusable shared types.

6. **Constants** in `lib/constants/`
   - Centralize status values, priorities, phases, roles, categories, and state labels.

7. **Utilities** in `lib/utils/`
   - Provide shared search, filtering, sorting, formatting, and status helpers.

## Folder Structure

```text
lib/
  constants/
  data/
  models/
  repositories/
  utils/
  ai-providers.ts
  auth-client.ts
  supabase.ts
  supabase-server.ts
```

## Data Flow

Current UI flow:

```text
app route -> repository -> lib/data adapter -> existing demo module -> UI props/components
```

Future production flow:

```text
app route -> repository -> API/Supabase loader -> normalized domain model -> UI props/components
```

This keeps pages and shared components from being coupled to whether data is demo, Supabase-backed, or API-backed.

## Repositories

Current repository modules:

- `organizationRepository.ts`
- `projectRepository.ts`
- `employeeRepository.ts`
- `marketplaceRepository.ts`
- `rfqRepository.ts`
- `contractRepository.ts`

These repositories intentionally expose simple read methods such as `list`, `getById`, `getCompanyBySlug`, and `listQuotations`. They are synchronous today because they return demo data. Production replacements may become async, and pages should be migrated route by route when real loaders are introduced.

## Domain Models

Domain models were added for:

- Organization
- Department
- Employee
- Project
- Task
- Timeline
- Budget
- Document
- Knowledge
- MarketplaceCompany
- RFQ
- Quotation
- Contract
- Notification
- UserProfile

The models define durable contracts for future production integration while allowing the current demo objects to remain unchanged.

## Future Supabase Integration

Recommended migration order:

1. User profile and settings.
2. Organizations and memberships.
3. Departments, employees, roles, and permissions.
4. Projects and project workspace summaries.
5. Documents, generated outputs, saved items, favorites, and history.
6. Knowledge files and storage metadata.
7. Marketplace companies and company profiles.
8. RFQs and quotations.
9. Contracts and contract activity.
10. Notifications and global search indexing.

Each migration should update the relevant repository first, then adjust only the routes that consume it.

## Future API Layer

The repository layer can later call internal API routes or Supabase server helpers. Keep these rules:

- Service-role secrets remain server-only.
- Client components do not receive privileged tokens.
- Ownership remains enforced through authenticated user context and `owner_id` semantics.
- Demo fallback can remain useful for development and sales demos, but must be explicit.

## AI Integration Points

Existing AI generation remains separate from this sprint. Future data integration should connect VORA to:

- Project context through `projectRepository`.
- Knowledge file metadata through a future knowledge repository.
- Documents and history through document repositories.
- RFQ, quotation, and contract context through the relevant repositories.

The OpenAI integration should continue to live behind server-side routes and provider abstractions, never directly inside UI components.

## Sprint 14.1 Data Source Layer

Projects now support repository-level data-source selection through `NEXT_PUBLIC_DATA_SOURCE`:

- `demo`: always read local demo data.
- `supabase`: read the existing protected `/api/projects` route and never silently substitute demo records.
- `auto`: read Supabase when configured and authenticated, with demo fallback only when Supabase/session access is unavailable.

The project repository now exposes async methods:

- `getProjects`
- `getProjectById`
- `getProjectsByOwner`

Organizations remain demo-backed because the current Supabase schema has no compatible `organizations` table or membership relationship.

Sprint 14.2 adds the Organizations production foundation:

- `organizationDemoAdapter`
- `organizationSupabaseAdapter`
- `organizationMapper`
- extended Organization domain fields for future production records
- repository methods for organization projects, employees, and stats

The Supabase adapter is intentionally empty until an organizations schema and membership/RLS model exists.

## Production Notes

- Page-local arrays that describe UI presentation, such as table rows, wizard labels, local insights, and tab definitions, may remain inside pages/components.
- Large reusable demo datasets should be accessed through repositories.
- Repository methods are intentionally small and boring. Avoid over-engineering until the first real production loader is connected.
