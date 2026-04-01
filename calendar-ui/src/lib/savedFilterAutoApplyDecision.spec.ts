import { describe, expect, it } from 'vitest';

import { getSavedFilterAutoApplyDecision } from './savedFilterAutoApplyDecision';

describe('getSavedFilterAutoApplyDecision', () => {
  it('does not mark or apply while waiting for readiness', () => {
    expect(
      getSavedFilterAutoApplyDecision({
        lookupsReady: false,
        defaultAlreadyApplied: false,
        suppressedByClear: false,
        hasKnownUrlParams: false,
        hasRestoredActivePreferences: false,
        hasDefaultFilter: true,
      })
    ).toEqual({
      shouldApplyDefault: false,
      shouldMarkContextApplied: false,
      shouldClearActiveSavedFilter: false,
    });
  });

  it('does not mark context applied when URL params are present', () => {
    expect(
      getSavedFilterAutoApplyDecision({
        lookupsReady: true,
        defaultAlreadyApplied: false,
        suppressedByClear: false,
        hasKnownUrlParams: true,
        hasRestoredActivePreferences: false,
        hasDefaultFilter: true,
      })
    ).toEqual({
      shouldApplyDefault: false,
      shouldMarkContextApplied: true,
      shouldClearActiveSavedFilter: true,
    });
  });

  it('marks context applied when clear-all suppression is active', () => {
    expect(
      getSavedFilterAutoApplyDecision({
        lookupsReady: true,
        defaultAlreadyApplied: false,
        suppressedByClear: true,
        hasKnownUrlParams: false,
        hasRestoredActivePreferences: false,
        hasDefaultFilter: true,
      })
    ).toEqual({
      shouldApplyDefault: false,
      shouldMarkContextApplied: true,
      shouldClearActiveSavedFilter: false,
    });
  });

  it('applies default and marks context when no URL params exist', () => {
    expect(
      getSavedFilterAutoApplyDecision({
        lookupsReady: true,
        defaultAlreadyApplied: false,
        suppressedByClear: false,
        hasKnownUrlParams: false,
        hasRestoredActivePreferences: false,
        hasDefaultFilter: true,
      })
    ).toEqual({
      shouldApplyDefault: true,
      shouldMarkContextApplied: true,
      shouldClearActiveSavedFilter: false,
    });
  });

  it('does not auto-apply when restored preferences are already active', () => {
    expect(
      getSavedFilterAutoApplyDecision({
        lookupsReady: true,
        defaultAlreadyApplied: false,
        suppressedByClear: false,
        hasKnownUrlParams: false,
        hasRestoredActivePreferences: true,
        hasDefaultFilter: true,
      })
    ).toEqual({
      shouldApplyDefault: false,
      shouldMarkContextApplied: true,
      shouldClearActiveSavedFilter: true,
    });
  });
});
