import type { ReactElement } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type ActivityBreadcrumbProps = {
  /** Label for the current page (e.g. displayId "ACT-123" or "New activity") */
  currentLabel: string;
};

/**
 * Breadcrumb above the activity form: Activities list > currentLabel
 */
export function ActivityBreadcrumb({
  currentLabel,
}: ActivityBreadcrumbProps): ReactElement {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm">
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded"
      >
        Activities list
      </Link>
      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
      <span className="font-medium">{currentLabel}</span>
    </nav>
  );
}
