import { sanitizeLegendSwatchHexColor } from '@corpcal/shared/schemas';
import { contrastingBlackOrWhiteForegroundHex } from '@corpcal/shared/utils';
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
 * Compact look-ahead indicator for Grid A status column: filled badge using
 * the section legend colour and "LA" (+ New/Changed when applicable). Full
 * section name and status appear in a tooltip on hover.
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

  const fillColor = legendColor ?? '#e2e8f0';
  const foregroundColor = legendColor
    ? contrastingBlackOrWhiteForegroundHex(legendColor)
    : '#1e293b';

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span
          className={cn('inline-flex max-w-full min-w-0', className)}
          tabIndex={0}
        >
          <Badge
            variant="outline"
            className="h-auto min-h-5 max-w-full border-transparent px-2 py-0.5 text-xs font-bold"
            style={{
              backgroundColor: fillColor,
              color: foregroundColor,
            }}
          >
            <span className="truncate">
              LA
              {inlineSuffix ? ` ${inlineSuffix}` : null}
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
