import type { ReportDataQueryParams } from '../schemas/query-params.schema';
import {
  relationsForQueryFilters,
  relationsForReportFieldKeys,
  SEARCH_ACTIVITY_RELATION_KEYS,
} from './activity-relation-registry';
import {
  createHydrationProfile,
  type ActivityHydrationProfile,
} from './hydration-profile';

export interface ResolveReportHydrationProfileInput {
  effectiveFields: readonly string[];
  query?: Partial<ReportDataQueryParams>;
}

/**
 * Unions relation needs from report display fields, active server filters, and
 * keyword-search fields. Search relations are always included so Reports preview
 * can apply keyword search client-side over a stable fetch payload.
 */
export function resolveReportHydrationProfile(
  input: ResolveReportHydrationProfileInput
): ActivityHydrationProfile {
  const relations = new Set([
    ...SEARCH_ACTIVITY_RELATION_KEYS,
    ...relationsForReportFieldKeys(input.effectiveFields),
    ...relationsForQueryFilters(input.query ?? {}),
  ]);

  return createHydrationProfile(relations);
}
