import {
  FluentProvider,
  webLightTheme,
  Title1,
} from '@fluentui/react-components';
import { PitchTable, PitchEntry } from '../components/Table/PitchTable';
import { PaginationFooter } from '../components/PaginationFooter';
import { EventTable } from '../components/EventTable';

import * as React from 'react';
import { ColumnFiltersState } from '@tanstack/react-table';

const dummyPitches: PitchEntry[] = [
  {
    id: 'pitch-1',
    // urgency: null,
    author: 'Alice Johnson',
    title: 'Health Policy Update',
    updatedOn: '2025-08-20',
    topic: 'Healthcare',
    eventTags: ['Press Briefing', 'Policy'],
    dateRange: '2025-09-01 – 2025-09-02',
    location: 'Ministry HQ',
    ministry: ['Minister A', 'Minister B'],
    status: 'Pending',
    submittedAgo: '2 days ago',
    submittedBy: 'Bob Smith',
  },
  {
    id: 'pitch-2',
    // urgency: "Normal",
    author: 'Charlie Davis',
    title: 'Education Reform',
    updatedOn: '2025-08-18',
    topic: 'Education',
    eventTags: ['Internal', 'Report'],
    dateRange: '2025-09-05 – 2025-09-06',
    location: 'Parliament',
    ministry: ['Minister C'],
    status: 'Reviewed',
    submittedAgo: '4 days ago',
    submittedBy: 'Diana Prince',
  },
];

export default function PitchSubmissionsPage() {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState<string>('');

  return (
    <FluentProvider theme={webLightTheme}>
      <div style={{ padding: '1.5rem' }}>
        <Title1>Pitch submissions</Title1>
        <EventTable filters={columnFilters} globalFilterString={globalFilter} />
        <PaginationFooter />
      </div>
    </FluentProvider>
  );
}
