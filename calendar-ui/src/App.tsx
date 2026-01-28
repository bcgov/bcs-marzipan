import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { Toaster } from './components/ui/sonner';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { PERMISSIONS } from '@corpcal/shared';

import { CalendarEntriesList } from './pages/CalendarEntriesList';
import { Dashboard } from './pages/Dashboard';
import './styles/App.css';
import DraftsPage from './pages/Drafts';
import { CreateActivityForm } from './pages/CreateActivityForm';
import EditActivityForm from './pages/EditActivityForm';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { LookAheadReport } from './pages/LookAheadReport';

function App() {
  return (
    <AuthProvider>
      <FluentProvider theme={webLightTheme}>
        <GlobalErrorBoundary>
          <Toaster position="top-end" />
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
                  <ProtectedRoute
                    requiredPermission={PERMISSIONS.REPORTS.VIEW}
                  >
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
