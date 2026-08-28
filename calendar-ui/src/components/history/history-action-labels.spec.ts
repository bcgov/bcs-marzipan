import { describe, expect, it } from 'vitest';

import { getHistoryActionLabel } from './history-action-labels';

describe('getHistoryActionLabel', () => {
  it('maps known activity action types', () => {
    expect(getHistoryActionLabel('flag_assigned')).toBe('Flagged');
    expect(getHistoryActionLabel('flag_removed')).toBe('Unflagged');
    expect(getHistoryActionLabel('reviewed')).toBe('Reviewed');
    expect(getHistoryActionLabel('completed')).toBe('Completed');
  });

  it('maps known user action types', () => {
    expect(getHistoryActionLabel('team_added')).toBe('Team added');
    expect(getHistoryActionLabel('activities_transferred')).toBe(
      'Activities transferred'
    );
  });

  it('sentence-cases unknown action types', () => {
    expect(getHistoryActionLabel('ministry_list_updated')).toBe(
      'Ministry list updated'
    );
    expect(getHistoryActionLabel('UPDATE')).toBe('Update');
  });
});
