import { describe, expect, it } from 'vitest';

import {
  activityFormLinkState,
  getActivityFormBackTarget,
  getActivityListPageIndex,
  getActivityListScrollTop,
  getActivityListWindowScrollTop,
} from './activity-form-navigation-state';

describe('activity-form-navigation-state', () => {
  it('includes saved list scroll positions when provided', () => {
    const state = activityFormLinkState(
      { pathname: '/activities', search: '?page=2', hash: '#top' },
      384,
      96,
      2
    ).state;

    expect(state).toEqual({
      from: '/activities?page=2#top',
      activityListScrollTop: 384,
      activityListWindowScrollTop: 96,
      activityListPageIndex: 2,
    });
  });

  it('reads the back target and scroll positions from state', () => {
    const state = {
      from: '/activities?search=test',
      activityListPageIndex: 3,
      activityListScrollTop: 256,
      activityListWindowScrollTop: 48,
    };

    expect(getActivityFormBackTarget(state)).toBe('/activities?search=test');
    expect(getActivityListPageIndex(state)).toBe(3);
    expect(getActivityListScrollTop(state)).toBe(256);
    expect(getActivityListWindowScrollTop(state)).toBe(48);
  });

  it('rejects invalid state values', () => {
    expect(getActivityFormBackTarget({ from: '//evil.example' })).toBeNull();
    expect(
      getActivityListScrollTop({ activityListScrollTop: 'bad' })
    ).toBeNull();
    expect(
      getActivityListWindowScrollTop({ activityListWindowScrollTop: 'bad' })
    ).toBeNull();
    expect(getActivityListPageIndex({ activityListPageIndex: -1 })).toBeNull();
  });
});
