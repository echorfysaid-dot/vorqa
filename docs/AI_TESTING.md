# AI Testing Guide

Sprint 21D Pass 1 adds lightweight regression coverage for Vorqa AI's pure AI foundation.

## What Is Covered

- AI application context creation.
- AI memory snapshot creation.
- Prompt payload determinism, section ordering, and truncation.
- Provider and model validation.
- Capability validation.
- Execution policy ranking.
- Execution plan creation.
- Execution option normalization.
- Provider response normalization.

## How To Run

```bash
npm run test:ai
npm run build
```

The test runner is intentionally small. It uses the existing TypeScript dependency and Node's built-in assertion library.

## How To Add Tests

Add focused pure-function cases to:

```text
tests/ai/ai-foundation.test.ts
```

Tests should avoid network calls, UI rendering, Supabase, authentication, provider SDKs, and runtime side effects.

## Not Covered Yet

- `/api/generate` integration behavior.
- OpenAI SDK or REST execution.
- Streaming.
- Retries or failover.
- Conversation history.
- Document intelligence.
- Embeddings or vector search.
- Browser/UI workflows.

Those areas should be covered in future passes with integration tests once the runtime boundaries are ready.
