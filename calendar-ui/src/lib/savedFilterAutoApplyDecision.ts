export interface SavedFilterAutoApplyDecisionInput {
  lookupsReady: boolean;
  defaultAlreadyApplied: boolean;
  suppressedByClear: boolean;
  hasKnownUrlParams: boolean;
  hasRestoredActivePreferences: boolean;
  hasDefaultFilter: boolean;
}

export interface SavedFilterAutoApplyDecision {
  shouldApplyDefault: boolean;
  shouldMarkContextApplied: boolean;
  shouldClearActiveSavedFilter: boolean;
}

/**
 * Decision table for whether to auto-apply the global default saved filter.
 */
export function getSavedFilterAutoApplyDecision(
  input: SavedFilterAutoApplyDecisionInput
): SavedFilterAutoApplyDecision {
  const {
    lookupsReady,
    defaultAlreadyApplied,
    suppressedByClear,
    hasKnownUrlParams,
    hasRestoredActivePreferences,
    hasDefaultFilter,
  } = input;

  if (!lookupsReady) {
    return {
      shouldApplyDefault: false,
      shouldMarkContextApplied: false,
      shouldClearActiveSavedFilter: false,
    };
  }

  if (suppressedByClear) {
    return {
      shouldApplyDefault: false,
      shouldMarkContextApplied: true,
      shouldClearActiveSavedFilter: false,
    };
  }

  if (defaultAlreadyApplied) {
    return {
      shouldApplyDefault: false,
      shouldMarkContextApplied: false,
      shouldClearActiveSavedFilter: false,
    };
  }

  if (hasKnownUrlParams || hasRestoredActivePreferences) {
    return {
      shouldApplyDefault: false,
      shouldMarkContextApplied: true,
      shouldClearActiveSavedFilter: true,
    };
  }

  if (!hasDefaultFilter) {
    return {
      shouldApplyDefault: false,
      shouldMarkContextApplied: true,
      shouldClearActiveSavedFilter: true,
    };
  }

  return {
    shouldApplyDefault: true,
    shouldMarkContextApplied: true,
    shouldClearActiveSavedFilter: false,
  };
}
