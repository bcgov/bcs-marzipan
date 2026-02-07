import { type ReactNode } from 'react';
import { Button } from './ui/button';
import { ERROR_DETAILS_LABEL, TRY_AGAIN_LABEL } from '../lib/error-messages';

interface StatusMessageProps {
  title: string;
  message: string;
  variant?: 'default' | 'error' | 'loading';
  action?: ReactNode;
  details?: ReactNode;
  className?: string;
}

/**
 * Reusable status message component for displaying loading, error, or informational states.
 * Provides consistent styling and layout for status messages across the application.
 */
export function StatusMessage({
  title,
  message,
  variant = 'default',
  action,
  details,
  className = '',
}: StatusMessageProps) {
  const titleColorClass =
    variant === 'error'
      ? 'text-destructive'
      : variant === 'loading'
        ? 'text-foreground'
        : 'text-foreground';

  return (
    <div
      className={`mx-auto max-w-4xl px-4 py-8 ${className}`}
      role={variant === 'error' ? 'alert' : undefined}
    >
      <div className="mb-8">
        <h1 className={`${titleColorClass} mb-2 text-3xl font-bold`}>
          {title}
        </h1>
        <p className="text-muted-foreground mb-4">{message}</p>
        {details && <div className="mb-4">{details}</div>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

interface ErrorDetailsProps {
  error: Error;
  onRetry?: () => void;
}

/**
 * Error details component for displaying technical error information with optional retry.
 * The primary user-visible message should come from the parent (e.g. getFriendlyErrorMessage(error));
 * this component is for the expandable technical details (error.message) and optional retry action.
 */
export function ErrorDetails({ error, onRetry }: ErrorDetailsProps) {
  return (
    <>
      <details className="mb-4">
        <summary className="cursor-pointer text-sm font-medium">
          {ERROR_DETAILS_LABEL}
        </summary>
        <pre className="bg-muted mt-2 overflow-auto rounded p-4 text-sm">
          {error.message}
        </pre>
      </details>
      {onRetry && (
        <Button onClick={onRetry} variant="default">
          {TRY_AGAIN_LABEL}
        </Button>
      )}
    </>
  );
}
