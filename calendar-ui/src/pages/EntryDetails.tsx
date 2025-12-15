import React, { useEffect, useState } from 'react';
import {
  TabList,
  Tab,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  Link,
  Spinner,
} from '@fluentui/react-components';
import { useLocation, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { fetchActivity } from '../api/activitiesApi';
import type { ActivityResponse } from '@corpcal/shared/api/types';

export const EntryDetails = () => {
  const location = useLocation();
  const initialData = location.state;

  const [activityData, setActivityData] = useState<ActivityResponse | null>(
    initialData || null
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Extract numeric ID from displayId format (e.g., "ACT-6" -> 6) or use numeric id directly
  const numericId = activityData
    ? typeof activityData.id === 'number'
      ? activityData.id
      : typeof activityData.id === 'string' && activityData.id
        ? parseInt((activityData.id as string).replace(/\D/g, ''), 10)
        : null
    : null;

  console.log('Numeric ID for WebSocket:', numericId);

  // Fetch activity data from server
  const refreshActivityData = async () => {
    if (!numericId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchActivity(numericId);
      setActivityData(data);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
      setError('Failed to load activity data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load activity data on mount - always fetch fresh data
  useEffect(() => {
    if (numericId) {
      void refreshActivityData();
    }
  }, []);

  const [selectedTab, setSelectedTab] = useState('overview');

  // Update notifications stuff
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestData, setLatestData] = useState<any>(null);
  const { dispatchToast } = useToastController();

  useEffect(() => {
    // Connect to the WebSocket server
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    console.log('Connecting to WebSocket at:', apiUrl);
    const socket = io(apiUrl);

    socket.on('connect', () => {
      console.log('WebSocket connected!', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // If we have an activity ID, notify the server we're viewing this activity
    if (numericId) {
      console.log('Emitting viewActivity for numeric ID:', numericId);
      socket.emit('viewActivity', numericId);
    }

    // Listen for data updates from the server
    socket.on('dataUpdated', (data) => {
      console.log('Received update:', data);
      console.log(
        'Comparing activityId:',
        data.activityId,
        'with numericId:',
        numericId
      );
      console.log('Type of data.activityId:', typeof data.activityId);
      console.log('Type of numericId:', typeof numericId);

      // Only show toast if this update is for the activity we're viewing
      if (data.activityId === numericId) {
        console.log('IDs match! Showing toast...');
        setLatestData(data);
        setHasUpdate(true);

        dispatchToast(
          <Toast>
            <ToastTitle>Activity Updated!</ToastTitle>
            <ToastBody>
              This activity has been modified by another user.{' '}
              <Link
                onClick={() => {
                  setHasUpdate(false);
                  void refreshActivityData();
                }}
              >
                Click to refresh
              </Link>
            </ToastBody>
          </Toast>,
          { intent: 'info', timeout: 5000 }
        );
      }
    });

    // Cleanup on component unmount
    return () => {
      if (numericId) {
        socket.emit('leaveActivity', numericId);
      }
      socket.off('dataUpdated');
      socket.disconnect();
    };
  }, [numericId, dispatchToast]);

  return (
    <div style={{ padding: '48px max(10%, 48px)' }}>
      <h2>Entry Details</h2>

      {isLoading && <Spinner label="Loading activity..." />}

      {error && <div style={{ color: 'red', marginBottom: 24 }}>{error}</div>}

      {!isLoading && activityData && (
        <>
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
                value={activityData.title || ''}
                readOnly
                style={{ width: '100%', minHeight: '40px', resize: 'none' }}
              />
            </section>
          )}

          {selectedTab === 'description' && (
            <section style={{ marginBottom: '24px' }}>
              <h3>Description</h3>
              <textarea
                value={activityData.summary || ''}
                readOnly
                style={{ width: '100%', minHeight: '80px', resize: 'none' }}
              />
            </section>
          )}

          {selectedTab === 'tags' && (
            <section style={{ marginBottom: '24px' }}>
              <h3>Tags</h3>
              <textarea
                value={
                  activityData.tags
                    ?.map((t) => t.text)
                    .filter(Boolean)
                    .join(', ') || ''
                }
                readOnly
                style={{ width: '100%', minHeight: '40px', resize: 'none' }}
              />
            </section>
          )}
          {/* Add more panels for additional sections */}
        </>
      )}
    </div>
  );
};
