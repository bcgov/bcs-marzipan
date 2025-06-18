import React from 'react';
// import { MediaContactsPage } from './components/MediaContactsPage';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { Routes, Route } from "react-router-dom";
import { OverviewPage } from "./pages/OverviewPage";
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/overview" element={<OverviewPage />} />
    </Routes>
    </FluentProvider>
  );
}

export default App;



