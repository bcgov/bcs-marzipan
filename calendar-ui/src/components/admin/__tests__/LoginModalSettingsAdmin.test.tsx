import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@/test/test-utils';

const mockFetchLoginModalSettings = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/api/loginModalApi', () => ({
  fetchLoginModalSettings: () => mockFetchLoginModalSettings(),
  upsertLoginModalSettings: () => Promise.resolve(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/useLoginModalSettingsWebSocket', () => ({
  useLoginModalSettingsWebSocket: () => undefined,
}));

const SYSTEM_ADMIN_ROLE_ID = 6;

const baseSettings = {
  id: 1,
  isActive: false,
  title: 'Notice',
  content: 'Test content',
  startDateTime: null,
  endDateTime: null,
  createdDateTime: new Date().toISOString(),
  lastUpdatedDateTime: new Date().toISOString(),
};

describe('LoginModalSettingsAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders for System Admin users', async () => {
    mockFetchLoginModalSettings.mockResolvedValue(baseSettings);
    mockUseAuth.mockReturnValue({
      user: { id: 1, roleId: SYSTEM_ADMIN_ROLE_ID },
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
    });

    const { LoginModalSettingsAdmin } =
      await import('../LoginModalSettingsAdmin');
    render(<LoginModalSettingsAdmin />);

    await waitFor(
      () => expect(mockFetchLoginModalSettings).toHaveBeenCalled(),
      {
        timeout: 20000,
      }
    );

    expect(
      screen.getByRole('heading', { name: /Login modal/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('input-login-modal-title')).toBeInTheDocument();
    expect(
      screen.getByTestId('textarea-login-modal-content')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('checkbox-login-modal-active')
    ).toBeInTheDocument();
  }, 20000);

  it('does not render for non-System-Admin users', async () => {
    mockFetchLoginModalSettings.mockResolvedValue(null);
    mockUseAuth.mockReturnValue({
      user: { id: 2, roleId: 5 },
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
    });

    const { LoginModalSettingsAdmin } =
      await import('../LoginModalSettingsAdmin');
    const { container } = render(<LoginModalSettingsAdmin />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows Current Status as inactive when isActive is false', async () => {
    mockFetchLoginModalSettings.mockResolvedValue({
      ...baseSettings,
      isActive: false,
    });
    mockUseAuth.mockReturnValue({
      user: { id: 1, roleId: SYSTEM_ADMIN_ROLE_ID },
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
    });

    const { LoginModalSettingsAdmin } =
      await import('../LoginModalSettingsAdmin');
    render(<LoginModalSettingsAdmin />);

    await waitFor(
      () => expect(mockFetchLoginModalSettings).toHaveBeenCalled(),
      {
        timeout: 20000,
      }
    );

    expect(screen.getByText(/currently\s+inactive/i)).toBeInTheDocument();
  }, 20000);
});
