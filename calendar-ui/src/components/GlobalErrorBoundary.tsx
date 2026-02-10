import { ErrorBoundary } from 'react-error-boundary';

import { ApiError } from '../api/errors';
import {
  ACCESS_DENIED_MESSAGE,
  ACCESS_DENIED_TITLE,
  DEFAULT_ERROR_TITLE,
  ERROR_DETAILS_LABEL,
  NOT_FOUND_MESSAGE,
  NOT_FOUND_TITLE,
  SERVER_ERROR_MESSAGE,
  SERVER_ERROR_TITLE,
  TRY_AGAIN_LABEL,
} from '../lib/error-messages';
import { getFriendlyErrorMessage } from '../lib/error-toast';
import { createLogger } from '../lib/logger';
import { StatusMessage } from './StatusMessage';
import { Button } from './ui/button';

const logger = createLogger('GlobalErrorBoundary');

interface ErrorFallbackProps {
  error: unknown;
  resetErrorBoundary: (...args: unknown[]) => void;
}

/**
 * Normalize thrown value to an Error for display and type narrowing.
 * React error boundaries receive unknown since any value can be thrown.
 */
function normalizeError(thrown: unknown): Error {
  if (thrown instanceof Error) return thrown;
  return new Error(typeof thrown === 'string' ? thrown : String(thrown));
}

/**
 * Global error fallback component
 *
 * Displays a user-friendly error message when an unhandled error occurs.
 * Provides options to retry or reload the application.
 */
function GlobalErrorFallback({
  error: rawError,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  const error = normalizeError(rawError);

  // Log error for debugging
  logger.error('Global error boundary caught error', error);

  // Extract correlation ID if available (from ApiError)
  const correlationId =
    error instanceof ApiError ? error.correlationId : undefined;

  // Determine title and message from error type; use centralized constants
  let title = DEFAULT_ERROR_TITLE;
  let message = getFriendlyErrorMessage(error);
  let showDetails = true;

  if (error instanceof ApiError) {
    if (error.status === 403) {
      title = ACCESS_DENIED_TITLE;
      message = ACCESS_DENIED_MESSAGE;
      showDetails = false;
    } else if (error.status === 404) {
      title = NOT_FOUND_TITLE;
      message = NOT_FOUND_MESSAGE;
      showDetails = false;
    } else if (error.isServerError()) {
      title = SERVER_ERROR_TITLE;
      message = SERVER_ERROR_MESSAGE;
    }
  }

  return (
    <StatusMessage
      title={title}
      message={message}
      variant="error"
      action={
        <div className="flex gap-2">
          <Button onClick={resetErrorBoundary} variant="default">
            {TRY_AGAIN_LABEL}
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload page
          </Button>
        </div>
      }
      details={
        showDetails ? (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium">
              {ERROR_DETAILS_LABEL}
            </summary>
            <div className="mt-2 space-y-2">
              <pre className="bg-muted overflow-auto rounded p-4 text-sm">
                {error.message}
                {import.meta.env.DEV && error.stack && (
                  <>
                    {'\n\n'}
                    {error.stack}
                  </>
                )}
              </pre>
              {correlationId && (
                <p className="text-muted-foreground text-xs">
                  Error ID: {correlationId}
                </p>
              )}
            </div>
          </details>
        ) : undefined
      }
    />
  );
}

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Global Error Boundary
 *
 * Wraps the application to catch unhandled errors and display
 * a user-friendly error message instead of a blank screen.
 */
export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={GlobalErrorFallback}
      onError={(error, errorInfo) => {
        // Log error with component stack
        logger.error('Error boundary caught error', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
