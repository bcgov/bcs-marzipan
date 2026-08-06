import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SavedFilterResponse } from '@corpcal/shared/schemas';
import { showErrorToast } from '@/lib/error-toast';
import { applySavedFilterSelection } from '@/lib/savedFilterApply';

vi.mock('@/lib/error-toast', () => ({
  showErrorToast: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { warning: vi.fn() },
}));

describe('applySavedFilterSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const minimalSavedFilter = {
    id: 1,
    name: 'My filter',
    filterState: {
      dateRange: {
        startDate: '',
        endDate: '',
        noStartDate: false,
        noEndDate: false,
      },
      categoryIds: [],
      activityStatusIds: [],
      pitchRequiredStatusNames: [],
      pitchDateFilter: { kind: 'any' },
      lookAheadStatusValues: [],
      lookAheadSectionValues: [],
      dateConfirmedFilter: 'any',
      timeConfirmedFilter: 'any',
      tagIds: [],
      leadMinistryIds: [],
      leadOrgIds: [],
      commsContactLeadUserIds: [],
      eventPlannerLeadIds: [],
      translationRequiredStatusIds: [],
      translationLanguageIds: [],
    },
    searchKeyword: '',
    isDefault: false,
  } as unknown as SavedFilterResponse;

  it('calls onApply and onAppliedUi when apply succeeds', () => {
    const onApply = vi.fn();
    const onAppliedUi = vi.fn();
    applySavedFilterSelection(minimalSavedFilter, onApply, onAppliedUi);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][2]).toEqual({ id: 1, name: 'My filter' });
    expect(onAppliedUi).toHaveBeenCalledTimes(1);
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it('shows error toast and does not run onAppliedUi when onApply throws', () => {
    const onApply = vi.fn(() => {
      throw new Error('preferences failed');
    });
    const onAppliedUi = vi.fn();
    applySavedFilterSelection(minimalSavedFilter, onApply, onAppliedUi);
    expect(onAppliedUi).not.toHaveBeenCalled();
    expect(showErrorToast).toHaveBeenCalledWith(
      expect.any(Error),
      'Failed to apply saved filter'
    );
  });
});
