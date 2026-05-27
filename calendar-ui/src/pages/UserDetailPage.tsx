import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';

import {
  PERMISSIONS as SHARED_PERMISSIONS,
  SYSTEM_ROLE_IDS,
} from '@corpcal/shared';
import type { UserDetail } from '@corpcal/shared/api/types';
import {
  fetchRolePermissions,
  fetchRoles,
  fetchUser,
  initiatePasswordReset,
  updateUser,
  updateUserSettings,
} from '@/api/usersApi';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
// removed PageHeader to use a compact header with a Go back link
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { UserEditModal } from '@/components/users/UserEditModal';
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

  const queryClient = useQueryClient();

  const [localNotes, setLocalNotes] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  useEffect(() => {
    if (!userDetail) return;
    setLocalNotes(userDetail.notes ?? '');
    setSelectedRoleId(userDetail.roleId ?? null);
    setDirectLoginEnabled(Boolean(userDetail.directLoginEnabled));
  }, [userDetail]);

  const mutation = useMutation({
    mutationFn: (payload: { roleId?: number; notes?: string | null }) =>
      updateUser(userId, payload),
    onSuccess: () => {
      void navigate('/users');
    },
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [directLoginEnabled, setDirectLoginEnabled] = useState(false);
  const [resetCodeResult, setResetCodeResult] = useState<{
    code: string;
    expiresInHours?: number;
  } | null>(null);

  const resetMutation = useMutation({
    mutationFn: () => initiatePasswordReset(userId),
    onSuccess: (data) => {
      setResetCodeResult({
        code: data.resetCode,
        expiresInHours: data.expiresInHours,
      });
      toast.success('Temporary login code generated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to generate temporary login code');
    },
  });

  const settingsMutation = useMutation({
    mutationFn: (body: { directLoginEnabled?: boolean }) =>
      updateUserSettings(userId, {
        flagColour: userDetail?.flagColour ?? null,
        directLoginEnabled: body.directLoginEnabled,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', userId] });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update user settings');
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

  const [rolePermissionList, setRolePermissionList] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setRolePermissionList([]);
    if (!selectedRoleId) return;
    void fetchRolePermissions(selectedRoleId)
      .then((rows) => {
        if (cancelled) return;
        const descriptions = rows
          .map((r) => r.description ?? r.key)
          .filter(Boolean);
        if (descriptions.length > 0) setRolePermissionList(descriptions);
        else setRolePermissionList(ROLE_PERMISSIONS[selectedRoleName] ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setRolePermissionList(ROLE_PERMISSIONS[selectedRoleName] ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRoleId, selectedRoleName]);

  const permissionList = rolePermissionList;

  const handleSave = () => {
    const body: { roleId?: number; notes?: string | null } = {};
    if (selectedRoleId != null) body.roleId = selectedRoleId;
    body.notes = localNotes || null;
    mutation.mutate(body);

    // Persist direct login setting if it changed from the server value
    if (userDetail && userDetail.directLoginEnabled !== directLoginEnabled) {
      settingsMutation.mutate({ directLoginEnabled });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void navigate('/users')}
          className="shrink-0 gap-2"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Go back
        </Button>

        {canEdit ? (
          <Button onClick={() => setShowEditModal(true)}>Edit</Button>
        ) : (
          <div />
        )}
      </div>

      {isLoading || !userDetail ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg font-semibold">
                  {(userDetail.adDisplayName || userDetail.adUsername || '')
                    .split(' ')
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl leading-tight font-semibold">
                  {userDetail.adDisplayName || userDetail.adUsername}
                </h2>
                <div className="mt-1">
                  <div className="text-sm text-slate-600">
                    {userDetail.roleName}
                  </div>
                  <div className="mt-2">
                    <Badge
                      variant={userDetail.isActive ? 'success' : 'outline'}
                    >
                      {userDetail.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="mt-1 text-[16px] font-medium text-pink-600">
                  {userDetail.jobTitle}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Last login:{' '}
                  {userDetail.lastLoginDateTime
                    ? format(
                        new Date(userDetail.lastLoginDateTime),
                        'MMM d, yyyy HH:mm'
                      )
                    : '-'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  value={userDetail.adEmail ?? ''}
                  readOnly
                  disabled
                  className="w-full bg-slate-50"
                />
              </div>

              <div>
                <Label>Role</Label>
                <Select
                  value={selectedRoleId ? String(selectedRoleId) : ''}
                  onValueChange={(v) => setSelectedRoleId(Number(v) || null)}
                >
                  <SelectTrigger className="w-full">
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

            <div className="max-w-2xl rounded border border-slate-200 bg-slate-50 p-6">
              <div className="text-base font-medium">Role permissions</div>
              {permissionList.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Permissions not available for this role.
                </p>
              ) : (
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-normal text-slate-700">
                  {permissionList.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="max-w-2xl rounded border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Direct login</div>
                  <div className="text-sm text-slate-500">
                    Enable direct login (email + password)
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={directLoginEnabled}
                    onCheckedChange={(v) => setDirectLoginEnabled(Boolean(v))}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setResetCodeResult({ code: '', expiresInHours: 0 });
                    resetMutation.mutate();
                  }}
                  disabled={resetMutation.status === 'pending'}
                >
                  Generate temporary password
                </Button>
                {resetCodeResult?.code && (
                  <div className="bg-muted flex items-center gap-2 rounded-md border px-4 py-2">
                    <code className="font-mono text-sm break-all select-all">
                      {resetCodeResult.code}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        void navigator.clipboard.writeText(
                          resetCodeResult.code
                        );
                        toast.success('Copied to clipboard');
                      }}
                      aria-label="Copy reset code"
                    >
                      Copy
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="pt-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => void navigate('/users')}
              >
                Cancel
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

          {showEditModal && (
            <UserEditModal
              user={userDetail}
              onClose={() => setShowEditModal(false)}
              onSaved={() => {
                void queryClient.invalidateQueries({
                  queryKey: ['user', userId],
                });
                void queryClient.invalidateQueries({ queryKey: ['users'] });
                setShowEditModal(false);
              }}
              onRemoveFromTeam={() => {
                /* noop for modal usage here */
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
