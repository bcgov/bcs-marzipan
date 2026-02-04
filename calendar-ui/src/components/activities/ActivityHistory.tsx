import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { fetchActivityHistory } from '../../api/activitiesApi';
import { Badge } from '@fluentui/react-components';
import { HistoryRegular } from '@fluentui/react-icons';

type HistoryEntry = {
  id: number;
  activityId: number;
  userId: number;
  actionType: string;
  changes: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }> | null;
  notes: string | null;
  timestamp: string;
  userName?: string;
};

export default function ActivityHistory({
  activityId,
  open,
  onOpenChange,
}: {
  activityId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!open) return;
      setLoading(true);
      try {
        const data = await fetchActivityHistory(activityId);
        if (!mounted) return;
        setEntries(data || []);
      } catch (err) {
        console.error('Failed to load activity history', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [activityId, open]);

  // group by local date string
  const groups: Record<string, HistoryEntry[]> = {};
  for (const e of entries) {
    const d = new Date(e.timestamp).toLocaleDateString();
    groups[d] = groups[d] || [];
    groups[d].push(e);
  }

  const formatValue = (v: unknown) =>
    v === null || v === undefined
      ? ''
      : typeof v === 'object'
        ? JSON.stringify(v)
        : String(JSON.stringify(v));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-0 right-0 h-full w-full max-w-md p-6">
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HistoryRegular />
            <DialogTitle>Activity history</DialogTitle>
          </div>
          <DialogDescription>
            Recent changes for this activity
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 overflow-auto" style={{ maxHeight: '80vh' }}>
          {loading ? (
            <div>Loading history...</div>
          ) : entries.length === 0 ? (
            <div>No history found.</div>
          ) : (
            Object.keys(groups).map((date) => (
              <div key={date} className="mb-6">
                <div className="mb-2 text-sm font-semibold">{date}</div>
                <div className="space-y-3">
                  {groups[date].map((entry) => (
                    <div key={entry.id} className="rounded border p-3">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              background: '#ddd',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                            }}
                          >
                            {entry.userName
                              ? entry.userName
                                  .split(' ')
                                  .map((s) => s[0])
                                  .slice(0, 2)
                                  .join('')
                              : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {entry.userName || `User ${entry.userId}`}
                            </div>
                            <div style={{ color: '#6b6b6b', fontSize: 12 }}>
                              {entry.actionType}{' '}
                              <span style={{ marginLeft: 8 }}>
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Badge appearance="outline">{entry.actionType}</Badge>
                        </div>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {entry.changes && entry.changes.length > 0 ? (
                          <ul className="ml-5 list-disc text-sm">
                            {entry.changes.map((c, idx) => (
                              <li key={idx}>
                                <strong>{c.field}:</strong>{' '}
                                <span style={{ color: '#6b6b6b' }}>
                                  {formatValue(c.oldValue)}
                                </span>{' '}
                                → {formatValue(c.newValue)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-muted-foreground text-sm">
                            No field-level changes recorded
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
