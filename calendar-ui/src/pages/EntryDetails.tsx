import React, { useState } from 'react';
import { TabList, Tab } from '@fluentui/react-components';
import { useLocation } from 'react-router-dom';

export const EntryDetails = () => {
  const location = useLocation();
  const formData = location.state || {
    title: '',
    description: '',
    tags: [],
    // ...other fields...
  };

  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div style={{ padding: '48px max(10%, 48px)' }}>
      <h2>Entry Details</h2>
      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => setSelectedTab(data.value as string)}
        style={{ marginBottom: 24 }}
      >
        <Tab value="overview">Overview</Tab>
        <Tab value="description">Description</Tab>
        <Tab value="tags">Tags</Tab>
        {/* Add more tabs as needed */}
      </TabList>

      {selectedTab === 'overview' && (
        <section style={{ marginBottom: '24px' }}>
          <h3>Title</h3>
          <textarea
            value={formData.title}
            readOnly
            style={{ width: '100%', minHeight: '40px', resize: 'none' }}
          />
        </section>
      )}

      {selectedTab === 'description' && (
        <section style={{ marginBottom: '24px' }}>
          <h3>Description</h3>
          <textarea
            value={formData.description}
            readOnly
            style={{ width: '100%', minHeight: '80px', resize: 'none' }}
          />
        </section>
      )}

      {selectedTab === 'tags' && (
        <section style={{ marginBottom: '24px' }}>
          <h3>Tags</h3>
          <textarea
            value={formData.tags ? formData.tags.join(', ') : ''}
            readOnly
            style={{ width: '100%', minHeight: '40px', resize: 'none' }}
          />
        </section>
      )}
      {/* Add more panels for additional sections */}
    </div>
  );
};
