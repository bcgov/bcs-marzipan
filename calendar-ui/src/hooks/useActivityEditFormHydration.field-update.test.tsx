import { zodResolver } from '@hookform/resolvers/zod';
import { act, renderHook } from '@testing-library/react';
import { useForm, type Resolver } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

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
  pitchStatuses: [],
  pitchRequiredStatuses: [
    {
      id: 1,
      label: 'Pending',
      value: 1,
      name: 'pending',
      displayName: 'Pending',
    },
  ],
  activityStatuses: [],
  commsMaterials: [],
  translationLanguages: [],
  translationRequiredStatuses: [],
  governmentRepresentatives: [],
  newsReleaseDistributions: [{ value: '2', label: 'A' }],
  premierRequested: [{ value: '3', label: 'B' }],
  newsReleaseOrigins: [{ value: '4', label: 'C' }],
  sharedWithTeams: [],
  quickShareGroups: [],
  dateStatuses: [],
  timeStatuses: [],
  venueStatuses: [],
};

describe('useActivityEditFormHydration field updates', () => {
  it('persists custom-control-shaped updates via setActivityFormFieldValue after hydration', () => {
    const activity = createMockActivityResponse({
      id: 202,
      lastUpdatedDateTime: '2026-05-21T18:00:00.000Z',
      premierRequestedId: null,
      newsReleaseOriginId: null,
      venueAddress: null,
    });

    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    renderHook(() => {
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
      setActivityFormFieldValue(formRef!, 'categoryIds', [101, 102]);
      setActivityFormFieldValue(formRef!, 'tagIds', [201]);
      setActivityFormFieldValue(formRef!, 'pitchDate', '2030-06-01');
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
    expect(formRef!.formState.dirtyFields.categoryIds).toBe(true);

    expect(formRef!.getValues('tagIds')).toEqual([201]);
    expect(formRef!.formState.dirtyFields.tagIds).toBe(true);

    expect(formRef!.getValues('pitchDate')).toBe('2030-06-01');
    expect(formRef!.formState.dirtyFields.pitchDate).toBe(true);

    expect(formRef!.getValues('visibility')).toBe('team');
    expect(formRef!.formState.dirtyFields.visibility).toBe(true);

    expect(formRef!.getValues('sharedWithTeamIds')).toEqual([501, 502]);
    expect(formRef!.formState.dirtyFields.sharedWithTeamIds).toBe(true);

    expect(formRef!.getValues('commsMaterialIds')).toEqual([701, 703]);
    expect(formRef!.formState.dirtyFields.commsMaterialIds).toBe(true);

    expect(
      formRef!.getValues('summary').includes('Post-hydration summary update.')
    ).toBe(true);
    expect(formRef!.formState.dirtyFields.summary).toBe(true);

    expect(formRef!.getValues('endTime')).toBe('14:05');
    expect(formRef!.formState.dirtyFields.endTime).toBe(true);
  });
});
