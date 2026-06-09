import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle,
  Edit,
  Key,
  Mail,
  Phone,
  XCircle,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';

import {
  PERMISSIONS as SHARED_PERMISSIONS,
  SYSTEM_ROLE_IDS,
} from '@corpcal/shared';
import type { UserDetail } from '@corpcal/shared/api/types';
import { fetchRolesPermissionsMap } from '@/api/lookupsApi';
import {
  fetchRolePermissions,
  fetchRoles,
  fetchUser,
  initiatePasswordReset,
  updateUser,
  updateUserSettings,
} from '@/api/usersApi';
import { PageContainer } from '@/components/layout/PageContainer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
// removed PageHeader to use a compact header with a Go back link
import { Button } from '@/components/ui/button';
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

// Permissions are authoritative from the backend; no frontend fallback maintained.

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
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update user');
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

  const [rolePermissionRows, setRolePermissionRows] = useState<
    {
      displayName?: string | null;
      description?: string | null;
      key?: string;
      hasPermission?: boolean;
    }[]
  >([]);
  // rolePermissionRows holds the permission rows for the selected role
  const [rolesPermissionsMap, setRolesPermissionsMap] = useState<
    Record<
      number,
      {
        displayName?: string | null;
        description?: string | null;
        hasPermission: boolean;
      }[]
    >
  >({});

  const {
    data: rolesPermissionsMapData,
    isSuccess: rolesPermissionsMapLoaded,
  } = useQuery<Record<string, any[]>>({
    queryKey: ['roles', 'permissions', 'map'],
    queryFn: fetchRolesPermissionsMap,
    staleTime: 1000 * 60 * 5,
  });

  // populate local cache from bulk endpoint when available
  useEffect(() => {
    if (!rolesPermissionsMapLoaded || !rolesPermissionsMapData) return;
    const normalized: Record<number, any[]> = {};
    for (const k of Object.keys(rolesPermissionsMapData)) {
      const numeric = Number(k);
      normalized[numeric] = rolesPermissionsMapData[k];
    }
    setRolesPermissionsMap((m) => ({ ...normalized, ...m }));
  }, [rolesPermissionsMapLoaded, rolesPermissionsMapData]);

  // Note: do not prefetch permissions for all roles — fetch only for the
  // currently selected role to avoid unnecessary parallel requests.

  useEffect(() => {
    let cancelled = false;
    if (!selectedRoleId) return;

    // Use cached map when available, otherwise fetch single role permissions.
    const cached = rolesPermissionsMap[selectedRoleId];
    if (cached) {
      const rows = cached as any[];
      setRolePermissionRows(rows);
      return;
    }

    void fetchRolePermissions(selectedRoleId)
      .then((rows) => {
        if (cancelled) return;
        setRolePermissionRows(rows);
        setRolesPermissionsMap(
          (m) => ({ ...m, [selectedRoleId]: rows }) as any
        );
      })
      .catch(() => {
        if (cancelled) return;
        setRolePermissionRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRoleId, selectedRoleName, rolesPermissionsMap]);

  const permissionRows = rolePermissionRows;
  const visibleRows = permissionRows;

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
    <PageContainer variant="narrow" className="space-y-6">
      <div className="flex items-center justify-start">
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
      </div>

      {isLoading || !userDetail ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex items-start gap-4">
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
                    <div className="text-sm text-slate-900">
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
                  <div className="mt-1 text-[16px] font-medium text-slate-900">
                    {userDetail.jobTitle}
                  </div>

                  <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" aria-hidden />
                      <span className="text-sm text-slate-700">
                        {userDetail.adEmail}
                      </span>
                    </div>
                    {(userDetail as any).phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" aria-hidden />
                        <span className="text-sm text-slate-700">
                          {(userDetail as any).phoneNumber}
                        </span>
                      </div>
                    )}
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

              {canEdit && (
                <div className="ml-0.5">
                  <Button
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                    className="focus-visible:ring-primary/30 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2"
                    aria-label="Edit user"
                  >
                    <Edit className="h-4 w-4" aria-hidden />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
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
                {visibleRows.length > 0 && (
                  <div className="mt-2 grid grid-cols-1 gap-2 p-2 text-sm text-slate-700 sm:grid-cols-2">
                    {visibleRows.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        {r.hasPermission ? (
                          <CheckCircle
                            className="h-6 w-6 shrink-0 text-green-600"
                            aria-hidden
                          />
                        ) : (
                          <XCircle
                            className="h-6 w-6 shrink-0 text-red-600"
                            aria-hidden
                          />
                        )}
                        <span className="leading-tight">
                          {r.displayName ?? r.description ?? r.key}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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

            {/* role permissions moved directly under Role select */}

            <div className="max-w-2xl bg-transparent p-0">
              <div className="font-semibold">Direct login</div>

              <div className="mt-2 flex items-center gap-3">
                <div>
                  <Switch
                    checked={directLoginEnabled}
                    onCheckedChange={(v) => setDirectLoginEnabled(Boolean(v))}
                  />
                </div>
                <div className="text-sm text-slate-500">
                  Enable direct login
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResetCodeResult({ code: '', expiresInHours: 0 });
                    resetMutation.mutate();
                  }}
                  disabled={resetMutation.status === 'pending'}
                  className="flex items-center gap-2 text-slate-500"
                >
                  <Key className="h-4 w-4" aria-hidden />
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
    </PageContainer>
  );
}
