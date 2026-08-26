/**
 * Login page tests — Azure AD sign-in button visibility and error handling.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Login } from './Login';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockGetAzureConfig = vi.fn();
const mockGetLocalConfig = vi.fn();
const mockStartAzureLogin = vi.fn();
const mockCheckEmail = vi.fn();
const mockSetPassword = vi.fn();
const mockVerifyResetCode = vi.fn();
const mockChangePassword = vi.fn();

vi.mock('../api/authApi', () => ({
  getAzureConfig: () => mockGetAzureConfig(),
  getLocalConfig: () => mockGetLocalConfig(),
  startAzureLogin: () => mockStartAzureLogin(),
  checkEmail: (...args: unknown[]) => mockCheckEmail(...args),
  setPassword: (...args: unknown[]) => mockSetPassword(...args),
  verifyResetCode: (...args: unknown[]) => mockVerifyResetCode(...args),
  changePassword: (...args: unknown[]) => mockChangePassword(...args),
}));

const mockLogin = vi.fn();
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../lib/error-toast', () => ({
  getFriendlyErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : String(err),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

function setLocationSearch(search: string) {
  window.history.pushState({}, '', search ? `/login${search}` : '/login');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Login page — Azure AD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: local auth disabled — tests that care will override this
    mockGetLocalConfig.mockResolvedValue({
      enabled: false,
      mockEnabled: false,
    });
    // Default: checkEmail returns inactive (override per test)
    mockCheckEmail.mockResolvedValue({ status: 'inactive' });
    // Reset to a clean URL before each test
    window.history.pushState({}, '', '/login');
  });

  afterEach(() => {
    window.history.pushState({}, '', '/login');
  });

  describe('Microsoft sign-in button visibility', () => {
    it('is hidden when Azure is not configured', async () => {
      mockGetAzureConfig.mockResolvedValue({ enabled: false });
      renderLogin();

      await waitFor(() => expect(mockGetAzureConfig).toHaveBeenCalledOnce());

      expect(
        screen.queryByRole('button', { name: /sign in with microsoft/i })
      ).not.toBeInTheDocument();
    });

    it('is visible when Azure is configured', async () => {
      mockGetAzureConfig.mockResolvedValue({ enabled: true });
      renderLogin();

      expect(
        await screen.findByRole('button', { name: /sign in with microsoft/i })
      ).toBeInTheDocument();
    });

    it('is hidden when the getAzureConfig call fails', async () => {
      mockGetAzureConfig.mockRejectedValue(new Error('network error'));
      renderLogin();

      await waitFor(() => expect(mockGetAzureConfig).toHaveBeenCalledOnce());

      expect(
        screen.queryByRole('button', { name: /sign in with microsoft/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Azure AD callback error messages', () => {
    it('displays the correct message for azure_not_configured', async () => {
      mockGetAzureConfig.mockResolvedValue({ enabled: false });
      setLocationSearch('?error=azure_not_configured');
      renderLogin();

      await waitFor(() => expect(mockGetAzureConfig).toHaveBeenCalledOnce());

      expect(
        screen.getByText(
          /Microsoft sign-in is not configured in this environment/i
        )
      ).toBeInTheDocument();
    });

    it('displays the correct message for azure_no_account', async () => {
      mockGetAzureConfig.mockResolvedValue({ enabled: false });
      setLocationSearch('?error=azure_no_account');
      renderLogin();

      await waitFor(() => expect(mockGetAzureConfig).toHaveBeenCalledOnce());

      expect(
        screen.getByText(
          /Your Microsoft account is not linked to an active Corporate Calendar user/i
        )
      ).toBeInTheDocument();
    });

    it('displays the correct message for azure_deactivated', async () => {
      mockGetAzureConfig.mockResolvedValue({ enabled: false });
      setLocationSearch('?error=azure_deactivated');
      renderLogin();

      await waitFor(() => expect(mockGetAzureConfig).toHaveBeenCalledOnce());

      expect(
        screen.getByText(/This account has been deactivated/i)
      ).toBeInTheDocument();
    });

    it('displays the correct message for azure_reset_required', async () => {
      mockGetAzureConfig.mockResolvedValue({ enabled: false });
      setLocationSearch('?error=azure_reset_required');
      renderLogin();

      await waitFor(() => expect(mockGetAzureConfig).toHaveBeenCalledOnce());

      expect(
        screen.getByText(
          /password reset is required before you can sign in with microsoft/i
        )
      ).toBeInTheDocument();
    });

    it('displays a generic message for any other azure error', async () => {
      mockGetAzureConfig.mockResolvedValue({ enabled: false });
      setLocationSearch('?error=azure_auth_failed');
      renderLogin();

      await waitFor(() => expect(mockGetAzureConfig).toHaveBeenCalledOnce());

      expect(
        screen.getByText(/Microsoft sign-in failed. Please try again./i)
      ).toBeInTheDocument();
    });

    it('cleans the error query param from the URL after displaying the message', async () => {
      mockGetAzureConfig.mockResolvedValue({ enabled: false });
      setLocationSearch('?error=azure_no_account');
      renderLogin();

      await waitFor(() => expect(mockGetAzureConfig).toHaveBeenCalledOnce());

      expect(window.location.search).toBe('');
    });
  });

  describe('Clicking the Microsoft sign-in button', () => {
    it('calls startAzureLogin when clicked', async () => {
      mockGetAzureConfig.mockResolvedValue({ enabled: true });
      renderLogin();

      const button = await screen.findByRole('button', {
        name: /sign in with microsoft/i,
      });
      await userEvent.click(button);

      expect(mockStartAzureLogin).toHaveBeenCalledOnce();
    });

    it('shows a loading indicator after the button is clicked', async () => {
      mockGetAzureConfig.mockResolvedValue({ enabled: true });
      // startAzureLogin triggers window.location redirect; the loading state
      // should appear immediately while the browser navigates away.
      renderLogin();

      const button = await screen.findByRole('button', {
        name: /sign in with microsoft/i,
      });
      await userEvent.click(button);

      expect(screen.getByText(/Redirecting to Microsoft/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Login page — local email/password auth
// ---------------------------------------------------------------------------

describe('Login page — local email/password auth', () => {
  function setupLocalOnly() {
    mockGetAzureConfig.mockResolvedValue({ enabled: false });
    mockGetLocalConfig.mockResolvedValue({ enabled: true, mockEnabled: false });
  }

  function setupBothMethods() {
    mockGetAzureConfig.mockResolvedValue({ enabled: true });
    mockGetLocalConfig.mockResolvedValue({ enabled: true, mockEnabled: false });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckEmail.mockResolvedValue({ status: 'inactive' });
    window.history.pushState({}, '', '/login');
  });

  afterEach(() => {
    window.history.pushState({}, '', '/login');
  });

  // -------------------------------------------------------------------------
  // Form visibility
  // -------------------------------------------------------------------------

  describe('form visibility', () => {
    it('shows the email input when local auth is the only method', async () => {
      setupLocalOnly();
      renderLogin();
      expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    });

    it('shows the "no login method" message when all auth methods are disabled', async () => {
      mockGetAzureConfig.mockResolvedValue({ enabled: false });
      mockGetLocalConfig.mockResolvedValue({
        enabled: false,
        mockEnabled: false,
      });
      renderLogin();
      await waitFor(() => expect(mockGetAzureConfig).toHaveBeenCalledOnce());
      expect(
        screen.getByText(/no login method is configured/i)
      ).toBeInTheDocument();
    });

    it('shows the chevron toggle when both Azure and local are enabled', async () => {
      setupBothMethods();
      renderLogin();
      await screen.findByRole('button', { name: /sign in with microsoft/i });
      expect(
        screen.getByRole('button', { name: /sign in with a local account/i })
      ).toBeInTheDocument();
    });

    it('reveals the local form when the chevron toggle is clicked', async () => {
      setupBothMethods();
      renderLogin();
      const toggle = await screen.findByRole('button', {
        name: /sign in with a local account/i,
      });
      await userEvent.click(toggle);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('hides the local form when "Use Microsoft instead" is clicked', async () => {
      setupBothMethods();
      renderLogin();
      await userEvent.click(
        await screen.findByRole('button', {
          name: /sign in with a local account/i,
        })
      );
      await userEvent.click(
        screen.getByRole('button', { name: /use microsoft instead/i })
      );
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Email-entry step
  // -------------------------------------------------------------------------

  describe('email-entry step', () => {
    beforeEach(() => setupLocalOnly());

    it('advances to password-entry for an active account', async () => {
      mockCheckEmail.mockResolvedValue({
        status: 'active',
        email: 'test@example.com',
      });
      renderLogin();
      await userEvent.type(
        await screen.findByLabelText('Email'),
        'test@example.com'
      );
      await userEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(await screen.findByLabelText('Password')).toBeInTheDocument();
    });

    it('advances to set-password for a pending account', async () => {
      mockCheckEmail.mockResolvedValue({
        status: 'pending',
        email: 'new@example.com',
      });
      renderLogin();
      await userEvent.type(
        await screen.findByLabelText('Email'),
        'new@example.com'
      );
      await userEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(
        await screen.findByText(/create your password/i)
      ).toBeInTheDocument();
    });

    it('advances to reset-code entry for a requires_reset account', async () => {
      mockCheckEmail.mockResolvedValue({
        status: 'requires_reset',
        email: 'reset@example.com',
      });
      renderLogin();
      await userEvent.type(
        await screen.findByLabelText('Email'),
        'reset@example.com'
      );
      await userEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(await screen.findByLabelText('Reset Code')).toBeInTheDocument();
    });

    it('shows an error for an unknown email (enumeration hardening: same message as deactivated)', async () => {
      mockCheckEmail.mockResolvedValue({ status: 'inactive' });
      renderLogin();
      await userEvent.type(
        await screen.findByLabelText('Email'),
        'nobody@example.com'
      );
      await userEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(await screen.findByText(/deactivated/i)).toBeInTheDocument();
    });

    it('shows an error for a deactivated account without Microsoft rescue', async () => {
      setupBothMethods();
      mockCheckEmail.mockResolvedValue({ status: 'inactive' });
      renderLogin();
      await userEvent.click(
        await screen.findByRole('button', {
          name: /sign in with a local account/i,
        })
      );
      await userEvent.type(
        await screen.findByLabelText('Email'),
        'gone@gov.bc.ca'
      );
      await userEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(await screen.findByText(/deactivated/i)).toBeInTheDocument();
      const alert = screen.getByRole('alert');
      expect(
        within(alert).queryByRole('button', { name: /sign in with microsoft/i })
      ).not.toBeInTheDocument();
    });

    it('offers Microsoft rescue for sso_recommended when Azure is enabled', async () => {
      setupBothMethods();
      mockCheckEmail.mockResolvedValue({
        status: 'sso_recommended',
        email: 'idir@gov.bc.ca',
      });
      renderLogin();
      await userEvent.click(
        await screen.findByRole('button', {
          name: /sign in with a local account/i,
        })
      );
      await userEvent.type(
        await screen.findByLabelText('Email'),
        'idir@gov.bc.ca'
      );
      await userEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(await screen.findByText(/microsoft sign-in/i)).toBeInTheDocument();
      expect(
        within(screen.getByRole('alert')).getByRole('button', {
          name: /sign in with microsoft/i,
        })
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Password-entry step
  // -------------------------------------------------------------------------

  describe('password-entry step', () => {
    async function reachPasswordStep() {
      setupLocalOnly();
      mockCheckEmail.mockResolvedValue({
        status: 'active',
        email: 'test@example.com',
      });
      renderLogin();
      await userEvent.type(
        await screen.findByLabelText('Email'),
        'test@example.com'
      );
      await userEvent.click(screen.getByRole('button', { name: /continue/i }));
      await screen.findByLabelText('Password');
    }

    it('calls login and navigates on success', async () => {
      mockLogin.mockResolvedValue({ success: true });
      await reachPasswordStep();
      await userEvent.type(screen.getByLabelText('Password'), 'MyPassword1!');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
      );
    });

    it('shows an error when login fails', async () => {
      mockLogin.mockResolvedValue({
        success: false,
        error: 'Invalid password',
      });
      await reachPasswordStep();
      await userEvent.type(screen.getByLabelText('Password'), 'WrongPass1!');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
      expect(await screen.findByText(/invalid password/i)).toBeInTheDocument();
    });

    it('returns to the email step when "Change" is clicked', async () => {
      mockLogin.mockResolvedValue({ success: false });
      await reachPasswordStep();
      await userEvent.click(screen.getByRole('button', { name: /change/i }));
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Set-password step
  // -------------------------------------------------------------------------

  describe('set-password step', () => {
    async function reachSetPasswordStep() {
      setupLocalOnly();
      mockCheckEmail.mockResolvedValue({
        status: 'pending',
        email: 'new@example.com',
      });
      renderLogin();
      await userEvent.type(
        await screen.findByLabelText('Email'),
        'new@example.com'
      );
      await userEvent.click(screen.getByRole('button', { name: /continue/i }));
      await screen.findByText(/create your password/i);
    }

    it('shows a success message and returns to email entry after setting a password', async () => {
      mockSetPassword.mockResolvedValue({});
      await reachSetPasswordStep();
      await userEvent.type(
        screen.getByLabelText('New Password'),
        'ValidPass1!x'
      );
      await userEvent.type(
        screen.getByLabelText('Confirm Password'),
        'ValidPass1!x'
      );
      await userEvent.click(
        screen.getByRole('button', { name: /set password/i })
      );
      await screen.findByText(/password set successfully/i);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows a validation error when passwords do not match', async () => {
      await reachSetPasswordStep();
      await userEvent.type(
        screen.getByLabelText('New Password'),
        'ValidPass1!x'
      );
      await userEvent.type(
        screen.getByLabelText('Confirm Password'),
        'DifferentP1!'
      );
      await userEvent.click(
        screen.getByRole('button', { name: /set password/i })
      );
      expect(
        await screen.findByText(/passwords do not match/i)
      ).toBeInTheDocument();
    });

    it('shows a validation error when the password is too short', async () => {
      await reachSetPasswordStep();
      await userEvent.type(screen.getByLabelText('New Password'), 'Short1!');
      await userEvent.type(
        screen.getByLabelText('Confirm Password'),
        'Short1!'
      );
      await userEvent.click(
        screen.getByRole('button', { name: /set password/i })
      );
      expect(
        await screen.findByText(/at least 12 characters/i)
      ).toBeInTheDocument();
    });

    it('shows an API error when setPassword rejects', async () => {
      mockSetPassword.mockRejectedValue(new Error('Server error'));
      await reachSetPasswordStep();
      await userEvent.type(
        screen.getByLabelText('New Password'),
        'ValidPass1!x'
      );
      await userEvent.type(
        screen.getByLabelText('Confirm Password'),
        'ValidPass1!x'
      );
      await userEvent.click(
        screen.getByRole('button', { name: /set password/i })
      );
      expect(await screen.findByText(/server error/i)).toBeInTheDocument();
    });

    it('offers Microsoft sign-in on the set-password step when Azure is enabled', async () => {
      setupBothMethods();
      mockCheckEmail.mockResolvedValue({
        status: 'pending',
        email: 'new@example.com',
      });
      renderLogin();
      await userEvent.click(
        await screen.findByRole('button', {
          name: /sign in with a local account/i,
        })
      );
      await userEvent.type(
        await screen.findByLabelText('Email'),
        'new@example.com'
      );
      await userEvent.click(screen.getByRole('button', { name: /continue/i }));
      await screen.findByText(/create your password/i);
      expect(
        screen.getByTestId('login-set-password-azure')
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Reset-code + reset-password steps
  // -------------------------------------------------------------------------

  describe('reset-code and reset-password steps', () => {
    async function reachResetCodeStep() {
      setupLocalOnly();
      mockCheckEmail.mockResolvedValue({
        status: 'requires_reset',
        email: 'reset@example.com',
      });
      renderLogin();
      await userEvent.type(
        await screen.findByLabelText('Email'),
        'reset@example.com'
      );
      await userEvent.click(screen.getByRole('button', { name: /continue/i }));
      await screen.findByLabelText('Reset Code');
    }

    it('advances to reset-password after a valid code is entered', async () => {
      mockVerifyResetCode.mockResolvedValue({ valid: true });
      await reachResetCodeStep();
      await userEvent.type(
        screen.getByLabelText('Reset Code'),
        'abc123deadbeef'
      );
      await userEvent.click(
        screen.getByRole('button', { name: /verify code/i })
      );
      expect(
        await screen.findByText(/set a new password/i)
      ).toBeInTheDocument();
    });

    it('shows an error when the reset code is rejected', async () => {
      mockVerifyResetCode.mockRejectedValue(
        new Error('Invalid or expired reset code')
      );
      await reachResetCodeStep();
      await userEvent.type(screen.getByLabelText('Reset Code'), 'badcode');
      await userEvent.click(
        screen.getByRole('button', { name: /verify code/i })
      );
      expect(
        await screen.findByText(/invalid or expired reset code/i)
      ).toBeInTheDocument();
    });

    it('shows a success message and returns to email entry after the new password is saved following a reset', async () => {
      mockVerifyResetCode.mockResolvedValue({ valid: true });
      mockChangePassword.mockResolvedValue({});
      await reachResetCodeStep();
      await userEvent.type(
        screen.getByLabelText('Reset Code'),
        'abc123deadbeef'
      );
      await userEvent.click(
        screen.getByRole('button', { name: /verify code/i })
      );
      await screen.findByText(/set a new password/i);
      await userEvent.type(
        screen.getByLabelText('New Password'),
        'ValidPass1!x'
      );
      await userEvent.type(
        screen.getByLabelText('Confirm Password'),
        'ValidPass1!x'
      );
      await userEvent.click(
        screen.getByRole('button', { name: /set password/i })
      );
      await screen.findByText(/password reset successfully/i);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
