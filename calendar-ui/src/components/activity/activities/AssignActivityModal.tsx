import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { ActivityFlagResponse } from '@corpcal/shared/api/types';
import { fetchTeamById } from '@/api/teamsApi';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
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
  onAssign: (teamId: number, assigneeId: number, note?: string) => void;
  /** Called when user removes the current flag for a team. */
  onUnassign: (teamId: number) => void;
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
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [members, setMembers] = useState<TeamMemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Use the first of the user's teams for flagging (simplified: single-team scenario)
  const primaryTeamId = user?.teamIds?.[0] ?? null;

  // Find existing flag for the primary team
  const existingFlag = useMemo(
    () => flags.find((f) => f.teamId === primaryTeamId) ?? null,
    [flags, primaryTeamId]
  );

  // Fetch team members when dialog opens
  useEffect(() => {
    if (!open || !primaryTeamId) return;
    setLoadingMembers(true);
    fetchTeamById(primaryTeamId)
      .then((team) => {
        if (!team) return;
        setSelectedTeamId(team.id);
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
  }, [open, primaryTeamId]);

  // Pre-select existing assignee when dialog opens
  useEffect(() => {
    if (open && existingFlag) {
      setSelectedUserId(existingFlag.assigneeId);
      setNote(existingFlag.note ?? '');
    } else if (open) {
      setSelectedUserId(null);
      setNote('');
    }
  }, [open, existingFlag]);

  const handleConfirm = () => {
    if (!selectedTeamId || !selectedUserId) return;
    onAssign(selectedTeamId, selectedUserId, note.trim() || undefined);
  };

  const handleUnassign = () => {
    if (!selectedTeamId) return;
    onUnassign(selectedTeamId);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setSelectedUserId(null);
      setNote('');
    }
    onOpenChange(value);
  };

  // Put current user first in the list
  const sortedMembers = useMemo(() => {
    if (!user) return members;
    const me = members.find((m) => m.userId === user.id);
    const rest = members.filter((m) => m.userId !== user.id);
    return me ? [me, ...rest] : rest;
  }, [members, user]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign activity</DialogTitle>
          <DialogDescription>
            Assign activities that require your or a teammate&apos;s attention.
            Assignments are visible to teammates in the activities list.
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
                value={selectedUserId}
                onValueChange={(val) => setSelectedUserId(val)}
              >
                <ComboboxInput
                  placeholder="Select assignee"
                  showClear={selectedUserId !== null}
                />
                <ComboboxContent>
                  <ComboboxList>
                    {sortedMembers.map((m) => (
                      <ComboboxItem key={m.userId} value={m.userId}>
                        {m.userId === user?.id ? `${m.label} (you)` : m.label}
                      </ComboboxItem>
                    ))}
                    {sortedMembers.length === 0 && (
                      <div className="text-muted-foreground py-6 text-center text-sm">
                        No teammates found.
                      </div>
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

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
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
              disabled={isSubmitting || !selectedUserId || !selectedTeamId}
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
      </DialogContent>
    </Dialog>
  );
}
