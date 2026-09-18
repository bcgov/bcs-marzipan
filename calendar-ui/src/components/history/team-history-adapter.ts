import type { TeamHistoryEntry } from '@corpcal/shared/api/types';

import {
  fallbackHistoryActor,
  humanizeHistoryAction,
  normalizeTransitionChanges,
} from './history-format';
import type { HistoryEntryViewModel } from './history-types';

function formatTeamHistoryValue(_field: string, value: unknown): string {
  if (value == null || value === '') return 'None';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? 'None' : value.map(String).join(', ');
  }
  return JSON.stringify(value);
}

export function toTeamHistoryViewModel(
  entry: TeamHistoryEntry
): HistoryEntryViewModel {
  return {
    id: entry.id,
    actor: fallbackHistoryActor(entry.changedByUserName, entry.changedByUserId),
    actionLabel: humanizeHistoryAction(entry.actionType),
    changes: normalizeTransitionChanges(entry.changes, {
      getLabel: humanizeHistoryAction,
      formatValue: formatTeamHistoryValue,
    }),
    notes: entry.notes,
    timestamp: entry.timestamp,
  };
}
