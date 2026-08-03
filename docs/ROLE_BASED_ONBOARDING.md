# Role-Based Onboarding Foundation

## Flow

Vorqa uses one guarded onboarding flow: account type, individual role or organization type, existing account creation, workspace setup, then the active workspace. Identifiers are stable typed values and translated labels are presentation-only.

## Sources of Truth

- `profiles.account_type` stores exactly `individual` or `organization`.
- `profiles.primary_role` stores an individual role only.
- `profiles.organization_type` stores an organization classification only.
- `profiles.onboarding_status` stores progress.
- `profiles.active_workspace_type` stores the current workspace foundation.
- `profiles.workspace_configuration` stores role-specific setup values.
- Authentication remains owned by the existing Supabase auth routes.

Temporary progress is saved in session storage only to support refresh during onboarding. Completed profile data is read and updated through `/api/onboarding`; the browser never writes to Supabase directly.

## Existing Accounts

An authenticated profile without completed onboarding is sent once to `/onboarding`. The flow updates the existing profile and does not create a second user, organization, project, or account. If the additive migration is not available yet, the guard fails open to preserve existing access.

## Navigation And Capabilities

`lib/onboarding.ts` is the canonical identity-navigation configuration. Navigation is derived from identity and remains independent from membership-based permissions. Existing routes remain unchanged. A missing capability links to `/coming-soon` with a clear unavailable state instead of redirecting to unrelated behavior.

## VORA Context

The AI application context receives the typed primary role and active workspace type as read-only metadata. Provider selection, prompts, model policies, and execution are unchanged.

## Migration

Apply `database/migrations/20260730_role_based_onboarding.sql` first, then review and apply `database/migrations/20260730_account_workspace_architecture_refinement.sql`. The refinement converts the legacy company role without deleting data and introduces explicit account, organization, workspace, and team concepts. Do not apply migrations automatically from the application.
