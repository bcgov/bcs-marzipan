import type { FC } from 'react';

import { formatTime } from '@/lib/datetime-utils';

interface AutosaveIndicatorProps {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** The timestamp of the last successful save, or null if never saved */
  lastSaved: Date | null;
  /** Whether draft data is being loaded */
  isLoading: boolean;
}

/**
 * Displays the current autosave status to the user.
 * Shows different states: unauthenticated, saving, saved, or loading.
 */
export const AutosaveIndicator: FC<AutosaveIndicatorProps> = ({
  isAuthenticated,
  isSaving,
  lastSaved,
  isLoading,
}) => {
  if (!isAuthenticated) {
    return (
      <div className="text-sm">
        <span className="text-slate-400">Log in to enable draft saving</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm">
        <span className="text-gray-500">Loading draft...</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="text-sm">
        <span className="text-amber-600">Saving draft...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="text-sm">
        <span className="text-green-600">
          Draft saved at {formatTime(lastSaved)}
        </span>
      </div>
    );
  }

  return null;
};
