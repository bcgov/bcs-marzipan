import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { UserListItem } from '@corpcal/shared/api/types';
import {
  fetchUserActivities,
  fetchUsers,
  removeUserFromTeam,
  transferActivities,
} from '@/api/usersApi';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface RemoveTeamMemberTarget {
  userId: number;
  userName: string;
  adEmail?: string | null;
}

interface RemoveTeamMemberModalProps {
  open: boolean;
  teamId: number;
  teamName: string;
  member: RemoveTeamMemberTarget | null;
  onClose: () => void;
  onRemoved: () => void;
}

interface UserOption {
  id: number;
  value: string;
  label: string;
}

function userToOption(
  u: UserListItem & {
    adDisplayName?: string | null;
    adUsername?: string | null;
  }
): UserOption {
  return {
    id: u.id,
    value: String(u.id),
    label: u.adDisplayName || u.adUsername || `User ${u.id}`,
  };
}

export function RemoveTeamMemberModal({
  open,
  teamId,
  teamName,
  member,
  onClose,
  onRemoved,
}: RemoveTeamMemberModalProps) {
  const queryClient = useQueryClient();
  const sourceUserId = member?.userId ?? null;

  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [targetUserLabel, setTargetUserLabel] = useState('');
  const [transferCommsLead, setTransferCommsLead] = useState(true);
  const [transferCommsContact, setTransferCommsContact] = useState(true);
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [activitiesDropdownOpen, setActivitiesDropdownOpen] = useState(false);

  const activitiesInitializedForUser = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setTargetUserId(null);
      setTargetUserLabel('');
      setTransferCommsLead(true);
      setTransferCommsContact(true);
      setSelectedActivityIds([]);
      setComboboxOpen(false);
      setUserSearch('');
      setActivitiesDropdownOpen(false);
      activitiesInitializedForUser.current = null;
    }
  }, [open]);

  const {
    data: userActivities = [],
    isLoading: isLoadingActivities,
    isError: isActivitiesError,
  } = useQuery({
    queryKey: ['users', sourceUserId, 'activities'],
    queryFn: () => fetchUserActivities(sourceUserId!),
    enabled: open && sourceUserId != null,
  });

  useEffect(() => {
    if (
      sourceUserId != null &&
      userActivities.length > 0 &&
      activitiesInitializedForUser.current !== sourceUserId
    ) {
      activitiesInitializedForUser.current = sourceUserId;
      setSelectedActivityIds(userActivities.map((a) => a.id));
    }
  }, [sourceUserId, userActivities]);

  const hasActivities = userActivities.length > 0;

  const { data: searchUsers = [], isFetching: isSearchingUsers } = useQuery({
    queryKey: ['users', 'team-member-removal', teamId, userSearch],
    queryFn: () =>
      fetchUsers({
        search: userSearch.trim() || undefined,
        teamIds: [teamId],
      }),
    enabled: open && hasActivities && comboboxOpen && sourceUserId != null,
  });

  const transferTargetOptions = useMemo(() => {
    return searchUsers
      .filter((u) => u.id !== sourceUserId && u.isActive)
      .map((u) => userToOption(u));
  }, [searchUsers, sourceUserId]);

  const toggleActivity = (activityId: number) => {
    setSelectedActivityIds((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  const selectedCount = selectedActivityIds.length;
  const noneSelected = selectedCount === 0;
  const allSelected =
    userActivities.length > 0 && selectedCount === userActivities.length;

  const canSubmit =
    !isLoadingActivities &&
    sourceUserId != null &&
    (!hasActivities ||
      (targetUserId != null &&
        targetUserId !== sourceUserId &&
        (transferCommsLead || transferCommsContact) &&
        selectedCount > 0));

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (sourceUserId == null) {
        throw new Error('No source user selected');
      }

      if (hasActivities) {
        await transferActivities(sourceUserId, {
          targetUserId: targetUserId!,
          activityIds: allSelected ? undefined : selectedActivityIds,
          transferCommsLead,
          transferCommsContact,
        });
      }

      await removeUserFromTeam(sourceUserId, teamId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Team member removed');
      onRemoved();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to remove team member');
    },
  });

  const sourceName =
    member?.userName || (sourceUserId ? `User ${sourceUserId}` : 'User');

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Confirm removal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            {sourceName} will be removed from {teamName} team.
          </p>

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
                <h3 className="text-lg font-semibold">Transfer activities</h3>
                <p className="text-sm text-slate-700">
                  {userActivities.length} active{' '}
                  {userActivities.length === 1 ? 'activity' : 'activities'} must
                  be transferred to another team member.
                </p>
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
                      {targetUserId != null && targetUserLabel
                        ? targetUserLabel
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
                              {transferTargetOptions.map((option) => {
                                const selected = targetUserId === option.id;
                                return (
                                  <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => {
                                      setTargetUserId(option.id);
                                      setTargetUserLabel(option.label);
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

              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transfer-lead"
                    checked={transferCommsLead}
                    onCheckedChange={(checked) =>
                      setTransferCommsLead(checked === true)
                    }
                  />
                  <Label
                    htmlFor="transfer-lead"
                    className="cursor-pointer text-sm font-normal"
                  >
                    Comms lead assignments
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transfer-contact"
                    checked={transferCommsContact}
                    onCheckedChange={(checked) =>
                      setTransferCommsContact(checked === true)
                    }
                  />
                  <Label
                    htmlFor="transfer-contact"
                    className="cursor-pointer text-sm font-normal"
                  >
                    Comms contact (non-lead) assignments
                  </Label>
                </div>
              </div>

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
                    >
                      {selectedCount === 0
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
                      <div className="flex items-center justify-between border-b px-3 py-2 text-sm">
                        <span className="text-muted-foreground">
                          {noneSelected
                            ? 'None selected'
                            : `${selectedCount} selected`}
                        </span>
                        <button
                          type="button"
                          className="text-primary hover:underline focus:underline focus:outline-none"
                          onClick={() => {
                            if (noneSelected) {
                              setSelectedActivityIds(
                                userActivities.map((a) => a.id)
                              );
                            } else {
                              setSelectedActivityIds([]);
                            }
                          }}
                        >
                          {noneSelected ? 'Select all' : 'Deselect all'}
                        </button>
                      </div>
                      <div className="max-h-[240px] overflow-auto p-1">
                        {userActivities.map((activity) => (
                          <div
                            key={activity.id}
                            className="hover:bg-accent flex items-center space-x-2 rounded-sm px-2 py-1.5"
                          >
                            <Checkbox
                              id={`activity-${activity.id}`}
                              checked={selectedActivityIds.includes(
                                activity.id
                              )}
                              onCheckedChange={() =>
                                toggleActivity(activity.id)
                              }
                            />
                            <Label
                              htmlFor={`activity-${activity.id}`}
                              className="flex-1 cursor-pointer text-sm font-normal"
                            >
                              {activity.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={
              !canSubmit || removeMutation.isPending || isActivitiesError
            }
            onClick={() => removeMutation.mutate()}
          >
            {removeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Remove'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RemoveTeamMemberModal;
