import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

import { SharedWithPopover } from './SharedWithPopover';

function renderShareIndicator(ui: ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe('SharedWithPopover', () => {
  it('always renders a share indicator with not-shared aria label', () => {
    renderShareIndicator(
      <SharedWithPopover
        teamNames={[]}
        visibility="global"
        gridOverviewActions
      />
    );

    expect(
      screen.getByLabelText('Visible to all calendar users. Not shared.')
    ).toBeTruthy();
  });

  it('shows share count badge when there are shares', () => {
    renderShareIndicator(
      <SharedWithPopover
        teamNames={['Comms Team', 'Events Team']}
        visibility="global"
        showShareCountBadge
        gridOverviewActions
      />
    );

    expect(screen.getByText('2')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Visible to all calendar users. Shared with 2 teams: Comms Team, Events Team.'
      )
    ).toBeTruthy();
  });

  it('hides share count badge when showShareCountBadge is false', () => {
    renderShareIndicator(
      <SharedWithPopover
        teamNames={['Comms Team']}
        visibility="team"
        leadTeamDisplayName="HLTH Comms"
        showShareCountBadge={false}
        gridOverviewActions
      />
    );

    expect(screen.queryByText('1')).toBeNull();
  });
});
