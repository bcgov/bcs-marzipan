# API DTOs, Zod Schemas, and Swagger Documentation

This document defines how request/response contracts, validation, and OpenAPI (Swagger) documentation are implemented for the Calendar Service API. Follow this pattern when adding or changing endpoints so that validation and docs stay in sync.

## Single source of truth: Zod schemas

Request and response contracts are defined as **Zod schemas**:

- **Shared API contract**: Schemas live in `@corpcal/shared` under `packages/shared/src/schemas/`. Use these for endpoints that are part of the core API (activities, lookups, teams, users, etc.). Types are inferred from schemas (`z.infer`) and re-exported from `@corpcal/shared/api/types` — do not hand-write parallel interfaces (see `report-data.schema.ts` / `api/report-data.ts`).
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
- **Params and query**: Use `@ApiParam` for path parameters. For query parameters, follow **Query parameters (Pattern A / B)** below.

## JSON response shape

- **Standard JSON endpoints** return `{ success: true, data: T }` or `{ success: true }` when there is no payload.
- **Exceptions (no wrapper):**
  - **Health / readiness:** `GET /health`, `GET /ready` — raw probe payloads for OpenShift (see `common/dto/health.dto.ts`).
  - **Binary exports:** report CSV, XLSX, PDF — file download responses; document with description-only `@ApiResponse`.
  - **Auth redirects:** Azure OIDC browser entry/callback routes return redirects, not JSON wrappers.

## Query parameters (Pattern A / B)

HTTP query strings are always strings on the wire. Validation uses Zod in `@corpcal/shared` (or module `*.schema.ts`); Swagger must describe the same contract.

| Pattern         | When to use                                                                                             | Controller usage                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A (default)** | Flat `z.object` with **more than 3** keys, or any **reused** query schema                               | `@ApiZodQueries(myQuerySchema)` on the handler **and** `@Query(new ZodValidationPipe(myQuerySchema))` using the **same schema constant**                                            |
| **B (manual)**  | **≤ 3** simple query params, or shapes the generator cannot express (nested objects, exotic preprocess) | Hand-written `@ApiQuery` per field + `@Query(new ZodValidationPipe(schema))` or documented manual parsing. Add a one-line comment: `// Pattern B — see docs/API_DTO_AND_SWAGGER.md` |

**Infrastructure:** Pattern A is implemented in `calendar-service/src/common/swagger/zod-query.openapi.ts` (`@ApiZodQueries`). The generator supports flat `z.object` only (v1); fall back to Pattern B otherwise.

**Schema placement:**

- Cross-cutting filters and list params: `packages/shared/src/schemas/query-params.schema.ts`
- Endpoint-specific queries reused by the UI: domain files (e.g. `history.schema.ts`)
- Service-only modules: `calendar-service/src/<module>/dto/*.schema.ts`

**Conventions:**

- Put human-readable text on fields with **`.describe('...')`** — descriptions flow into generated `@ApiQuery`.
- Reuse **`query-param-helpers.ts`** (`commaSeparatedIntArray`, `commaSeparatedStringArray`, `requiredCommaSeparatedIntArray`, etc.); do not duplicate parsing in controllers.
- **Strict comma-separated IDs:** optional filters use `commaSeparatedIntArray()` — one invalid segment drops the whole param (no partial ID lists). Required params use `requiredCommaSeparatedIntArray()` and fail validation when no valid IDs remain.
- When replacing manual query validation, add **parity tests** beside the schema (see `query-params.schema.spec.ts`).
- `FilterActivitiesDto` in `activity.dto.ts` is **not** used for Swagger query expansion; use Pattern A with `filterActivitiesQuerySchema`.

## Auth (Swagger)

- JSON auth endpoints use `{ success: true, data: … }`; **`data`** for login may be a full session payload or a status signal (`requiresPasswordSetup`, `requiresPasswordReset`).
- Document stable config and password bodies with Zod + `createZodDto` where practical.
- **Azure OIDC** callback/redirect routes — description-only; no request/response body schema.

## Tags

When you add a new API area (a new controller or a new logical group of endpoints):

1. Add a corresponding **`.addTag('tagName', 'Short description')`** in `calendar-service/src/common/swagger/swagger.config.ts`.
2. Use **`@ApiTags('tagName')`** on the controller so operations are grouped under that tag in Swagger UI.

Existing tags: `activities`, `lookups`, `health`, `teams`, `users`, `drafts`, `auth`, `reports`, `look-ahead`, `locks`, `settings`, `notifications`, `banner`, `login-modal`, `activity-favourites`, `activity-saved-filters`.

## Reference implementations

After the Swagger DTO work, the following modules follow the full pattern and can be used as references:

- **Activities**: `activities.controller.ts`, `common/dto/activity.dto.ts`, `common/dto/activity-response.dto.ts`, `common/dto/activity-update.dto.ts`, `common/dto/history.dto.ts`
- **Notifications**: `notifications.controller.ts`, `common/dto/notification.dto.ts`
- **Lookups**: `lookups.controller.ts`, `common/dto/lookup.dto.ts`
- **Teams**: `teams.controller.ts`, `teams/dto/teams.dto.ts`
- **Users**: `users.controller.ts`, `users/dto/users.dto.ts`
- **Drafts**: `drafts.controller.ts`, `drafts/dto/draft.schema.ts`, `drafts/dto/drafts.dto.ts`

## Out of scope (future work)

- **Bearer / API key security schemes** in OpenAPI (`@ApiBearerAuth`, global security requirements).
- **CI enforcement** of typed JSON responses and tag parity (planned follow-up).
