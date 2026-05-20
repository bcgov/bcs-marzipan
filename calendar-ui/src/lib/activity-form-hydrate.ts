import type {
  ActivityFormData,
  ActivityResponse,
} from '@corpcal/shared/schemas';
import {
  canonicalizeActivityFormData,
  EMPTY_RICH_TEXT_DOC,
} from '@corpcal/shared/utils';

import type { FormLookupData } from '../hooks/useFormLookups';
import { activityToFormData } from './activity-form-mapper';

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
 * This helper re-applies UI sentinels for plain/rich text fields after
 * {@link canonicalizeActivityFormData}. Other shapes (optional IDs, enums,
 * booleans, nested venue `null`, empty arrays) already match UI bindings via
 * canonicalize and {@link activityToFormData}.
 *
 * | Field (explicit override)     | Baseline sentinel     |
 * | ----------------------------- | --------------------- |
 * | notes, schedulingNotes, strategy | `''`               |
 * | significance, executiveSummary, summary | `EMPTY_RICH_TEXT_DOC` |
 *
 * Submit/compare semantics remain owned by {@link canonicalizeActivityFormData}.
 */
export function hydrateActivityFormData(
  activity: ActivityResponse,
  lookups: FormLookupData
): ActivityFormData {
  const mapped = activityToFormData(activity, lookups);
  const canon = canonicalizeActivityFormData(mapped);
  return {
    ...canon,
    notes: canon.notes ?? '',
    schedulingNotes: canon.schedulingNotes ?? '',
    strategy: canon.strategy ?? '',
    significance: canon.significance ?? EMPTY_RICH_TEXT_DOC,
    executiveSummary: canon.executiveSummary ?? EMPTY_RICH_TEXT_DOC,
    summary: canon.summary ?? EMPTY_RICH_TEXT_DOC,
  };
}
