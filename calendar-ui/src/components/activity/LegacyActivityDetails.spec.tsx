import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { LegacyActivityDetails as LegacyActivityDetailsData } from '@/api/legacyActivitiesApi';

import { LegacyActivityDetails } from './LegacyActivityDetails';

const activity: LegacyActivityDetailsData = {
  id: 1,
  displayId: 'LEG-1001',
  title: 'Historical activity',
  summary: null,
  startDate: null,
  endDate: null,
  activityStatusId: 8,
  activityStatus: 'Archived',
  lookAheadStatus: null,
  leadOrgName: null,
  ministryName: null,
  locationName: null,
  commsMaterials: [],
  translations: [],
  commsContactName: null,
  createdDateTime: '2025-01-15T20:00:00.000Z',
  importedAt: '2026-03-20T20:00:00.000Z',
  overview: {
    category: [],
    confidential: null,
    issue: null,
    tags: [],
    significance: null,
  },
  comms: {
    materials: [],
    newsReleaseOrigin: null,
    newsReleaseDistribution: null,
    translations: [],
  },
  event: {
    premierStatus: null,
    governmentRepresentatives: [],
    eventPlanners: [],
    venueCity: null,
  },
};

describe('LegacyActivityDetails', () => {
  it('shows Comms information as read-only text without organization fields', () => {
    render(
      <LegacyActivityDetails
        activity={{
          ...activity,
          leadOrgName: 'Lead organization',
          ministryName: 'Ministry name',
          comms: {
            materials: ['News release', 'Social media'],
            newsReleaseOrigin: 'Ministry',
            newsReleaseDistribution: 'Province-wide',
            translations: ['French', 'Punjabi'],
          },
        }}
      />
    );

    const comms = screen.getByRole('heading', { name: 'Comms' }).parentElement;
    expect(comms).not.toBeNull();
    const section = within(comms!);
    for (const [label, value] of [
      ['Comms Materials', 'News release, Social media'],
      ['News Release Origin', 'Ministry'],
      ['News Release Distribution', 'Province-wide'],
      ['Translations', 'French, Punjabi'],
    ]) {
      expect(section.getByText(label).nextElementSibling).toHaveTextContent(
        value
      );
    }
    expect(section.queryByText('Lead Organization')).not.toBeInTheDocument();
    expect(section.queryByText('Ministry name')).not.toBeInTheDocument();
    expect(section.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('shows placeholders for missing Comms information', () => {
    render(<LegacyActivityDetails activity={activity} />);

    const comms = screen.getByRole('heading', { name: 'Comms' }).parentElement;
    expect(comms).not.toBeNull();
    const section = within(comms!);
    for (const label of [
      'Comms Materials',
      'News Release Origin',
      'News Release Distribution',
      'Translations',
    ]) {
      expect(section.getByText(label).nextElementSibling).toHaveTextContent(
        '-'
      );
    }
  });

  it('shows the executive summary and status in the Look Ahead section', () => {
    render(
      <LegacyActivityDetails
        activity={{
          ...activity,
          lookAheadStatus: 'changed',
          lookAhead: { executiveSummary: 'Historical executive summary' },
        }}
      />
    );

    const section = screen.getByRole('heading', {
      name: 'Look Ahead',
    }).parentElement;
    expect(section).not.toBeNull();
    expect(
      within(section!).getByText('Executive Summary').nextElementSibling
    ).toHaveTextContent('Historical executive summary');
    expect(
      within(section!).getByText('Look Ahead Status').nextElementSibling
    ).toHaveTextContent('changed');
    expect(within(section!).queryAllByRole('textbox')).toHaveLength(0);
  });

  it('shows a placeholder for a missing executive summary when Look Ahead is visible', () => {
    render(
      <LegacyActivityDetails
        activity={{ ...activity, lookAhead: { executiveSummary: null } }}
      />
    );

    expect(
      screen.getByText('Executive Summary').nextElementSibling
    ).toHaveTextContent('-');
  });

  it('hides Look Ahead when the detail response does not grant access', () => {
    render(<LegacyActivityDetails activity={activity} />);

    expect(
      screen.queryByRole('heading', { name: 'Look Ahead' })
    ).not.toBeInTheDocument();
  });

  it('shows the requested Overview fields as read-only text', () => {
    render(
      <LegacyActivityDetails
        activity={{
          ...activity,
          summary: 'A historical summary',
          leadOrgName: 'Lead organization',
          ministryName: 'Ministry name',
          overview: {
            category: ['Announcement', 'Community'],
            confidential: true,
            issue: false,
            tags: ['North Coast', 'Investment'],
            significance: 'Regional significance',
            notes: 'Historical notes',
          },
        }}
      />
    );

    const overview = screen.getByRole('heading', {
      name: 'Overview',
    }).parentElement;
    expect(overview).not.toBeNull();
    const section = within(overview!);
    for (const [label, value] of [
      ['Category', 'Announcement, Community'],
      ['Title', 'Historical activity'],
      ['Confidential', 'Yes'],
      ['Issue', 'No'],
      ['Summary', 'A historical summary'],
      ['Lead Organization', 'Lead organization'],
      ['Ministry', 'Ministry name'],
      ['Tags', 'North Coast, Investment'],
      ['Significance', 'Regional significance'],
      ['Notes', 'Historical notes'],
    ]) {
      expect(section.getByText(label).nextElementSibling).toHaveTextContent(
        value
      );
    }
    expect(section.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('shows placeholders for missing values and hides Notes without permission', () => {
    render(<LegacyActivityDetails activity={activity} />);

    const overview = screen.getByRole('heading', {
      name: 'Overview',
    }).parentElement;
    expect(overview).not.toBeNull();
    const section = within(overview!);
    for (const label of [
      'Category',
      'Confidential',
      'Issue',
      'Tags',
      'Significance',
    ]) {
      expect(section.getByText(label).nextElementSibling).toHaveTextContent(
        '-'
      );
    }
    expect(section.queryByText('Notes')).not.toBeInTheDocument();
  });

  it('shows Location inside the Event section', () => {
    render(
      <LegacyActivityDetails
        activity={{
          ...activity,
          event: {
            premierStatus: 'Requested',
            governmentRepresentatives: ['Minister One', 'Minister Two'],
            eventPlanners: ['Planner One'],
            venueCity: 'Community Hall, Prince Rupert',
          },
        }}
      />
    );

    const eventSection = screen.getByRole('heading', {
      name: 'Event',
    }).parentElement;
    expect(eventSection).not.toBeNull();
    expect(
      within(eventSection!).getByRole('heading', { name: 'Location' })
    ).toBeVisible();
    const event = within(eventSection!);
    expect(
      event.getByText('Premier Status').nextElementSibling
    ).toHaveTextContent('Requested');
    expect(
      event.getByText('Government Representatives').nextElementSibling
    ).toHaveTextContent('Minister One, Minister Two');
    expect(
      event.getByText('Event Planners').nextElementSibling
    ).toHaveTextContent('Planner One');
    expect(
      event.getByText('Venue and City').nextElementSibling
    ).toHaveTextContent('Community Hall, Prince Rupert');
    expect(event.queryByText('Activity ID')).not.toBeInTheDocument();
    expect(event.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('shows placeholders for missing Event information', () => {
    render(<LegacyActivityDetails activity={activity} />);

    for (const label of [
      'Premier Status',
      'Government Representatives',
      'Event Planners',
      'Venue and City',
    ]) {
      expect(screen.getByText(label).nextElementSibling).toHaveTextContent('-');
    }
  });

  it('shows the creation timestamp instead of the import timestamp', () => {
    render(<LegacyActivityDetails activity={activity} />);

    expect(screen.getByText('Created At').nextElementSibling).toHaveTextContent(
      'Jan 15, 2025 at 1:00 pm PCT'
    );
    expect(screen.queryByText('Imported At')).not.toBeInTheDocument();
  });

  it('shows a placeholder when the original creation timestamp is unknown', () => {
    render(
      <LegacyActivityDetails
        activity={{ ...activity, createdDateTime: null }}
      />
    );

    expect(screen.getByText('Created At').nextElementSibling).toHaveTextContent(
      '-'
    );
    expect(screen.queryByText('Imported At')).not.toBeInTheDocument();
  });
});
