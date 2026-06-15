import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { UserDetail, UserListItem } from '@corpcal/shared/api/types';
import {
  fetchUserActivities,
  fetchUsers,
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
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TransferActivitiesTabProps {
  user: UserDetail;
  onCancel: () => void;
  onTransferred: () => void;
}

interface UserOption {
  id: number;
  label: string;
  value: string;
}

function userToOption(u: UserListItem): UserOption {
  return {
    id: u.id,
    value: String(u.id),
    label: u.adDisplayName || u.adUsername || `User ${u.id}`,
  };
}

export function TransferActivitiesTab({
  user,
  onCancel,
  onTransferred,
}: TransferActivitiesTabProps) {
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [targetUserLabel, setTargetUserLabel] = useState<string>('');
  const [transferCommsLead, setTransferCommsLead] = useState(true);
  const [transferCommsContact, setTransferCommsContact] = useState(true);
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [activitiesDropdownOpen, setActivitiesDropdownOpen] = useState(false);
  const activitiesInitializedForUser = useRef<number | null>(null);

  const queryClient = useQueryClient();

  const { data: searchUsers = [], isFetching: isSearching } = useQuery({
    queryKey: ['users', userSearch],
    queryFn: () => fetchUsers({ search: userSearch.trim() || undefined }),
    enabled: comboboxOpen,
  });

  // Activities can only be transferred to users who share at least one team
  // with the user being viewed.
  const sourceTeamIds = useMemo(
    () => new Set((user.teams ?? []).map((t) => t.teamId)),
    [user.teams]
  );

  const userOptions: UserOption[] = useMemo(() => {
    return searchUsers
      .filter(
        (u) =>
          u.id !== user.id &&
          u.isActive &&
          (u.teams ?? []).some((t) => sourceTeamIds.has(t.teamId))
      )
      .map((u) => userToOption(u));
  }, [searchUsers, user.id, sourceTeamIds]);

  const { data: userActivities = [] } = useQuery({
    queryKey: ['users', user.id, 'activities'],
    queryFn: () => fetchUserActivities(user.id),
  });

  useEffect(() => {
    if (
      userActivities.length > 0 &&
      activitiesInitializedForUser.current !== user.id
    ) {
      activitiesInitializedForUser.current = user.id;
      setSelectedActivityIds(userActivities.map((a) => a.id));
    }
  }, [user.id, userActivities]);

  const toggleActivity = (activityId: number) => {
    setSelectedActivityIds((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  const selectAllActivities = () => {
    setSelectedActivityIds(userActivities.map((a) => a.id));
  };

  const deselectAllActivities = () => {
    setSelectedActivityIds([]);
  };

  const selectedCount = selectedActivityIds.length;
  const allSelected =
    userActivities.length > 0 && selectedCount === userActivities.length;
  const noneSelected = selectedCount === 0;

  const transferMutation = useMutation({
    mutationFn: () =>
      transferActivities(user.id, {
        targetUserId: targetUserId!,
        activityIds:
          allSelected || userActivities.length === 0
            ? undefined
            : selectedActivityIds,
        transferCommsLead,
        transferCommsContact,
        notes: notes || undefined,
      }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      const toastId =
        targetUserId != null
          ? `activities-transferred-${user.id}-${targetUserId}`
          : 'activities-transferred';
      toast.success(`Transferred ${data.transferredCount} assignment(s)`, {
        id: toastId,
      });
      onTransferred();
    },
    onError: (err: Error) => {
      const toastId =
        targetUserId != null
          ? `activities-transferred-${user.id}-${targetUserId}`
          : 'activities-transferred';
      toast.error(err.message || 'Transfer failed', { id: toastId });
    },
  });

  const canSubmit =
    targetUserId != null &&
    user.id !== targetUserId &&
    (transferCommsLead || transferCommsContact) &&
    (userActivities.length === 0 || selectedCount > 0);

  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Transfer</h3>

      <div className="max-w-xl space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium">
              Transfer to user <span className="text-red-500">*</span>
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="text-slate-400"
                    aria-label="Transfer to user help"
                  >
                    <Info className="h-4 w-4" aria-hidden />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Only active users on the same team as this user can receive
                  transferred activities.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Popover
            open={comboboxOpen}
            onOpenChange={(open) => {
              setComboboxOpen(open);
              if (!open) setUserSearch('');
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
                  {isSearching ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>
                        No users found on the same team.
                      </CommandEmpty>
                      <CommandGroup>
                        {userOptions.map((option) => {
                          const isSelected = targetUserId === option.id;
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
                                  isSelected ? 'opacity-100' : 'opacity-0'
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

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Select activities <span className="text-red-500">*</span>
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
                      if (noneSelected) selectAllActivities();
                      else deselectAllActivities();
                    }}
                  >
                    {noneSelected ? 'Select all' : 'Deselect all'}
                  </button>
                </div>
                <div className="max-h-[240px] overflow-auto p-1">
                  {userActivities.length === 0 ? (
                    <div className="text-muted-foreground py-4 text-center text-sm">
                      No activities associated with this user
                    </div>
                  ) : (
                    userActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="hover:bg-accent flex items-center space-x-2 rounded-sm px-2 py-1.5"
                      >
                        <Checkbox
                          id={`activity-${activity.id}`}
                          checked={selectedActivityIds.includes(activity.id)}
                          onCheckedChange={() => toggleActivity(activity.id)}
                        />
                        <Label
                          htmlFor={`activity-${activity.id}`}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {activity.label}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
              Include lead comms contact
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
              Include comms contact (non-lead)
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-28"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={!canSubmit || transferMutation.isPending}
          onClick={() => transferMutation.mutate()}
        >
          {transferMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Transfer'
          )}
        </Button>
      </div>
    </div>
  );
}

export default TransferActivitiesTab;
