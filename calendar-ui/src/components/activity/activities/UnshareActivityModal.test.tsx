import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';

import { UnshareActivityModal } from './UnshareActivityModal';

function renderModal(
  overrides: Partial<ComponentProps<typeof UnshareActivityModal>> = {}
) {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();

  render(
    <UnshareActivityModal
      open
      onOpenChange={onOpenChange}
      mode="single"
      activityIds={[42]}
      activities={[{ sharedWithTeamIds: [7], visibility: 'global' }]}
      eligibleTeams={[{ id: 7, name: 'AG Comms' }]}
      onConfirm={onConfirm}
      isPending={false}
      {...overrides}
    />
  );

  return { onConfirm, onOpenChange };
}

describe('UnshareActivityModal', () => {
  it('skips team selection when only one eligible team', () => {
    renderModal();

    expect(screen.getByText(/AG Comms/)).toBeInTheDocument();
    expect(screen.getByText(/from the Shared with list/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unshare' })).toBeInTheDocument();
  });

  it('calls onConfirm with the selected team', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Unshare' }));

    expect(onConfirm).toHaveBeenCalledWith(7);
  });

  it('shows bulk counts and mixed visibility copy', () => {
    renderModal({
      mode: 'bulk',
      activityIds: [1, 2, 3],
      activities: [
        { sharedWithTeamIds: [7], visibility: 'team' },
        { sharedWithTeamIds: [7], visibility: 'global' },
        { sharedWithTeamIds: [8], visibility: 'global' },
      ],
      eligibleTeams: [{ id: 7, name: 'AG Comms' }],
    });

    expect(
      screen.getByText(/for 2 of 3 selected activities/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Team-restricted activities/i)).toBeInTheDocument();
  });
});
