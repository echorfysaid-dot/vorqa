# VORA Intelligence Runtime Foundation

Sprint 22A Pass 1 adds the architecture for the Unified VORA Intelligence Runtime.

This runtime connects the existing intelligence foundations into a single deterministic pipeline. The architecture-only path does not execute AI, call providers, generate prompts, render reports, create recommendations, parse documents, persist data, call APIs, or connect to UI.

Sprint 22A Pass 1 created the architecture-only runtime. Sprint 22B Pass 1 adds the first activated runtime entrypoint, `executeVoraRuntime()`, which reuses the same pipeline and then routes through the existing Prompt Builder, AI Orchestrator, provider adapter registry, and normalized response contract.

## Pipeline

```text
User Request
  -> AI Context
  -> Memory
  -> Document Intelligence
  -> Parser Selection
  -> Construction Knowledge
  -> Reasoning
  -> Decision
  -> Report Planning
  -> Recommendation Planning
  -> Prompt Builder
  -> AI Orchestrator
  -> Existing Provider Adapter
  -> Normalized AI Response
  -> Runtime Result Placeholder
```

## Reused Foundations

The runtime orchestrates existing modules only:

- AI Context Engine
- AI Memory Service
- Prompt Builder foundation, as an existing upstream layer for future integration
- Execution Policy and AI Orchestrator foundations, as existing downstream execution architecture
- Document Intelligence Foundation
- Document Parser Layer
- Construction Knowledge Layer
- VORA Reasoning Engine
- VORA Decision Engine
- VORA Report Engine

It does not duplicate registries or recreate reasoning, decision, report, document, parser, or construction taxonomy logic.

## Runtime Models

`lib/vora-intelligence-runtime.ts` defines:

- `VoraRuntimeRequest`
- `VoraRuntimeContext`
- `VoraRuntimeStage`
- `VoraRuntimePipeline`
- `VoraRuntimeResultPlaceholder`
- `VoraRuntimeValidationResult`
- `VoraRuntimeError`
- `VoraRuntimeMetrics`

## Runtime Stages

Supported explicit stages:

- context
- memory
- document
- parser
- knowledge
- reasoning
- decision
- report
- recommendation
- prompt
- orchestrator
- provider
- response
- completed
- failed

Optional document and parser stages can be skipped when no document metadata or descriptors are supplied. Required stages fail validation when their required inputs are missing.

## Helpers

The runtime exposes pure deterministic helpers:

- `createRuntimePipeline()`
- `validateRuntimeRequest()`
- `executeRuntimePipeline()`
- `executeVoraRuntime()`
- `collectRuntimeMetrics()`
- `validateRuntimePipeline()`
- `getRuntimeStages()`
- `resolveRuntimeContext()`

## Metrics

`VoraRuntimeMetrics` is immutable and includes placeholders for:

- execution duration, always `null`
- completed stages
- failed stages
- warning count
- decision confidence score
- report completeness score
- pipeline completeness

No real profiling or timing is performed.

## Error Model

Normalized runtime error codes:

- `invalid_request`
- `missing_context`
- `missing_memory`
- `missing_reasoning`
- `missing_decision`
- `missing_report_plan`
- `provider_unavailable`
- `provider_execution_failed`
- `pipeline_failure`
- `validation_failure`
- `unknown_runtime_error`

Errors are structural and do not expose stack traces, secrets, provider payloads, or internal API details.

## Runtime Output

`executeRuntimePipeline()` returns:

- runtime pipeline
- resolved runtime context
- reasoning plan
- decision plan
- report plan
- metrics
- validation result
- result placeholder

The result is always `not_executed` with `architecture_only`.

`executeVoraRuntime()` returns the activated execution result and may additionally include:

- `recommendationPlan`
- `promptPayload`
- `aiExecutionPlan`
- `aiResponse`
- execution status
- execution metadata

The activated path does not create a second orchestrator. It calls the existing `createAiPromptPayload()` and `createAiExecutionPlan()` functions, then uses the selected provider adapter to normalize the response.

## Provider Execution

The runtime supports the existing mock provider locally and the existing OpenAI Responses API provider when `OPENAI_API_KEY` is available. Provider availability must be supplied explicitly by the caller. If a provider is unavailable or fails during execution, the runtime fails safely with a normalized runtime error.

Provider responses are normalized through the provider adapter registry before leaving the runtime. Raw SDK payloads, headers, secrets, stack traces, and provider-specific internals are not exposed.

## Future Extensions

Future passes can connect this runtime to:

- report renderer
- source-backed document intelligence
- persistence
- UI status display
- streaming orchestration

## Deferred Work

The following are intentionally not implemented:

- report rendering
- agents
- streaming
- OCR
- embeddings
- vector search
- persistence
- API integration
- UI integration
