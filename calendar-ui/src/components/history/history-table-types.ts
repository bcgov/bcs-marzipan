import type { HistoryEntryViewModel } from './history-types';

export type HistoryTableEntryRow = {
  kind: 'entry';
  entry: HistoryEntryViewModel;
};

export type HistoryTableRow = HistoryTableEntryRow;

export function historyTableEntryRowId(entryId: number): string {
  return `entry-${entryId}`;
}

export function isHistoryTableEntryRow(
  row: HistoryTableRow
): row is HistoryTableEntryRow {
  return row.kind === 'entry';
}
