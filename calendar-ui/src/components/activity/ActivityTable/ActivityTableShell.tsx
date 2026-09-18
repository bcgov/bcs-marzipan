import { useActivityGridLayoutPreferences } from '@/hooks/useActivityGridLayoutPreferences';

import { type ActivityTableProps } from './ActivityTable';
import { ActivityTableGridA } from './ActivityTableGridA';

export type ActivityTableShellProps = ActivityTableProps;

/** Activity list using Grid A. Grid C (`ActivityTable`) remains available for direct use. */
export function ActivityTableShell(props: ActivityTableShellProps) {
  const layoutPreferences = useActivityGridLayoutPreferences();

  return (
    <ActivityTableGridA {...props} layoutPreferences={layoutPreferences} />
  );
}
