import { zodResolver } from '@hookform/resolvers/zod';
import { act, renderHook } from '@testing-library/react';
import { useForm, type Resolver } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';
import { createMockActivityResponse } from '@corpcal/shared/test-utils';

import { getDefaultFormValues } from '../lib/activity-form-defaults';
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
  pitchRequiredStatuses: [{ id: 1, name: 'pending', displayName: 'Pending' }],
  activityStatuses: [],
  commsMaterials: [],
  translationLanguages: [],
  translationRequiredStatuses: [],
  governmentRepresentatives: [],
  newsReleaseDistributions: [{ id: 2, name: 'a', displayName: 'A' }],
  premierRequested: [{ id: 3, name: 'b', displayName: 'B' }],
  newsReleaseOrigins: [{ id: 4, name: 'c', displayName: 'C' }],
  sharedWithTeams: [],
  quickShareGroups: [],
  dateStatuses: [],
  timeStatuses: [],
  venueStatuses: [],
};

describe('useActivityEditFormHydration field updates', () => {
  it('persists isIssue and FormSelect-style ID updates after hydration', () => {
    const activity = createMockActivityResponse({
      id: 101,
      lastUpdatedDateTime: '2026-05-20T15:43:05.335Z',
      isIssue: false,
      pitchRequiredStatusId: 1,
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
      formRef!.setValue('isIssue', true, { shouldDirty: true });
    });
    expect(formRef!.getValues('isIssue')).toBe(true);
    expect(formRef!.formState.dirtyFields.isIssue).toBe(true);

    act(() => {
      formRef!.setValue('pitchRequiredStatusId', 2, { shouldDirty: true });
    });
    expect(formRef!.getValues('pitchRequiredStatusId')).toBe(2);

    act(() => {
      formRef!.setValue('venueAddress.provinceOrState', 'BC', {
        shouldDirty: true,
      });
    });
    expect(formRef!.getValues('venueAddress.provinceOrState')).toBe('BC');
  });
});
