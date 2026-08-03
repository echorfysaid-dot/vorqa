# Vorqa AI MVP Production Readiness

## Current MVP Architecture

The Construction Intelligence MVP uses the existing Vorqa architecture:

- Next.js App Router UI pages under `/tools/*`
- Existing `/api/generate` route
- VORA Intelligence Runtime
- Prompt Builder
- Reasoning Engine
- Decision Engine
- Report Engine
- Recommendation Engine
- Existing mock/OpenAI provider execution
- Project Intelligence session model
- Guided Analysis Workflow

No new runtime, provider, authentication flow, database schema, OCR, embeddings, vector search, or prediction engine is part of the MVP hardening pass.

## Six-Stage Workflow

The canonical workflow is:

1. Contract Review
2. BOQ Review
3. Risk Assessment
4. Planning Review
5. Site Report Review
6. Executive Summary

The workflow is centralized in `lib/analysis-hardening.ts` and consumed by Project Intelligence and the guided workflow tests.

## Supported Inputs

Readable formats vary by tool, but the MVP generally supports:

- TXT
- Markdown
- CSV / TSV where tabular data is expected
- Pasted user text
- Existing structured analysis outputs
- Project Intelligence session metadata

## Placeholder-Only Formats

The following are intentionally treated as placeholder-only until real parsing is connected:

- PDF
- DOCX
- Spreadsheet files where no parser exists
- CAD
- BIM
- Images

The product must never pretend these formats were parsed. If the body text is unavailable, VORA must say the result is based on metadata and supplied notes only.

## Runtime Safety Rules

VORA must:

- Use supplied evidence only.
- Never invent contract clauses.
- Never invent BOQ rows, rates, or quantities.
- Never invent risks, accidents, delays, or site observations.
- Never expose API keys, tokens, stack traces, environment values, or raw provider payloads.
- Return safe normalized errors when execution fails.

## Error Response Model

The API keeps backward compatibility while adding a normalized safe error shape.

```json
{
  "ok": false,
  "error": "Legacy message for existing clients",
  "code": "ERROR_CODE",
  "errors": [{ "code": "ERROR_CODE", "message": "Safe message" }],
  "safeError": {
    "code": "ERROR_CODE",
    "message": "Safe message",
    "retryable": false
  }
}
```

Retryable errors are limited to temporary or server-side classes such as `429` and `5xx`.

## Project Health Model

Supported values:

- Healthy
- Needs Review
- Attention Required
- High Risk

Health is derived from completed analyses only. Missing evidence should lower confidence or create a review need, not invent project status.

## Confidence Model

Confidence must:

- Be derived from existing analysis confidence where present.
- Display "Limited evidence" when confidence is unavailable.
- Avoid fabricating precision.
- Treat low evidence count as limited, even when a numeric value exists.

## Print And Export Readiness

The MVP includes print-friendly report scaffolding:

- `.analysis-report` printable report area
- `.print-only` metadata support
- Interactive UI hidden during print
- Page-break-friendly sections
- Normalized export-ready report shape in `createExportReadyReport`

PDF, DOCX, Excel, and automated exports are not implemented yet.

## Known Limitations

- No OCR.
- No embeddings.
- No vector search.
- No real PDF/DOCX extraction.
- No schedule optimization.
- No prediction engine.
- No background jobs.
- No persisted Executive Summary output yet.
- Demo Project Intelligence data is still used where production repositories do not provide completed analysis evidence.

## Real-User Testing Checklist

Use controlled sample documents. Do not fabricate expected production results.

- Complete contract: verify summary, risks, missing information, and legal caveat behavior.
- Incomplete contract: verify missing parties, dates, attachments, and scope gaps are clear.
- Clean BOQ: verify structural completeness and no invented cost issues.
- BOQ with duplicates and missing rates: verify deterministic row flags.
- Risk notes: verify risk assessment only uses supplied evidence.
- Incomplete planning document: verify missing milestones, owners, dependencies, and phases.
- Site report with safety observations: verify safety is flagged without claiming an accident.
- Site report with missing responsible persons: verify follow-up and responsible-person gaps.
- Executive Summary with full coverage: verify six of six coverage and 100% workflow completion.
- Executive Summary with partial coverage: verify missing analyses and limited evidence warnings.
- Unsupported PDF/DOCX behavior: verify placeholder-only messaging.
- Provider failure: verify safe retryable error message and no secret leakage.
- Empty input: verify friendly validation message.
- Mobile usage: verify upload, paste, submit, reset, and print controls do not overflow.
- RTL usage: verify Arabic text wraps naturally and tables remain readable.

## Pre-Beta Checklist

- Run `npm.cmd run test:ai`.
- Run `npm.cmd run build`.
- Test all six `/tools/*` analysis routes.
- Test `/tools/construction-intelligence`.
- Test `/projects/PRJ-1048/intelligence`.
- Confirm API errors include `safeError` and legacy fields.
- Confirm print mode shows only the report content.
- Confirm no unsupported file type is described as parsed.
