import type {
  ActivityFormData,
  ActivityResponse,
} from '@corpcal/shared/schemas';
import { canonicalizeActivityFormData } from '@corpcal/shared/utils';

import type { FormLookupData } from '../hooks/useFormLookups';
import { activityToFormData } from './activity-form-mapper';
import {
  applyUiBaselineSentinels,
  UI_BASELINE_CANONICAL_ONLY_FIELD_CATEGORIES,
  UI_BASELINE_FIELD_SENTINELS,
} from './activity-form-ui-baseline-sentinels';

/**
 * Produces the single canonical shape used as the form's RHF `reset()` baseline.
 *
 * The form has three layers that all describe "empty" differently:
 * 1. API → form mapping uses `?? undefined`.
 * 2. {@link canonicalizeActivityFormData} (compare/diff oracle) collapses empty
 *    optional text to `undefined`, normalises summary to `EMPTY_RICH_TEXT_DOC`,
 *    nested venue keys to `null`, etc.
 * 3. UI bindings (Textarea, Radix Select, Radix RadioGroup, Checkbox, nested
 *    venue Input) expect concrete sentinels (`''`, `undefined`, `null`, `false`,
 *    `EMPTY_RICH_TEXT_DOC`) depending on the control type.
 *
 * If RHF's `defaultValues` do not match the value the UI will render on first
 * paint, Radix and React treat the first interaction as a controlled/uncontrolled
 * transition, which manifests as fields that "don't accept input from empty",
 * radios that visually change but never mark dirty, and the dirty Changed badge
 * not appearing.
 *
 * {@link applyUiBaselineSentinels} re-applies UI sentinels for fields listed in
 * {@link UI_BASELINE_FIELD_SENTINELS} after canonicalize. Other shapes already
 * match UI bindings via canonicalize and {@link activityToFormData}; see
 * {@link UI_BASELINE_CANONICAL_ONLY_FIELD_CATEGORIES}.
 *
 * Explicit hydrate overrides (keep in sync with `UI_BASELINE_FIELD_SENTINELS`):
 *
 * | Field                              | Baseline sentinel       |
 * | ---------------------------------- | ----------------------- |
 * | notes, schedulingNotes, strategy   | `''`                    |
 * | significance, executiveSummary, summary | `EMPTY_RICH_TEXT_DOC` |
 *
 * Canonical-only (no hydrate override):
 *
 * | Category                           | Empty baseline          |
 * | ---------------------------------- | ----------------------- |
 * | Optional IDs / enums               | `undefined`             |
 * | Optional dates / times             | `undefined`             |
 * | ID / object arrays                 | `[]`                    |
 * | Booleans                           | `false`                 |
 * | Nested venue address               | `null` per key          |
 *
 * Submit/compare semantics remain owned by {@link canonicalizeActivityFormData}.
 * When adding fields, update {@link UI_BASELINE_FIELD_SENTINELS} if needed and
 * extend `activity-form-hydrate.test.ts` — see `ACTIVITY_FORM_FIELD_UPDATES.md`.
 */
export function hydrateActivityFormData(
  activity: ActivityResponse,
  lookups: FormLookupData
): ActivityFormData {
  const mapped = activityToFormData(activity, lookups);
  const canon = canonicalizeActivityFormData(mapped);
  return applyUiBaselineSentinels(canon);
}
