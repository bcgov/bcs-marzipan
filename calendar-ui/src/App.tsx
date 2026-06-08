import { Route, Routes } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import type { LoginModalSettings } from '@corpcal/shared/api/types';
import {
  GlobalErrorBoundary,
  Layout,
  LoginModal,
  ProtectedRoute,
} from '@/components/layout';

import { fetchActiveLoginModal } from './api/loginModalApi';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { lazyWithRetry } from './lib/lazy-with-retry';

import './styles/App.css';

// Route-based code splitting: each page is loaded only when its route is visited.
// lazyWithRetry adds a single retry on chunk-load failure (stale deploys).
const ActivityListPage = lazyWithRetry(() =>
  import('./pages/ActivityListPage').then((m) => ({
    default: m.ActivityListPage,
  }))
);
const Dashboard = lazyWithRetry(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const CreateActivityForm = lazyWithRetry(() =>
  import('./pages/CreateActivityForm').then((m) => ({
    default: m.CreateActivityForm,
  }))
);
const ActivityLayout = lazyWithRetry(() =>
  import('./pages/ActivityLayout').then((m) => ({
    default: m.ActivityLayout,
  }))
);
const Login = lazyWithRetry(() =>
  import('./pages/Login').then((m) => ({ default: m.Login }))
);
const ReportsPage = lazyWithRetry(() =>
  import('./pages/ReportsPage').then((m) => ({
    default: m.ReportsPage,
  }))
);
const GlobalHistory = lazyWithRetry(() =>
  import('./pages/GlobalHistory').then((m) => ({
    default: m.GlobalHistory,
  }))
);
const NotFound = lazyWithRetry(() =>
  import('./pages/NotFound').then((m) => ({ default: m.NotFound }))
);
const Settings = lazyWithRetry(() =>
  import('./pages/Settings').then((m) => ({ default: m.Settings }))
);
const Users = lazyWithRetry(() =>
  import('./pages/UserManagement').then((m) => ({ default: m.Users }))
);
const TeamDetails = lazyWithRetry(() =>
  import('./pages/TeamDetails').then((m) => ({ default: m.TeamDetails }))
);

function LoginModalContainer() {
  const { isAuthenticated, isLoading, pendingLoginModal, dismissLoginModal } =
    useAuth();
  const [modal, setModal] = useState<LoginModalSettings | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !pendingLoginModal) return;
    fetchActiveLoginModal()
      .then((data) => {
        if (data) {
          setModal(data);
          setOpen(true);
        } else {
          dismissLoginModal();
        }
      })
      .catch(() => {
        dismissLoginModal();
      });
  }, [isLoading, isAuthenticated, pendingLoginModal, dismissLoginModal]);

  const handleDismiss = () => {
    setOpen(false);
    dismissLoginModal();
  };

  if (!modal) return null;
  return <LoginModal modal={modal} open={open} onDismiss={handleDismiss} />;
}

function App() {
  return (
    <div data-testid="app-shell">
      <AuthProvider>
        <LoginModalContainer />
        <GlobalErrorBoundary>
          <Toaster position="top-right" />
          <Suspense
            fallback={
              <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center">
                Loading…
              </div>
            }
          >
            <Routes>
              {/* Public route - Login */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes - require authentication */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ActivityListPage />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route
                  path="create-activity"
                  element={
                    <ProtectedRoute
                      requiredPermission={PERMISSIONS.ACTIVITIES.CREATE}
                    >
                      <CreateActivityForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="activity/:id"
                  element={
                    <ProtectedRoute
                      requiredPermission={PERMISSIONS.ACTIVITIES.VIEW}
                    >
                      <ActivityLayout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute
                      requiredPermission={PERMISSIONS.SETTINGS.VIEW}
                    >
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.USERS.VIEW}>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="teams/:id"
                  element={
                    <ProtectedRoute requiredPermission={PERMISSIONS.TEAMS.VIEW}>
                      <TeamDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <ProtectedRoute
                      requiredPermission={PERMISSIONS.REPORTS.VIEW}
                    >
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="global-history" element={<GlobalHistory />} />
              </Route>

              {/* Catch-all: unknown paths (authed -> return home, unauthed -> return to login) */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </GlobalErrorBoundary>
      </AuthProvider>
    </div>
  );
}

export default App;
