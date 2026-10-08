# Toast notifications (Sonner)

The app uses [Sonner](https://sonner.emilkowal.ski/) for toasts. Helpers and conventions are documented here and in code.

## Helpers vs direct toast

- **Helpers** ([src/lib/error-toast.ts](src/lib/error-toast.ts)): Use `showErrorToast()` for API/network errors so messaging and correlation IDs stay consistent. Use `showSuccessToast()` / `showInfoToast()` when you want the same default duration and shape as other app toasts.
- **Direct** `toast.success()`, `toast.info()`, `toast.error()`: Use when you need custom copy, description, or duration (e.g. "Activity updated" with activity details).

## Toast IDs and deduplication

When the same logical event can trigger toasts from more than one place (e.g. form submit and a WebSocket event), pass the same `id` in the toast options so Sonner updates one toast instead of showing two.

**ID convention:** `{domain}-{action}-{entityId?}`

- Examples: `activity-updated-42`, `activity-created-123`, `user-updated-5`, `team-deactivated-3`, `team-created`.
- Use a stable id so the same event always uses the same string across call sites.

## Durations

Standard durations live in [src/lib/toast-durations.ts](src/lib/toast-durations.ts):

- `TOAST_DURATION_MS.success` / `.info` — 5s
- `TOAST_DURATION_MS.error` — 7s (errors and actionable warnings)

Countdown toasts, long-lived lock notices, and other special cases keep local durations (e.g. `Infinity`, `60_000`).

## Where things live

- Durations: [calendar-ui/src/lib/toast-durations.ts](src/lib/toast-durations.ts)
- Helpers: [calendar-ui/src/lib/error-toast.ts](src/lib/error-toast.ts)
- User/team copy: [calendar-ui/src/lib/user-team-toast-messages.ts](src/lib/user-team-toast-messages.ts)
- Direct toast calls: search for `toast.` from `sonner` across the app.
