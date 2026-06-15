import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@corpcal/shared';
import { render, screen, waitFor } from '@/test/test-utils';

const mockFetchLookAheadResetSettings = vi.fn();
const mockFetchLookAheadResetRunPreview = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/api/lookAheadResetApi', () => ({
  fetchLookAheadResetSettings: () => mockFetchLookAheadResetSettings(),
  fetchLookAheadResetRunPreview: (...args: unknown[]) =>
    mockFetchLookAheadResetRunPreview(...args),
  patchLookAheadResetSettings: vi.fn(),
  rollbackLookAheadReset: vi.fn(),
  runLookAheadResetNow: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const baseSettings = {
  windowDaysAfterToday: 7,
  cronMode: 'running' as const,
  rollbackAvailable: false,
};

describe('LookAheadResetSettingsAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchLookAheadResetRunPreview.mockResolvedValue({
      count: 0,
      items: [],
      listTruncated: false,
    });
  });

  it('renders for users with manage look-ahead-reset permission', async () => {
    mockFetchLookAheadResetSettings.mockResolvedValue(baseSettings);
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string) =>
        key === PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
    });

    const { LookAheadResetSettingsAdmin } =
      await import('../LookAheadResetSettingsAdmin');
    render(<LookAheadResetSettingsAdmin />);

    await waitFor(
      () => expect(mockFetchLookAheadResetSettings).toHaveBeenCalled(),
      { timeout: 20000 }
    );

    expect(
      screen.getByRole('heading', { name: /Look Ahead status reset/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Clear LA status/i })
    ).toBeInTheDocument();
  }, 20000);

  it('does not render without manage look-ahead-reset permission', async () => {
    mockFetchLookAheadResetSettings.mockResolvedValue(baseSettings);
    mockUseAuth.mockReturnValue({
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
    });

    const { LookAheadResetSettingsAdmin } =
      await import('../LookAheadResetSettingsAdmin');
    const { container } = render(<LookAheadResetSettingsAdmin />);

    expect(container).toBeEmptyDOMElement();
  });

  it('disables restore when rollback is unavailable', async () => {
    mockFetchLookAheadResetSettings.mockResolvedValue(baseSettings);
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string) =>
        key === PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
    });

    const { LookAheadResetSettingsAdmin } =
      await import('../LookAheadResetSettingsAdmin');
    render(<LookAheadResetSettingsAdmin />);

    await waitFor(
      () => expect(mockFetchLookAheadResetSettings).toHaveBeenCalled(),
      { timeout: 20000 }
    );

    expect(
      screen.getByRole('button', { name: /Restore previous/i })
    ).toBeDisabled();
  }, 20000);

  it('enables restore when rollback is available', async () => {
    mockFetchLookAheadResetSettings.mockResolvedValue({
      ...baseSettings,
      rollbackAvailable: true,
      lastClear: {
        at: '2026-04-17T06:45:00.000Z',
        updated: 4,
        trigger: 'manual' as const,
      },
    });
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string) =>
        key === PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
    });

    const { LookAheadResetSettingsAdmin } =
      await import('../LookAheadResetSettingsAdmin');
    render(<LookAheadResetSettingsAdmin />);

    await waitFor(
      () => expect(mockFetchLookAheadResetSettings).toHaveBeenCalled(),
      { timeout: 20000 }
    );

    await waitFor(
      () =>
        expect(
          screen.getByRole('button', { name: /Restore previous/i })
        ).toBeEnabled(),
      { timeout: 20000 }
    );
  }, 20000);
});
