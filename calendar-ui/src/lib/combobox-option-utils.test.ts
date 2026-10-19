import { describe, expect, it } from 'vitest';

import {
  optionItemsEqual,
  uniqueNumericIdsFromOptions,
  uniqueOptionItems,
} from './combobox-option-utils';

describe('combobox-option-utils', () => {
  it('compares option items by value string', () => {
    expect(
      optionItemsEqual({ value: '1', label: 'A' }, { value: '1', label: 'B' })
    ).toBe(true);
    expect(
      optionItemsEqual({ value: '1', label: 'A' }, { value: '2', label: 'A' })
    ).toBe(false);
  });

  it('dedupes option items by value preserving order', () => {
    const a = { value: '1', label: 'First' };
    const b = { value: '2', label: 'Second' };
    const aDuplicate = { value: '1', label: 'Other label' };
    expect(uniqueOptionItems([a, b, aDuplicate])).toEqual([a, b]);
  });

  it('dedupes numeric ids from options', () => {
    expect(
      uniqueNumericIdsFromOptions([
        { value: '1', label: 'One' },
        { value: '2', label: 'Two' },
        { value: '1', label: 'One again' },
      ])
    ).toEqual([1, 2]);
  });
});
