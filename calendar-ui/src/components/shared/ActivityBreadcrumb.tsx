import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactElement } from 'react';

import { SYSTEM_ROLES } from '@corpcal/shared/auth';
import { getStoredActivityListSearch } from '@/hooks/useActivityTablePreferences';
import { useAuth } from '@/hooks/useAuth';

type ActivityBreadcrumbProps = {
  /** Label for the current page (e.g. displayId "ACT-123" or "New activity") */
  currentLabel: string;
};

/**
 * Breadcrumb above the activity form: Activities list > currentLabel.
 * The "Activities list" link includes stored sort/filter params so returning
 * from View/Edit/Create restores the previous list state.
 */
export function ActivityBreadcrumb({
  currentLabel,
}: ActivityBreadcrumbProps): ReactElement {
  const { user } = useAuth();
  const canSeeDeleted =
    user?.roleName === SYSTEM_ROLES.ADMIN ||
    user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;
  const listSearch = getStoredActivityListSearch(canSeeDeleted);
  const listPath = `/${listSearch}`;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1 text-sm"
    >
      <Link
        to={listPath}
        className="text-muted-foreground hover:text-foreground focus:ring-ring rounded focus:ring-2 focus:outline-none"
      >
        Activities list
      </Link>
      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
      <span className="font-medium">{currentLabel}</span>
    </nav>
  );
}
