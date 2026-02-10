import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { Route, Routes } from 'react-router-dom';

import { PERMISSIONS } from '@corpcal/shared';

import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { CalendarEntriesList } from './pages/CalendarEntriesList';
import { Dashboard } from './pages/Dashboard';

import './styles/App.css';

import { CreateActivityForm } from './pages/CreateActivityForm';
import DraftsPage from './pages/Drafts';
import EditActivityForm from './pages/EditActivityForm';
import { Login } from './pages/Login';
import { LookAheadReport } from './pages/LookAheadReport';
import { NotFound } from './pages/NotFound';
import { Settings } from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <FluentProvider theme={webLightTheme}>
        <GlobalErrorBoundary>
          <Toaster position="top-right" />
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
              <Route index element={<CalendarEntriesList />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="drafts" element={<DraftsPage />} />
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
                path="activities/:id/edit"
                element={
                  <ProtectedRoute
                    requiredPermission={PERMISSIONS.ACTIVITIES.EDIT}
                  >
                    <EditActivityForm />
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
                path="reports/look-ahead"
                element={
                  <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS.VIEW}>
                    <LookAheadReport />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all: unknown paths (authed -> return home, unauthed -> return to login) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </GlobalErrorBoundary>
      </FluentProvider>
    </AuthProvider>
  );
}

export default App;
