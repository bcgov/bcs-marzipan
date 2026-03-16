import type { ReactElement } from 'react';

type LockBannerProps = {
  lockedByUsername: string | null;
};

/**
 * Shown when the user is on the edit route but the activity is locked by another user.
 */
export function LockBanner({
  lockedByUsername,
}: LockBannerProps): ReactElement {
  const who = lockedByUsername ?? 'another user';
  return (
    <div
      className="bg-muted border-border mb-4 flex items-center gap-2 rounded-md border px-4 py-3 text-sm"
      role="alert"
    >
      <span>
        This activity is being edited by <strong>{who}</strong>. You can view in
        read-only.
      </span>
    </div>
  );
}
