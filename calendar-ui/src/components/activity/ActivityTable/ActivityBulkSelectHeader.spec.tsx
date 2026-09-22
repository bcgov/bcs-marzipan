import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ActivityBulkSelectHeader } from './ActivityBulkSelectHeader';

describe('ActivityBulkSelectHeader', () => {
  it('shows indeterminate header checkbox when some rows are selected', () => {
    render(
      <ActivityBulkSelectHeader
        core={
          {
            sortedData: [{ id: 1 }, { id: 2 }],
            sortedActivityIds: [1, 2],
            selectedActivityCount: 1,
            selectActivityIds: vi.fn(),
            pagination: { pageIndex: 0, pageSize: 25 },
            user: { teamIds: [] },
          } as never
        }
      />
    );

    const checkbox = screen.getByRole('checkbox', { hidden: true });
    expect(checkbox.getAttribute('data-state')).toBe('indeterminate');
  });

  it('opens the selection menu from the combined checkbox and chevron trigger', async () => {
    const user = userEvent.setup();
    render(
      <ActivityBulkSelectHeader
        core={
          {
            sortedData: [{ id: 1 }],
            sortedActivityIds: [1],
            selectedActivityCount: 0,
            selectActivityIds: vi.fn(),
            pagination: { pageIndex: 0, pageSize: 25 },
            user: { teamIds: [] },
          } as never
        }
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Select activities menu' })
    );
    expect(
      screen.getByRole('menuitem', { name: /All activities/ })
    ).toBeTruthy();
  });
});
