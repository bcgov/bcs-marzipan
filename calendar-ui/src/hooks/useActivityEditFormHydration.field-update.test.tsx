import { zodResolver } from '@hookform/resolvers/zod';
import { act, renderHook } from '@testing-library/react';
import { useForm, type Resolver } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';
import { createMockActivityResponse } from '@corpcal/shared/test-utils';
import { tipTapDocJsonFromPlainText } from '@corpcal/shared/utils';

import { getDefaultFormValues } from '../lib/activity-form-defaults';
import { setActivityFormFieldValue } from '../lib/activity-form-set-field';
import { useActivityEditFormHydration } from './useActivityEditFormHydration';
import type { FormLookupData } from './useFormLookups';

const mockLookups: FormLookupData = {
  isLoading: false,
  hasError: false,
  categories: [],
  organizations: [],
  ministries: [],
  users: [],
  eventPlanners: [],
  tags: [],
  activityStatuses: [],
  commsMaterials: [],
  translationLanguages: [],
  translationRequiredStatuses: [],
  governmentRepresentatives: [],
  newsReleaseDistributions: [{ value: '2', label: 'A' }],
  premierRequested: [{ value: '3', label: 'B' }],
  newsReleaseOrigins: [{ value: '4', label: 'C' }],
  newsReleaseOriginLookups: [],
  sharedWithTeams: [],
  quickShareGroups: [],
  dateStatuses: [],
  timeStatuses: [],
  venueStatuses: [],
};

describe('useActivityEditFormHydration field updates', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persists custom-control-shaped updates via setActivityFormFieldValue after hydration', () => {
    const activity = createMockActivityResponse({
      id: 202,
      lastUpdatedDateTime: '2026-05-21T18:00:00.000Z',
      premierRequestedId: null,
      newsReleaseOriginId: null,
      venueAddress: null,
    });

    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    const { result } = renderHook(() => {
      const form = useForm<ActivityFormData>({
        resolver: zodResolver(
          createActivityRequestSchema
        ) as Resolver<ActivityFormData>,
        mode: 'onChange',
        defaultValues: getDefaultFormValues() as ActivityFormData,
      });
      formRef = form;
      return useActivityEditFormHydration(activity, mockLookups, form);
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.isFormHydrated).toBe(true);

    act(() => {
      setActivityFormFieldValue(formRef!, 'categoryIds', [101, 102]);
      setActivityFormFieldValue(formRef!, 'tagIds', [201]);
      setActivityFormFieldValue(formRef!, 'startDate', '2030-06-01');
      setActivityFormFieldValue(formRef!, 'visibility', 'team');
      setActivityFormFieldValue(formRef!, 'sharedWithTeamIds', [501, 502]);
      setActivityFormFieldValue(formRef!, 'commsMaterialIds', [701, 703]);
      setActivityFormFieldValue(
        formRef!,
        'summary',
        tipTapDocJsonFromPlainText('Post-hydration summary update.')
      );
      setActivityFormFieldValue(formRef!, 'endTime', '14:05');
    });

    expect(formRef!.getValues('categoryIds')).toEqual([101, 102]);
    expect(formRef!.getFieldState('categoryIds').isDirty).toBe(true);

    expect(formRef!.getValues('tagIds')).toEqual([201]);
    expect(formRef!.getFieldState('tagIds').isDirty).toBe(true);

    expect(formRef!.getValues('startDate')).toBe('2030-06-01');
    expect(formRef!.getFieldState('startDate').isDirty).toBe(true);

    expect(formRef!.getValues('visibility')).toBe('team');
    expect(formRef!.getFieldState('visibility').isDirty).toBe(true);

    expect(formRef!.getValues('sharedWithTeamIds')).toEqual([501, 502]);
    expect(formRef!.getFieldState('sharedWithTeamIds').isDirty).toBe(true);

    expect(formRef!.getValues('commsMaterialIds')).toEqual([701, 703]);
    expect(formRef!.getFieldState('commsMaterialIds').isDirty).toBe(true);

    expect(
      formRef!.getValues('summary').includes('Post-hydration summary update.')
    ).toBe(true);
    expect(formRef!.getFieldState('summary').isDirty).toBe(true);

    expect(formRef!.getValues('endTime')).toBe('14:05');
    expect(formRef!.getFieldState('endTime').isDirty).toBe(true);
  });
});
