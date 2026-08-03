# First Customer Onboarding

## Goal

Guide the first private beta customer from account creation to a complete project workflow inside VORQA.

## 1. Create Organization

1. Register the organization owner.
2. Confirm email if required.
3. Open `/organizations/new`.
4. Enter organization name, slug, legal name, website, country, city, timezone, and currency.
5. Confirm the organization appears in `/organizations`.

## 2. Invite Users

1. Open the organization workspace.
2. Add or prepare member records.
3. Assign roles:
   - Owner
   - Admin
   - Project Manager
   - Architect
   - Engineer
   - Procurement
   - Finance
4. Confirm member access with a non-owner account.

## 3. Create First Project

1. Open `/projects`.
2. Create or select the first project.
3. Set organization, department, manager, status, and description.
4. Open the project workspace.
5. Review Overview, Tasks, Timeline, Budget, Documents, Knowledge, Reports, Team, and Settings.

## 4. Upload Documents

1. Open the project Documents or Knowledge tab.
2. Upload a PDF, image, or document.
3. Confirm upload progress.
4. Confirm file appears in the project.
5. Confirm download works.
6. Confirm delete/archive behavior.

## 5. Use VORA AI

1. Open `/tools/document` or the project VORA workspace.
2. Select project context.
3. Generate a project document.
4. Confirm output language and tone.
5. Save output.
6. Confirm output appears in history.

## 6. Create RFQ

1. Open `/rfq/new`.
2. Fill project information, requested services, budget range, timeline, and selected companies.
3. Review before submission.
4. Confirm RFQ detail route loads.

## 7. Compare Quotations

1. Open `/quotations`.
2. Open a quotation.
3. Open `/quotations/compare`.
4. Review price, timeline, risk, and VORA recommendation sections.

## 8. Award Supplier

1. Open RFQ award flow.
2. Select winning quotation.
3. Review scope, price, notes, and decision.
4. Confirm no real notification or contract is created unless production workflow is explicitly enabled.

## 9. Create Contract

1. Open `/contracts`.
2. Open contract detail.
3. Review parties, milestones, payments, deliverables, and VORA insights.

## Customer Success Notes

- Keep first onboarding session guided.
- Use one real project with limited data.
- Avoid uploading sensitive files until RLS and Storage tests pass.
- Capture feedback with `docs/BUG_REPORT_TEMPLATE.md`.
