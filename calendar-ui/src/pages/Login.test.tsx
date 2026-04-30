/**
 * Login page tests — Azure AD sign-in button visibility and error handling.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Login } from './Login';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockGetAzureConfig = vi.fn();
const mockStartAzureLogin = vi.fn();

vi.mock('../api/authApi', () => ({
  getAzureConfig: () => mockGetAzureConfig(),
  startAzureLogin: () => mockStartAzureLogin(),
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
        screen.queryByRole('button', { name: /log in with idir/i })
      ).not.toBeInTheDocument();
    });

    it('is visible when Azure is configured', async () => {
      mockGetAzureConfig.mockResolvedValue({ enabled: true });
      renderLogin();

      expect(
        await screen.findByRole('button', { name: /log in with idir/i })
      ).toBeInTheDocument();
    });

    it('is hidden when the getAzureConfig call fails', async () => {
      mockGetAzureConfig.mockRejectedValue(new Error('network error'));
      renderLogin();

      await waitFor(() => expect(mockGetAzureConfig).toHaveBeenCalledOnce());

      expect(
        screen.queryByRole('button', { name: /log in with idir/i })
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
        name: /log in with idir/i,
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
        name: /log in with idir/i,
      });
      await userEvent.click(button);

      expect(screen.getByText(/Redirecting to Microsoft/i)).toBeInTheDocument();
    });
  });
});
