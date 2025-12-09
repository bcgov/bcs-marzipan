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
- Fields omitted: internal fields (rowVersion, rowGuid, deprecated fields)
- Fields transformed:
  - Date/time fields: `Date` → ISO string (`YYYY-MM-DD`), `time` → `HH:mm` string
  - Foreign key IDs: `number` → `string` where needed (e.g., `activityStatusId`, `createdBy`)
  - Timestamps: `Date` → ISO datetime string
- Fields renamed: `leadOrgId` → `leadOrg`, `isConfidential` → `confidential`, etc.
- Computed fields added: `category`, `tags`, `jointOrg`, etc. (from relatedData)

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
  - Validates request schemas

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
- `packages/shared/scripts/validate-types.ts` - Type validation script

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

### How to Update the Schema

When adding or modifying fields in a database schema, follow these steps to ensure type safety across all layers:

#### Step 1: Generate Database Migration

After modifying the Drizzle schema (e.g., `packages/database/src/schema/activity.ts`), generate a migration:

```bash
npm run db:generate --workspace=packages/database
```

This creates a migration file that will update your database schema. Review the generated migration to ensure it matches your intent.

**Note**: Always let Drizzle generate migrations from your schema rather than writing ALTER TABLE statements manually. This ensures consistency and maintains the schema as the single source of truth.

#### Step 2: Update API Response Schema

If the field should be exposed in API responses, update the response schema file (e.g., `packages/shared/src/schemas/activity-response.schema.ts`):

1. **Add to `.pick()` section**: Include the field in the fields to keep from the base schema
2. **Add to `.extend()` section**: Add explicit type definition for the field (required due to drizzle-zod type inference limitations)

Example:

```typescript
// In .pick() section
export const activityResponseSchema = baseActivitySchema
  .pick({
    // ... existing fields
    isTimeConfirmed: true,
    isDateConfirmed: true,
  })

  // In .extend() section
  .extend({
    // ... existing fields
    isTimeConfirmed: z.boolean(),
    isDateConfirmed: z.boolean(),
  });
```

#### Step 3: Update Response DTO

Update the DTO class (e.g., `packages/shared/src/dto/activity-response.dto.ts`) to include the new field as a property:

```typescript
export class ActivityResponseDto implements ActivityResponse {
  // ... existing properties
  isTimeConfirmed!: boolean;
  isDateConfirmed!: boolean;
}
```

The DTO class must implement the `ActivityResponse` type, so adding the property ensures compile-time type safety.

#### Additional Steps (as needed)

- **Request/Validation Schemas**: Automatically updated via `drizzle-zod` - no manual changes needed
- **Mapping Functions**: Update `mapToResponseDto()` if field needs transformation
- **UI Forms**: Add form fields in the appropriate component sections
- **Form Defaults**: Add default values in form initialization
- **Validation**: Run `npm run validate-types --workspace=packages/shared` to verify types match

### Transforming a Field

1. Update API response schema transformation
2. Update mapping function to apply transformation
3. Compile-time check ensures mapping matches schema

### Adding a Computed Field

1. Add field to API response schema
2. Update mapping function to compute the value
3. Compile-time check ensures mapping matches schema

## Troubleshooting

### Type Assertion Errors

If you see type assertion errors with `z.ZodTypeAny & typeof schema`, this is expected. The drizzle-zod library's type definitions require this pattern. The types are still safe - the assertion just helps TypeScript recognize the compatibility.

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
