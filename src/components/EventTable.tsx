import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHeaderCell,
  Badge,
} from "@fluentui/react-components";
import { CheckmarkCircle24Regular } from "@fluentui/react-icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";

// Dummy data interface
type EventRow = {
  date: string;
  id: string;
  title: string;
  category: string;
  type: string;
  status: "New" | "Reviewed" | "Changed" | "Deleted";
  confirmed: boolean;
};

// Dummy table data
const eventData: EventRow[] = [
  {
    date: "Jan 21 – Mar 29",
    id: "PSFS-113714",
    title: "$6M to increase Indigenous learners...",
    category: "Release",
    type: "News Release",
    status: "New",
    confirmed: false,
  },
  {
    date: "Feb 4 – Mar 27",
    id: "TACS-116305",
    title: "Royal BC Museum Phase 2 Conversations",
    category: "Issue",
    type: "Issue",
    status: "Reviewed",
    confirmed: true,
  },
  {
    date: "Feb 29 – Apr 8",
    id: "MOTI-112502",
    title: "Pattullo Bridge Project milestone",
    category: "Release",
    type: "News Release",
    status: "Changed",
    confirmed: true,
  },
  {
    date: "Mar 1 – Mar 31",
    id: "HLTH-116081",
    title: "Pharmacy Appreciation Month",
    category: "Event",
    type: "Awareness Date",
    status: "Reviewed",
    confirmed: true,
  },
];

// Status colors map
const statusColor: Record<string, "brand" | "danger" | "warning" | "success"> = {
  New: "success",
  Reviewed: "brand",
  Changed: "warning",
  Deleted: "danger",
};

export const EventTable = () => {
  const columns = useMemo<ColumnDef<EventRow>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: info => info.getValue(),
      },
      {
        accessorKey: "id",
        header: "Activity ID",
        cell: info => info.getValue(),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: info => info.getValue(),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: info => info.getValue(),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: info => info.getValue(),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: info => (
          <Badge appearance="tint" color={statusColor[info.getValue() as keyof typeof statusColor]} shape="rounded">
            {info.getValue()}
          </Badge>
        ),
      },
      {
        accessorKey: "confirmed",
        header: "Confirmed",
        cell: info => (info.getValue() ? <CheckmarkCircle24Regular /> : null),
      },
    ],
    []
  );

  const table = useReactTable({
    data: eventData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div style={{ padding: "24px", background: "#fff", borderRadius: 8 }}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHeaderCell key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHeaderCell>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
// This component renders a table of events with columns for date, ID, title, category, type, status, and confirmation status.
// It uses Fluent UI components for styling and TanStack Table for data management.