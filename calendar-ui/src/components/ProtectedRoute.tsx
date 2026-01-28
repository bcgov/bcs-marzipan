/**
 * Protected Route Component
 * Guards routes that require authentication and optionally specific permissions/roles
 */
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Optional permission required to access this route */
  requiredPermission?: string;
  /** Optional role name required to access this route */
  requiredRole?: string;
}

/**
 * Wraps routes that require authentication.
 * Redirects to login if not authenticated.
 * Optionally checks for specific permission or role.
 *
 * @example
 * <Route path="/admin" element={
 *   <ProtectedRoute requiredPermission={PERMISSIONS.USERS.VIEW}>
 *     <AdminPage />
 *   </ProtectedRoute>
 * } />
 */
export function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigateHome = (): void => {
    void navigate('/');
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login with return URL
  if (!isAuthenticated) {
    // Store current location for post-login redirect
    sessionStorage.setItem('returnTo', location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  // Check required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="p-8 text-center">
          <h1 className="mb-4 text-2xl font-bold text-slate-800">
            You are not authorized to view the page
          </h1>
          <p className="mb-6 text-slate-600">
            You don&apos;t have permission to access this page.
          </p>
          <Button
            onClick={handleNavigateHome}
            variant="default"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Return to home page
          </Button>
        </div>
      </div>
    );
  }

  // Check required role
  if (requiredRole && user?.roleName !== requiredRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="p-8 text-center">
          <h1 className="mb-4 text-2xl font-bold text-slate-800">
            You are not authorized to view the page
          </h1>
          <p className="mb-6 text-slate-600">
            This page requires the &quot;{requiredRole}&quot; role.
          </p>
          <Button
            onClick={handleNavigateHome}
            variant="default"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Return to home page
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
