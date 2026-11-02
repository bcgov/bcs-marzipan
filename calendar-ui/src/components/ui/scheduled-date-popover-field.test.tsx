import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ScheduledDatePopoverField } from './scheduled-date-popover-field';

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect?: (date: Date | undefined) => void }) => (
    <button
      type="button"
      data-testid="mock-calendar-select"
      onClick={() => onSelect?.(new Date('2026-06-15T12:00:00'))}
    >
      Pick day
    </button>
  ),
}));

describe('ScheduledDatePopoverField', () => {
  it('closes popover and calls onAfterSelect when a day is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onAfterSelect = vi.fn();

    render(
      <ScheduledDatePopoverField
        value=""
        onChange={onChange}
        onAfterSelect={onAfterSelect}
        label="Select date"
        popoverTitle="Select date"
        triggerAriaLabel="Date"
      />
    );

    await user.click(screen.getByRole('button', { name: 'Date' }));
    expect(screen.getByTestId('mock-calendar-select')).toBeInTheDocument();

    await user.click(screen.getByTestId('mock-calendar-select'));

    expect(onChange).toHaveBeenCalledWith('2026-06-15');
    expect(onAfterSelect).toHaveBeenCalledWith('2026-06-15');
    expect(
      screen.queryByTestId('mock-calendar-select')
    ).not.toBeInTheDocument();
  });

  it('notifies controlled onPopoverOpenChange(false) when a day is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onPopoverOpenChange = vi.fn();

    render(
      <ScheduledDatePopoverField
        value=""
        onChange={onChange}
        popoverOpen
        onPopoverOpenChange={onPopoverOpenChange}
        label="Select date"
        popoverTitle="Select date"
        triggerAriaLabel="Date"
      />
    );

    expect(screen.getByTestId('mock-calendar-select')).toBeInTheDocument();

    await user.click(screen.getByTestId('mock-calendar-select'));

    expect(onChange).toHaveBeenCalledWith('2026-06-15');
    expect(onPopoverOpenChange).toHaveBeenCalledWith(false);
  });
});
