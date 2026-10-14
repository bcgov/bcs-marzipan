import { zodResolver } from '@hookform/resolvers/zod';
import { act, renderHook } from '@testing-library/react';
import { useForm, type Resolver } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { getActivityFormSectionFieldKeys } from '@corpcal/shared';
import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';

import { getDefaultFormValues } from '../lib/activity-form-defaults';
import {
  ACTIVITY_FIELD_SET_OPTS,
  setActivityFormFieldValue,
} from '../lib/activity-form-set-field';
import { useActivityFormSubmitState } from './useActivityFormSubmitState';

const testSchema = z.object({
  title: z.string().min(1),
  categoryIds: z.array(z.number()).min(1),
});

type TestFormData = z.infer<typeof testSchema>;

function useTestActivityFormSubmitState() {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema as never) as Resolver<TestFormData>,
    mode: 'onChange',
    defaultValues: {
      title: getDefaultFormValues().title ?? '',
      categoryIds: getDefaultFormValues().categoryIds ?? [],
    },
  });

  const submitState = useActivityFormSubmitState(form, {
    getFieldLabel: (field) => field,
    schema: testSchema,
  });

  return { form, submitState };
}

describe('useActivityFormSubmitState', () => {
  it('updates missing fields as values are filled', () => {
    const { result } = renderHook(() => useTestActivityFormSubmitState());

    expect(result.current.submitState.missingFields).toContain('title');
    expect(result.current.submitState.missingFields).toContain('categoryIds');
    expect(result.current.submitState.missingFieldsHelperText).toBe(
      '2 more required fields'
    );

    act(() => {
      result.current.form.setValue('title', 'Quarterly planning session', {
        shouldDirty: true,
        shouldValidate: true,
      });
    });

    expect(result.current.submitState.missingFields).not.toContain('title');
    expect(result.current.submitState.missingFields).toEqual(['categoryIds']);
    expect(result.current.submitState.missingFieldsHelperText).toBe(
      '1 more required field'
    );
    expect(result.current.submitState.isFormValid).toBe(false);

    act(() => {
      result.current.form.setValue('categoryIds', [1], {
        shouldDirty: true,
        shouldValidate: true,
      });
    });

    expect(result.current.submitState.missingFields).toEqual([]);
    expect(result.current.submitState.missingFieldsHelperText).toBeNull();
    expect(result.current.submitState.isFormValid).toBe(true);
  });

  it('orders missing fields by activity form layout', () => {
    const { result } = renderHook(() => {
      const form = useForm<ActivityFormData>({
        mode: 'onChange',
        defaultValues: {
          ...getDefaultFormValues(),
          title: '',
          categoryIds: [],
          summary: '',
        } as ActivityFormData,
      });

      const submitState = useActivityFormSubmitState(form, {
        getFieldLabel: (field) => field,
        schema: createActivityRequestSchema,
      });

      return { form, submitState };
    });

    const missingNames = result.current.submitState.missingFieldItems.map(
      (item) => item.name
    );
    const fieldOrder = getActivityFormSectionFieldKeys();
    const orderedMissing = [...missingNames].sort(
      (a, b) => fieldOrder.indexOf(a) - fieldOrder.indexOf(b)
    );

    expect(missingNames).toEqual(orderedMissing);
    expect(missingNames.indexOf('categoryIds')).toBeLessThan(
      missingNames.indexOf('title')
    );
  });

  it('updates missing fields when commsContacts is cleared', () => {
    const validSummary =
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Summary text"}]}]}';

    const { result } = renderHook(() => {
      const form = useForm<ActivityFormData>({
        resolver: zodResolver(
          createActivityRequestSchema as never
        ) as Resolver<ActivityFormData>,
        mode: 'onChange',
        defaultValues: {
          ...getDefaultFormValues(),
          title: 'Quarterly planning session',
          summary: validSummary,
          leadTeamId: 1,
          leadMinistryId: 1,
          categoryIds: [1],
          dateStatusId: 1,
          timeStatusId: 1,
          commsContacts: [{ userId: 1, isLead: true }],
        } as ActivityFormData,
      });

      const submitState = useActivityFormSubmitState(form, {
        getFieldLabel: (field) => field,
        schema: createActivityRequestSchema,
      });

      return { form, submitState };
    });

    expect(result.current.submitState.isFormValid).toBe(true);
    expect(result.current.submitState.missingFields).not.toContain(
      'commsContacts'
    );

    act(() => {
      setActivityFormFieldValue(result.current.form, 'commsContacts', []);
    });

    expect(result.current.submitState.isFormValid).toBe(false);
    expect(result.current.submitState.missingFields).toContain('commsContacts');
    expect(result.current.submitState.missingFieldsHelperText).toBe(
      '1 more required field'
    );
  });

  it('updates missing fields when setValue runs without validation', () => {
    const { result } = renderHook(() => useTestActivityFormSubmitState());

    expect(result.current.submitState.missingFieldsHelperText).toBe(
      '2 more required fields'
    );

    act(() => {
      result.current.form.setValue('title', 'Quarterly planning session', {
        ...ACTIVITY_FIELD_SET_OPTS,
      });
    });

    expect(result.current.submitState.missingFields).toEqual(['categoryIds']);
    expect(result.current.submitState.missingFieldsHelperText).toBe(
      '1 more required field'
    );
  });
});
