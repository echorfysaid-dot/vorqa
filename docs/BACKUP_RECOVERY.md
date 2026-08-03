# VORQA Backup and Recovery

## Database Backup Cadence

Staging:

- backup before migration tests
- daily during active beta validation

Production beta:

- daily automated backups
- point-in-time recovery when available
- manual backup before major migration batches

## Storage Backup

Storage buckets:

- `knowledge`
- `vorqa-project-documents`

Recommendations:

- inventory objects weekly
- export metadata before policy changes
- test restore of at least one PDF, one image, and one office document
- keep bucket policies versioned in `database/storage`

## Recovery Testing

Monthly during beta:

1. Restore database backup to staging.
2. Restore representative storage objects.
3. Verify login.
4. Verify organization/project access.
5. Verify document download.
6. Verify knowledge listing.
7. Verify AI history remains readable.

## Disaster Recovery Checklist

- identify incident scope
- freeze risky writes
- preserve logs
- validate backup timestamp
- restore to staging
- verify data integrity
- restore production if approved
- communicate status to beta users
- write post-incident report

## Recovery Ownership

Assign:

- database recovery owner
- storage recovery owner
- application deployment owner
- customer communications owner
