import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type LockBannerProps = {
  lockedByUsername: string | null;
  /** When set, show a control to request taking the edit lock (permission-checked by parent). */
  onRequestTakeLock?: () => void;
  requestTakeLockPending?: boolean;
  /** True while this user has a pending force handoff on this activity. */
  handoffActive?: boolean;
  onCancelHandoff?: () => void;
  cancelHandoffPending?: boolean;
};

type LockBannerContentProps = LockBannerProps & {
  className?: string;
};

/**
 * Lock message and actions for use in the full-page banner or the activity sticky header row.
 */
export function LockBannerContent({
  lockedByUsername,
  onRequestTakeLock,
  requestTakeLockPending,
  handoffActive,
  onCancelHandoff,
  cancelHandoffPending,
  className,
}: LockBannerContentProps): ReactElement {
  const who = lockedByUsername ?? 'another user';
  const showCancel = handoffActive === true && onCancelHandoff != null;
  const showForce = !showCancel && onRequestTakeLock != null;
  return (
    <div
      className={cn(
        'flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm',
        className
      )}
    >
      <span className="min-w-0">
        This activity is being edited by <strong>{who}</strong>. You can view in
        read-only.
      </span>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {showCancel && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCancelHandoff}
            disabled={cancelHandoffPending}
          >
            Cancel unlock
          </Button>
        )}
        {showForce && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRequestTakeLock}
            disabled={requestTakeLockPending}
          >
            Force unlock
          </Button>
        )}
      </div>
    </div>
  );
}

type LockBannerPropsWithInert = LockBannerProps & {
  /**
   * When true, the banner is inert (no focus/pointer) — use while it is scrolled off-screen
   * and the same actions are shown in the sticky header.
   */
  inert?: boolean;
};

/**
 * Shown when the user is on the edit route but the activity is locked by another user.
 */
export function LockBanner({
  lockedByUsername,
  onRequestTakeLock,
  requestTakeLockPending,
  handoffActive,
  onCancelHandoff,
  cancelHandoffPending,
  inert,
}: LockBannerPropsWithInert): ReactElement {
  return (
    <div
      className="bg-muted border-border mb-4 rounded-md border px-4 py-3"
      role="alert"
      inert={inert === true ? true : undefined}
    >
      <LockBannerContent
        lockedByUsername={lockedByUsername}
        onRequestTakeLock={onRequestTakeLock}
        requestTakeLockPending={requestTakeLockPending}
        handoffActive={handoffActive}
        onCancelHandoff={onCancelHandoff}
        cancelHandoffPending={cancelHandoffPending}
      />
    </div>
  );
}
