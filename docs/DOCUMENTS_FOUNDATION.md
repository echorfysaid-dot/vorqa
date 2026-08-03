# Documents and Storage Production Foundation

Sprint 16.4 adds the production-ready project document management foundation without creating storage buckets automatically and without changing authentication, OpenAI, marketplace, RFQ, contracts, or existing business logic.

## Storage Architecture

Expected Supabase Storage bucket:

- `vorqa-project-documents`

The application does not create this bucket automatically.

Recommended bucket configuration:

- Private bucket
- Authenticated upload/download/delete through Supabase Storage policies
- Path format: `organization_id/project_id/object-id-filename`
- Maximum file size should be configured according to the production plan

The frontend repository uses the authenticated Supabase access token and the public anon key only. No service-role key is exposed to the client.

## Database Migration

Migration:

- `database/migrations/20260718_documents_foundation.sql`

The migration extends the existing `documents` table with project file metadata:

- `organization_id`
- `department_id`
- `uploader_id`
- `category`
- `version`
- `filename`
- `storage_path`
- `file_size`
- `mime_type`
- `tags`
- `archived`
- `metadata`

Existing generated documents remain compatible because the migration is additive.

## Repository Architecture

Files:

- `lib/repositories/documentRepository.ts`
- `lib/repositories/documentDemoAdapter.ts`
- `lib/repositories/documentSupabaseAdapter.ts`
- `lib/repositories/documentMapper.ts`
- `lib/repositories/documentHooks.ts`

Methods:

- `getDocuments(projectId)`
- `getDocument(documentId)`
- `uploadDocument(input)`
- `updateDocument(documentId, input)`
- `archiveDocument(documentId)`
- `deleteDocument(documentId)`
- `downloadDocument(document)`

The repository preserves demo, Supabase, and auto modes. Project pages use the repository/hook layer only and do not call Supabase directly.

## Demo Documents

Demo mode generates realistic construction files:

- Architectural Drawings
- Structural Drawings
- BOQ
- Specifications
- Contracts
- Permits
- Inspection Reports
- Invoices
- Safety Documents
- QA Reports

## Upload Flow

1. User selects or drops one or more files.
2. Repository uploads each file to `vorqa-project-documents`.
3. Repository inserts metadata into `documents`.
4. If metadata insertion fails after upload, the adapter attempts to remove the uploaded object.
5. UI updates local project document state.

## Preview Support

Supported direct preview:

- PDF
- images
- text/markdown

Office files and unknown types fall back to download.

## RLS Strategy

The migration adds organization-aware document policies:

- owners keep access through `owner_id`
- organization members can read organization documents
- owners and members with `manage_organization` can manage organization documents
- anonymous users have no access

Storage policies must be configured in Supabase for the `vorqa-project-documents` bucket before real uploads work.

## Project Workspace UI

The Documents tab now includes:

- grid view
- table view
- search
- category filter
- uploader filter
- tag filter
- sort
- drag and drop upload
- multiple upload
- upload progress state
- retry/cancel UI
- metadata editing
- preview
- download
- soft archive
- permanent delete through repository
- VORA document insights
- loading, empty, and error states

## Remaining Dependencies

- Create the `vorqa-project-documents` bucket manually.
- Configure Supabase Storage policies for authenticated project document access.
- Add malware scanning and file-size governance before public production.
- Add signed URL previews if private Storage policy requires them.
