import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import type { TeamListItem } from '@corpcal/shared/api/types';
import { fetchTeamHistory } from '@/api/teamsApi';
import { HistoryList, toTeamHistoryViewModel } from '@/components/history';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TeamHistoryDrawerProps {
  team: TeamListItem | null;
  open: boolean;
  onClose: () => void;
}

export function TeamHistoryDrawer({
  team,
  open,
  onClose,
}: TeamHistoryDrawerProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['teamHistory', team?.id],
    queryFn: () => (team ? fetchTeamHistory(team.id) : Promise.resolve([])),
    enabled: open && !!team?.id,
  });

  const title = team
    ? team.displayName || team.name || `Team ${team.id}`
    : 'Team';
  const historyEntries = history.map(toTeamHistoryViewModel);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[80vh] w-full max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>History: {title}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div>
            {history.length === 0 ? (
              <p className="text-slate-500">No history entries.</p>
            ) : (
              <HistoryList entries={historyEntries} />
            )}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
