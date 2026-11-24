import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@corpcal/shared';

import { LookAheadDateRangeControl } from './LookAheadDateRangeControl';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    hasPermission: (key: string) =>
      key === PERMISSIONS.REPORTS.PUBLISHED_LOOK_AHEAD_RANGE,
  }),
}));

describe('LookAheadDateRangeControl', () => {
  it('renders formatted range and preset trigger', () => {
    render(
      <LookAheadDateRangeControl
        dateRange={{
          startDate: '2026-05-28',
          endDate: '2026-05-28',
          noStartDate: false,
          noEndDate: false,
        }}
        activePreset="today"
        onDateRangeChange={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: /Date range:/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Choose date preset' })
    ).toBeInTheDocument();
  });
});
