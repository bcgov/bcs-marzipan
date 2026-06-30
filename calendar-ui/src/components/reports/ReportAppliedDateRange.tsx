import type { NormalizedReportDateRange } from '@corpcal/shared/reports/reportDateRange';
import { formatDateRange } from '@/lib/datetime-utils';

export interface ReportAppliedDateRangeProps {
  dateRange: NormalizedReportDateRange | null;
}

export function ReportAppliedDateRange({
  dateRange,
}: ReportAppliedDateRangeProps) {
  if (!dateRange) return null;

  const label = formatDateRange(dateRange.start, dateRange.end);

  return (
    <p
      className="text-foreground min-w-0 truncate text-base font-semibold"
      aria-label={`Applied date range: ${label}`}
    >
      {label}
    </p>
  );
}
