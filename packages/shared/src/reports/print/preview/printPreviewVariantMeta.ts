import type { PrintReportVariant } from '../react/rowViewModel';

export const VARIANT_TO_TEMPLATE_SLUG: Record<PrintReportVariant, string> = {
  execLookAhead: 'EXEC_LOOK_AHEAD',
  thirtySixtyNinety: 'THIRTY_SIXTY_NINETY',
  planning: 'PLANNING',
  lookAhead: 'LOOK_AHEAD',
};

export const VARIANT_TO_FIRST_PAGE_TITLE: Partial<
  Record<PrintReportVariant, string>
> = {
  thirtySixtyNinety: '30/60/90 Report',
  planning: 'Planning Report',
};
