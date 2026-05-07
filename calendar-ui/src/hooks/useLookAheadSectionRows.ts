import { useMemo } from 'react';

import {
  LOOK_AHEAD_REPORT_NAME,
  resolveLookAheadSectionRows,
  type LookAheadSectionRow,
} from '@corpcal/shared/reports/look-ahead';

import { useReports } from './useLookups';

export interface UseLookAheadSectionRowsResult {
  /** Ordered rows (id, key, labels, color) resolved from the look-ahead report config. */
  rows: LookAheadSectionRow[];
  /** True while the underlying reports lookup is loading. */
  isLoading: boolean;
  /** True when reports loaded but no look-ahead config was found. */
  hasConfig: boolean;
}

/**
 * Single shared source for look-ahead section UI options.
 *
 * Driven by `reports.config.sections` of the canonical `look-ahead` report so
 * activity form radios, the LookAhead filter, and any future surface stay in
 * lockstep with the report admin's configured sections.
 */
export function useLookAheadSectionRows(): UseLookAheadSectionRowsResult {
  const { data: reports, isLoading } = useReports();

  return useMemo(() => {
    const lookAheadReport = reports?.find(
      (r) => r.name === LOOK_AHEAD_REPORT_NAME
    );
    if (!lookAheadReport?.config) {
      return { rows: [], isLoading, hasConfig: false };
    }
    const rows = resolveLookAheadSectionRows(lookAheadReport.config, {
      requireLookAheadKey: true,
    });
    return { rows, isLoading, hasConfig: true };
  }, [reports, isLoading]);
}

export interface LookAheadSectionOption {
  value: string;
  label: string;
}

/**
 * Convenience wrapper returning UI radio/checkbox options keyed by
 * `lookAheadKey` with the short `uiLabel`.
 */
export function rowsToSectionOptions(
  rows: ReadonlyArray<LookAheadSectionRow>
): LookAheadSectionOption[] {
  const options: LookAheadSectionOption[] = [];
  for (const row of rows) {
    if (row.lookAheadKey === null) continue;
    options.push({
      value: row.lookAheadKey,
      label: row.uiLabel,
    });
  }
  return options;
}

/**
 * Look up the short UI label for a stored `activity.lookAheadSection` value
 * using the resolved rows. Falls back to the raw value when the key is no
 * longer present in the active config (legacy data).
 */
export function getLookAheadSectionLabelFromRows(
  rows: ReadonlyArray<LookAheadSectionRow>,
  value: string | null | undefined
): string {
  if (!value) return '';
  const match = rows.find((r) => r.lookAheadKey === value);
  return match?.uiLabel ?? value;
}
