import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { TRY_AGAIN_LABEL } from '../lib/error-messages';
import { Button } from './ui/button';

export interface ErrorStateProps {
  /** Short heading for the error (e.g. "Unable to load activities") */
  title: string;
  /** User-friendly message, typically from getFriendlyErrorMessage(error) */
  message: string;
  /** Called when the user clicks the retry button */
  onRetry?: () => void;
  /** Label for the retry button. Defaults to TRY_AGAIN_LABEL */
  retryLabel?: string;
  /** Optional additional content below the message (e.g. Back button) */
  action?: ReactNode;
  className?: string;
}

/**
 * Presentational error state: title, message, and optional retry button.
 * Use with constants from error-messages and getFriendlyErrorMessage() for consistency.
 */
export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = TRY_AGAIN_LABEL,
  action,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 p-8 text-center',
        className
      )}
      role="alert"
    >
      <span className="font-semibold">{title}</span>
      <span className="text-muted-foreground">{message}</span>
      {(onRetry || action) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
