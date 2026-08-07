import { useMemo } from 'react';

import {
  createInitialTransferDraft,
  isTransferActivitiesDraftPristine,
  isTransferActivitiesDraftValid,
  wouldTransferDraftHaveEffect,
  type TransferActivitiesDraft,
  type TransferActivitiesFieldsMeta,
} from '@/components/users/TransferActivitiesFields';

interface UseTransferActivitiesSubmitOptions {
  sourceUserId: number;
  draft: TransferActivitiesDraft;
  fieldsMeta: TransferActivitiesFieldsMeta;
  initialFromTeamId: number | null;
  /** When false, submit stays disabled (user transfer tab). Defaults to true. */
  canTransfer?: boolean;
  /** When true, require at least one from-team option (transfer dialog). */
  requireFromTeamOptions?: boolean;
  fromTeamOptionCount?: number;
}

export function useTransferActivitiesSubmit({
  sourceUserId,
  draft,
  fieldsMeta,
  initialFromTeamId,
  canTransfer = true,
  requireFromTeamOptions = false,
  fromTeamOptionCount = 1,
}: UseTransferActivitiesSubmitOptions) {
  const hasActivities = fieldsMeta.activities.length > 0;
  const scopedActivityIds = useMemo(
    () => fieldsMeta.activities.map((a) => a.id),
    [fieldsMeta.activities]
  );

  const isDraftPristine = isTransferActivitiesDraftPristine(
    draft,
    scopedActivityIds
  );

  const hasTransferEffect = wouldTransferDraftHaveEffect(
    draft,
    fieldsMeta.activities
  );

  const canSubmit =
    canTransfer &&
    draft.fromTeamId != null &&
    (!requireFromTeamOptions || fromTeamOptionCount > 0) &&
    hasActivities &&
    hasTransferEffect &&
    !fieldsMeta.isLoading &&
    isTransferActivitiesDraftValid(draft, sourceUserId, hasActivities) &&
    !fieldsMeta.isError;

  const resetForm = () => {
    return createInitialTransferDraft(draft.fromTeamId ?? initialFromTeamId);
  };

  return {
    canSubmit,
    hasActivities,
    isDraftPristine,
    resetForm,
    scopedActivityIds,
  };
}
