import { ArrowLeft } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { PAGE_CONTAINER_DEFAULT_LAYOUT } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ActivityFormStickyHeaderProps = {
  onBack: () => void;
  className?: string;
  /**
   * Optional trailing slot (e.g. lock message and actions). Fades in/out via `lockStripVisible`.
   * Render plain content here — no extra card chrome.
   */
  lockStrip?: ReactNode;
  /** When false, the lock strip is invisible and inert (opacity transition). */
  lockStripVisible?: boolean;
};

/**
 * Sticky top bar with a ghost "Go back" control for create/edit activity flows.
 * Replaces the breadcrumb; stays visible while scrolling the form.
 * Spans the full width of `PageContainer`’s padded box; inner content uses the same
 * horizontal inset as siblings (`PAGE_CONTAINER_DEFAULT_LAYOUT`).
 */
export function ActivityFormStickyHeader({
  onBack,
  className,
  lockStrip,
  lockStripVisible = false,
}: ActivityFormStickyHeaderProps): ReactElement {
  const showLockStrip = lockStrip != null;

  return (
    <div
      className={cn(
        'bg-background sticky top-0 z-20 mb-4 flex min-w-0 items-center py-3',
        PAGE_CONTAINER_DEFAULT_LAYOUT.stripeFullBleedXClass,
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="shrink-0 gap-2"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Go back
      </Button>
      {showLockStrip && (
        <div
          className={cn(
            'ms-auto min-w-0 transition-opacity duration-300 ease-out',
            lockStripVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          aria-hidden={!lockStripVisible}
          inert={lockStripVisible ? undefined : true}
        >
          {lockStrip}
        </div>
      )}
    </div>
  );
}
