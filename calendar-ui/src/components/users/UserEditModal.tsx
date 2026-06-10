import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

import { SYSTEM_ROLE_IDS } from '@corpcal/shared';
import type {
  UpdateUserBody,
  UserDetail,
  UserListItem,
} from '@corpcal/shared/api/types';
import {
  addUserToTeam,
  fetchRoles,
  fetchTeams,
  fetchUser,
  updateUser,
  updateUserSettings,
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
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
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
  const displayInitial = user.adDisplayName || user.adUsername || '';
  const displayParts = displayInitial.split(' ');
  const [firstName, setFirstName] = useState(
    displayParts.slice(0, -1).join(' ') || displayParts[0] || ''
  );
  const [lastName, setLastName] = useState(
    displayParts.length > 1 ? displayParts[displayParts.length - 1] : ''
  );
  const [email, setEmail] = useState<string | null>(user.adEmail ?? '');
  const [phone, setPhone] = useState<string | null>(
    (user as any).phoneNumber ?? ''
  );
  const [jobTitle, setJobTitle] = useState<string | null>(
    (user as any).jobTitle ?? (user as any).adJobTitle ?? ''
  );
  const [isActive, setIsActive] = useState<boolean>(true);
  const [addTeamId, setAddTeamId] = useState<string>('');
  const [addTeamRole, setAddTeamRole] = useState<'owner' | 'member'>('member');
  const [addTeamNotes, setAddTeamNotes] = useState('');
  const [flagColour, setFlagColour] = useState<string>('');

  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Editing personal profile details is limited to admins / sys-admins.
  const canEditProfile =
    currentUser?.roleId === SYSTEM_ROLE_IDS.ADMIN ||
    currentUser?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN;

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
      setFlagColour(detail.flagColour ?? '');
      // populate new simplified fields
      const display = detail.adDisplayName || detail.adUsername || '';
      const parts = display.split(' ');
      setFirstName(parts.slice(0, -1).join(' ') || parts[0] || '');
      setLastName(parts.length > 1 ? parts[parts.length - 1] : '');
      setEmail(detail.adEmail ?? '');
      setPhone(detail.phone ?? '');
      setJobTitle(detail.jobTitle ?? '');
      setIsActive(Boolean(detail.isActive));
    }
  }, [detail]);

  const updateMutation = useMutation({
    mutationFn: (body: UpdateUserBody) => updateUser(user.id, body),
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

  const settingsMutation = useMutation({
    mutationFn: (body: { flagColour: string | null }) =>
      updateUserSettings(user.id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save flag colour', {
        id: `user-settings-${user.id}`,
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

  const selectedRoleId = parseInt(roleId, 10);
  const isAdminOrSysAdmin =
    selectedRoleId === SYSTEM_ROLE_IDS.ADMIN ||
    selectedRoleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN;

  const handleSave = () => {
    const newRoleId = parseInt(roleId, 10);
    if (Number.isNaN(newRoleId)) return;

    const body: UpdateUserBody = {
      roleId: newRoleId,
      notes: notes || null,
      isActive: Boolean(isActive),
    };

    // Profile fields are only editable by admins / sys-admins.
    if (canEditProfile) {
      const combinedName = [firstName, lastName]
        .map((part) => (part ?? '').trim())
        .filter(Boolean)
        .join(' ');
      body.displayName = combinedName || null;
      body.email = (email ?? '').trim() || null;
      body.phone = (phone ?? '').trim() || null;
      body.jobTitle = (jobTitle ?? '').trim() || null;
    }

    updateMutation.mutate(body);

    // Save settings separately if the user is admin/sys-admin and the colour changed
    const savedFlagColour = detail?.flagColour ?? null;
    const newFlagColour = flagColour.trim() || null;
    if (isAdminOrSysAdmin && newFlagColour !== savedFlagColour) {
      settingsMutation.mutate({ flagColour: newFlagColour });
    }
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>First name</Label>
                <Input
                  value={firstName ?? ''}
                  onChange={(e) => setFirstName(e.target.value)}
                  readOnly={!canEditProfile}
                  disabled={!canEditProfile}
                  className={canEditProfile ? undefined : 'bg-slate-50'}
                />
              </div>
              <div className="space-y-2">
                <Label>Last name</Label>
                <Input
                  value={lastName ?? ''}
                  onChange={(e) => setLastName(e.target.value)}
                  readOnly={!canEditProfile}
                  disabled={!canEditProfile}
                  className={canEditProfile ? undefined : 'bg-slate-50'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email ?? ''}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!canEditProfile}
                disabled={!canEditProfile}
                className={canEditProfile ? undefined : 'bg-slate-50'}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={phone ?? ''}
                onChange={(e) => setPhone(e.target.value)}
                readOnly={!canEditProfile}
                disabled={!canEditProfile}
                className={canEditProfile ? undefined : 'bg-slate-50'}
              />
            </div>

            <div className="space-y-2">
              <Label>Job title</Label>
              <Input
                value={jobTitle ?? ''}
                onChange={(e) => setJobTitle(e.target.value)}
                readOnly={!canEditProfile}
                disabled={!canEditProfile}
                className={canEditProfile ? undefined : 'bg-slate-50'}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={isActive}
                onCheckedChange={(v) => setIsActive(Boolean(v))}
              />
              <div className="text-sm">Active</div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              updateMutation.isPending ||
              settingsMutation.isPending ||
              isLoading
            }
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
