# Error Handling

This document describes how errors are handled across the application: where they are caught, how they are formatted, and how to add or extend error handling.

## Overview

- **Backend**: All exceptions are caught by a global filter and returned as RFC 7807 Problem Details. Every request has a correlation ID for tracing.
- **Frontend**: API errors are parsed into typed `ApiError` instances. React error boundaries catch render errors; toasts and inline messages handle user-facing errors.
- **Database**: PostgreSQL errors are mapped to HTTP status codes and safe messages; raw SQL/stack details are not exposed in production.

### Error format and schema

**Backend response (RFC 7807 Problem Details)**

All error responses from the API use the same JSON shape (see `calendar-service/src/common/filters/http-exception.filter.ts`):

- **Required fields**: `type` (URI), `title`, `status` (HTTP status code), `detail`, `instance` (request path), `correlationId`
- **Optional**: `errors` (array of `{ path, message, code? }` for validation failures), `timestamp` (ISO string), `stack` (included in non-production only)

Content-Type is `application/problem+json`.

Example -- standard error (e.g. 404 Not Found):

```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Activity with id 'abc-123' not found",
  "instance": "/api/activities/abc-123",
  "correlationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479", // example v4 uuid
  "timestamp": "2025-06-15T14:30:00.000Z"
}
```

Example -- validation error (400 with field errors):

```json
{
  "type": "https://api.example.com/errors/validation",
  "title": "Validation Failed",
  "status": 400,
  "detail": "One or more validation errors occurred",
  "instance": "/api/activities",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // example v4 uuid
  "errors": [
    { "path": "title", "message": "Title is required", "code": "too_small" },
    {
      "path": "startDate",
      "message": "Start date must be in the future",
      "code": "invalid_date"
    }
  ],
  "timestamp": "2025-06-15T14:30:00.000Z"
}
```

**Frontend types** (`calendar-ui/src/api/errors.ts`)

- **ProblemDetails**: Interface matching the backend response.
- **ApiError**: Extends `Error`; exposes `status`, `type`, `detail`, `correlationId`, `instance`, `errors?`, `timestamp?`. Use helper methods:
  - `isValidationError()` – 400/422 with field `errors`; use for form inline errors.
  - `isClientError()` – status 4xx.
  - `isServerError()` – status 5xx.
  - `isRetryable()` – 5xx, 408, or 429; use to decide retry or messaging.
- **NetworkError**: No response from server (e.g. connection failed); has optional `correlationId`.
- **createApiError(error)**: Normalizes axios or unknown errors into `ApiError` or `NetworkError`.

Example -- handling a mutation error with toast and inline validation:

```typescript
import { ApiError, createApiError, NetworkError } from '@/api/errors';
import { showErrorToast } from '@/lib/error-toast';

// In a React Query mutation's onError callback:
onError: (error) => {
  const apiError = createApiError(error);

  if (apiError instanceof NetworkError) {
    showErrorToast(apiError);
    return;
  }

  // Map validation field errors to the form
  if (apiError instanceof ApiError && apiError.isValidationError()) {
    apiError.errors?.forEach(({ path, message }) => {
      form.setError(path, { message });
    });
    return;
  }

  // Everything else (409 conflict, 5xx, etc.) -- show a toast
  showErrorToast(apiError);
};
```

Example -- deciding whether to retry based on error type:

```typescript
import { ApiError, createApiError } from '@/api/errors';

try {
  await saveActivity(payload);
} catch (error) {
  const apiError = createApiError(error);

  if (apiError instanceof ApiError) {
    if (apiError.isRetryable()) {
      // 5xx, 408, or 429 -- safe to retry
      enqueueRetry(payload);
    } else if (apiError.isClientError()) {
      // 4xx -- do not retry; fix the request
      showErrorToast(apiError);
    }
  }
}
```

## Backend (calendar-service)

### Global handling

All unhandled exceptions are caught by a single **global exception filter** (`HttpExceptionFilter`). It:

- Converts every error into **Problem Details** (RFC 7807) JSON.
- Adds **correlation ID** (from middleware) to the response body and `X-Correlation-ID` header.
- In **production**, hides stack traces and sensitive details; in development, more detail can be included.

You do not need to wrap every controller in try/catch for consistent responses; the filter handles it.

### Correlation ID

Each request gets a correlation ID via **middleware** (`CorrelationIdMiddleware`):

- Generated as a UUID, or taken from the `X-Correlation-ID` request header if present.
- Stored on the request object and sent back in the `X-Correlation-ID` response header.
- Use it when logging or when support needs to trace a specific request.

### Validation errors (DTO / body)

Request validation is done with **Zod** and `ZodValidationPipe`. When validation fails:

- The backend returns **400** with a body that includes `errors`: an array of `{ path, message, code }` for each field.
- The global filter turns this into Problem Details and keeps the `errors` array, so the UI can show inline field errors.

### Database errors

PostgreSQL errors are mapped in **database-error.mapper.ts**. Known SQLSTATE codes (e.g. unique violation, foreign key, deadlock) are turned into a safe HTTP status and message. Unmapped or unexpected DB errors are still caught by the global filter and returned as a generic 500-style response without leaking SQL or stack details in production.

## Frontend (calendar-ui)

### API errors

- The **axios** instance in `api/axios.ts` has a response interceptor that turns failed responses into **ApiError** (or **NetworkError** when there is no response).
- **ApiError** has `status`, `detail`, `correlationId`, and optional `errors` (for validation). Use `createApiError(error)` from `api/errors.ts` when you need to normalize an error from a catch block.
- The client sends **X-Correlation-ID** on requests and can read it from response headers for logging or support.

### Error boundaries

- **Global**: The app is wrapped in `GlobalErrorBoundary`. Any uncaught React render error is caught and a full-page error view is shown (with retry / reload).
- **Route-level**: Individual routes are wrapped in `ErrorBoundary` with a route fallback. A failure in one route does not take down the whole app; the user sees a page-level error and can try again or go home.

### Showing errors to users

- **Inline (forms)**: For validation (400 with `errors[]`), use existing form components and `FormMessage`; map `error.errors` to the right fields when you set form errors from an `ApiError`.
- **Toasts**: For transient issues (e.g. network, 409, 429), use **showErrorToast** from `lib/error-toast.ts` with the toast controller. Use for mutations or actions where a full-page error is not needed.
- **Full page**: For 403, 404, or 5xx, use the existing **StatusMessage**-based UI or let the error boundary handle it.

For a consistent, user-friendly experience across the app, follow the **UI error presentation strategy** below (centralized messages, friendly text only, reusable components).

### UI error presentation strategy

We avoid showing raw `error.message` or API response text to users. Instead we use a single source of truth for copy, a shared helper for friendly messages, and a reusable inline error component.

**Summary**

1. **Centralized copy**: All user-facing error titles, messages, and button labels live in `calendar-ui/src/lib/error-messages.ts`. Use these constants everywhere so wording stays consistent and can be updated (or localized) in one place.
2. **Friendly message helper**: For any caught error (API, network, or generic), call **getFriendlyErrorMessage(error)** from `lib/error-toast.ts` to get a safe, user-oriented string. Use this for the primary message shown in the UI; do not show `error.message` or `response.data.message` directly unless inside an expandable "Error details" section for support.
3. **Reusable inline error UI**: For section- or full-page error states (e.g. "Unable to load activities"), use the **ErrorState** component with a title from `error-messages`, the message from `getFriendlyErrorMessage(error)` (or a context constant), and an optional retry action.
4. **Error boundaries**: Global and form-level error fallbacks use the same constants and `getFriendlyErrorMessage(normalizeError(rawError))` for the main message; they keep an expandable "Error details" block with raw `error.message` (and stack in dev) for support and debugging.

**Components and modules**

| Item                           | Purpose                                                                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/error-messages.ts`        | Constants for all user-facing error copy (titles, messages, CTA labels). Add new constants here when you introduce a new error context.                                              |
| `lib/error-toast.ts`           | **getFriendlyErrorMessage(error, customMessage?)** – returns a safe string for display. **showErrorToast(error, customMessage?)** – shows a toast (use for transient errors).        |
| `components/ErrorState.tsx`    | Presentational component: title, message, optional retry button and extra action. Use for inline/section error blocks (e.g. load failure with "Try again").                          |
| `components/StatusMessage.tsx` | Full-page status layout (title, message, action, details). Used by GlobalErrorBoundary and RouterErrorBoundary; **ErrorDetails** is for the expandable technical-details block only. |

**Implementation example**

Example: a component that loads data and shows an error state with retry.

```typescript
import { useState } from 'react';
import { getFriendlyErrorMessage } from '../lib/error-toast';
import { LOAD_ACTIVITY_TITLE } from '../lib/error-messages';
import { ErrorState } from '../components/ErrorState';

function MyActivityLoader() {
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      await fetchActivity(id);
      // ...
    } catch (err) {
      logger.error('Failed to load activity', err);
      setError(getFriendlyErrorMessage(err));  // friendly text only
      showErrorToast(err);                     // optional: toast as well
    }
  };

  if (error) {
    return (
      <ErrorState
        title={LOAD_ACTIVITY_TITLE}
        message={error}
        onRetry={() => load()}
      />
    );
  }
  // ...
}
```

- **Title**: Use a constant from `error-messages.ts` (e.g. `LOAD_ACTIVITY_TITLE`, `LOAD_ACTIVITIES_TITLE`).
- **Message**: Use the string you stored from `getFriendlyErrorMessage(err)` in your catch block (or a context-specific constant when there is no thrown error, e.g. invalid response shape).
- **Retry**: Pass `onRetry` and optionally `retryLabel`; use the `action` prop for extra buttons (e.g. "Back").

For error boundaries (e.g. form render failure), use `getFriendlyErrorMessage(error)` for the main paragraph and constants for the title and "Error details" label; keep the expandable `<details>` content as raw `error.message` (and stack in dev) for support.

**When to add new constants**

- Add a new constant in `error-messages.ts` when you have a new user-facing error context (e.g. a new screen or flow with its own load/error state). Use a descriptive name (e.g. `LOAD_REPORTS_TITLE`, `SAVE_DRAFT_FAILED`).
- Reuse generic constants (`DEFAULT_ERROR_TITLE`, `TRY_AGAIN_LABEL`, `ERROR_DETAILS_LABEL`) where they fit.

**Extensibility (i18n)**

- All user-facing strings are centralized in `error-messages.ts`. To add i18n later, you can:
  - Replace constant exports with functions that take a locale or use a translation hook, e.g. `export const LOAD_ACTIVITY_TITLE = () => t('errors.loadActivity.title');`, or
  - Keep the constants as default/fallback and resolve translations in a thin layer (e.g. `getErrorMessages(locale)` that returns the same keys with translated values).
- **getFriendlyErrorMessage** can stay as-is; only the fallback strings inside it (and in toasts) would need to go through the same i18n layer. New error types can be handled in this helper without changing every component.

### React Query

- **Queries**: Default retry logic does not retry on 4xx; it retries on 5xx/network with backoff. Errors are logged with correlation ID where available.
- **Mutations**: No global toast; handle success/error in the component (e.g. call `showErrorToast` in `onError`).

## Database

- The backend uses **Drizzle** and the shared **packages/database** layer. Errors thrown from the DB (e.g. constraint violations) propagate to the service layer and are then:
  - Mapped by **database-error.mapper.ts** when the error has a known SQLSTATE, or
  - Caught by the **global exception filter** and returned as a safe Problem Details response.
- Do not send raw database error messages or stack traces to the client. Rely on the mapper and the global filter.

## Adding new error handling

### Backend

1. **New HTTP status / type**: Throw NestJS built-in or custom `HttpException` (e.g. `NotFoundException`, `ConflictException`). The global filter will format them as Problem Details.
2. **New validation rules**: Add Zod schemas and use `ZodValidationPipe`; the existing filter already supports 400 + `errors[]`.
3. **New database error code**: Add the SQLSTATE in **database-error.mapper.ts** with the desired HTTP status and a safe, user-oriented message.
4. **Logging**: Use `AppLogger`; pass correlation ID when available (e.g. from request) so logs can be tied to a request.

### Frontend

1. **New API call**: Use the shared axios instance; errors will be turned into `ApiError` / `NetworkError`. In catch blocks, use `createApiError(error)` if you need a normalized type. For user-facing messages, set state (or display) using **getFriendlyErrorMessage(error)** and use constants from **error-messages.ts** for titles/labels.
2. **New form**: Use react-hook-form + Zod; on submit error, if the server returns 400 with `errors[]`, map them to form fields and use `FormMessage` for inline errors.
3. **New page or flow**: Wrap the route or section in `ErrorBoundary` if you want a dedicated fallback instead of the global one. In fallbacks, use **getFriendlyErrorMessage(normalizeError(rawError))** for the main message and constants for title / "Error details" / "Try again".
4. **Toast on error**: Call `showErrorToast(error)` from `lib/error-toast.ts` (e.g. in mutation `onError`). Optionally pass a custom message as the second argument.
5. **New inline error state**: Use the **ErrorState** component with a title from `error-messages.ts`, message from `getFriendlyErrorMessage(err)` (or a new constant), and `onRetry` / `action` as needed. Add a new constant in `error-messages.ts` for the new context (e.g. `LOAD_REPORTS_TITLE`).

## Logging

### Frontend (calendar-ui)

- **Logger**: Use `createLogger(context?)` from `calendar-ui/src/lib/logger.ts`. Creates a logger with optional context (e.g. component or module name) for log output.
- **Methods**: `debug(message, ...args)`, `info(message, ...args)`, `warn(message, ...args)`, `error(message, error?, ...args)`. Use these for all application logging; avoid raw `console.*` in app code.
- **Configuration**: See [LOG_LEVEL and environment variables](#log_level-and-environment-variables) below.

### Backend (calendar-service)

- **Logger**: Use NestJS `Logger(ClassName.name)` or inject **AppLogger** from `calendar-service/src/common/logger/logger.service.ts`. Controllers and services should use a logger instance for consistent formatting.
- **AppLogger**: Wraps NestJS Logger; supports optional `correlationId` on log methods so request-scoped logs can be traced. Use in controllers/filters when the request correlation ID is available.

### LOG_LEVEL and environment variables

**Frontend**

- **VITE_LOG_LEVEL**: One of `DEBUG` | `INFO` | `WARN` | `ERROR` | `NONE`. Used in `calendar-ui/src/lib/logger.ts` in `loadConfig()`. Default: **production** `WARN`, **development** `DEBUG`. Set in `.env` or `.env.local` (e.g. `VITE_LOG_LEVEL=DEBUG`).
- **VITE_LOG_TIMESTAMP**: Set to `'false'` to disable timestamps in log output. Default: on.
- **VITE_LOG_CONTEXT**: Set to `'false'` to disable context (e.g. component name) in log output. Default: on.

**Backend**

- There is no `LOG_LEVEL` environment variable today. `AppLogger.debug` and `verbose` are only output when `NODE_ENV !== 'production'`. A configurable log level via env is an optional future improvement.

### Do not

- Expose stack traces or raw SQL messages to the client in production.
- Bypass the global filter (e.g. sending custom JSON error responses from controllers); use exceptions so the filter can normalize them.
- Ignore correlation ID in logs when debugging; it links frontend, backend, and (if used) infrastructure logs.

### Optional / future improvements

- **Configurable or `about:blank` type URIs**: Replace `https://api.example.com/errors/...` with a config-driven base or `about:blank` until real docs exist (see TODO in filter).
- **Log level by status**: Filter already uses `error` for 5xx and `warn` for 4xx; could use `info` for 401/404 to reduce noise if desired.
- **Retry-After**: For 429 or 503, sending a `Retry-After` header helps clients and React Query; optional.
- **Database error mapper**: `ECONNREFUSED` / `ETIMEDOUT` are Node network codes, not PostgreSQL SQLSTATE; the comment could clarify that both driver and Node codes are handled. Behavior is correct if the driver sets `error.code`.
- **Graceful shutdown**: Code calls both `server.close()` and `app.close()`. `app.close()` also closes the HTTP server; using only `app.close()` is sufficient. Current behavior is safe; simplifying is optional.
- **Client `response.data._correlationId`**: Storing the correlation ID on `response.data` is convenient but mutates the response shape; consider keeping it only on headers or a small helper if this becomes an issue.

## Key files

| Area       | File(s)                                                                                                                                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend    | `calendar-service/src/common/filters/http-exception.filter.ts`, `database-error.mapper.ts`, `common/middleware/correlation-id.middleware.ts`, `calendar-service/src/common/logger/logger.service.ts`, `common/logger/logger.module.ts`  |
| Frontend   | `calendar-ui/src/api/errors.ts`, `api/axios.ts`, `lib/error-toast.ts`, `lib/error-messages.ts`, `lib/logger.ts`, `components/layout/GlobalErrorBoundary.tsx`, `components/shared/ErrorState.tsx`, `components/shared/StatusMessage.tsx` |
| Validation | `calendar-service/src/common/pipes/zod-validation.pipe.ts` (backend); form schemas and `FormMessage` (UI)                                                                                                                               |
