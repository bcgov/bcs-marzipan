import { describe, expect, it } from 'vitest';

import { formatLeadTeamSelectLabel } from './lead-team-display-label';

describe('formatLeadTeamSelectLabel', () => {
  it('appends ministry name in parentheses when present', () => {
    expect(
      formatLeadTeamSelectLabel({
        name: 'comms',
        displayName: 'Comms Team',
        ministryName: 'Executive Council',
      })
    ).toBe('Comms Team (Executive Council)');
  });

  it('uses name when displayName is null', () => {
    expect(
      formatLeadTeamSelectLabel({
        name: 'Legacy Team',
        displayName: null,
        ministryName: 'Ministry of Example',
      })
    ).toBe('Legacy Team (Ministry of Example)');
  });

  it('omits brackets when ministry name is absent', () => {
    expect(
      formatLeadTeamSelectLabel({
        name: 'Standalone',
        displayName: null,
        ministryName: null,
      })
    ).toBe('Standalone');
  });
});
