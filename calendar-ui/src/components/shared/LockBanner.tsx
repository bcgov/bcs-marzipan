import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';

type LockBannerProps = {
  lockedByUsername: string | null;
  /** When set, show a control to request taking the edit lock (permission-checked by parent). */
  onRequestTakeLock?: () => void;
  requestTakeLockPending?: boolean;
  /** True while this user has a pending force handoff on this activity. */
  handoffActive?: boolean;
  onCancelHandoff?: () => void;
  cancelHandoffPending?: boolean;
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
}: LockBannerProps): ReactElement {
  const who = lockedByUsername ?? 'another user';
  const showCancel = handoffActive === true && onCancelHandoff != null;
  const showForce = !showCancel && onRequestTakeLock != null;
  return (
    <div
      className="bg-muted border-border mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm"
      role="alert"
    >
      <span>
        This activity is being edited by <strong>{who}</strong>. You can view in
        read-only.
      </span>
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
  );
}
