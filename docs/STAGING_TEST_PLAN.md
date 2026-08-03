# VORQA Staging Test Plan

## Test Users

Create these staging accounts:

- Platform admin
- Organization owner
- Organization member
- Organization manager with `manage_organization`
- Unauthorized member from another organization
- Anonymous browser session

## Core Workflow

1. Register owner.
2. Confirm email if required.
3. Login.
4. Create organization.
5. Create department.
6. Create employee.
7. Create project.
8. Assign project member.
9. Create task.
10. Create milestone.
11. Add budget item.
12. Upload knowledge file.
13. Upload project document.
14. Generate VORA document.
15. Confirm generated output appears in history.
16. Browse marketplace.
17. Create RFQ.
18. Review quotation UI.
19. Review contract UI.
20. Open notifications.
21. Open billing.
22. Open admin as allowed admin user.
23. Logout.

## Access Tests

- Owner can read and manage organization data.
- Member can read allowed organization data.
- Unauthorized member cannot read another organization's private records.
- Anonymous user cannot read private records.
- Storage download denies unrelated user.
- Storage delete denies unrelated user.

## Error Tests

- Missing OpenAI key uses mock fallback.
- Invalid OpenAI key returns safe error.
- Upload unsupported file type returns validation error.
- Oversized upload returns validation error.
- Invalid entity ID returns safe validation error.
- Missing route returns 404.
- Runtime page error shows global error state.

## Acceptance Criteria

Private beta can start when:

- Build passes.
- Major routes return 200.
- `/api/health` returns `ok` or accepted staging warnings.
- Supabase migrations are verified.
- Storage policies are verified.
- Auth works with real staging accounts.
- OpenAI real generation and mock fallback are verified.
- No cross-organization access is possible.
- Rollback plan is documented and tested.
