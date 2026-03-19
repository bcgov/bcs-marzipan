import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  dateStatuses: [],
  timeStatuses: [],
};

describe('useActivityEditFormHydration', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets isFormHydrated true after deferred stabilization', () => {
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

    expect(result.current.isFormHydrated).toBe(false);

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.isFormHydrated).toBe(true);
    expect(result.current.hydrationGeneration).toBe(1);
    expect(result.current.initialFormDataRef.current).not.toBeNull();
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

    act(() => {
      vi.runAllTimers();
    });
    const genAfterFirst = result.current.hydrationGeneration;

    rerender({ activity: activityV2 });
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.hydrationGeneration).toBeGreaterThan(genAfterFirst);
  });
});
