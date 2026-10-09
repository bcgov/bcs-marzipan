import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ACTIVITY_EDIT_CONNECTION_RESTORED_ALERT,
  ACTIVITY_EDIT_CONNECTION_RESTORED_BEFORE_EDIT_ALERT,
  ACTIVITY_EDIT_CONNECTION_VERIFYING_ALERT,
} from '../lib/activity-edit-session-messages';
import { TOAST_DURATION_MS } from '../lib/toast-durations';
import { useActivityConnectionFeedback } from './useActivityConnectionFeedback';

const baseInput = {
  activityId: 1,
  socketConnection: 'connected' as const,
  connectionAlertEligible: true,
  isActiveEditSession: false,
  editRecoveryState: null as const,
};

describe('useActivityConnectionFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows offline alert and arms restored when user was notified', () => {
    const { result, rerender } = renderHook(
      (props) => useActivityConnectionFeedback(props),
      { initialProps: { ...baseInput, socketConnection: 'offline' as const } }
    );

    expect(result.current.connectionAlert?.phase).toBe('offline');

    rerender({
      ...baseInput,
      socketConnection: 'connected',
    });

    expect(result.current.connectionAlert?.phase).toBe('restored');
    expect(result.current.connectionAlert?.message).toBe(
      ACTIVITY_EDIT_CONNECTION_RESTORED_BEFORE_EDIT_ALERT
    );
  });

  it('shows verifying then restored after resync success during active edit session', () => {
    const { result, rerender } = renderHook(
      (props) => useActivityConnectionFeedback(props),
      {
        initialProps: {
          ...baseInput,
          isActiveEditSession: true,
          socketConnection: 'offline' as const,
        },
      }
    );

    rerender({
      ...baseInput,
      isActiveEditSession: true,
      socketConnection: 'connected',
      editRecoveryState: 'resyncing',
    });

    expect(result.current.connectionAlert?.phase).toBe('verifying');
    expect(result.current.connectionAlert?.message).toBe(
      ACTIVITY_EDIT_CONNECTION_VERIFYING_ALERT
    );

    act(() => {
      result.current.reportResyncSuccess();
    });

    expect(result.current.connectionAlert?.phase).toBe('restored');
    expect(result.current.connectionAlert?.message).toBe(
      ACTIVITY_EDIT_CONNECTION_RESTORED_ALERT
    );

    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS.success);
    });

    expect(result.current.connectionAlert).toBeNull();
  });

  it('does not show restored when user was never notified', () => {
    const { result, rerender } = renderHook(
      (props) => useActivityConnectionFeedback(props),
      {
        initialProps: {
          ...baseInput,
          connectionAlertEligible: false,
          socketConnection: 'offline' as const,
        },
      }
    );

    expect(result.current.connectionAlert).toBeNull();

    rerender({
      ...baseInput,
      connectionAlertEligible: false,
      socketConnection: 'connected',
    });

    expect(result.current.connectionAlert).toBeNull();
  });

  it('clears alert on resync failure without restored', () => {
    const { result, rerender } = renderHook(
      (props) => useActivityConnectionFeedback(props),
      {
        initialProps: {
          ...baseInput,
          isActiveEditSession: true,
          socketConnection: 'offline' as const,
        },
      }
    );

    rerender({
      ...baseInput,
      isActiveEditSession: true,
      socketConnection: 'connected',
      editRecoveryState: 'resyncing',
    });

    act(() => {
      result.current.reportResyncFailure();
    });

    expect(result.current.connectionAlert).toBeNull();

    act(() => {
      result.current.reportResyncSuccess();
    });

    expect(result.current.connectionAlert).toBeNull();
  });

  it('resets when activityId changes', () => {
    const { result, rerender } = renderHook(
      (props) => useActivityConnectionFeedback(props),
      { initialProps: { ...baseInput, socketConnection: 'offline' as const } }
    );

    expect(result.current.connectionAlert?.phase).toBe('offline');

    rerender({
      ...baseInput,
      activityId: 2,
      socketConnection: 'offline' as const,
    });

    expect(result.current.connectionAlert?.phase).toBe('offline');
  });

  it('returns to offline when connection drops during restored', () => {
    const { result, rerender } = renderHook(
      (props) => useActivityConnectionFeedback(props),
      { initialProps: { ...baseInput, socketConnection: 'offline' as const } }
    );

    rerender({ ...baseInput, socketConnection: 'connected' });
    expect(result.current.connectionAlert?.phase).toBe('restored');

    rerender({ ...baseInput, socketConnection: 'offline' });
    expect(result.current.connectionAlert?.phase).toBe('offline');
  });
});
