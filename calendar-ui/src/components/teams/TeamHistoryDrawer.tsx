import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import type { TeamHistoryEntry, TeamListItem } from '@corpcal/shared/api/types';
import { fetchTeamHistory } from '@/api/teamsApi';
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

function formatHistoryValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return JSON.stringify(value);
}

function ChangeList({ changes }: { changes: TeamHistoryEntry['changes'] }) {
  if (!changes || changes.length === 0) return null;
  return (
    <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
      {changes.map((c, i) => (
        <li key={i}>
          <span className="font-medium">{c.field}</span>:{' '}
          {formatHistoryValue(c.oldValue)} → {formatHistoryValue(c.newValue)}
        </li>
      ))}
    </ul>
  );
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
          <div className="flex flex-col gap-4">
            {history.length === 0 ? (
              <p className="text-slate-500">No history entries.</p>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">
                      {entry.actionType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-500">
                      {entry.timestamp
                        ? new Date(entry.timestamp).toLocaleString()
                        : ''}
                    </span>
                  </div>
                  {entry.changedByUserName && (
                    <p className="mt-1 text-xs text-slate-600">
                      By {entry.changedByUserName}
                    </p>
                  )}
                  <ChangeList changes={entry.changes} />
                  {entry.notes && (
                    <p className="mt-2 text-sm text-slate-600">{entry.notes}</p>
                  )}
                </div>
              ))
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
