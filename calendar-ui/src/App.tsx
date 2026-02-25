import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { Route, Routes } from 'react-router-dom';
import { Suspense } from 'react';

import { PERMISSIONS } from '@corpcal/shared';

import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
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
const ActivityViewPage = lazyWithRetry(() =>
  import('./pages/ActivityViewPage').then((m) => ({
    default: m.ActivityViewPage,
  }))
);
const ActivityEditPage = lazyWithRetry(() =>
  import('./pages/ActivityEditPage').then((m) => ({
    default: m.ActivityEditPage,
  }))
);
const Login = lazyWithRetry(() =>
  import('./pages/Login').then((m) => ({ default: m.Login }))
);
const LookAheadReport = lazyWithRetry(() =>
  import('./pages/LookAheadReport').then((m) => ({
    default: m.LookAheadReport,
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

function App() {
  return (
    <AuthProvider>
      <FluentProvider theme={webLightTheme}>
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
                >
                  <Route index element={<ActivityViewPage />} />
                  <Route
                    path="edit"
                    element={
                      <ProtectedRoute
                        requiredPermission={PERMISSIONS.ACTIVITIES.EDIT}
                      >
                        <ActivityEditPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>
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
                  path="reports/look-ahead"
                  element={
                    <ProtectedRoute
                      requiredPermission={PERMISSIONS.REPORTS.VIEW}
                    >
                      <LookAheadReport />
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
      </FluentProvider>
    </AuthProvider>
  );
}

export default App;
