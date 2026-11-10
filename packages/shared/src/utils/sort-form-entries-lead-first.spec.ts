import { describe, expect, it } from 'vitest';

import { sortFormEntriesLeadFirst } from './sort-form-entries-lead-first';

describe('sortFormEntriesLeadFirst', () => {
  it('moves lead entry to index 0', () => {
    expect(
      sortFormEntriesLeadFirst([
        { id: 'a', isLead: false },
        { id: 'b', isLead: true },
        { id: 'c', isLead: false },
      ])
    ).toEqual([
      { id: 'b', isLead: true },
      { id: 'a', isLead: false },
      { id: 'c', isLead: false },
    ]);
  });

  it('leaves order unchanged when lead is already first', () => {
    const input = [
      { id: 'b', isLead: true },
      { id: 'a', isLead: false },
    ];
    expect(sortFormEntriesLeadFirst(input)).toEqual(input);
  });

  it('returns a copy when there is no lead flag', () => {
    const input = [
      { id: 'a', isLead: false },
      { id: 'b', isLead: false },
    ];
    expect(sortFormEntriesLeadFirst(input)).toEqual(input);
    expect(sortFormEntriesLeadFirst(input)).not.toBe(input);
  });
});
