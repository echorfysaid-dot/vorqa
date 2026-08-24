# Vorqa AI Autonomous Agent Task Board

Use this board to control what the Vorqa AI agent is allowed to do. The agent may execute only one task whose status is `READY`; tasks marked `BACKLOG` are planning ideas, not implementation approval.

## Status values

- `READY`: approved for the agent to start within the task's stated boundaries.
- `IN_PROGRESS`: already being handled on a dedicated branch or pull request.
- `BLOCKED`: requires product clarification, access, or explicit approval.
- `DONE`: completed and verified; not necessarily merged or deployed.
- `BACKLOG`: proposed future work and not approved for implementation.

## P0 — Approved next task

### VQ-001 — Audit the complete pre-construction owner journey

- Status: `READY`
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

### VQ-002 — Define pre-construction stage vocabulary and UI state

- Status: `BACKLOG`
- Scope: propose a typed lifecycle map and status presentation without database migrations.
- Approval gate: any persistence schema or RLS change requires explicit user approval.

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

- Start all implementation branches from `vorqa-current`.
- Never merge, deploy, modify secrets, or change protected systems without explicit approval.
- If this board is not yet present on `vorqa-current`, inspect the open setup pull request before creating duplicate setup work.
