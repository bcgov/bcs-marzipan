import type { ReactElement } from 'react';

import { normalizeActivityStatus } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ActivityStatusBannerProps = {
  /** Status name from activity (e.g. 'delete_requested', 'Delete requested', 'deleted'). */
  status: string;
  /** Whether the current user can restore (comms contact, lead-team member, or admin/sysAdmin). */
  canRestore: boolean;
  /** When true, user has permission to edit when status is delete_requested/deleted (e.g. activities.delete.any). Do not show "Edits are not allowed." */
  canEditWhenBlocked?: boolean;
  onRestore?: () => void | Promise<void>;
  /** When true, restore action is in progress. */
  isRestoring?: boolean;
};

/**
 * Shown when activity status is delete_requested or deleted.
 * Informs that edits are not allowed (only when user lacks permission to edit when blocked) and offers Restore when the user is allowed to restore.
 */
export function ActivityStatusBanner({
  status,
  canRestore,
  canEditWhenBlocked = false,
  onRestore,
  isRestoring = false,
}: ActivityStatusBannerProps): ReactElement {
  const normalizedStatus = normalizeActivityStatus(status);
  const isDeleteRequested = normalizedStatus === 'delete_requested';
  const statusLine = isDeleteRequested
    ? 'This activity has been requested for deletion.'
    : 'This activity has been deleted.';
  const message = canEditWhenBlocked
    ? statusLine
    : `${statusLine} Edits are not allowed.`;

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
