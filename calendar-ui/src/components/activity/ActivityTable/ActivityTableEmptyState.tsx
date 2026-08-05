type ActivityTableEmptyStateVariant =
  'no-data' | 'no-search-match' | 'no-filter-match' | 'no-favourites';

const EMPTY_MESSAGES: Record<
  ActivityTableEmptyStateVariant,
  { title: string; description: string }
> = {
  'no-data': {
    title: 'No activities found',
    description: 'Create a new entry or adjust filters to see activities here.',
  },
  'no-search-match': {
    title: 'No activities match your search',
    description: 'Try a different keyword or clear the search.',
  },
  'no-filter-match': {
    title: 'No activities match the current filters',
    description:
      'A filter is applied. Clearing filters may return more results.',
  },
  'no-favourites': {
    title: 'No watchlist activities',
    description: 'Add an activity to your watchlist to find it here quickly.',
  },
};

export function ActivityTableEmptyState({
  variant,
  onClearFilters,
  conflictNote,
}: {
  variant: ActivityTableEmptyStateVariant;
  onClearFilters?: () => void;
  /** Extra guidance when tab scope and filters conflict (e.g. Ministry tab + Lead filter). */
  conflictNote?: string;
}) {
  const { title, description } = EMPTY_MESSAGES[variant];
  return (
    <div className="py-12 text-center text-sm text-slate-600">
      <div className="mb-2 font-semibold">{title}</div>
      <div>{description}</div>
      {conflictNote ? (
        <p className="mx-auto mt-3 max-w-md text-slate-500">{conflictNote}</p>
      ) : null}
      {variant === 'no-filter-match' && onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 text-sm font-medium text-slate-700 underline hover:text-slate-900"
        >
          Reset all filters
        </button>
      ) : null}
    </div>
  );
}
