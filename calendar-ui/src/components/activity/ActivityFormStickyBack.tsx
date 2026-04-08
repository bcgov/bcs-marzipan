import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useMemo, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { getActivityFormBackTarget } from '@/lib/activity-form-navigation-state';
import { cn } from '@/lib/utils';

type ActivityFormStickyBackProps = {
  className?: string;
};

/**
 * Sticky top bar with a ghost "Go back" control for create/edit activity flows.
 * Replaces the breadcrumb; stays visible while scrolling the form.
 *
 * Callers entering create/edit flows should attach `activityFormLinkState` from
 * `@/lib/activity-form-navigation-state` so `location.state.from` defines the return target;
 * otherwise users go to `/`.
 */
export function ActivityFormStickyBack({
  className,
}: ActivityFormStickyBackProps): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();

  const backTarget = useMemo(
    () => getActivityFormBackTarget(location.state),
    [location.state]
  );

  const handleBack = useCallback(() => {
    void navigate(backTarget ?? '/');
  }, [navigate, backTarget]);

  return (
    <div
      className={cn(
        'bg-background sticky top-0 z-20 -mx-12 mb-4 flex px-12 py-2',
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="gap-2"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Go back
      </Button>
    </div>
  );
}
