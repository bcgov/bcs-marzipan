import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import {
  PERMISSIONS as SHARED_PERMISSIONS,
  SYSTEM_ROLE_IDS,
} from '@corpcal/shared';
import type { UserDetail } from '@corpcal/shared/api/types';
import { fetchRoles, fetchUser, updateUser } from '@/api/usersApi';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';

// Static mapping of common role names to human-readable permission lists.
const ROLE_PERMISSIONS: Record<string, string[]> = {
  Viewer: [
    'Can view activities visible to their team',
    'Cannot edit activities',
    'Can view and export reports',
  ],
  Editor: [
    'Can view and edit activities visible to their team',
    'Can view, edit, and export reports',
    'Cannot view and edit system settings',
  ],
  'Advanced viewer': [
    'Can view all activities',
    'Cannot edit activities',
    'Can view and export reports',
  ],
  'Advanced editor': [
    'Can view, edit, delete, and restore all activities',
    'Can view, edit, and export reports',
  ],
  'Admin / System admin': [
    'Can view, edit, delete, and restore all activities',
    'Can view, edit, and deactivate users, user roles, and teams',
    'Can view and edit system settings',
  ],
};

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = Number(id);
  const { hasPermission, user: currentUser } = useAuth();

  const { data: userDetail, isLoading } = useQuery<UserDetail | null>({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const [localNotes, setLocalNotes] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  useEffect(() => {
    if (!userDetail) return;
    setLocalNotes(userDetail.notes ?? '');
    setSelectedRoleId(userDetail.roleId ?? null);
  }, [userDetail]);

  const mutation = useMutation({
    mutationFn: (payload: { roleId?: number; notes?: string | null }) =>
      updateUser(userId, payload),
    onSuccess: () => {
      void navigate('/users');
    },
  });

  const canEdit = hasPermission(SHARED_PERMISSIONS.USERS.EDIT);

  // Only allow assigning the system-admin role if current user is (likely) a system admin.
  // We conservatively check currentUser?.roleId against known SYSTEM_ROLE_IDS.
  const currentUserIsSystemAdmin = Boolean(
    (currentUser as any)?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN
  );

  const availableRoles = useMemo(() => {
    return roles.filter((r) => {
      if (!currentUserIsSystemAdmin && r.id === SYSTEM_ROLE_IDS.SYSTEM_ADMIN)
        return false;
      return true;
    });
  }, [roles, currentUserIsSystemAdmin]);

  const selectedRoleName =
    roles.find((r) => r.id === selectedRoleId)?.name ?? '';
  const permissionList = ROLE_PERMISSIONS[selectedRoleName] ?? [];

  const handleSave = () => {
    const body: { roleId?: number; notes?: string | null } = {};
    if (selectedRoleId != null) body.roleId = selectedRoleId;
    body.notes = localNotes || null;
    mutation.mutate(body);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User details"
        description="View and edit user details"
        action={null}
      />

      {isLoading || !userDetail ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {userDetail.adDisplayName || userDetail.adUsername}
              </h2>
              <div className="text-sm text-slate-500">
                {userDetail.roleName}
              </div>
              <div className="text-xs text-slate-400">
                Last updated:{' '}
                {userDetail.lastUpdatedDateTime
                  ? format(
                      new Date(userDetail.lastUpdatedDateTime),
                      'MMM d, yyyy HH:mm'
                    )
                  : '-'}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => void navigate('/users')}
              >
                Back
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

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  value={userDetail.adEmail ?? ''}
                  readOnly
                  disabled
                  className="bg-slate-50"
                />
              </div>

              <div>
                <Label>Role</Label>
                <Select
                  value={selectedRoleId ? String(selectedRoleId) : ''}
                  onValueChange={(v) => setSelectedRoleId(Number(v) || null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  readOnly={!canEdit}
                  className="h-40"
                />
              </div>
            </div>

            <div>
              <div className="rounded border border-slate-200 bg-slate-50 p-4">
                <div className="font-medium">Role permissions</div>
                {permissionList.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Permissions not available for this role.
                  </p>
                ) : (
                  <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
                    {permissionList.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
