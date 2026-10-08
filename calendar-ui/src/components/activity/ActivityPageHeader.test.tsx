import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

import { ActivityPageHeader } from './ActivityPageHeader';

function renderHeader(ui: ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe('ActivityPageHeader unshare action', () => {
  it('renders Unshare button between flag and favourite actions', async () => {
    const user = userEvent.setup();
    const onUnshare = vi.fn();

    renderHeader(
      <ActivityPageHeader
        displayId="TEAM-000001"
        title="Sample activity"
        categories={['Media']}
        unshareAction={{
          teamLabel: 'AG Comms',
          disabled: false,
          onClick: onUnshare,
          isPending: false,
        }}
      />
    );

    const button = screen.getByRole('button', { name: /Unshare AG Comms/i });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(onUnshare).toHaveBeenCalledTimes(1);
  });

  it('disables unshare when locked and shows the reason', () => {
    renderHeader(
      <ActivityPageHeader
        displayId="TEAM-000001"
        title="Sample activity"
        categories={['Media']}
        unshareAction={{
          teamLabel: 'AG Comms',
          disabled: true,
          disabledReason: 'Cannot unshare while activity is being edited.',
          onClick: vi.fn(),
          isPending: false,
        }}
      />
    );

    const button = screen.getByRole('button', {
      name: /Cannot unshare while activity is being edited/i,
    });
    expect(button).toBeDisabled();
  });
});
