import type { HistoryTableRow } from './history-table-types';
import type { HistoryEntryViewModel } from './history-types';

export function buildHistoryTableRows(
  entries: HistoryEntryViewModel[]
): HistoryTableRow[] {
  return entries.map((entry) => ({ kind: 'entry', entry }));
}
