import { describe, expect, it } from 'vitest';

import {
  historyDetailsAriaLabel,
  historyDetailsHasDisclosure,
} from './history-details-label';

describe('historyDetailsAriaLabel', () => {
  it('returns change count text', () => {
    expect(historyDetailsAriaLabel(1, false)).toBe('1 change');
    expect(historyDetailsAriaLabel(3, false)).toBe('3 changes');
  });

  it('returns note text when only a note is present', () => {
    expect(historyDetailsAriaLabel(0, true)).toBe('Note');
  });

  it('combines changes and note labels', () => {
    expect(historyDetailsAriaLabel(2, true)).toBe('2 changes, Note');
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
