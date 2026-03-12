import type { FallbackProps } from 'react-error-boundary';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  ERROR_DETAILS_LABEL,
  RENDER_FORM_ERROR_TITLE,
  TRY_AGAIN_LABEL,
} from '@/lib/error-messages';
import { getFriendlyErrorMessage } from '@/lib/error-toast';

/**
 * Shared error fallback for activity (and other) forms.
 * Use as ErrorBoundary FallbackComponent.
 */
export function FormErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps): ReactElement {
  const friendlyMessage = getFriendlyErrorMessage(error);
  const rawMessage = error instanceof Error ? error.message : String(error);
  return (
    <div role="alert">
      <div className="mb-8">
        <h1 className="text-destructive mb-2 text-3xl font-bold">
          {RENDER_FORM_ERROR_TITLE}
        </h1>
        <p className="text-muted-foreground mb-4">{friendlyMessage}</p>
        <details className="mb-4">
          <summary className="cursor-pointer text-sm font-medium">
            {ERROR_DETAILS_LABEL}
          </summary>
          <pre className="bg-muted mt-2 overflow-auto rounded p-4 text-sm">
            {rawMessage}
          </pre>
        </details>
        <Button onClick={resetErrorBoundary} variant="default">
          {TRY_AGAIN_LABEL}
        </Button>
      </div>
    </div>
  );
}
