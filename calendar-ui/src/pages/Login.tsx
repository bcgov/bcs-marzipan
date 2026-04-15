/**
 * Login Page
 * Supports local username/password login and optional Azure AD sign-in.
 */
import { Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, type SubmitEvent } from 'react';

import { getAzureConfig, startAzureLogin } from '../api/authApi';
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

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAzureLoading, setIsAzureLoading] = useState(false);
  const [azureEnabled, setAzureEnabled] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

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
      } else {
        setError('Microsoft sign-in failed. Please try again.');
      }

      // Keep the URL clean after surfacing the error.
      window.history.replaceState({}, '', '/login');
    }

    void getAzureConfig()
      .then((result) => {
        setAzureEnabled(result.enabled === true);
      })
      .catch(() => {
        setAzureEnabled(false);
      })
      .finally(() => {
        setConfigLoaded(true);
      });
  }, []);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    login(username.trim(), password)
      .then(() => {
        // Redirect to originally requested URL or dashboard
        const returnTo = sessionStorage.getItem('returnTo') || '/';
        sessionStorage.removeItem('returnTo');
        void navigate(returnTo, { replace: true });
      })
      .catch((err: unknown) => {
        setError(getFriendlyErrorMessage(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleAzureLogin = () => {
    setIsAzureLoading(true);
    startAzureLogin();
  };

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
                Corporate Calendar
              </CardTitle>
              <CardDescription className="mt-2 text-slate-500">
                Sign in to access the calendar management system
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {configLoaded && !azureEnabled && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-slate-700"
                  >
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11 pl-10"
                      autoComplete="username"
                      autoFocus
                      disabled={isLoading}
                      required
                    />
                  </div>
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
                      placeholder="Enter your password (optional for dev)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10 pl-10"
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    In development mode, password is optional
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {configLoaded && !azureEnabled && (
              <Button
                type="submit"
                className="h-11 w-full font-medium"
                disabled={isLoading || !username.trim()}
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
            )}

            {configLoaded && azureEnabled && (
              <Button
                type="button"
                variant="outline"
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
                  'Sign in with Microsoft'
                )}
              </Button>
            )}
          </form>

          <div className="mt-8 border-t pt-6 text-center">
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
