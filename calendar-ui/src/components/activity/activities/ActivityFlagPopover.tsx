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
import { useEffect, useMemo, useRef, useState } from 'react';

import type { ActivityFlagResponse } from '@corpcal/shared/api/types';
import { fetchTeamById } from '@/api/teamsApi';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
  activityId,
  flags,
  onAssign,
  onUnassign,
  isPending = false,
}: ActivityFlagPopoverProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<TeamMemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const primaryTeamId = user?.teamIds?.[0] ?? null;
  const existingFlag = useMemo(
    () => flags.find((f) => f.teamId === primaryTeamId) ?? null,
    [flags, primaryTeamId]
  );
  const isFlagged = existingFlag !== null;

  // Fetch team members when popover opens
  useEffect(() => {
    if (!open || !primaryTeamId || members.length > 0) return;
    setLoadingMembers(true);
    fetchTeamById(primaryTeamId)
      .then((team) => {
        if (!team) return;
        const opts: TeamMemberOption[] = team.members.map((m) => ({
          userId: m.userId,
          label: m.userName,
          teamId: team.id,
        }));
        setMembers(opts);
      })
      .catch(() => {
        setMembers([]);
      })
      .finally(() => {
        setLoadingMembers(false);
      });
  }, [open, primaryTeamId, members.length]);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  // Sort: current user first, then alphabetically
  const sortedMembers = useMemo(() => {
    if (!user) return members;
    const me = members.find((m) => m.userId === user.id);
    const rest = members.filter((m) => m.userId !== user.id);
    return me ? [me, ...rest] : rest;
  }, [members, user]);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return sortedMembers;
    return sortedMembers.filter((m) => m.label.toLowerCase().includes(q));
  }, [sortedMembers, search]);

  const handleSelect = (member: TeamMemberOption) => {
    if (!primaryTeamId) return;
    if (existingFlag?.assigneeId === member.userId) {
      // Clicking the current assignee → unassign
      onUnassign(primaryTeamId);
    } else {
      onAssign(primaryTeamId, member.userId);
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
        <div className="border-b p-2">
          <Input
            ref={searchRef}
            placeholder="Search teammates"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-sm"
          />
        </div>
        <div className="max-h-56 overflow-y-auto py-1">
          {loadingMembers ? (
            <div className="text-muted-foreground px-3 py-4 text-center text-sm">
              Loading…
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-muted-foreground px-3 py-4 text-center text-sm">
              No teammates found.
            </div>
          ) : (
            filteredMembers.map((m) => {
              const isSelected = existingFlag?.assigneeId === m.userId;
              const label =
                m.userId === user?.id ? `${m.label} (you)` : m.label;
              return (
                <button
                  key={m.userId}
                  type="button"
                  onClick={() => handleSelect(m)}
                  className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm"
                >
                  <Checkbox
                    checked={isSelected}
                    tabIndex={-1}
                    className="pointer-events-none size-4 shrink-0"
                    aria-hidden
                  />
                  <span className="truncate">{label}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
