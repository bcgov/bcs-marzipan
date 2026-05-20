import { zodResolver } from '@hookform/resolvers/zod';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useForm, type Resolver } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';
import { EMPTY_RICH_TEXT_DOC } from '@corpcal/shared/utils';
import { getDefaultFormValues } from '@/lib/activity-form-defaults';

import {
  ACTIVITY_FIELD_SET_OPTS,
  setActivityFormFieldValue,
} from './activity-form-set-field';

describe('setActivityFormFieldValue', () => {
  it('calls setValue with ACTIVITY_FIELD_SET_OPTS and triggers field validation', () => {
    const { result } = renderHook(() =>
      useForm<ActivityFormData>({
        resolver: zodResolver(
          createActivityRequestSchema
        ) as Resolver<ActivityFormData>,
        defaultValues: getDefaultFormValues() as ActivityFormData,
      })
    );

    const setValueSpy = vi.spyOn(result.current, 'setValue');
    const triggerSpy = vi.spyOn(result.current, 'trigger');

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
    expect(triggerSpy).toHaveBeenCalledWith('tagIds');
    expect(triggerSpy).toHaveBeenCalledWith('venueAddress.provinceOrState');
  });

  it('updates formState errors after filling a required custom field', async () => {
    const validSummary =
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Summary text"}]}]}';

    const { result } = renderHook(() =>
      useForm<ActivityFormData>({
        resolver: zodResolver(
          createActivityRequestSchema
        ) as Resolver<ActivityFormData>,
        mode: 'onChange',
        defaultValues: {
          ...getDefaultFormValues(),
          title: 'Test',
          summary: EMPTY_RICH_TEXT_DOC,
          leadTeamId: 1,
          leadMinistryId: 1,
          categoryIds: [],
          commsContacts: [{ userId: 1, isLead: true }],
        } as ActivityFormData,
      })
    );

    await act(async () => {
      const valid = await result.current.trigger('categoryIds');
      expect(valid).toBe(false);
    });
    expect(result.current.getFieldState('categoryIds').error).toBeDefined();

    act(() => {
      setActivityFormFieldValue(result.current, 'categoryIds', [1]);
    });

    await waitFor(() => {
      expect(result.current.getFieldState('categoryIds').error).toBeUndefined();
    });

    await act(async () => {
      const valid = await result.current.trigger('summary');
      expect(valid).toBe(false);
    });
    expect(result.current.getFieldState('summary').error).toBeDefined();

    act(() => {
      setActivityFormFieldValue(result.current, 'summary', validSummary);
    });

    await waitFor(() => {
      expect(result.current.getFieldState('summary').error).toBeUndefined();
    });
  });
});
