import { describe, expect, it } from 'vitest';

import {
  resolveActivityListScrollRestorePending,
  stashStrictModeScrollRestoreFallback,
  takeStrictModeScrollRestoreFallback,
} from './activity-list-scroll-restore';

describe('activity-list-scroll-restore', () => {
  it('merges location state with sessionStorage for focus id', () => {
    const resolved = resolveActivityListScrollRestorePending(
      {
        activityListPageIndex: 1,
        activityListScrollTop: 180,
      },
      JSON.stringify({
        activityListPageIndex: 1,
        activityListScrollTop: 180,
        activityListFocusActivityId: 12,
      })
    );

    expect(resolved?.source).toBe('location.state+sessionStorage');
    expect(resolved?.pending).toEqual({
      pageIndex: 1,
      containerScrollTop: 180,
      windowScrollTop: null,
      focusActivityId: 12,
    });
  });

  it('reads sessionStorage when location state has no scroll fields and POP is allowed', () => {
    const resolved = resolveActivityListScrollRestorePending(
      null,
      JSON.stringify({
        activityListPageIndex: 2,
        activityListScrollTop: 240,
        activityListFocusActivityId: 5,
      }),
      { allowSessionStorageFallback: true }
    );

    expect(resolved?.source).toBe('sessionStorage');
    expect(resolved?.pending.focusActivityId).toBe(5);
  });

  it('ignores sessionStorage when location state is empty and POP is not allowed', () => {
    const resolved = resolveActivityListScrollRestorePending(
      null,
      JSON.stringify({
        activityListPageIndex: 2,
        activityListScrollTop: 240,
        activityListFocusActivityId: 5,
      }),
      { allowSessionStorageFallback: false }
    );

    expect(resolved).toBeNull();
  });

  it('passes strict-mode fallback once', () => {
    stashStrictModeScrollRestoreFallback({
      pageIndex: 1,
      containerScrollTop: 100,
      windowScrollTop: null,
      focusActivityId: 3,
    });

    expect(takeStrictModeScrollRestoreFallback()).toEqual({
      pageIndex: 1,
      containerScrollTop: 100,
      windowScrollTop: null,
      focusActivityId: 3,
    });
    expect(takeStrictModeScrollRestoreFallback()).toBeNull();
  });
});
