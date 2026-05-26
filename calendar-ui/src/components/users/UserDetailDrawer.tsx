import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import type { UserDetail, UserListItem } from '@corpcal/shared/api/types';
import { fetchUser, updateUser } from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';

interface UserDetailDrawerProps {
  user: UserListItem;
  open: boolean;
  onClose: () => void;
}

export function UserDetailDrawer({
  user,
  open,
  onClose,
}: UserDetailDrawerProps) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.USERS.EDIT);

  const { data: userDetail, isLoading } = useQuery({
    queryKey: ['userDetail', user.id],
    queryFn: () => fetchUser(user.id),
    enabled: open && !!user.id,
  });

  const [localNotes, setLocalNotes] = useState<string | undefined>(undefined);

  // keep localNotes in sync when detail loads
  // useEffect avoids setting state during render
  useEffect(() => {
    if (userDetail) setLocalNotes(userDetail.notes ?? '');
  }, [userDetail]);

  const mutation = useMutation<UserDetail, unknown, string | undefined>({
    mutationFn: (notes: string | undefined) =>
      updateUser(user.id, { notes: notes ?? null }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['userDetail', user.id] });
      onClose();
    },
  });

  const handleSave = useCallback(() => {
    mutation.mutate(localNotes);
  }, [localNotes, mutation]);

  const displayName =
    user.adDisplayName || user.adUsername || `User ${user.id}`;

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && onClose()}>
      <DialogContent className="max-h-[80vh] w-full max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{displayName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-center text-slate-500">Loading…</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500">Email</div>
                <div className="font-medium text-slate-900">
                  {userDetail?.adEmail ?? '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Role</div>
                <div className="font-medium text-slate-900">
                  {userDetail?.roleName ?? '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Teams</div>
                <div className="text-sm text-slate-700">
                  {userDetail?.teams?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {userDetail.teams.map((t) => (
                        <span
                          key={t.teamId}
                          className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                        >
                          {t.teamName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Status</div>
                <div className="font-medium text-slate-900">
                  {userDetail?.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Last updated</div>
              <div className="text-sm text-slate-700">
                {userDetail?.lastUpdatedDateTime
                  ? format(
                      new Date(userDetail.lastUpdatedDateTime),
                      'MMM d, yyyy HH:mm'
                    )
                  : '-'}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Notes</div>
              <Textarea
                value={localNotes ?? ''}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder="Enter notes about the user"
                readOnly={!canEdit}
                className="mt-2 h-40"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-3">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              {canEdit && (
                <Button
                  onClick={handleSave}
                  disabled={mutation.status === 'pending'}
                >
                  Save
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default UserDetailDrawer;
