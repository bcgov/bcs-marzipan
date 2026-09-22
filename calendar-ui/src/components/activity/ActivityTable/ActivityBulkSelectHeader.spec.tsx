import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ActivityBulkSelectHeader } from './ActivityBulkSelectHeader';

function makeCore(
  overrides: Partial<{
    sortedData: { id: number; leadTeamId?: number | null }[];
    sortedActivityIds: number[];
    selectedActivityCount: number;
    selectActivityIds: ReturnType<typeof vi.fn>;
    clearSelection: ReturnType<typeof vi.fn>;
  }> = {}
) {
  const sortedData = overrides.sortedData ?? [{ id: 1 }, { id: 2 }];
  return {
    sortedData,
    sortedActivityIds:
      overrides.sortedActivityIds ?? sortedData.map((r) => r.id),
    selectedActivityCount: overrides.selectedActivityCount ?? 0,
    selectActivityIds: overrides.selectActivityIds ?? vi.fn(),
    clearSelection: overrides.clearSelection ?? vi.fn(),
    pagination: { pageIndex: 0, pageSize: 25 },
    user: { teamIds: [] },
  } as never;
}

describe('ActivityBulkSelectHeader', () => {
  it('shows indeterminate header checkbox when some rows are selected', () => {
    render(
      <ActivityBulkSelectHeader core={makeCore({ selectedActivityCount: 1 })} />
    );

    expect(
      screen.getByRole('checkbox', { name: 'Select all activities' })
    ).toHaveAttribute('data-state', 'indeterminate');
  });

  it('selects all sorted activities when none are selected', async () => {
    const user = userEvent.setup();
    const selectActivityIds = vi.fn();

    render(
      <ActivityBulkSelectHeader
        core={makeCore({
          selectedActivityCount: 0,
          selectActivityIds,
          sortedActivityIds: [1, 2],
        })}
      />
    );

    await user.click(
      screen.getByRole('checkbox', { name: 'Select all activities' })
    );
    expect(selectActivityIds).toHaveBeenCalledWith([1, 2]);
  });

  it('selects all sorted activities when some are selected', async () => {
    const user = userEvent.setup();
    const selectActivityIds = vi.fn();

    render(
      <ActivityBulkSelectHeader
        core={makeCore({
          selectedActivityCount: 1,
          selectActivityIds,
          sortedActivityIds: [1, 2],
        })}
      />
    );

    await user.click(
      screen.getByRole('checkbox', { name: 'Select all activities' })
    );
    expect(selectActivityIds).toHaveBeenCalledWith([1, 2]);
  });

  it('clears selection when all rows are selected and the header checkbox is clicked', async () => {
    const user = userEvent.setup();
    const clearSelection = vi.fn();

    render(
      <ActivityBulkSelectHeader
        core={makeCore({
          selectedActivityCount: 2,
          clearSelection,
        })}
      />
    );

    await user.click(
      screen.getByRole('checkbox', { name: 'Select all activities' })
    );
    expect(clearSelection).toHaveBeenCalledTimes(1);
  });

  it('opens the selection menu from the chevron trigger', async () => {
    const user = userEvent.setup();

    render(
      <ActivityBulkSelectHeader
        core={makeCore({
          sortedData: [{ id: 1 }],
          sortedActivityIds: [1],
        })}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Select activities menu' })
    );
    expect(
      screen.getByRole('menuitem', { name: /All activities/ })
    ).toBeTruthy();
  });

  it('does not open the selection menu when the header checkbox is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ActivityBulkSelectHeader
        core={makeCore({
          sortedData: [{ id: 1 }],
          sortedActivityIds: [1],
        })}
      />
    );

    await user.click(
      screen.getByRole('checkbox', { name: 'Select all activities' })
    );
    expect(
      screen.queryByRole('menuitem', { name: /All activities/ })
    ).toBeNull();
  });
});
