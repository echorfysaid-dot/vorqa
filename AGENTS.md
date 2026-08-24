# Vorqa AI Agent Instructions

## Product north star

Vorqa AI is an Arabic-first, multilingual construction-project operating system. Keep the primary journey coherent:

`Organization -> Project -> Execution Workspace -> VORA Intelligence -> Decision / Report / Action`

The platform must support project owners, registered engineers and architects, contractors, supervisors, and companies from the earliest pre-construction stage through execution and closeout.

## Repository defaults

- Repository: `echorfysaid-dot/vorqa`.
- Base branch: `vorqa-current` unless the user explicitly chooses another branch.
- Framework: Next.js, React, TypeScript, and Tailwind CSS.
- Supported languages: Arabic, French, and English. Preserve Arabic RTL behavior.
- Invoke `$vorqa-ai-maintainer` only when the project owner explicitly selects or calls it.
- Treat `docs/VORQA_AGENT_TASKS.md` as a proposal board; no status grants permission to edit.

## Product priorities

Prioritize a complete, trustworthy owner journey over unrelated feature expansion:

1. Capture the project idea, project needs, land context, and budget.
2. Recommend architects or engineers who are already registered within Vorqa.
3. Keep professional matching, communication, progress visibility, and follow-up within the platform.
4. Track preliminary concepts, architectural plans, supporting documents, permits, and administrative requirements.
5. Connect approved pre-construction readiness to contractor selection and construction execution.
6. Give each role a clear next action and ground VORA guidance in actual project data.

## Owner-controlled manual mode

1. Never run automatically, on a schedule, from a webhook, or in the background.
2. Start only after the owner gives a direct command for a specific Vorqa task.
3. Begin in read-only mode: inspect and explain, but do not modify files, branches, task boards, pull requests, databases, or external services.
4. Before any mutation, show the task ID, exact files, planned changes, isolated branch or worktree, checks, risks, and actions that will not be taken.
5. Require a fresh message explicitly approving that exact task and confirming that the owner is not currently working on Vorqa.
6. Do not treat `READY`, `APPROVED`, `ok`, `kml`, `continue`, a past approval, or a generic request as permission to change anything.
7. Stop if the owner resumes work, another agent is active, the worktree is dirty, the repository head changed, checks fail, or the scope is uncertain.
8. Never touch the owner's active checkout or unfinished changes.

## Confidentiality: secrets are never accessible

- Never open, read, search inside, copy, modify, print, save, commit, transmit, or expose `.env` files, API keys, access tokens, passwords, private keys, certificates, SSH credentials, service-account files, authentication sessions, cookies, or password-manager data.
- Never run `env`, `printenv`, secret-listing commands, credential dumps, token-inspection commands, or broad content searches that might reveal confidential values.
- Never inspect or change protected Supabase, Vercel, GitHub, OpenAI, payment-provider, cloud, production-database, authentication, or deployment settings.
- Never access, export, alter, or disclose customer records, personal information, billing data, production documents, or confidential business information.
- Normal task approval never includes secret access. If sensitive material is needed, stop immediately and ask the owner to handle that step.
- If a tool unexpectedly reveals confidential information, do not repeat or store it; stop and report the incident without exposing any value.

## Execution workflow

1. After a direct owner command, inspect the relevant files, current branch, existing tests, open pull requests, and task acceptance criteria in read-only mode.
2. Present a bounded implementation plan and wait for fresh task-specific approval.
3. Only if explicitly approved, use a dedicated `agent/<task>-<slug>` feature branch or isolated worktree.
4. Change only the files and actions covered by the owner's approval.
5. Preserve existing architecture, design tokens, route behavior, auth flow, and business logic.
6. Preserve Arabic, French, and English translations for any user-facing change.
7. Run focused checks first, then the appropriate project commands:

```sh
npm test
npm run build
```

Additional relevant commands include `npm run test:ai`, `npm run test:i18n`, and `npm run i18n:audit`.

8. Report the outcome, changed files, checks run, blockers, and the next recommended action in the user's language.

## Safety and approval gates

Do not change anything without fresh owner approval. Even after implementation approval, stop and request a separate explicit approval before:

- merging into `vorqa-current`, `main`, or another shared branch;
- deploying, promoting, or modifying production;
- changing Supabase schema, database migrations, RLS policies, authentication, roles, or permissions;
- changing billing, pricing, subscriptions, paid AI providers, secrets, or credentials;
- deleting project files or data, force-pushing, rewriting Git history, or running destructive commands;
- contacting customers, investors, users, or other external parties.

Never claim tests passed, a feature shipped, or a deployment succeeded unless verified directly.

## Manual-only behavior

- Never start from a task-board status, timer, trigger, or background process.
- Analyze only after the owner asks for an analysis.
- Implement only after the owner approves the exact task and confirms they are not editing the project.
- Request separate explicit approval for remote branch changes, commits, pushes, or pull-request updates unless the owner explicitly included those actions.
- Always request separate approval before merging, deploying, changing a database, changing authentication, or touching another protected system.
- Stop after the approved task; do not automatically select or start the next task.
