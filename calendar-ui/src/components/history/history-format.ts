import type { HistoryChange } from '@corpcal/shared/api/types';

import { getHistoryActionLabel } from './history-action-labels';
import type {
  HistoryActorViewModel,
  HistoryChangeViewModel,
} from './history-types';

export function humanizeHistoryAction(actionType: string): string {
  return getHistoryActionLabel(actionType);
}

export function formatHistoryUsername(username?: string | null): string | null {
  if (!username) return null;
  const hadDomain = username.includes('\\');
  const normalized = username.split('\\').at(-1)?.split('@')[0]?.trim();
  if (!normalized) return null;

  if (!/[._-]/.test(normalized)) {
    return hadDomain
      ? normalized.charAt(0).toUpperCase() +
          normalized.slice(1).toLocaleLowerCase()
      : normalized;
  }

  return normalized
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function historyActorInitials(actor: HistoryActorViewModel): string {
  const parts = actor.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function fallbackHistoryActor(
  name: string | null | undefined,
  id?: number
): HistoryActorViewModel {
  return {
    ...(id == null ? {} : { id }),
    name: name?.trim() || (id == null ? 'Unknown user' : `User ${id}`),
  };
}

export function normalizeTransitionChanges(
  changes: HistoryChange[] | null | undefined,
  options: {
    getLabel: (field: string) => string;
    formatValue: (field: string, value: unknown) => string;
    include?: (change: HistoryChange) => boolean;
  }
): HistoryChangeViewModel[] {
  return (changes ?? [])
    .filter((change) => options.include?.(change) ?? true)
    .map((change, index) => ({
      key: `${change.field}-${index}`,
      kind: 'transition' as const,
      field: change.field,
      label: options.getLabel(change.field),
      oldValue: options.formatValue(change.field, change.oldValue),
      newValue: options.formatValue(change.field, change.newValue),
    }));
}
