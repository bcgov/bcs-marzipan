import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    teams: {
      id: number;
      name: string;
      displayName?: string | null;
      abbreviation?: string;
    }[];
    filterState: { leadTeamIds: number[] };
    canViewDeleted: boolean;
    user: { teamIds: number[] };
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
    user: overrides.user ?? { teamIds: [] },
    teams: overrides.teams ?? [],
    filterState: overrides.filterState ?? { leadTeamIds: [] },
    canViewDeleted: overrides.canViewDeleted ?? false,
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
    expect(screen.getByRole('menuitem', { name: 'Lead team' })).toBeTruthy();
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

  it('selects activities for a single lead team from the submenu', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const selectActivityIds = vi.fn();

    render(
      <ActivityBulkSelectHeader
        core={makeCore({
          selectActivityIds,
          sortedData: [
            { id: 1, leadTeamId: 10 },
            { id: 2, leadTeamId: 20 },
            { id: 3, leadTeamId: 10 },
          ],
          user: { teamIds: [10, 20] },
          teams: [
            { id: 10, name: 't10', abbreviation: 'T10' },
            { id: 20, name: 't20', abbreviation: 'T20' },
          ],
        })}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Select activities menu' })
    );
    await user.click(screen.getByRole('menuitem', { name: 'Lead team' }));
    const teamItem = await screen.findByRole('menuitem', {
      name: 'T10 activities (2)',
    });
    fireEvent.click(teamItem);

    await waitFor(() => expect(selectActivityIds).toHaveBeenCalledWith([1, 3]));
  });

  it('disables lead teams outside an active lead team filter', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(
      <ActivityBulkSelectHeader
        core={makeCore({
          sortedData: [
            { id: 1, leadTeamId: 10 },
            { id: 2, leadTeamId: 20 },
          ],
          user: { teamIds: [10, 20] },
          teams: [
            { id: 10, name: 't10', abbreviation: 'T10' },
            { id: 20, name: 't20', abbreviation: 'T20' },
          ],
          filterState: { leadTeamIds: [10] },
        })}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Select activities menu' })
    );
    await user.click(screen.getByRole('menuitem', { name: 'Lead team' }));

    const enabled = await screen.findByRole('menuitem', {
      name: 'T10 activities (1)',
    });
    const disabled = await screen.findByRole('menuitem', {
      name: 'T20 activities (1)',
    });

    expect(enabled).not.toHaveAttribute('data-disabled');
    expect(disabled).toHaveAttribute('data-disabled');
  });

  it('selects all my teams from the submenu', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const selectActivityIds = vi.fn();

    render(
      <ActivityBulkSelectHeader
        core={makeCore({
          selectActivityIds,
          sortedData: [
            { id: 1, leadTeamId: 10 },
            { id: 2, leadTeamId: 20 },
            { id: 3, leadTeamId: 99 },
          ],
          user: { teamIds: [10, 20] },
          teams: [
            { id: 10, name: 't10', abbreviation: 'T10' },
            { id: 20, name: 't20', abbreviation: 'T20' },
          ],
        })}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Select activities menu' })
    );
    await user.click(screen.getByRole('menuitem', { name: 'Lead team' }));
    const allMyTeamsItem = await screen.findByRole('menuitem', {
      name: 'All my teams (2)',
    });
    fireEvent.click(allMyTeamsItem);

    await waitFor(() => expect(selectActivityIds).toHaveBeenCalledWith([1, 2]));
  });
});
