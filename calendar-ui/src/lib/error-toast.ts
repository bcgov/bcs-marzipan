import { toast } from 'sonner';

import { ApiError, NetworkError } from '../api/errors';

/**
 * Error Toast Helper
 *
 * Provides consistent error toast notifications for transient errors
 * that don't require full-page error displays.
 *
 * Uses Sonner for toast notifications - no dispatch function needed.
 *
 * ---
 * Toast usage across the app
 *
 * When to use helpers vs direct toast:
 * - Use showErrorToast() for API/network errors so messaging and correlation IDs
 *   stay consistent. Use showSuccessToast / showInfoToast when you want the
 *   same default duration and shape as other app toasts.
 * - Use direct toast.success(), toast.info(), toast.error() from 'sonner' when
 *   you need custom copy, description, or duration (e.g. "Activity updated" with
 *   activity details).
 *
 * Toast IDs (deduplication):
 * - When the same logical event can trigger toasts from more than one place
 *   (e.g. form submit + WebSocket), pass the same `id` in the options so Sonner
 *   updates one toast instead of showing two. Example: form and WebSocket both
 *   use id: `activity-updated-${id}`.
 * - ID convention: `{domain}-{action}-{entityId?}` (e.g. activity-updated-42,
 *   user-updated-5, team-created). Use a stable id so the same event always
 *   uses the same string.
 */

/**
 * Get a human-readable title for an HTTP status code
 */
function getErrorTitle(status: number): string {
  const titles: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Validation Error',
    429: 'Too Many Requests',
    500: 'Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  return titles[status] || 'Error';
}

/**
 * Get a user-friendly error message for inline display (e.g. in error states).
 * Uses the same logic as showErrorToast so messaging is consistent.
 * Does not include correlation ID; use for UI text only.
 */
export function getFriendlyErrorMessage(
  error: unknown,
  customMessage?: string
): string {
  if (error instanceof ApiError) {
    if (customMessage) return customMessage;
    if (error.status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    return error.detail;
  }
  if (error instanceof NetworkError) {
    return (
      customMessage ||
      'Unable to connect. Please check your connection and try again.'
    );
  }
  if (error instanceof Error) {
    return (
      customMessage ||
      error.message ||
      'Something went wrong. Please try again.'
    );
  }
  if (typeof error === 'string') return customMessage || error;
  return 'Something went wrong. Please try again.';
}

/**
 * Show an error toast notification
 *
 * @param error - ApiError or NetworkError instance
 * @param customMessage - Optional custom message to override default
 */
export function showErrorToast(error: unknown, customMessage?: string): void {
  let title = 'Error';
  let message = 'An error occurred';
  let variant: 'error' | 'warning' = 'error';
  let duration = 5000;

  if (error instanceof ApiError) {
    // Handle API errors with appropriate messaging
    title = getErrorTitle(error.status);
    message = customMessage || error.detail;

    // Adjust variant and duration based on error type
    if (error.status === 409) {
      // Conflict - warning style, longer duration
      variant = 'warning';
      duration = 7000;
    } else if (error.status === 429) {
      // Rate limiting - warning style
      variant = 'warning';
      message = 'Too many requests. Please wait a moment and try again.';
      duration = 6000;
    } else if (error.status >= 500) {
      // Server errors - error style, longer duration
      duration = 8000;
      message = 'Server error. Please try again later.';
    } else if (error.isRetryable()) {
      // Retryable errors - warning style
      variant = 'warning';
    }

    // Include correlation ID in development
    if (import.meta.env.DEV && error.correlationId) {
      message += ` (ID: ${error.correlationId})`;
    }
  } else if (error instanceof NetworkError) {
    // Network errors
    title = 'Connection Error';
    message =
      customMessage ||
      'Unable to connect to server. Please check your connection and try again.';
    variant = 'warning';
    duration = 6000;

    if (import.meta.env.DEV && error.correlationId) {
      message += ` (ID: ${error.correlationId})`;
    }
  } else if (error instanceof Error) {
    // Generic errors
    message = customMessage || error.message || 'An unexpected error occurred';
  } else if (typeof error === 'string') {
    message = customMessage || error;
  }

  if (variant === 'warning') {
    toast.warning(title, { description: message, duration });
  } else {
    toast.error(title, { description: message, duration });
  }
}

/**
 * Show a success toast notification
 */
export function showSuccessToast(message: string, title = 'Success'): void {
  toast.success(title, { description: message, duration: 3000 });
}

/**
 * Show an info toast notification
 */
export function showInfoToast(message: string, title = 'Info'): void {
  toast.info(title, { description: message, duration: 4000 });
}
