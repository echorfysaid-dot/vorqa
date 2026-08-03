# VORA BOQ Review

Sprint 23 Feature 2 adds the first production-facing BOQ Review feature on top of the activated VORA Intelligence Runtime.

## Scope

BOQ Review accepts a Bill of Quantities or cost schedule, performs deterministic structure checks, and then routes the structured context through the existing VORA runtime with `taskIntent: cost_review`.

It does not verify market prices, certify quantities, provide financial certification, or invent missing BOQ values.

## Supported Formats

Readable now:

- CSV
- TSV
- plain text
- Markdown table

Accepted as explicit placeholders:

- XLS
- XLSX
- PDF
- DOCX

Placeholder formats are never silently parsed. The response includes warnings that extraction is not available yet.

## Flow

```text
Upload or paste BOQ
  -> Document validation
  -> Safe readable extraction when available
  -> Deterministic BOQ parsing
  -> Header normalization
  -> Line item normalization
  -> Structural checks
  -> taskIntent: cost_review
  -> VORA Intelligence Runtime
  -> Reasoning
  -> Decision
  -> Report
  -> Recommendation
  -> Prompt Builder
  -> AI Orchestrator
  -> Mock or OpenAI provider
  -> Normalized BOQ Review response
```

## Deterministic Parser Behavior

`lib/vora-boq-review.ts` parses rows without AI. It supports common English and French headers such as:

- reference
- article
- description
- designation
- poste
- quantity
- quantité
- unit
- unité
- rate
- prix unitaire
- amount
- montant
- total
- section
- lot
- chapitre

The parser handles comma, tab, semicolon, and pipe delimiters, plus Markdown tables.

## Structural Checks

The deterministic layer flags possible issues:

- missing description
- missing quantity
- missing unit
- missing rate
- missing amount
- zero or negative quantity
- zero or negative rate
- zero or negative amount
- quantity x rate mismatch
- duplicate reference
- duplicate description
- inconsistent units for repeated descriptions
- uncategorized items
- unrecognized columns

Findings are described as possible issues or items requiring review.

## Runtime Integration

The feature calls `executeVoraIntelligence()` through `executeBoqReview()`.

Mapping:

- VORA task intent: `cost_review`
- Reasoning type: `cost_review`
- Report type: `cost_report`
- Document category: `boq`

The runtime receives document metadata, detected columns, section count, item count, deterministic validation issues, duplicate candidates, arithmetic checks, missing fields, warnings, and a bounded BOQ preview.

## API Contract

`/api/generate` accepts:

```json
{
  "mode": "vora_intelligence",
  "taskIntent": "cost_review",
  "userRequest": "Review this BOQ",
  "provider": "mock",
  "projectId": "PRJ-1048",
  "boqDocument": {
    "name": "boq.csv",
    "mimeType": "text/csv",
    "sizeBytes": 1234,
    "text": "Ref,Description,Quantity,Unit,Rate,Amount...",
    "delimiter": ","
  }
}
```

Legacy generation and Contract Review remain supported.

## UI Behavior

`/tools/boq-review` provides:

- file upload
- paste text option
- safe preview truncation
- loading and error states
- placeholder format warning
- provider/mock indicator
- structured output cards
- deterministic issue display

Large BOQ content is bounded before entering the API and runtime.

## Mock and OpenAI

Mock execution remains deterministic and local.

OpenAI execution uses the existing provider adapter path when `OPENAI_API_KEY` is available and explicitly permitted by runtime availability.

## Security Boundaries

- User BOQ text remains untrusted input.
- System rules are inserted before BOQ preview text.
- API input text is sanitized and length bounded.
- Raw provider payloads, secrets, stack traces, and headers are not exposed.

## Known Limitations

- No real XLS/XLSX parsing yet.
- No PDF or DOCX extraction yet.
- No OCR.
- No market-price validation.
- No quantity-surveying or financial certification.
- No persistent BOQ storage.

## Future Improvements

- Add server-side XLS/XLSX parsing.
- Add PDF table extraction.
- Add stronger numeric locale handling.
- Add section hierarchy detection.
- Add BOQ-to-budget comparison when project budgets are available.
- Add exportable review report.
