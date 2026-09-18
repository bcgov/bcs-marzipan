import { sanitizeLegendSwatchHexColor } from '@corpcal/shared/schemas';
import { contrastingBlackOrWhiteForegroundHex } from '@corpcal/shared/utils';
import { Badge } from '@/components/ui/badge';
import {
  getLookAheadSectionLegendColorFromRows,
  useLookAheadSectionRows,
} from '@/hooks/useLookAheadSectionRows';
import { cn } from '@/lib/utils';

import { formatLookAheadBadgeLabel } from './formatLookAheadBadgeLabel';

export interface LookAheadStatusBadgeProps {
  status: string | null;
  section: string | null;
  className?: string;
}

/**
 * Look-ahead badge ("LA Events (New)") tinted with the section legend color
 * configured for the look-ahead report. Renders nothing without a status.
 */
export function LookAheadStatusBadge({
  status,
  section,
  className,
}: LookAheadStatusBadgeProps) {
  const { rows: lookAheadSectionRows } = useLookAheadSectionRows();
  const label = formatLookAheadBadgeLabel(
    status,
    section,
    lookAheadSectionRows
  );
  if (!label) return null;

  const legendColor = sanitizeLegendSwatchHexColor(
    section
      ? getLookAheadSectionLegendColorFromRows(lookAheadSectionRows, section)
      : null
  );

  return (
    <Badge
      variant="primary"
      className={cn(
        'h-auto min-h-5 text-xs',
        legendColor ? 'border-transparent' : 'text-white',
        className
      )}
      style={
        legendColor
          ? {
              backgroundColor: legendColor,
              color: contrastingBlackOrWhiteForegroundHex(legendColor),
              borderColor: 'transparent',
            }
          : undefined
      }
    >
      {label}
    </Badge>
  );
}
