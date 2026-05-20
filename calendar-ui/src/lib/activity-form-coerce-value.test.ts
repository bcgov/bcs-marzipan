import { describe, expect, it } from 'vitest';

import {
  lookAheadSectionFormValue,
  lookAheadStatusFormValue,
  optionalIdSelectDisplayValue,
  optionalRadioDisplayValue,
  optionalRadioEnumValue,
  optionalSelectIdValue,
} from './activity-form-coerce-value';

describe('optionalSelectIdValue', () => {
  it('maps empty string to undefined', () => {
    expect(optionalSelectIdValue('')).toBeUndefined();
  });

  it('parses numeric strings', () => {
    expect(optionalSelectIdValue('42')).toBe(42);
  });

  it('returns undefined for non-numeric strings', () => {
    expect(optionalSelectIdValue('abc')).toBeUndefined();
  });
});

describe('optionalRadioEnumValue', () => {
  const allowed = ['a', 'b'] as const;

  it('maps empty string to undefined', () => {
    expect(optionalRadioEnumValue('', allowed)).toBeUndefined();
  });

  it('returns allowed literals', () => {
    expect(optionalRadioEnumValue('a', allowed)).toBe('a');
  });

  it('rejects unknown literals', () => {
    expect(optionalRadioEnumValue('c', allowed)).toBeUndefined();
  });
});

describe('lookAheadStatusFormValue', () => {
  it('accepts schema enum values', () => {
    expect(lookAheadStatusFormValue('new')).toBe('new');
  });

  it('maps empty to undefined', () => {
    expect(lookAheadStatusFormValue('')).toBeUndefined();
  });
});

describe('lookAheadSectionFormValue', () => {
  it('preserves non-empty section keys', () => {
    expect(lookAheadSectionFormValue('events')).toBe('events');
  });

  it('maps empty to undefined', () => {
    expect(lookAheadSectionFormValue('')).toBeUndefined();
  });
});

describe('display helpers', () => {
  it('optionalIdSelectDisplayValue formats ids', () => {
    expect(optionalIdSelectDisplayValue(undefined)).toBe('');
    expect(optionalIdSelectDisplayValue(3)).toBe('3');
  });

  it('optionalRadioDisplayValue formats strings', () => {
    expect(optionalRadioDisplayValue(undefined)).toBe('');
    expect(optionalRadioDisplayValue('new')).toBe('new');
  });
});
