import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';

import { DEFAULT_ACTIVITY_INFO_ICON_SETTINGS } from '@corpcal/shared';
import { render, screen } from '@/test/test-utils';

import { ActivityInfoIconSettingsAdmin } from './ActivityInfoIconSettingsAdmin';

const { mockUseQuery, mockUseMutation, mockUseQueryClient, mockReadCached } =
  vi.hoisted(() => ({
    mockUseQuery: vi.fn(),
    mockUseMutation: vi.fn(),
    mockUseQueryClient: vi.fn(),
    mockReadCached: vi.fn(),
  }));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
    useMutation: (...args: unknown[]) => mockUseMutation(...args),
    useQueryClient: () => mockUseQueryClient(),
  };
});

vi.mock('@/hooks/usePermissions', () => ({
  usePermission: () => true,
}));

vi.mock('@/api/activityInfoIconSettingsApi', () => ({
  activityInfoIconSettingsRetryDelay: 1000,
  fetchActivityInfoIconSettings: vi.fn(),
  patchActivityInfoIconSettings: vi.fn(),
  readCachedActivityInfoIconSettings: () => mockReadCached(),
  shouldRetryActivityInfoIconSettings: vi.fn(() => false),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock('@/components/ui/combobox', () => {
  const passthrough = ({ children }: any) => <div>{children}</div>;
  const passthroughWithRef = React.forwardRef<HTMLDivElement, any>(
    ({ children }, ref) => <div ref={ref}>{children}</div>
  );
  passthroughWithRef.displayName = 'MockComboboxChips';

  return {
    Combobox: passthrough,
    ComboboxChip: passthrough,
    ComboboxChips: passthroughWithRef,
    ComboboxChipsInput: () => null,
    ComboboxCollection: () => null,
    ComboboxContent: passthrough,
    ComboboxEmpty: passthrough,
    ComboboxGroup: passthrough,
    ComboboxItem: passthrough,
    ComboboxLabel: passthrough,
    ComboboxList: passthrough,
    ComboboxValue: () => null,
    useComboboxAnchor: () => ({ current: null }),
  };
});

describe('ActivityInfoIconSettingsAdmin fallback warnings', () => {
  it('shows cached fallback warning when query errors and cached settings exist', () => {
    vi.clearAllMocks();
    mockReadCached.mockReturnValue(DEFAULT_ACTIVITY_INFO_ICON_SETTINGS);
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: vi.fn(),
    });
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseQuery.mockReturnValue({
      data: DEFAULT_ACTIVITY_INFO_ICON_SETTINGS,
      isLoading: false,
      error: new Error('rate limited'),
    });

    render(<ActivityInfoIconSettingsAdmin />);

    expect(
      screen.getByText(/showing the last saved local copy of settings/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/showing default settings temporarily/i)
    ).not.toBeInTheDocument();
  });

  it('shows default fallback warning when query errors without cached settings', () => {
    vi.clearAllMocks();
    mockReadCached.mockReturnValue(null);
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: vi.fn(),
    });
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseQuery.mockReturnValue({
      data: DEFAULT_ACTIVITY_INFO_ICON_SETTINGS,
      isLoading: false,
      error: new Error('rate limited'),
    });

    render(<ActivityInfoIconSettingsAdmin />);

    expect(
      screen.getByText(/showing default settings temporarily/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/showing the last saved local copy of settings/i)
    ).not.toBeInTheDocument();
  });
});
