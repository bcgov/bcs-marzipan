/**
 * ActivityFlagPopover
 *
 * A quick-assign popover shown from the Activity List row (no modal, no notes).
 * Opens when the Flag button is clicked; shows a searchable list of teammates
 * with a single-select checkbox pattern.
 *
 * Same flag semantics as AssignActivityModal but inline, no note field.
 */
import { Flag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { ActivityFlagResponse } from '@corpcal/shared/api/types';
import { fetchTeamById } from '@/api/teamsApi';
import { FilterSearchableList } from '@/components/activity/ActivityTable/FilterSearchableList';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface TeamMemberOption {
  userId: number;
  label: string;
  teamId: number;
}

interface ActivityFlagPopoverProps {
  activityId: number;
  /** Existing flags for the current user's teams. */
  flags: ActivityFlagResponse[];
  /** Called to set or replace the flag for a team. */
  onAssign: (teamId: number, assigneeId: number) => void;
  /** Called to remove the flag for a team. */
  onUnassign: (teamId: number) => void;
  isPending?: boolean;
}

export function ActivityFlagPopover({
  activityId: _activityId,
  flags,
  onAssign,
  onUnassign,
  isPending = false,
}: ActivityFlagPopoverProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<TeamMemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const primaryTeamId = user?.teamIds?.[0] ?? null;
  const existingFlag = useMemo(
    () => flags.find((f) => f.teamId === primaryTeamId) ?? null,
    [flags, primaryTeamId]
  );
  const isFlagged = existingFlag !== null;

  // Fetch team members when popover opens (once per mount)
  useEffect(() => {
    if (!open || !primaryTeamId || members.length > 0) return;
    setLoadingMembers(true);
    fetchTeamById(primaryTeamId)
      .then((team) => {
        if (!team) return;
        setMembers(
          team.members.map((m) => ({
            userId: m.userId,
            label: m.userName,
            teamId: team.id,
          }))
        );
      })
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, [open, primaryTeamId, members.length]);

  // Build sorted options: current user first, then alphabetically
  const options = useMemo(() => {
    const me = members.find((m) => m.userId === user?.id);
    const rest = members.filter((m) => m.userId !== user?.id);
    return [...(me ? [me] : []), ...rest].map((m) => ({
      value: String(m.userId),
      label: m.userId === user?.id ? `${m.label} (you)` : m.label,
    }));
  }, [members, user]);

  const handleSelect = (memberId: number) => {
    if (!primaryTeamId) return;
    if (existingFlag?.assigneeId === memberId) {
      onUnassign(primaryTeamId);
    } else {
      onAssign(primaryTeamId, memberId);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            isFlagged ? 'Assigned — click to reassign' : 'Assign activity'
          }
          title={
            isFlagged
              ? `Assigned to ${existingFlag.assigneeName}`
              : 'Assign activity'
          }
          disabled={isPending || !primaryTeamId}
          data-no-row-nav
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'size-6 shrink-0',
            isFlagged
              ? 'text-[color:var(--flag-button-icon)]'
              : 'text-muted-foreground'
          )}
        >
          <Flag
            className={cn('size-4', isFlagged && 'fill-current')}
            aria-hidden
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-52 p-0"
        align="start"
        data-no-row-nav
        onClick={(e) => e.stopPropagation()}
      >
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
              const isSelected = existingFlag?.assigneeId === memberId;
              return (
                <button
                  type="button"
                  onClick={() => handleSelect(memberId)}
                  className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm"
                >
                  <Checkbox
                    checked={isSelected}
                    tabIndex={-1}
                    className="pointer-events-none size-4 shrink-0"
                    aria-hidden
                  />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
