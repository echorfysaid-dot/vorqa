# Document Intelligence Foundation

Sprint 21D Pass 2 adds a provider-independent document intelligence architecture.

This pass does not parse files, call AI providers, run OCR, create embeddings, or connect to a vector database.

## Pipeline

```text
Document
↓
Validation
↓
Metadata Extraction
↓
Normalization
↓
Section Detection
↓
Chunk Builder
↓
Extraction Placeholder
↓
Future AI Analysis
```

## Supported Document Types

- PDF
- DOCX
- TXT
- Markdown
- CSV
- Spreadsheet placeholder
- Image placeholder
- CAD placeholder
- BIM placeholder
- Construction Specification
- Contract
- Report
- Drawing
- Meeting Minutes

## Core Models

The foundation lives in:

```text
lib/document-intelligence.ts
```

It defines:

- `DocumentType`
- `DocumentDescriptor`
- `DocumentMetadata`
- `DocumentContent`
- `DocumentSection`
- `DocumentChunk`
- `DocumentValidationResult`
- `DocumentParser`
- `DocumentPipeline`
- `DocumentExtractionResult`
- `DocumentError`
- `DocumentLanguage`
- `DocumentSource`
- `DocumentStatistics`
- `DocumentCapability`

## Validation Model

Validation is normalized and parser-independent. Current checks include:

- Supported type.
- Empty or missing content when content is required.
- Invalid metadata.
- Oversized document.
- Unsupported parser placeholder.
- Future corruption placeholder.

## Chunking Model

Chunk models support future strategies:

- `fixed`
- `semantic`
- `page`
- `section`
- `heading`

Only deterministic placeholder chunk construction is implemented. No semantic chunking or AI analysis runs in this pass.

## Metadata Model

Metadata supports:

- Title
- Author
- Language
- Page count
- Word count
- Creation date
- Modification date
- MIME type
- Size
- Checksum placeholder
- Source name
- Tags
- Category

## Parser Contracts

`DocumentParser` is an interface for future parser implementations. It does not currently read real files.

Future parser adapters can be added for PDF, DOCX, spreadsheets, images, CAD, and BIM without changing the AI prompt builder or provider orchestration layers.

## Parser Adapter Layer

Sprint 21D Pass 3 adds:

```text
lib/document-parser-adapters.ts
```

The parser adapter layer provides:

- `DocumentParserAdapter`
- `documentParserRegistry`
- `selectDocumentParser()`
- `validateParserForDocument()`
- `parseDocumentWithAdapter()`
- `NormalizedParserResult`
- `DocumentParserError`

Current adapters are deterministic placeholders only:

- PDF
- DOCX
- TXT
- Markdown
- CSV
- Spreadsheet
- Image
- CAD
- BIM

The registry is the single source of truth for parser metadata, supported document types, MIME types, extensions, capabilities, and placeholder status.

No adapter reads file bytes. No adapter performs OCR, real parsing, AI analysis, embeddings, or vector search.

## Deferred Work

- Real PDF/DOCX parsing.
- OCR.
- Spreadsheet extraction.
- CAD/BIM parsing.
- AI extraction.
- Embeddings.
- Vector search.
- RAG.
- Document summaries.
- UI integration.
- API integration.
