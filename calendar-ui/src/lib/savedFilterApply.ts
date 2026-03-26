import { toast } from 'sonner';

import type { SavedFilterResponse } from '@corpcal/shared/schemas';
import type { ActivityFilterState } from '@/components/activity/ActivityTable/activityFilterState';
import { showErrorToast } from '@/lib/error-toast';
import {
  sanitizeSavedFilterPayload,
  type SavedFilterPayload,
} from '@/lib/savedFilterSanitize';

export type AppliedSavedFilterMeta = { id: number; name: string };

export type OnApplySavedFilterRow = (
  filterState: ActivityFilterState,
  searchKeyword: string,
  appliedFrom: AppliedSavedFilterMeta
) => void;

/**
 * Sanitize and apply a saved filter from the row click handler. Closes popovers
 * only after a successful apply. Surfaces unexpected errors via toast.
 */
export function applySavedFilterSelection(
  sf: SavedFilterResponse,
  onApply: OnApplySavedFilterRow | undefined,
  onAppliedUi: () => void
): void {
  if (!onApply) return;
  try {
    const { filterState, searchKeyword, hadInvalidValues } =
      sanitizeSavedFilterPayload(sf as unknown as SavedFilterPayload);
    onApply(filterState, searchKeyword, { id: sf.id, name: sf.name });
    onAppliedUi();
    if (hadInvalidValues) {
      toast.warning(
        'Some filter values are no longer available and were skipped.'
      );
    }
  } catch (error) {
    showErrorToast(error, 'Failed to apply saved filter');
  }
}
