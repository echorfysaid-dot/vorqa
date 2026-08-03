# VORQA Enterprise Administration Panel

## Scope

Sprint 19.2 introduces a frontend Administration foundation for platform operators. It does not change authentication, Supabase schema, API routes, billing workflows, marketplace workflows, or repository architecture.

## Pages

- `/admin` shows platform metrics, system health, recent audit events, revenue foundation, AI usage, storage usage, and module counts.
- `/admin/users` shows user management foundations with search, role/status display, and suspend/restore UI actions.
- `/admin/organizations` shows organization summaries, member counts, project counts, storage, plan status, and AI usage.
- `/admin/subscriptions` shows plan, status, monthly recurring revenue, renewal dates, invoices, and usage.
- `/admin/audit` shows authentication, project, marketplace, contract, billing, AI, admin, and system events with search and filtering.
- `/admin/feature-flags` shows feature rollout controls for Marketplace, VORA AI, Notifications, Billing, and Private Beta.
- `/admin/system` shows service health and platform settings.
- `/admin/ai` shows AI usage, active AI users, and AI audit activity.

## Repository Flow

The Admin module follows the existing Repository -> Adapter -> Mapper -> Data Source pattern:

- `adminRepository` is the public data access layer.
- `adminDemoAdapter` provides realistic private-beta demo data.
- `adminSupabaseAdapter` is prepared for future production admin views.
- `adminMapper` normalizes status, audit type, feature flag status, settings, and filters.
- `adminHooks` exposes client-safe hooks for admin pages.

## Data Source Modes

- `demo`: always uses demo admin data.
- `supabase`: attempts production admin views and returns safe empty states if unavailable.
- `auto`: tries Supabase first and falls back to demo data if admin views are not configured.

## Future Supabase Views

The current Supabase adapter expects future read models or RPC-backed views:

- `admin_dashboard`
- `admin_users`
- `admin_organizations`
- `admin_subscriptions`
- `admin_audit`
- `admin_feature_flags`
- `admin_system_health`
- `admin_platform_settings`

No migration is generated in this sprint because the request introduces the Administration Panel foundation without requiring new database schema.

## Security Boundary

The module does not expose service-role credentials. Future production admin views must enforce platform-admin authorization at the database or API layer before exposing platform-wide data.

## Current Limitations

- Suspend/restore, feature flag toggles, and system settings are UI foundations only.
- Production Supabase admin views are not implemented yet.
- Audit records are demo data unless future views are available.
