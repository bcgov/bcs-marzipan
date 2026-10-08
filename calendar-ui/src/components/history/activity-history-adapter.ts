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

export function formatActivityDisplayId(activity: {
  id: number;
  displayId: string | null;
}): string {
  if (activity.displayId?.trim()) {
    return activity.displayId.trim();
  }

  return `MIN-${String(activity.id).padStart(6, '0')}`;
}

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
  const displayId = formatActivityDisplayId(entry.activity);
  const title = entry.activity.title.trim();

  return {
    ...base,
    team: options.team,
    subject: {
      label: [displayId, title].filter(Boolean).join(' '),
      displayId,
      title,
      href: `/activity/${entry.activity.id}`,
      state: options.subjectState,
    },
  };
}
