import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

import type { UserDetail, UserListItem } from '@corpcal/shared/api/types';
import {
  addUserToTeam,
  fetchRoles,
  fetchTeams,
  fetchUser,
  updateUser,
} from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';

interface UserEditModalProps {
  user: UserListItem;
  onClose: () => void;
  onSaved: () => void;
  onRemoveFromTeam: (userId: number, teamId: number) => void;
}

export function UserEditModal({
  user,
  onClose,
  onSaved,
  onRemoveFromTeam,
}: UserEditModalProps) {
  const [roleId, setRoleId] = useState<string>(String(user.roleId));
  const [notes, setNotes] = useState('');
  const [addTeamId, setAddTeamId] = useState<string>('');
  const [addTeamRole, setAddTeamRole] = useState<'owner' | 'member'>('member');
  const [addTeamNotes, setAddTeamNotes] = useState('');

  const queryClient = useQueryClient();

  const { data: detail, isLoading } = useQuery<UserDetail | null>({
    queryKey: ['user', user.id],
    queryFn: () => fetchUser(user.id),
    enabled: !!user.id,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetchRoles();
      return res;
    },
  });

  const { data: teams = [] } = useQuery({
    queryKey: lookupQueryKeys.teams(),
    queryFn: fetchTeams,
  });

  useEffect(() => {
    if (detail) {
      setRoleId(String(detail.roleId));
      setNotes(detail.notes ?? '');
    }
  }, [detail]);

  const updateMutation = useMutation({
    mutationFn: (body: {
      roleId?: number;
      isActive?: boolean;
      notes?: string | null;
    }) => updateUser(user.id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated', { id: `user-updated-${user.id}` });
      onSaved();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Update failed', {
        id: `user-updated-${user.id}`,
      });
    },
  });

  const addTeamMutation = useMutation({
    mutationFn: (teamId: number) =>
      addUserToTeam(user.id, {
        teamId,
        role: addTeamRole,
        ...(addTeamNotes.trim() && { notes: addTeamNotes.trim() }),
      }),
    onSuccess: (_data, teamId) => {
      void queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User added to team', {
        id: `user-added-to-team-${user.id}-${teamId}`,
      });
      setAddTeamId('');
      setAddTeamNotes('');
    },
    onError: (err: Error, teamId) => {
      toast.error(err.message || 'Add to team failed', {
        id:
          typeof teamId === 'number'
            ? `user-added-to-team-${user.id}-${teamId}`
            : undefined,
      });
    },
  });

  const currentTeamIds = detail?.teams?.map((t) => t.teamId) ?? [];
  const availableTeams = teams.filter((t) => !currentTeamIds.includes(t.id));

  const handleSave = () => {
    const newRoleId = parseInt(roleId, 10);
    if (Number.isNaN(newRoleId)) return;
    updateMutation.mutate({
      roleId: newRoleId,
      notes: notes || null,
    });
  };

  const handleAddToTeam = () => {
    const tid = parseInt(addTeamId, 10);
    if (Number.isNaN(tid)) return;
    addTeamMutation.mutate(tid);
  };

  const displayName =
    user.adDisplayName || user.adUsername || `User ${user.id}`;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit user: {displayName}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                value={user.adEmail ?? ''}
                readOnly
                disabled
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Teams</Label>
              <div className="space-y-2">
                {detail?.teams?.map((t) => (
                  <div
                    key={t.teamId}
                    className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <span>
                      {t.teamName}
                      <span className="ml-2 text-xs text-slate-500">
                        ({t.role})
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFromTeam(user.id, t.teamId)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {availableTeams.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={addTeamId} onValueChange={setAddTeamId}>
                      <SelectTrigger className="min-w-[180px]">
                        <SelectValue placeholder="Add to team..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTeams.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.displayName || t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={addTeamRole}
                      onValueChange={(v) =>
                        setAddTeamRole(v as 'owner' | 'member')
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Notes (optional)"
                      value={addTeamNotes}
                      onChange={(e) => setAddTeamNotes(e.target.value)}
                      className="min-w-[140px]"
                    />
                    <Button
                      size="sm"
                      disabled={!addTeamId}
                      onClick={handleAddToTeam}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-notes">Notes</Label>
              <Input
                id="user-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Admin notes..."
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
