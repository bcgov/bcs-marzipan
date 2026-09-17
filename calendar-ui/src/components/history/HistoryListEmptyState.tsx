type HistoryListEmptyStateVariant =
  | 'no-data'
  | 'no-search-match'
  | 'no-filter-match'
  | 'no-timeframe';

const EMPTY_MESSAGES: Record<
  HistoryListEmptyStateVariant,
  { title: string; description?: string }
> = {
  'no-data': {
    title: 'No history found',
    description: 'Adjust your filters to see records of activity changes.',
  },
  'no-search-match': {
    title: 'No matching history found',
    description: 'Try a different keyword or clear the search.',
  },
  'no-filter-match': {
    title: 'No matching history found',
    description: 'Try adjusting or clearing your filters.',
  },
  'no-timeframe': {
    title: 'No changes in the selected timeframe',
  },
};

export function HistoryListEmptyState({
  variant,
}: {
  variant: HistoryListEmptyStateVariant;
}) {
  const { title, description } = EMPTY_MESSAGES[variant];

  return (
    <div className="py-12 text-center text-sm text-slate-600">
      <div className={description ? 'mb-2 font-semibold' : 'font-semibold'}>
        {title}
      </div>
      {description ? <div>{description}</div> : null}
    </div>
  );
}
