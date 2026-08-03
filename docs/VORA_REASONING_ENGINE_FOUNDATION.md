# VORA Reasoning Engine Foundation

Sprint 21D Pass 5 adds the architecture for a provider-independent VORA reasoning planner.

This layer does not execute AI reasoning, call providers, parse documents, generate reports, or make recommendations. It prepares typed reasoning plans from trusted application context, immutable memory snapshots, construction knowledge metadata, document metadata, task intent, and the user's request.

## Purpose

The reasoning engine foundation creates a stable contract for future intelligence features:

- document review
- contract review
- risk review
- planning
- cost review
- quality review
- safety review
- schedule review
- compliance review
- general assistance

## Inputs

`ReasoningRequest` accepts:

- `AiApplicationContext`
- `MemorySnapshot`
- `ConstructionKnowledgeRegistry`
- document descriptors
- document metadata
- task intent
- optional reasoning type
- user request

Trusted application context, memory, construction knowledge, document metadata, and user text remain separate inputs. User text cannot override system-level planning constraints.

## Outputs

`createReasoningPlan()` returns an immutable `ReasoningPlan` with:

- reasoning type
- task intent
- objectives
- ordered steps
- constraints
- evidence placeholders
- warnings
- confidence placeholder
- result placeholder

The result is always marked as `not_executed` because this pass is architecture only.

## Planning Flow

```text
ReasoningRequest
  -> validateReasoningRequest()
  -> infer reasoning type
  -> rankReasoningObjectives()
  -> buildReasoningSteps()
  -> build evidence placeholders
  -> immutable ReasoningPlan
```

## Constraints

Every generated plan carries explicit constraints:

- no AI execution
- no document parsing
- no external lookup
- read-only context
- preserve user request
- respect permissions
- context isolation

## Evidence Placeholder Model

Evidence objects describe where future reasoning may attach source support. They can point to:

- application context
- memory
- construction knowledge
- document metadata
- user request

No real evidence extraction is performed.

## Future Extension Points

Future passes can add:

- execution against the prompt builder
- document intelligence summaries
- source-backed evidence extraction
- confidence scoring
- recommendation generation
- report generation
- safety and compliance reasoning
- provider-backed reasoning orchestration

## Deferred Work

The following are intentionally not implemented:

- OpenAI, Gemini, Anthropic, or other provider calls
- prompt generation
- OCR
- real document parsing
- embeddings
- vector search
- agents
- reports
- recommendations
- UI or API integration
