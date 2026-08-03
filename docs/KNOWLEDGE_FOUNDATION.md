# Vorqa Knowledge Base Foundation

Sprint 16.5 adds the production foundation for project and organization knowledge articles without changing authentication, OpenAI, marketplace, RFQ, contracts, or existing storage behavior.

## Scope

The Knowledge Base stores structured operational articles such as standards, procedures, checklists, procurement workflows, permit notes, and risk guidance. It complements the existing project document storage and knowledge file upload workspace; it does not parse files, create embeddings, run OCR, or call OpenAI.

## Database

Migration: `database/migrations/20260719_knowledge_foundation.sql`

Table: `public.knowledge_articles`

Key fields:

- `organization_id`: required tenant boundary.
- `project_id`: optional project relationship.
- `document_id`: optional link to a stored project document.
- `title`, `summary`, `content`: article body.
- `category`, `tags`: discovery metadata.
- `status`: `draft`, `published`, or `archived`.
- `metadata`: future-safe JSON for views, linked modules, review state, or production metrics.
- `created_by`: optional profile relationship.

## RLS

Read access is available to authenticated members of the organization. Write access is limited to organization owners or members with `manage_organization`.

Anonymous users have no policies and therefore no access.

## Repository Flow

The frontend follows the existing architecture:

`UI -> knowledgeRepository -> demo/supabase adapter -> mapper -> domain model`

Files:

- `lib/models/knowledge.ts`
- `lib/repositories/knowledgeRepository.ts`
- `lib/repositories/knowledgeDemoAdapter.ts`
- `lib/repositories/knowledgeSupabaseAdapter.ts`
- `lib/repositories/knowledgeMapper.ts`
- `lib/repositories/knowledgeHooks.ts`

The repository supports:

- `getKnowledge()`
- `getKnowledgeArticle()`
- `createKnowledge()`
- `updateKnowledge()`
- `archiveKnowledge()`
- `searchKnowledge()`
- `filterKnowledge()`

## Demo Mode

Demo data includes realistic construction knowledge:

- Building standards
- Safety procedures
- Concrete specifications
- Quality control
- Inspection checklist
- Site logistics
- Equipment guide
- Procurement process
- Permit workflow
- Risk management

## Project Workspace

The project Knowledge tab now includes:

- Article dashboard
- Search
- Category, tag, and status filters
- Sorting
- Article cards
- Create and edit form
- Soft archive action
- Related document selection
- VORA knowledge insights using demo-only signals
- Existing knowledge upload workspace preserved for file storage

## Current Limits

- Migration is not applied automatically.
- No embeddings, OCR, RAG, or document parsing.
- Supabase Storage upload remains handled by the existing documents/knowledge file paths.
- Permission denial depends on the target Supabase project having the organization helper functions from prior migrations.
