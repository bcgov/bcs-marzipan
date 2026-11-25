import { describe, expect, it } from 'vitest';

import {
  compareStaffNames,
  getFirstNameSortLabel,
  sortByStaffName,
} from './staff-name-sort';

describe('staff-name-sort', () => {
  it('uses the given-name portion of Last, First display names', () => {
    expect(getFirstNameSortLabel('Smith, Jane')).toBe('Jane Smith');
  });

  it('sorts staff names by first-name label and falls back to id', () => {
    const sorted = sortByStaffName(
      [
        { id: 3, name: 'Smith, Zoe' },
        { id: 2, name: 'John Doe' },
        { id: 1, name: 'Adams, Alice' },
        { id: 4, name: 'John Doe' },
      ],
      (item) => item.name,
      (item) => item.id
    );

    expect(sorted.map((item) => item.id)).toEqual([1, 2, 4, 3]);
  });

  it('ignores the current-user suffix when comparing names', () => {
    expect(compareStaffNames('Jane Smith (you)', 'Jane Smith')).toBe(0);
  });

  it('sorts by canonical name field when present instead of titled display name', () => {
    const sorted = sortByStaffName(
      [
        {
          id: 2,
          name: 'Zoe Martens',
          displayName: 'Minister Zoe Martens',
        },
        {
          id: 1,
          name: 'Aaron Brooks',
          displayName: 'Attorney General Aaron Brooks',
        },
      ],
      (item) => item.name || item.displayName,
      (item) => item.id
    );

    expect(sorted.map((item) => item.name)).toEqual([
      'Aaron Brooks',
      'Zoe Martens',
    ]);
  });
});
