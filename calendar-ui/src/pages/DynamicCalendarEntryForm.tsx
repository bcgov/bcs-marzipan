import * as React from 'react';
import { calendarWizardSchema } from '../schemas/calendarWizard.schema';
import { createActivity } from '../api/activitiesApi';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import Wizard from '../components/DynamicWizard/Wizard';

const makeStyles = () => ({
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '1rem',
  },
});

export const DynamicCalendarEntryForm: React.FC = () => {
  const styles = makeStyles();

  // This is the function that will send the data to your API
  const handleSubmit = async (formValues: Record<string, any>) => {
    try {
      // Convert form values to CreateActivityRequest format
      // The wizard schema should already provide the correct structure
      await createActivity(formValues as CreateActivityRequest); // Call your API function
      // Optionally show a success message or redirect
      alert('Activity saved!');
    } catch (err) {
      // Optionally show an error message
      alert('Failed to save activity.');
      console.error(err);
    }
  };

  return (
    <FluentProvider theme={webLightTheme}>
      <div style={styles.container}>
        <Wizard
          title="New Activity"
          entryId="HLTH-000001"
          schema={calendarWizardSchema}
          initialValues={{
            // 👇 pre-fill dummy values for testing
            details: {
              title: 'Test Event',
              summary: 'Testing dynamic wizard form',
            },
            schedule: {
              startDate: new Date().toISOString().split('T')[0], // today
              startTime: '09:00',
              endDate: new Date().toISOString().split('T')[0],
              endTime: '10:00',
            },
            events: {
              topic: 'Press Briefing',
              tags: ['Policy', 'Health'],
            },
            comms: {
              channels: ['Email'],
            },
            sharing: {
              sharedWith: ['HR', 'Finance'],
            },
          }}
          onSubmit={handleSubmit}
        />
      </div>
    </FluentProvider>
  );
};
