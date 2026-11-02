# Toast notifications (Sonner)

The app uses [Sonner](https://sonner.emilkowal.ski/) for toasts. Helpers and conventions are documented here and in code.

## Helpers vs direct toast

- **Helpers** ([src/lib/error-toast.ts](src/lib/error-toast.ts)): Use `showErrorToast()` for API/network errors so messaging and correlation IDs stay consistent. Use `showSuccessToast()` / `showInfoToast()` when you want the same default duration and shape as other app toasts.
- **Direct** `toast.success()`, `toast.info()`, `toast.error()`: Use when you need custom copy, description, or duration (e.g. "Activity updated" with activity details).

Activity edit **connection** feedback (browser offline, connection lost, verifying session, connection restored) uses the fixed top [`ActivityConnectionStatusAlert`](../src/components/shared/ActivityConnectionStatusAlert.tsx) driven by [`useActivityEditConnectionUi`](../src/hooks/useActivityEditConnectionUi.ts), not Sonner. Socket display states live in [`activity-socket-connection-display`](../src/lib/activity-socket-connection-display.ts) (`browser-offline` vs `disconnected` vs `reconnecting`). The top alert **never** shows the brief `reconnecting` grace window (including the first socket handshake); users see **connection lost** only after escalation to `disconnected`. Confirm modals may still show “Reconnecting…” when save/review is blocked during that window. The restored state auto-hides after `CONNECTION_RESTORED_ALERT_DURATION_MS` (1.5s).

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
