import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';

import { CalendarEntriesList } from './pages/CalendarEntriesList';
import { EntryDetails } from './pages/EntryDetails';
import { Dashboard } from './pages/Dashboard';
import './styles/App.css';
import PitchSubmissionsPage from './pages/PitchSubmissions';
import DraftsPage from './pages/Drafts';
import { CreateActivityForm } from './pages/CreateActivityForm';

function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<CalendarEntriesList />} />
          <Route path="/drafts" element={<DraftsPage />} />
          {/* <Route path="/calendar" element={<CalendarCardView />} /> Card view, need to be removed. Maybe kept for mobile view */}
          <Route path="/pitch" element={<PitchSubmissionsPage />} />
          <Route path="/create-activity" element={<CreateActivityForm />} />
          {/* merge with Wizard */}

          <Route path="/details" element={<EntryDetails />} />
          {/* Add more routes here */}
        </Route>
      </Routes>
    </FluentProvider>
  );
}

export default App;
