# Notifications Foundation

Sprint 18.5 adds the frontend and repository foundation for a production Notification Center without applying database changes automatically.

## Scope

Notifications unify events from:

- Organizations
- Projects
- Tasks and milestones
- Budget and payments
- Documents and knowledge
- Marketplace, connections, and messages
- RFQs, quotations, awards, and contracts
- VORA AI
- System events

## Repository Flow

The notification module follows the existing Vorqa data architecture:

UI -> notificationHooks -> notificationRepository -> demo/supabase adapter -> mapper -> domain models

Data source modes remain:

- `demo`: uses realistic construction demo notifications.
- `supabase`: uses Supabase REST and current authenticated session.
- `auto`: tries Supabase first and falls back to demo data if production tables are unavailable.

## Domain Models

The model file defines:

- `Notification`
- `NotificationType`
- `NotificationPriority`
- `NotificationStatus`
- `NotificationRecipient`
- `NotificationPreference`
- `NotificationSummary`

The older `NotificationItem` compatibility type remains available for existing dashboard and shell surfaces.

## Database Blueprint

Migration generated:

`database/migrations/20260719_notifications_foundation.sql`

Tables:

- `notifications`
- `notification_recipients`
- `notification_preferences`

The migration is idempotent and should be reviewed/applied manually in Supabase when the team is ready.

## RLS Strategy

Anonymous users have no access.

Authenticated users can read notifications when:

- they own the notification,
- they are the direct recipient,
- they are listed in `notification_recipients`,
- or they are members of the related organization.

Owners and members with `manage_organization` can create and manage organization notifications.

Users manage their own notification preferences.

## Actions

Repository actions are prepared for:

- mark as read
- mark all as read
- archive
- soft delete
- open related entity via `href`

The current UI applies optimistic local state and then calls the repository.

## Dashboard Integration

The dashboard now shows:

- unread count
- critical count
- reminders
- AI alerts
- recent notifications

## Remaining Production Work

- Apply the migration manually.
- Add server-side notification producers from modules.
- Add realtime subscriptions after Supabase tables are live.
- Add email/push/SMS providers.
- Add audit logging for destructive notification actions.
