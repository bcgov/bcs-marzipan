import type { ReactElement } from 'react';

import { Button } from './ui/button';

type ActivityStatusBannerProps = {
  /** Status name from activity (e.g. 'delete_requested', 'deleted'). */
  status: string;
  /** Whether the current user can restore (comms contact or admin/sysAdmin). */
  canRestore: boolean;
  onRestore?: () => void | Promise<void>;
  /** When true, restore action is in progress. */
  isRestoring?: boolean;
};

/**
 * Shown when activity status is delete_requested or deleted.
 * Informs that edits are not allowed and offers Restore when the user is allowed to restore.
 */
export function ActivityStatusBanner({
  status,
  canRestore,
  onRestore,
  isRestoring = false,
}: ActivityStatusBannerProps): ReactElement {
  const isDeleteRequested = status === 'delete_requested';
  const message = isDeleteRequested
    ? 'This activity has been marked for deletion. Edits are not allowed.'
    : 'This activity has been deleted. Edits are not allowed.';

  return (
    <div
      className="bg-muted border-border mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border px-4 py-3 text-sm"
      role="alert"
    >
      <span>{message}</span>
      {canRestore && onRestore && (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 font-medium"
          onClick={() => void onRestore()}
          disabled={isRestoring}
        >
          {isRestoring ? 'Restoring...' : 'Restore'}
        </Button>
      )}
    </div>
  );
}
