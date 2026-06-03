import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { ActivityFlagResponse } from '@corpcal/shared/api/types';
import { fetchTeamById } from '@/api/teamsApi';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
} from '@/components/ui/combobox';
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
  /** Called when user confirms an assignment. */
  onAssign: (
    teamId: number,
    assigneeId: number,
    note?: string,
    assigneeName?: string
  ) => void;
  /** Called when user removes the current flag for a team. */
  onUnassign: (teamId: number, assigneeName?: string) => void;
  displayId?: string;
}

export function AssignActivityModal({
  open,
  onOpenChange,
  flags,
  isSubmitting,
  onAssign,
  onUnassign,
  displayId,
}: AssignActivityModalProps) {
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMemberOption | null>(
    null
  );
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [members, setMembers] = useState<TeamMemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const userTeamIds = useMemo(
    () => user?.teamIds ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.teamIds?.join(',')]
  );

  // Find the existing flag for the currently selected team; if none is selected yet,
  // fall back to the first flag that belongs to any of the user's teams.
  const existingFlag = useMemo(() => {
    if (selectedTeamId !== null) {
      return flags.find((f) => f.teamId === selectedTeamId) ?? null;
    }

    return flags.find((f) => userTeamIds.includes(f.teamId)) ?? null;
  }, [flags, selectedTeamId, userTeamIds]);

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

          if (
            existingFlag &&
            availableTeams.some((team) => team.id === existingFlag.teamId)
          ) {
            return existingFlag.teamId;
          }

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
  }, [open, userTeamIds, existingFlag]);

  // Pre-select existing assignee when dialog opens (after members are loaded)
  useEffect(() => {
    if (open && existingFlag && members.length > 0) {
      setSelectedMember(
        members.find((m) => m.userId === existingFlag.assigneeId) ?? null
      );
      setNote(existingFlag.note ?? '');
    } else if (open && !existingFlag) {
      setSelectedMember(null);
      setNote('');
    }
  }, [open, existingFlag, members]);

  const handleConfirm = () => {
    if (!selectedTeamId || !selectedMember) return;
    onAssign(
      selectedTeamId,
      selectedMember.userId,
      note.trim() || undefined,
      selectedMember.label
    );
  };

  const handleUnassign = () => {
    if (!selectedTeamId) return;
    onUnassign(selectedTeamId, existingFlag?.assigneeName ?? undefined);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setSelectedMember(null);
      setNote('');
    }
    onOpenChange(value);
  };

  // Put current user first, rest alphabetical
  const me = useMemo(
    () => (user ? members.find((m) => m.userId === user.id) : undefined),
    [members, user]
  );
  const restMembers = useMemo(
    () =>
      members
        .filter((m) => m.userId !== user?.id)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [members, user]
  );
  const comboboxItems = useMemo(
    () => [...(me ? [me] : []), ...restMembers],
    [me, restMembers]
  );

  // Render the combobox popup inside the dialog so Radix's focus trap
  // doesn't block pointer events on the Base UI portal.
  const [dialogContainer, setDialogContainer] = useState<HTMLDivElement | null>(
    null
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div ref={setDialogContainer}>
          <DialogHeader>
            <DialogTitle>Assign activity</DialogTitle>
            <DialogDescription>
              Assign activities that require your or a teammate&apos;s
              attention. Assignments are visible to teammates in the activities
              list.
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
              <Label htmlFor="flag-assignee">Assignee</Label>
              {loadingMembers ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Loading teammates…
                </div>
              ) : (
                <Combobox
                  items={comboboxItems}
                  value={selectedMember}
                  onValueChange={(m: TeamMemberOption | null) =>
                    setSelectedMember(m)
                  }
                  itemToStringValue={(m: TeamMemberOption) => m.label}
                >
                  <ComboboxInput placeholder="Search teammates…" />
                  <ComboboxContent container={dialogContainer ?? undefined}>
                    <ComboboxEmpty>No teammates found.</ComboboxEmpty>
                    <ComboboxList>
                      {(m: TeamMemberOption) => (
                        <>
                          {me && m === restMembers[0] && <ComboboxSeparator />}
                          <ComboboxItem key={m.userId} value={m}>
                            {m.userId === user?.id
                              ? `${m.label} (you)`
                              : m.label}
                          </ComboboxItem>
                        </>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
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

          <DialogFooter className="flex-col gap-2 pt-4 sm:flex-row sm:justify-between">
            <div>
              {existingFlag && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleUnassign}
                  disabled={isSubmitting}
                  className="text-muted-foreground"
                >
                  Remove assignment
                </Button>
              )}
            </div>
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
                disabled={isSubmitting || !selectedMember || !selectedTeamId}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  'Save assignee'
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
