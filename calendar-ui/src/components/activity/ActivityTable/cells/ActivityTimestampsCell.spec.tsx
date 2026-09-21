import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ActivityTableRow } from '../activityTableRow';
import { ActivityTimestampsCell } from './ActivityTimestampsCell';

const baseRow: ActivityTableRow = {
  id: 1,
  displayId: null,
  title: '',
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
  leadTeamDisplayName: null,
  commsLeadName: null,
  commsLeadPhone: null,
  commsContactsCount: 0,
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
  activityStatus: '',
  activityStatusId: 0,
  lastUpdatedDateTime: '2026-01-01T12:00:00.000Z',
  lastUpdatedBy: 1,
  createdDateTime: '2025-12-01T12:00:00.000Z',
  editLock: null,
  flags: [],
  sharedWith: [],
  sharedWithTeamIds: [],
  visibility: null,
};

describe('ActivityTimestampsCell', () => {
  it('shows who is editing when editLock is set', () => {
    const userMap = new Map([['99', { name: 'Alex Editor', jobTitle: null }]]);
    render(
      <ActivityTimestampsCell
        row={{
          ...baseRow,
          editLock: { userId: 99, username: 'alex' },
        }}
        userMap={userMap}
      />
    );
    expect(screen.getByText(/Alex Editor is editing/)).toBeInTheDocument();
  });

  it('omits editing line when editLock is null', () => {
    render(<ActivityTimestampsCell row={baseRow} userMap={new Map()} />);
    expect(screen.queryByText(/is editing/)).not.toBeInTheDocument();
  });
});
