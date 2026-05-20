import { zodResolver } from '@hookform/resolvers/zod';
import { act, renderHook } from '@testing-library/react';
import { useForm, type Resolver } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';
import { getDefaultFormValues } from '@/lib/activity-form-defaults';

import {
  ACTIVITY_FIELD_SET_OPTS,
  setActivityFormFieldValue,
} from './activity-form-set-field';

describe('setActivityFormFieldValue', () => {
  it('calls setValue with ACTIVITY_FIELD_SET_OPTS', () => {
    const { result } = renderHook(() =>
      useForm<ActivityFormData>({
        resolver: zodResolver(
          createActivityRequestSchema
        ) as Resolver<ActivityFormData>,
        defaultValues: getDefaultFormValues() as ActivityFormData,
      })
    );

    const setValueSpy = vi.spyOn(result.current, 'setValue');

    act(() => {
      setActivityFormFieldValue(result.current, 'tagIds', [1, 2]);
      setActivityFormFieldValue(
        result.current,
        'venueAddress.provinceOrState',
        'BC'
      );
    });

    expect(setValueSpy).toHaveBeenCalledWith(
      'tagIds',
      [1, 2],
      ACTIVITY_FIELD_SET_OPTS
    );
    expect(setValueSpy).toHaveBeenCalledWith(
      'venueAddress.provinceOrState',
      'BC',
      ACTIVITY_FIELD_SET_OPTS
    );
  });
});
