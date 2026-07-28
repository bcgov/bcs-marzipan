import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_ACTIVITY_INFO_ICON_SETTINGS } from '@corpcal/shared';
import { render } from '@/test/test-utils';

import { ActivityInfoIconSettingsProvider } from './activity-info-icon-settings-context';

const { mockUseQuery, mockReadCached, mockToastWarning } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockReadCached: vi.fn(),
  mockToastWarning: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
  };
});

vi.mock('sonner', () => ({
  toast: {
    warning: (...args: unknown[]) => mockToastWarning(...args),
  },
}));

vi.mock('@/api/activityInfoIconSettingsApi', () => ({
  activityInfoIconSettingsRetryDelay: 1000,
  fetchActivityInfoIconSettings: vi.fn(),
  readCachedActivityInfoIconSettings: () => mockReadCached(),
  shouldRetryActivityInfoIconSettings: vi.fn(() => false),
}));

describe('ActivityInfoIconSettingsProvider fallback warnings', () => {
  it('shows cached fallback warning toast when query errors and cached settings exist', () => {
    vi.clearAllMocks();
    mockReadCached.mockReturnValue(DEFAULT_ACTIVITY_INFO_ICON_SETTINGS);
    mockUseQuery.mockReturnValue({
      data: DEFAULT_ACTIVITY_INFO_ICON_SETTINGS,
      error: new Error('rate limited'),
    });

    render(
      <ActivityInfoIconSettingsProvider>
        <div>child</div>
      </ActivityInfoIconSettingsProvider>
    );

    expect(mockToastWarning).toHaveBeenCalledWith(
      'Showing cached info icon settings',
      expect.objectContaining({ id: 'activity-info-icons-cached-fallback' })
    );
  });

  it('shows default fallback warning toast when query errors with no cache', () => {
    vi.clearAllMocks();
    mockReadCached.mockReturnValue(null);
    mockUseQuery.mockReturnValue({
      data: DEFAULT_ACTIVITY_INFO_ICON_SETTINGS,
      error: new Error('rate limited'),
    });

    render(
      <ActivityInfoIconSettingsProvider>
        <div>child</div>
      </ActivityInfoIconSettingsProvider>
    );

    expect(mockToastWarning).toHaveBeenCalledWith(
      'Showing default info icon settings',
      expect.objectContaining({ id: 'activity-info-icons-default-fallback' })
    );
  });

  it('only warns once when rerendering with the same error', () => {
    vi.clearAllMocks();
    mockReadCached.mockReturnValue(DEFAULT_ACTIVITY_INFO_ICON_SETTINGS);
    mockUseQuery.mockReturnValue({
      data: DEFAULT_ACTIVITY_INFO_ICON_SETTINGS,
      error: new Error('rate limited'),
    });

    const { rerender } = render(
      <ActivityInfoIconSettingsProvider>
        <div>child</div>
      </ActivityInfoIconSettingsProvider>
    );

    rerender(
      <ActivityInfoIconSettingsProvider>
        <div>child</div>
      </ActivityInfoIconSettingsProvider>
    );

    expect(mockToastWarning).toHaveBeenCalledTimes(1);
  });
});
