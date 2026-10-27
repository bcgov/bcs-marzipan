import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MinistryTabSelect } from './MinistryTabSelect';

const options = [
  { id: 1, label: 'Health' },
  { id: 2, label: 'Education' },
];

describe('MinistryTabSelect', () => {
  it('exposes persistent checked state and updates the ministry selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <MinistryTabSelect
        ariaLabel="Choose ministries"
        onChange={onChange}
        options={options}
        selectedIds={[1]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Choose ministries' }));

    expect(screen.getByRole('checkbox', { name: 'Health' })).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Education' })
    ).not.toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Education' }));

    expect(onChange).toHaveBeenCalledWith([1, 2]);
  });

  it('filters ministries and keeps the final ministry selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <MinistryTabSelect
        ariaLabel="Choose ministries"
        onChange={onChange}
        options={options}
        selectedIds={[1]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Choose ministries' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Search ministries' }),
      'health'
    );

    expect(screen.getByRole('checkbox', { name: 'Health' })).toBeChecked();
    expect(
      screen.queryByRole('checkbox', { name: 'Education' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Health' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
