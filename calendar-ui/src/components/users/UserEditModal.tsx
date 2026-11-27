import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  PERMISSIONS,
  SYSTEM_ROLE_IDS,
  type UserColourKey,
} from '@corpcal/shared';
import type {
  UpdateUserBody,
  UserDetail,
  UserListItem,
  UserPermissionOverrideInput,
} from '@corpcal/shared/api/types';
import {
  fetchRoles,
  fetchUser,
  updateUser,
  updateUserSettings,
} from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UserColourIdentityField } from '@/components/users/UserColourIdentityField';
import { UserRoleField } from '@/components/users/UserRoleField';
import { useAuth } from '@/hooks/useAuth';
import {
  resolveUserDisplayName,
  showEntityToast,
} from '@/lib/user-team-toast-messages';
import { invalidateUserCaches, userQueryKeys } from '@/lib/userQueryKeys';

const GOV_BC_EMAIL_DOMAIN = '@gov.bc.ca';

interface UserEditModalProps {
  user: UserListItem;
  onClose: () => void;
  onSaved: () => void;
}

export function UserEditModal({ user, onClose, onSaved }: UserEditModalProps) {
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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>('');
  const [jobTitle, setJobTitle] = useState<string | null>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isEventPlanner, setIsEventPlanner] = useState<boolean>(false);
  const [permissionOverrideInputs, setPermissionOverrideInputs] = useState<
    UserPermissionOverrideInput[]
  >([]);
  const [userColourKey, setUserColourKey] = useState<UserColourKey>('blue');

  const queryClient = useQueryClient();
  const { user: currentUser, hasPermission, refreshUser } = useAuth();
  const canEditOverrides = hasPermission(PERMISSIONS.USERS.MANAGE_ROLES);

  // Editing personal profile details is limited to admins / sys-admins.
  const canEditProfile =
    currentUser?.roleId === SYSTEM_ROLE_IDS.ADMIN ||
    currentUser?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN;

  const { data: detail, isLoading } = useQuery<UserDetail | null>({
    queryKey: userQueryKeys.detail(user.id),
    queryFn: () => fetchUser(user.id),
    enabled: !!user.id,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const currentUserIsSystemAdmin =
    currentUser?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN;

  const availableRoles = roles.filter((role) => {
    if (!currentUserIsSystemAdmin && role.id === SYSTEM_ROLE_IDS.SYSTEM_ADMIN) {
      return false;
    }
    return true;
  });

  const parsedRoleId = parseInt(roleId, 10);
  const selectedRoleId = Number.isNaN(parsedRoleId) ? null : parsedRoleId;

  useEffect(() => {
    if (detail) {
      setRoleId(String(detail.roleId));
      setNotes(detail.notes ?? '');
      // populate new simplified fields
      const display = detail.adDisplayName || detail.adUsername || '';
      const parts = display.split(' ');
      setFirstName(parts.slice(0, -1).join(' ') || parts[0] || '');
      setLastName(parts.length > 1 ? parts[parts.length - 1] : '');
      setEmail(detail.adEmail ?? '');
      setEmailError(null);
      setPhone(detail.phone ?? '');
      setJobTitle(detail.jobTitle ?? '');
      setIsActive(Boolean(detail.isActive));
      setIsEventPlanner(Boolean(detail.isEventPlanner));
      setUserColourKey(detail.userColourKey);
    }
  }, [detail]);

  const updateMutation = useMutation({
    mutationFn: ({ body }: { body: UpdateUserBody; displayLabel: string }) =>
      updateUser(user.id, body),
    onSuccess: (_data, variables) => {
      invalidateUserCaches(queryClient, user.id);
      showEntityToast('success', 'Updated user', {
        description: variables.displayLabel,
        id: `user-updated-${user.id}`,
      });
    },
    onError: (err: Error, variables) => {
      showEntityToast('error', 'Could not update user', {
        description: variables?.displayLabel
          ? `${variables.displayLabel} — ${err.message || 'Update failed'}`
          : err.message || 'Update failed',
        id: `user-updated-${user.id}`,
      });
    },
  });

  const handleSave = async () => {
    const newRoleId = parseInt(roleId, 10);
    if (Number.isNaN(newRoleId)) return;

    const body: UpdateUserBody = {
      roleId: newRoleId,
      notes: notes || null,
      isActive: Boolean(isActive),
      isEventPlanner,
    };

    // Profile fields are only editable by admins / sys-admins.
    if (canEditProfile) {
      const normalizedEmail = (email ?? '').trim().toLowerCase();
      if (!normalizedEmail) {
        setEmailError('Email is required');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setEmailError('Invalid email format');
        return;
      }
      if (!normalizedEmail.endsWith(GOV_BC_EMAIL_DOMAIN)) {
        setEmailError('Email must be a @gov.bc.ca address');
        return;
      }

      const combinedName = [firstName, lastName]
        .map((part) => (part ?? '').trim())
        .filter(Boolean)
        .join(' ');
      body.displayName = combinedName || null;
      body.email = normalizedEmail;
      body.phone = (phone ?? '').trim() || null;
      body.jobTitle = (jobTitle ?? '').trim() || null;
    }

    if (permissionOverrideInputs.length > 0) {
      body.permissionOverrides = permissionOverrideInputs;
    }

    const combinedName = [firstName, lastName]
      .map((part) => (part ?? '').trim())
      .filter(Boolean)
      .join(' ');
    const displayLabel =
      canEditProfile && combinedName
        ? combinedName
        : resolveUserDisplayName(user);

    const colourChanged =
      detail != null && userColourKey !== detail.userColourKey;

    try {
      await updateMutation.mutateAsync({ body, displayLabel });
    } catch {
      return;
    }

    if (colourChanged) {
      try {
        await updateUserSettings(user.id, { userColourKey });
        invalidateUserCaches(queryClient, user.id);
        if (currentUser?.id === user.id) {
          await refreshUser();
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not update user colour';
        showEntityToast('error', 'Could not update user colour', {
          description: message,
          id: `user-colour-updated-${user.id}`,
        });
        return;
      }
    }

    onSaved();
  };

  const displayName = resolveUserDisplayName(user);
  const previewAssigneeName =
    [firstName, lastName]
      .map((part) => (part ?? '').trim())
      .filter(Boolean)
      .join(' ') ||
    detail?.adDisplayName ||
    detail?.adUsername ||
    displayName;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Identity: {displayName}</DialogTitle>
          <DialogDescription>
            Profile details and how this user appears in CorpCal (avatar and
            activity flags).
          </DialogDescription>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                readOnly={!canEditProfile}
                disabled={!canEditProfile}
                className={canEditProfile ? undefined : 'bg-slate-50'}
              />
              {emailError ? (
                <p className="text-destructive text-sm font-medium">
                  {emailError}
                </p>
              ) : null}
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
                id="user-event-planner"
                checked={isEventPlanner}
                onCheckedChange={(v) => setIsEventPlanner(Boolean(v))}
              />
              <Label htmlFor="user-event-planner" className="text-sm">
                Event planner
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <UserRoleField
                roles={availableRoles}
                value={roleId}
                onValueChange={setRoleId}
                roleId={selectedRoleId}
                savedRoleId={detail?.roleId}
                existingOverrides={detail?.permissionOverrides}
                canEditOverrides={canEditOverrides}
                onPermissionChange={setPermissionOverrideInputs}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={isActive}
                onCheckedChange={(v) => setIsActive(Boolean(v))}
              />
              <div className="text-sm">Active</div>
            </div>

            <UserColourIdentityField
              id="edit-user-colour"
              value={userColourKey}
              onChange={setUserColourKey}
              previewAssigneeName={previewAssigneeName}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={updateMutation.isPending || isLoading}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
