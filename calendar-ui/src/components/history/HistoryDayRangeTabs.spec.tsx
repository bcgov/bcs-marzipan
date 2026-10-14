import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  isDateRangeActive,
  type DateRangeValue,
} from '@/components/activity/ActivityTable/ScheduledDateRangeFields';

import { HistoryDayRangeTabs } from './HistoryDayRangeTabs';

const EMPTY_DATE_RANGE: DateRangeValue = {
  startDate: '',
  endDate: '',
  noStartDate: false,
  noEndDate: false,
};

describe('HistoryDayRangeTabs', () => {
  it('applies a preset when a quick pick tab is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: DateRangeValue) => void>();

    render(
      <HistoryDayRangeTabs value={EMPTY_DATE_RANGE} onChange={onChange} />
    );

    await user.click(screen.getByRole('tab', { name: 'Today' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(isDateRangeActive(onChange.mock.calls[0][0])).toBe(true);
    expect(onChange.mock.calls[0][0].startDate).toBe(
      onChange.mock.calls[0][0].endDate
    );
  });

  it('does not clear the preset immediately after selecting it', async () => {
    const user = userEvent.setup();
    let dateRange = EMPTY_DATE_RANGE;
    const onChange = vi.fn((value: DateRangeValue) => {
      dateRange = value;
    });

    const { rerender } = render(
      <HistoryDayRangeTabs value={dateRange} onChange={onChange} />
    );

    await user.click(screen.getByRole('tab', { name: 'Last 7 days' }));

    rerender(<HistoryDayRangeTabs value={dateRange} onChange={onChange} />);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(isDateRangeActive(dateRange)).toBe(true);
    expect(screen.getByRole('tab', { name: 'Last 7 days' })).toHaveAttribute(
      'data-state',
      'active'
    );
  });
});
