type ActivityTableEmptyStateVariant = 'no-data' | 'no-search-match';

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
};

export function ActivityTableEmptyState({
  variant,
}: {
  variant: ActivityTableEmptyStateVariant;
}) {
  const { title, description } = EMPTY_MESSAGES[variant];
  return (
    <div className="py-12 text-center text-sm text-slate-600">
      <div className="mb-2 font-semibold">{title}</div>
      <div>{description}</div>
    </div>
  );
}
