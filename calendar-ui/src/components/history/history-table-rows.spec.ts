import { describe, expect, it } from 'vitest';

import { buildHistoryTableRows } from './history-table-rows';
import type { HistoryEntryViewModel } from './history-types';

const timestamp = new Date().toISOString();

function entry(id: number): HistoryEntryViewModel {
  return {
    id,
    actor: { id, name: `User ${id}` },
    actionLabel: 'Updated',
    changes: [],
    timestamp,
  };
}

describe('buildHistoryTableRows', () => {
  it('maps entries to table rows', () => {
    const rows = buildHistoryTableRows([entry(1), entry(2)]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ kind: 'entry', entry: { id: 1 } });
    expect(rows[1]).toMatchObject({ kind: 'entry', entry: { id: 2 } });
  });
});
