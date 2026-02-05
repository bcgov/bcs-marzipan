# Error Handling

This document describes how errors are handled across the application: where they are caught, how they are formatted, and how to add or extend error handling.

## Overview

- **Backend**: All exceptions are caught by a global filter and returned as RFC 7807 Problem Details. Every request has a correlation ID for tracing.
- **Frontend**: API errors are parsed into typed `ApiError` instances. React error boundaries catch render errors; toasts and inline messages handle user-facing errors.
- **Database**: PostgreSQL errors are mapped to HTTP status codes and safe messages; raw SQL/stack details are not exposed in production.

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

1. **New API call**: Use the shared axios instance; errors will be turned into `ApiError` / `NetworkError`. In catch blocks, use `createApiError(error)` if you need a normalized type.
2. **New form**: Use react-hook-form + Zod; on submit error, if the server returns 400 with `errors[]`, map them to form fields and use `FormMessage` for inline errors.
3. **New page or flow**: Wrap the route or section in `ErrorBoundary` if you want a dedicated fallback instead of the global one.
4. **Toast on error**: Call `showErrorToast(error)` from `lib/error-toast.ts` (e.g. in mutation `onError`). Optionally pass a custom message as the second argument.

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

| Area       | File(s)                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend    | `calendar-service/src/common/filters/http-exception.filter.ts`, `database-error.mapper.ts`, `common/middleware/correlation-id.middleware.ts` |
| Frontend   | `calendar-ui/src/api/errors.ts`, `api/axios.ts`, `lib/error-toast.ts`, `components/GlobalErrorBoundary.tsx`                                  |
| Validation | `calendar-service/src/common/pipes/zod-validation.pipe.ts` (backend); form schemas and `FormMessage` (UI)                                    |
