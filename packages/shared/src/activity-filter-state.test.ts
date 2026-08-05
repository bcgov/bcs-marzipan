import { describe, expect, it } from 'vitest';

import {
  activityFilterStateIsDefault,
  coerceActivityFilterStateFromRecord,
  DEFAULT_ACTIVITY_FILTER_STATE,
  hasDisallowedActivityFilterStateKeys,
} from './activity-filter-state';

describe('activityFilterStateIsDefault', () => {
  it('returns true for DEFAULT_ACTIVITY_FILTER_STATE', () => {
    expect(activityFilterStateIsDefault(DEFAULT_ACTIVITY_FILTER_STATE)).toBe(
      true
    );
  });

  it('returns false when a category is selected', () => {
    expect(
      activityFilterStateIsDefault({
        ...DEFAULT_ACTIVITY_FILTER_STATE,
        categoryIds: [1],
      })
    ).toBe(false);
  });
});

describe('hasDisallowedActivityFilterStateKeys', () => {
  it('returns false for empty object', () => {
    expect(hasDisallowedActivityFilterStateKeys({})).toBe(false);
  });

  it('returns true for unknown keys', () => {
    expect(
      hasDisallowedActivityFilterStateKeys({
        ...DEFAULT_ACTIVITY_FILTER_STATE,
        futureField: [1],
      })
    ).toBe(true);
  });
});

describe('coerceActivityFilterStateFromRecord', () => {
  it('produces default-shaped state for empty record', () => {
    expect(coerceActivityFilterStateFromRecord({})).toEqual(
      DEFAULT_ACTIVITY_FILTER_STATE
    );
  });
});
