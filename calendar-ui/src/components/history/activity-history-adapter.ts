import type {
  ActivityHistoryEntry,
  GlobalActivityHistoryEntry,
} from '@corpcal/shared/api/types';
import {
  formatHistoryFieldValue,
  getActionText,
  getHistoryFieldLabel,
  type LookupMaps,
} from '@/lib/activity-history-format';

import {
  fallbackHistoryActor,
  formatHistoryUsername,
  normalizeTransitionChanges,
} from './history-format';
import type { HistoryEntryViewModel } from './history-types';

type ActivityAdapterOptions = {
  lookupMaps?: LookupMaps;
  formatValue?: (field: string, value: unknown) => string;
};

function activityActor(entry: ActivityHistoryEntry) {
  const name =
    entry.actor?.displayName ||
    formatHistoryUsername(entry.actor?.username ?? entry.userName) ||
    entry.userName;
  return {
    ...fallbackHistoryActor(name, entry.userId),
    username: entry.actor?.username,
  };
}

export function toActivityHistoryViewModel(
  entry: ActivityHistoryEntry,
  options: ActivityAdapterOptions = {}
): HistoryEntryViewModel {
  const formatValue =
    options.formatValue ??
    ((field: string, value: unknown) =>
      formatHistoryFieldValue(field, value, options.lookupMaps));

  return {
    id: entry.id,
    actor: activityActor(entry),
    actionLabel: getActionText(entry.actionType),
    changes: normalizeTransitionChanges(entry.changes, {
      getLabel: getHistoryFieldLabel,
      formatValue,
    }),
    notes: entry.notes,
    timestamp: entry.timestamp,
  };
}

export function toGlobalActivityHistoryViewModel(
  entry: GlobalActivityHistoryEntry,
  options: ActivityAdapterOptions & {
    team?: string | null;
    subjectState?: unknown;
  } = {}
): HistoryEntryViewModel {
  const base = toActivityHistoryViewModel(entry, options);
  return {
    ...base,
    team: options.team,
    subject: {
      label: [
        entry.activity.displayId || `Activity ${entry.activity.id}`,
        entry.activity.title,
      ]
        .filter(Boolean)
        .join(' '),
      href: `/activity/${entry.activity.id}`,
      state: options.subjectState,
    },
  };
}
