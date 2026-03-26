import { ArrowLeft } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ActivityFormStickyBackProps = {
  onBack: () => void;
  className?: string;
};

/**
 * Sticky top bar with a ghost "Go back" control for create/edit activity flows.
 * Replaces the breadcrumb; stays visible while scrolling the form.
 */
export function ActivityFormStickyBack({
  onBack,
  className,
}: ActivityFormStickyBackProps): ReactElement {
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
        onClick={onBack}
        className="gap-2"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Go back
      </Button>
    </div>
  );
}
