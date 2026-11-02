import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ACTIVITY_EDIT_CONNECTION_RESTORED_ALERT,
  ACTIVITY_EDIT_CONNECTION_VERIFYING_ALERT,
} from '../lib/activity-edit-session-messages';
import {
  CONNECTION_RESTORED_ALERT_DURATION_MS,
  useActivityEditConnectionUi,
  type UseActivityEditConnectionUiInput,
} from './useActivityEditConnectionUi';

const baseInput: UseActivityEditConnectionUiInput = {
  activityId: 1,
  socketConnection: 'connected',
  connectionAlertEligible: true,
  isActiveEditSession: false,
  editRecoveryState: null,
};

describe('useActivityEditConnectionUi', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not show reconnecting or restored on initial connect handshake', () => {
    const { result, rerender } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      {
        initialProps: {
          ...baseInput,
          socketConnection: 'reconnecting',
        },
      }
    );

    expect(result.current.connectionAlert).toBeNull();

    rerender({
      ...baseInput,
      socketConnection: 'connected',
    });

    expect(result.current.connectionAlert).toBeNull();
  });

  it('does not show a reconnecting alert during a brief socket blip', () => {
    const { result, rerender } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      { initialProps: baseInput }
    );

    rerender({ ...baseInput, socketConnection: 'reconnecting' });

    expect(result.current.connectionAlert).toBeNull();

    rerender({ ...baseInput, socketConnection: 'connected' });

    expect(result.current.connectionAlert).toBeNull();
  });

  it('shows disconnected after reconnecting escalates to a long outage', () => {
    const { result, rerender } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      { initialProps: baseInput }
    );

    rerender({ ...baseInput, socketConnection: 'reconnecting' });
    expect(result.current.connectionAlert).toBeNull();

    rerender({ ...baseInput, socketConnection: 'disconnected' });

    expect(result.current.connectionAlert?.phase).toBe('disconnected');

    rerender({ ...baseInput, socketConnection: 'connected' });

    expect(result.current.connectionAlert?.phase).toBe('restored');
  });

  it('clears offline alert during reconnecting grace while keeping restore armed', () => {
    const { result, rerender } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      {
        initialProps: {
          ...baseInput,
          socketConnection: 'browser-offline',
        },
      }
    );

    expect(result.current.connectionAlert?.phase).toBe('browser-offline');

    rerender({
      ...baseInput,
      socketConnection: 'reconnecting',
    });

    expect(result.current.connectionAlert).toBeNull();

    rerender({
      ...baseInput,
      socketConnection: 'connected',
    });

    expect(result.current.connectionAlert?.phase).toBe('restored');
  });

  it('shows browser-offline alert and arms restored when user was notified', () => {
    const { result, rerender } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      {
        initialProps: {
          ...baseInput,
          socketConnection: 'browser-offline',
        },
      }
    );

    expect(result.current.connectionAlert?.phase).toBe('browser-offline');

    rerender({
      ...baseInput,
      socketConnection: 'connected',
    });

    expect(result.current.connectionAlert?.phase).toBe('restored');
    expect(result.current.connectionAlert?.message).toBe(
      ACTIVITY_EDIT_CONNECTION_RESTORED_ALERT
    );
  });

  it('shows verifying then restored after resync success during active edit session', () => {
    const { result, rerender } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      {
        initialProps: {
          ...baseInput,
          isActiveEditSession: true,
          socketConnection: 'browser-offline',
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
      result.current.notifyResyncOutcome('success');
    });

    expect(result.current.connectionAlert?.phase).toBe('restored');
    expect(result.current.connectionAlert?.message).toBe(
      ACTIVITY_EDIT_CONNECTION_RESTORED_ALERT
    );

    act(() => {
      vi.advanceTimersByTime(CONNECTION_RESTORED_ALERT_DURATION_MS);
    });

    expect(result.current.connectionAlert).toBeNull();
  });

  it('does not show restored when user was never notified', () => {
    const { result, rerender } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      {
        initialProps: {
          ...baseInput,
          connectionAlertEligible: false,
          socketConnection: 'browser-offline',
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

  it('shows restored when resync state clears without calling notifyResyncOutcome', () => {
    const { result, rerender } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      {
        initialProps: {
          ...baseInput,
          isActiveEditSession: true,
          socketConnection: 'browser-offline',
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

    rerender({
      ...baseInput,
      isActiveEditSession: true,
      socketConnection: 'connected',
      editRecoveryState: null,
    });

    expect(result.current.connectionAlert?.phase).toBe('restored');
  });

  it('clears verifying when resync ends in a failure state', () => {
    const { result, rerender } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      {
        initialProps: {
          ...baseInput,
          isActiveEditSession: true,
          socketConnection: 'browser-offline',
        },
      }
    );

    rerender({
      ...baseInput,
      isActiveEditSession: true,
      socketConnection: 'connected',
      editRecoveryState: 'resyncing',
    });

    rerender({
      ...baseInput,
      isActiveEditSession: true,
      socketConnection: 'connected',
      editRecoveryState: 'retry',
    });

    expect(result.current.connectionAlert).toBeNull();
  });

  it('clears alert on resync failure without restored', () => {
    const { result, rerender } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      {
        initialProps: {
          ...baseInput,
          isActiveEditSession: true,
          socketConnection: 'browser-offline',
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
      result.current.notifyResyncOutcome('failure');
    });

    expect(result.current.connectionAlert).toBeNull();

    act(() => {
      result.current.notifyResyncOutcome('success');
    });

    expect(result.current.connectionAlert).toBeNull();
  });

  it('resets when activityId changes', () => {
    const { result, rerender } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      {
        initialProps: {
          ...baseInput,
          socketConnection: 'browser-offline',
        },
      }
    );

    expect(result.current.connectionAlert?.phase).toBe('browser-offline');

    rerender({
      ...baseInput,
      activityId: 2,
      socketConnection: 'browser-offline',
    });

    expect(result.current.connectionAlert?.phase).toBe('browser-offline');
  });

  it('returns to disconnected when connection drops during restored', () => {
    const { result, rerender } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      {
        initialProps: {
          ...baseInput,
          socketConnection: 'disconnected',
        },
      }
    );

    rerender({ ...baseInput, socketConnection: 'connected' });
    expect(result.current.connectionAlert?.phase).toBe('restored');

    rerender({ ...baseInput, socketConnection: 'disconnected' });
    expect(result.current.connectionAlert?.phase).toBe('disconnected');
  });

  it('clears blocked alert when connectionAlertEligible becomes false', () => {
    const { result, rerender } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      {
        initialProps: {
          ...baseInput,
          socketConnection: 'browser-offline',
        },
      }
    );

    expect(result.current.connectionAlert?.phase).toBe('browser-offline');

    rerender({
      ...baseInput,
      connectionAlertEligible: false,
      socketConnection: 'browser-offline',
    });

    expect(result.current.connectionAlert).toBeNull();
  });

  it('shows disconnected alert copy when the socket is unreachable', () => {
    const { result } = renderHook(
      (props: UseActivityEditConnectionUiInput) =>
        useActivityEditConnectionUi(props),
      {
        initialProps: {
          ...baseInput,
          socketConnection: 'disconnected',
        },
      }
    );

    expect(result.current.connectionAlert?.phase).toBe('disconnected');
    expect(result.current.connectionAlert?.message).toMatch(/connection lost/i);
  });
});
