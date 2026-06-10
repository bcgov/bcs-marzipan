import {
  ACTIVITY_LIST_ITEM_SHAPE,
  activityResponseToListItem,
  type ActivityListItem,
} from '../schemas/activity-list-item.schema';
import { createMockActivityResponse } from './activity-response.fixture';

/**
 * Creates a mock ActivityListItem for list/report endpoint tests.
 */
export function createMockActivityListItem(
  overrides?: Partial<ActivityListItem>
): ActivityListItem {
  const base = activityResponseToListItem(createMockActivityResponse());
  return {
    ...base,
    _shape: ACTIVITY_LIST_ITEM_SHAPE,
    ...overrides,
  };
}
