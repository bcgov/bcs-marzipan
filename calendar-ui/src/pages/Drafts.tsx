import * as React from 'react';
import { DraftTable, DraftEntry } from '../components/Table/DraftTable';

const dummyDrafts: DraftEntry[] = [
  {
    id: 'draft-1',
    title: 'Press release: Health Awareness Week',
    author: 'Alice Johnson',
    updatedOn: '2025-08-20',
  },
  {
    id: 'draft-2',
    title: 'Policy update: Education Reform',
    author: 'Bob Smith',
    updatedOn: '2025-08-18',
  },
  {
    id: 'draft-3',
    title: 'Internal memo: Annual Budget Planning',
    author: 'Charlie Davis',
    updatedOn: '2025-08-15',
  },
];

export default function DraftsPage() {
  return <DraftTable entries={dummyDrafts} />;
}
