import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

import { PERMISSIONS as SHARED_PERMISSIONS } from '@corpcal/shared';
import { fetchUserActivities, removeUserFromTeam } from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  buildRemoveUserFromTeamBody,
  createInitialTransferDraft,
  isTransferActivitiesDraftValid,
  TransferActivitiesFields,
  type TransferActivitiesDraft,
} from '@/components/users/TransferActivitiesFields';
import { useAuth } from '@/hooks/useAuth';
import { invalidateUserCaches } from '@/lib/userQueryKeys';

interface RemoveTeamMemberTarget {
  userId: number;
  userName: string;
  adEmail?: string | null;
}

interface RemoveTeamMemberModalProps {
  open: boolean;
  teamId: number;
  teamName: string;
  member: RemoveTeamMemberTarget | null;
  onClose: () => void;
  onRemoved: () => void;
}

export function RemoveTeamMemberModal({
  open,
  teamId,
  teamName,
  member,
  onClose,
  onRemoved,
}: RemoveTeamMemberModalProps) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canTransferActivities = hasPermission(
    SHARED_PERMISSIONS.USERS.TRANSFER_ACTIVITIES
  );

  const sourceUserId = member?.userId ?? null;
  const [draft, setDraft] = useState<TransferActivitiesDraft>(() =>
    createInitialTransferDraft(teamId)
  );

  const {
    data: scopedActivities = [],
    isLoading: isLoadingScopedActivities,
    isError: isScopedActivitiesError,
  } = useQuery({
    queryKey: ['users', sourceUserId, 'activities', teamId],
    queryFn: () => fetchUserActivities(sourceUserId!, teamId),
    enabled: open && sourceUserId != null,
  });

  const hasActivities = scopedActivities.length > 0;

  useEffect(() => {
    if (!open) {
      setDraft(createInitialTransferDraft(teamId));
    } else {
      setDraft(createInitialTransferDraft(teamId));
    }
  }, [open, teamId]);

  const canSubmit =
    sourceUserId != null &&
    !isLoadingScopedActivities &&
    !isScopedActivitiesError &&
    (!hasActivities ||
      (canTransferActivities &&
        isTransferActivitiesDraftValid(
          { ...draft, fromTeamId: teamId },
          sourceUserId,
          hasActivities
        )));

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (sourceUserId == null) {
        throw new Error('No source user selected');
      }

      const body = buildRemoveUserFromTeamBody(
        { ...draft, fromTeamId: teamId },
        hasActivities
      );
      return removeUserFromTeam(sourceUserId, teamId, body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      invalidateUserCaches(queryClient, sourceUserId!);
      toast.success('Team member removed');
      onRemoved();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to remove team member');
    },
  });

  const sourceName =
    member?.userName || (sourceUserId ? `User ${sourceUserId}` : 'User');

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Confirm removal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            {sourceName} will be removed from {teamName} team.
          </p>

          {isLoadingScopedActivities && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          )}

          {hasActivities &&
            !canTransferActivities &&
            !isLoadingScopedActivities && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                This user has comms assignments on activities led by this team.
                You need permission to transfer activities before removing them.
              </div>
            )}

          {sourceUserId != null && canTransferActivities && hasActivities && (
            <TransferActivitiesFields
              mode="removal"
              sourceUserId={sourceUserId}
              fromTeamOptions={[{ teamId, teamName }]}
              fixedFromTeamId={teamId}
              fixedFromTeamName={teamName}
              value={{ ...draft, fromTeamId: teamId }}
              onChange={(next) => setDraft({ ...next, fromTeamId: teamId })}
              showNotes={false}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={
              !canSubmit || removeMutation.isPending || isScopedActivitiesError
            }
            onClick={() => removeMutation.mutate()}
          >
            {removeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Remove'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RemoveTeamMemberModal;
