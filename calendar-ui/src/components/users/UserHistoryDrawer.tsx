import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

import type { UserHistoryEntry, UserListItem } from '@corpcal/shared/api/types';
import { fetchUserHistory } from '@/api/usersApi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UserHistoryDrawerProps {
  user: UserListItem;
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

function ChangeList({ changes }: { changes: UserHistoryEntry['changes'] }) {
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

export function UserHistoryDrawer({
  user,
  open,
  onClose,
}: UserHistoryDrawerProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['userHistory', user.id],
    queryFn: () => fetchUserHistory(user.id),
    enabled: open && !!user.id,
  });

  const displayName =
    user.adDisplayName || user.adUsername || `User ${user.id}`;

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && onClose()}>
      <DialogContent className="max-h-[80vh] w-full max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>History: {displayName}</DialogTitle>
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
                      {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  {entry.changedByUserName && (
                    <p className="mt-1 text-xs text-slate-600">
                      By {entry.changedByUserName}
                    </p>
                  )}
                  <ChangeList changes={entry.changes} />
                  {entry.notes && (
                    <p className="mt-2 text-sm text-slate-600 italic">
                      {entry.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        <div className="border-t border-slate-200 p-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
