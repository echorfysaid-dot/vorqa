# Construction Intelligence Workspace

## Scope

Sprint 24 adds a central workspace for VORA Construction Intelligence at:

- `/tools/construction-intelligence`

The workspace is an integration layer only. It does not introduce a new AI runtime, API route, provider, database table, or business workflow.

## Active Features

- Contract Review: launches `/tools/contract-review` and uses the existing `contract_review` VORA intelligence flow.
- BOQ Review: launches `/tools/boq-review` and uses the existing `cost_review` VORA intelligence flow.
- Risk Assessment: launches `/tools/risk-assessment` and uses the existing VORA runtime with `risk_assessment`, internally mapped to the canonical risk reasoning and report flow.
- Planning Review: launches `/tools/planning-review` and uses the existing VORA runtime with `planning_review`, internally mapped to the canonical planning reasoning and report flow. It reviews supplied planning information without calculating dates or optimizing schedules.

## Coming Soon Features

The following capabilities are displayed as disabled cards with no navigation side effects:

- Site Report Review
- Meeting Minutes
- Executive Summary

## Architecture

The workspace uses `lib/construction-intelligence-workspace.ts` as the canonical feature registry. The UI reads active and coming-soon states from that file so launchable tools and disabled tools remain deterministic.

Existing architecture preserved:

- VORA Intelligence Runtime
- Reasoning Engine
- Decision Engine
- Report Engine
- Recommendation Engine
- Prompt Builder
- Existing `/api/generate`
- Existing OpenAI / mock execution behavior

## Tools Page Integration

`/tools` now includes a primary Construction Intelligence gateway card. Existing tool cards, prompts, side panels, and routes remain available.

## Future Expansion

Future construction intelligence tools should be added to the registry first, then activated by adding a route and href. Disabled features should remain without `href` to avoid broken navigation.
