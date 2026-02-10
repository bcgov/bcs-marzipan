import { useLocation, useNavigate } from 'react-router-dom';

import {
  PAGE_NOT_FOUND_MESSAGE,
  PAGE_NOT_FOUND_TITLE,
} from '../lib/error-messages';
import { createLogger } from '../lib/logger';
import { StatusMessage } from './StatusMessage';
import { Button } from './ui/button';

const logger = createLogger('RouterErrorBoundary');

/**
 * Catch-all route error component for handling unknown routes (404)
 *
 * Displays a user-friendly message when a user navigates to a non-existent route.
 * Provides a button to return to the application home page.
 */
export function RouterErrorBoundary() {
  const navigate = useNavigate();
  const location = useLocation();

  // Log the attempted navigation for debugging
  logger.warn('User attempted to access unknown route', {
    pathname: location.pathname,
    search: location.search,
  });

  const handleReturnHome = () => {
    void navigate('/', { replace: true });
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <StatusMessage
        title={PAGE_NOT_FOUND_TITLE}
        message={PAGE_NOT_FOUND_MESSAGE}
        variant="error"
        action={
          <div className="flex gap-2">
            <Button onClick={handleReturnHome} variant="default">
              Return to Calendar
            </Button>
            <Button onClick={() => void navigate(-1)} variant="outline">
              Go Back
            </Button>
          </div>
        }
        details={
          <p className="text-muted-foreground mt-2 text-sm">
            Requested path:{' '}
            <code className="bg-muted rounded px-1">{location.pathname}</code>
          </p>
        }
      />
    </div>
  );
}
