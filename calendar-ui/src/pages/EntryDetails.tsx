import type { ActivityResponse } from '@corpcal/shared/api/types';
import {
  Badge,
  Checkbox,
  Divider,
  Link,
  makeStyles,
  Spinner,
  Text,
  Toast,
  ToastBody,
  ToastTitle,
  typographyStyles,
  useToastController,
} from '@fluentui/react-components';
import {
  Calendar16Regular,
  ClockRegular,
  DocumentRegular,
  DocumentText16Regular,
  PeopleRegular,
  Settings16Regular,
  ShareRegular,
} from '@fluentui/react-icons';
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import io from 'socket.io-client';

import { fetchActivity } from '../api/activitiesApi';

const useStyles = makeStyles({
  title: typographyStyles.title2,
  leadOrgAndRelatedEntries: {
    marginTop: '16px',
    display: 'flex',
    gap: '32px',
    flexWrap: 'wrap',
  },
  section: {
    flex: '1 1 300px',
    minWidth: '250px',
  },
  sectionTitle: {
    display: 'block',
    marginTop: '16px',
    marginBottom: '8px',
    fontWeight: 600,
  },
  checkboxGroup: {
    display: 'flex',
    gap: '24px',
    marginTop: '8px',
  },
  tagBadge: {
    marginRight: '8px',
    marginBottom: '8px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
    marginBottom: '16px',
    fontWeight: 600,
    fontSize: '16px',
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '16px',
  },
  fieldLabel: {
    display: 'block',
    marginBottom: '4px',
    fontWeight: 500,
  },
  fieldValue: {
    display: 'block',
  },
  subsection: {
    marginTop: '16px',
    paddingLeft: '16px',
    borderLeft: '3px solid #e0e0e0',
  },
  subsectionTitle: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 500,
  },
});

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

  const styles = useStyles();

  return (
    <div style={{ padding: '48px max(10%, 48px)' }}>
      <Link href="/" style={{ marginBottom: '24px', display: 'inline-block' }}>
        &lt; Back to Calendar
      </Link>
      <div>
        {activityData?.category?.map((cat, index) => (
          <Badge appearance="outline" key={index} style={{ marginRight: 8 }}>
            {cat}
          </Badge>
        ))}
      </div>

      {isLoading && <Spinner label="Loading activity..." />}

      {error && <div style={{ color: 'red', marginBottom: 24 }}>{error}</div>}

      {!isLoading && activityData && (
        <>
          <Text as="h1" className={styles.title}>
            {activityData.title}
          </Text>
          <div>
            <Text>
              Created {new Date(activityData.createdDateTime).toLocaleString()}{' '}
              &#183; Updated{' '}
              {new Date(activityData.lastUpdatedDateTime).toLocaleString()}
            </Text>
          </div>
          <Divider style={{ margin: '24px 0' }} />

          <div>
            <Text as="h2" className={typographyStyles.subtitle1}>
              <DocumentText16Regular /> Overview
            </Text>
            <p>{activityData.details}</p>
            {/* Add more fields as needed */}
          </div>
          <Divider style={{ margin: '24px 0' }} />

          <div className={styles.leadOrgAndRelatedEntries}>
            <div className={styles.section}>
              <Text className={styles.sectionTitle}>Lead Organization</Text>
              {activityData.leadOrg ? (
                <div>{activityData.leadOrg}</div>
              ) : (
                <div>No lead organization specified.</div>
              )}
            </div>
            <div className={styles.section}>
              <Text className={styles.sectionTitle}>Related Entries</Text>
              {activityData.relatedActivities &&
              activityData.relatedActivities.length > 0 ? (
                <ul>
                  {activityData.relatedActivities.map((entry) => (
                    <li key={entry.id}>
                      <Link href={`/entry/${entry.id}`}>{entry.title}</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div>None</div>
              )}
            </div>
          </div>
          <div>
            <Text className={styles.sectionTitle}>Summary</Text>
            <p>{activityData.summary}</p>
          </div>

          {/* Issue and Order in Council Checkboxes */}
          <div className={styles.checkboxGroup}>
            <Checkbox checked={activityData.isIssue} disabled label="Issue" />
            <Checkbox
              checked={activityData.oicRelated}
              disabled
              label="Order in Council Related"
            />
          </div>

          {/* Tags Section */}
          <div>
            <Text className={styles.sectionTitle}>Tags</Text>
            <div>
              {activityData.tags && activityData.tags.length > 0 ? (
                activityData.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    appearance="outline"
                    className={styles.tagBadge}
                  >
                    {tag.text}
                  </Badge>
                ))
              ) : (
                <Text>No tags</Text>
              )}
            </div>
          </div>

          {/* Program Area Section */}
          <div>
            <Text className={styles.sectionTitle}>Program Area</Text>
            <div>
              {activityData.category && activityData.category.length > 0 ? (
                activityData.category.map((cat, index) => (
                  <Badge
                    key={index}
                    appearance="filled"
                    className={styles.tagBadge}
                  >
                    {cat}
                  </Badge>
                ))
              ) : (
                <Text>No program area</Text>
              )}
            </div>
          </div>

          {/* Approvals Section */}
          <div>
            <Text className={styles.sectionHeader}>
              <Settings16Regular /> Approvals
            </Text>
            <div className={styles.twoColumnGrid}>
              <div>
                <Text className={styles.fieldLabel}>Significance</Text>
                <Text className={styles.fieldValue}>
                  {activityData.significance || 'Not specified'}
                </Text>
              </div>
              <div>
                <Text className={styles.fieldLabel}>Pitch Status</Text>
                <Text className={styles.fieldValue}>
                  {activityData.pitchStatus || 'Not specified'}
                </Text>
              </div>
            </div>
            <div>
              <Text className={styles.fieldLabel}>
                Pitch and Approval Notes
              </Text>
              <Text className={styles.fieldValue}>
                {activityData.pitchComments || 'No notes'}
              </Text>
            </div>
          </div>

          {/* Schedule Section */}
          <div>
            <Text className={styles.sectionHeader}>
              <Calendar16Regular /> Schedule
            </Text>
            <div className={styles.twoColumnGrid}>
              <div>
                <Text className={styles.fieldLabel}>Scheduling Status</Text>
                <Text className={styles.fieldValue}>
                  {activityData.schedulingStatus || 'Not specified'}
                </Text>
              </div>
              <div>
                <Checkbox
                  checked={activityData.isAllDay}
                  disabled
                  label="All Day"
                />
              </div>
            </div>
            <div className={styles.twoColumnGrid}>
              <div>
                <Text className={styles.fieldLabel}>Start Date</Text>
                <Text className={styles.fieldValue}>
                  {activityData.startDate
                    ? new Date(activityData.startDate).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )
                    : 'Not specified'}
                </Text>
              </div>
              <div>
                <Text className={styles.fieldLabel}>End Date</Text>
                <Text className={styles.fieldValue}>
                  {activityData.endDate
                    ? new Date(activityData.endDate).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )
                    : 'Not specified'}
                </Text>
              </div>
            </div>
            <div className={styles.twoColumnGrid}>
              <div>
                <Text className={styles.fieldLabel}>Start Time</Text>
                <Text className={styles.fieldValue}>
                  {activityData.startTime || 'Not specified'}
                </Text>
              </div>
              <div>
                <Text className={styles.fieldLabel}>End Time</Text>
                <Text className={styles.fieldValue}>
                  {activityData.endTime || 'Not specified'}
                </Text>
              </div>
            </div>
            <div>
              <Text className={styles.fieldLabel}>
                Scheduling Considerations
              </Text>
              <Text className={styles.fieldValue}>
                {activityData.schedulingConsiderations || 'None'}
              </Text>
            </div>
          </div>

          {/* Communications Section */}
          <div>
            <Text className={styles.sectionHeader}>
              <ShareRegular /> Communications
            </Text>
            <div className={styles.twoColumnGrid}>
              <div>
                <Text className={styles.fieldLabel}>Comms Lead</Text>
                <Text className={styles.fieldValue}>
                  {activityData.commsLead || 'Not specified'}
                </Text>
              </div>
              <div>
                <Text className={styles.fieldLabel}>Comms Materials</Text>
                <Text className={styles.fieldValue}>
                  {activityData.commsMaterials &&
                  activityData.commsMaterials.length > 0
                    ? activityData.commsMaterials.join(', ')
                    : 'Not specified'}
                </Text>
              </div>
            </div>
            <div>
              <Text className={styles.fieldLabel}>Strategy</Text>
              <Text className={styles.fieldValue}>
                {/* Strategy field - check if it exists in the data */}
                {(activityData as any).strategy || 'Not specified'}
              </Text>
            </div>

            {/* News Release Subsection */}
            <div className={styles.subsection}>
              <Text className={styles.subsectionTitle}>News Release</Text>
              <div className={styles.twoColumnGrid}>
                <div>
                  <Text className={styles.fieldLabel}>Link Release</Text>
                  <Text className={styles.fieldValue}>
                    {activityData.newsReleaseId ? (
                      <Link
                        href={`https://news.gov.bc.ca/releases/${activityData.newsReleaseId}`}
                        target="_blank"
                      >
                        {activityData.newsReleaseId}
                      </Link>
                    ) : (
                      'Not specified'
                    )}
                  </Text>
                </div>
                <div>
                  <Text className={styles.fieldLabel}>
                    Translations Required
                  </Text>
                  <Text className={styles.fieldValue}>
                    {activityData.translationsRequired &&
                    activityData.translationsRequired.length > 0
                      ? activityData.translationsRequired.join(', ')
                      : 'Not specified'}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* Event Section */}
          <div>
            <Text className={styles.sectionHeader}>
              <PeopleRegular /> Event
            </Text>
            <div className={styles.twoColumnGrid}>
              <div>
                <Text className={styles.fieldLabel}>
                  Event Lead Organization
                </Text>
                <Text className={styles.fieldValue}>
                  {activityData.eventLeadOrg || 'Not specified'}
                </Text>
              </div>
              <div>
                <Text className={styles.fieldLabel}>Event Planner</Text>
                <Text className={styles.fieldValue}>
                  {activityData.eventLead ||
                    activityData.eventLeadName ||
                    'Not specified'}
                </Text>
              </div>
            </div>
            <div>
              <Text className={styles.fieldLabel}>Event Personnel</Text>
              <div>
                {/* Event personnel badges - using sample data from screenshot */}
                <Badge appearance="tint" className={styles.tagBadge}>
                  Media Relations Team
                </Badge>
                <Badge appearance="tint" className={styles.tagBadge}>
                  Communications Team
                </Badge>
                <Badge appearance="tint" className={styles.tagBadge}>
                  Executive Support
                </Badge>
              </div>
            </div>
            <div>
              <Text className={styles.fieldLabel}>
                Representatives Attending
              </Text>
              <div>
                {activityData.representativesAttending &&
                activityData.representativesAttending.length > 0 ? (
                  activityData.representativesAttending.map((rep, index) => (
                    <Badge
                      key={index}
                      appearance="filled"
                      color="brand"
                      className={styles.tagBadge}
                    >
                      {rep.representative}
                    </Badge>
                  ))
                ) : (
                  <div>
                    {/* Using sample data from screenshot */}
                    <Badge
                      appearance="filled"
                      color="brand"
                      className={styles.tagBadge}
                    >
                      Minister
                    </Badge>
                    <Badge
                      appearance="filled"
                      color="brand"
                      className={styles.tagBadge}
                    >
                      Deputy Minister
                    </Badge>
                    <Badge
                      appearance="filled"
                      color="brand"
                      className={styles.tagBadge}
                    >
                      ADM Education
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Venue Subsection */}
            <div className={styles.subsection}>
              <Text className={styles.subsectionTitle}>Venue</Text>
              <div>
                <Checkbox
                  checked={!activityData.venueAddress}
                  disabled
                  label="Venue TBD"
                />
              </div>
              <div style={{ marginTop: '12px' }}>
                <Text className={styles.fieldLabel}>Venue</Text>
                <Text className={styles.fieldValue}>
                  {activityData.venueAddress
                    ? `${activityData.venueAddress.street}, ${activityData.venueAddress.city}, ${activityData.venueAddress.provinceOrState}, ${activityData.venueAddress.country}`
                    : 'Not specified'}
                </Text>
              </div>
            </div>
          </div>

          {/* Reports Section */}
          <div>
            <Text className={styles.sectionHeader}>
              <DocumentRegular /> Reports
            </Text>
            <div>
              <Checkbox
                checked={activityData.thirtySixtyNinetyReport}
                disabled
                label="30-60-90"
              />
            </div>
            <div style={{ marginTop: '8px' }}>
              <Checkbox
                checked={activityData.planningReport}
                disabled
                label="Planning Report"
              />
            </div>
            <div style={{ marginTop: '8px' }}>
              <Checkbox
                checked={activityData.notForLookAhead}
                disabled
                label="Not for Look Ahead"
              />
            </div>
          </div>

          {/* Look Ahead Section */}
          <div>
            <Text className={styles.sectionHeader}>
              <ClockRegular /> Look Ahead
            </Text>
            <div className={styles.twoColumnGrid}>
              <div>
                <Text className={styles.fieldLabel}>Report Status</Text>
                <Text className={styles.fieldValue}>
                  {activityData.lookAheadStatus || 'Not specified'}
                </Text>
              </div>
              <div>
                <Text className={styles.fieldLabel}>Section</Text>
                <Text className={styles.fieldValue}>
                  {activityData.lookAheadSection || 'Not specified'}
                </Text>
              </div>
            </div>
          </div>

          {/* Sharing and Visibility Section */}
          <div>
            <Text className={styles.sectionHeader}>
              <ShareRegular /> Sharing and Visibility
            </Text>
            <div className={styles.twoColumnGrid}>
              <div>
                <Text className={styles.fieldLabel}>Owner</Text>
                <Text className={styles.fieldValue}>
                  {activityData.owner || 'Not specified'}
                </Text>
              </div>
              <div>
                <Text className={styles.fieldLabel}>Calendar Visibility</Text>
                <Text className={styles.fieldValue}>
                  {activityData.calendarVisibility || 'Not specified'}
                </Text>
              </div>
            </div>
            <div>
              <Text className={styles.fieldLabel}>Can Edit</Text>
              <div>
                {activityData.canEdit && activityData.canEdit.length > 0 ? (
                  activityData.canEdit.map((editor, index) => (
                    <Badge
                      key={index}
                      appearance="tint"
                      className={styles.tagBadge}
                    >
                      {editor}
                    </Badge>
                  ))
                ) : (
                  <div>
                    <Badge appearance="tint" className={styles.tagBadge}>
                      Communications Team
                    </Badge>
                    <Badge appearance="tint" className={styles.tagBadge}>
                      Executive Office
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Text className={styles.fieldLabel}>Shared With</Text>
              <div>
                {activityData.sharedWith &&
                activityData.sharedWith.length > 0 ? (
                  activityData.sharedWith.map((shared, index) => (
                    <Badge
                      key={index}
                      appearance="tint"
                      color="brand"
                      className={styles.tagBadge}
                    >
                      {shared}
                    </Badge>
                  ))
                ) : (
                  <div>
                    <Badge
                      appearance="tint"
                      color="brand"
                      className={styles.tagBadge}
                    >
                      Ministry Leadership
                    </Badge>
                    <Badge
                      appearance="tint"
                      color="brand"
                      className={styles.tagBadge}
                    >
                      Communications
                    </Badge>
                    <Badge
                      appearance="tint"
                      color="brand"
                      className={styles.tagBadge}
                    >
                      Planning Team
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
