import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';

import type { UserListItem } from '@corpcal/shared/api/types';
import { transferActivities } from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import {
  buildTransferActivitiesBody,
  createInitialTransferDraft,
  TransferActivitiesFields,
  type TransferActivitiesDraft,
  type TransferActivitiesFieldsMeta,
} from '@/components/users/TransferActivitiesFields';
import { useTransferActivitiesSubmit } from '@/hooks/useTransferActivitiesSubmit';
import { formatTransferActivitiesSuccessMessage } from '@/lib/transfer-activities-messages';
import { invalidateUserCaches } from '@/lib/userQueryKeys';

interface UserTransferTabContentProps {
  sourceUser: Pick<UserListItem, 'id' | 'adDisplayName' | 'adUsername'> & {
    teams: { teamId: number; teamName: string }[];
  };
  canTransfer: boolean;
}

export function UserTransferTabContent({
  sourceUser,
  canTransfer,
}: UserTransferTabContentProps) {
  const queryClient = useQueryClient();

  const fromTeamOptions = useMemo(
    () =>
      sourceUser.teams.map((t) => ({
        teamId: t.teamId,
        teamName: t.teamName,
      })),
    [sourceUser.teams]
  );

  const initialFromTeamId = fromTeamOptions[0]?.teamId ?? null;

  const [draft, setDraft] = useState<TransferActivitiesDraft>(() =>
    createInitialTransferDraft(initialFromTeamId)
  );

  useEffect(() => {
    if (initialFromTeamId != null && draft.fromTeamId == null) {
      setDraft(createInitialTransferDraft(initialFromTeamId));
    }
  }, [initialFromTeamId, draft.fromTeamId]);
  const [fieldsMeta, setFieldsMeta] = useState<TransferActivitiesFieldsMeta>({
    activities: [],
    isLoading: false,
    isError: false,
  });

  const sourceDisplayName =
    sourceUser.adDisplayName ||
    sourceUser.adUsername ||
    `User ${sourceUser.id}`;

  const { canSubmit, isDraftPristine, resetForm } = useTransferActivitiesSubmit(
    {
      sourceUserId: sourceUser.id,
      draft,
      fieldsMeta,
      initialFromTeamId,
      canTransfer,
    }
  );

  const transferMutation = useMutation({
    mutationFn: () => {
      const body = buildTransferActivitiesBody(
        draft,
        fieldsMeta.activities.map((a) => a.id)
      );
      return transferActivities(sourceUser.id, body);
    },
    onSuccess: (data) => {
      invalidateUserCaches(queryClient, sourceUser.id);
      const toastId =
        draft.targetUserId != null
          ? `activities-transferred-${sourceUser.id}-${draft.targetUserId}`
          : 'activities-transferred';
      toast.success(
        formatTransferActivitiesSuccessMessage(data.transferredCount),
        {
          id: toastId,
        }
      );
      setDraft(resetForm());
    },
    onError: (err: Error) => {
      const toastId =
        draft.targetUserId != null
          ? `activities-transferred-${sourceUser.id}-${draft.targetUserId}`
          : 'activities-transferred';
      toast.error(err.message || 'Transfer failed', { id: toastId });
    },
  });

  if (!canTransfer) {
    return (
      <p className="text-muted-foreground py-6 text-sm">
        You do not have permission to transfer activities.
      </p>
    );
  }

  if (fromTeamOptions.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-sm">
        This user is not on any teams. Add a team before transferring
        activities.
      </p>
    );
  }

  return (
    <div className="max-w-2xl space-y-4 py-4">
      <TransferActivitiesFields
        mode="transfer"
        sourceUserId={sourceUser.id}
        sourceDisplayName={sourceDisplayName}
        fromTeamOptions={fromTeamOptions}
        value={draft}
        onChange={setDraft}
        onMetaChange={setFieldsMeta}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="secondary"
          onClick={() => setDraft(resetForm())}
          disabled={
            transferMutation.isPending ||
            fieldsMeta.isLoading ||
            isDraftPristine
          }
        >
          Reset
        </Button>
        <Button
          disabled={!canSubmit || transferMutation.isPending}
          onClick={() => transferMutation.mutate()}
        >
          {transferMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Transfer'
          )}
        </Button>
      </div>
    </div>
  );
}
