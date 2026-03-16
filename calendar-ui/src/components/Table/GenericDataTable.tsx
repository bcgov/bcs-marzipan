import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';

import { SortIndicator } from '@/components/Table/SortIndicator';
import {
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/Table/tableConstants';
import { cn } from '@/lib/utils';

interface GenericDataTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  getRowId?: (row: T) => string;
}

export function GenericDataTable<T extends object>({
  data,
  columns,
  getRowId,
}: GenericDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getRowId:
      getRowId ?? ((row, idx) => (row as { id?: string }).id ?? String(idx)),
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const activeSort = sorting[0];
  const sortKey = activeSort?.id ?? null;
  const sortDirection = activeSort?.desc ? 'desc' : 'asc';

  return (
    <table className={tableTable}>
      <thead className={tableThead}>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort();
              return (
                <th
                  key={header.id}
                  className={cn(
                    tableTh,
                    canSort && 'cursor-pointer select-none'
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="inline-flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    <SortIndicator
                      columnId={header.column.id}
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      className="size-4 shrink-0"
                    />
                  </span>
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className={tableBodyRow}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className={tableTd}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
