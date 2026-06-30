/**
 * ActivityFlagPopover
 *
 * A quick-assign popover shown from the Activity List row (no modal, no notes).
 * Opens when the Flag button is clicked; shows a searchable list of teammates
 * with a multi-select checkbox pattern.
 *
 * Same flag semantics as AssignActivityModal but inline, no note field.
 */
import { useEffect, useMemo, useState } from 'react';

import type { ActivityFlagResponse } from '@corpcal/shared/api/types';
import { fetchTeamById } from '@/api/teamsApi';
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
}

interface ActivityFlagPopoverProps {
  activityId: number;
  /** Existing flags for the current user's teams. */
  flags: ActivityFlagResponse[];
  /** Called to sync the full assignee set for a team. */
  onSync: (
    teamId: number,
    assigneeIds: number[],
    assigneeNames?: string[]
  ) => void;
  isPending?: boolean;
  /** When true, shows assignment state without any interactive controls. */
  readOnly?: boolean;
}

export function ActivityFlagPopover({
  activityId: _activityId,
  flags,
  onSync,
  isPending = false,
  readOnly = false,
}: ActivityFlagPopoverProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<TeamMemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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

  // Fetch team members when popover opens (once per mount)
  useEffect(() => {
    if (!open || teamIds.length === 0 || members.length > 0) return;
    setLoadingMembers(true);
    Promise.all(teamIds.map((teamId) => fetchTeamById(teamId)))
      .then((teams) => {
        const nextMembers = teams
          .filter((team): team is NonNullable<typeof team> => Boolean(team))
          .flatMap((team) =>
            team.members.map((m) => ({
              userId: m.userId,
              label: m.userName,
              teamId: team.id,
            }))
          );

        const uniqueMembers = Array.from(
          new Map(
            nextMembers.map(
              (member) => [`${member.teamId}:${member.userId}`, member] as const
            )
          ).values()
        );

        setMembers(uniqueMembers);
      })
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, [open, teamIds, members.length]);

  // Build sorted options: current user first, then alphabetically
  const options = useMemo(() => {
    const me = members.find((m) => m.userId === user?.id);
    const rest = members
      .filter((m) => m.userId !== user?.id)
      .sort((a, b) => a.label.localeCompare(b.label));
    return [...(me ? [me] : []), ...rest].map((m) => ({
      value: String(m.userId),
      label: m.userId === user?.id ? `${m.label} (you)` : m.label,
    }));
  }, [members, user]);

  const handleToggle = (memberId: number) => {
    if (!primaryTeamId) return;
    const selectedSet = new Set(selectedAssigneeIds);
    if (selectedSet.has(memberId)) {
      selectedSet.delete(memberId);
    } else {
      selectedSet.add(memberId);
    }
    const nextAssigneeIds = Array.from(selectedSet);
    const nextAssigneeNames = members
      .filter((m) => selectedSet.has(m.userId))
      .map((m) => m.label);
    onSync(primaryTeamId, nextAssigneeIds, nextAssigneeNames);
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
          size="icon"
          aria-label={
            isFlagged
              ? 'Assigned — click to edit assignments'
              : 'Assign activity'
          }
          title={isFlagged ? `Assigned to ${flaggedLabel}` : 'Assign activity'}
          disabled={isPending || !primaryTeamId}
          data-no-row-nav
          onClick={(e) => e.stopPropagation()}
          className="size-6 shrink-0"
        >
          <ActivityFlagIcon
            assigneeName={isFlagged ? (iconFlag?.assigneeName ?? null) : null}
            assigneeFlagColour={iconFlag?.assigneeFlagColour}
          />
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
              const isSelected = selectedAssigneeIds.includes(memberId);
              const hasTeammates = options.length > 1;
              return (
                <>
                  <button
                    type="button"
                    onClick={() => handleToggle(memberId)}
                    className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm"
                  >
                    <Checkbox
                      checked={isSelected}
                      tabIndex={-1}
                      className="pointer-events-none size-4 shrink-0"
                      aria-hidden
                    />
                    <span className="min-w-0 truncate">{opt.label}</span>
                  </button>
                  {isMe && hasTeammates && <Separator />}
                </>
              );
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
