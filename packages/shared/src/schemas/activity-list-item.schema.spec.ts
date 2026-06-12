import { describe, expect, it } from 'vitest';

import { createMockActivityListItem } from '../test-utils/activity-list-item.fixture';
import { createMockActivityResponse } from '../test-utils/activity-response.fixture';
import {
  ACTIVITY_LIST_ITEM_SHAPE,
  isActivityListItemPayload,
} from './activity-list-item.schema';

describe('isActivityListItemPayload', () => {
  it('returns true for list items with _shape discriminator', () => {
    expect(isActivityListItemPayload(createMockActivityListItem())).toBe(true);
  });

  it('returns false when _shape is missing', () => {
    expect(
      isActivityListItemPayload({
        ...createMockActivityListItem(),
        _shape: undefined,
      })
    ).toBe(false);
  });

  it('returns false for full ActivityResponse payloads', () => {
    expect(isActivityListItemPayload(createMockActivityResponse())).toBe(false);
  });

  it('returns false when required list fields are missing or wrong type', () => {
    expect(
      isActivityListItemPayload({
        _shape: ACTIVITY_LIST_ITEM_SHAPE,
        id: 1,
        title: 'T',
        isIssue: true,
      })
    ).toBe(false);
  });

  it('returns false for null and non-objects', () => {
    expect(isActivityListItemPayload(null)).toBe(false);
    expect(isActivityListItemPayload(undefined)).toBe(false);
    expect(isActivityListItemPayload('x')).toBe(false);
  });
});
