/**
 * Login Page
 * Supports a multi-step email-first local login and optional Azure AD sign-in.
 *
 * Flow (AUTH_STRATEGY=local):
 *   email-entry → check-email → password-entry  (active account)
 *                             → set-password     (pending account)
 *                             → enter-reset-code → reset-password  (password_reset_required)
 *
 * When Azure AD is also configured the Microsoft button is shown first.
 * Users with Microsoft-linked accounts can sign in directly without a local
 * password; local login remains available for password-based accounts.
 */
import {
  CheckCircle,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import {
  setPassword as apiSetPassword,
  verifyResetCode as apiVerifyResetCode,
  changePassword,
  checkEmail,
  getAzureConfig,
  getLocalConfig,
  startAzureLogin,
} from '../api/authApi';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';
import { getFriendlyErrorMessage } from '../lib/error-toast';

type LoginView =
  | 'email-entry'
  | 'password-entry'
  | 'set-password'
  | 'enter-reset-code'
  | 'reset-password';

const isBcGovEmail = (input: string) =>
  input.trim().toLowerCase().endsWith('@gov.bc.ca');

function validatePassword(pwd: string): string | null {
  if (pwd.length < 12) return 'Password must be at least 12 characters';
  if (!/[A-Z]/.test(pwd)) return 'Must contain at least one uppercase letter';
  if (!/[a-z]/.test(pwd)) return 'Must contain at least one lowercase letter';
  if (!/[0-9]/.test(pwd)) return 'Must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(pwd))
    return 'Must contain at least one special character';
  return null;
}

const MicrosoftLogo = ({
  className = 'w-4 h-4 mr-2',
}: {
  className?: string;
}) => (
  <svg
    className={className}
    viewBox="0 0 21 21"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="0" y="0" width="10" height="10" fill="#F25022" />
    <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
    <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
    <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
  </svg>
);

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Auth method availability — null means config is still loading
  const [azureEnabled, setAzureEnabled] = useState<boolean | null>(null);
  const [localEnabled, setLocalEnabled] = useState(false);
  const [mockEnabled, setMockEnabled] = useState(false);
  // When Azure is enabled, the local form is hidden by default and shown on request
  const [showLocalForm, setShowLocalForm] = useState(false);

  // Mock mode username
  const [mockUsername, setMockUsername] = useState('');

  // Shared state
  const [error, setError] = useState('');
  const [errorAction, setErrorAction] = useState<'azure' | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAzureLoading, setIsAzureLoading] = useState(false);

  // Email-first flow
  const [view, setView] = useState<LoginView>('email-entry');
  const [emailInput, setEmailInput] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  // Password-entry step
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Set-password / reset-password steps
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Reset code step
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [resetToken, setResetToken] = useState('');

  // -------------------------------------------------------------------------
  // Init: check Azure error params + load config
  // -------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const azureError = params.get('error');

    if (azureError) {
      if (azureError === 'azure_not_configured') {
        setError('Microsoft sign-in is not configured in this environment.');
      } else if (azureError === 'azure_no_account') {
        setError(
          'Your Microsoft account is not linked to an active Corporate Calendar user.'
        );
      } else if (azureError === 'azure_deactivated') {
        setError(
          'This account has been deactivated. Please contact your administrator.'
        );
      } else if (azureError === 'azure_reset_required') {
        setError(
          'A password reset is required before you can sign in with Microsoft. Please use the email/password flow and follow the reset instructions.'
        );
      } else {
        setError('Microsoft sign-in failed. Please try again.');
      }
      window.history.replaceState({}, '', '/login');
    }

    void Promise.all([
      getAzureConfig().catch(() => ({ enabled: false })),
      getLocalConfig().catch(() => ({ enabled: false, mockEnabled: false })),
    ]).then(([azure, local]) => {
      const azureOn = azure.enabled === true;
      setAzureEnabled(azureOn);
      setLocalEnabled(local.enabled === true);
      setMockEnabled(local.mockEnabled === true);
      // If Azure is not the primary method, show the local form immediately
      if (!azureOn && (local.enabled || local.mockEnabled))
        setShowLocalForm(true);
    });
  }, []);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const redirectAfterLogin = () => {
    const returnTo = sessionStorage.getItem('returnTo') || '/';
    sessionStorage.removeItem('returnTo');
    void navigate(returnTo, { replace: true });
  };

  const resetToEmailEntry = () => {
    setView('email-entry');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setResetCodeInput('');
    setResetToken('');
    setError('');
    setErrorAction(null);
    setSuccessMessage('');
    setVerifiedEmail('');
    setEmailInput('');
    setShowLocalForm(false);
  };

  const handleAzureLogin = () => {
    setIsAzureLoading(true);
    startAzureLogin();
  };

  const showMicrosoftPrimary = azureEnabled === true && !showLocalForm;
  const showEmailForm =
    azureEnabled === false || (localEnabled && showLocalForm);

  // -------------------------------------------------------------------------
  // Step 1: Check email status
  // -------------------------------------------------------------------------
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorAction(null);
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const data = await checkEmail(emailInput.trim());
      switch (data.status) {
        case 'active':
          setVerifiedEmail(data.email ?? emailInput.trim());
          setView('password-entry');
          break;
        case 'pending':
          setVerifiedEmail(data.email ?? emailInput.trim());
          setView('set-password');
          break;
        case 'requires_reset':
          setVerifiedEmail(data.email ?? emailInput.trim());
          setView('enter-reset-code');
          break;
        case 'sso_recommended':
          if (azureEnabled) {
            setError(
              isBcGovEmail(emailInput)
                ? 'This account uses Microsoft sign-in (IDIR). Password login is not enabled.'
                : 'This account uses Microsoft sign-in. Password login is not enabled.'
            );
            setErrorAction('azure');
          } else {
            setError(
              'This account cannot sign in with a password. Please contact your administrator.'
            );
          }
          break;
        case 'inactive':
          setError(
            'This account has been deactivated. Please contact your administrator.'
          );
          break;
        default:
          setError('Unable to verify account status. Please try again.');
      }
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err));
    }

    setIsLoading(false);
  };

  // -------------------------------------------------------------------------
  // Step 2a: Submit password for an active account
  // -------------------------------------------------------------------------
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(verifiedEmail, password);

    if (result.success) {
      redirectAfterLogin();
    } else if (result.requiresPasswordSetup) {
      setView('set-password');
    } else if (result.requiresPasswordReset) {
      setView('enter-reset-code');
    } else {
      setError(result.error ?? 'Login failed');
    }

    setIsLoading(false);
  };

  // -------------------------------------------------------------------------
  // Step 2b: Set first-time password (pending account)
  // -------------------------------------------------------------------------
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await apiSetPassword({
        email: verifiedEmail,
        password: newPassword,
        confirmPassword,
      });
      resetToEmailEntry();
      setSuccessMessage('Password set successfully. Please sign in.');
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err));
    }
    setIsLoading(false);
  };

  // -------------------------------------------------------------------------
  // Step 3a: Verify admin-issued reset code
  // -------------------------------------------------------------------------
  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetCodeInput.trim()) {
      setError('Please enter the reset code provided by your administrator');
      return;
    }

    setIsLoading(true);
    try {
      await apiVerifyResetCode({
        email: verifiedEmail,
        resetCode: resetCodeInput.trim(),
      });
      setResetToken(resetCodeInput.trim());
      setView('reset-password');
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err));
    }
    setIsLoading(false);
  };

  // -------------------------------------------------------------------------
  // Step 3b: Set new password after reset code is verified
  // -------------------------------------------------------------------------
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword({
        tempToken: resetToken,
        newPassword,
        confirmPassword,
      });
      resetToEmailEntry();
      setSuccessMessage('Password reset successfully. Please sign in.');
    } catch (err: unknown) {
      setError(getFriendlyErrorMessage(err));
    }
    setIsLoading(false);
  };

  // -------------------------------------------------------------------------
  // Shared password-creation form (used for both set-password and reset-password)
  // -------------------------------------------------------------------------
  const renderNewPasswordForm = (
    title: string,
    description: string,
    onSubmit: (e: React.FormEvent) => Promise<void>,
    options?: { showMicrosoftPrimary?: boolean }
  ) => (
    <div
      className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4"
      data-testid="set-password-page"
    >
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-4 pb-2 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                {title}
              </CardTitle>
              <CardDescription className="mt-2 text-slate-500">
                {description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {options?.showMicrosoftPrimary && (
            <div className="mb-6 space-y-4">
              <Button
                type="button"
                className="h-11 w-full font-medium"
                disabled={isLoading || isAzureLoading}
                onClick={handleAzureLogin}
                data-testid="login-set-password-azure"
              >
                {isAzureLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to Microsoft...
                  </>
                ) : (
                  <>
                    <MicrosoftLogo />
                    Sign in with Microsoft
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-slate-500">
                or set a password below
              </p>
            </div>
          )}

          <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="new-password"
                className="text-sm font-medium text-slate-700"
              >
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="At least 12 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 pr-10 pl-10"
                  autoComplete="new-password"
                  autoFocus
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  data-testid="login-new-password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Min 12 chars · uppercase · lowercase · number · special
                character
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="text-sm font-medium text-slate-700"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="confirm-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 pl-10"
                  autoComplete="new-password"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full font-medium"
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Set Password'
              )}
            </Button>

            <button
              type="button"
              onClick={resetToEmailEntry}
              className="w-full text-center text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              Back to sign-in
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  // -------------------------------------------------------------------------
  // Render: set-password view
  // -------------------------------------------------------------------------
  if (view === 'set-password') {
    return renderNewPasswordForm(
      'Create your password',
      `Set a password to activate your account for ${verifiedEmail}`,
      handleSetPassword,
      { showMicrosoftPrimary: azureEnabled === true }
    );
  }

  // -------------------------------------------------------------------------
  // Render: enter-reset-code view
  // -------------------------------------------------------------------------
  if (view === 'enter-reset-code') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="space-y-4 pb-2 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
                <Lock className="text-primary h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">
                  Password Reset Required
                </CardTitle>
                <CardDescription className="mt-2 text-slate-500">
                  Your administrator has issued a one-time reset code. Enter it
                  below to set a new password.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form
              onSubmit={(e) => void handleVerifyResetCode(e)}
              className="space-y-5"
            >
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Account: <strong>{verifiedEmail}</strong>
                <button
                  type="button"
                  onClick={resetToEmailEntry}
                  className="ml-2 text-xs text-amber-600 underline-offset-2 hover:underline"
                >
                  Change
                </button>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="reset-code"
                  className="text-sm font-medium text-slate-700"
                >
                  Reset Code
                </Label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="reset-code"
                    type="text"
                    placeholder="Paste the code from your administrator"
                    value={resetCodeInput}
                    onChange={(e) => setResetCodeInput(e.target.value)}
                    className="h-11 pl-10 font-mono"
                    autoComplete="off"
                    autoFocus
                    disabled={isLoading}
                    required
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Contact your administrator if you don&apos;t have a reset code
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full font-medium"
                data-testid="login-verify-reset-code"
                disabled={isLoading || !resetCodeInput.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>

              <button
                type="button"
                onClick={resetToEmailEntry}
                className="w-full text-center text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
              >
                Back to sign-in
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: reset-password view
  // -------------------------------------------------------------------------
  if (view === 'reset-password') {
    return renderNewPasswordForm(
      'Set a new password',
      `Choose a new password for ${verifiedEmail}`,
      handleResetPassword
    );
  }

  // -------------------------------------------------------------------------
  // Render: password-entry view (separate card for better UX)
  // -------------------------------------------------------------------------
  if (view === 'password-entry') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="space-y-4 pb-2 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
                <Lock className="text-primary h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">
                  Welcome back
                </CardTitle>
                <CardDescription className="mt-2 text-slate-500">
                  Enter your password to sign in
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form
              onSubmit={(e) => void handlePasswordSubmit(e)}
              className="space-y-5"
            >
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                Signing in as: <strong>{verifiedEmail}</strong>
                <button
                  type="button"
                  onClick={resetToEmailEntry}
                  className="ml-2 text-xs text-blue-600 underline-offset-2 hover:underline"
                >
                  Change
                </button>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10 pl-10"
                    autoComplete="current-password"
                    autoFocus
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={showPassword}
                    data-testid="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full font-medium"
                data-testid="login-submit-password"
                disabled={isLoading || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              {azureEnabled && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLocalForm(false);
                      resetToEmailEntry();
                    }}
                    className="text-sm text-slate-500 underline underline-offset-2 hover:text-slate-800"
                  >
                    Use Microsoft instead
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: main login card (email-entry)
  // -------------------------------------------------------------------------
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4"
      data-testid="login-page"
    >
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-4 pb-2 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-400 shadow-md">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                Corporate Calendar
              </CardTitle>
              <CardDescription className="mt-2 text-slate-500">
                Log in to access the calendar management system
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Loading skeleton while auth config is being fetched */}
          {azureEnabled === null && (
            <div className="animate-pulse" aria-hidden="true">
              <div className="mb-3 h-11 rounded bg-slate-200" />
              <div className="mx-auto h-4 w-1/2 rounded bg-slate-200" />
            </div>
          )}

          {/* Azure IDIR button — primary when available, hidden once local form is open */}
          {showMicrosoftPrimary && (
            <Button
              type="button"
              className="h-11 w-full"
              disabled={isLoading || isAzureLoading}
              onClick={handleAzureLogin}
            >
              {isAzureLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting to Microsoft...
                </>
              ) : (
                <>
                  <MicrosoftLogo />
                  Sign in with Microsoft
                </>
              )}
            </Button>
          )}

          {/* Email-first local login form */}
          {azureEnabled !== null && showEmailForm && (
            <form
              onSubmit={(e) => void handleCheckEmail(e)}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="h-11 pl-10"
                    autoComplete="email"
                    autoFocus={!azureEnabled}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <p>{error}</p>
                  {errorAction === 'azure' && azureEnabled === true && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full border-red-200 bg-white font-medium text-slate-700 hover:bg-red-50"
                      onClick={handleAzureLogin}
                      disabled={isAzureLoading}
                    >
                      {isAzureLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          <MicrosoftLogo />
                          Sign in with Microsoft
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full font-medium"
                data-testid="login-continue-email"
                disabled={isLoading || !emailInput.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>

              {azureEnabled && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLocalForm(false);
                      setError('');
                      setErrorAction(null);
                    }}
                    className="text-sm text-slate-500 underline underline-offset-2 hover:text-slate-800"
                  >
                    Use Microsoft instead
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Mock mode (development only) — simple username form */}
          {azureEnabled !== null && mockEnabled && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                setIsLoading(true);
                login(mockUsername.trim(), '')
                  .then((result) => {
                    if (result.success) redirectAfterLogin();
                    else setError(result.error ?? 'Login failed');
                  })
                  .catch((err: unknown) =>
                    setError(getFriendlyErrorMessage(err))
                  )
                  .finally(() => setIsLoading(false));
              }}
              className="space-y-5"
            >
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Development mode — password is not required
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="mock-username"
                  className="text-sm font-medium text-slate-700"
                >
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="mock-username"
                    type="text"
                    placeholder="Enter your username"
                    value={mockUsername}
                    onChange={(e) => setMockUsername(e.target.value)}
                    className="h-11 pl-10"
                    autoComplete="username"
                    autoFocus
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full font-medium"
                data-testid="login-submit-mock"
                disabled={isLoading || !mockUsername.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log In'
                )}
              </Button>
            </form>
          )}

          {/* Neither strategy is available yet */}
          {azureEnabled !== null &&
            !azureEnabled &&
            !localEnabled &&
            !mockEnabled && (
              <p className="text-center text-sm text-slate-500">
                No login method is configured. Contact your administrator.
              </p>
            )}

          {successMessage && view === 'email-entry' && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {error && view === 'email-entry' && !showEmailForm && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="relative mt-4 border-t pt-6 text-center">
            {/* ChevronDown toggle — only shown when Azure is primary and local is available */}
            {azureEnabled === true && localEnabled && showMicrosoftPrimary && (
              <button
                type="button"
                onClick={() => setShowLocalForm(true)}
                aria-label="Sign in with a local account"
                title="Sign in with email and password"
                className="absolute -top-2.5 right-0 bg-white px-1 text-slate-400 transition-colors hover:text-slate-700"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
            <p className="text-xs text-slate-400">
              BC Government Corporate Calendar
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Contact your administrator for login credentials
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
