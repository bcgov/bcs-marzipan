/**
 * Standard Sonner toast durations for app-level notifications.
 *
 * Use these for success, info, and error/warning toasts. Special cases
 * (countdown toasts, long-lived lock notices, etc.) keep local durations.
 */
export const TOAST_DURATION_MS = {
  success: 5_000,
  info: 5_000,
  error: 7_000,
} as const;

/** Default duration when a toast omits `duration` (matches Sonner `<Toaster />`). */
export const DEFAULT_TOAST_DURATION_MS = TOAST_DURATION_MS.success;
