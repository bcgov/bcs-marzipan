import { describe, expect, it } from 'vitest';

import {
  formatSharedWithCountBadge,
  sharedWithAriaLabel,
  sharedWithFormVisibilityDescription,
  sharedWithPopoverTitle,
  sharedWithTeamsLine,
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

  it('formats popover title and form visibility copy', () => {
    expect(sharedWithPopoverTitle(0)).toBe('Not shared');
    expect(sharedWithPopoverTitle(1)).toBe('Shared with 1 team');
    expect(sharedWithPopoverTitle(4)).toBe('Shared with 4 teams');
    expect(sharedWithFormVisibilityDescription('global', null)).toBe(
      'This activity is visible to all calendar users.'
    );
    expect(sharedWithFormVisibilityDescription('team', 'HLTH Comms')).toBe(
      'This activity is visible only to HLTH Comms, shares, and exec.'
    );
  });

  it('caps badge count at 99+', () => {
    expect(formatSharedWithCountBadge(3)).toBe('3');
    expect(formatSharedWithCountBadge(100)).toBe('99+');
  });

  it('builds aria labels', () => {
    expect(sharedWithAriaLabel([], 'global', null)).toBe(
      'This activity is visible to all calendar users. Not shared. Open sharing details.'
    );
    expect(sharedWithAriaLabel(['Comms Team'], 'team', 'HLTH Comms')).toBe(
      'This activity is visible only to HLTH Comms, shares, and exec. Shared with 1 team. Open sharing details.'
    );
    expect(sharedWithAriaLabel(['A', 'B'], 'global', null)).toBe(
      'This activity is visible to all calendar users. Shared with 2 teams. Open sharing details.'
    );
  });
});
