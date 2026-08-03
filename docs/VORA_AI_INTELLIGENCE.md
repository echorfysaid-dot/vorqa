# VORA AI Production Intelligence

Sprint 16.6 upgrades VORA from a simple generator prompt into a project intelligence engine while preserving the existing OpenAI integration, mock fallback, repositories, authentication, and storage flows.

## Context Engine

File: `lib/ai-context-repository.ts`

The context engine builds project intelligence through repositories only:

- Organization
- Project
- Project members
- Departments
- Employees
- Tasks
- Timeline
- Milestones
- Budget and budget stats
- Documents
- Knowledge articles
- Saved AI memory

Methods:

- `buildProjectContext(projectId)`
- `buildOrganizationContext(organizationId)`
- `buildTaskContext(taskId)`
- `buildBudgetContext(projectId)`
- `buildKnowledgeContext(projectId)`

The same demo / Supabase / auto modes are preserved because each context section delegates to the existing repositories.

## Prompt Composer

File: `lib/vora-prompt-composer.ts`

The prompt composer creates a reusable VORA prompt snapshot with:

- system instructions
- user input
- unified context summary
- inferred prompt type

Supported prompt types:

- Project Summary
- Task Review
- Budget Analysis
- Timeline Analysis
- Risk Analysis
- Document Summary
- Knowledge Search
- Meeting Preparation
- Daily Report
- Weekly Report
- Executive Summary

## AI Skills

File: `lib/vora-ai-skills.ts`

Reusable skill descriptors:

- Project Health Review
- Budget Review
- Timeline Review
- Risk Detection
- Missing Documents
- Delayed Tasks
- Upcoming Milestones
- Knowledge Suggestions
- Safety Recommendations
- Productivity Suggestions

These are UI and prompt primitives. They do not hardcode final AI responses.

## Generation Route

`/api/generate` keeps the existing authentication and persistence flow, but builds VORA context through `aiContextRepository` before calling `generateAiOutput`.

The route continues to:

- verify the authenticated Supabase user
- validate payloads
- use OpenAI Responses API when `OPENAI_API_KEY` is available
- fall back to mock mode when needed
- save output to `generation_history`
- save output to `documents`

## AI Memory

No schema change was introduced in this sprint.

Generation metadata now includes future-ready memory fields inside the existing metadata payload:

- `conversation_title`
- `organization_reference`
- `project_reference`
- `prompt_type`
- `saved`
- `favorite`
- `timestamp`

The existing `generation_history` row remains the source of truth for output persistence.

## Workspace Experience

The existing Project Workspace VORA AI tab now shows:

- project chat
- quick prompts
- selected prompt state
- context indicators for tasks, timeline, budget, documents, and knowledge
- conversation memory search
- referenced modules
- copy response action
- loading-aware context counts

No OpenAI UI flow or backend contract was changed.

## Current Limits

- VORA context is bounded to lightweight repository summaries.
- No autonomous tool execution is implemented.
- No schema migration is required for memory fields yet.
- Real saved/favorite conversation controls can be normalized once `generation_history` receives dedicated columns.
- Supabase mode depends on the prior production foundation migrations being applied.
