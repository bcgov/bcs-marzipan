import { Check, ChevronDown, Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { ActivityFlagResponse } from '@corpcal/shared/api/types';
import { fetchUsers } from '@/api/usersApi';
import { FilterSearchableList } from '@/components/activity/ActivityTable/FilterSearchableList';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';

interface TeamMemberOption {
  userId: number;
  label: string;
  teamId: number;
  teamName: string;
}

interface FlagActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing flags for the current user's teams. */
  flags: ActivityFlagResponse[];
  isSubmitting: boolean;
  /** Sync the full flagged-user set for an activity/team pair. */
  onSync: (
    teamId: number,
    flaggedUserIds: number[],
    note?: string,
    flaggedUserNames?: string[],
    displayTeamPerFlaggedUser?: Record<number, number | null>
  ) => void;
  displayId?: string;
}

export function FlagActivityModal({
  open,
  onOpenChange,
  flags,
  isSubmitting,
  onSync,
  displayId,
}: FlagActivityModalProps) {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [selectedTeamPerUser, setSelectedTeamPerUser] = useState<
    Record<number, number>
  >({});
  const [openTeamSubmenuForUser, setOpenTeamSubmenuForUser] = useState<
    number | null
  >(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [members, setMembers] = useState<TeamMemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const userTeamIds = useMemo(
    () => user?.teamIds ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.teamIds?.join(',')]
  );
  const teamIdSet = useMemo(() => new Set(userTeamIds), [userTeamIds]);

  // Fetch members for all of the user's teams when the dialog opens.
  useEffect(() => {
    if (!open || userTeamIds.length === 0) return;

    let isCancelled = false;
    setLoadingMembers(true);

    fetchUsers({ teamIds: userTeamIds })
      .then((userList) => {
        if (isCancelled) return;

        // Expand each user into one TeamMemberOption per team that overlaps with
        // the current user's teams
        const nextMembers: TeamMemberOption[] = [];
        const seenTeamIds = new Set<number>();
        for (const u of userList) {
          const name = u.adDisplayName ?? u.adUsername ?? `User ${u.id}`;
          for (const t of u.teams) {
            if (teamIdSet.has(t.teamId)) {
              nextMembers.push({
                userId: u.id,
                label: name,
                teamId: t.teamId,
                teamName: t.teamName,
              });
              seenTeamIds.add(t.teamId);
            }
          }
        }

        setMembers(nextMembers);

        // Initialize per-user team selection from existing flags
        const initialSelectedTeam: Record<number, number> = {};

        // Load any saved displayTeamId from existing flags
        flags.forEach((flag) => {
          if (flag.displayTeamId != null) {
            initialSelectedTeam[flag.flaggedUserId] = flag.displayTeamId;
          }
        });

        // Fill in any missing users with their own team as default
        nextMembers.forEach((member) => {
          if (!initialSelectedTeam[member.userId]) {
            initialSelectedTeam[member.userId] = member.teamId;
          }
        });
        setSelectedTeamPerUser(initialSelectedTeam);
      })
      .catch(() => {
        if (isCancelled) return;
        setMembers([]);
        setSelectedTeamPerUser({});
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingMembers(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [open, userTeamIds, teamIdSet, flags]);

  // Seed selections from existing flags when dialog opens.
  useEffect(() => {
    if (!open) {
      setSelectedMemberIds([]);
      setNote('');
      return;
    }
    // Load all flagged members and their note from flags
    setSelectedMemberIds(flags.map((f) => f.flaggedUserId));
    setNote(flags[0]?.note ?? '');
  }, [open, flags]);

  const handleToggle = (memberId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleConfirm = () => {
    if (selectedMemberIds.length === 0) return;
    // Use the first selected member's display team as the primary team context
    const firstMemberId = selectedMemberIds[0];
    const primaryTeamId = selectedTeamPerUser[firstMemberId];
    if (!primaryTeamId) return;

    // Get names of selected members
    const selectedNames = selectedMemberIds
      .map((memberId) => members.find((m) => m.userId === memberId)?.label)
      .filter((name): name is string => !!name);

    // Build displayTeamPerFlaggedUser map only for selected members
    // Send null when the member's team matches the primary team (to preserve semantics)
    const displayTeamPerFlaggedUser = selectedMemberIds.reduce(
      (acc, memberId) => {
        const memberTeamId = selectedTeamPerUser[memberId];
        // Only include entries that differ from the primary team
        if (memberTeamId !== primaryTeamId) {
          acc[memberId] = memberTeamId ?? null;
        }
        return acc;
      },
      {} as Record<number, number | null>
    );

    onSync(
      primaryTeamId,
      selectedMemberIds,
      note.trim() || undefined,
      selectedNames,
      Object.keys(displayTeamPerFlaggedUser).length > 0
        ? displayTeamPerFlaggedUser
        : undefined
    );
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setSelectedMemberIds([]);
      setNote('');
      setSelectedTeamPerUser({});
      setOpenTeamSubmenuForUser(null);
    }
    onOpenChange(value);
  };

  // Build mapping of userId -> teams they're on
  const userTeamsMap = useMemo(() => {
    const map = new Map<number, TeamMemberOption[]>();
    members.forEach((member) => {
      if (!map.has(member.userId)) {
        map.set(member.userId, []);
      }
      map.get(member.userId)!.push(member);
    });
    return map;
  }, [members]);

  // All members across all teams, with current user first then alphabetical by label
  const uniqueMembers = useMemo(() => {
    const seen = new Set<number>();
    const result: TeamMemberOption[] = [];
    // Group by userId, keeping first occurrence of each user
    members.forEach((m) => {
      if (!seen.has(m.userId)) {
        seen.add(m.userId);
        result.push(m);
      }
    });
    return result;
  }, [members]);

  const me = useMemo(
    () => uniqueMembers.find((m) => m.userId === user?.id),
    [uniqueMembers, user?.id]
  );
  const restMembers = useMemo(
    () =>
      uniqueMembers
        .filter((m) => m.userId !== user?.id)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [uniqueMembers, user?.id]
  );
  const options = useMemo(
    () =>
      [...(me ? [me] : []), ...restMembers].map((m) => ({
        value: String(m.userId),
        label: m.userId === user?.id ? `${m.label} (you)` : m.label,
      })),
    [me, restMembers, user]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Flag activity</DialogTitle>
          <DialogDescription>
            Select teammates to flag for follow-up. Flags are visible to all
            teammates in the activities list.
          </DialogDescription>
        </DialogHeader>

        {displayId && (
          <p className="text-muted-foreground text-sm">
            Activity:{' '}
            <span className="text-foreground font-medium">{displayId}</span>
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Flag for</Label>
            <p className="text-muted-foreground text-xs">
              Select teammates and choose their team below
            </p>
            {loadingMembers ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Loading teammates…
              </div>
            ) : (
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <div
                    role="combobox"
                    aria-expanded={comboOpen}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setComboOpen(true);
                      }
                    }}
                    className="border-input bg-background focus-visible:ring-ring flex min-h-10 w-full cursor-pointer flex-wrap items-center gap-1 rounded-md border px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {selectedMemberIds.length === 0 ? (
                      <span className="text-muted-foreground px-1">
                        Select teammates…
                      </span>
                    ) : (
                      selectedMemberIds.map((memberId) => {
                        const member = members.find(
                          (m) => m.userId === memberId
                        );
                        if (!member) return null;
                        const displayTeamId = selectedTeamPerUser[memberId];
                        const displayTeam = userTeamsMap
                          .get(memberId)
                          ?.find((m) => m.teamId === displayTeamId);
                        const chipLabel =
                          memberId === user?.id
                            ? `${member.label} (you)`
                            : member.label;
                        return (
                          <span
                            key={memberId}
                            className="bg-accent flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm"
                          >
                            <span className="max-w-[120px] truncate">
                              {chipLabel}
                            </span>
                            {displayTeam && (
                              <span className="text-primary inline-flex items-center rounded-full bg-[var(--fluent-brand-background-2)] px-1.5 py-0 text-[10px] leading-[14px] font-normal">
                                {displayTeam.teamName}
                              </span>
                            )}
                            <button
                              type="button"
                              aria-label={`Remove ${chipLabel}`}
                              className="text-muted-foreground hover:text-foreground ml-0.5"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggle(memberId);
                              }}
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        );
                      })
                    )}
                    <ChevronDown className="text-muted-foreground ml-auto size-4 shrink-0" />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0"
                  align="start"
                  style={{
                    width: 'var(--radix-popover-trigger-width)',
                  }}
                >
                  <FilterSearchableList
                    options={options}
                    searchPlaceholder="Search teammates…"
                    emptyMessage="No teammates found."
                    maxHeight="200px"
                    renderOption={(opt) => {
                      const memberId = parseInt(opt.value, 10);
                      const isSelected = selectedMemberIds.includes(memberId);
                      const userTeams = userTeamsMap.get(memberId) ?? [];
                      const hasMultipleTeams = userTeams.length > 1;
                      const selectedTeam = selectedTeamPerUser[memberId];
                      const selectedTeamInfo = userTeams.find(
                        (m) => m.teamId === selectedTeam
                      );
                      const teamSubmenuOpen =
                        openTeamSubmenuForUser === memberId;

                      return (
                        <div className="flex w-full items-center gap-2 px-3 py-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggle(memberId)}
                            aria-pressed={isSelected}
                            className="hover:bg-accent flex min-w-0 flex-1 items-center rounded px-1.5 py-1 text-left"
                          >
                            <span className="min-w-0 truncate text-sm">
                              {opt.label}
                            </span>
                          </button>
                          <div className="ml-auto flex items-center gap-1.5">
                            {hasMultipleTeams ? (
                              <Popover
                                open={teamSubmenuOpen}
                                onOpenChange={(open) =>
                                  setOpenTeamSubmenuForUser(
                                    open ? memberId : null
                                  )
                                }
                              >
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenTeamSubmenuForUser(
                                        teamSubmenuOpen ? null : memberId
                                      );
                                    }}
                                    className="hover:bg-muted rounded px-1 py-0.5"
                                    title="Select team"
                                  >
                                    <span className="text-primary inline-flex items-center gap-0.5 rounded-full bg-[var(--fluent-brand-background-2)] px-2 py-0.5 text-[10px] leading-[14px] font-normal">
                                      {selectedTeamInfo?.teamName ?? 'N/A'}
                                      <ChevronDown className="size-2.5 shrink-0" />
                                    </span>
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-48 p-0"
                                  align="end"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="space-y-1 p-1">
                                    {userTeams.map((team) => (
                                      <button
                                        key={team.teamId}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedTeamPerUser((prev) => ({
                                            ...prev,
                                            [memberId]: team.teamId,
                                          }));
                                          setOpenTeamSubmenuForUser(null);
                                        }}
                                        className={`hover:bg-accent w-full rounded px-2 py-1.5 text-left text-sm ${
                                          selectedTeam === team.teamId
                                            ? 'bg-accent font-medium'
                                            : ''
                                        }`}
                                      >
                                        {team.teamName}
                                      </button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <span className="text-primary inline-flex items-center rounded-full bg-[var(--fluent-brand-background-2)] px-2 py-0.5 text-[10px] leading-[14px] font-normal">
                                {selectedTeamInfo?.teamName ?? 'N/A'}
                              </span>
                            )}
                            {isSelected && (
                              <Check className="text-primary size-4 shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="flag-note">Add a note (optional)</Label>
            <Textarea
              id="flag-note"
              placeholder="Give additional context"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 pt-4 sm:flex-row sm:justify-end">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={
                isSubmitting || loadingMembers || selectedMemberIds.length === 0
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                'Save flags'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
