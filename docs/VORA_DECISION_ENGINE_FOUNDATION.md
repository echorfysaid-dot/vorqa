# VORA Decision Engine Foundation

Sprint 21D Pass 6 adds the architecture for a deterministic VORA decision planner.

This layer converts a `ReasoningPlan` into a structured `DecisionPlan`. It does not generate answers, call AI providers, parse documents, create reports, produce recommendations, access APIs, or modify UI state.

## Architecture Position

```text
Reasoning
  -> Decision
  -> Future Report Generator
  -> Future Recommendation Engine
```

The decision layer sits after the reasoning planner and before future output-producing systems. Its job is to decide which future action path is appropriate and what evidence or missing information must be resolved first.

## Inputs

`DecisionRequest` accepts:

- `ReasoningPlan`
- optional `ConstructionKnowledgeRegistry`
- optional document metadata
- optional `AiApplicationContext`
- optional `MemorySnapshot`

Inputs remain read-only. The engine never mutates context, memory, construction knowledge, document metadata, or reasoning plans.

## Outputs

`createDecisionPlan()` returns an immutable `DecisionPlan` containing:

- decision type
- priority
- confidence placeholder
- ranked actions
- requirements
- warnings
- evidence placeholders
- missing information
- escalation flag
- outcome placeholder

The outcome is always marked as `not_executed`.

## Decision Types

Supported decision types:

- document review
- contract review
- planning
- risk analysis
- quality review
- safety review
- schedule review
- cost review
- compliance review
- general assistance

## Decision Actions

Supported action types:

- review document
- request information
- highlight risks
- verify contract
- generate summary
- prepare report
- identify missing data
- validate schedule
- escalate issue
- no action

Actions are ranked deterministically from the decision type, missing requirements, evidence availability, and priority.

## Priority Model

`calculateDecisionPriority()` uses deterministic signals:

- decision type
- missing required inputs
- warning severity
- unavailable evidence

Safety and risk decisions are escalated to urgent by default. Contract and compliance decisions default to high priority when context is incomplete.

## Confidence Model

`calculateDecisionConfidence()` produces a placeholder confidence score from:

- required requirement completion
- evidence availability
- warning penalty

This is not AI confidence and does not represent semantic correctness. It is a readiness score for future execution.

## Validation

`validateDecisionPlan()` checks:

- actions exist
- required inputs are satisfied
- evidence placeholders exist
- confidence placeholder is not too low

Validation returns warnings only. It does not throw, execute, or mutate.

## Future Extension Points

Future passes can connect this layer to:

- report generation
- recommendation generation
- approval workflows
- escalation workflows
- provider-backed reasoning execution
- source-backed evidence extraction
- task/action creation

## Deferred Work

The following are intentionally not implemented:

- reports
- recommendations
- LLM execution
- embeddings
- OCR
- vector search
- streaming
- agents
- UI integration
- API integration
