import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';

import type { UserListItem } from '@corpcal/shared/api/types';
import { fetchUser, transferActivities } from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  buildTransferActivitiesBody,
  createInitialTransferDraft,
  isTransferActivitiesDraftValid,
  TransferActivitiesFields,
  type TransferActivitiesDraft,
  type TransferActivitiesFieldsMeta,
} from '@/components/users/TransferActivitiesFields';
import { invalidateUserCaches } from '@/lib/userQueryKeys';

interface TransferActivitiesDialogProps {
  sourceUser: UserListItem;
  onClose: () => void;
  onTransferred: () => void;
}

export function TransferActivitiesDialog({
  sourceUser,
  onClose,
  onTransferred,
}: TransferActivitiesDialogProps) {
  const queryClient = useQueryClient();

  const { data: userDetail, isLoading: isLoadingUser } = useQuery({
    queryKey: ['users', sourceUser.id, 'detail-for-transfer'],
    queryFn: () => fetchUser(sourceUser.id),
  });

  const fromTeamOptions = useMemo(
    () =>
      (userDetail?.teams ?? []).map((t) => ({
        teamId: t.teamId,
        teamName: t.teamName,
      })),
    [userDetail?.teams]
  );

  const initialFromTeamId = fromTeamOptions[0]?.teamId ?? null;

  const [draft, setDraft] = useState<TransferActivitiesDraft>(() =>
    createInitialTransferDraft(initialFromTeamId)
  );
  const [fieldsMeta, setFieldsMeta] = useState<TransferActivitiesFieldsMeta>({
    activities: [],
    isLoading: false,
    isError: false,
  });

  useEffect(() => {
    if (initialFromTeamId != null && draft.fromTeamId == null) {
      setDraft(createInitialTransferDraft(initialFromTeamId));
    }
  }, [initialFromTeamId, draft.fromTeamId]);

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
      toast.success(`Transferred ${data.transferredCount} assignment(s)`, {
        id: toastId,
      });
      onTransferred();
    },
    onError: (err: Error) => {
      const toastId =
        draft.targetUserId != null
          ? `activities-transferred-${sourceUser.id}-${draft.targetUserId}`
          : 'activities-transferred';
      toast.error(err.message || 'Transfer failed', { id: toastId });
    },
  });

  const hasActivities = fieldsMeta.activities.length > 0;

  const canSubmit =
    draft.fromTeamId != null &&
    fromTeamOptions.length > 0 &&
    !fieldsMeta.isLoading &&
    isTransferActivitiesDraftValid(draft, sourceUser.id, hasActivities) &&
    !fieldsMeta.isError;

  const sourceName =
    sourceUser.adDisplayName ||
    sourceUser.adUsername ||
    `User ${sourceUser.id}`;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg min-w-[400px]">
        <DialogHeader>
          <DialogTitle>Transfer activities from {sourceName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {isLoadingUser ? (
            <div className="flex justify-center py-6">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : fromTeamOptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              This user is not on any teams.
            </p>
          ) : (
            <TransferActivitiesFields
              mode="transfer"
              sourceUserId={sourceUser.id}
              fromTeamOptions={fromTeamOptions}
              value={
                draft.fromTeamId == null && initialFromTeamId != null
                  ? { ...draft, fromTeamId: initialFromTeamId }
                  : draft
              }
              onChange={setDraft}
              onMetaChange={setFieldsMeta}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={
              !canSubmit ||
              transferMutation.isPending ||
              isLoadingUser ||
              fromTeamOptions.length === 0
            }
            onClick={() => transferMutation.mutate()}
          >
            {transferMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Transfer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
