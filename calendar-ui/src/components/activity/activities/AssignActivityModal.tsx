import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { ActivityFlagResponse } from '@corpcal/shared/api/types';
import { fetchTeamById } from '@/api/teamsApi';
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';

interface TeamMemberOption {
  userId: number;
  label: string;
  teamId: number;
}

interface AssignActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing flags for the current user's teams. */
  flags: ActivityFlagResponse[];
  isSubmitting: boolean;
  /** Sync the full assignee set for an activity/team pair. */
  onSync: (
    teamId: number,
    assigneeIds: number[],
    note?: string,
    assigneeNames?: string[]
  ) => void;
  displayId?: string;
}

export function AssignActivityModal({
  open,
  onOpenChange,
  flags,
  isSubmitting,
  onSync,
  displayId,
}: AssignActivityModalProps) {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [members, setMembers] = useState<TeamMemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const seededTeamIdRef = useRef<number | null>(null);

  const userTeamIds = useMemo(
    () => user?.teamIds ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.teamIds?.join(',')]
  );

  // Fetch members for all of the user's teams when the dialog opens.
  useEffect(() => {
    if (!open || userTeamIds.length === 0) return;

    let isCancelled = false;
    setLoadingMembers(true);

    Promise.all(userTeamIds.map((teamId) => fetchTeamById(teamId)))
      .then((teams) => {
        if (isCancelled) return;

        const availableTeams = teams.filter(
          (team): team is NonNullable<typeof team> => Boolean(team)
        );
        const opts: TeamMemberOption[] = availableTeams.flatMap((team) =>
          team.members.map((m) => ({
            userId: m.userId,
            label: m.userName,
            teamId: team.id,
          }))
        );

        setMembers(opts);
        setSelectedTeamId((currentTeamId) => {
          if (
            currentTeamId !== null &&
            availableTeams.some((team) => team.id === currentTeamId)
          ) {
            return currentTeamId;
          }

          const teamWithFlags = flags.find((f) =>
            availableTeams.some((t) => t.id === f.teamId)
          );
          if (teamWithFlags) return teamWithFlags.teamId;

          return availableTeams[0]?.id ?? null;
        });
      })
      .catch(() => {
        if (isCancelled) return;
        setMembers([]);
        setSelectedTeamId(null);
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingMembers(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [open, userTeamIds, flags]);

  // Seed selections from existing flags once per team when dialog opens.
  useEffect(() => {
    if (!open) {
      setSelectedMemberIds([]);
      setNote('');
      seededTeamIdRef.current = null;
      return;
    }
    if (selectedTeamId === null || selectedTeamId === seededTeamIdRef.current) {
      return;
    }
    seededTeamIdRef.current = selectedTeamId;
    const flagsForTeam = flags.filter((f) => f.teamId === selectedTeamId);
    setSelectedMemberIds(flagsForTeam.map((f) => f.assigneeId));
    setNote(flagsForTeam[0]?.note ?? '');
  }, [open, selectedTeamId, flags]);

  const handleToggle = (memberId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleConfirm = () => {
    if (!selectedTeamId) return;
    const teamMembers = members.filter((m) => m.teamId === selectedTeamId);
    const selectedNames = teamMembers
      .filter((m) => selectedMemberIds.includes(m.userId))
      .map((m) => m.label);
    onSync(
      selectedTeamId,
      selectedMemberIds,
      note.trim() || undefined,
      selectedNames
    );
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setSelectedMemberIds([]);
      setNote('');
    }
    onOpenChange(value);
  };

  // Members for the selected team, current user first then alphabetical
  const me = useMemo(
    () =>
      user
        ? members.find(
            (m) => m.userId === user.id && m.teamId === selectedTeamId
          )
        : undefined,
    [members, user, selectedTeamId]
  );
  const restMembers = useMemo(
    () =>
      members
        .filter((m) => m.teamId === selectedTeamId && m.userId !== user?.id)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [members, user, selectedTeamId]
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
          <DialogTitle>Assign activity</DialogTitle>
          <DialogDescription>
            Select teammates to assign for follow-up. Assignments are visible to
            all teammates in the activities list.
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
            <Label>Assignees</Label>
            {loadingMembers ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Loading teammates…
              </div>
            ) : (
              <FilterSearchableList
                options={options}
                selectedIds={selectedMemberIds}
                onToggle={handleToggle}
                searchPlaceholder="Search teammates…"
                emptyMessage="No teammates found."
                maxHeight="200px"
              />
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
              disabled={isSubmitting || !selectedTeamId}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                'Save assignments'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
