import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import type { ActivityFormData } from '@corpcal/shared/schemas';
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

describe('useActivityEditFormHydration', () => {
  it('hydrates synchronously when lookups are ready', () => {
    const activity = createMockActivityResponse({
      id: 1,
      lastUpdatedDateTime: '2025-01-01T12:00:00.000Z',
    });

    const { result } = renderHook(() => {
      const form = useForm<ActivityFormData>({
        defaultValues: getDefaultFormValues() as ActivityFormData,
      });
      return useActivityEditFormHydration(activity, mockLookups, form);
    });

    expect(result.current.isFormHydrated).toBe(true);
    expect(result.current.hydrationGeneration).toBe(1);
    expect(result.current.initialFormDataRef.current).not.toBeNull();
  });

  it('produces no spurious dirty state after hydration', () => {
    const activity = createMockActivityResponse({
      id: 1,
      lastUpdatedDateTime: '2025-01-01T12:00:00.000Z',
      notes: null,
      schedulingNotes: null,
      strategy: null,
      significance: null,
      executiveSummary: null,
      summary: null,
    });

    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    renderHook(() => {
      const form = useForm<ActivityFormData>({
        defaultValues: getDefaultFormValues() as ActivityFormData,
      });
      formRef = form;
      return useActivityEditFormHydration(activity, mockLookups, form);
    });

    expect(formRef!.formState.isDirty).toBe(false);
    expect(Object.keys(formRef!.formState.dirtyFields)).toHaveLength(0);
  });

  it('marks dirty when a user edit follows hydration', () => {
    const activity = createMockActivityResponse({
      id: 1,
      lastUpdatedDateTime: '2025-01-01T12:00:00.000Z',
      notes: null,
    });

    let formRef: ReturnType<typeof useForm<ActivityFormData>> | undefined;

    renderHook(() => {
      const form = useForm<ActivityFormData>({
        defaultValues: getDefaultFormValues() as ActivityFormData,
      });
      formRef = form;
      return useActivityEditFormHydration(activity, mockLookups, form);
    });

    act(() => {
      formRef!.setValue('notes', 'user typed', { shouldDirty: true });
    });

    expect(formRef!.getValues('notes')).toBe('user typed');
    expect(formRef!.formState.dirtyFields.notes).toBe(true);
  });

  it('does not hydrate while lookups are still loading', () => {
    const loadingLookups: FormLookupData = { ...mockLookups, isLoading: true };
    const activity = createMockActivityResponse({
      id: 1,
      lastUpdatedDateTime: '2025-01-01T12:00:00.000Z',
    });

    const { result, rerender } = renderHook(
      ({ lookups }: { lookups: FormLookupData }) => {
        const form = useForm<ActivityFormData>({
          defaultValues: getDefaultFormValues() as ActivityFormData,
        });
        return useActivityEditFormHydration(activity, lookups, form);
      },
      { initialProps: { lookups: loadingLookups } }
    );

    expect(result.current.isFormHydrated).toBe(false);
    expect(result.current.hydrationGeneration).toBe(0);

    rerender({ lookups: mockLookups });

    expect(result.current.isFormHydrated).toBe(true);
    expect(result.current.hydrationGeneration).toBe(1);
  });

  it('bumps hydrationGeneration when lastUpdatedDateTime changes', () => {
    const activityV1 = createMockActivityResponse({
      id: 1,
      lastUpdatedDateTime: '2025-01-01T12:00:00.000Z',
    });
    const activityV2 = createMockActivityResponse({
      id: 1,
      lastUpdatedDateTime: '2025-01-02T12:00:00.000Z',
    });

    const { result, rerender } = renderHook(
      ({ activity }: { activity: typeof activityV1 }) => {
        const form = useForm<ActivityFormData>({
          defaultValues: getDefaultFormValues() as ActivityFormData,
        });
        return useActivityEditFormHydration(activity, mockLookups, form);
      },
      { initialProps: { activity: activityV1 } }
    );

    const genAfterFirst = result.current.hydrationGeneration;

    rerender({ activity: activityV2 });

    expect(result.current.hydrationGeneration).toBeGreaterThan(genAfterFirst);
  });
});
