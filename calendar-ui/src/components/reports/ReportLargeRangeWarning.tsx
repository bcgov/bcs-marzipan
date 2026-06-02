import { TriangleAlert } from 'lucide-react';

export interface ReportLargeRangeWarningProps {
  showLargeRangeWarning: boolean;
  wasClamped?: boolean;
}

export function ReportLargeRangeWarning({
  showLargeRangeWarning,
  wasClamped = false,
}: ReportLargeRangeWarningProps) {
  if (!showLargeRangeWarning && !wasClamped) {
    return null;
  }

  const messages: string[] = [];
  if (wasClamped) {
    messages.push('Date range adjusted to 2-year maximum.');
  }
  if (showLargeRangeWarning) {
    messages.push('Large date range — report may load slowly.');
  }

  return (
    <p className="text-destructive flex items-center gap-1.5 text-sm">
      <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
      <span>{messages.join(' ')}</span>
    </p>
  );
}
