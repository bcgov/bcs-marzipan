# API DTOs, Zod Schemas, and Swagger Documentation

This document defines how request/response contracts, validation, and OpenAPI (Swagger) documentation are implemented for the Calendar Service API. Follow this pattern when adding or changing endpoints so that validation and docs stay in sync.

## Single source of truth: Zod schemas

Request and response contracts are defined as **Zod schemas**:

- **Shared API contract**: Schemas live in `@corpcal/shared` under `packages/shared/src/schemas/`. Use these for endpoints that are part of the core API (activities, lookups, teams, users, etc.). Types are inferred from schemas and re-exported from `@corpcal/shared/api/types` where needed.
- **Service-specific**: For modules that are not shared (e.g. drafts), define Zod schemas in the calendar-service module (e.g. `calendar-service/src/drafts/dto/draft.schema.ts`).

Do **not** introduce new endpoints that use only manual `@ApiProperty` DTOs without a backing Zod schema. That leads to validation and Swagger drifting from the actual API.

## DTO layer in calendar-service

Use **`createZodDto(schema)`** from `nestjs-zod` to produce DTO classes that NestJS and Swagger can use:

- **Request bodies**: One DTO class per request body schema (e.g. `CreateTeamDto`, `UpdateUserDto`, `SaveDraftDto`). Define the class in the module’s `dto/` folder (e.g. `teams/dto/teams.dto.ts`, `users/dto/users.dto.ts`, `drafts/dto/drafts.dto.ts`).
- **Responses**: For the standard shape `{ success: true, data: T }` or `{ success: true, data: T[] }`, use the shared helpers:
  - `createResponseWrapperSchema(dataSchema)` for a single `data` object.
  - `createArrayResponseWrapperSchema(itemSchema)` for `data` as an array.
    Then `createZodDto(...)` on the result to get the response wrapper DTO (e.g. `TeamListResponseWrapperDto`, `UserDetailResponseWrapperDto`).

See existing modules for examples: `calendar-service/src/common/dto/activity.dto.ts`, `activity-response.dto.ts`, `teams/dto/teams.dto.ts`, `users/dto/users.dto.ts`, `drafts/dto/drafts.dto.ts`.

## Controllers: decorators and validation

- **Request body**: Use `@ApiBody({ type: XxxDto })` for every endpoint that accepts a body, so Swagger shows the request schema. Keep using `ZodValidationPipe(schema)` with the **same** schema used to build the DTO (e.g. `createTeamBodySchema` for `CreateTeamDto`). That keeps validation and OpenAPI in sync. You can type the method parameter as the DTO class (e.g. `dto: CreateTeamDto`) for consistency.
- **Success responses**: Use `@ApiResponse({ status: 200, type: XxxResponseWrapperDto, description: '...' })` (or 201 where appropriate) for success responses that return `{ success: true, data: T }` or an array. Use the wrapper DTO that matches the response shape. For 404/400/409, a description-only `@ApiResponse` is fine unless you want to document an error body schema.
- **Params and query**: Use `@ApiParam`, `@ApiQuery` as needed so Swagger documents path and query parameters.

## Tags

When you add a new API area (a new controller or a new logical group of endpoints):

1. Add a corresponding **`.addTag('tagName', 'Short description')`** in `calendar-service/src/common/swagger/swagger.config.ts`.
2. Use **`@ApiTags('tagName')`** on the controller so operations are grouped under that tag in Swagger UI.

Existing tags: `activities`, `lookups`, `health`, `teams`, `users`, `drafts`, `auth`, `reports`, `look-ahead`.

## Reference implementations

After the Swagger DTO work, the following modules follow the full pattern and can be used as references:

- **Activities**: `activities.controller.ts`, `common/dto/activity.dto.ts`, `common/dto/activity-response.dto.ts`, `common/dto/activity-update.dto.ts`
- **Lookups**: `lookups.controller.ts`, `common/dto/lookup.dto.ts`
- **Teams**: `teams.controller.ts`, `teams/dto/teams.dto.ts`
- **Users**: `users.controller.ts`, `users/dto/users.dto.ts`
- **Drafts**: `drafts.controller.ts`, `drafts/dto/draft.schema.ts`, `drafts/dto/drafts.dto.ts`

## Out of scope (future work)

- **Auth in Swagger**: Documenting bearer tokens, API keys, or `@ApiBearerAuth()` in the OpenAPI spec is not part of this pattern and is left for future work.
