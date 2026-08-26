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
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  PERMISSIONS as SHARED_PERMISSIONS,
  SYSTEM_ROLE_IDS,
} from '@corpcal/shared';
import type { UserDetail } from '@corpcal/shared/api/types';
import { fetchRolesPermissionsMap } from '@/api/lookupsApi';
import {
  addUserToTeam,
  fetchRolePermissions,
  fetchRoles,
  fetchTeams,
  fetchUser,
  fetchUserActivities,
  initiatePasswordReset,
  removeUserFromTeam,
  updateUser,
  updateUserSettings,
} from '@/api/usersApi';
import { PageContainer } from '@/components/layout/PageContainer';
import RemoveTeamMemberModal from '@/components/teams/RemoveTeamMemberModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
// removed PageHeader to use a compact header with a Go back link
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TeamsComboboxSelectAllRow } from '@/components/users/TeamsComboboxSelectAllRow';
import { UserChangeLogTabContent } from '@/components/users/UserChangeLogTabContent';
import { UserEditModal } from '@/components/users/UserEditModal';
import { UserTransferTabContent } from '@/components/users/UserTransferTabContent';
import { useAuth } from '@/hooks/useAuth';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';
import { invalidateUserCaches, userQueryKeys } from '@/lib/userQueryKeys';
import type { OptionItem } from '@/schemas/types';

// Permissions are authoritative from the backend; no frontend fallback maintained.

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = Number(id);
  const { hasPermission, user: currentUser } = useAuth();

  const { data: userDetail, isLoading } = useQuery<UserDetail | null>({
    queryKey: userQueryKeys.detail(userId),
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
  const [localTeamIds, setLocalTeamIds] = useState<number[]>([]);
  const teamsComboboxAnchorRef = useComboboxAnchor();

  // Seed the editable fields only once per user. React Query refetches the
  // user (e.g. on window focus, reconnect, or cache invalidation) and returns
  // a fresh object reference each time; re-seeding on every change would
  // silently overwrite unsaved Role/Notes edits with stale server values,
  // causing saves to appear to "fail silently".
  const seededUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userDetail) return;
    if (seededUserIdRef.current === userId) return;
    seededUserIdRef.current = userId;
    setLocalNotes(userDetail.notes ?? '');
    setSelectedRoleId(userDetail.roleId ?? null);
    setDirectLoginEnabled(Boolean(userDetail.directLoginEnabled));
    setFlagColour(userDetail.flagColour ?? null);
    setLocalTeamIds(userDetail.teams.map((t) => t.teamId));
  }, [userDetail, userId]);

  const { data: teams = [] } = useQuery({
    queryKey: lookupQueryKeys.teams(),
    queryFn: fetchTeams,
    enabled: !!userId && !!userDetail,
  });

  const teamOptions = useMemo((): OptionItem[] => {
    const fromLookup = teams.map((t) => ({
      value: String(t.id),
      label: t.displayName ?? t.name ?? `Team ${t.id}`,
    }));
    const knownValues = new Set(fromLookup.map((o) => o.value));
    for (const membership of userDetail?.teams ?? []) {
      const value = String(membership.teamId);
      if (!knownValues.has(value)) {
        fromLookup.push({ value, label: membership.teamName });
        knownValues.add(value);
      }
    }
    return fromLookup;
  }, [teams, userDetail?.teams]);

  const selectedTeamOptions = useMemo(
    () =>
      teamOptions.filter((o) => localTeamIds.includes(parseInt(o.value, 10))),
    [teamOptions, localTeamIds]
  );

  const allSelectableTeamIds = useMemo(
    () => teamOptions.map((o) => parseInt(o.value, 10)),
    [teamOptions]
  );

  const allTeamsSelected =
    allSelectableTeamIds.length > 0 &&
    allSelectableTeamIds.every((id) => localTeamIds.includes(id));

  const mutation = useMutation({
    mutationFn: (payload: { roleId?: number; notes?: string | null }) =>
      updateUser(userId, payload),
    onSuccess: () => {
      invalidateUserCaches(queryClient, userId);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update user');
    },
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [directLoginEnabled, setDirectLoginEnabled] = useState(false);
  const [flagColour, setFlagColour] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'account' | 'transfer' | 'change-log'
  >('account');
  const [resetCodeResult, setResetCodeResult] = useState<{
    code: string;
    expiresInHours?: number;
  } | null>(null);

  const [teamRemovalModal, setTeamRemovalModal] = useState<{
    teamId: number;
    teamName: string;
    teamIdsBeforeRemove: number[];
  } | null>(null);
  const [isProcessingTeamRemove, setIsProcessingTeamRemove] = useState(false);

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
    mutationFn: (body: {
      directLoginEnabled?: boolean;
      flagColour?: string | null;
    }) =>
      updateUserSettings(userId, {
        flagColour: body.flagColour ?? flagColour,
        directLoginEnabled: body.directLoginEnabled,
      }),
    onSuccess: () => {
      invalidateUserCaches(queryClient, userId);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update user settings');
    },
  });

  const canEdit = hasPermission(SHARED_PERMISSIONS.USERS.EDIT);
  const canTransferActivities = hasPermission(
    SHARED_PERMISSIONS.USERS.TRANSFER_ACTIVITIES
  );

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
    setRolesPermissionsMap(normalized);
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

  // Memoize rendered permission items to avoid unnecessary re-renders
  const renderedPermissionItems = useMemo(() => {
    return visibleRows.map((r, i) => (
      <div key={r.key ?? i} className="flex items-start gap-2">
        {r.hasPermission ? (
          <CheckCircle
            className="h-6 w-6 shrink-0 text-green-600"
            aria-hidden
          />
        ) : (
          <XCircle className="h-6 w-6 shrink-0 text-red-600" aria-hidden />
        )}
        <span className="leading-tight">
          {r.displayName ?? r.description ?? r.key}
        </span>
      </div>
    ));
  }, [visibleRows]);

  const syncTeamMembership = async (): Promise<boolean> => {
    if (!userDetail) return true;

    const serverTeamIds = new Set(userDetail.teams.map((t) => t.teamId));
    const toAdd = localTeamIds.filter((id) => !serverTeamIds.has(id));

    if (toAdd.length === 0) return true;

    const results = await Promise.allSettled(
      toAdd.map((teamId) => addUserToTeam(userId, { teamId, role: 'member' }))
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    invalidateUserCaches(queryClient, userId);

    if (failed > 0) {
      toast.error(
        failed === results.length
          ? 'Failed to update team membership'
          : `${failed} team change${failed > 1 ? 's' : ''} failed`
      );
      return false;
    }

    return true;
  };

  const handleTeamSelectionChange = async (selected: OptionItem[]) => {
    if (
      !canEdit ||
      !userDetail ||
      isProcessingTeamRemove ||
      teamRemovalModal != null
    ) {
      return;
    }

    const newIds = selected.map((o) => parseInt(o.value, 10));
    const removed = localTeamIds.filter((id) => !newIds.includes(id));
    const added = newIds.filter((id) => !localTeamIds.includes(id));

    if (removed.length === 0) {
      setLocalTeamIds(newIds);
      return;
    }

    if (removed.length > 1 || added.length > 0) {
      toast.error('Remove one team at a time using the team chips.');
      return;
    }

    const teamId = removed[0];
    const teamName =
      teamOptions.find((o) => parseInt(o.value, 10) === teamId)?.label ??
      `Team ${teamId}`;

    const teamIdsBeforeRemove = localTeamIds;
    setLocalTeamIds(newIds);
    setIsProcessingTeamRemove(true);

    try {
      const activities = await fetchUserActivities(userId, teamId);
      if (activities.length === 0) {
        await removeUserFromTeam(userId, teamId);
        invalidateUserCaches(queryClient, userId);
        toast.success('Removed from team');
      } else {
        setTeamRemovalModal({
          teamId,
          teamName,
          teamIdsBeforeRemove,
        });
      }
    } catch (err) {
      setLocalTeamIds(teamIdsBeforeRemove);
      toast.error(
        err instanceof Error ? err.message : 'Failed to remove from team'
      );
    } finally {
      setIsProcessingTeamRemove(false);
    }
  };

  const handleSave = async () => {
    const body: { roleId?: number; notes?: string | null } = {};
    if (selectedRoleId != null) body.roleId = selectedRoleId;
    body.notes = localNotes || null;

    const serverDirectLoginEnabled = Boolean(userDetail?.directLoginEnabled);

    try {
      await mutation.mutateAsync(body);

      // Persist direct login setting if it changed from the server value
      if (userDetail && serverDirectLoginEnabled !== directLoginEnabled) {
        await settingsMutation.mutateAsync({ directLoginEnabled });
      }

      const teamsSaved = await syncTeamMembership();
      if (!teamsSaved) return;

      void navigate('/users');
    } catch {
      // Errors are surfaced via mutation onError handlers
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

                  <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" aria-hidden />
                      <span className="text-sm text-slate-700">
                        {userDetail.adEmail}
                      </span>
                    </div>
                    {userDetail.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" aria-hidden />
                        <span className="text-sm text-slate-700">
                          {userDetail.phone}
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

          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as 'account' | 'transfer' | 'change-log')
            }
            className="space-y-4"
          >
            <div className="mb-0">
              <TabsList className="mb-0" variant="line" size="med">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="transfer">Transfer</TabsTrigger>
                <TabsTrigger value="change-log">Change log</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="account" className="mt-0 space-y-6">
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
                      {renderedPermissionItems}
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

              <div className="max-w-2xl bg-transparent p-0">
                <div className="font-semibold">User colour</div>

                <div className="mt-2 flex items-center gap-3">
                  <Input
                    type="color"
                    aria-label="User colour"
                    value={flagColour || '#0F6CBD'}
                    onChange={(e) => setFlagColour(e.target.value)}
                    onBlur={() => {
                      if (!canEdit || flagColour === null) return;
                      if (flagColour !== (userDetail?.flagColour ?? null))
                        settingsMutation.mutate({ flagColour });
                    }}
                    disabled={!canEdit}
                    className="h-10 w-16 cursor-pointer p-1"
                  />
                  <div className="text-sm text-slate-500">
                    Flag colour for this user
                  </div>
                </div>
              </div>

              <div className="max-w-2xl bg-transparent p-0">
                <Label className="text-base font-semibold">Teams</Label>
                <div className="mt-2">
                  <Combobox
                    items={teamOptions}
                    multiple
                    value={selectedTeamOptions}
                    onValueChange={(selected: OptionItem[]) => {
                      void handleTeamSelectionChange(selected);
                    }}
                    itemToStringValue={(o: OptionItem) => o.label}
                    disabled={
                      !canEdit ||
                      isProcessingTeamRemove ||
                      teamRemovalModal != null
                    }
                  >
                    <ComboboxChips
                      ref={teamsComboboxAnchorRef}
                      className="w-full"
                    >
                      <ComboboxValue>
                        {(values: OptionItem[]) => (
                          <>
                            {values.map((option) => (
                              <ComboboxChip key={option.value}>
                                {option.label}
                              </ComboboxChip>
                            ))}
                            <ComboboxChipsInput placeholder="Select teams..." />
                          </>
                        )}
                      </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxContent
                      anchor={teamsComboboxAnchorRef}
                      className="popover-list-scroll flex max-h-[min(var(--popover-list-max-height),24rem)] flex-col overflow-x-hidden overflow-y-auto p-0"
                    >
                      <div className="bg-popover px-1 py-1">
                        <TeamsComboboxSelectAllRow
                          allSelected={allTeamsSelected}
                          disabled={!canEdit || teamOptions.length === 0}
                          onToggleSelectAll={() => {
                            if (allTeamsSelected) {
                              toast.error(
                                'Remove one team at a time using the team chips.'
                              );
                              return;
                            }
                            setLocalTeamIds(allSelectableTeamIds);
                          }}
                        />
                        {teamOptions.length > 0 ? (
                          <ComboboxSeparator className="my-1" />
                        ) : null}
                        <ComboboxEmpty>No teams found.</ComboboxEmpty>
                        <ComboboxList className="max-h-none scroll-py-1 overflow-visible p-0 data-empty:p-0">
                          {(option: OptionItem) => (
                            <ComboboxItem key={option.value} value={option}>
                              {option.label}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </div>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </div>

              <div className="max-w-2xl bg-transparent p-0">
                <div className="font-semibold">Direct login</div>

                <div className="mt-2 flex items-center gap-3">
                  <div>
                    <Switch
                      checked={directLoginEnabled}
                      onCheckedChange={(v) => setDirectLoginEnabled(Boolean(v))}
                      disabled={!canEdit}
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
                      if (!canEdit) return;
                      setResetCodeResult({ code: '', expiresInHours: 0 });
                      resetMutation.mutate();
                    }}
                    disabled={!canEdit || resetMutation.status === 'pending'}
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
                          void (async () => {
                            try {
                              if (
                                resetCodeResult?.code &&
                                navigator?.clipboard?.writeText
                              ) {
                                await navigator.clipboard.writeText(
                                  resetCodeResult.code
                                );
                                toast.success('Copied to clipboard');
                              } else {
                                toast.error('Clipboard not available');
                              }
                            } catch {
                              toast.error('Failed to copy to clipboard');
                            }
                          })();
                        }}
                        aria-label="Copy reset code"
                      >
                        Copy
                      </Button>
                    </div>
                  )}
                </div>
              </div>

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
                      onClick={() => void handleSave()}
                      disabled={mutation.status === 'pending'}
                    >
                      Save
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transfer" className="mt-0">
              <UserTransferTabContent
                sourceUser={userDetail}
                canTransfer={canTransferActivities}
              />
            </TabsContent>

            <TabsContent value="change-log" className="mt-0">
              <UserChangeLogTabContent userId={userId} />
            </TabsContent>
          </Tabs>

          {showEditModal && (
            <UserEditModal
              user={userDetail}
              onClose={() => setShowEditModal(false)}
              onSaved={() => setShowEditModal(false)}
            />
          )}

          {teamRemovalModal && userDetail && (
            <RemoveTeamMemberModal
              open
              teamId={teamRemovalModal.teamId}
              teamName={teamRemovalModal.teamName}
              member={{
                userId,
                userName:
                  userDetail.adDisplayName ||
                  userDetail.adUsername ||
                  `User ${userId}`,
                adEmail: userDetail.adEmail,
              }}
              onClose={() => {
                setLocalTeamIds(teamRemovalModal.teamIdsBeforeRemove);
                setTeamRemovalModal(null);
              }}
              onRemoved={() => {
                setTeamRemovalModal(null);
                invalidateUserCaches(queryClient, userId);
              }}
            />
          )}
        </div>
      )}
    </PageContainer>
  );
}
