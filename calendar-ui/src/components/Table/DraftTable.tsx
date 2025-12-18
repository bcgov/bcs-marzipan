import { ColumnDef } from '@tanstack/react-table';
import { GenericDataTable } from './GenericDataTable';

export interface DraftEntry {
  id: string;
  title: string;
  author: string;
  updatedOn: string;
}

const draftColumns: ColumnDef<DraftEntry>[] = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'author', header: 'Author' },
  { accessorKey: 'updatedOn', header: 'Last Updated' },
];

export const DraftTable = ({ entries }: { entries: DraftEntry[] }) => (
  <GenericDataTable data={entries} columns={draftColumns} />
);
