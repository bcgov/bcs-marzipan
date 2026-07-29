import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CategoriesFilterPanel } from './CategoriesFilter';

describe('CategoriesFilterPanel', () => {
  const categoryOptions = [
    { value: '1', label: 'Event' },
    { value: '2', label: 'FYI' },
  ];

  it('filters options by search and toggles category ids', async () => {
    const user = userEvent.setup();
    const onCategoryIdsChange = vi.fn();

    render(
      <CategoriesFilterPanel
        categoryOptions={categoryOptions}
        selectedCategoryIds={[1]}
        onCategoryIdsChange={onCategoryIdsChange}
      />
    );

    expect(screen.getByLabelText('Search categories')).toBeInTheDocument();
    expect(screen.getByText('Event')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search categories'), 'fyi');
    expect(screen.queryByText('Event')).not.toBeInTheDocument();
    expect(screen.getByText('FYI')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'FYI' }));
    expect(onCategoryIdsChange).toHaveBeenCalledWith([1, 2]);
  });
});
