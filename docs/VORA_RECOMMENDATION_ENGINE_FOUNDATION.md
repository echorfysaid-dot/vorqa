# VORA Recommendation Engine Foundation

Sprint 22A Pass 2 adds the deterministic architecture for VORA recommendation planning.

This layer converts `DecisionPlan` outputs into immutable `RecommendationPlan` structures. It does not execute AI, generate natural-language recommendation prose, generate prompts, call providers, persist data, connect to APIs, or render UI.

## Architecture Position

```text
ReasoningPlan
  -> DecisionPlan
  -> RecommendationPlan
  -> Future Recommendation Renderer / Workflow Engine
```

The recommendation engine consumes existing reasoning, decision, report, runtime, and construction knowledge outputs. It does not recreate decision logic or duplicate construction registries.

## Inputs

`RecommendationRequest` supports:

- `DecisionPlan`
- optional `ReasoningPlan`
- optional `ConstructionKnowledgeRegistry`
- optional `VoraRuntimeContext`
- optional `ReportPlan`

Inputs are treated as read-only.

## Outputs

`createRecommendationPlan()` returns:

- immutable recommendation plan
- ranked recommendation items
- grouped recommendation references
- validation result
- architecture-only result placeholder

## Recommendation Categories

Supported categories:

- risk mitigation
- cost optimization
- schedule improvement
- quality improvement
- safety improvement
- compliance action
- documentation action
- planning action
- resource action
- general recommendation

## Ranking Model

`rankRecommendations()` sorts recommendation items deterministically by:

- priority weight
- impact score
- stable id ordering

The engine never uses LLM judgment or semantic inference.

## Priority Model

`calculateRecommendationPriority()` uses:

- decision action priority
- decision plan priority
- escalation flags
- missing required dependencies

Urgent decision actions and escalations remain urgent at the recommendation layer.

## Impact Model

`calculateRecommendationImpact()` creates a placeholder impact score from:

- recommendation priority
- category weight
- decision confidence placeholder
- report completeness placeholder

This is a structural planning score, not a real-world prediction.

## Dependencies

Recommendation dependencies can reference:

- decision actions
- decision requirements
- reasoning objectives
- report sections
- runtime context

Missing required dependencies become normalized recommendation warnings.

## Validation

Validation supports:

- invalid request
- missing decision plan
- missing reasoning plan
- missing runtime context
- missing report plan
- missing dependency
- empty recommendation plan
- unknown recommendation error

Validation does not throw, execute actions, or mutate input.

## Future Extension Points

Future passes can connect this foundation to:

- recommendation rendering
- workflow creation
- task/action creation
- report recommendations
- approval workflows
- provider-backed AI recommendations
- persistence and analytics

## Deferred Work

The following are intentionally not implemented:

- natural-language recommendations
- LLM execution
- prompt generation
- agents
- streaming
- OCR
- embeddings
- persistence
- API integration
- UI integration
