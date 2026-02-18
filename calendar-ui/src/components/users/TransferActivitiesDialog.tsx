import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { UserListItem } from '@corpcal/shared/api/types';
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

interface TransferActivitiesDialogProps {
  sourceUser: UserListItem;
  onClose: () => void;
  onTransferred: () => void;
}

interface UserOption {
  id: number;
  label: string;
  value: string;
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

export function TransferActivitiesDialog({
  sourceUser,
  onClose,
  onTransferred,
}: TransferActivitiesDialogProps) {
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

  const userOptions: UserOption[] = useMemo(() => {
    return searchUsers
      .filter((u) => u.id !== sourceUser.id && u.isActive)
      .map((u) => userToOption(u));
  }, [searchUsers, sourceUser.id]);

  const { data: userActivities = [] } = useQuery({
    queryKey: ['users', sourceUser.id, 'activities'],
    queryFn: () => fetchUserActivities(sourceUser.id),
  });

  useEffect(() => {
    if (
      userActivities.length > 0 &&
      activitiesInitializedForUser.current !== sourceUser.id
    ) {
      activitiesInitializedForUser.current = sourceUser.id;
      setSelectedActivityIds(userActivities.map((a) => a.id));
    }
  }, [sourceUser.id, userActivities]);

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
      transferActivities(sourceUser.id, {
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
      toast.success(`Transferred ${data.transferredCount} assignment(s)`);
      onTransferred();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Transfer failed');
    },
  });

  const canSubmit =
    targetUserId != null &&
    sourceUser.id !== targetUserId &&
    (transferCommsLead || transferCommsContact) &&
    (userActivities.length === 0 || selectedCount > 0);

  const sourceName =
    sourceUser.adDisplayName ||
    sourceUser.adUsername ||
    `User ${sourceUser.id}`;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg min-w-[400px]">
        <DialogHeader>
          <DialogTitle>Transfer activities from {sourceName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Transfer to user</Label>
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
                        <CommandEmpty>No users found.</CommandEmpty>
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

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Transfer</span>
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
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Activities</Label>
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

          <div className="flex flex-col gap-1">
            <Label className="text-sm text-slate-600">Notes (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for transfer..."
              className="min-h-[60px] rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-400 focus:outline-none"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
