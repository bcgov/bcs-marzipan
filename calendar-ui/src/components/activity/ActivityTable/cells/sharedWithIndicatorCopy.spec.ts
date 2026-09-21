import { describe, expect, it } from 'vitest';

import {
  formatSharedWithCountBadge,
  sharedWithAriaLabel,
  sharedWithTeamsLine,
  sharedWithTooltipLines,
  sharedWithVisibilityLine,
} from './sharedWithIndicatorCopy';

describe('sharedWithIndicatorCopy', () => {
  it('formats visibility lines', () => {
    expect(sharedWithVisibilityLine('global', null)).toBe(
      'Visible to all calendar users'
    );
    expect(sharedWithVisibilityLine('team', 'HLTH Comms')).toBe(
      'Restricted to HLTH Comms'
    );
    expect(sharedWithVisibilityLine('team', null)).toBe('Restricted access');
  });

  it('formats share lines', () => {
    expect(sharedWithTeamsLine([])).toBe('Not shared');
    expect(sharedWithTeamsLine(['Comms Team'])).toBe('Shared with Comms Team');
    expect(sharedWithTeamsLine(['A', 'B'])).toBe('Shared with 2 teams');
  });

  it('builds tooltip lines with team names when multiple shares', () => {
    expect(sharedWithTooltipLines(['A', 'B'], 'global', null)).toEqual([
      'Visible to all calendar users',
      'Shared with 2 teams',
      'A',
      'B',
    ]);
  });

  it('caps badge count at 99+', () => {
    expect(formatSharedWithCountBadge(3)).toBe('3');
    expect(formatSharedWithCountBadge(100)).toBe('99+');
  });

  it('builds aria labels', () => {
    expect(sharedWithAriaLabel([], 'global', null)).toBe(
      'Visible to all calendar users. Not shared.'
    );
    expect(sharedWithAriaLabel(['Comms Team'], 'team', 'HLTH Comms')).toBe(
      'Restricted to HLTH Comms. Shared with Comms Team.'
    );
  });
});
