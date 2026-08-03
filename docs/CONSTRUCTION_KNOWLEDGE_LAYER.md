# Construction Knowledge Layer

Sprint 21D Pass 4 adds a typed construction knowledge foundation.

This layer is architecture only. It does not perform AI reasoning, recommendations, OCR, parsing, embeddings, vector search, or API/UI integration.

## Purpose

The construction knowledge layer provides canonical metadata for future:

- Document Intelligence
- VORA reasoning
- AI reports
- Recommendations
- Construction search and classification

## Location

```text
lib/construction-knowledge.ts
```

## Entity Models

The registry describes construction concepts such as:

- Project
- Building
- Site
- Zone
- Level
- Room
- Discipline
- Trade
- Activity
- Task
- Milestone
- Material
- Equipment
- Resource
- Risk
- Issue
- Observation
- Inspection
- Quality Control
- Safety
- Contract
- BOQ
- Specification
- Drawing
- Meeting
- Report
- Change Order
- Variation
- Payment
- Invoice
- Cost Item
- Schedule
- Permit
- Regulation
- Stakeholder

## Classifications

The registry includes:

- Construction document categories
- Construction phases
- Project lifecycle stages
- Discipline taxonomy
- Risk severity
- Priority
- Status
- Approval states

## Relationships

Relationship metadata describes how construction entities connect, for example:

- Project contains buildings.
- Building contains levels.
- Level contains rooms.
- BOQ contains cost items.
- Risk can impact issue.
- Permit requires regulation approval.
- Inspection documents quality control.

## Helpers

Pure deterministic helpers include:

- `getConstructionEntity()`
- `getConstructionPhase()`
- `getConstructionDocumentCategory()`
- `getEntitiesForDocument()`
- `getDocumentCategoriesForEntity()`
- `getRelationshipsForEntity()`
- `validateConstructionEntity()`
- `validateConstructionDocumentCategory()`
- `inferConstructionDocumentCategories()`

## Deferred Work

- AI reasoning
- Recommendations
- Reports
- Embeddings
- Vector search
- OCR
- UI integration
- API integration
- Runtime document classification
