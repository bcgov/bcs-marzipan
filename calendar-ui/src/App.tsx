import {
  FluentProvider,
  webLightTheme,
  Toaster,
} from '@fluentui/react-components';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';

import { CalendarEntriesList } from './pages/CalendarEntriesList';
import { EntryDetails } from './pages/EntryDetails';
import { Dashboard } from './pages/Dashboard';
import './styles/App.css';
import DraftsPage from './pages/Drafts';
import { CreateActivityForm } from './pages/CreateActivityForm';
import { Administration } from './pages/Administration';
import { Categories } from './pages/dataAdmin/Categories';
import { Cities } from './pages/dataAdmin/Cities';
import { CommunicationMaterials } from './pages/dataAdmin/CommunicationMaterials';
import { GovernmentRepresentatives } from './pages/dataAdmin/GovernmentRepresentatives';
import { HQTags } from './pages/dataAdmin/HQTags';
import { Ministries } from './pages/dataAdmin/Ministries';
import { NewsSubscribe } from './pages/dataAdmin/NewsSubscribe';
import { NRDistributions } from './pages/dataAdmin/NRDistributions';
import { NROrigins } from './pages/dataAdmin/NROrigins';
import { PremierRequested } from './pages/dataAdmin/PremierRequested';
import { Roles } from './pages/dataAdmin/Roles';
import { Status } from './pages/dataAdmin/Status';
import { SystemUsers } from './pages/dataAdmin/SystemUsers';
import { Themes } from './pages/dataAdmin/Themes';
import { UserAdmin } from './pages/dataAdmin/userAdmin';
import { TransferActivities } from './pages/dataAdmin/transferActivities';

function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <Toaster position="top-end" />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<CalendarEntriesList />} />
          <Route path="/drafts" element={<DraftsPage />} />
          {/* <Route path="/calendar" element={<CalendarCardView />} /> Card view, need to be removed. Maybe kept for mobile view */}
          {/* <Route path="/pitch" element={<PitchSubmissionsPage />} /> */}
          <Route path="/create-activity" element={<CreateActivityForm />} />
          {/* merge with Wizard */}

          <Route path="/details" element={<EntryDetails />} />
          {/* Add more routes here */}
          <Route path="/administration" element={<Administration />} />
          <Route path="/manage-users" element={<UserAdmin />} />
          <Route path="/transfer-activities" element={<TransferActivities />} />
          <Route path="/admin/lookup/categories" element={<Categories />} />
          <Route path="/admin/lookup/cities" element={<Cities />} />
          <Route
            path="/admin/lookup/communication-materials"
            element={<CommunicationMaterials />}
          />
          <Route
            path="/admin/lookup/government-representatives"
            element={<GovernmentRepresentatives />}
          />
          <Route path="/admin/lookup/hq-tags" element={<HQTags />} />
          <Route path="/admin/lookup/ministries" element={<Ministries />} />
          <Route
            path="/admin/lookup/news-subscribe"
            element={<NewsSubscribe />}
          />
          <Route
            path="/admin/lookup/nr-distributions"
            element={<NRDistributions />}
          />
          <Route path="/admin/lookup/nr-origins" element={<NROrigins />} />
          <Route
            path="/admin/lookup/premier-requested"
            element={<PremierRequested />}
          />
          <Route path="/admin/lookup/roles" element={<Roles />} />
          <Route path="/admin/lookup/status" element={<Status />} />
          <Route path="/admin/lookup/system-users" element={<SystemUsers />} />
          <Route path="/admin/lookup/themes" element={<Themes />} />
        </Route>
      </Routes>
    </FluentProvider>
  );
}

export default App;
