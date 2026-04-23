import type { RowData } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface TableMeta<_TData extends RowData> {
    userMap: Map<string, { name: string; jobTitle?: string | null }>;
    handleHeaderSort: (columnSortKeyOrKeys: string | string[]) => void;
  }

  interface ColumnMeta<_TData extends RowData, _TValue> {
    sortKey?: string;
    sortKeys?: string[];
  }
}
