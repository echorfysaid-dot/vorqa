# VORA Smart Report Engine Foundation

Sprint 21D Pass 7 adds the deterministic architecture for planning VORA reports.

This layer does not write final report prose, call LLMs, generate prompts, parse documents, create PDFs or DOCX files, connect to APIs, or render UI. It converts structured reasoning and decision outputs into an immutable `ReportPlan`.

## Architecture Position

```text
ReasoningPlan
  -> DecisionPlan
  -> Report Type Resolution
  -> Section Planning
  -> Evidence Mapping
  -> Warning and Missing-Data Mapping
  -> Approval Requirements
  -> Immutable ReportPlan
  -> Future Report Renderer / AI Writer
```

## Inputs

`ReportRequest` supports:

- `ReasoningPlan`
- `DecisionPlan`
- `AiApplicationContext`
- `MemorySnapshot`
- `ConstructionKnowledgeRegistry`
- document metadata
- optional report preferences

Inputs are treated as read-only. The report engine consumes reasoning and decision outputs instead of recreating their logic.

## Output Models

The main output is `ReportPlan`, which includes:

- report type
- title
- normalized output preferences
- planned sections
- findings placeholders
- evidence references
- warnings
- missing information
- approval requirements
- structural completeness
- validation result
- result placeholder

The `ReportResultPlaceholder` is always marked as `not_rendered`.

## Supported Report Types

- document review report
- contract review report
- risk report
- planning report
- cost report
- quality report
- safety report
- schedule report
- compliance report
- site report
- meeting report
- executive summary
- general report

## Section Planning

Sections are planned from report type, decision actions, missing information, evidence preferences, and appendix preferences.

Supported section types include:

- title
- executive summary
- project context
- document context
- scope
- findings
- risks
- issues
- missing information
- evidence
- actions
- schedule
- cost
- quality
- safety
- compliance
- approvals
- conclusion
- appendices

Sections contain placeholders and references only. No prose is generated.

## Findings and Evidence

`ReportFinding` uses canonical construction classifications where possible:

- severity from `ConstructionRiskSeverity`
- priority from `ConstructionPriority`
- status from `ConstructionStatus`
- document categories from `ConstructionDocumentCategory`
- related entities from `ConstructionEntityType`

Evidence references are mapped from reasoning evidence, decision evidence, and document metadata. They are source pointers, not extracted factual claims.

## Completeness Model

`calculateReportCompleteness()` calculates structural readiness from:

- required sections
- evidence availability
- missing information
- unresolved warnings
- approval requirements
- decision confidence placeholders

This score is structural completeness only. It does not claim semantic correctness or factual accuracy.

## Validation

`validateReportRequest()` and `validateReportPlan()` return normalized errors and warnings for:

- invalid request
- missing reasoning plan
- missing decision plan
- unsupported report type
- missing required section
- missing required evidence
- invalid reference
- incomplete report plan
- permission restriction
- unknown error

No stack traces, secrets, provider payloads, or internal runtime details are exposed.

## Future Extension Points

Future passes can connect this foundation to:

- report renderers
- AI writing
- source-backed evidence extraction
- recommendation engines
- approval workflows
- PDF and DOCX exporters
- API persistence
- UI report previews

## Deferred Work

The following are intentionally not implemented:

- final natural-language reports
- LLM calls
- prompt generation
- provider execution
- recommendations
- agents
- document parsing
- OCR
- embeddings
- vector search
- database persistence
- API integration
- UI integration
- real PDF or DOCX generation
