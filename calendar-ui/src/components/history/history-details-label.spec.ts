import { describe, expect, it } from 'vitest';

import {
  historyDetailsBadgeLabel,
  historyDetailsBadgeLabels,
  historyDetailsHasDisclosure,
  historyDetailsHideLabel,
  historyDetailsShowLabel,
} from './history-details-label';

describe('historyDetailsBadgeLabel', () => {
  it('returns change count text', () => {
    expect(historyDetailsBadgeLabel(1, false)).toBe('1 change');
    expect(historyDetailsBadgeLabel(3, false)).toBe('3 changes');
  });

  it('returns note text when only a note is present', () => {
    expect(historyDetailsBadgeLabel(0, true)).toBe('Note');
  });

  it('combines note and changes with "and"', () => {
    expect(historyDetailsBadgeLabel(1, true)).toBe('Note and 1 change');
    expect(historyDetailsBadgeLabel(2, true)).toBe('Note and 2 changes');
  });
});

describe('historyDetailsBadgeLabels', () => {
  it('returns separate labels for note and changes', () => {
    expect(historyDetailsBadgeLabels(0, false)).toEqual([]);
    expect(historyDetailsBadgeLabels(1, false)).toEqual(['1 change']);
    expect(historyDetailsBadgeLabels(0, true)).toEqual(['Note']);
    expect(historyDetailsBadgeLabels(2, true)).toEqual(['Note', '2 changes']);
  });
});

describe('historyDetailsShowLabel', () => {
  it('returns show labels for changes', () => {
    expect(historyDetailsShowLabel(1, false)).toBe('Show 1 change');
    expect(historyDetailsShowLabel(3, false)).toBe('Show 3 changes');
  });

  it('returns show note when only a note is present', () => {
    expect(historyDetailsShowLabel(0, true)).toBe('Show note');
  });

  it('combines show note and changes with "and"', () => {
    expect(historyDetailsShowLabel(1, true)).toBe('Show note and 1 change');
    expect(historyDetailsShowLabel(2, true)).toBe('Show note and 2 changes');
  });
});

describe('historyDetailsHideLabel', () => {
  it('returns hide labels for changes', () => {
    expect(historyDetailsHideLabel(1, false)).toBe('Hide change');
    expect(historyDetailsHideLabel(3, false)).toBe('Hide changes');
  });

  it('returns hide note when only a note is present', () => {
    expect(historyDetailsHideLabel(0, true)).toBe('Hide note');
  });

  it('combines hide note and changes with "and"', () => {
    expect(historyDetailsHideLabel(1, true)).toBe('Hide note and 1 change');
    expect(historyDetailsHideLabel(4, true)).toBe('Hide note and 4 changes');
  });
});

describe('historyDetailsHasDisclosure', () => {
  it('is true when changes or notes exist', () => {
    expect(historyDetailsHasDisclosure(0, false)).toBe(false);
    expect(historyDetailsHasDisclosure(1, false)).toBe(true);
    expect(historyDetailsHasDisclosure(0, true)).toBe(true);
    expect(historyDetailsHasDisclosure(2, true)).toBe(true);
  });
});
