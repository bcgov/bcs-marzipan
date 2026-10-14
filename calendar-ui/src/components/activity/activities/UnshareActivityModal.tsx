import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  countActivitiesSharedWithTeam,
  getBulkUnshareVisibilityMessage,
  getUnshareVisibilityMessage,
  type UnshareActivityContext,
  type UnshareTeamOption,
} from '@/lib/unshare-helpers';

type UnshareActivityModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'single' | 'bulk';
  activityIds: number[];
  /** Used for visibility-aware confirm copy and bulk counts. */
  activities: UnshareActivityContext[];
  eligibleTeams: UnshareTeamOption[];
  onConfirm: (teamId: number) => void;
  isPending: boolean;
};

export function UnshareActivityModal({
  open,
  onOpenChange,
  mode,
  activityIds,
  activities,
  eligibleTeams,
  onConfirm,
  isPending,
}: UnshareActivityModalProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [step, setStep] = useState<'select-team' | 'confirm'>('select-team');

  useEffect(() => {
    if (!open) {
      setSelectedTeamId(null);
      setStep('select-team');
      return;
    }

    if (eligibleTeams.length === 1) {
      setSelectedTeamId(eligibleTeams[0].id);
      setStep('confirm');
      return;
    }

    setSelectedTeamId(null);
    setStep('select-team');
  }, [open, eligibleTeams]);

  const selectedTeam = useMemo(
    () => eligibleTeams.find((team) => team.id === selectedTeamId) ?? null,
    [eligibleTeams, selectedTeamId]
  );

  const visibilityMessage = useMemo(() => {
    if (mode === 'bulk') {
      return getBulkUnshareVisibilityMessage(activities);
    }
    return getUnshareVisibilityMessage(activities[0]?.visibility);
  }, [activities, mode]);

  const bulkMatchCount =
    selectedTeamId == null
      ? 0
      : countActivitiesSharedWithTeam(activities, selectedTeamId);

  const handleContinue = () => {
    if (selectedTeamId == null) return;
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (selectedTeamId == null) return;
    onConfirm(selectedTeamId);
  };

  const title =
    mode === 'bulk'
      ? `Unshare ${activityIds.length} activit${activityIds.length === 1 ? 'y' : 'ies'}`
      : 'Unshare activity';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {step === 'select-team'
              ? 'Choose which team to remove from the Shared with list.'
              : 'Confirm before removing the team share.'}
          </DialogDescription>
        </DialogHeader>

        {eligibleTeams.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No teams are eligible to unshare for the current selection.
          </p>
        ) : step === 'select-team' ? (
          <div className="space-y-2">
            <Label htmlFor="unshare-team-select">Team</Label>
            <Select
              value={selectedTeamId != null ? String(selectedTeamId) : ''}
              onValueChange={(value) => setSelectedTeamId(Number(value))}
            >
              <SelectTrigger
                id="unshare-team-select"
                aria-label="Team to unshare"
              >
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {eligibleTeams.map((team) => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p>
              Remove{' '}
              <span className="font-medium">
                {selectedTeam?.name ?? 'team'}
              </span>{' '}
              from the Shared with list
              {mode === 'bulk'
                ? ` for ${bulkMatchCount} of ${activityIds.length} selected activit${activityIds.length === 1 ? 'y' : 'ies'}?`
                : '?'}
            </p>
            <p className="text-muted-foreground">{visibilityMessage}</p>
            {mode === 'bulk' && bulkMatchCount < activityIds.length ? (
              <p className="text-muted-foreground">
                Activities that are not shared with this team, or are being
                edited by someone else, will be skipped.
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {step === 'select-team' ? (
            <Button
              type="button"
              disabled={selectedTeamId == null}
              onClick={handleContinue}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isPending || selectedTeamId == null}
              onClick={handleConfirm}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Unsharing…
                </>
              ) : (
                'Unshare'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
