# Vorqa AI Route Architecture

## Purpose

This document records route consolidation recommendations for Sprint 21A. No route is deleted in this sprint.

## Current Route Observations

Vorqa has a broad route surface:

- `/dashboard`
- `/projects`
- `/projects/[id]`
- `/tools`
- `/tools/document`
- `/tools/cv`
- `/tools/landing-page`
- `/tools/business-idea`
- `/tools/marketing`
- `/organizations`
- `/organizations/[id]`
- `/marketplace`
- `/marketplace/rfq`
- `/rfq`
- `/quotations`
- `/contracts`
- `/billing`
- `/admin`
- `/notifications`
- `/history`
- `/saved`
- `/favorites`
- `/settings`

The issue is not that these routes exist. The issue is that many of them are presented as equal top-level concepts.

## Duplicate Or Competing Concepts

### RFQ

Current competing entries:

- `/rfq`
- `/marketplace/rfq`
- `/marketplace/rfq/[id]`

Recommendation:

Use Marketplace as the parent concept for RFQ discovery and supplier workflows, or use `/rfq` as the canonical operational route. Do not keep both as equally visible primary destinations.

Short-term Sprint 21A decision:

- Keep all routes.
- Move RFQ into More.
- Keep marketplace visible as the parent commercial surface.

### Quotations

Current routes:

- `/quotations`
- `/quotations/[id]`
- `/quotations/compare`
- marketplace RFQ comparison routes

Recommendation:

Treat quotations as a downstream RFQ workflow, not a primary workspace entry.

Short-term Sprint 21A decision:

- Keep routes.
- Move quotations into More.

### Tools And VORA

Current routes:

- `/tools`
- `/tools/document`
- individual tool pages

Recommendation:

Make VORA the primary AI entry. Keep tools as secondary utilities.

Short-term Sprint 21A decision:

- Primary navigation points to `/tools/document` as VORA.
- `/tools` remains under More as AI Tools.

### History, Saved, Favorites

Current routes:

- `/history`
- `/saved`
- `/favorites`

Recommendation:

These should become part of the VORA or workspace memory model rather than top-level destinations.

Short-term Sprint 21A decision:

- Keep all routes.
- Move under More.

### Billing And Admin

Current routes:

- `/billing`
- `/admin`

Recommendation:

Keep for enterprise readiness, but avoid showing them as daily work destinations for normal users.

Short-term Sprint 21A decision:

- Move under More.

## Target Route Hierarchy

Primary workspace routes:

- `/dashboard`
- `/projects`
- `/projects/[id]`
- `/tools/document`
- `/organizations`
- `/marketplace`

Secondary operational routes:

- `/tools`
- `/rfq`
- `/quotations`
- `/contracts`
- `/notifications`
- `/history`
- `/saved`
- `/favorites`
- `/billing`
- `/admin`
- `/settings`

## Future Consolidation Recommendation

1. Choose one canonical RFQ route family.
2. Place quotations under RFQ.
3. Place contracts under awarded RFQ or project operations.
4. Merge saved, favorites, and history into a single VORA memory/output library.
5. Keep billing and admin role-gated and secondary.
6. Keep Project Workspace as the center of execution.

## Non-Goals For Sprint 21A

- No route deletion.
- No route redirects.
- No database changes.
- No backend changes.
- No feature removal.
