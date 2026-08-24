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
- If available, use the `$vorqa-ai-maintainer` skill for Vorqa AI development work.
- For autonomous work, read `docs/VORQA_AGENT_TASKS.md` and choose only one task marked `READY`.

## Product priorities

Prioritize a complete, trustworthy owner journey over unrelated feature expansion:

1. Capture the project idea, project needs, land context, and budget.
2. Recommend architects or engineers who are already registered within Vorqa.
3. Keep professional matching, communication, progress visibility, and follow-up within the platform.
4. Track preliminary concepts, architectural plans, supporting documents, permits, and administrative requirements.
5. Connect approved pre-construction readiness to contractor selection and construction execution.
6. Give each role a clear next action and ground VORA guidance in actual project data.

## Execution workflow

1. Inspect the relevant files, current branch, existing tests, open pull requests, and task acceptance criteria.
2. Work on a dedicated `agent/<task>-<slug>` feature branch or isolated worktree.
3. Implement the smallest coherent change required by one approved task.
4. Preserve existing architecture, design tokens, route behavior, auth flow, and business logic.
5. Preserve Arabic, French, and English translations for any user-facing change.
6. Run focused checks first, then the appropriate project commands:

```sh
npm test
npm run build
```

Additional relevant commands include `npm run test:ai`, `npm run test:i18n`, and `npm run i18n:audit`.

7. Report the outcome, changed files, checks run, blockers, and the next recommended action in the user's language.

## Safety and approval gates

Always stop and request explicit user approval before:

- merging into `vorqa-current`, `main`, or another shared branch;
- deploying, promoting, or modifying production;
- changing Supabase schema, database migrations, RLS policies, authentication, roles, or permissions;
- changing billing, pricing, subscriptions, paid AI providers, secrets, or credentials;
- deleting project files or data, force-pushing, rewriting Git history, or running destructive commands;
- contacting customers, investors, users, or other external parties.

Never claim tests passed, a feature shipped, or a deployment succeeded unless verified directly.

## Autonomous-run behavior

- If a `READY` task exists, handle only the highest-priority ready task.
- If a matching pull request already exists, continue or report on it instead of duplicating work.
- If no `READY` task exists, perform a read-only health review and propose one next task.
- Ask for clarification if acceptance criteria or product behavior are ambiguous.
- Do not modify production systems or merge without explicit approval.
