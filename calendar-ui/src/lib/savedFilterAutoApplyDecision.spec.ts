import { describe, expect, it } from 'vitest';

import { getSavedFilterAutoApplyDecision } from './savedFilterAutoApplyDecision';

describe('getSavedFilterAutoApplyDecision', () => {
  it('does not mark or apply while waiting for readiness', () => {
    expect(
      getSavedFilterAutoApplyDecision({
        contextKey: 'all',
        lookupsReady: false,
        defaultAppliedContext: null,
        suppressedByClearContext: null,
        hasKnownUrlParams: false,
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
        contextKey: 'all',
        lookupsReady: true,
        defaultAppliedContext: null,
        suppressedByClearContext: null,
        hasKnownUrlParams: true,
        hasDefaultFilter: true,
      })
    ).toEqual({
      shouldApplyDefault: false,
      shouldMarkContextApplied: false,
      shouldClearActiveSavedFilter: true,
    });
  });

  it('marks context applied when clear-all suppression is active', () => {
    expect(
      getSavedFilterAutoApplyDecision({
        contextKey: 'all',
        lookupsReady: true,
        defaultAppliedContext: null,
        suppressedByClearContext: 'all',
        hasKnownUrlParams: false,
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
        contextKey: 'all',
        lookupsReady: true,
        defaultAppliedContext: null,
        suppressedByClearContext: null,
        hasKnownUrlParams: false,
        hasDefaultFilter: true,
      })
    ).toEqual({
      shouldApplyDefault: true,
      shouldMarkContextApplied: true,
      shouldClearActiveSavedFilter: false,
    });
  });
});
