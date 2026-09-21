import { sanitizeLegendSwatchHexColor } from '@corpcal/shared/schemas';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getLookAheadStatusLabel } from '@/constants/form-options';
import {
  getLookAheadSectionLegendColorFromRows,
  getLookAheadSectionReportLabelFromRows,
  useLookAheadSectionRows,
} from '@/hooks/useLookAheadSectionRows';
import { cn } from '@/lib/utils';

export interface LookAheadStatusBadgeProps {
  status: string | null;
  section: string | null;
  className?: string;
}

function lookAheadInlineStatusSuffix(status: string): string | null {
  if (status === 'new' || status === 'changed') {
    return getLookAheadStatusLabel(status);
  }
  return null;
}

/**
 * Compact look-ahead indicator for Grid A status column: outline badge with
 * section swatch and "LA" (+ New/Changed when applicable). Full section
 * name and status appear in a tooltip on hover.
 */
export function LookAheadStatusBadge({
  status,
  section,
  className,
}: LookAheadStatusBadgeProps) {
  const { rows: lookAheadSectionRows } = useLookAheadSectionRows();

  if (!status || status === 'none') return null;

  const statusLabel = getLookAheadStatusLabel(status);
  const sectionReportLabel = section
    ? getLookAheadSectionReportLabelFromRows(lookAheadSectionRows, section)
    : '';
  const inlineSuffix = lookAheadInlineStatusSuffix(status);

  const legendColor = sanitizeLegendSwatchHexColor(
    section
      ? getLookAheadSectionLegendColorFromRows(lookAheadSectionRows, section)
      : null
  );

  const tooltipSection = sectionReportLabel || section;
  const tooltipBody = tooltipSection
    ? `${tooltipSection} — ${statusLabel}`
    : statusLabel;

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span
          className={cn('inline-flex max-w-full min-w-0', className)}
          tabIndex={0}
        >
          <Badge
            variant="outline"
            className="h-auto min-h-5 max-w-full gap-1.5 py-0.5 pr-2 pl-1.5 text-xs font-bold text-slate-800"
          >
            <span
              className="size-3.5 shrink-0 rounded-full border border-slate-200/80"
              style={
                legendColor
                  ? { backgroundColor: legendColor }
                  : { backgroundColor: '#e2e8f0' }
              }
              aria-hidden
            />
            <span className="truncate">
              LA
              {inlineSuffix ? (
                <span className="text-slate-900">{` ${inlineSuffix}`}</span>
              ) : null}
            </span>
          </Badge>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {tooltipBody}
      </TooltipContent>
    </Tooltip>
  );
}
