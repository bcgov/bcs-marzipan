# Toast notifications (Sonner)

The app uses [Sonner](https://sonner.emilkowal.ski/) for toasts. Helpers and conventions are documented here and in code.

## Helpers vs direct toast

- **Helpers** ([src/lib/error-toast.ts](../src/lib/error-toast.ts)): Use `showErrorToast()` for API/network errors so messaging and correlation IDs stay consistent. Use `showSuccessToast()` / `showInfoToast()` when you want the same default duration and shape as other app toasts.
- **Direct** `toast.success()`, `toast.info()`, `toast.error()`: Use when you need custom copy, description, or duration (e.g. "Activity updated" with activity details).

## Toast IDs and deduplication

When the same logical event can trigger toasts from more than one place (e.g. form submit and a WebSocket event), pass the same `id` in the toast options so Sonner updates one toast instead of showing two.

**ID convention:** `{domain}-{action}-{entityId?}`

- Examples: `activity-updated-42`, `activity-created-123`, `user-updated-5`, `team-deactivated-3`, `team-created`.
- Use a stable id so the same event always uses the same string across call sites.

## Where things live

- Helpers: [calendar-ui/src/lib/error-toast.ts](../src/lib/error-toast.ts)
- Direct toast calls: search for `toast.` from `sonner` across the app.
