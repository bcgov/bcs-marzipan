export interface SavedFilterAutoApplyDecisionInput {
  contextKey: string | null | undefined;
  lookupsReady: boolean;
  defaultAppliedContext: string | null;
  suppressedByClearContext: string | null;
  hasKnownUrlParams: boolean;
  hasDefaultFilter: boolean;
}

export interface SavedFilterAutoApplyDecision {
  shouldApplyDefault: boolean;
  shouldMarkContextApplied: boolean;
  shouldClearActiveSavedFilter: boolean;
}

/**
 * Decision table for whether to auto-apply the context default saved filter.
 */
export function getSavedFilterAutoApplyDecision(
  input: SavedFilterAutoApplyDecisionInput
): SavedFilterAutoApplyDecision {
  const {
    contextKey,
    lookupsReady,
    defaultAppliedContext,
    suppressedByClearContext,
    hasKnownUrlParams,
    hasDefaultFilter,
  } = input;

  if (!contextKey || !lookupsReady) {
    return {
      shouldApplyDefault: false,
      shouldMarkContextApplied: false,
      shouldClearActiveSavedFilter: false,
    };
  }

  if (suppressedByClearContext === contextKey) {
    return {
      shouldApplyDefault: false,
      shouldMarkContextApplied: true,
      shouldClearActiveSavedFilter: false,
    };
  }

  if (defaultAppliedContext === contextKey) {
    return {
      shouldApplyDefault: false,
      shouldMarkContextApplied: false,
      shouldClearActiveSavedFilter: false,
    };
  }

  if (hasKnownUrlParams) {
    return {
      shouldApplyDefault: false,
      shouldMarkContextApplied: false,
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
