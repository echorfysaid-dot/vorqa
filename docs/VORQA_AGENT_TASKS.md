# Vorqa AI Owner-Controlled Task Board

Use this board only to describe possible Vorqa AI tasks. No board status authorizes any inspection or implementation. The agent starts only when the owner gives a direct command, remains read-only by default, and changes files only after fresh approval for the exact task plus confirmation that the owner is not currently working on Vorqa.

## Status values

- `PENDING_APPROVAL`: proposed task that must not be implemented.
- `APPROVED`: an owner-approved task; the status alone is still insufficient without fresh explicit approval in the current conversation.
- `IN_PROGRESS`: already being handled on a dedicated branch or pull request.
- `BLOCKED`: requires product clarification, access, or explicit approval.
- `DONE`: completed and verified; not necessarily merged or deployed.
- `BACKLOG`: proposed future work and not approved for implementation.

## P0 — Completed inspection

### VQ-001 — Audit the complete pre-construction owner journey

- Status: `DONE`
- Result: `docs/PRECONSTRUCTION_OWNER_JOURNEY_AUDIT.md`.
- Priority: `P0`
- Scope: inspect the existing routes, project lifecycle, owner workspace, stage gates, role model, documents, and VORA guidance.
- Deliverable: a concise gap analysis and proposed implementation sequence on an isolated agent branch; do not change application behavior in this task.
- Required lifecycle checkpoints:
  1. Project idea and project-owner request.
  2. Project needs, land information, budget, and initial feasibility.
  3. Recommendation of architects or engineers already registered in Vorqa.
  4. On-platform professional selection, communication, acceptance, and follow-up.
  5. Preliminary concepts, drawings, and architectural plans.
  6. Administrative document checklist and permit/readiness tracking.
  7. Contractor or company selection and project execution readiness.
  8. Explicit handoff into the active construction workspace.
- Acceptance criteria:
  - Identify existing implementation and missing pieces using real repository evidence.
  - Preserve the owner's retention inside Vorqa as a core design requirement.
  - Split follow-up work into small, independently reviewable tasks.
  - Identify any changes that would require database, auth, billing, or deployment approval.
  - Produce a handoff in Moroccan Arabic or Arabic.

## P1 — Candidate follow-up tasks

### VQ-002 — Keep the project context when recommending architects

- Status: `PENDING_APPROVAL`
- Priority: `P0`
- Scope: preserve `projectId` and the recommended professional category from the project-owner workspace to the marketplace, professional profile, and existing connection request.
- Acceptance criteria:
  - The project owner can reach the relevant registered architect or engineering category without losing the original project context.
  - Existing marketplace connections receive the supported `projectId` when available.
  - Arabic, French, and English behavior remains intact, including Arabic RTL.
  - Existing tests and the production build are run when a project checkout is available.
  - No authentication, billing, schema, RLS, secret, or deployment change is made.
- Approval gate: any persistence schema, role, permission, or RLS change requires explicit user approval.

### VQ-003 — Design architect discovery inside Vorqa

- Status: `BACKLOG`
- Scope: show recommended registered architects or engineers within the project-owner journey.
- Approval gate: any role, permission, billing, or external-contact change requires explicit user approval.

### VQ-004 — Prepare documents and permit readiness tracking

- Status: `BACKLOG`
- Scope: document checklist, evidence states, correction requests, and administrative readiness.
- Approval gate: any database migration or production document handling requires explicit user approval.

### VQ-005 — Connect pre-construction readiness to execution

- Status: `BACKLOG`
- Scope: define stage gates, contractor-selection readiness, and an explicit workspace handoff.
- Approval gate: any persistent workflow or authorization change requires explicit user approval.

### VQ-006 — Complete multilingual owner guidance

- Status: `BACKLOG`
- Scope: Arabic, French, and English copy plus Arabic RTL checks for the approved journey.

## Operating notes

- Never run automatically or from a schedule, webhook, or background process.
- Start only when the owner directly requests a named task.
- Inspect read-only and present the exact files, risks, and proposed changes first.
- Implement only after the owner explicitly approves that task and confirms they are not working on Vorqa.
- Start implementation branches from `vorqa-current` only when branch creation was specifically approved.
- Never open, read, copy, modify, expose, or transmit `.env` files, API keys, tokens, passwords, provider credentials, account secrets, customer data, or production information.
- If a task requires a secret or protected account access, stop immediately and ask the owner to handle that step.
- Never merge, deploy, modify secrets, alter authentication, or change protected systems without a separate explicit approval.
- Stop after one approved task and never automatically start the next task.
