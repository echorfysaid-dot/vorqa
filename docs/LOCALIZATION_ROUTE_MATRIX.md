# Vorqa AI Localization Route Matrix

This matrix records the final repository-wide localization audit. System UI is resolved through the shared `I18nProvider` and runtime catalog. User-entered names, free text, uploaded filenames, identifiers, and generated AI content intentionally remain unchanged.

| Area | Routes | AR | FR | EN | Direction |
| --- | --- | --- | --- | --- | --- |
| Public | `/`, `/pricing`, `/coming-soon` | Verified | Verified | Verified | RTL / LTR |
| Authentication | `/login`, `/register`, `/onboarding` | Verified | Verified | Verified | RTL / LTR |
| Command center | `/dashboard` | Verified | Verified | Verified | RTL / LTR |
| Projects | `/projects`, `/projects/[id]`, `/projects/[id]/intelligence` | Verified | Verified | Verified | RTL / LTR |
| Organizations | `/organizations`, `/organizations/new`, `/organizations/[id]`, `/organizations/atlas` | Verified | Verified | Verified | RTL / LTR |
| Marketplace | `/marketplace`, `/marketplace/[slug]`, `/marketplace/compare`, `/marketplace/shortlist` | Verified | Verified | Verified | RTL / LTR |
| RFQ | `/rfq`, `/rfq/new`, `/rfq/[id]`, `/marketplace/rfq`, `/marketplace/rfq/new`, `/marketplace/rfq/[id]`, `/marketplace/rfq/[id]/award`, `/marketplace/rfq/[id]/compare` | Verified | Verified | Verified | RTL / LTR |
| Quotations | `/quotations`, `/quotations/[id]`, `/quotations/compare` | Verified | Verified | Verified | RTL / LTR |
| Contracts | `/contracts`, `/contracts/[id]` | Verified | Verified | Verified | RTL / LTR |
| Billing | `/billing`, `/billing/invoices`, `/billing/plans`, `/billing/usage`, `/invoices`, `/plans`, `/usage` | Verified | Verified | Verified | RTL / LTR |
| Intelligence tools | `/tools`, `/tools/construction-intelligence`, `/tools/contract-review`, `/tools/boq-review`, `/tools/risk-assessment`, `/tools/planning-review`, `/tools/site-report-review`, `/tools/executive-summary` | Verified | Verified | Verified | RTL / LTR |
| General tools | `/tools/business-idea`, `/tools/cv`, `/tools/document`, `/tools/landing-page`, `/tools/marketing` | Verified | Verified | Verified | RTL / LTR |
| Personal workspace | `/notifications`, `/history`, `/saved`, `/favorites`, `/settings` | Verified | Verified | Verified | RTL / LTR |
| Administration | `/admin`, `/admin/users`, `/admin/organizations`, `/admin/subscriptions`, `/admin/ai`, `/admin/system`, `/admin/audit`, `/admin/feature-flags` | Verified | Verified | Verified | RTL / LTR |

## Automated coverage

- Catalog parity across Arabic, French, and English.
- Runtime translation of direct JSX text, common accessibility attributes, and structured card metadata.
- Locale-aware dates, numbers, percentages, durations, and currencies.
- Demo/system data localization without changing real user content.
- Stray bracket and parenthesis artifact detection.
- Active locale persistence and HTML `lang` / `dir` synchronization.

## Manual browser smoke coverage

The public entry, authentication flow, global navigation, and representative protected routes are checked at desktop and mobile widths whenever an authenticated local session is available. Protected data-dependent states remain additionally covered by the deterministic runtime and repository tests.
