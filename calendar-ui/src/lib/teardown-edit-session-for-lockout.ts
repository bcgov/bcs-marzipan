import type { UseFormReturn } from 'react-hook-form';
import type { MutableRefObject } from 'react';

import type { RecurringEditLockoutSettingsSlice } from '@corpcal/shared';
import type { ActivityFormData } from '@corpcal/shared/schemas';

import type { LockState } from '../hooks/useActivityLock';
import { showLockoutChangesDiscardedToast } from './lockout-countdown-toast';
import { revertActivityEditSession } from './revert-activity-edit-session';

export type TeardownEditSessionForLockoutParams = {
  activityId: number;
  schedule: RecurringEditLockoutSettingsSlice;
  lockoutSubmitGenerationRef: MutableRefObject<number>;
  isEditing: boolean;
  lockState: LockState;
  initialFormData: ActivityFormData | null;
  form: UseFormReturn<ActivityFormData>;
  setFormUiEpoch: (update: (epoch: number) => number) => void;
  setIsEditing: (value: boolean) => void;
  applyExternalLockReleased: () => void;
  releaseWithRetry: () => Promise<void>;
  closeSubmitModals: () => void;
};

export async function teardownEditSessionForLockout({
  activityId,
  schedule,
  lockoutSubmitGenerationRef,
  isEditing,
  lockState,
  initialFormData,
  form,
  setFormUiEpoch,
  setIsEditing,
  applyExternalLockReleased,
  releaseWithRetry,
  closeSubmitModals,
}: TeardownEditSessionForLockoutParams): Promise<void> {
  lockoutSubmitGenerationRef.current += 1;
  showLockoutChangesDiscardedToast(schedule, activityId);
  closeSubmitModals();

  await revertActivityEditSession({
    isEditing,
    initialFormData,
    form,
    setFormUiEpoch,
    setIsEditing,
    applyExternalLockReleased,
    release: lockState === 'owned' ? releaseWithRetry : undefined,
  });
}
