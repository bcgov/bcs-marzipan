import { zodResolver } from '@hookform/resolvers/zod';
import { act, renderHook } from '@testing-library/react';
import { useForm, type Resolver } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { getDefaultFormValues } from '../lib/activity-form-defaults';
import { useActivityFormSubmitState } from './useActivityFormSubmitState';

const testSchema = z.object({
  title: z.string().min(1),
  categoryIds: z.array(z.number()).min(1),
});

type TestFormData = z.infer<typeof testSchema>;

function useTestActivityFormSubmitState() {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema) as Resolver<TestFormData>,
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
      '2 required fields missing'
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
      '1 required field missing'
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
});
