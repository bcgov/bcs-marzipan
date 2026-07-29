import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_ACTIVITY_INFO_ICON_SETTINGS } from '@corpcal/shared';
import { render, screen } from '@/test/test-utils';

import {
  ActivityFieldInfoIcon,
  ActivityInfoIconSettingsProvider,
} from './activity-info-icon-settings-context';

const { mockUseQuery, mockReadCached, mockToastWarning, mockRichTextValue } =
  vi.hoisted(() => ({
    mockUseQuery: vi.fn(),
    mockReadCached: vi.fn(),
    mockToastWarning: vi.fn(),
    mockRichTextValue: vi.fn(),
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

vi.mock('@/components/ui/info-icon-button', () => ({
  InfoIconButton: ({ 'aria-label': ariaLabel }: any) => (
    <button aria-label={ariaLabel}>i</button>
  ),
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <>{children}</>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/activity-rich-text-content', () => ({
  ActivityRichTextContent: ({ value }: any) => {
    mockRichTextValue(value);
    return <div data-testid="activity-rich-text">{value}</div>;
  },
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

  it('renders field tooltip content through ActivityRichTextContent', () => {
    vi.clearAllMocks();
    mockReadCached.mockReturnValue(null);
    mockUseQuery.mockReturnValue({
      data: {
        items: [
          {
            fieldKey: 'categoryIds',
            text: '**Event**: Event category',
          },
        ],
      },
      error: null,
    });

    render(
      <ActivityInfoIconSettingsProvider>
        <ActivityFieldInfoIcon
          fieldKey="categoryIds"
          ariaLabel="About categories"
        />
      </ActivityInfoIconSettingsProvider>
    );

    expect(screen.getByTestId('activity-rich-text')).toHaveTextContent(
      '**Event**: Event category'
    );
    expect(mockRichTextValue).toHaveBeenCalledWith('**Event**: Event category');
  });
});
