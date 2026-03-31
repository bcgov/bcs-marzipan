import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@/test/test-utils';

// Controlled mocks
const mockFetchBannerSettings = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/api/bannerApi', () => ({
  fetchBannerSettings: () => mockFetchBannerSettings(),
  upsertBannerSettings: () => Promise.resolve(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const SYSTEM_ADMIN_ROLE_ID = 6;

describe('BannerSettingsAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when user is System Admin', async () => {
    mockFetchBannerSettings.mockResolvedValue({
      id: 1,
      isActive: false,
      content: '<p>hi</p>',
      backgroundColor: '#fff',
      textColor: '#000',
      isDismissible: true,
      startDateTime: null,
      endDateTime: null,
    });

    mockUseAuth.mockReturnValue({
      user: { id: 1, roleId: SYSTEM_ADMIN_ROLE_ID },
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
    });

    const { BannerSettingsAdmin } = await import('../BannerSettingsAdmin');
    render(<BannerSettingsAdmin />);

    await waitFor(() => expect(mockFetchBannerSettings).toHaveBeenCalled(), {
      timeout: 20000,
    });
    expect(screen.getByText(/System Banner/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Save Banner/i })
    ).toBeInTheDocument();
  }, 20000);

  it('does not render for non-System-Admin users', async () => {
    mockFetchBannerSettings.mockResolvedValue(null);

    mockUseAuth.mockReturnValue({
      user: { id: 2, roleId: 5 },
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
    });

    const { BannerSettingsAdmin } = await import('../BannerSettingsAdmin');
    const { container } = render(<BannerSettingsAdmin />);

    expect(container).toBeEmptyDOMElement();
  });
});
