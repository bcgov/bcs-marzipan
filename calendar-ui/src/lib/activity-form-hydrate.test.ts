import { zodResolver } from '@hookform/resolvers/zod';
import { act, renderHook } from '@testing-library/react';
import { useForm, type Resolver } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';
import { createMockActivityResponse } from '@corpcal/shared/test-utils';
import {
  canonicalizeActivityFormData,
  EMPTY_RICH_TEXT_DOC,
} from '@corpcal/shared/utils';

import type { FormLookupData } from '../hooks/useFormLookups';
import { hydrateActivityFormData } from './activity-form-hydrate';
import {
  applyUiBaselineSentinels,
  UI_BASELINE_SENTINEL_FIELDS,
  UI_BASELINE_SENTINEL_VALUES,
  type UiBaselineSentinelField,
} from './activity-form-ui-baseline-sentinels';

const mockLookups: FormLookupData = {
  isLoading: false,
  hasError: false,
  categories: [],
  organizations: [],
  ministries: [],
  users: [],
  eventPlanners: [],
  tags: [],
  pitchStatuses: [],
  pitchRequiredStatuses: [],
  activityStatuses: [],
  commsMaterials: [],
  translationLanguages: [],
  translationRequiredStatuses: [],
  governmentRepresentatives: [],
  newsReleaseDistributions: [],
  premierRequested: [],
  newsReleaseOrigins: [],
  sharedWithTeams: [],
  quickShareGroups: [],
  dateStatuses: [],
  timeStatuses: [],
  venueStatuses: [],
};

const EMPTY_API_ACTIVITY_OVERRIDES = {
  notes: null,
  schedulingNotes: null,
  strategy: null,
  significance: null,
  executiveSummary: null,
  summary: '',
} as const;

function emptyActivityOverridesForField(
  field: UiBaselineSentinelField
): Partial<typeof EMPTY_API_ACTIVITY_OVERRIDES> {
  return { [field]: null };
}

describe('hydrateActivityFormData', () => {
  it.each(UI_BASELINE_SENTINEL_FIELDS)(
    'applies UI baseline sentinel for empty %s',
    (field) => {
      const activity = createMockActivityResponse({
        ...EMPTY_API_ACTIVITY_OVERRIDES,
        ...emptyActivityOverridesForField(field),
      });

      const data = hydrateActivityFormData(activity, mockLookups);

      expect(data[field]).toBe(UI_BASELINE_SENTINEL_VALUES[field]);
    }
  );

  it('uses UI sentinels for all empty optional text and rich text fields together', () => {
    const activity = createMockActivityResponse(EMPTY_API_ACTIVITY_OVERRIDES);

    const data = hydrateActivityFormData(activity, mockLookups);

    for (const field of UI_BASELINE_SENTINEL_FIELDS) {
      expect(data[field]).toBe(UI_BASELINE_SENTINEL_VALUES[field]);
    }
  });

  it('keeps canonical-only fields on undefined / [] without spurious string sentinels', () => {
    const activity = createMockActivityResponse({
      startDate: null,
      endDate: null,
      pitchDate: null,
      venueStatusId: null,
      lookAheadStatus: null,
      category: [],
    });

    const data = hydrateActivityFormData(activity, mockLookups);

    expect(data.startDate).toBeUndefined();
    expect(data.endDate).toBeUndefined();
    expect(data.pitchDate).toBeUndefined();
    expect(data.venueStatusId).toBeUndefined();
    expect(data.lookAheadStatus).toBeUndefined();
    expect(data.categoryIds).toEqual([]);
  });

  it('does not mark sentinel fields dirty when control-shaped empty values match baseline', () => {
    const activity = createMockActivityResponse(EMPTY_API_ACTIVITY_OVERRIDES);
    const hydrated = hydrateActivityFormData(activity, mockLookups);

    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    renderHook(() => {
      const form = useForm<ActivityFormData>({
        resolver: zodResolver(
          createActivityRequestSchema
        ) as Resolver<ActivityFormData>,
        mode: 'onChange',
        defaultValues: hydrated,
      });
      formRef = form;
      return form;
    });

    act(() => {
      for (const field of UI_BASELINE_SENTINEL_FIELDS) {
        formRef!.setValue(field, UI_BASELINE_SENTINEL_VALUES[field], {
          shouldDirty: true,
        });
      }
    });

    expect(formRef!.formState.isDirty).toBe(false);
    for (const field of UI_BASELINE_SENTINEL_FIELDS) {
      expect(formRef!.formState.dirtyFields[field]).toBeUndefined();
    }
  });

  it('applyUiBaselineSentinels differs from canonical-only baseline for empty fields', () => {
    const activity = createMockActivityResponse(EMPTY_API_ACTIVITY_OVERRIDES);
    const hydrated = hydrateActivityFormData(activity, mockLookups);
    const canonicalOnly = canonicalizeActivityFormData(hydrated);

    expect(canonicalOnly.notes).toBeUndefined();
    expect(canonicalOnly.significance).toBeUndefined();
    expect(applyUiBaselineSentinels(canonicalOnly).notes).toBe('');
    expect(applyUiBaselineSentinels(canonicalOnly).significance).toBe(
      EMPTY_RICH_TEXT_DOC
    );
  });
});
