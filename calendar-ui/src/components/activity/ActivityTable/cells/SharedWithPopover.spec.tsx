import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SharedWithPopover } from './SharedWithPopover';

describe('SharedWithPopover', () => {
  it('always renders a share indicator with not-shared aria label', () => {
    render(
      <SharedWithPopover
        teamNames={[]}
        visibility="global"
        gridOverviewActions
      />
    );

    expect(
      screen.getByRole('button', {
        name: 'This activity is visible to all calendar users. Not shared. Open sharing details.',
      })
    ).toBeTruthy();
  });

  it('shows share count badge when there are shares', () => {
    render(
      <SharedWithPopover
        teamNames={['Comms Team', 'Events Team']}
        visibility="global"
        showShareCountBadge
        gridOverviewActions
      />
    );

    expect(screen.getByText('2')).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: 'This activity is visible to all calendar users. Shared with 2 teams. Open sharing details.',
      })
    ).toBeTruthy();
  });

  it('hides share count badge when showShareCountBadge is false', () => {
    render(
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

  it('opens a popover with a single shared team in the list', async () => {
    const user = userEvent.setup();

    render(
      <SharedWithPopover
        teamNames={['Comms Team']}
        visibility="global"
        gridOverviewActions
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: /Shared with 1 team\. Open sharing details\./,
      })
    );

    expect(screen.getByText('Shared with 1 team')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Shared teams' })).toBeTruthy();
    expect(screen.getByText('Comms Team')).toBeTruthy();
    expect(
      screen.getByText('This activity is visible to all calendar users.')
    ).toBeTruthy();
  });

  it('opens a scrollable team list in a popover when multiple shares', async () => {
    const user = userEvent.setup();

    render(
      <SharedWithPopover
        teamNames={['Comms Team', 'Events Team', 'Policy Team']}
        visibility="global"
        gridOverviewActions
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: /Shared with 3 teams\. Open sharing details\./,
      })
    );

    expect(screen.getByText('Shared with 3 teams')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Shared teams' })).toBeTruthy();
    expect(screen.getByText('Comms Team')).toBeTruthy();
    expect(screen.getByText('Events Team')).toBeTruthy();
    expect(screen.getByText('Policy Team')).toBeTruthy();
  });

  it('shows restricted visibility copy in the footer', async () => {
    const user = userEvent.setup();

    render(
      <SharedWithPopover
        teamNames={['Policy Team']}
        visibility="team"
        leadTeamDisplayName="HLTH Comms"
        gridOverviewActions
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: /Shared with 1 team\. Open sharing details\./,
      })
    );

    expect(
      screen.getByText(
        'This activity is visible only to HLTH Comms, shares, and exec.'
      )
    ).toBeTruthy();
  });
});
