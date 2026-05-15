import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ActivityTableEmptyState } from './ActivityTableEmptyState';

describe('ActivityTableEmptyState', () => {
  it('renders no-data variant', () => {
    render(<ActivityTableEmptyState variant="no-data" />);

    expect(screen.getByText('No activities found')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Create a new entry or adjust filters to see activities here.'
      )
    ).toBeInTheDocument();
  });

  it('renders no-search-match variant', () => {
    render(<ActivityTableEmptyState variant="no-search-match" />);

    expect(
      screen.getByText('No activities match your search')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Try a different keyword or clear the search.')
    ).toBeInTheDocument();
  });

  it('renders no-filter-match variant with clear button', async () => {
    const onClearFilters = vi.fn();
    render(
      <ActivityTableEmptyState
        variant="no-filter-match"
        onClearFilters={onClearFilters}
      />
    );

    expect(
      screen.getByText('No activities match the current filters')
    ).toBeInTheDocument();
    const clearButton = screen.getByRole('button', {
      name: /clear all filters/i,
    });
    await userEvent.click(clearButton);
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('renders no-favourites variant', () => {
    render(<ActivityTableEmptyState variant="no-favourites" />);

    expect(screen.getByText('No watchlist activities')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Add an activity to your watchlist to find it here quickly.'
      )
    ).toBeInTheDocument();
  });

  it('does not render a clear button for no-favourites variant', () => {
    render(
      <ActivityTableEmptyState
        variant="no-favourites"
        onClearFilters={vi.fn()}
      />
    );

    expect(
      screen.queryByRole('button', { name: /clear all filters/i })
    ).not.toBeInTheDocument();
  });
});
