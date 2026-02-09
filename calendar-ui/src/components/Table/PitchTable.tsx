import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { GenericDataTable } from './GenericDataTable';

// Pitch entry schema
export interface PitchEntry {
  id: string;
  //   urgency: string | null;
  author: string;
  title: string;
  updatedOn: string;
  topic: string;
  eventTags: string[];
  dateRange: string;
  location: string;
  ministry: string[];
  status: string;
  submittedAgo: string;
  submittedBy: string;
}

// Define table columns
const pitchColumns: ColumnDef<PitchEntry>[] = [
  {
    accessorKey: 'urgency',
    header: 'Urgency',
    cell: (info) => (
      <span
        style={{
          padding: '4px 8px',
          borderRadius: '12px',
          fontWeight: 600,
          color: info.getValue() === 'URGENT' ? 'white' : 'black',
          backgroundColor: info.getValue() === 'URGENT' ? 'red' : '#eee',
        }}
      >
        {info.getValue() as string}
      </span>
    ),
  },
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'author', header: 'Author' },
  { accessorKey: 'topic', header: 'Topic' },
  {
    accessorKey: 'eventTags',
    header: 'Tags',
    cell: (info) => {
      const tags = info.getValue() as string[];
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {tags.map((tag, i) => (
            <span
              key={i}
              style={{
                background: '#f3f2f1',
                borderRadius: '8px',
                padding: '2px 6px',
                fontSize: '12px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      );
    },
  },
  { accessorKey: 'dateRange', header: 'Date Range' },
  { accessorKey: 'location', header: 'Location' },
  {
    accessorKey: 'ministers',
    header: 'Ministers',
    cell: (info) => (info.getValue() as string[]).join(', '),
  },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'submittedAgo', header: 'Submitted' },
  { accessorKey: 'submittedBy', header: 'Submitted By' },
  { accessorKey: 'updatedOn', header: 'Last Updated' },
];

// Table component
export const PitchTable = ({ entries }: { entries: PitchEntry[] }) => {
  return <GenericDataTable data={entries} columns={pitchColumns} />;
};
