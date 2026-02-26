import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BadgeGroup, type BadgeGroupItem } from './badge-group';

const baseItems: BadgeGroupItem[] = [
  { key: 'alpha', label: 'Alpha' },
  { key: 'beta', label: 'Beta' },
  { key: 'gamma', label: 'Gamma' },
  { key: 'delta', label: 'Delta' },
];

describe('BadgeGroup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all badges when items fit within max lines', async () => {
    render(
      <BadgeGroup items={baseItems} maxLines={1} visibleCountOverride={4} />
    );

    await waitFor(() => {
      expect(screen.queryByText('+1')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.getByText('Delta')).toBeInTheDocument();
  });

  it('renders overflow badge when items exceed max lines', async () => {
    render(
      <BadgeGroup items={baseItems} maxLines={1} visibleCountOverride={2} />
    );

    await waitFor(() => {
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
    expect(screen.queryByText('Delta')).not.toBeInTheDocument();
  });

  it('opens overflow popover from trigger hover and reveals hidden badges', async () => {
    const user = userEvent.setup();
    render(
      <BadgeGroup items={baseItems} maxLines={1} visibleCountOverride={2} />
    );

    const trigger = await screen.findByRole('button', {
      name: 'Show 2 more badges',
    });
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Gamma')).toBeInTheDocument();
      expect(screen.getByText('Delta')).toBeInTheDocument();
    });
  });

  it('shows more visible badges when maxLines is increased', async () => {
    const { rerender } = render(
      <BadgeGroup items={baseItems} maxLines={1} visibleCountOverride={2} />
    );

    await waitFor(() => {
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    rerender(
      <BadgeGroup items={baseItems} maxLines={2} visibleCountOverride={4} />
    );

    await waitFor(() => {
      expect(screen.queryByText('+1')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('+2')).not.toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.getByText('Delta')).toBeInTheDocument();
  });
});
