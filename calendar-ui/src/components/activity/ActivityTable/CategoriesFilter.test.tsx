import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CategoriesFilterPanel } from './CategoriesFilter';

describe('CategoriesFilterPanel', () => {
  const categoryOptions = [
    { value: '1', label: 'Event' },
    { value: '2', label: 'FYI' },
  ];

  it('filters options by search and toggles category names', async () => {
    const user = userEvent.setup();
    const onCategoryNamesChange = vi.fn();

    render(
      <CategoriesFilterPanel
        categoryOptions={categoryOptions}
        selectedCategoryNames={['Event']}
        onCategoryNamesChange={onCategoryNamesChange}
      />
    );

    expect(screen.getByLabelText('Search categories')).toBeInTheDocument();
    expect(screen.getByText('Event')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search categories'), 'fyi');
    expect(screen.queryByText('Event')).not.toBeInTheDocument();
    expect(screen.getByText('FYI')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'FYI' }));
    expect(onCategoryNamesChange).toHaveBeenCalledWith(['Event', 'FYI']);
  });
});
