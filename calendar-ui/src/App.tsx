import {
  FluentProvider,
  webLightTheme,
  Toaster,
} from '@fluentui/react-components';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { CalendarEntriesList } from './pages/CalendarEntriesList';
import { EntryDetails } from './pages/EntryDetails';
import { Dashboard } from './pages/Dashboard';
import './styles/App.css';
import DraftsPage from './pages/Drafts';
import { CreateActivityForm } from './pages/CreateActivityForm';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <FluentProvider theme={webLightTheme}>
        <Toaster position="top-end" />
        <Routes>
          {/* Public route - Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes - require authentication */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<CalendarEntriesList />} />
            <Route path="/drafts" element={<DraftsPage />} />
            {/* <Route path="/calendar" element={<CalendarCardView />} /> Card view, need to be removed. Maybe kept for mobile view */}
            {/* <Route path="/pitch" element={<PitchSubmissionsPage />} /> */}
            <Route path="/create-activity" element={<CreateActivityForm />} />
            {/* merge with Wizard */}

            <Route path="/details" element={<EntryDetails />} />
            {/* Add more routes here */}
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </FluentProvider>
    </AuthProvider>
  );
}

export default App;
