import type { HistoryChange } from '@corpcal/shared/api/types';

export type HistoryActorViewModel = {
  id?: number;
  name: string;
  username?: string | null;
};

export type HistorySubjectViewModel = {
  label: string;
  title?: string;
  href?: string;
  state?: unknown;
};

export type HistoryChangeViewModel =
  | {
      key: string;
      kind: 'transition';
      label: string;
      oldValue: string;
      newValue: string;
    }
  | {
      key: string;
      kind: 'message';
      message: string;
    };

export type HistoryListVariant = 'default' | 'compact';

export type HistoryEntryViewModel = {
  id: number;
  actor: HistoryActorViewModel;
  team?: string | null;
  actionLabel: string;
  subject?: HistorySubjectViewModel;
  changes: HistoryChangeViewModel[];
  notes?: string | null;
  timestamp: string;
};

export type HistoryTransitionFormatter = (
  change: HistoryChange,
  index: number
) => HistoryChangeViewModel | null;
