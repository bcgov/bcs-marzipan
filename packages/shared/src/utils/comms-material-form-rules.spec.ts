import { describe, expect, it } from 'vitest';

import type { ActivityFormData } from '../schemas/activity.schema';
import { DEFAULT_RELEASE_TIME_OFFSET_MINUTES } from './activity-release-time';
import {
  applyReleaseTimeDefaultWhenCommsEnablesRelease,
  buildCommsMaterialReleaseFlagsById,
  stripCommsDependentFields,
} from './comms-material-form-rules';

const baseForm = (): ActivityFormData =>
  ({
    commsMaterialIds: [],
    newsReleaseOriginId: 1,
    newsReleaseDistributionId: 2,
    translationsRequiredStatusId: 3,
    translationLanguageIds: [10, 11],
    releaseSchedulingMode: 'relative',
    releaseTimeOffsetMinutes: 15,
  }) as unknown as ActivityFormData;

describe('applyReleaseTimeDefaultWhenCommsEnablesRelease', () => {
  const flags = buildCommsMaterialReleaseFlagsById([
    {
      id: 4,
      releaseType: {
        audience: 'public',
        allowsTranslation: false,
        requiresNewsReleaseDetails: false,
      },
    },
  ]);

  it('returns default when public comms is first added and release is unset', () => {
    expect(
      applyReleaseTimeDefaultWhenCommsEnablesRelease([], [4], flags, null, null)
    ).toEqual({
      releaseSchedulingMode: 'relative',
      releaseTimeOffsetMinutes: DEFAULT_RELEASE_TIME_OFFSET_MINUTES,
    });
  });

  it('does not default when release time was already required', () => {
    expect(
      applyReleaseTimeDefaultWhenCommsEnablesRelease(
        [4],
        [4, 4],
        flags,
        null,
        null
      )
    ).toBeNull();
  });

  it('does not default when offset or mode is already set', () => {
    expect(
      applyReleaseTimeDefaultWhenCommsEnablesRelease(
        [],
        [4],
        flags,
        'on_signal',
        null
      )
    ).toBeNull();
    expect(
      applyReleaseTimeDefaultWhenCommsEnablesRelease([], [4], flags, null, 0)
    ).toBeNull();
  });
});

describe('stripCommsDependentFields', () => {
  const flags = buildCommsMaterialReleaseFlagsById([
    {
      id: 11,
      releaseType: {
        audience: 'public',
        allowsTranslation: true,
        requiresNewsReleaseDetails: true,
      },
    },
    {
      id: 4,
      releaseType: {
        audience: 'public',
        allowsTranslation: false,
        requiresNewsReleaseDetails: false,
      },
    },
  ]);

  it('clears NR, translation, and release time when no comms materials selected', () => {
    const result = stripCommsDependentFields(baseForm(), flags);
    expect(result.newsReleaseOriginId).toBeNull();
    expect(result.newsReleaseDistributionId).toBeNull();
    expect(result.translationsRequiredStatusId).toBeNull();
    expect(result.translationLanguageIds).toEqual([]);
    expect(result.releaseSchedulingMode).toBeNull();
    expect(result.releaseTimeOffsetMinutes).toBeNull();
  });

  it('clears dependents when flags map is empty (server load with no material ids)', () => {
    const result = stripCommsDependentFields(baseForm(), new Map());
    expect(result.newsReleaseOriginId).toBeNull();
    expect(result.translationLanguageIds).toEqual([]);
    expect(result.releaseSchedulingMode).toBeNull();
    expect(result.releaseTimeOffsetMinutes).toBeNull();
  });

  it('keeps fields when news release material is selected', () => {
    const result = stripCommsDependentFields(
      { ...baseForm(), commsMaterialIds: [11] },
      flags
    );
    expect(result.newsReleaseOriginId).toBe(1);
    expect(result.translationLanguageIds).toEqual([10, 11]);
    expect(result.releaseTimeOffsetMinutes).toBe(15);
  });

  it('clears NR fields but keeps translation when only allowsTranslation material selected', () => {
    const flagsTranslationOnly = buildCommsMaterialReleaseFlagsById([
      {
        id: 99,
        releaseType: {
          audience: 'public',
          allowsTranslation: true,
          requiresNewsReleaseDetails: false,
        },
      },
    ]);
    const result = stripCommsDependentFields(
      { ...baseForm(), commsMaterialIds: [99] },
      flagsTranslationOnly
    );
    expect(result.newsReleaseOriginId).toBeNull();
    expect(result.newsReleaseDistributionId).toBeNull();
    expect(result.translationsRequiredStatusId).toBe(3);
    expect(result.releaseTimeOffsetMinutes).toBe(15);
  });

  it('clears translation when factsheet-only selection', () => {
    const result = stripCommsDependentFields(
      { ...baseForm(), commsMaterialIds: [4] },
      flags
    );
    expect(result.translationsRequiredStatusId).toBeNull();
    expect(result.translationLanguageIds).toEqual([]);
    expect(result.releaseTimeOffsetMinutes).toBe(15);
  });

  it('clears release time when only media-audience material is selected', () => {
    const mediaFlags = buildCommsMaterialReleaseFlagsById([
      {
        id: 9,
        releaseType: {
          audience: 'media',
          allowsTranslation: false,
          requiresNewsReleaseDetails: false,
        },
      },
    ]);
    const result = stripCommsDependentFields(
      { ...baseForm(), commsMaterialIds: [9] },
      mediaFlags
    );
    expect(result.releaseSchedulingMode).toBeNull();
    expect(result.releaseTimeOffsetMinutes).toBeNull();
  });
});
