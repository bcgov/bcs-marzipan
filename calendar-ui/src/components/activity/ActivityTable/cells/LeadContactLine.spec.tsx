import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ActivityTableRow } from '../activityTableRow';
import { LeadContactLine } from './LeadContactLine';

function row(partial: Partial<ActivityTableRow>): ActivityTableRow {
  return {
    id: 1,
    displayId: 'A-1',
    title: 'Test',
    activityCategories: [],
    categoryIds: [],
    pitchDate: null,
    pitchRequiredStatus: null,
    isConfidential: false,
    isIssue: false,
    summary: '',
    executiveSummary: '',
    tags: [],
    lookAheadStatus: null,
    lookAheadSection: null,
    allDay: false,
    startDate: null,
    endDate: null,
    dateStatus: '',
    startTime: null,
    endTime: null,
    timeStatus: '',
    venue: null,
    premierRequested: null,
    activityRepresentatives: [],
    leadOrg: null,
    leadMinistry: null,
    leadMinistryAbbreviation: null,
    leadTeamDisplayName: 'HLTH Comms',
    commsLeadName: 'Jane Smith',
    commsContactName: 'Jane Smith',
    eventPlanners: [],
    eventPlannerLeadIds: [],
    leadTeamId: null,
    leadMinistryId: null,
    leadOrgId: null,
    commsContactLeadUserId: null,
    translationsRequired: [],
    translationsRequiredStatus: null,
    translationsRequiredStatusId: null,
    commsMaterials: [],
    activityStatus: 'Draft',
    activityStatusId: 1,
    lastUpdatedDateTime: '',
    lastUpdatedBy: 1,
    createdDateTime: '',
    editLock: null,
    sharedWith: [],
    sharedWithTeamIds: [],
    visibility: null,
    flags: [],
    ...partial,
  };
}

describe('LeadContactLine', () => {
  it('renders the comms contact name without team or overflow counts', () => {
    render(
      <LeadContactLine
        row={row({
          commsContactName: 'Jane Smith',
          leadTeamDisplayName: 'HLTH Comms',
        })}
      />
    );

    expect(screen.getByText('Jane Smith')).toBeTruthy();
    expect(screen.queryByText('HLTH Comms')).toBeNull();
    expect(screen.queryByText(/^\+/)).toBeNull();
    expect(screen.queryByText(/Lead:/)).toBeNull();
  });

  it('returns null when no comms contact name is available', () => {
    const { container } = render(
      <LeadContactLine
        row={row({ commsContactName: null, commsLeadName: null })}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
