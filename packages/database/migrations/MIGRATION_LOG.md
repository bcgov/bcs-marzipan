# Migration Log

This log tracks all schema changes made to the database. Each entry should include the date, a description of changes, and references to migration files.

## Format

Each entry should follow this format:

```
### YYYY-MM-DD - Brief Description

**Migration File(s):** `XXXX_description.sql`

**Changes:**
- Description of change 1
- Description of change 2

**Breaking Changes:**
- List any breaking changes that require application updates

**Notes:**
- Additional context or migration instructions
```

---

## 2025-01-XX - Schema Review and Best Practices Updates

**Migration File(s):** `XXXX_schema_review_updates.sql` (to be generated)

**Changes:**

- Added missing foreign key reference: `ministries.parentId` now references `ministries.id` (self-reference)
- Added missing foreign key reference: `organizations.ministryId` now references `ministries.id`
- Added missing foreign key reference: `activities.venueStatusId` now references `venueStatuses.id`
- Added missing relation: `venueStatus` relation in `activitiesRelations`
- Added missing relation: `ministryOwner` relation in `activitiesRelations`
- Standardized audit fields in `organizations` table:
  - Removed `timestamp` field
  - Added `createdDateTime`, `createdBy`, `lastUpdatedDateTime`, `lastUpdatedBy` fields
  - Added foreign key references to `systemUsers` for audit fields
  - Added relations for `createdByUser` and `updatedByUser`

**Breaking Changes:**

- `organizations.timestamp` field removed - applications must use `createdDateTime` or `lastUpdatedDateTime` instead
- Organizations table now requires `createdBy` and `lastUpdatedBy` values (NOT NULL constraints)

**Notes:**

- Existing organizations records will need default values for new audit fields during migration
- Consider backfilling `createdBy` and `lastUpdatedBy` with a system user ID for existing records
- The `organizations.timestamp` field data should be migrated to `createdDateTime` if historical timestamps are important
