import { describe, expect, it } from 'vitest';

import {
  hasMinistryTabLeadTeamFilterConflict,
  MINISTRY_TAB_LEAD_FILTER_CONFLICT_NOTE,
} from './ministry-tab-lead-filter-conflict';

describe('hasMinistryTabLeadTeamFilterConflict', () => {
  it('is false when tab team is unset', () => {
    expect(hasMinistryTabLeadTeamFilterConflict(undefined, [1])).toBe(false);
  });

  it('is false when lead filter is empty', () => {
    expect(hasMinistryTabLeadTeamFilterConflict(5, [])).toBe(false);
  });

  it('is false when lead filter includes the tab team', () => {
    expect(hasMinistryTabLeadTeamFilterConflict(5, [5, 9])).toBe(false);
  });

  it('is true when lead filter excludes the tab team', () => {
    expect(hasMinistryTabLeadTeamFilterConflict(5, [9])).toBe(true);
  });
});

describe('MINISTRY_TAB_LEAD_FILTER_CONFLICT_NOTE', () => {
  it('mentions Ministry tab and Lead filter', () => {
    expect(MINISTRY_TAB_LEAD_FILTER_CONFLICT_NOTE).toMatch(/Ministry tab/i);
    expect(MINISTRY_TAB_LEAD_FILTER_CONFLICT_NOTE).toMatch(/Lead filter/i);
  });
});
