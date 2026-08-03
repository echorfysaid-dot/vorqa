# VORQA Beta Operations Dashboard

## Purpose

This document describes the operational view for running the controlled private beta. The in-app Admin Panel is the product surface; this document is the operating procedure.

## Beta Organizations

Initial beta cohorts:

- Atlas Construction Group: primary construction operating-system demo/beta account
- One architecture office
- One contractor or supplier
- One project owner or investor

Each beta organization should have:

- owner account
- one manager account
- one member account
- one sample project
- controlled marketplace/RFQ/contract scenarios

## Admin Accounts

Recommended admin roles:

- Platform owner
- Support operator
- Supabase operator
- AI/OpenAI operator

Admin account rules:

- use named accounts, not shared logins
- use strong passwords
- enable MFA where available
- restrict admin access to trusted internal users

## Demo Accounts

Demo accounts should:

- use non-real email domains or approved staging emails
- avoid real customer personal data
- be clearly labelled as demo/staging
- be resettable without impacting production records

## Support Workflow

1. Receive issue.
2. Assign severity.
3. Capture organization, user, route, timestamp, and browser.
4. Check `/api/health`.
5. Check Supabase logs.
6. Check OpenAI usage/errors when AI is involved.
7. Reproduce in staging.
8. Decide workaround, fix-forward, or rollback.
9. Follow up with the beta user.

## Bug Reporting Workflow

Use `docs/BUG_REPORT_TEMPLATE.md`.

Required fields:

- severity
- route
- account/organization
- steps to reproduce
- expected behavior
- actual behavior
- screenshots/attachments
- logs
- environment

## Incident Response

Critical incidents:

- authentication down
- data exposure
- file access breach
- production deployment unavailable

Response:

1. Stop new invites.
2. Preserve logs.
3. Roll back if user impact is active.
4. Notify internal launch owner.
5. Prepare customer-safe status update.
6. Document root cause and prevention.
