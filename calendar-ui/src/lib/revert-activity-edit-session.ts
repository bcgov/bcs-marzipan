import type { UseFormReturn } from 'react-hook-form';

import type { ActivityFormData } from '@corpcal/shared/schemas';

export type RevertActivityEditSessionParams = {
  isEditing: boolean;
  initialFormData: ActivityFormData | null;
  form: UseFormReturn<ActivityFormData>;
  setFormUiEpoch: (update: (epoch: number) => number) => void;
  setIsEditing: (value: boolean) => void;
  applyExternalLockReleased: () => void;
  /** When the caller still holds the server lock (e.g. lockout boundary). */
  release?: () => Promise<void>;
};

/**
 * Clears a local edit session after the server lock is gone or editing is blocked.
 * Mirrors ActivityPage lock-release handling: remount form controls and reset dirty state.
 */
export async function revertActivityEditSession({
  isEditing,
  initialFormData,
  form,
  setFormUiEpoch,
  setIsEditing,
  applyExternalLockReleased,
  release,
}: RevertActivityEditSessionParams): Promise<void> {
  const shouldResetForm = isEditing && initialFormData != null;

  if (release != null) {
    await release();
  }

  applyExternalLockReleased();
  setFormUiEpoch((epoch) => epoch + 1);
  setIsEditing(false);

  if (shouldResetForm && initialFormData != null) {
    // Do not call form.reset during React render or commit phases.
    queueMicrotask(() => {
      form.reset(initialFormData);
    });
  }
}
