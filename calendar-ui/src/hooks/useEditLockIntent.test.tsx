import { act, renderHook, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMemo, useRef, useState } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';

import { getDefaultFormValues } from '../lib/activity-form-defaults';
import type { LockState } from './useActivityLock';
import {
  EDIT_LOCK_CONFLICT_TOAST,
  useEditLockIntent,
} from './useEditLockIntent';

describe('useEditLockIntent', () => {
  const acquire = vi.fn(() => Promise.resolve(true));

  function useHarness(props: {
    formHydrated: boolean;
    hydrationGeneration: number;
    mayEdit: boolean;
    lockState: LockState;
  }) {
    const form = useForm<ActivityFormData>({
      defaultValues: getDefaultFormValues() as ActivityFormData,
    });
    const [isEditing, setIsEditing] = useState(false);
    const initialFormDataRef = useRef<ActivityFormData | null>(null);
    if (initialFormDataRef.current == null) {
      initialFormDataRef.current = structuredClone(form.getValues());
    }

    const onAcquireConflict = useMemo(() => vi.fn(), []);

    useEditLockIntent({
      formHydrated: props.formHydrated,
      hydrationGeneration: props.hydrationGeneration,
      mayEdit: props.mayEdit,
      isEditing,
      setIsEditing,
      acquire,
      lockState: props.lockState,
      form,
      initialFormDataRef,
      onAcquireConflict,
    });

    return { form, isEditing, onAcquireConflict };
  }

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    acquire.mockReset();
    acquire.mockImplementation(() => Promise.resolve(true));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not call acquire when form is not hydrated', async () => {
    const { result, rerender } = renderHook(
      (p: { hydrated: boolean; gen: number }) =>
        useHarness({
          formHydrated: p.hydrated,
          hydrationGeneration: p.gen,
          mayEdit: true,
          lockState: 'idle',
        }),
      { initialProps: { hydrated: false, gen: 0 } }
    );

    act(() => {
      result.current.form.setValue('title', 'Edited', { shouldDirty: true });
    });
    rerender({ hydrated: false, gen: 0 });

    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(acquire).not.toHaveBeenCalled();
  });

  it('calls acquire once after hydrate when the form becomes dirty', async () => {
    const { result, rerender } = renderHook(
      (p: { hydrated: boolean; gen: number }) =>
        useHarness({
          formHydrated: p.hydrated,
          hydrationGeneration: p.gen,
          mayEdit: true,
          lockState: 'idle',
        }),
      { initialProps: { hydrated: false, gen: 0 } }
    );

    act(() => {
      result.current.form.setValue('title', 'Edited', { shouldDirty: true });
    });

    rerender({ hydrated: true, gen: 1 });
    await act(() => vi.advanceTimersByTimeAsync(200));

    await waitFor(() => expect(acquire).toHaveBeenCalledTimes(1));
  });

  it('invokes onAcquireConflict once when acquire returns false', async () => {
    acquire.mockImplementation(() => Promise.resolve(false));

    const { result, rerender } = renderHook(
      (p: { hydrated: boolean; gen: number }) =>
        useHarness({
          formHydrated: p.hydrated,
          hydrationGeneration: p.gen,
          mayEdit: true,
          lockState: 'idle',
        }),
      { initialProps: { hydrated: true, gen: 0 } }
    );

    act(() => {
      result.current.form.setValue('title', 'X', { shouldDirty: true });
    });
    rerender({ hydrated: true, gen: 0 });
    await act(() => vi.advanceTimersByTimeAsync(200));

    await waitFor(() => expect(acquire).toHaveBeenCalledTimes(1));
    await act(() => Promise.resolve());
    expect(result.current.onAcquireConflict).toHaveBeenCalledTimes(1);
  });

  it('does not call acquire when mayEdit is false even if hydrated and dirty', async () => {
    const { result, rerender } = renderHook(
      (p: { mayEdit: boolean }) =>
        useHarness({
          formHydrated: true,
          hydrationGeneration: 1,
          mayEdit: p.mayEdit,
          lockState: 'idle',
        }),
      { initialProps: { mayEdit: false } }
    );

    act(() => {
      result.current.form.setValue('title', 'X', { shouldDirty: true });
    });
    rerender({ mayEdit: false });
    await act(() => vi.advanceTimersByTimeAsync(200));

    expect(acquire).not.toHaveBeenCalled();
  });

  it('does not spam acquire while the same dirty state retries', async () => {
    acquire.mockImplementation(() => Promise.resolve(false));

    const { result, rerender } = renderHook(
      (p: { hydrated: boolean; gen: number }) =>
        useHarness({
          formHydrated: p.hydrated,
          hydrationGeneration: p.gen,
          mayEdit: true,
          lockState: 'idle',
        }),
      { initialProps: { hydrated: true, gen: 0 } }
    );

    act(() => {
      result.current.form.setValue('title', 'X', { shouldDirty: true });
    });
    rerender({ hydrated: true, gen: 0 });
    await act(() => vi.advanceTimersByTimeAsync(200));

    await waitFor(() => expect(acquire).toHaveBeenCalledTimes(1));

    rerender({ hydrated: true, gen: 0 });
    rerender({ hydrated: true, gen: 0 });
    await act(() => vi.advanceTimersByTimeAsync(200));

    expect(acquire).toHaveBeenCalledTimes(1);
  });

  it('exposes conflict message constant for UI copy', () => {
    expect(EDIT_LOCK_CONFLICT_TOAST).toContain('Another user');
  });
});
