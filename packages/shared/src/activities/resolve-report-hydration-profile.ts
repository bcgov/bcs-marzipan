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
 * Unions relation needs from three sources:
 *
 * 1. **Report display fields** (`effectiveFields`): joins required to render
 *    each visible column, resolved via `REPORT_FIELD_RELATIONS` in
 *    `activity-relation-registry.ts`. Add new field → relation mappings there.
 *
 * 2. **Active server filters** (`query`): joins required to evaluate server-
 *    side filter dimensions (e.g. `commsContactLeadUserIds` needs `commsContacts`
 *    so client-side filter parity works over the returned payload).
 *
 * 3. **Keyword search** (`SEARCH_ACTIVITY_RELATION_KEYS`): always included so
 *    the preview can apply keyword search client-side without a second fetch.
 *
 * If a relation is missing here, the corresponding field will be empty/null in
 * the report payload. Add new field → relation bindings to `REPORT_FIELD_RELATIONS`;
 * do not add them inline here.
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
