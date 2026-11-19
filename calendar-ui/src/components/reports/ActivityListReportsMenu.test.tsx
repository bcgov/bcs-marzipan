import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ActivityListReportsMenu } from './ActivityListReportsMenu';

const reports = [{ id: 1, name: 'planning', displayName: 'Planning Report' }];

describe('ActivityListReportsMenu', () => {
  it('enables report items when scope is allowed', async () => {
    const user = userEvent.setup();
    render(
      <ActivityListReportsMenu
        reports={reports}
        availability="allowed"
        onOpenReport={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /reports/i }));
    expect(screen.getByRole('menuitem', { name: /planning/i })).toBeEnabled();
  });

  it('disables items and shows conflict message', async () => {
    const user = userEvent.setup();
    const onShowFullList = vi.fn();
    render(
      <ActivityListReportsMenu
        reports={reports}
        availability="blocked-conflict"
        onOpenReport={vi.fn()}
        onShowFullList={onShowFullList}
      />
    );
    await user.click(screen.getByRole('button', { name: /reports/i }));
    expect(screen.getByRole('menuitem', { name: /planning/i })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(
      screen.getByText(/filters conflict with this view/i)
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('menuitem', { name: /show full activity list/i })
    );
    expect(onShowFullList).toHaveBeenCalled();
  });

  it('disables items and shows watchlist limit message', async () => {
    const user = userEvent.setup();
    render(
      <ActivityListReportsMenu
        reports={reports}
        availability="blocked-watchlist-limit"
        onOpenReport={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /reports/i }));
    expect(screen.getByRole('menuitem', { name: /planning/i })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getByText(/more than 500 activities/i)).toBeInTheDocument();
  });
});
