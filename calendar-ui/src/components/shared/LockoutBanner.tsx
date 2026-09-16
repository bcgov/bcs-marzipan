import type { ReactElement } from 'react';

import { cn } from '@/lib/utils';

type LockoutBannerContentProps = {
  message: string;
  className?: string;
};

/**
 * Lockout message for use in the full-page banner or the activity sticky header row.
 */
export function LockoutBannerContent({
  message,
  className,
}: LockoutBannerContentProps): ReactElement {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm',
        className
      )}
    >
      <span className="min-w-0">{message}</span>
    </div>
  );
}

type LockoutBannerProps = {
  message: string;
  /**
   * When true, the banner is inert (no focus/pointer) — use while it is scrolled off-screen
   * and the same message is shown in the sticky header.
   */
  inert?: boolean;
};

/**
 * Shown when the user is on an activity form route during the active recurring lockout window.
 */
export function LockoutBanner({
  message,
  inert,
}: LockoutBannerProps): ReactElement {
  return (
    <div
      className="bg-muted border-border mb-4 rounded-md border px-4 py-3"
      role="alert"
      inert={inert === true ? true : undefined}
    >
      <LockoutBannerContent message={message} />
    </div>
  );
}
