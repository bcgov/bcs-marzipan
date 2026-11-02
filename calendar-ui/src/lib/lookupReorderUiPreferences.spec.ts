import { afterEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_LOOKUP_REORDER_INTERACTION,
  LOOKUP_REORDER_UI_STORAGE_KEY,
  readLookupReorderInteraction,
  writeLookupReorderInteraction,
} from '@/lib/lookupReorderUiPreferences';

describe('lookupReorderUiPreferences', () => {
  afterEach(() => {
    window.localStorage.removeItem(LOOKUP_REORDER_UI_STORAGE_KEY);
  });

  it('defaults to step when storage is empty', () => {
    expect(readLookupReorderInteraction()).toBe(
      DEFAULT_LOOKUP_REORDER_INTERACTION
    );
  });

  it('round-trips drag and step through localStorage', () => {
    writeLookupReorderInteraction('drag');
    expect(readLookupReorderInteraction()).toBe('drag');
    writeLookupReorderInteraction('step');
    expect(readLookupReorderInteraction()).toBe('step');
  });

  it('ignores invalid stored values', () => {
    window.localStorage.setItem(LOOKUP_REORDER_UI_STORAGE_KEY, 'both');
    expect(readLookupReorderInteraction()).toBe('step');
  });
});
