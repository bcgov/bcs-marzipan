/**
 * ActivityFlagPopover
 *
 * A quick-assign popover shown from the Activity List row (no modal, no notes).
 * Opens when the Flag button is clicked; shows a searchable list of teammates
 * with a multi-select checkbox pattern.
 *
 * Same flag semantics as AssignActivityModal but inline, no note field.
 */
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import type { ActivityFlagResponse } from '@corpcal/shared/api/types';
import { fetchUsers } from '@/api/usersApi';
import { ActivityFlagIcon } from '@/components/activity/activities/ActivityFlagIcon';
import { FilterSearchableList } from '@/components/activity/ActivityTable/FilterSearchableList';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

interface TeamMemberOption {
  userId: number;
  label: string;
  teamId: number;
  teamName: string;
}

interface ActivityFlagPopoverProps {
  activityId: number;
  /** Existing flags for the current user's teams. */
  flags: ActivityFlagResponse[];
  /** Called to sync the full assignee set for a team. */
  onSync: (
    teamId: number,
    assigneeIds: number[],
    assigneeNames?: string[],
    displayTeamPerAssignee?: Record<number, number | null>
  ) => void;
  isPending?: boolean;
  /** When true, shows assignment state without any interactive controls. */
  readOnly?: boolean;
  /** Optional custom trigger content (e.g., assigned avatar stack). */
  triggerContent?: ReactNode;
}

export function ActivityFlagPopover({
  activityId: _activityId,
  flags,
  onSync,
  isPending = false,
  readOnly = false,
  triggerContent,
}: ActivityFlagPopoverProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<TeamMemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [draftAssigneeIds, setDraftAssigneeIds] = useState<number[]>([]);
  const [selectedTeamPerUser, setSelectedTeamPerUser] = useState<
    Record<number, number>
  >({});
  const [openTeamSubmenuForUser, setOpenTeamSubmenuForUser] = useState<
    number | null
  >(null);

  const teamIds = useMemo(
    () =>
      Array.from(
        new Set(
          user?.teamIds?.filter((teamId): teamId is number => teamId != null) ??
            []
        )
      ),
    [user?.teamIds]
  );
  const teamIdSet = useMemo(() => new Set(teamIds), [teamIds]);
  const existingFlags = useMemo(
    () => flags.filter((f) => teamIdSet.has(f.teamId)),
    [flags, teamIdSet]
  );
  const primaryTeamId = existingFlags[0]?.teamId ?? teamIds[0] ?? null;
  const existingFlagsForPrimaryTeam = useMemo(
    () =>
      primaryTeamId == null
        ? []
        : existingFlags.filter((f) => f.teamId === primaryTeamId),
    [existingFlags, primaryTeamId]
  );
  const selectedAssigneeIds = useMemo(
    () => existingFlagsForPrimaryTeam.map((f) => f.assigneeId),
    [existingFlagsForPrimaryTeam]
  );
  const isFlagged = selectedAssigneeIds.length > 0;
  const flaggedLabel = existingFlagsForPrimaryTeam
    .map((f) => f.assigneeName)
    .join(', ');
  const iconFlag = existingFlagsForPrimaryTeam[0] ?? null;
  const primaryTeamMembers = useMemo(
    () =>
      primaryTeamId == null
        ? []
        : members.filter((member) => member.teamId === primaryTeamId),
    [members, primaryTeamId]
  );

  // Fetch team members each time the popover opens.
  // Uses GET /users?teamIds=... which returns each user with their full teams array,
  // so we can show the correct team badge (cosmetic only).
  useEffect(() => {
    if (!open || teamIds.length === 0) return;
    setLoadingMembers(true);
    fetchUsers({ teamIds })
      .then((userList) => {
        // Expand each user into one TeamMemberOption per team that overlaps with
        // the current user's teams (we can only assign within our own teams).
        const nextMembers: TeamMemberOption[] = [];
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
            }
          }
        }

        setMembers(nextMembers);

        // Initialise the per-user team selection based on displayTeamId from existing flags,
        // falling back to primary team
        const initialSelectedTeam: Record<number, number> = {};

        // First, load any saved displayTeamId from existing flags
        existingFlags.forEach((flag) => {
          if (flag.displayTeamId != null) {
            initialSelectedTeam[flag.assigneeId] = flag.displayTeamId;
          }
        });

        // Then fill in any missing users with primary team
        nextMembers.forEach((member) => {
          if (!initialSelectedTeam[member.userId]) {
            initialSelectedTeam[member.userId] = primaryTeamId ?? member.teamId;
          }
        });
        setSelectedTeamPerUser(initialSelectedTeam);
      })
      .catch(() => {
        setMembers([]);
        setSelectedTeamPerUser({});
      })
      .finally(() => setLoadingMembers(false));
  }, [open, teamIds, teamIdSet, existingFlags, primaryTeamId]);

  // Build mapping of userId -> teams they're on (for display only)
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

  // Build sorted options from primary team members, current user first then alphabetically
  const options = useMemo(() => {
    const primaryMembers = primaryTeamId
      ? members.filter((m) => m.teamId === primaryTeamId)
      : [];

    // Get unique users and sort
    const uniqueUserIds = Array.from(
      new Set(primaryMembers.map((m) => m.userId))
    );
    const me = uniqueUserIds.find((id) => id === user?.id);
    const rest = uniqueUserIds
      .filter((id) => id !== user?.id)
      .sort((a, b) => {
        const aName = primaryMembers.find((m) => m.userId === a)?.label ?? '';
        const bName = primaryMembers.find((m) => m.userId === b)?.label ?? '';
        return aName.localeCompare(bName);
      });

    return [...(me ? [me] : []), ...rest].map((userId) => {
      const firstMember = primaryMembers.find((m) => m.userId === userId)!;
      const label =
        userId === user?.id ? `${firstMember.label} (you)` : firstMember.label;
      return {
        value: String(userId),
        label,
      };
    });
  }, [members, primaryTeamId, user]);

  // Seed draft selection from server state when opening so users can multi-select before saving.
  useEffect(() => {
    if (!open) {
      setOpenTeamSubmenuForUser(null);
      setMembers([]);
      setSelectedTeamPerUser({});
      return;
    }
    setDraftAssigneeIds(selectedAssigneeIds);
  }, [open, selectedAssigneeIds]);

  const handleToggle = (memberId: number) => {
    setDraftAssigneeIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSave = () => {
    if (!primaryTeamId) return;
    const nextAssigneeIds = draftAssigneeIds.filter((assigneeId) => {
      const userTeams = userTeamsMap.get(assigneeId) ?? [];
      // Assign to the primary team only
      return userTeams.some((m) => m.teamId === primaryTeamId);
    });

    const selectedNames = members
      .filter(
        (m) => m.teamId === primaryTeamId && nextAssigneeIds.includes(m.userId)
      )
      .map((m) => m.label);
    onSync(primaryTeamId, nextAssigneeIds, selectedNames, selectedTeamPerUser);

    setOpen(false);
  };

  if (readOnly) {
    if (!isFlagged || !iconFlag) return null;
    return (
      <span
        title={`Assigned to ${flaggedLabel}`}
        aria-label={`Assigned to ${flaggedLabel}`}
      >
        <ActivityFlagIcon
          assigneeName={iconFlag.assigneeName}
          assigneeFlagColour={iconFlag.assigneeFlagColour}
        />
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={triggerContent ? 'sm' : 'icon'}
          aria-label={
            isFlagged
              ? 'Assigned — click to edit assignments'
              : 'Assign activity'
          }
          title={isFlagged ? `Assigned to ${flaggedLabel}` : 'Assign activity'}
          disabled={isPending || !primaryTeamId}
          data-no-row-nav
          onClick={(e) => e.stopPropagation()}
          className={triggerContent ? 'h-6 shrink-0 px-1.5' : 'size-6 shrink-0'}
        >
          {triggerContent ?? (
            <ActivityFlagIcon
              assigneeName={isFlagged ? (iconFlag?.assigneeName ?? null) : null}
              assigneeFlagColour={iconFlag?.assigneeFlagColour}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-76 overflow-x-hidden p-0"
        align="start"
        data-no-row-nav
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-muted-foreground px-3 pt-3 pb-1 text-[12px] font-medium tracking-wide uppercase">
          Assign activity
        </p>
        {loadingMembers ? (
          <div className="text-muted-foreground px-3 py-4 text-center text-sm">
            Loading…
          </div>
        ) : (
          <FilterSearchableList
            options={options}
            searchPlaceholder="Search teammates..."
            emptyMessage="No teammates found."
            renderOption={(opt) => {
              const memberId = parseInt(opt.value, 10);
              const isMe = memberId === user?.id;
              const isSelected = draftAssigneeIds.includes(memberId);
              const hasTeammates = options.length > 1;
              const userTeams = userTeamsMap.get(memberId) ?? [];
              const hasMultipleTeams = userTeams.length > 1;
              const selectedTeam = selectedTeamPerUser[memberId];
              const selectedTeamInfo = userTeams.find(
                (m) => m.teamId === selectedTeam
              );
              const teamSubmenuOpen = openTeamSubmenuForUser === memberId;

              return (
                <>
                  <div className="flex w-full items-center gap-2 px-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggle(memberId)}
                      aria-pressed={isSelected}
                      className="hover:bg-accent hover:text-accent-foreground flex min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-1 text-left"
                    >
                      <Checkbox
                        checked={isSelected}
                        tabIndex={-1}
                        className="pointer-events-none size-4 shrink-0"
                        aria-hidden
                      />
                      <span className="min-w-0 truncate text-sm">{opt.label}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      {hasMultipleTeams ? (
                        <Popover
                          open={teamSubmenuOpen}
                          onOpenChange={(open) =>
                            setOpenTeamSubmenuForUser(open ? memberId : null)
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
                              className="hover:bg-muted ml-auto rounded px-1.5 py-1"
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
                    </div>
                  </div>
                  {isMe && hasTeammates && <Separator />}
                </>
              );
            }}
          />
        )}
        {!loadingMembers && (
          <div className="flex justify-end border-t px-3 py-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={
                isPending || !primaryTeamId || primaryTeamMembers.length === 0
              }
            >
              Save assignments
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
