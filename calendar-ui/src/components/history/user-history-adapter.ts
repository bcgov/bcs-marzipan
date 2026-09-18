import type { UserHistoryEntry } from '@corpcal/shared/api/types';
import {
  buildUserHistoryChangeMessage,
  type UserHistoryLookups,
} from '@/components/users/userHistoryFormatting';

import { fallbackHistoryActor, humanizeHistoryAction } from './history-format';
import type { HistoryEntryViewModel } from './history-types';

export function toUserHistoryViewModel(
  entry: UserHistoryEntry,
  lookups: UserHistoryLookups
): HistoryEntryViewModel {
  return {
    id: entry.id,
    actor: fallbackHistoryActor(entry.changedByUserName, entry.changedByUserId),
    actionLabel: humanizeHistoryAction(entry.actionType),
    changes: (entry.changes ?? []).map((change, index) => ({
      key: `${change.field}-${index}`,
      kind: 'message' as const,
      message: buildUserHistoryChangeMessage(change, lookups),
    })),
    notes: entry.notes,
    timestamp: entry.timestamp,
  };
}
