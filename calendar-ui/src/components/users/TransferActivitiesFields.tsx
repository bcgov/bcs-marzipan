import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  RemoveUserFromTeamBody,
  TransferActivitiesBody,
  UserListItem,
} from '@corpcal/shared/api/types';
import { USER_NOTES_MAX_LENGTH } from '@corpcal/shared/schemas';
import {
  fetchTeams,
  fetchUserActivities,
  fetchUsers,
  type UserActivityItem,
} from '@/api/usersApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type TransferActivitiesMode = 'transfer' | 'removal';

export interface FromTeamOption {
  teamId: number;
  teamName: string;
}

export interface TransferActivitiesDraft {
  fromTeamId: number | null;
  /** Null means "same as fromTeamId" until the user explicitly picks a different team. */
  toTeamId: number | null;
  targetUserId: number | null;
  targetUserLabel: string;
  selectedActivityIds: number[];
  includeNonLead: boolean;
  notes: string;
}

export function createInitialTransferDraft(
  fromTeamId: number | null = null
): TransferActivitiesDraft {
  return {
    fromTeamId,
    toTeamId: null,
    targetUserId: null,
    targetUserLabel: '',
    selectedActivityIds: [],
    includeNonLead: false,
    notes: '',
  };
}

export interface TransferActivitiesFieldsMeta {
  activities: UserActivityItem[];
  isLoading: boolean;
  isError: boolean;
}

export type TransferActivitiesDraftUpdater =
  | TransferActivitiesDraft
  | ((prev: TransferActivitiesDraft) => TransferActivitiesDraft);

interface TransferActivitiesFieldsProps {
  mode: TransferActivitiesMode;
  sourceUserId: number;
  /** Teams the source user can transfer from (transfer mode). Ignored when `fixedFromTeamId` is set. */
  fromTeamOptions: FromTeamOption[];
  /** Locks the "from team" picker (removal mode: the team being removed). */
  fixedFromTeamId?: number;
  fixedFromTeamName?: string;
  value: TransferActivitiesDraft;
  onChange: (next: TransferActivitiesDraftUpdater) => void;
  /** Show the free-text notes field. Defaults to true for transfer mode, false for removal. */
  showNotes?: boolean;
  onMetaChange?: (meta: TransferActivitiesFieldsMeta) => void;
  /** Used for empty-state copy when the user has no scoped comms assignments (transfer mode). */
  sourceDisplayName?: string;
}

function userToOption(u: UserListItem) {
  return {
    id: u.id,
    value: String(u.id),
    label: u.adDisplayName || u.adUsername || `User ${u.id}`,
  };
}

/**
 * Shared "transfer activities" form fragment used by the RemoveTeamMemberModal
 * (removal mode) and UserTransferTabContent / TransferActivitiesDialog (transfer
 * mode). Owns the from/to team pickers, target-user search, scoped activities
 * list, and the "include non-lead" toggle. Callers own submit/cancel actions
 * and read `value` to build the API payload (see `buildTransferActivitiesBody`
 * / `buildRemoveUserFromTeamBody`).
 */
export function TransferActivitiesFields({
  mode,
  sourceUserId,
  fromTeamOptions,
  fixedFromTeamId,
  fixedFromTeamName,
  value,
  onChange,
  showNotes = mode === 'transfer',
  onMetaChange,
  sourceDisplayName,
}: TransferActivitiesFieldsProps) {
  const isRemoval = mode === 'removal';
  const fromTeamId = fixedFromTeamId ?? value.fromTeamId;
  const toTeamId = value.toTeamId ?? fromTeamId;
  const crossTeam =
    toTeamId != null && fromTeamId != null && toTeamId !== fromTeamId;

  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [activitiesDropdownOpen, setActivitiesDropdownOpen] = useState(false);
  const initializedForKey = useRef<string | null>(null);

  const {
    data: userActivities = [],
    isLoading: isLoadingActivities,
    isError: isActivitiesError,
  } = useQuery({
    queryKey: ['users', sourceUserId, 'activities', fromTeamId],
    queryFn: () => fetchUserActivities(sourceUserId, fromTeamId ?? undefined),
    enabled: fromTeamId != null,
  });

  useEffect(() => {
    onMetaChange?.({
      activities: userActivities,
      isLoading: isLoadingActivities,
      isError: isActivitiesError,
    });
    // onMetaChange identity is expected to be stable from the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userActivities, isLoadingActivities, isActivitiesError]);

  // (Re)select every scoped activity whenever the from-team (and therefore the
  // scoped activity set) changes. Removal mode keeps all activities selected
  // permanently (selection is not user-editable there).
  useEffect(() => {
    if (fromTeamId == null) return;
    const key = String(fromTeamId);
    if (!isRemoval && initializedForKey.current === key) return;
    initializedForKey.current = key;
    onChange((prev) => ({
      ...prev,
      selectedActivityIds: userActivities.map((a) => a.id),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromTeamId, userActivities, isRemoval]);

  const { data: allTeams = [] } = useQuery({
    queryKey: ['teams', 'all-for-transfer'],
    queryFn: fetchTeams,
  });

  const { data: searchUsers = [], isFetching: isSearchingUsers } = useQuery({
    queryKey: ['users', 'transfer-target', toTeamId, userSearch],
    queryFn: () =>
      fetchUsers({
        search: userSearch.trim() || undefined,
        teamIds: toTeamId != null ? [toTeamId] : undefined,
      }),
    enabled: comboboxOpen && toTeamId != null,
  });

  const targetOptions = useMemo(
    () =>
      searchUsers
        .filter((u) => u.id !== sourceUserId && u.isActive)
        .map(userToOption),
    [searchUsers, sourceUserId]
  );

  const hasActivities = userActivities.length > 0;
  const selectedCount = value.selectedActivityIds.length;
  const noneSelected = selectedCount === 0;

  const toggleActivity = (activityId: number) => {
    if (isRemoval) return;
    const next = value.selectedActivityIds.includes(activityId)
      ? value.selectedActivityIds.filter((id) => id !== activityId)
      : [...value.selectedActivityIds, activityId];
    onChange({ ...value, selectedActivityIds: next });
  };

  const toTeamOptions =
    allTeams.length > 0
      ? allTeams.map((t) => ({
          teamId: t.id,
          teamName: t.displayName || t.name,
        }))
      : fromTeamOptions;

  const fromTeamName =
    fixedFromTeamName ??
    fromTeamOptions.find((t) => t.teamId === fromTeamId)?.teamName;

  if (fromTeamId == null) {
    return null;
  }

  return (
    <div className="space-y-4">
      {!fixedFromTeamId && fromTeamOptions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Transfer from team{' '}
            <span className="text-required-field-indicator font-semibold">
              *
            </span>
          </Label>
          <Select
            value={String(fromTeamId)}
            onValueChange={(v) => {
              initializedForKey.current = null;
              onChange({
                ...createInitialTransferDraft(Number(v)),
                notes: value.notes,
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select team..." />
            </SelectTrigger>
            <SelectContent>
              {fromTeamOptions.map((t) => (
                <SelectItem key={t.teamId} value={String(t.teamId)}>
                  {t.teamName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {fixedFromTeamId != null && fixedFromTeamName && (
        <p className="text-sm text-slate-700">
          Removing from <span className="font-medium">{fixedFromTeamName}</span>
          .
        </p>
      )}

      {isLoadingActivities ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : isActivitiesError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not load assigned activities. Please try again.
        </div>
      ) : hasActivities ? (
        <>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Transfer activities</h3>
            <p className="text-sm text-slate-700">
              {userActivities.length} active{' '}
              {userActivities.length === 1 ? 'activity' : 'activities'} led by{' '}
              {fromTeamName ?? 'this team'} where this user is a comms contact.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Transfer to team</Label>
            <Select
              value={String(toTeamId)}
              onValueChange={(v) =>
                onChange({
                  ...value,
                  toTeamId: Number(v),
                  targetUserId: null,
                  targetUserLabel: '',
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select team..." />
              </SelectTrigger>
              <SelectContent>
                {toTeamOptions.map((t) => (
                  <SelectItem key={t.teamId} value={String(t.teamId)}>
                    {t.teamName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {crossTeam && (
              <p className="text-xs text-amber-700">
                Moving to a different team updates each affected activity&apos;s
                lead team (and its ministry / display ID). Visibility and
                sharing are unchanged.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Transfer to user{' '}
              <span className="text-required-field-indicator font-semibold">
                *
              </span>
            </Label>
            <Popover
              open={comboboxOpen}
              onOpenChange={(nextOpen) => {
                setComboboxOpen(nextOpen);
                if (!nextOpen) setUserSearch('');
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between font-normal"
                >
                  {value.targetUserId != null && value.targetUserLabel
                    ? value.targetUserLabel
                    : 'Select user...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                align="start"
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search users..."
                    value={userSearch}
                    onValueChange={setUserSearch}
                  />
                  <CommandList>
                    {isSearchingUsers ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                          {targetOptions.map((option) => {
                            const selected = value.targetUserId === option.id;
                            return (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => {
                                  onChange({
                                    ...value,
                                    targetUserId: option.id,
                                    targetUserLabel: option.label,
                                  });
                                  setUserSearch('');
                                  setComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    selected ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {option.label}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-non-lead"
              checked={value.includeNonLead}
              onCheckedChange={(checked) =>
                onChange({ ...value, includeNonLead: checked === true })
              }
            />
            <Label
              htmlFor="include-non-lead"
              className="cursor-pointer text-sm font-normal"
            >
              Include non-lead (comms contact) assignments
            </Label>
          </div>
          <p className="text-muted-foreground text-xs">
            {isRemoval
              ? 'Lead assignments always transfer. Non-lead assignments transfer when checked, otherwise they are removed.'
              : 'Lead assignments always transfer for selected activities. Non-lead assignments transfer when checked, otherwise they are left as-is (or removed if no longer eligible after a cross-team move).'}
          </p>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Activities{' '}
              <span className="text-required-field-indicator font-semibold">
                *
              </span>
            </Label>
            <Popover
              open={activitiesDropdownOpen}
              onOpenChange={setActivitiesDropdownOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={activitiesDropdownOpen}
                  className="w-full justify-between font-normal"
                  disabled={isRemoval}
                >
                  {isRemoval
                    ? `All ${userActivities.length} activities (required)`
                    : selectedCount === 0
                      ? 'No activities selected'
                      : `${selectedCount} activities selected`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                align="start"
              >
                <div className="flex flex-col">
                  {!isRemoval && (
                    <div className="flex items-center justify-between border-b px-3 py-2 text-sm">
                      <span className="text-muted-foreground">
                        {noneSelected
                          ? 'None selected'
                          : `${selectedCount} selected`}
                      </span>
                      <button
                        type="button"
                        className="text-primary hover:underline focus:underline focus:outline-none"
                        onClick={() =>
                          onChange({
                            ...value,
                            selectedActivityIds: noneSelected
                              ? userActivities.map((a) => a.id)
                              : [],
                          })
                        }
                      >
                        {noneSelected ? 'Select all' : 'Deselect all'}
                      </button>
                    </div>
                  )}
                  <div className="max-h-[240px] overflow-auto p-1">
                    {userActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="hover:bg-accent flex items-center space-x-2 rounded-sm px-2 py-1.5"
                      >
                        <Checkbox
                          id={`activity-${activity.id}`}
                          checked={
                            isRemoval ||
                            value.selectedActivityIds.includes(activity.id)
                          }
                          disabled={isRemoval}
                          onCheckedChange={() => toggleActivity(activity.id)}
                        />
                        <Label
                          htmlFor={`activity-${activity.id}`}
                          className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-normal"
                        >
                          <span className="flex-1">{activity.label}</span>
                          {activity.isLead && (
                            <Badge variant="secondary" className="shrink-0">
                              Lead
                            </Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {showNotes && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                value={value.notes}
                onChange={(e) => onChange({ ...value, notes: e.target.value })}
                placeholder="Reason for transfer..."
                className="min-h-[120px]"
                maxLength={USER_NOTES_MAX_LENGTH}
              />
            </div>
          )}
        </>
      ) : (
        !isRemoval &&
        sourceDisplayName &&
        fromTeamName && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No activities to transfer. {sourceDisplayName} is not comms contact
            on any {fromTeamName} activities.
          </p>
        )
      )}
    </div>
  );
}

/** True when the current draft satisfies the minimum requirements to submit. */
export function isTransferActivitiesDraftValid(
  draft: TransferActivitiesDraft,
  sourceUserId: number,
  hasActivities: boolean
): boolean {
  if (!hasActivities) return true;
  if (draft.fromTeamId == null) return false;
  if (draft.targetUserId == null || draft.targetUserId === sourceUserId) {
    return false;
  }
  return draft.selectedActivityIds.length > 0;
}

/** True when the selected activities/options would change comms or lead team. */
export function wouldTransferDraftHaveEffect(
  draft: TransferActivitiesDraft,
  scopedActivities: UserActivityItem[]
): boolean {
  if (draft.fromTeamId == null || draft.selectedActivityIds.length === 0) {
    return false;
  }
  const toTeamId = draft.toTeamId ?? draft.fromTeamId;
  const crossTeam = toTeamId !== draft.fromTeamId;
  const selected = new Set(draft.selectedActivityIds);
  const rows = scopedActivities.filter((a) => selected.has(a.id));
  if (rows.length === 0) return false;
  if (crossTeam) return true;
  return rows.some((row) => row.isLead || draft.includeNonLead);
}

/** True when the draft matches the default state after load or reset for the current scope. */
export function isTransferActivitiesDraftPristine(
  draft: TransferActivitiesDraft,
  scopedActivityIds: number[]
): boolean {
  if (draft.fromTeamId == null) return true;

  const effectiveToTeamId = draft.toTeamId ?? draft.fromTeamId;
  if (effectiveToTeamId !== draft.fromTeamId) return false;
  if (draft.targetUserId != null || draft.targetUserLabel !== '') return false;
  if (draft.includeNonLead) return false;
  if (draft.notes.trim() !== '') return false;

  if (scopedActivityIds.length === 0) {
    return draft.selectedActivityIds.length === 0;
  }

  if (draft.selectedActivityIds.length !== scopedActivityIds.length) {
    return false;
  }
  const scopedSet = new Set(scopedActivityIds);
  return draft.selectedActivityIds.every((id) => scopedSet.has(id));
}

/** Builds the POST /users/:id/transfer-activities request body from a draft. */
export function buildTransferActivitiesBody(
  draft: TransferActivitiesDraft,
  allScopedActivityIds: number[]
): TransferActivitiesBody {
  if (draft.fromTeamId == null || draft.targetUserId == null) {
    throw new Error(
      'fromTeamId and targetUserId are required to transfer activities'
    );
  }
  if (
    allScopedActivityIds.length > 0 &&
    draft.selectedActivityIds.length === 0
  ) {
    throw new Error('At least one activity must be selected to transfer');
  }
  const toTeamId = draft.toTeamId ?? draft.fromTeamId;
  const allSelected =
    allScopedActivityIds.length > 0 &&
    draft.selectedActivityIds.length === allScopedActivityIds.length;

  return {
    targetUserId: draft.targetUserId,
    fromTeamId: draft.fromTeamId,
    toTeamId: toTeamId !== draft.fromTeamId ? toTeamId : undefined,
    activityIds: allSelected ? undefined : draft.selectedActivityIds,
    includeNonLead: draft.includeNonLead,
    notes: draft.notes.trim() || undefined,
  };
}

/**
 * Builds the DELETE /users/:id/teams/:teamId request body from a draft.
 * Returns `undefined` for a silent removal (no scoped comms assignments).
 */
export function buildRemoveUserFromTeamBody(
  draft: TransferActivitiesDraft,
  hasActivities: boolean
): RemoveUserFromTeamBody | undefined {
  if (!hasActivities) return undefined;
  if (draft.fromTeamId == null || draft.targetUserId == null) {
    throw new Error('targetUserId is required to transfer comms assignments');
  }
  const toTeamId = draft.toTeamId ?? draft.fromTeamId;

  return {
    targetUserId: draft.targetUserId,
    toTeamId: toTeamId !== draft.fromTeamId ? toTeamId : undefined,
    includeNonLead: draft.includeNonLead,
    notes: draft.notes.trim() || undefined,
  };
}
