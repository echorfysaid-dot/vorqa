# VORA Intelligence Activation

Sprint 22B activates the existing VORA intelligence foundations through one executable runtime path. The goal is runtime integration, not a new AI provider system or a new UI workflow.

## Execution Flow

```text
User Request
  -> Runtime Validation
  -> AI Application Context
  -> AI Memory Snapshot
  -> Document Intelligence Placeholder
  -> Parser Selection Placeholder
  -> Construction Knowledge Registry
  -> Reasoning Plan
  -> Decision Plan
  -> Report Plan
  -> Recommendation Plan
  -> Prompt Builder
  -> Execution Policy Resolution
  -> AI Orchestrator
  -> Existing Provider Adapter
  -> Normalized VORA Response
```

## Runtime Entrypoints

- `executeRuntimePipeline()` remains the deterministic architecture-only planner.
- `executeVoraRuntime()` activates the full pipeline and returns runtime artifacts plus a normalized AI response.
- `executeVoraIntelligence()` is the application service used by API/UI integration.
- `executeVoraIntelligenceSafe()` catches failures and returns a normalized failed response.

## Service Layer

`lib/vora-intelligence-service.ts` converts application requests into runtime requests. It maps product-level task intents to canonical AI task intents, reasoning types, and report types.

Supported intents:

- `general_assistance`
- `document_review`
- `contract_review`
- `risk_review`
- `planning`
- `cost_review`
- `quality_review`
- `safety_review`
- `schedule_review`
- `compliance_review`

## Provider Behavior

Provider availability is explicit. The service enables OpenAI only when `OPENAI_API_KEY` is present. Mock execution remains available for demo and local validation.

The provider adapter registry is still the single provider boundary. The activated runtime does not duplicate provider selection, model selection, policy resolution, or response normalization.

## API Integration

`/api/generate` keeps the legacy generation contract intact. A new opt-in request mode, `mode: "vora_intelligence"`, routes through the activated runtime.

Legacy tool generation still uses the previous path and saved data format.

## UI Integration

`/tools` now has a minimal VORA intelligence request path using the existing authenticated API request flow. This is not a redesign and does not change the existing tools pages or provider contracts.

## Response Shape

The service returns:

- status
- content
- structured output IDs
- findings
- risks
- decision actions
- recommendations
- missing information
- warnings
- normalized errors
- provider and model metadata
- runtime artifacts for internal inspection

## Safety Boundaries

- User text is separated from trusted application context by the Prompt Builder.
- Provider failures are normalized.
- Secrets and stack traces are not returned.
- Mock fallback is explicit and visible in metadata.
- No OCR, embeddings, vector search, streaming, agents, persistence, or new database behavior is introduced.

## Tests

`npm.cmd run test:ai` covers deterministic context, memory, prompt creation, orchestration policy, provider/model validation, runtime planning, activated mock execution, OpenAI failure normalization, and service-level safe responses.

## Deferred Work

- Real document parsing
- Source-backed document intelligence
- Conversation persistence
- Streaming
- Retry and circuit breaker policy
- Billing-aware routing
- UI status visualization
- Report rendering
- Recommendation prose generation
