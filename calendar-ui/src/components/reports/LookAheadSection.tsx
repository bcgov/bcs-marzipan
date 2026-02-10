import { useState, useMemo } from 'react';
import type { LookAheadSectionData } from '../../api/reportsApi';
import { DateGroupedTable } from './DateGroupedTable';
import { Button } from '../ui/button';

const PAGE_SIZE = 20;

interface LookAheadSectionProps {
  section: LookAheadSectionData;
}

export function LookAheadSection({ section }: LookAheadSectionProps) {
  const [pageIndex, setPageIndex] = useState(0);

  const { paginatedActivities, pageCount } = useMemo(() => {
    const total = section.activities.length;
    const count = Math.ceil(total / PAGE_SIZE) || 1;
    const start = pageIndex * PAGE_SIZE;
    const paginated = section.activities.slice(start, start + PAGE_SIZE);
    return { paginatedActivities: paginated, pageCount: count };
  }, [section.activities, pageIndex]);

  const canPrevious = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="min-h-[400px] overflow-y-auto">
        <DateGroupedTable activities={paginatedActivities} />
      </div>
      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            disabled={!canPrevious}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
            disabled={!canNext}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
