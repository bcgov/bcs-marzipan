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
import { fetchUser, updateUser } from '@/api/usersApi';
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

  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Editing personal profile details is limited to admins / sys-admins.
  const canEditProfile =
    currentUser?.roleId === SYSTEM_ROLE_IDS.ADMIN ||
    currentUser?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN;

  const { data: detail, isLoading } = useQuery<UserDetail | null>({
    queryKey: userQueryKeys.detail(user.id),
    queryFn: () => fetchUser(user.id),
    enabled: !!user.id,
  });

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
    }
  }, [detail]);

  const updateMutation = useMutation({
    mutationFn: (body: UpdateUserBody) => updateUser(user.id, body),
    onSuccess: () => {
      invalidateUserCaches(queryClient, user.id);
      toast.success('User updated', { id: `user-updated-${user.id}` });
      onSaved();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Update failed', {
        id: `user-updated-${user.id}`,
      });
    },
  });

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

    updateMutation.mutate(body);
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
            disabled={updateMutation.isPending || isLoading}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
