# Schema Flow and Type Safety

This document describes the schema flow and type safety architecture in the application, explaining how database schemas flow through to API responses and frontend types.

## Overview

The application uses a layered approach to ensure type safety from the database to the frontend:

```
Database → Drizzle → Zod (auto-generated) → API Response (derived) → DTO (implements) → Frontend
```

## Key Components

### 1. Database Schema (`packages/database/src/schema/`)

- **Purpose**: Defines the database structure using Drizzle ORM
- **Location**: `packages/database/src/schema/activity.ts`
- **Types**: Inferred using `InferSelectModel` and `InferInsertModel` from Drizzle
- **Usage**: Internal use only - not exposed directly via API

### 2. Zod Schemas (`packages/shared/src/schemas/`)

#### Activity Schema (`activity.schema.ts`)

Automatically generated from Drizzle schema using `drizzle-zod`:

- `activitySchema`: Generated from `createSelectSchema(activities)` - matches database select queries
- `createActivitySchema`: Generated from `createInsertSchema(activities)` - for database inserts
- `updateActivitySchema`: Generated from `createUpdateSchema(activities)` - for database updates
- `createActivityRequestSchema`: Extends `createActivitySchema` with HTTP request transformations
- `updateActivityRequestSchema`: Extends `updateActivitySchema` for HTTP update requests
- `filterActivitiesSchema`: Custom schema for query parameter validation

#### Activity Response Schema (`activity-response.schema.ts`)

**Derived from Drizzle schema** using `createSelectSchema` and transformations:

- Base schema generated from `createSelectSchema(activities)`
- Fields omitted: internal fields (rowVersion, deprecated fields)
- Fields transformed:
  - Date/time fields: `Date` → ISO string (`YYYY-MM-DD`), `time` → `HH:mm` string
  - Foreign key IDs: Serial IDs remain `number` (matches database type), UUID IDs remain `string`
  - Timestamps: `Date` → ISO datetime string
- Fields renamed: `leadOrgId` → `leadOrg`, `isConfidential` → `confidential`, etc.
- Computed fields added: `category`, `tags`, etc. (from relatedData)

This ensures the API response schema automatically stays in sync with database schema changes.

### 3. DTOs (`packages/shared/src/dto/`)

- **Purpose**: Provide explicit contracts and better IDE support
- **Location**: `packages/shared/src/dto/activity-response.dto.ts`
- **Implementation**: `ActivityResponseDto` class implements `ActivityResponse` type
- **Factory Method**: `ActivityResponseDto.from()` creates DTO instances from plain objects
- **Compile-time Check**: Ensures the class matches the type definition

### 4. API Types (`packages/shared/src/api/types.ts`)

- **Purpose**: Re-export types from Zod schemas for frontend use
- **Types**: `ActivityResponse`, `PaginatedActivityResponse`
- **Usage**: Frontend should import from `@corpcal/shared/api/types`

## Type Flow

### Request Flow

1. **HTTP Request** → Validated by `ZodValidationPipe` using request schemas
2. **Service Layer** → Uses validated request types (`CreateActivityRequest`, `UpdateActivityRequest`)
3. **Database** → Uses Drizzle types (`NewActivity`, `Activity`)

### Response Flow

1. **Database** → Returns `Activity` (Drizzle type)
2. **Service Layer** → Maps to `ActivityResponse` using `mapToResponseDto()`
3. **Compile-time Validation** → `ensureMatchesSchema()` ensures mapping matches schema
4. **Runtime Validation** → Zod schema validates the DTO
5. **DTO Creation** → `ActivityResponseDto.from()` creates DTO instance
6. **API Response** → Returns `ActivityResponseDto` (implements `ActivityResponse`)

## Type Safety Mechanisms

### 1. Compile-time Safety

- **Schema Generation**: Zod schemas automatically generated from Drizzle
- **Type Inference**: TypeScript types inferred from Zod schemas
- **Mapping Validation**: `ensureMatchesSchema()` ensures mapping produces valid types
- **DTO Type Check**: Compile-time check that DTO class matches type

### 2. Build-time Validation

- **Validation Script**: `packages/shared/scripts/validate-types.ts`
  - Validates all schemas match their corresponding Drizzle types
  - Checks that `ActivityResponse` fields are derived from `Activity`
  - Validates lookup response schemas match their database types
  - Validates request schemas
  - **Must be updated** when adding or removing fields from schemas (see schema update steps)

### 3. Runtime Validation

- **Request Validation**: `ZodValidationPipe` validates incoming requests
- **Response Validation**: Service layer validates responses against schemas
- **Fail-fast**: Validation errors throw immediately in all environments

### 4. Integration Tests

- **Location**: `calendar-service/src/activities/activities.integration.spec.ts`
- **Tests**: Verify API responses match schemas, edge cases handled correctly

## Key Files

### Schema Files

- `packages/database/src/schema/activity.ts` - Database schema definition
- `packages/shared/src/schemas/activity.schema.ts` - Request/select schemas
- `packages/shared/src/schemas/activity-response.schema.ts` - API response schema

### Type Files

- `packages/database/src/types.ts` - Database types (internal use only)
- `packages/shared/src/api/types.ts` - API types (frontend use)
- `packages/shared/src/dto/activity-response.dto.ts` - DTO classes

### Utility Files

- `packages/shared/src/utils/schema-helpers.ts` - Schema helper functions
- `packages/shared/scripts/validate-types.ts` - Type validation script (validates schemas match database types)

### Service Files

- `calendar-service/src/activities/activities.service.ts` - Service with mapping logic
- `calendar-service/src/activities/activities.controller.ts` - Controller with validation

## Best Practices

1. **Always use Zod schemas** for validation - never validate manually
2. **Derive API schemas from Drizzle** - don't define them manually
3. **Use DTOs for responses** - provides better IDE support and explicit contracts
4. **Run validation script** - ensures types stay in sync
5. **Write integration tests** - verify end-to-end type safety

## Common Patterns

### Schema Sources of Truth

Before updating schemas, understand where the root definitions live:

- **Activity Schema**: `packages/database/src/schema/activity.ts` - The Drizzle schema definition for the `activities` table
- **Lookup Table Schemas**: `packages/database/src/schema/lookups.ts` - The Drizzle schema definitions for all lookup tables (activityStatuses, cities, categories, tags, pitchStatuses, etc.)
- **Other Table Schemas**: `packages/database/src/schema/` - Additional schema files for ministries, teams, users, relations, etc.

These Drizzle schemas are the **single source of truth** for database structure. All other type definitions are derived from or must be manually aligned with these schemas.

### Schema Change Checklist

When making schema changes, use this checklist to ensure all affected files are updated:

#### Files That May Need Updates

1. **Database Schema** (`packages/database/src/schema/`)
   - Update the Drizzle schema definition
   - Update schema comments/documentation

2. **Zod Schemas** (`packages/shared/src/schemas/`)
   - `activity.schema.ts` - For activity-related schemas
   - `activity-response.schema.ts` - For activity API response schemas
   - `lookup.schema.ts` - For lookup table response schemas
   - **Response schema pattern**: Add field to `.pick()` section, then add explicit type in `.extend()` section (required due to drizzle-zod type inference limitations)
   - **For lookups**: Also update `*LookupItemSchema` if field should appear in lookup items

3. **Response DTOs** (`packages/shared/src/dto/`)
   - Add property to DTO class matching the schema type
   - DTO must implement the response type (compile-time check ensures alignment)

4. **Type Validation** (`packages/shared/scripts/validate-types.ts`)
   - Add/update type validation checks for new or modified fields
   - For new fields: Add to validation check object (e.g., `_activityResponseFieldCheck`, `_categoryResponseCheck`)
   - For removed fields: Remove from validation check
   - **Note**: Field modifications (e.g., nullability changes) typically don't require updates - type system catches mismatches

5. **Service Layer** (`calendar-service/src/`)
   - Update service methods that query the affected table
   - Update mapping functions if field transformations are needed (`mapToResponseDto()` method)
   - Update filtering/query logic if access control changes

6. **Controller Layer** (`calendar-service/src/`)
   - Update controller endpoints that use the affected schema
   - Update request/response DTOs if needed

7. **Tests**
   - Service tests (`*.service.spec.ts`)
   - Controller tests (`*.controller.spec.ts`)
   - Integration tests (`*.integration.spec.ts`)
   - Update test data/mocks to include new fields

8. **Documentation**
   - `docs/SCHEMA_README.md` - This file (update if process changes)
   - `packages/database/src/schema/docs/SCHEMA_MAPPING.md` - Legacy to new schema mapping
   - Migration log (if applicable)

9. **Migrations** (`packages/database/migrations/`)
   - Generate migration: `npm run db:generate --workspace=packages/database` (or with name: `-- <migration_name>`)
   - **Migration name format** (for lookups): `YYYYMMDD_description_of_change`
   - Always let Drizzle generate migrations - review generated SQL
   - Add data migration steps if needed for existing data
   - Document in `MIGRATION_LOG.md` with date, migration file(s), changes, breaking changes, and notes

10. **Seed Files** (for lookup tables)
    - Update `001_seed_lookup_tables.sql` for lookup values
    - Update `002_seed_activities.sql` for activity seed data
    - Use idempotent INSERT statements (`ON CONFLICT DO NOTHING` or `WHERE NOT EXISTS`)
    - Run: `npm run seed --workspace=calendar-service`

#### Commands

- **Generate migration**: `npm run db:generate --workspace=packages/database`
- **Apply migration**: `npm run db:migrate --workspace=packages/database`
- **Run type validation**: `npm run validate-types --workspace=packages/shared`
- **Run seed**: `npm run seed --workspace=calendar-service`

#### Visibility Field Pattern

For tables with visibility/access control (e.g., `pods`, `categories`):

- Add `visibility` field to the table schema
- Update service layer to filter by visibility + junction table
- Update controller to pass user context (teams) to service methods
- Document the visibility model in schema comments
- **For categories**: Categories with `visibility = 'global'` are visible to all; `visibility = 'team'` requires checking the `teamCategories` junction table

### Transforming a Field

When a field needs transformation (e.g., date to string, number to string):

1. Update API response schema transformation in the `.extend()` section
2. Update mapping function in `mapToResponseDto()` to apply the transformation
3. Compile-time check via `ensureMatchesSchema()` ensures mapping matches schema

### Adding a Computed Field

For fields that don't exist in the database but are computed from other data:

1. Add field to API response schema in the `.extend()` section (don't add to `.pick()`)
2. Update mapping function to compute the value
3. Compile-time check ensures mapping matches schema

### SQL Seeding Files

The application uses SQL seed files to populate lookup tables and initial data. These files are located in `packages/database/migrations/`:

- **`001_seed_lookup_tables.sql`**: Seeds all lookup tables with their initial values
  - Activity statuses, pitch statuses, scheduling statuses
  - Categories, tags, themes
  - Cities, government representatives
  - Comms materials, translated languages
  - Comms contacts
  - Ministries, organizations, users

- **`002_seed_activities.sql`**: Seeds initial activity data (if needed)

#### Creating and Updating Seed Files

1. **Seed files are idempotent**: They use `ON CONFLICT DO NOTHING` or `WHERE NOT EXISTS` clauses to prevent duplicate inserts
2. **Seed files are executed by SeedService**: The `SeedService` in `calendar-service/src/database/seed.service.ts` reads and executes these files
3. **Running seeds**: Execute seeds using:
   ```bash
   npm run seed --workspace=calendar-service
   ```

#### When to Update Seed Files

- **Adding new lookup values**: When you add new categories, statuses, or other lookup values
- **Modifying existing values**: When you need to update display names, descriptions, or other seed data
- **Initial data setup**: When you need to populate tables with reference data

#### Seed File Best Practices

- Always use idempotent INSERT statements (with `ON CONFLICT` or `WHERE NOT EXISTS`)
- Include comments explaining what each section seeds
- Group related inserts together with clear section headers
- Use consistent formatting for readability
- Test seed files after modification to ensure they work correctly

### Migration Logging

All schema changes must be documented in `packages/database/migrations/MIGRATION_LOG.md`. This log serves as a historical record of database schema evolution and helps track breaking changes.

#### When to Update the Migration Log

- **Always** when creating a new migration file
- **Always** when modifying existing schema definitions
- **Always** when adding or removing fields, constraints, or indexes
- **Always** when changing field types or nullability

#### What to Include

Each log entry should include:

1. **Date**: The date the changes were made (YYYY-MM-DD format)
2. **Migration File(s)**: Reference to the migration SQL file(s)
3. **Changes**: Detailed list of all schema changes
4. **Breaking Changes**: Any changes that require application updates
5. **Notes**: Additional context, migration instructions, or important considerations

#### Example Entry

```markdown
### 2025-01-15 - Add User Preferences Table

**Migration File(s):** `0004_add_user_preferences.sql`

**Changes:**

- Created new `user_preferences` table
- Added `preferences` JSONB column to `users` table
- Added foreign key constraint: `user_preferences.user_id` → `users.id`

**Breaking Changes:**

- None (new table, existing tables unchanged)

**Notes:**

- User preferences are optional, existing users will have NULL preferences
- Consider backfilling default preferences for existing users
```

#### Benefits

- **Historical Record**: Track when and why schema changes were made
- **Breaking Change Tracking**: Easily identify changes that require application updates
- **Migration Planning**: Understand dependencies between migrations
- **Documentation**: Provides context for future developers

## Troubleshooting

### Type Assertion Errors

If you see type assertion errors with `z.ZodType & typeof schema`, this is expected. The drizzle-zod library's type definitions require this pattern. The types are still safe - the assertion just helps TypeScript recognize the compatibility.

### Schema Drift

If schemas drift out of sync:

1. From root run `npm run validate-types --workspace=packages/shared` to identify mismatches
2. Check the validation script output
3. Update schemas or mapping functions as needed

### Mapping Errors

If `mapToResponseDto` produces invalid responses:

1. Check compile-time errors - `ensureMatchesSchema` will catch type mismatches
2. Check runtime validation errors - Zod will catch value mismatches
3. Review the mapping logic against the schema definition
